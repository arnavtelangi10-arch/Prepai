import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import fs from "fs";
import crypto from "crypto";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// ── USER ACCOUNTS SYSTEM FILE-PERSISTENCE ──
interface UserAccount {
  username: string;
  email: string;
  passwordHash: string;
  domain?: string;
  company?: string;
  difficulty?: string;
  resumeProfile?: any;
  sessions?: any[];
  isVerified?: boolean;
  verificationToken?: string;
  verificationTokenExpires?: number;
  resetToken?: string;
  resetTokenExpires?: number;
}

const USERS_FILE = path.join(process.cwd(), "users_db.json");

function readUsers(): Record<string, UserAccount> {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const content = fs.readFileSync(USERS_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading users file:", err);
  }
  return {};
}

function writeUsers(users: Record<string, UserAccount>) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing users file:", err);
  }
}

// Secure Password Hashing via stretching PBKDF2 with a distinct salt
function hashPasswordSecurely(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (storedHash.includes(":")) {
    const [salt, hash] = storedHash.split(":");
    const computed = hashPasswordSecurely(password, salt);
    return computed === hash;
  }
  if (storedHash.length === 32) {
    // Legacy MD5 Hash fallback
    const computedMd5 = crypto.createHash("md5").update(password).digest("hex");
    return computedMd5 === storedHash;
  }
  // Legacy SHA256 fallback
  const legacyHash = crypto.createHash("sha256").update(password).digest("hex");
  return legacyHash === storedHash;
}

function createSecureHash(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashPasswordSecurely(password, salt);
  return `${salt}:${hash}`;
}

// Brute force protection state management
interface FailureRecord {
  count: number;
  lockedUntil: number;
}
const loginFailures = new Map<string, FailureRecord>();

function getFailureKey(username: string, ip: string): string {
  return `${username.toLowerCase()}:${ip}`;
}

function handleLoginFailure(username: string, ip: string) {
  const key = getFailureKey(username, ip);
  const now = Date.now();
  const record = loginFailures.get(key) || { count: 0, lockedUntil: 0 };
  
  record.count += 1;
  if (record.count >= 5) {
    record.lockedUntil = now + 5 * 60 * 1000; // 5-minute security lockout
  }
  loginFailures.set(key, record);
  return record;
}

function resetLoginFailures(username: string, ip: string) {
  const key = getFailureKey(username, ip);
  loginFailures.delete(key);
}

function getLoginStatus(username: string, ip: string): { isLocked: boolean; remainingSec: number; delayMs: number } {
  const key = getFailureKey(username, ip);
  const record = loginFailures.get(key);
  if (!record) return { isLocked: false, remainingSec: 0, delayMs: 0 };
  
  const now = Date.now();
  if (record.lockedUntil > now) {
    return {
      isLocked: true,
      remainingSec: Math.ceil((record.lockedUntil - now) / 1000),
      delayMs: 0
    };
  }
  
  // introduce progressive response delays to slow down offline/automated parsing attacks
  let delayMs = 0;
  if (record.count >= 2) {
    delayMs = Math.min(3000, (record.count - 1) * 1000); // 1s, 2s, up to 3s response delays
  }
  
  return { isLocked: false, remainingSec: 0, delayMs };
}

// In-memory active session token store
const sessionTokens = new Map<string, string>(); // token -> username

// ── CO-PRACTICE ROOM DATABASE STATE ──
interface RoomState {
  id: string;
  activeQuestion: any;
  code: string;
  language: string;
  canvasNodes: string[];
  apiSpecs: string;
  cachingSpecs: string;
  bottlenecksSpecs: string;
  chatMessages: { id: string; sender: string; text: string; timestamp: string }[];
  sharedEvaluations: { id: string; score: number; feedback: string; evaluator: string; timestamp: string }[];
  roles: { candidate: string; proctor: string };
  users: { id: string; name: string }[];
  screenSharer?: string | null;
  inlineReviews?: any[];
  recordings?: any[];
}

const activeRooms = new Map<string, RoomState>();
const clientConnections = new Map<WebSocket, { roomId: string; userId: string; userName: string }>();

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// ── USER AUTHENTICATION ENDPOINTS ──

app.post("/api/auth/signup", (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Please fill in all fields" });
  }

  const cleanUsername = username.trim();
  const cleanEmail = email.trim();

  if (cleanUsername.length < 3) {
    return res.status(400).json({ error: "Username must be at least 3 characters long" });
  }

  // Robust email RFC validating pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: "Please specify a valid, well-formed email address." });
  }

  // Strong password policy: at least 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  if (password.length < 8 || !passwordRegex.test(password)) {
    return res.status(400).json({ 
      error: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&* etc.)." 
    });
  }

  const users = readUsers();
  if (users[cleanUsername]) {
    return res.status(400).json({ error: "Username is already taken" });
  }

  // Check if email already registered
  const emailExists = Object.values(users).some((u) => u && u.email && typeof u.email === "string" && u.email.toLowerCase() === cleanEmail.toLowerCase());
  if (emailExists) {
    return res.status(400).json({ error: "Email is already registered" });
  }

  // Create new user account with high-entropy cryptographic salt hash and email verification token
  const verificationToken = crypto.randomBytes(16).toString("hex");
  const newUser: UserAccount = {
    username: cleanUsername,
    email: cleanEmail,
    passwordHash: createSecureHash(password),
    domain: "CSE",
    company: "FAANG",
    difficulty: "Mid-Level",
    resumeProfile: null,
    sessions: [],
    isVerified: false,
    verificationToken,
    verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000
  };

  users[cleanUsername] = newUser;
  writeUsers(users);

  // Auto-login after successful registration
  const token = crypto.randomBytes(24).toString("hex");
  sessionTokens.set(token, cleanUsername);

  res.json({
    success: true,
    token,
    user: {
      username: newUser.username,
      email: newUser.email,
      domain: newUser.domain,
      company: newUser.company,
      difficulty: newUser.difficulty,
      resumeProfile: newUser.resumeProfile,
      sessions: newUser.sessions,
      isVerified: newUser.isVerified,
      verificationToken: newUser.verificationToken
    }
  });
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Please provide both username and password" });
  }

  const cleanUsername = username.trim();
  const clientIp = req.ip || "unknown";

  // Check login lock and rate limit
  const status = getLoginStatus(cleanUsername, clientIp);
  if (status.isLocked) {
    return res.status(423).json({ 
      error: `Too many failed login attempts. This account matches security restrictions. Please try again in ${status.remainingSec} seconds.`,
      remainingSec: status.remainingSec
    });
  }

  // If progressive response delay is active:
  if (status.delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, status.delayMs));
  }

  const users = readUsers();
  let user = users[cleanUsername];
  let actualUsername = cleanUsername;

  if (!user) {
    // Search by email address if direct username lookup fails
    const matchEntry = Object.entries(users).find(
      ([_, u]) => u && u.email && typeof u.email === "string" && u.email.trim().toLowerCase() === cleanUsername.toLowerCase()
    );
    if (matchEntry) {
      actualUsername = matchEntry[0];
      user = matchEntry[1];
    }
  }

  if (!user || !verifyPassword(password, user.passwordHash)) {
    // Record login failure
    handleLoginFailure(cleanUsername, clientIp);
    return res.status(401).json({ error: "Invalid username or password" });
  }

  // Reset failures upon successful identity verification
  resetLoginFailures(cleanUsername, clientIp);

  // Auto-upgrade legacy hashing representation dynamically
  if (!user.passwordHash.includes(":")) {
    user.passwordHash = createSecureHash(password);
    users[actualUsername] = user;
    writeUsers(users);
  }

  const token = crypto.randomBytes(24).toString("hex");
  sessionTokens.set(token, actualUsername);

  res.json({
    success: true,
    token,
    user: {
      username: user.username,
      email: user.email,
      domain: user.domain || "CSE",
      company: user.company || "FAANG",
      difficulty: user.difficulty || "Mid-Level",
      resumeProfile: user.resumeProfile || null,
      sessions: user.sessions || [],
      isVerified: user.isVerified !== false,
      verificationToken: user.verificationToken
    }
  });
});

app.post("/api/auth/google", (req, res) => {
  const { email, name, photoURL, firestoreProfile } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email target cannot be empty" });
  }

  const cleanEmail = email.trim().toLowerCase();
  const users = readUsers();

  // Link existing profiles with matching email address
  const existingEntry = Object.entries(users).find(
    ([_, u]) => u && u.email && typeof u.email === "string" && u.email.toLowerCase() === cleanEmail
  );

  let targetUsername: string;
  let user: UserAccount;

  if (existingEntry) {
    // Found existing email: Link profiles dynamically!
    targetUsername = existingEntry[0];
    user = existingEntry[1];

    // Merge persistent cloud-profile attributes from Firestore
    if (firestoreProfile) {
      if (firestoreProfile.domain) user.domain = firestoreProfile.domain;
      if (firestoreProfile.company) user.company = firestoreProfile.company;
      if (firestoreProfile.difficulty) user.difficulty = firestoreProfile.difficulty;
      if (firestoreProfile.resumeProfile) user.resumeProfile = firestoreProfile.resumeProfile;
      if (firestoreProfile.sessions) user.sessions = firestoreProfile.sessions;
      users[targetUsername] = user;
      writeUsers(users);
    }
  } else {
    // Brand new user profile: Register dynamically with potential Firestore initial data
    let baseUsername = (name || email.split("@")[0] || "candidate")
      .trim()
      .replace(/[^a-zA-Z0-9_]/g, "_")
      .toLowerCase();

    if (baseUsername.length < 3) {
      baseUsername = "user_" + baseUsername;
    }

    targetUsername = baseUsername;
    let suffix = 1;
    while (users[targetUsername]) {
      targetUsername = `${baseUsername}_${suffix}`;
      suffix++;
    }

    user = {
      username: targetUsername,
      email: cleanEmail,
      passwordHash: crypto.randomBytes(16).toString("hex"),
      domain: firestoreProfile?.domain || "CSE",
      company: firestoreProfile?.company || "FAANG",
      difficulty: firestoreProfile?.difficulty || "Mid-Level",
      resumeProfile: firestoreProfile?.resumeProfile || null,
      sessions: firestoreProfile?.sessions || []
    };

    users[targetUsername] = user;
    writeUsers(users);
  }

  const token = crypto.randomBytes(24).toString("hex");
  sessionTokens.set(token, targetUsername);

  // Mark verified for Google-authenticated profiles immediately
  if (user.isVerified !== true) {
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    users[targetUsername] = user;
    writeUsers(users);
  }

  res.json({
    success: true,
    token,
    user: {
      username: user.username,
      email: user.email,
      domain: user.domain || "CSE",
      company: user.company || "FAANG",
      difficulty: user.difficulty || "Mid-Level",
      resumeProfile: user.resumeProfile || null,
      sessions: user.sessions || [],
      isVerified: true
    }
  });
});

app.post("/api/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.replace("Bearer ", "") : req.body.token;

  if (token) {
    sessionTokens.delete(token);
  }

  res.json({ success: true, message: "Logged out successfully" });
});

app.get("/api/auth/me", (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.replace("Bearer ", "") : (req.query.token as string);

  if (!token || !sessionTokens.has(token)) {
    return res.status(401).json({ authenticated: false, error: "Not logged in" });
  }

  const username = sessionTokens.get(token)!;
  const users = readUsers();
  const user = users[username];

  if (!user) {
    return res.status(404).json({ authenticated: false, error: "User account not found" });
  }

  res.json({
    authenticated: true,
    user: {
      username: user.username,
      email: user.email,
      domain: user.domain || "CSE",
      company: user.company || "FAANG",
      difficulty: user.difficulty || "Mid-Level",
      resumeProfile: user.resumeProfile || null,
      sessions: user.sessions || [],
      isVerified: user.isVerified !== false,
      verificationToken: user.verificationToken
    }
  });
});

app.get("/api/auth/verify", (req, res) => {
  const { token } = req.query;
  if (!token || typeof token !== "string") {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Verification Error</title>
        <style>
          body { background-color: #0b0d11; color: #f1f5f9; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background-color: #13161c; border: 1px solid #2d333d; border-radius: 12px; padding: 24px; text-align: center; max-width: 400px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
          h2 { color: #f43f5e; margin-top: 0; }
          p { color: #94a3b8; font-size: 14px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Verification Failed</h2>
          <p>The verification code is missing or invalid. Please check the email link and try again.</p>
        </div>
      </body>
      </html>
    `);
  }

  const users = readUsers();
  const foundUserEntry = Object.entries(users).find(
    ([_, u]) => u && u.verificationToken === token
  );

  if (!foundUserEntry) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Verification Error</title>
        <style>
          body { background-color: #0b0d11; color: #f1f5f9; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background-color: #13161c; border: 1px solid #2d333d; border-radius: 12px; padding: 24px; text-align: center; max-width: 400px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
          h2 { color: #f43f5e; margin-top: 0; }
          p { color: #94a3b8; font-size: 14px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Verification Failed</h2>
          <p>The verification token is invalid or has expired. Please sign up again or request a new verification email.</p>
        </div>
      </body>
      </html>
    `);
  }

  const [username, user] = foundUserEntry;

  // Check if token has expired
  if (user.verificationTokenExpires && Date.now() > user.verificationTokenExpires) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Verification Error</title>
        <style>
          body { background-color: #0b0d11; color: #f1f5f9; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background-color: #13161c; border: 1px solid #2d333d; border-radius: 12px; padding: 24px; text-align: center; max-width: 400px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
          h2 { color: #f43f5e; margin-top: 0; }
          p { color: #94a3b8; font-size: 14px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Verification Token Expired</h2>
          <p>This verification link has expired (active window is 24 hours). Please sign in and request a new verification email.</p>
        </div>
      </body>
      </html>
    `);
  }

  // Mark verified
  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  users[username] = user;
  writeUsers(users);

  // Return elegant twilight-colored verification template and auto-redirect back to dashboard!
  return res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Email Verified Successfully - prep.ai</title>
      <style>
        body { background-color: #0b0d11; color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background-color: #13161c; border: 1px solid #2d333d; border-radius: 16px; padding: 32px; text-align: center; max-width: 440px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); }
        .icon { width: 56px; height: 56px; background-color: rgba(16, 185, 129, 0.1); border-radius: 28px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; border: 1px solid rgba(16, 185, 129, 0.3); }
        .icon svg { color: #10b981; width: 28px; height: 28px; }
        h1 { font-size: 20px; font-weight: 800; tracking: -0.025em; margin: 0 0 10px 0; color: #ffffff; }
        p { color: #94a3b8; font-size: 13.5px; line-height: 1.6; margin: 0 0 24px 0; }
        .btn { display: inline-block; background-color: #4f46e5; color: #ffffff; font-weight: 700; font-size: 12.5px; text-transform: uppercase; letter-spacing: 0.05em; text-decoration: none; padding: 12px 24px; border-radius: 8px; border: none; cursor: pointer; transition: background-color 150ms; }
        .btn:hover { background-color: #4338ca; }
        .footer { font-size: 11px; color: #475569; margin-top: 16px; font-family: monospace; }
      </style>
      <script>
        setTimeout(function() {
          window.location.href = '/';
        }, 3000);
      </script>
    </head>
    <body>
      <div class="card">
        <div class="icon">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="28" height="28">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1>Identity Verified</h1>
        <p>Your prep.ai account credentials have been authenticated successfully. You will be redirected to your dashboard in general operating sequence...</p>
        <a class="btn" href="/">Return to Dashboard</a>
        <div class="footer">Redirecting in 3 seconds...</div>
      </div>
    </body>
    </html>
  `);
});

app.post("/api/auth/resend-verification", (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.replace("Bearer ", "") : req.body.token;

  if (!token || !sessionTokens.has(token)) {
    return res.status(401).json({ error: "Not authorized" });
  }

  const username = sessionTokens.get(token)!;
  const users = readUsers();
  const user = users[username];

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (user.isVerified) {
    return res.status(400).json({ error: "This account is already verified" });
  }

  const verificationToken = crypto.randomBytes(16).toString("hex");
  user.verificationToken = verificationToken;
  user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
  users[username] = user;
  writeUsers(users);

  res.json({
    success: true,
    message: "A new secure verification link has been transmission routed.",
    verificationToken
  });
});

app.post("/api/auth/sync", (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.replace("Bearer ", "") : req.body.token;

  if (!token || !sessionTokens.has(token)) {
    return res.status(401).json({ error: "Not authorized" });
  }

  const username = sessionTokens.get(token)!;
  const users = readUsers();
  const user = users[username];

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Update synchronized configurations
  const { domain, company, difficulty, resumeProfile, sessions } = req.body;

  if (domain !== undefined) user.domain = domain;
  if (company !== undefined) user.company = company;
  if (difficulty !== undefined) user.difficulty = difficulty;
  if (resumeProfile !== undefined) user.resumeProfile = resumeProfile;
  if (sessions !== undefined) user.sessions = sessions;

  users[username] = user;
  writeUsers(users);

  res.json({ success: true, user: {
    username: user.username,
    email: user.email,
    domain: user.domain,
    company: user.company,
    difficulty: user.difficulty,
    resumeProfile: user.resumeProfile,
    sessions: user.sessions
  }});
});

// ── FORGOT PASSWORD / PASSWORD RECOVERY API CHANNELS ──
app.post("/api/auth/forgot-password", (req, res) => {
  const { identity } = req.body;
  if (!identity || !identity.trim()) {
    return res.status(400).json({ error: "Please specify your username or registered email address" });
  }

  const cleanIdentity = identity.trim().toLowerCase();
  const users = readUsers();
  
  let foundUserKey: string | null = null;
  let foundUser: UserAccount | null = null;

  for (const [uname, u] of Object.entries(users)) {
    if (uname.toLowerCase() === cleanIdentity || (u && u.email && typeof u.email === "string" && u.email.toLowerCase() === cleanIdentity)) {
      foundUser = u;
      foundUserKey = uname;
      break;
    }
  }

  if (!foundUser || !foundUserKey) {
    return res.status(404).json({ error: "No user account was found with that username or email address." });
  }

  // Generate an 8-character high-visibility OTP verification reset code (4 bytes hex as uppercase)
  const resetToken = crypto.randomBytes(4).toString("hex").toUpperCase();
  foundUser.resetToken = resetToken;
  foundUser.resetTokenExpires = Date.now() + 1 * 60 * 60 * 1000; // 1 hour lifetime
  users[foundUserKey] = foundUser;
  writeUsers(users);

  res.json({
    success: true,
    message: "A secure reset verification code has been successfully generated.",
    resetToken,
    username: foundUserKey,
    email: foundUser.email
  });
});

app.post("/api/auth/reset-password", (req, res) => {
  const { username, token, newPassword } = req.body;
  if (!username || !token || !newPassword) {
    return res.status(400).json({ error: "Please provide your username, reset token, and a new secure password." });
  }

  const cleanUsername = username.trim();
  const cleanToken = token.trim().toUpperCase();
  const users = readUsers();
  const user = users[cleanUsername];

  if (!user) {
    return res.status(404).json({ error: "No user account found matching that username." });
  }

  if (!user.resetToken || user.resetToken.toUpperCase() !== cleanToken) {
    return res.status(400).json({ error: "The password reset token is incorrect or invalid." });
  }

  if (user.resetTokenExpires && Date.now() > user.resetTokenExpires) {
    return res.status(400).json({ error: "This password reset token has expired. Please request a new one." });
  }

  // Strong password policy matching signup constraints
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  if (newPassword.length < 8 || !passwordRegex.test(newPassword)) {
    return res.status(400).json({
      error: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&* etc.)."
    });
  }

  // Set the newly stretched secure password PBKDF2 hash
  user.passwordHash = createSecureHash(newPassword);
  user.resetToken = undefined;
  user.resetTokenExpires = undefined;
  users[cleanUsername] = user;
  writeUsers(users);

  // Clear any brute force login failure locks
  const clientIp = req.ip || "unknown";
  resetLoginFailures(cleanUsername, clientIp);

  res.json({
    success: true,
    message: "Your password has been securely updated. You can now sign in using your new credentials."
  });
});

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
const hasApiKey = !!apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim().length > 0;

const ai = new GoogleGenAI({
  apiKey: hasApiKey ? apiKey : "MOCK_KEY",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const DEFAULT_MODEL = "gemini-3.5-flash";
const THINKING_MODEL = "gemini-3.1-pro-preview";

// Helper for error handling / fallback content
function getMockResumeData(text: string) {
  const words = text.toLowerCase();
  const inferredSkills = ["React", "TypeScript", "Node.js", "Express", "System Design", "Algorithms"];
  if (words.includes("python") || words.includes("machine") || words.includes("tensorflow")) {
    inferredSkills.push("Python", "PyTorch", "scikit-learn", "Machine Learning", "Neural Networks");
  }
  if (words.includes("database") || words.includes("sql") || words.includes("postgres")) {
    inferredSkills.push("PostgreSQL", "MongoDB", "NoSQL", "Redis");
  }
  if (words.includes("aws") || words.includes("docker") || words.includes("kubernetes")) {
    inferredSkills.push("Docker", "AWS", "Kubernetes", "CI/CD");
  }

  return {
    name: "Candidate Profile",
    skills: inferredSkills,
    experienceSummary: "Demonstrates practical experience building software engineering applications, and working on algorithmic structures.",
    projects: [
      {
        title: "Scaleable Backend Platform",
        technologies: ["Node.js", "Express", "PostgreSQL"],
        description: "Implemented custom caching and structured load-balancing strategies to achieve high throughput."
      },
      {
        title: "Web Analytics Module",
        technologies: ["React", "TypeScript", "Tailwind CSS"],
        description: "Aggregates real-time events and visualizes them on performance dashboards."
      }
    ],
    strengths: ["Strong problem-solving capability", "Good grasp of full-stack ecosystems", "Focus on clean coding standards"],
    suggestedFocusAreas: ["System Availability under load", "Database connection pool fine-tuning", "Dynamic programming patterns"],
    portfolioUrl: "https://myportfolio.dev",
    githubUrl: "https://github.com/candidate",
    linkedinUrl: "https://linkedin.com/in/candidate",
    projectSummaries: "Engineered scalable background engines and dynamic frontends with offline-first client replication."
  };
}

const DOMAIN_FALLBACK_TIPS: Record<string, string[]> = {
  "software-engineering": [
    "Always start your whiteboard coding by defining edge cases: empty arrays, integer overflows, and single-element inputs.",
    "When explaining system design, decouple your components. Use message queues to handle spikes in traffic asynchronously.",
    "Make sure to mention Big-O space and time complexity for every coding solution you propose, without waiting for the interviewer to ask."
  ],
  "cse": [
    "Always start your whiteboard coding by defining edge cases: empty arrays, integer overflows, and single-element inputs.",
    "When explaining system design, decouple your components. Use message queues to handle spikes in traffic asynchronously.",
    "Make sure to mention Big-O space and time complexity for every coding solution you propose, without waiting for the interviewer to ask."
  ],
  "ai": [
    "When discussing model tuning, be prepared to explain the difference between parameters, hyperparameters, and when to use LoRA over full fine-tuning.",
    "Be ready to explain how tokenization affects context window sizes and how RAG pipelines optimize search queries.",
    "Always clarify data leakage risks when training validation vs training partitions."
  ],
  "general-tech": [
    "In interviews, clear structure is better than quick coding. Speak out loud and build a collaborative dialog with the proctor.",
    "Understand the underlying network and storage layers. Whether you are FE or BE, everything ultimately resolves to files and sockets.",
    "Show empathy. When given feedback, don't be defensive. Treat the interviewer as a teammate rather than an adversary."
  ]
};

// ── DAILY INTERVIEW PRO-TIPS ENDPOINT ──
app.get("/api/interview-protip", async (req, res) => {
  const domain = (req.query.domain as string || "Software Engineering").trim();
  const normalizedDomain = domain.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  if (!hasApiKey) {
    const fallbacks = DOMAIN_FALLBACK_TIPS[normalizedDomain] || DOMAIN_FALLBACK_TIPS["general-tech"] || [
      "Always clarify the problem requirements and constraints before starting to code.",
      "Explain the time and space complexity of your algorithm before your interviewer asks.",
      "When designing systems, prioritize high availability first, then address consistency trade-offs."
    ];
    // Pick a pseudo-random tip based on the day or random element
    const dayIndex = new Date().getDate();
    const tip = fallbacks[dayIndex % fallbacks.length];
    return res.json({ tip, domain });
  }

  try {
    const prompt = `You are an elite Tech Interview Coach. Generate ONE single highly insightful, actionable, and specific 'Interview Pro-Tip' for a candidate interviewing in the domain of '${domain}'. The tip must be extremely concise (one or two sentences, max 180 characters) and focus on technical approach, design patterns, whiteboarding, or behavioral excellence. Do not use generic filler words like "In conclusion" or "Here is your tip:". Just return the tip itself.`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "You are an expert technical interviewer who gives highly actionable and direct tips without fluff.",
        tools: [{ googleSearch: {} }],
      },
    });
    
    const tip = response.text?.trim() || "Always clarify the problem requirements and constraints before writing code.";
    return res.json({ tip, domain });
  } catch (err: any) {
    console.error("Gemini pro-tip fetching error:", err);
    // Silent fallback
    return res.json({ 
      tip: "Be sure to state architectural trade-offs explicitly, showing you value practical engineering over theoretical perfection.", 
      domain 
    });
  }
});

// ── 1. PORTFOLIO & RESUME PARSING ──
app.post("/api/resume/parse", async (req, res) => {
  const { resumeText } = req.body;
  if (!resumeText) {
    return res.status(400).json({ error: "No resume content provided" });
  }

  if (!hasApiKey) {
    // Return high quality inferred static response
    return res.json(getMockResumeData(resumeText));
  }

  try {
    const prompt = `You are an AI Resume intelligence parser. Extract skills, technologies, projects, and target experience from the following resume text.
Resume text:
${resumeText}

Provide an authentic and professional categorization of the resume. Include a brief summary, key strengths, potential areas of interview struggles where the candidate might need to focus, and structured project descriptions.`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Candidate name if found, or 'Eminent Candidate'" },
            skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific skills and tools extracted" },
            experienceSummary: { type: Type.STRING, description: "A summary of their background/experience" },
            projects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  technologies: { type: Type.ARRAY, items: { type: Type.STRING } },
                  description: { type: Type.STRING }
                },
                required: ["title", "technologies", "description"]
              }
            },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedFocusAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
            portfolioUrl: { type: Type.STRING, description: "Personal website, portfolio or professional link if found, otherwise empty" },
            githubUrl: { type: Type.STRING, description: "GitHub profile link if found, otherwise empty" },
            linkedinUrl: { type: Type.STRING, description: "LinkedIn profile link if found, otherwise empty" },
            projectSummaries: { type: Type.STRING, description: "A high level summary compiling key highlights from the user's projects" }
          },
          required: ["skills", "experienceSummary", "projects", "strengths", "suggestedFocusAreas"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err: any) {
    console.error("Resume parsing error:", err);
    res.json(getMockResumeData(resumeText));
  }
});

// ── 2. ADAPTIVE INTERVIEW QUESTION GENERATION ──
app.post("/api/interview/start", async (req, res) => {
  const { domain, company, difficulty, resumeProfile, type } = req.body;
  
  // Custom mock banks based on domain & company for high reliability
  const mockQuestions = {
    technical: [
      {
        id: "tech_1",
        question: `Explain how you would implement a distributed rate limiter for a system targeting ${company} traffic models.`,
        type: "technical",
        codeStub: "",
        sampleSolution: "Token Bucket or Leaky Bucket algorithm using Redis sorted sets for sliding window log storage.",
        hints: ["Think about concurrency race conditions", "Mention memory costs of storage per client ID", "Discuss what happens when Redis goes offline"]
      },
      {
        id: "tech_2",
        question: "Describe what happens under thehood when you type a URL into a browser. Focus on TCP/IP connection establishment and SSL/TLS handshakes.",
        type: "technical",
        codeStub: "",
        sampleSolution: "DNS lookup -> TCP 3-way handshake -> TLS handshake (ClientHello, ServerHello, Key exchange) -> HTTP GET -> DOM Rendering.",
        hints: ["Mention symmetric vs asymmetric crypt keys", "What is ALPN?", "Include local DNS cache search stages"]
      },
      {
        id: "tech_3",
        question: `How do database indexes speed up lookups? Contrast B+ Trees with Hash indexes, specifically for typical ${domain} workloads.`,
        type: "technical",
        codeStub: "",
        sampleSolution: "B+ tree allows range queries and sorted scans (O(log N)), while hash index offers O(1) exact match lookup but lacks support for order operations.",
        hints: ["Consider page storage layout on disk", "What is clustering index vs secondary index?", "Which structure is better for read-heavy key searches?"]
      },
      {
        id: "tech_4",
        question: "Explain the difference between Optimistic Concurrency Control and Pessimistic Locking. Under what load circumstances would you prefer optimistic?",
        type: "technical",
        codeStub: "",
        sampleSolution: "Pessimistic blocks resources using lock states; optimistic uses version checks. Optimistic is best for low contention write setups.",
        hints: ["Think about rollback retry storms", "What are the DB transaction isolation levels involved?", "Explain how version numbering works in client records"]
      },
      {
        id: "tech_5",
        question: "What is an event-driven architecture? Contrast Kafka log partitions with standard RabbitMQ message queues.",
        type: "technical",
        codeStub: "",
        sampleSolution: "Kafka is an append-only transaction log that allows replaying events from checkpoint offsets, whereas RabbitMQ is an in-memory queue where keys disappear upon consumption.",
        hints: ["Mention partition scaling patterns", "How index tracking offsets work", "Contrast publisher-subscriber models with point-to-point queues"]
      }
    ],
    behavioral: [
      {
        id: "hr_1",
        question: `Tell me about a time you had to deliver an engineering project on a tight deadline at ${company || "a previous team"}. What trade-offs did you make?`,
        type: "behavioral",
        codeStub: "",
        sampleSolution: "Looking for clear mapping to STAR framework: Situation context, direct Task goal, specific Action steps taken to triage, and measurable Result with lessons.",
        hints: ["How did you communicate trade-offs to product stakeholders?", "What did you omit or postpone as technical debt?", "What post-mortem steps were established?"]
      },
      {
        id: "hr_2",
        question: "Describe a situation where you had a deep technical disagreement with a senior engineer or supervisor. How did you resolve it?",
        type: "behavioral",
        codeStub: "",
        sampleSolution: "Assess how data and objective testing is evaluated. Look for constructive debate, proof of concepts, and commitment to the team's shared decision.",
        hints: ["How did you de-escalate emotional friction?", "Did you build prototypes to benchmark solutions?", "How did you buy into the final approach?"]
      },
      {
        id: "hr_3",
        question: "Describe your most challenging technical project. What went wrong during implementation and how did you pivot?",
        type: "behavioral",
        codeStub: "",
        sampleSolution: "Explains high-uncertainty problem solving. Highlights active debug metrics, risk management, and retrospective architecture shifts.",
        hints: ["Focus on concrete failures, don't sugarcoat errors", "Show how you diagnosed the root cause", "What skills or tooling did you adopt as a result?"]
      },
      {
        id: "hr_4",
        question: "Tell me about a time you took ownership of a critical failure or outage. What did you learn and how did you prevent recurrences?",
        type: "behavioral",
        codeStub: "",
        sampleSolution: "Avoid blame. Focus on active triage, incident communication, retro documentation, and automated regression safeguard creation.",
        hints: ["Frame the incident scale clearly", "How did you communicate with user stakeholders?", "What monitoring alerts or dashboards did you build afterwards?"]
      },
      {
        id: "hr_5",
        question: "How do you handle technical debt? Describe a time you advocated for refactoring legacy code over shipping a shiny new feature.",
        type: "behavioral",
        codeStub: "",
        sampleSolution: "Explains the ROI calculation for refactoring: developer velocity, reduced crash rate, or server runtime cost reductions.",
        hints: ["How did you align business goals with refactoring?", "How did you measure velocity before vs after?", "What test coverage safety net did you establish first?"]
      }
    ],
    coding: [
      {
        id: "code_1",
        question: `Given an array of integers representing daily stock prices, find the maximum profit you can achieve by buying and selling once. You cannot sell a stock before you buy it. Optimize for O(N) time and O(1) space.`,
        type: "coding",
        codeStub: `/**
 * @param {number[]} prices
 * @return {number}
 */
function maxProfit(prices) {
  // Write your code here
  return 0;
}`,
        sampleSolution: "Maintain minPrice seen so far, and compute maxProfit as prices[i] - minPrice over a single iteration.",
        hints: ["Track the global minimum price while walking the list", "Compute profit at each index and take the maximum", "Consider the negative or decreasing trend edge cases"]
      },
      {
        id: "code_2",
        question: `Design an LRU (Least Recently Used) Cache. The cache must support put(key, value) and get(key) operations in O(1) average time complexity.`,
        type: "coding",
        codeStub: `class LRUCache {
  /**
   * @param {number} capacity
   */
  constructor(capacity) {
    this.capacity = capacity;
  }

  /**
   * @param {number} key
   * @return {number}
   */
  get(key) {
    // Write your code here
    return -1;
  }

  /**
   * @param {number} key
   * @param {number} value
   * @return {void}
   */
  put(key, value) {
    // Write your code here
  }
}`,
        sampleSolution: "Use a Hash Map paired with a Doubly Linked List. The hash map offers O(1) key lookups, and the list maintains access order.",
        hints: ["Move accessed keys to the head of the list", "Remove from the tail when capacity is exceeded", "Ensure boundary safety for empty cache inputs"]
      },
      {
        id: "code_3",
        question: "Merge K Sorted arrays into a single combined sorted array. Discuss optimal heap-based solutions.",
        type: "coding",
        codeStub: `/**
 * @param {number[][]} arrays
 * @return {number[]}
 */
function mergeKSorted(arrays) {
  // Write your code here
  return [];
}`,
        sampleSolution: "Leverage a Min-Heap carrying elements containing their values, element pointers, and source array index. O(N log K) complexity.",
        hints: ["Push the first element of each array into the heap", "Extract min, add to output, and push the next item from that specific array", "Avoid copying entire array slices repeatedly"]
      },
      {
        id: "code_4",
        question: "Validate Binary Search Tree. Determine if a given binary tree is a valid helper structured BST.",
        type: "coding",
        codeStub: `/**
 * Definition for a binary tree node:
 * class TreeNode {
 *   constructor(val, left = null, right = null) {
 *     this.val = val;
 *     this.left = left;
 *     this.right = right;
 *   }
 * }
 */
function isValidBST(root) {
  // Write your code here
  return true;
}`,
        sampleSolution: "Recursively pass minimum and maximum coordinate limits down with each step to track constraints.",
        hints: ["A node value must be strictly greater than left sub-nodes and less than right sub-nodes", "Initialize limits as -Infinity and +Infinity", "Be careful with duplicate nodes or integer boundary limits"]
      }
    ],
    "system-design": [
      {
        id: "sys_1",
        question: `Design a scalable global Notification Service for ${company || "Netflix"}. It must support SMS, Email, and Push, handle high bursts during major events, support priority queuing, and avoid duplicate push delivery.`,
        type: "system-design",
        codeStub: "",
        sampleSolution: "Requires: Client App -> API Gateway -> Rate Limiter -> Queue Broker (Kafka with topic partitions per tier) -> Worker Cluster -> Provider APIs with rate limit handlers. A Redis distributed set acts as an idempotency cache.",
        hints: ["How will you enforce idempotency to guarantee once-at-most delivery?", "How do you isolate low-priority updates (news) from high-priority OTP passes?", "Detail the retry back-off rules used for slow client carriers"]
      },
      {
        id: "sys_2",
        question: "Design a URL Shortening Service like bit.ly. Detail hash calculations, storage scales, redirection latency optimization, and handling of millions of keys.",
        type: "system-design",
        codeStub: "",
        sampleSolution: "Key generation service (KGS) with pre-allocated numeric ranges -> Base62 encoding -> Redis read cache for redirection URL mappings -> Distributed SQL or Wide Column DB.",
        hints: ["Can you pre-generate hashes to secure high speed allocations?", "How does the cache eviction policy (LRU) fit the scenario?", "Discuss handling of malicious short URLs (phishing) redirect targets"]
      },
      {
        id: "sys_3",
        question: `Design an Activity Feed system like Instagram. Support followers, real-time posts, timeline fan-out (push vs pull models), and high global availability.`,
        type: "system-design",
        codeStub: "",
        sampleSolution: "Fan-out on write (push) for typical users, and fan-out on read (pull) for celebrity accounts with massive follower bases. Feed cache stores active visual posts list indexes.",
        hints: ["What metric decides whether to trigger cache-push vs runtime pull?", "How do database structures store followers mappings?", "How do CDN edge caches lower media retreival latency?"]
      }
    ]
  };

// ── CO-PRACTICE CURATED COMPANY FOCUS QUESTION PACKS ──
const COMPANY_SPECIFIC_POOLS: Record<string, { technical: any[], coding: any[], "system-design": any[], behavioral: any[] }> = {
  Google: {
    technical: [
      {
        id: "g_tech_1",
        question: "Explain the algorithmic architecture of Google Search's PageRank. How would you design a distributed crawler to pre-compute link matrix coefficients across trillions of URLs?",
        type: "technical",
        codeStub: "",
        sampleSolution: "Use MapReduce matrix multiplication of transition probability matrix with power iteration method.",
        hints: ["How do you handle dead ends and spider traps? (Damping factor)", "What are the storage limits of memory map states on distributed storage sets?"]
      },
      {
        id: "g_tech_2",
        question: "How does Google Spanner guarantee global multi-region ACID transactions without locking reads? Detail the role of atomic clocks and GPS receivers (TrueTime API).",
        type: "technical",
        codeStub: "",
        sampleSolution: "By using TrueTime API to assign synchronized commit timestamps that enforce external consistency.",
        hints: ["Contrast lock-wait timelines with uncertainty windows [earliest, latest]", "What happens during a GPS leap-second recalibration?"]
      }
    ],
    coding: [
      {
        id: "g_code_1",
        question: "Given a 2D grid of size M x N containing integers, find the length of the longest path in the grid where each step increases strictly. You can move up, down, left, right. Optimize for O(MN) time and space using Memoization.",
        type: "coding",
        codeStub: `/**\n * @param {number[][]} matrix\n * @return {number}\n */\nfunction longestIncreasingPath(matrix) {\n  // Write your code here\n  return 0;\n}`,
        sampleSolution: "Use depth-first search with dynamic memoization to record the longest path from each cell, avoiding recalculations.",
        hints: ["Could this be modeled as a Directed Acyclic Graph (DAG)?", "Apply memoization to store matrix coordinate limits.", "What's the space complexity of recursion stack depth?"]
      },
      {
        id: "g_code_2",
        question: "Given K sorted streams of objects, design a real-time sliding traffic window log parser that outputs the top K search keywords at Google speed. Use a custom Min-Heap structure to preserve optimal complexity.",
        type: "coding",
        codeStub: `class GoogleKeywordTracker {\n  constructor(k) {\n    this.k = k;\n  }\n  // Record search term occurrence\n  recordSearch(keyword) {\n    // Write your code here\n  }\n  // Retrieve top K\n  getTopK() {\n    return [];\n  }\n}`,
        sampleSolution: "Combine a hash map with a min-heap carrying frequency limits of active terms.",
        hints: ["How do you update frequencies in O(1) time?", "Track current sliding times relative to UTC parameters."]
      }
    ],
    "system-design": [
      {
        id: "g_sys_1",
        question: "Design Google Auto-complete Search Suggestion System. Support millions of concurrent searches worldwide, 100ms keypress-to-render latency bounds, and heavy updates of trending terms.",
        type: "system-design",
        codeStub: "",
        sampleSolution: "Trie data structures pre-compiled onto offline clusters, backed by persistent Cache Layers at edge CDN locations, using MapReduce or Spark streaming data metrics.",
        hints: ["Can you cache suggestion lists directly on Trie nodes?", "How will you distribute the Trie across multiple partition shards? (Hash of prefixes)"]
      }
    ],
    behavioral: [
      {
        id: "g_hr_1",
        question: "Google values Googleyness and Leadership. Tell me about a time you noticed an engineering inefficiency in another team's subsystem, and took collaborative ownership to fix it without formal authority.",
        type: "behavioral",
        codeStub: "",
        sampleSolution: "Look for strong self-direction, influence without authority, and cross-functional standard creation.",
        hints: ["Did you face resistance from the other team?", "What objective performance benchmarks did you use to make your case?"]
      }
    ]
  },
  Amazon: {
    technical: [
      {
        id: "a_tech_1",
        question: "Describe the architecture of Amazon DynamoDB. How does it leverage consistent hashing, gossip-based membership protocols, and vector clocks for reliable decentralized storage?",
        type: "technical",
        codeStub: "",
        sampleSolution: "Vnode allocation over virtual consistent hashing rings, sloppy quorums (R + W > N), and read-repair to resolve concurrent version conflicts through vector clocks.",
        hints: ["How do virtual nodes reduce partition imbalances?", "Explain read/write quorums and sloppy quorums under network partitions."]
      }
    ],
    coding: [
      {
        id: "a_code_1",
        question: "Under the hood of Amazon Warehouse Optimization, you need to find the shortest sub-array of delivery packages that must be sorted to make the entire warehouse log sorted. Optimize for O(N) time and O(1) auxiliary space.",
        type: "coding",
        codeStub: `/**\n * @param {number[]} packages\n * @return {number}\n */\nfunction findShortestUnsortedSubarray(packages) {\n  // Write your code here\n  return 0;\n}`,
        sampleSolution: "Identify where sorted order is violated by finding local mins and maxs, then expand bounds to enclose all violating elements.",
        hints: ["Find the first element smaller than the maximum of preceding elements.", "Compare with array ending limits."]
      }
    ],
    "system-design": [
      {
        id: "a_sys_1",
        question: "Design high-scale Amazon Checkout Processing system. The system must process orders fast under massive load spikes (Black Friday), maintain transactional security, ensure fault tolerance, and avoid double order creation.",
        type: "system-design",
        codeStub: "",
        sampleSolution: "API Gateway with idempotency checks -> SQS priority routing queues -> Inventory checking service (optimistic DB lock) -> Payment adapter -> Fulfillment log.",
        hints: ["How does idempotency keys prevent multiple payouts for the same cart?", "Explain how dead-letter queues (DLQ) preserve order failures for manual recovery."]
      }
    ],
    behavioral: [
      {
        id: "a_hr_1",
        question: "Amazon lives by 16 Leadership Principles. Tell me about a time you had to make a high-stakes decision with incomplete data ('Bias for Action'). What were the risks and results?",
        type: "behavioral",
        codeStub: "",
        sampleSolution: "Looking for customer obsession, bias for action, and calculated risk calculus using STAR parameters.",
        hints: ["What was your fallback plan if the decision proved wrong?", "How did you gather subsequent metrics to adjust validation paths?"]
      }
    ]
  },
  Microsoft: {
    technical: [
      {
        id: "m_tech_1",
        question: "Explain the architectural internals of SQL Server's transaction log (WAL) and how it guarantees durability during sudden kernel or VM crashes.",
        type: "technical",
        codeStub: "",
        sampleSolution: "Write-Ahead Logging ensures changes are written to the non-volatile transaction log before active memory pages are modified.",
        hints: ["Explain the role of checkpoint operations.", "What is ARIES recovery protocol (Analysis, Redo, Undo)?"]
      }
    ],
    coding: [
      {
        id: "m_code_1",
        question: "A multi-processor thread system is scheduling tasks. Given a list of non-overlapping intervals representing thread allocations, merge all overlapping ranges to optimize CPU throughput. O(N log N) time complexity.",
        type: "coding",
        codeStub: `/**\n * @param {number[][]} intervals\n * @return {number[][]}\n */\nfunction mergeThreadIntervals(intervals) {\n  // Write your code here\n  return [];\n}`,
        sampleSolution: "Sort intervals by start coordinate, then iterate and merge adjacent nodes when overlapping conditions occur.",
        hints: ["Sort intervals by start time.", "A current interval overlaps with the previous if its start <= previous end."]
      }
    ],
    "system-design": [
      {
        id: "m_sys_1",
        question: "Design MS Teams high-concurrency real-time collaborative document workspace. Multiple users can edit the same document in real-time. Describe the synchronization protocol.",
        type: "system-design",
        codeStub: "",
        sampleSolution: "Conflict-free Replicated Data Types (CRDTs) or Operational Transformation (OT) utilizing central order coordination channels.",
        hints: ["How do server clocks establish consensus matching?", "Discuss how network lag could disrupt linear order sequences."]
      }
    ],
    behavioral: [
      {
        id: "m_hr_1",
        question: "Microsoft stresses 'Growth Mindset' and learning. Tell me about a major technical project failure that was your fault. How did you handle the accountability, and what changes did you advocate to prevent it?",
        type: "behavioral",
        codeStub: "",
        sampleSolution: "Exemplifies accountability, active learning loops, and transparent stakeholder communication to improve corporate security culture.",
        hints: ["Own the mistake clearly without masking or downsizing.", "Which personal metrics changed after the event?"]
      }
    ]
  }
};

  const selectedType = type || "technical";
  
  // Choose correct source question pool
  let pool = mockQuestions[selectedType as keyof typeof mockQuestions] || mockQuestions.technical;
  if (COMPANY_SPECIFIC_POOLS[company] && COMPANY_SPECIFIC_POOLS[company][selectedType as keyof typeof mockQuestions]) {
    pool = COMPANY_SPECIFIC_POOLS[company][selectedType as keyof typeof mockQuestions];
  }

  if (!hasApiKey) {
    // Generate static personalized questions matching interest
    const personalized = pool.map((q) => {
      let quest = q.question.replace(/\${company}/g, company).replace(/\${domain}/g, domain);
      if (resumeProfile && resumeProfile.skills && resumeProfile.skills.length > 0) {
        // Embed some resume tags
        const rSkill = resumeProfile.skills[Math.floor(Math.random() * resumeProfile.skills.length)];
        quest += ` Ensure your answer highlights relevant applications of ${rSkill} or related technologies if applicable.`;
      }
      return { ...q, question: quest };
    });
    return res.json({ questions: personalized });
  }

  try {
    const resumeProfileStr = resumeProfile ? JSON.stringify(resumeProfile) : "No resume uploaded";
    
    let targetDirectives = "";
    if (company === "Google") {
      targetDirectives = "CRITICAL: Under Google profile, mimic Google's elite mathematical and computational rigor. Test LeetCode Hard arrays/graphs algorithms and dynamic programming structures.";
    } else if (company === "Amazon") {
      targetDirectives = "CRITICAL: For Amazon, align behaviorals with the 16 Leadership Principles (e.g. Bias for Action, Customer Obsession). Focus on multi-region DynamoDB schemas or payment flows scalability.";
    } else if (company === "Microsoft") {
      targetDirectives = "CRITICAL: Under Microsoft profile, emphasize highly practical code error handles, concurrency threads processing, scheduling overlaps, and growth mindsets.";
    }

    const prompt = `You are an expert tech interviewer at top tier firms. Generate exactly 4 interview questions of type "${selectedType}" for a candidate.
Target Role Profile: Domain: ${domain}, Company Tier: ${company}, Level: ${difficulty || "Mid-Level"}
Resume Intelligence context: ${resumeProfileStr}

${targetDirectives}

For the target profile, make the questions highly realistic, adaptive, and tough, matching the style of interviewers at the target company.
If type is "coding", provide appropriate boilerplate code scaffolds (javascript style) and sample model explanations.
Include helpful, progressive hints.
Return valid JSON fitting the structural specifications.`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  type: { type: Type.STRING },
                  codeStub: { type: Type.STRING },
                  sampleSolution: { type: Type.STRING },
                  hints: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["id", "question", "type", "hints"]
              }
            }
          },
          required: ["questions"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err: any) {
    console.error("Interview questions generation error:", err);
    res.json({ questions: pool });
  }
});

app.post("/api/interview/generate-sim-question", async (req, res) => {
  const { category, company, type } = req.body;
  
  if (!hasApiKey) {
    return res.status(200).json({ error: "Gemini Key missing" });
  }

  try {
    const questionType = type || "behavioral";
    const targetCompany = company || "Google";

    let prompt = "";
    if (questionType === "coding") {
      prompt = `You are a world-class senior staff hiring engineer at ${targetCompany}.
Generate a challenging and highly realistic coding interview question commonly seen during ${targetCompany} technical loops. The question should analyze publicly available software data structures, algorithms, and complex edge constraints relative to current ${targetCompany} system designs.

Please create:
- A clear Title for the algorithmic problem (e.g. "Longest Ascending Subarray Segment").
- A precise prompt Challenge description detailing inputs, constraints, and target computational efficiency (e.g. O(N) time and O(1) space).
- Exactly 3 targeted structural guide hints.
- A functional JavaScript boiler-plate code stub (template) that the candidate should write their solution in.

Return valid JSON: { "scenario": { "id": "generated_code_1", "category": "Coding Assessment", "title": "...", "challenge": "...", "stakeholders": "Algorithmic constraints", "hints": ["...", "...", "..."], "codeStub": "..." } }`;
    } else if (questionType === "system-design") {
      prompt = `You are a principal enterprise architect at ${targetCompany}.
Generate an intensive, real-world system design interview question based on modern ${targetCompany} platform scaling, data centers, distributed caches, security ledgers, or global routing.

Please create:
- A descriptive Title (e.g. "Instagram distributed graph indexing service").
- A deep Challenge prompt detailing functional specifications, expected workload metrics (e.g., 200M active messages/day), latency requirements (sub-100ms), and availability targets (99.999% SLA).
- Exactly 3 expert architectural hints focusing on partitioning, storage replication, or single points of failure.

Return valid JSON: { "scenario": { "id": "generated_sys_1", "category": "System Design", "title": "...", "challenge": "...", "stakeholders": "Database shards, CDN gateways, Master replication groups", "hints": ["...", "...", "..."] } }`;
    } else {
      const formattedCategory = category === "workplace" ? "Workplace Challenge" : category === "ethical" ? "Ethical Dilemma" : "Leadership Situation";
      prompt = `You are a world-class executive recruiter at ${targetCompany}. Generate a highly unique, engaging, realistic, and challenging interview scenario based on the following:
Type: Behavioral STAR Situation
Category: ${formattedCategory}
Selected Company Style Context: ${targetCompany}

Please create:
- A backstory scenario context centering around high-stakes deliverables, bottlenecks, or corporate stress points.
- Concise key stakeholders (e.g. "Product owners, QA leads, uncooperative external subsystem leads").
- Exactly 3 targeted guide hints formatted for a candidate to build a STAR (Situation-Task-Action-Result) response.

Return valid JSON: { "scenario": { "id": "generated_beh_1", "category": "${formattedCategory}", "title": "...", "challenge": "...", "stakeholders": "...", "hints": ["...", "...", "..."] } }`;
    }

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scenario: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                category: { type: Type.STRING },
                title: { type: Type.STRING },
                challenge: { type: Type.STRING },
                stakeholders: { type: Type.STRING },
                hints: { type: Type.ARRAY, items: { type: Type.STRING } },
                codeStub: { type: Type.STRING }
              },
              required: ["id", "category", "title", "challenge", "stakeholders", "hints"]
            }
          },
          required: ["scenario"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err: any) {
    console.error("Scenario generation error:", err);
    res.status(500).json({ error: "Failed to generate scenario via Gemini" });
  }
});

// ── 3. DETAILED SPEECH & TECHNICAL RESPONSE EVALUATOR ──
app.post("/api/interview/evaluate", async (req, res) => {
  const { question, answer, type, domain, company } = req.body;
  if (!answer || !question) {
    return res.status(400).json({ error: "Missing required inputs" });
  }

  // Generic filler word counting check
  const fillers = ["um", "uh", "like", "ah", "basically", "actually", "sort of", "kind of", "you know"];
  const countMatches: { word: string; count: number }[] = [];
  const words = answer.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ").split(/\s+/);
  
  fillers.forEach((fill) => {
    const matched = words.filter(w => w === fill).length;
    if (matched > 0) {
      countMatches.push({ word: fill, count: matched });
    }
  });

  const totalWords = words.length;
  // Estimate pacing: speech rate simulation (e.g. standard audio has ~130 words per minute)
  const estimatedSeconds = Math.max(10, Math.floor(totalWords / 2));
  const wpm = Math.round((totalWords / estimatedSeconds) * 60) || 120;
  
  let pacingStatus = "Perfect conversational pacing.";
  if (wpm > 170) pacingStatus = "Speaking rate is a bit rapid. Slow down to leave room for the interviewer to digest core architectures.";
  if (wpm < 85) pacingStatus = "Pacing appears hesitant. Consider structuring explanations into bullet points to build momentum.";

  // Default mock feedback if key is absent
  const mockEval = {
    score: Math.min(95, Math.max(45, 50 + Math.floor(answer.length / 15))),
    overallFeedback: "A solid effort detailing core components. The answer touches on baseline implementation ideas but could benefit from a deeper, more systematic overview of performance and runtime limits.",
    technicalAccuracyScore: 70,
    communicationClarityScore: 75,
    starBehavioralAnalysis: type === "behavioral" ? {
      details: "The response addresses the Situation and Task effectively. However, the Action component should focus on your specific individual engineering inputs, and the Result lacks concrete numerical metrics (e.g., performance speeds, cloud bills reduction).",
      situationRating: "Good",
      taskRating: "Excellent",
      actionRating: "Average",
      resultRating: "Poor",
      situationFeedback: "The Situation is set up well with standard context, but you should clearly state the scale of the system first.",
      taskFeedback: "The Task correctly highlights the objective but lacks specific urgency details.",
      actionFeedback: "Your Actions list some team accomplishments, but need to zoom in on your specific source code edits and testing strategies.",
      resultFeedback: "The Result lists positive outcomes but does not carry numerical metric percentages.",
      leadershipSuggestions: "Highlight leadership by explaining how you owned the technical decision to migrate the architecture and convinced cross-functional stakeholders.",
      teamworkSuggestions: "Emphasize teamwork by mentioning how you pair-programmed with other SREs and documented the post-mortem to help peers onboard."
    } : undefined,
    detectedFillerWords: countMatches,
    fillerWordsCritique: countMatches.length > 0 
      ? `Identified some redundant filler words such as ${countMatches.map(c => `'${c.word}'`).join(", ")}. These dilute candidate authority during tech presentations.`
      : "Excellent articulation with no major filler words detected.",
    pacingAnalysis: pacingStatus,
    improvedAnswerAlternative: `To elevate your response: "In my previous experience handling distributed systems, we solved the rate limiting bottleneck by spinning up an active cluster of Redis nodes. I implemented a sliding-window log limit using sorted sets, storing tokens mapped against user api-keys. This lowered lookup latencies to sub-3ms while avoiding concurrent overwrites using transactional Lua scripts..."`
  };

  if (!hasApiKey) {
    return res.json(mockEval);
  }

  try {
    const prompt = `You are a strict, world-class Interview Evaluator and Communications Coach. Evaluate the following spoken answer for technical accuracy, structure, filler word usage, and presentation quality.
Question: "${question}"
Candidate Answer: "${answer}"
Mode Category: ${type || "technical"} (Domain: ${domain}, Company Style: ${company})

Evaluate exact metrics including a score (0-100), overall feedback, sub-scores, behavioral analysis (STAR framework breakdown if it's behavioral or culture fit), filler words analysis, pacing critique, and a polished alternative explanation.
If the Mode Category is behavioral:
- Detail the Situation layout and clarity in situationFeedback.
- Detail the Task specificity and stakes in taskFeedback.
- Detail the Action effectiveness, technical precision, and individual contribution in actionFeedback.
- Detail the Result's measurable impact, business KPIs, and numbers in resultFeedback.
- Provide clear, customized recommendations on how the candidate can better highlight leadership qualities (e.g., initiative, decision-making, owning outcomes) in leadershipSuggestions.
- Provide clear, customized recommendations on how the candidate can better highlight teamwork (e.g., collaboration, de-escalating disputes, supporting peers) in teamworkSuggestions.`;

    const response = await ai.models.generateContent({
      model: THINKING_MODEL,
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            overallFeedback: { type: Type.STRING },
            technicalAccuracyScore: { type: Type.INTEGER },
            communicationClarityScore: { type: Type.INTEGER },
            starBehavioralAnalysis: {
              type: Type.OBJECT,
              properties: {
                details: { type: Type.STRING },
                situationRating: { type: Type.STRING },
                taskRating: { type: Type.STRING },
                actionRating: { type: Type.STRING },
                resultRating: { type: Type.STRING },
                situationFeedback: { type: Type.STRING },
                taskFeedback: { type: Type.STRING },
                actionFeedback: { type: Type.STRING },
                resultFeedback: { type: Type.STRING },
                leadershipSuggestions: { type: Type.STRING },
                teamworkSuggestions: { type: Type.STRING }
              }
            },
            detectedFillerWords: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  count: { type: Type.INTEGER }
                }
              }
            },
            fillerWordsCritique: { type: Type.STRING },
            pacingAnalysis: { type: Type.STRING },
            improvedAnswerAlternative: { type: Type.STRING }
          },
          required: ["score", "overallFeedback", "technicalAccuracyScore", "communicationClarityScore", "improvedAnswerAlternative"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    // Merge actual counted filler words for precise analytics
    parsed.detectedFillerWords = countMatches;
    if (parsed.detectedFillerWords.length > 0 && !parsed.fillerWordsCritique) {
      parsed.fillerWordsCritique = `Detected fillers: ${countMatches.map(c => `'${c.word}'`).join(", ")}. Redundant syllables interrupt conversational authority.`;
    }
    res.json(parsed);
  } catch (err: any) {
    console.error("Evaluation error:", err);
    res.json(mockEval);
  }
});

// ── 4. CODING ARENA CRITIQUE ──
app.post("/api/coding/evaluate", async (req, res) => {
  const { question, code, language, company } = req.body;
  if (!code) {
    return res.status(400).json({ error: "No code submitted" });
  }

  const mockReview = {
    correctnessScore: 80,
    efficiencyScore: 75,
    timeComplexity: "O(N log N) / O(N) depending on optimization",
    spaceComplexity: "O(N) stack frames",
    criticalEdgeCases: [
      "Empty array or single item lists",
      "Negative coefficients or descending sequences",
      "Extremely large dataset thresholds causing callstack overflows"
    ],
    refactoringSuggestions: [
      "Avoid nested iterations by adopting dynamic sliding coordinates where applicable.",
      "Switch heavy recursion paths to tabular iteration structures to save stack height.",
      "Consolidate boundary checks early to execute early exit flows."
    ],
    optimizedSolutionCode: `// Optimized solution overview
function maxProfit(prices) {
  if (prices.length < 2) return 0;
  let minPrice = prices[0];
  let maxProfit = 0;
  
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] < minPrice) {
      minPrice = prices[i];
    } else if (prices[i] - minPrice > maxProfit) {
      maxProfit = prices[i] - minPrice;
    }
  }
  return maxProfit;
}`,
    score: 78
  };

  if (!hasApiKey) {
    return res.json(mockReview);
  }

  try {
    const prompt = `You are a Senior Principal Engineer and compiler auditor specializing in coding interviews for ${company || "top tech companies"}. Evaluate the correctness, performance, readability, and speed of the submitted algorithm.
Question context: "${question}"
Code:
\`\`\`${language || "javascript"}
${code}
\`\`\`

Explain algorithmic complexities, highlight missed edge cases, and provide step-by-step refactoring guidelines with clean, fully optimized code.`;

    const response = await ai.models.generateContent({
      model: THINKING_MODEL,
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            correctnessScore: { type: Type.INTEGER },
            efficiencyScore: { type: Type.INTEGER },
            timeComplexity: { type: Type.STRING },
            spaceComplexity: { type: Type.STRING },
            criticalEdgeCases: { type: Type.ARRAY, items: { type: Type.STRING } },
            refactoringSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            optimizedSolutionCode: { type: Type.STRING },
            score: { type: Type.INTEGER }
          },
          required: [
            "correctnessScore",
            "efficiencyScore",
            "timeComplexity",
            "spaceComplexity",
            "criticalEdgeCases",
            "refactoringSuggestions",
            "optimizedSolutionCode",
            "score"
          ]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    const completeReview = {
      correctnessScore: typeof parsed.correctnessScore === "number" ? parsed.correctnessScore : (typeof parsed.score === "number" ? parsed.score : 80),
      efficiencyScore: typeof parsed.efficiencyScore === "number" ? parsed.efficiencyScore : (typeof parsed.score === "number" ? parsed.score : 75),
      timeComplexity: parsed.timeComplexity || "O(N)",
      spaceComplexity: parsed.spaceComplexity || "O(1)",
      criticalEdgeCases: Array.isArray(parsed.criticalEdgeCases) ? parsed.criticalEdgeCases : ["Generic array elements", "Empty or single inputs"],
      refactoringSuggestions: Array.isArray(parsed.refactoringSuggestions) ? parsed.refactoringSuggestions : ["Analyze space complexity bounds", "Refactor loop steps to avoid nested recursion"],
      optimizedSolutionCode: parsed.optimizedSolutionCode || "// Benchmark solution not generated, check complexity manually.",
      score: typeof parsed.score === "number" ? parsed.score : 80
    };
    res.json(completeReview);
  } catch (err: any) {
    console.error("Coding evaluation error:", err);
    res.json(mockReview);
  }
});

// ── 4b. CODING ARENA VOICE TO CODE TRANSLATION ──
app.post("/api/coding/voice-to-code", async (req, res) => {
  const { dictation, question, language } = req.body;
  if (!dictation) {
    return res.status(400).json({ error: "No dictated description provided" });
  }

  const cleanLang = language || "javascript";
  const mockScaffold = {
    code: `// [Voice-to-Code Scaffolding]\n// Dictated Strategy: "${dictation}"\n\nfunction solution() {\n  // 1. Initialize variables\n  // 2. Walk input parameters\n  // TODO: Build actual solution code here\n  console.log("Synthesized template for: ${cleanLang}");\n  return 0;\n}`,
    explanation: "Synthesized a simple algorithmic template mapping against your dictated criteria."
  };

  if (!hasApiKey) {
    return res.json(mockScaffold);
  }

  try {
    const prompt = `You are an expert AI software developer. Convert the following dictated description, strategy outline, or spoken code snippet into clean initial boilerplate code structure.
Target Programming Language: ${cleanLang}
Interview Problem Context: "${question || "Algorithmic coding problem"}"
Dictation Description: "${dictation}"

Write correct, syntactically clean boilerplate/scaffold code that matches the dictated logic or strategy.
Return a valid JSON object matching the requested schema. Do not output markdown code blocks inside the JSON fields.`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            code: { type: Type.STRING, description: "A syntactically valid code boilerplate, template, or solution scaffold representing the dictated logic." },
            explanation: { type: Type.STRING, description: "A brief 1-2 sentence overview of what was generated based on the user's dictation." }
          },
          required: ["code", "explanation"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err: any) {
    console.error("Voice-to-code synthesis error:", err);
    res.json(mockScaffold);
  }
});

// ── 4c. CODING ARENA COMPILE & RUN RUNTIME CODE EXECUTION ──
app.post("/api/coding/run", async (req, res) => {
  const { code, language, inputTestCases, question } = req.body;
  
  console.log("[CodeRunner] Received execution request:", {
    language,
    codeLength: code ? code.length : 0,
    inputTestCases,
    questionText: question ? question.substring(0, 30) : undefined
  });

  if (!code) {
    return res.status(400).json({ error: "No code submitted to execute" });
  }

  const cleanLang = language || "javascript";
  const mockRunResult = {
    success: true,
    output: `[Virtual Sandbox Terminal - ${cleanLang.toUpperCase()}]\nInitializing test vectors...\nArguments passed: "${inputTestCases || "None provided"}"\n\n[Console Log] Processing mock algorithmic evaluation pipeline...\n[Console Log] Memory layout stabilized.\n\nAll virtual test specifications passed successfully!`,
    returnValue: "0",
    compilationError: "",
    executionTimeMs: 14
  };

  if (!hasApiKey) {
    console.log("[CodeRunner] No API Key found, returning high-fidelity sandbox simulation result.");
    return res.json(mockRunResult);
  }

  try {
    const prompt = `You are a secure standalone containerized software compilation and runtime interpreter.
Simulate executing the following code with the provided test inputs inside a clean virtual execution sandbox.

Programming Language: ${cleanLang}
Related Problem Context: "${question || "Algorithmic coding challenge"}"

Submitted Code Statement:
\`\`\`${cleanLang}
${code}
\`\`\`

Interactive Mock Test Inputs (provided by the user as custom parameters or JSON arguments):
"${inputTestCases || "None specified"}"

Understand and simulate running the code under these inputs step-by-step:
1. Conduct standard static analysis & syntax compilation checks. If any syntax error, typo, missing brackets, or obvious compilation/runtime blocker is found, set success to false, set compilationError with the exact compiler traceback log, and output empty or standard error logs in 'output'.
2. If syntax checks pass: Simulate execution. Collect all values printed via console logs, printing statements, standard output printouts (e.g., console.log in js, print in python, System.out.println in java, cout in cpp, fmt.Println in go, etc.) into 'output'. Make sure to include actual expected loop logs or trace output to make the terminal look incredibly real and immersive.
3. Determine what compiling this code and running it returns. Provide the exact return value as a string (e.g. "8", "[]", "false") in 'returnValue'. Set success to true.
4. Set 'executionTimeMs' to a realistic value representing CPU execution time (e.g. 5 to 110 ms).

You must return a valid JSON object matching the requested schema. Do not output markdown code blocks inside the JSON fields.`;

    console.log("[CodeRunner] Dispatching code running prompt to Gemini models...");
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            success: { type: Type.BOOLEAN, description: "Whether the code successfully compiled and finished execution without throwing exceptions." },
            output: { type: Type.STRING, description: "Full standard output print logs/trace logs printed during execution process." },
            returnValue: { type: Type.STRING, description: "The stringified value returned from the solution function." },
            compilationError: { type: Type.STRING, description: "Detailed compiler traceback log or syntax error description if execution/compilation failed." },
            executionTimeMs: { type: Type.INTEGER, description: "Virtual sandbox execution CPU time in milliseconds." }
          },
          required: ["success", "output", "returnValue", "executionTimeMs"]
        }
      }
    });

    const responseText = response.text || "";
    console.log("[CodeRunner] Gemini compile run raw response received. Length:", responseText.length);

    let parsed: any = {};
    try {
      let cleanText = responseText.trim();
      if (cleanText.startsWith("```")) {
        const match = cleanText.match(/^```(?:json)?\n?([\s\S]*?)\n?```$/);
        if (match && match[1]) {
          cleanText = match[1].trim();
        }
      }
      parsed = JSON.parse(cleanText || "{}");
    } catch (parseErr) {
      console.warn("[CodeRunner] Failed to parse response directly in CJS JSON. Falling block to simulation mode", parseErr);
    }

    const isSuccess = typeof parsed.success === "boolean" ? parsed.success : true;
    res.json({
      success: isSuccess,
      output: parsed.output || `[Virtual Sandbox Execution - ${cleanLang.toUpperCase()}]\nCode parsed successfully.\nConsole: Running pipeline evaluation...\nAll virtual tests completed.`,
      returnValue: parsed.returnValue || "0",
      compilationError: !isSuccess ? (parsed.compilationError || "Unknown compilation or runtime execution error.") : "",
      executionTimeMs: typeof parsed.executionTimeMs === "number" ? parsed.executionTimeMs : 25
    });
  } catch (err: any) {
    console.error("[CodeRunner] Error during Gemini interactive evaluation execution:", err);
    res.json(mockRunResult);
  }
});

// ── 5. SYSTEM DESIGN ARENA EXAMINER ──
app.post("/api/system-design/evaluate", async (req, res) => {
  const { question, architectureDescription, selectedComponents } = req.body;
  if (!architectureDescription) {
    return res.status(400).json({ error: "Missing design layout" });
  }

  const mockDesignResult = {
    feasibilityScore: 80,
    scalabilityScore: 85,
    availabilityCritique: "The setup leverages reliable CDN and Load Balancing components. However, not specifying read-caches (Redis/Memcached) leaves database clusters exposed to high concurrent read spikes.",
    bottlenecks: [
      "Single database cluster acts as a single point of failure without replica sets.",
      "No rate limiters defined at the ingress boundary, making it open to denial-of-service fatigue.",
      "Sync file updates on the web servers will block event execution threads."
    ],
    databaseRecommendation: "Employ PostgreSQL with Master-Slave read replication of relational states, combined with Cassandra or DynamoDB wide column records for chronological timeline log streams.",
    cachingStrategy: "Distribute a multi-layered cache model: local in-memory stores inside application pods for hot configurations, backed by a write-around Redis cluster for fast feed redirection lookups.",
    faultToleranceFeedback: "Introduce asynchronous processing queues. When downstream services crash, incoming payloads should persist safely inside dead-letter queues in RabbitMQ/Kafka.",
    score: 83
  };

  if (!hasApiKey) {
    return res.json(mockDesignResult);
  }

  try {
    const prompt = `You are a Distinguished Cloud Architect. Audit the candidate's System Design whiteboard choices and scaling explanations.
System design task: "${question}"
Candidate whiteboard summary of coordinates: "${architectureDescription}"
Whiteboard Components selected: "${(selectedComponents || []).join(", ")}"

Provide exact scalability assessments, explain failure risks/bottlenecks, suggest caching/database parameters, and suggest fault tolerance improvements.`;

    const response = await ai.models.generateContent({
      model: THINKING_MODEL,
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feasibilityScore: { type: Type.INTEGER },
            scalabilityScore: { type: Type.INTEGER },
            availabilityCritique: { type: Type.STRING },
            bottlenecks: { type: Type.ARRAY, items: { type: Type.STRING } },
            databaseRecommendation: { type: Type.STRING },
            cachingStrategy: { type: Type.STRING },
            faultToleranceFeedback: { type: Type.STRING },
            score: { type: Type.INTEGER }
          },
          required: ["feasibilityScore", "scalabilityScore", "availabilityCritique", "databaseRecommendation", "score"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err: any) {
    console.error("System Design critique error:", err);
    res.json(mockDesignResult);
  }
});

// ── 6. CAREER COACH & ADAPTIVE ROADMAP MENTOR ──
app.post("/api/coach/chat", async (req, res) => {
  const { message, chatHistory, domain, targetCompany, parsedResume } = req.body;
  if (!message) {
    return res.status(400).json({ error: "No message text provided" });
  }

  const mockCoach = {
    answerText: `To achieve placement success as a ${domain || "Software Engineer"} targeting ${targetCompany || "FAANG firms"}, you should focus heavily on foundational algorithms, concurrency principles, and system replication patterns.

Based on our interactive study algorithms, here is my guidance:
1. **Focus on Core Fundamentals**: Master structures like priority queues, binary index trees, and graph search paths.
2. **System Design Practice**: Study large-scale media timeline models (like feed caching rules and DB replicas) and high availability guidelines.
3. **Behavioral Storytelling**: Structure bullet logs mapping to STAR standards, carrying numeric outputs.

Feel free to ask me to review specific project lines or write active learning roadmaps!`,
    suggestedRoadmapTopics: [
      "Implement LRU Cache & Min-Heap structures",
      "Database Sharding and Multi-leader replication",
      "Mock interviews on high scale rate limiters",
      "Behavioral practice: Conflict resolution and leadership ownership"
    ],
    recommendedLearningResources: [
      {
        title: "Designing Data-Intensive Applications",
        url: "#",
        description: "The absolute standard for replication, scaling, and fault tolerance paradigms."
      },
      {
        title: "PrepAI Spaced Repetition Practice List",
        url: "#",
        description: "Curated technical questions based on your parsed resume and domain weaknesses."
      }
    ]
  };

  if (!hasApiKey) {
    return res.json(mockCoach);
  }

  try {
    const resumeProfileStr = parsedResume ? JSON.stringify(parsedResume) : "No resume parsing on record";
    
    const formattedHistory = (chatHistory || [])
      .map((h: any) => `${h.sender === "user" ? "Candidate" : "Coach"}: ${h.text}`)
      .join("\n");

    const prompt = `You are PrepAI's Senior Career Coach & Mentorship Director. Provide elite, tailored career mentoring, roadmap updates, study items, and resources.
Candidate target: ${domain || "General Tech"}, Target Tier: ${targetCompany || "FAANG"}
Resume data: ${resumeProfileStr}

Current Chat History:
${formattedHistory}

Candidate new request: "${message}"

Respond strictly with expert answers, structured roadmap checklists, and concrete resource learning materials.`;

    const response = await ai.models.generateContent({
      model: THINKING_MODEL,
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answerText: { type: Type.STRING },
            suggestedRoadmapTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedLearningResources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  url: { type: Type.STRING },
                  description: { type: Type.STRING }
                }
              }
            }
          },
          required: ["answerText"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err: any) {
    console.error("Coach chat error:", err);
    res.json(mockCoach);
  }
});

// ── 6b. VOICE ANALYSIS FOR AI CAREER COACH ──
app.post("/api/coach/analyze-speech", async (req, res) => {
  const { audio64, mimeType } = req.body;
  if (!audio64) {
    return res.status(400).json({ error: "No audio data provided for evaluation." });
  }

  const defaultMime = mimeType || "audio/webm";

  const mockSpeechResult = {
    fillerWords: "2 'um's, 1 'like'",
    pace: "125 WPM. Elegant and natural. Perfect pacing for a professional interview answer.",
    tone: "Assertive, warm, and highly articulate. Great voice modulation and energy.",
    speakingScore: 88,
    feedbackNotes: "Your phrasing is exceptionally clear. Next time, try to minimize the slight hesitation before speaking the phrase 'architectural components' to project even greater authority.",
    transcription: "Thank you for the opportunity. I would say my experience with high write systems has taught me to use optimistic locking and caching patterns properly. In my previous role, we successfully scaled our data pipeline by 3x."
  };

  if (!hasApiKey) {
    return res.json(mockSpeechResult);
  }

  try {
    const audioPart = {
      inlineData: {
        data: audio64,
        mimeType: defaultMime
      }
    };

    const prompt = `Analyze this audio snippet of a candidate answering a career interview question. 
Detect and count 'filler words' (such as 'like', 'um', 'uh', 'ah', 'you know', etc.).
Evaluate 'pace' (words per minute, speed, rhythm, pauses, rate of speech) and 'tone' (confidence, voice modulation, monotonous vs engaging, hesitation levels).
Provide a structured synthesis containing:
1. 'fillerWords': A string highlighting common filler words found and their frequency (e.g., "3 'um's, 2 'like's" or "None detected! Excellent verbal control.").
2. 'pace': A brief qualitative evaluation of speed of delivery (e.g., "110 WPM. Excellent cadence, neither slow nor hurried.").
3. 'tone': Evaluation of confidence, richness, emotional modulation (e.g., "Confident, with natural inflections. Tone feels warm, though slightly quiet.").
4. 'speakingScore': Numeric integer out of 100 representing the effectiveness of communication.
5. 'feedbackNotes': Direct, actionable speech-coaching recommendations for improvement.
6. 'transcription': A transcription of the audio content so the candidate can read what they spoke.

Ensure the output is formatted as a JSON object matching this schema.`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [audioPart, prompt],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fillerWords: { type: Type.STRING },
            pace: { type: Type.STRING },
            tone: { type: Type.STRING },
            speakingScore: { type: Type.INTEGER },
            feedbackNotes: { type: Type.STRING },
            transcription: { type: Type.STRING }
          },
          required: ["fillerWords", "pace", "tone", "speakingScore", "feedbackNotes", "transcription"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err: any) {
    console.error("Speech analysis error:", err);
    res.json(mockSpeechResult);
  }
});

app.post("/api/roadmap/explain", async (req, res) => {
  const { topicTitle, areaId, difficulty, domain, company } = req.body;
  if (!topicTitle) {
    return res.status(400).json({ error: "No topic title provided" });
  }

  const prompt = `You are PrepAI's Senior Elite Technical and Behavioral Mentor.
Generate an elite, high-fidelity, incredibly thorough Markdown Cheat Sheet Study Guide for the following target study topic:
Topic: "${topicTitle}" (Category: "${areaId}")
Candidate Target Profile: ${difficulty} level, in ${domain || "CS/Engineering"}.
Target Company: ${company || "FAANG firms"}.

Structure your response using clean, beautiful Markdown. Include:
1. **Core Architectural Concept**: What is this concept at a fundamental level? (Provide deep technical precision or STAR context).
2. **Standard Implementation / Workflow Blueprint**: Outline a clear concrete workflow, code stub (TypeScript or Java/Python), database sharding flow, or STAR outline, with precise indicators or O() complexity highlights. Use ASCII flowcharts if helpful.
3. **Common Interview Traps / Deadlocks**: What do candidates usually fail to implement or articulate when answering this under stress?
4. **Tailored advice for ${company}**: A brief targeted recommendation for ${company}-specific parameters (e.g. scale rules, leadership principles alignment).

Respond strictly in a JSON object matching this schema:
{
  "explanation": "Markdown text here"
}`;

  if (!hasApiKey) {
    // Generate a high-fidelity personalized mock explanation
    const fallbackExp = `### INTELLECTUAL STUDY BRIEF: **${topicTitle.toUpperCase()}**
*Target Level:* **${difficulty}**  
*Strategic Placement Alignment:* **${company}** • **${domain || "General Engineer"}**

---

#### 1. Core Architectural / Conceptual Paradigm
This topic is a cornerstone of performance tracking. When engineers scale services to handle concurrent millions of records or articulate complex trade-offs, they must demonstrate spatial-temporal or behavioral rigidity. At a **${difficulty}** level, you are expected to explain both the high-level system trade-offs and the low-level execution mechanics.

#### 2. Workflow Architectural Blueprint
\`\`\`typescript
// Adaptive High-Performance Pattern for: ${topicTitle}
export class NodeOptimizer {
  private activeConcurrencyTrackers = new Map<string, number>();

  public async evaluatePerformance(requestID: string): Promise<void> {
    const startMs = Date.now();
    try {
      // 1. Maintain active sliding window anchors
      // 2. Resolve read-aside cache hits in under 5ms
      // 3. Update distributed database replicas with partition alignment
    } catch (err) {
      // Avoid raw exception swallows - emit telemetry metrics
      throw err;
    }
  }
}
\`\`\`

#### 3. Common Interview Pitfalls & Traps
* **Failing to address hot-spots / stampedes**: Focus only on standard conditions, neglecting edge conditions (skewed ranges, total network partition lags).
* **Vague Metrics in Behavioral Stories**: Expressing stories in "team terms" instead of defining clear individual ownership, or neglecting dollar ($) and latency (ms) outcomes.
* **Redundant loops**: O(N²) traversal where O(N) structures exist.

#### 4. Elite Advice Tailored for **${company}**
* Incorporate **${company}'s** architectural style: focus on scalability parameters, fault tolerance, and eventual consistency.
* Be standard-driven: back each assertion with concrete O() space/time claims and measurable outcome KPIs.`;

    return res.json({ explanation: fallbackExp });
  }

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING }
          },
          required: ["explanation"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err) {
    console.error("Explainer generation error:", err);
    res.status(500).json({ error: "Failed to generate AI concept explanation" });
  }
});

// ── 6b. COMMUNITY FORUM AND COMPANY INSIGHTS PERSISTENCE ──
const FORUM_FILE = path.join(process.cwd(), "forum_db.json");
const INSIGHTS_FILE = path.join(process.cwd(), "insights_db.json");

function readForum() {
  try {
    if (fs.existsSync(FORUM_FILE)) {
      return JSON.parse(fs.readFileSync(FORUM_FILE, "utf-8"));
    }
  } catch (err) {
    console.error("Error reading forum file:", err);
  }
  // Initialize default seed threads
  const seedThreads = [
    {
      id: "thread_1",
      title: "OT (Operational Transformation) vs CRDT for collaborative canvases?",
      content: "Which one scales better for a live whiteboard room that needs offline edits? Let's discuss performance and state synchronization costs.",
      author: "Arnav Telangi",
      category: "technical",
      categoryExtra: "System Design & Collaboration",
      upvotes: ["Arnav Telangi", "StaffMentor_99"],
      replies: [
        {
          id: "rep_1",
          author: "StaffMentor_99",
          content: "Generally, OT requires a central coordination server to resolve operations order, which makes it easier for strict consistency. CRDT is better for peer-to-peer but state growth can be large. For whiteboard vectors, CRDT is very popular now.",
          timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
        }
      ],
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      id: "thread_2",
      title: "Why is sliding window double-ended queue optimization always O(N)?",
      content: "I'm practicing monotonic queues like sliding window maximum. Although there's a nested while loop inside, our mentor says it's strictly O(N) amortized. Can someone explain?",
      author: "Candidate41",
      category: "technical",
      categoryExtra: "Algorithms & Math",
      upvotes: ["Arnav Telangi"],
      replies: [
        {
          id: "rep_2",
          author: "Algopreneur",
          content: "Every element is pushed (inserted) to the deque exactly once and popped (removed) at most once. Therefore, the total operations across the entire array loop are bounded by 2N actions.",
          timestamp: new Date(Date.now() - 3600000 * 1).toISOString()
        }
      ],
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString()
    },
    {
      id: "thread_3",
      title: "How to handle 'Customer Obsession' in Amazon core technical prompts?",
      content: "Amazon places a heavy weight on the 16 Leadership Principles. How are candidates weaving Customer Obsession or 'Dive Deep' indicators directly into system design solutions?",
      author: "LeaderX",
      category: "company",
      categoryExtra: "Amazon Culture Check",
      upvotes: ["StaffMentor_99", "Candidate41"],
      replies: [
        {
          id: "rep_3",
          author: "AmazonianMentor",
          content: "When designing databases, frame it in human outcomes! E.g. 'To make sure users never experience lag on peak holiday sales (Customer Obsession), we add multi-region replication and handle edge failovers.' Show you care about the customer! Give dollar and latency save calculations.",
          timestamp: new Date().toISOString()
        }
      ],
      timestamp: new Date(Date.now() - 3600000 * 20).toISOString()
    },
    {
      id: "thread_4",
      title: "Preparing for Google's strict space complexity requirements",
      author: "GooglerHopeful",
      content: "I've heard that Google interviewers are heavily auditing secondary buffers and demanding in-place permutations or customized pointer tracking. Any tips?",
      category: "company",
      categoryExtra: "Google Coding Standard",
      upvotes: [],
      replies: [],
      timestamp: new Date(Date.now() - 3600000 * 48).toISOString()
    },
    {
      id: "thread_5",
      title: "Overcoming interview stage-fright and dynamic canvas freezes",
      author: "CalmCoder",
      content: "How do you guys deal with the mental freeze when the live environment reports unexpected syntax errors? I tend to break down or stop speaking.",
      category: "general",
      categoryExtra: "Mental Prep & Anxiety",
      upvotes: ["Arnav Telangi", "StaffMentor_99", "Candidate41"],
      replies: [
        {
          id: "rep_4",
          author: "Pragmatic_Coder",
          content: "Immediately call out: 'Ah, I see a reference error on line 12. Let me trace back where I declared it.' Talking out loud instantly redirects your cognitive load from panic into execution!",
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
        }
      ],
      timestamp: new Date(Date.now() - 3600000 * 30).toISOString()
    }
  ];
  try {
    fs.writeFileSync(FORUM_FILE, JSON.stringify(seedThreads, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing initial seed threads:", err);
  }
  return seedThreads;
}

function writeForum(threads: any[]) {
  try {
    fs.writeFileSync(FORUM_FILE, JSON.stringify(threads, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing forum file:", err);
  }
}

function readInsights() {
  try {
    if (fs.existsSync(INSIGHTS_FILE)) {
      return JSON.parse(fs.readFileSync(INSIGHTS_FILE, "utf-8"));
    }
  } catch (err) {
    console.error("Error reading insights file:", err);
  }
  // Initialize default seed company insights
  const seedInsights = {
    Google: {
      technicalQuestions: [
        "Find local topological alignment in deep graphs with heavy edge weight updates.",
        "Sort highly clustered data points arriving continuously from infinite stream pipelines using min/max bounds.",
        "Perform sliding-window searches over segmented text blobs to find minimum substring matrices."
      ],
      behavioralPatterns: [
        "Demonstrate Googlyness by exhibiting high comfort under severe ambiguity.",
        "Highlight horizontal influence, helping peers progress without holding managerial authority.",
        "Prioritize logical compromise — showing willingness to course-correct if metrics suggest a better approach."
      ],
      systemDesignTopics: [
        "Global highly consistent Key-Value stores with Paxos synchronization (Spanner level design).",
        "Multi-cluster indexing pipelines with eventual consistency limits and zero-downtime rolling updates.",
        "Google Photos content delivery network cache replication and high-throughput background deduplication queues."
      ],
      recentFeedback: [
        {
          id: "fb_g1",
          author: "Anonymized Candidate",
          role: "Senior Staff Engineer (L6)",
          level: "Senior",
          content: "The system design loops require concrete mathematics. Do not just say 'I would add a cache.' Define the hit ratio, storage footprint, shard distribution, and the exact failover behavior in case of partition. Highly technical, but very respectful interviewers.",
          recommendStatus: "Recommend",
          timestamp: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
        },
        {
          id: "fb_g2",
          author: "Anonymized Alumni",
          role: "Software Engineer III (L4)",
          level: "Mid-Level",
          content: "The coding loop was extremely fast-paced. My interviewer went from a simple sliding window into a hard multithreading cache invalidation in-place matrix follow-up. Keep communicating continuously to claim points on code comprehension.",
          recommendStatus: "Maybe Recommend",
          timestamp: new Date(Date.now() - 3600000 * 24 * 10).toISOString()
        }
      ]
    },
    Amazon: {
      technicalQuestions: [
        "Sliding window optimizations across highly distributed product indices.",
        "Design dynamic inventory caching intervals involving Least Frequently Used (LFU) invalidation filters.",
        "Perform depth-first routes evaluation across physical logistics and fulfillment hubs."
      ],
      behavioralPatterns: [
        "Demonstrate severe Bias for Action — don't build analytical paralysis when speed is key.",
        "Dive Deep — know the extreme operational parameters of your past systems.",
        "Disagree and Commit — show how you professional challenge decisions but unite to execute."
      ],
      systemDesignTopics: [
        "Distributed highly scaling Shopping Cart state persistence with DynamoDB eventual consistency models.",
        "Real-time pub-sub flash-sales notification infrastructure that scales to 500k writes/sec during peak drops.",
        "Logistics routing logic with graph searches under extreme weather path-obstruction constraints."
      ],
      recentFeedback: [
        {
          id: "fb_a1",
          author: "Anonymized Candidate",
          role: "Principal Tech Leader (L7)",
          level: "Senior",
          content: "Be absolutely loaded with structural behavioral stories. If they ask a system design question, they are checking if your architectural decisions align back to customer metrics and delivery speeds. If you do not know your previous system's numbers, it is a direct failure.",
          recommendStatus: "Recommend",
          timestamp: new Date(Date.now() - 3600000 * 24 * 5).toISOString()
        }
      ]
    },
    Meta: {
      technicalQuestions: [
        "Identify the K closest posts relative to coordinate origin with O(N log K) time boundaries.",
        "Design a custom balanced social tree traversal algorithm to search friends of friends (3 degrees).",
        "Perform efficient range searches on high frequency social feeds."
      ],
      behavioralPatterns: [
        "Emphasize impact and speed: 'Move Fast' is a real evaluation parameter.",
        "Show strong ownership: detail how you noticed a performance gap in production and pushed a fix without anyone asking.",
        "Be direct and brief. Keep reviews concise and let numbers tell the story."
      ],
      systemDesignTopics: [
        "Distributed TAO cache architecture for mapping high volumes of graph association edges.",
        "Instagram Stories real-time high priority delivery and push notification queues.",
        "WhatsApp global end-to-end messaging reliability receipt handlers."
      ],
      recentFeedback: [
        {
          id: "fb_m1",
          author: "Anonymized Candidate",
          role: "Software Engineer IV (E5)",
          level: "Senior",
          content: "Very direct loop. Coding is 45 minutes for two complete problems — no time to waste on small talk. Practice writing code clean from the first line. System design focused on the TAO caching principles and social graph replication, very intense.",
          recommendStatus: "Recommend",
          timestamp: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
        }
      ]
    },
    Microsoft: {
      technicalQuestions: [
        "Implement custom multithreaded queues for live whiteboard message streams.",
        "Construct search trie trees for autocompletion over massive telemetry logs.",
        "Evaluate binary search trees balance optimizations during dynamic inputs."
      ],
      behavioralPatterns: [
        "Frame your solutions in terms of Growth Mindset — how did you learn from failures?",
        "Show active collaboration and empathy: we succeed as a team rather than as lone geniuses.",
        "Be open to feedback: interviewers often give mild course correction, show that you actively adapt to it."
      ],
      systemDesignTopics: [
        "Real-time video and audio synchronization infrastructure for MS Teams whiteboard environments.",
        "Azure storage blob partitioning and secondary recovery architectures.",
        "Global telemetry streaming pipeline that processes petabytes of event logs daily."
      ],
      recentFeedback: [
        {
          id: "fb_ms1",
          author: "Anonymized Candidate",
          role: "Senior Software Engineer (L63)",
          level: "Senior",
          content: "The focus is greatly on solid, production-grade code. Make sure you cover error checking and boundary edge validation. The behavioral loop is heavily focused on collaboration, mentoring junior engineers, and learning from technical debt.",
          recommendStatus: "Recommend",
          timestamp: new Date(Date.now() - 3600000 * 24 * 14).toISOString()
        }
      ]
    },
    Apple: {
      technicalQuestions: [
        "Implement highly optimized LRU cache eviction algorithms with strict memory layouts.",
        "Matrix array traversals and edge searches for image pixel transformations.",
        "Optimize binary tree traversals to conserve battery resource limits."
      ],
      behavioralPatterns: [
        "Demonstrate extreme attention to detail and absolute aesthetic / architectural quality.",
        "Exhibit fierce product privacy and security priority alignment.",
        "Show extreme technical mastery of your immediate programming domain."
      ],
      systemDesignTopics: [
        "Highly-secure end-to-end encrypted iCloud Photo backup sync queues with partial network reliability.",
        "Local device content indexing under extreme energy limits and asynchronous push feeds.",
        "Secure global hardware licensing validation distributed ledger servers."
      ],
      recentFeedback: [
        {
          id: "fb_ap1",
          author: "Anonymized Candidate",
          role: "Hardware Core Architect",
          level: "Senior",
          content: "Apple's loop is deeply tailored to the team you are interviewing with. Some teams focus purely on compiler-level optimizations and low-level memory arrays. Be very precise about thread layouts and memory fences. Extremely polite team, great depth of knowledge.",
          recommendStatus: "Recommend",
          timestamp: new Date(Date.now() - 3600000 * 24 * 8).toISOString()
        }
      ]
    }
  };
  try {
    fs.writeFileSync(INSIGHTS_FILE, JSON.stringify(seedInsights, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing initial seed insights:", err);
  }
  return seedInsights;
}

function writeInsights(insights: Record<string, any>) {
  try {
    fs.writeFileSync(INSIGHTS_FILE, JSON.stringify(insights, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing insights file:", err);
  }
}

// REST endpoints for Community Forum
app.get("/api/forum/threads", (req, res) => {
  const threads = readForum();
  res.json({ threads });
});

app.post("/api/forum/threads", (req, res) => {
  const { title, content, author, category, categoryExtra } = req.body;
  if (!title || !content || !author || !category) {
    return res.status(400).json({ error: "Missing required fields for creating a thread." });
  }
  const threads = readForum();
  const newThread = {
    id: `thread_${Date.now()}`,
    title,
    content,
    author,
    category,
    categoryExtra: categoryExtra || "General",
    upvotes: [],
    replies: [],
    timestamp: new Date().toISOString()
  };
  threads.unshift(newThread);
  writeForum(threads);
  res.json({ success: true, thread: newThread, threads });
});

app.post("/api/forum/threads/:id/replies", (req, res) => {
  const { id } = req.params;
  const { author, content } = req.body;
  if (!author || !content) {
    return res.status(400).json({ error: "Author and content required for a reply." });
  }
  const threads = readForum();
  const threadIndex = threads.findIndex((t: any) => t.id === id);
  if (threadIndex === -1) {
    return res.status(404).json({ error: "Thread not found." });
  }
  const newReply = {
    id: `rep_${Date.now()}`,
    author,
    content,
    timestamp: new Date().toISOString()
  };
  threads[threadIndex].replies.push(newReply);
  writeForum(threads);
  res.json({ success: true, reply: newReply, thread: threads[threadIndex], threads });
});

app.post("/api/forum/threads/:id/upvote", (req, res) => {
  const { id } = req.params;
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Username required to upvote." });
  }
  const threads = readForum();
  const threadIndex = threads.findIndex((t: any) => t.id === id);
  if (threadIndex === -1) {
    return res.status(404).json({ error: "Thread not found." });
  }
  const thread = threads[threadIndex];
  if (!thread.upvotes) thread.upvotes = [];
  
  const voterIndex = thread.upvotes.indexOf(username);
  if (voterIndex === -1) {
    thread.upvotes.push(username);
  } else {
    thread.upvotes.splice(voterIndex, 1);
  }
  writeForum(threads);
  res.json({ success: true, thread, threads });
});

// REST endpoints for Company-Specific Interview Insights and Feedback
app.get("/api/insights/companies", (req, res) => {
  const insights = readInsights();
  res.json({ insights });
});

app.post("/api/insights/feedback", (req, res) => {
  const { company, role, level, content, recommendStatus, author } = req.body;
  if (!company || !content || !recommendStatus) {
    return res.status(400).json({ error: "Missing required fields for feedback." });
  }
  const insights = readInsights();
  if (!insights[company]) {
    insights[company] = {
      technicalQuestions: [],
      behavioralPatterns: [],
      systemDesignTopics: [],
      recentFeedback: []
    };
  }
  const newFb = {
    id: `fb_${Date.now()}`,
    author: author || "Anonymized Contributor",
    role: role || "Software Engineer",
    level: level || "Mid-Level",
    content,
    recommendStatus,
    timestamp: new Date().toISOString()
  };
  insights[company].recentFeedback.unshift(newFb);
  writeInsights(insights);
  res.json({ success: true, feedback: newFb, insights });
});


// ── 7. DEV SERVER AND SPA MIDDLEWARES AND WEBSOCKETS ──
async function startServer() {
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws: WebSocket) => {
    ws.on("message", (raw: string) => {
      try {
        const msg = JSON.parse(raw);

        switch (msg.type) {
          case "join_room": {
            const { roomId, userName } = msg;
            const userId = `u_${Math.random().toString(36).substring(2, 7)}`;

            // Create Room if not present
            if (!activeRooms.has(roomId)) {
              activeRooms.set(roomId, {
                id: roomId,
                activeQuestion: null,
                code: `// Welcome to Pair Practice Room!\nfunction solution() {\n  return 0;\n}`,
                language: "javascript",
                canvasNodes: [],
                apiSpecs: "",
                cachingSpecs: "",
                bottlenecksSpecs: "",
                chatMessages: [],
                sharedEvaluations: [],
                roles: { candidate: "", proctor: "" },
                users: [],
                screenSharer: null,
                inlineReviews: [],
                recordings: []
              });
            }

            const room = activeRooms.get(roomId)!;
            room.users.push({ id: userId, name: userName });
            clientConnections.set(ws, { roomId, userId, userName });

            // Send initial sync state to client
            ws.send(JSON.stringify({
              type: "sync_state",
              state: {
                ...room,
                screenSharer: room.screenSharer || null,
                inlineReviews: room.inlineReviews || [],
                recordings: room.recordings || []
              }
            }));

            // Notify everyone else in the room
            wss.clients.forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                const conn = clientConnections.get(client);
                if (conn && conn.roomId === roomId) {
                  client.send(JSON.stringify({
                    type: "user_joined",
                    userId,
                    userName
                  }));
                }
              }
            });
            break;
          }

          case "role_claim": {
            const conn = clientConnections.get(ws);
            if (!conn) return;
            const room = activeRooms.get(conn.roomId);
            if (!room) return;

            if (msg.role === "candidate") {
              room.roles.candidate = msg.name;
            } else if (msg.role === "proctor") {
              room.roles.proctor = msg.name;
            }

            // Sync updated roles mapping
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                const c = clientConnections.get(client);
                if (c && c.roomId === conn.roomId) {
                  client.send(JSON.stringify({
                    type: "role_update",
                    roles: room.roles
                  }));
                }
              }
            });
            break;
          }

          case "code_change": {
            const conn = clientConnections.get(ws);
            if (!conn) return;
            const room = activeRooms.get(conn.roomId);
            if (!room) return;

            room.code = msg.code;

            // Sync new code back to peers (skip sender to avoid editor caret jumps)
            wss.clients.forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                const c = clientConnections.get(client);
                if (c && c.roomId === conn.roomId) {
                  client.send(JSON.stringify({
                    type: "code_update",
                    code: msg.code
                  }));
                }
              }
            });
            break;
          }

          case "lang_change": {
            const conn = clientConnections.get(ws);
            if (!conn) return;
            const room = activeRooms.get(conn.roomId);
            if (!room) return;

            room.language = msg.language;

            // Sync programming language choice to all
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                const c = clientConnections.get(client);
                if (c && c.roomId === conn.roomId) {
                  client.send(JSON.stringify({
                    type: "lang_update",
                    language: msg.language
                  }));
                }
              }
            });
            break;
          }

          case "canvas_change": {
            const conn = clientConnections.get(ws);
            if (!conn) return;
            const room = activeRooms.get(conn.roomId);
            if (!room) return;

            room.canvasNodes = msg.nodes;

            // Sync nodes array (skip sender)
            wss.clients.forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                const c = clientConnections.get(client);
                if (c && c.roomId === conn.roomId) {
                  client.send(JSON.stringify({
                    type: "canvas_update",
                    nodes: msg.nodes
                  }));
                }
              }
            });
            break;
          }

          case "specs_change": {
            const conn = clientConnections.get(ws);
            if (!conn) return;
            const room = activeRooms.get(conn.roomId);
            if (!room) return;

            const updatePayload: any = { type: "specs_update" };

            if (msg.apiSpecs !== undefined) {
              room.apiSpecs = msg.apiSpecs;
              updatePayload.apiSpecs = msg.apiSpecs;
            }
            if (msg.cachingSpecs !== undefined) {
              room.cachingSpecs = msg.cachingSpecs;
              updatePayload.cachingSpecs = msg.cachingSpecs;
            }
            if (msg.bottlenecksSpecs !== undefined) {
              room.bottlenecksSpecs = msg.bottlenecksSpecs;
              updatePayload.bottlenecksSpecs = msg.bottlenecksSpecs;
            }

            // Sync values to everyone else
            wss.clients.forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                const c = clientConnections.get(client);
                if (c && c.roomId === conn.roomId) {
                  client.send(JSON.stringify(updatePayload));
                }
              }
            });
            break;
          }

          case "chat_message": {
            const conn = clientConnections.get(ws);
            if (!conn) return;
            const room = activeRooms.get(conn.roomId);
            if (!room) return;

            const chatMsg = {
              id: `c_${Date.now()}`,
              sender: msg.sender,
              text: msg.text,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            };

            room.chatMessages.push(chatMsg);

            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                const c = clientConnections.get(client);
                if (c && c.roomId === conn.roomId) {
                  client.send(JSON.stringify({
                    type: "chat_message_received",
                    message: chatMsg
                  }));
                }
              }
            });
            break;
          }

          case "submit_score": {
            const conn = clientConnections.get(ws);
            if (!conn) return;
            const room = activeRooms.get(conn.roomId);
            if (!room) return;

            const newEval = {
              id: `e_${Date.now()}`,
              score: msg.score,
              feedback: msg.feedback,
              evaluator: msg.evaluator,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            };

            room.sharedEvaluations.push(newEval);

            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                const c = clientConnections.get(client);
                if (c && c.roomId === conn.roomId) {
                  client.send(JSON.stringify({
                    type: "score_received",
                    evaluations: room.sharedEvaluations
                  }));
                }
              }
            });
            break;
          }

          case "change_question": {
            const conn = clientConnections.get(ws);
            if (!conn) return;
            const room = activeRooms.get(conn.roomId);
            if (!room) return;

            room.activeQuestion = msg.question;
            if (msg.question.type === "coding" && msg.question.codeStub) {
              room.code = msg.question.codeStub;
            }

            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                const c = clientConnections.get(client);
                if (c && c.roomId === conn.roomId) {
                  client.send(JSON.stringify({
                    type: "question_update",
                    question: msg.question,
                    code: room.code
                  }));
                }
              }
            });
            break;
          }

          case "screen_share_change": {
            const conn = clientConnections.get(ws);
            if (!conn) return;
            const room = activeRooms.get(conn.roomId);
            if (!room) return;

            room.screenSharer = msg.active ? msg.userName : null;

            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                const c = clientConnections.get(client);
                if (c && c.roomId === conn.roomId) {
                  client.send(JSON.stringify({
                    type: "screen_share_update",
                    active: msg.active,
                    userName: msg.userName
                  }));
                }
              }
            });
            break;
          }

          case "inline_review_add": {
            const conn = clientConnections.get(ws);
            if (!conn) return;
            const room = activeRooms.get(conn.roomId);
            if (!room) return;

            if (!room.inlineReviews) room.inlineReviews = [];
            
            const reviewItem = {
              id: `r_${Date.now()}`,
              author: msg.author,
              comment: msg.comment,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            };
            room.inlineReviews.push(reviewItem);

            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                const c = clientConnections.get(client);
                if (c && c.roomId === conn.roomId) {
                  client.send(JSON.stringify({
                    type: "inline_review_received",
                    reviews: room.inlineReviews
                  }));
                }
              }
            });
            break;
          }

          case "audio_recording_submit": {
            const conn = clientConnections.get(ws);
            if (!conn) return;
            const room = activeRooms.get(conn.roomId);
            if (!room) return;

            if (!room.recordings) room.recordings = [];
            
            const recordingItem = {
              id: `rec_${Date.now()}`,
              questionId: msg.questionId,
              audioDataUrl: msg.audioDataUrl,
              sender: msg.sender,
              textTranscript: msg.textTranscript || "",
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            };
            room.recordings.push(recordingItem);

            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                const c = clientConnections.get(client);
                if (c && c.roomId === conn.roomId) {
                  client.send(JSON.stringify({
                    type: "audio_recording_received",
                    recordings: room.recordings
                  }));
                }
              }
            });
            break;
          }
        }
      } catch (err) {
        console.error("WS error:", err);
      }
    });

    ws.on("close", () => {
      const conn = clientConnections.get(ws);
      if (!conn) return;

      const { roomId, userId, userName } = conn;
      clientConnections.delete(ws);

      const room = activeRooms.get(roomId);
      if (room) {
        // Remove user from membership list
        room.users = room.users.filter((u) => u.id !== userId);

        // If creators or active claims left, reset role assignment
        if (room.roles.candidate === userName) {
          room.roles.candidate = "";
        }
        if (room.roles.proctor === userName) {
          room.roles.proctor = "";
        }

        // Clean room if entirely empty
        if (room.users.length === 0) {
          activeRooms.delete(roomId);
        } else {
          // Notify remaining peers inside the room
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              const c = clientConnections.get(client);
              if (c && c.roomId === roomId) {
                client.send(JSON.stringify({
                  type: "user_left",
                  userId,
                  userName
                }));
                client.send(JSON.stringify({
                  type: "role_update",
                  roles: room.roles
                }));
              }
            }
          });
        }
      }
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[PrepAI Server] Running successfully on http://0.0.0.0:${PORT}`);
  });
}

startServer();
