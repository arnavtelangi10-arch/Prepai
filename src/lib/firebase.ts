import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

let app: any;
let auth: any;
let googleProvider: any;
let db: any;

try {
  // Safe initialization
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  // Select account prompt
  googleProvider.setCustomParameters({
    prompt: "select_account"
  });
  db = getFirestore(app);
} catch (error) {
  console.warn("Firebase failed to initialize. Relying on integrated OAuth fallback flow.", error);
}

export { app, auth, googleProvider, signInWithPopup, db, doc, getDoc, setDoc, updateDoc };
export { GoogleAuthProvider };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Checks if the firebase config is using the default placeholder dummy key.
 */
export function isDummyFirebaseConfig(): boolean {
  return !firebaseConfig.apiKey || firebaseConfig.apiKey.includes("DummyKey");
}

/**
 * Persists persistent user profile choices and history directly inside Cloud Firestore.
 */
export async function persistProfileToFirestore(userId: string, data: any) {
  if (!db || isDummyFirebaseConfig()) return;
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      ...data,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log(`Successfully persisted Firebase user data to Firestore for UID: ${userId}`);
  } catch (err) {
    console.warn("Could not save to active Firestore database:", err);
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Fetches the user profile from Cloud Firestore if available.
 */
export async function fetchProfileFromFirestore(userId: string): Promise<any | null> {
  if (!db || isDummyFirebaseConfig()) return null;
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      console.log(`Loaded persistent Firestore user profile for UID: ${userId}`);
      return snap.data();
    }
  } catch (err) {
    console.warn("Could not load from active Firestore database:", err);
    handleFirestoreError(err, OperationType.GET, path);
  }
  return null;
}
