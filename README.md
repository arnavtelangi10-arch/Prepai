# PrepAI

AI-powered interview preparation platform with mock interviews, coding practice, career coaching, and more.

## Run locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   copy .env.example .env
   ```
   On macOS/Linux: `cp .env.example .env`

3. Edit `.env` and set at minimum:
   - `GEMINI_API_KEY` — from [Google AI Studio](https://aistudio.google.com/apikey)

4. Start the dev server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000

## Enable real Google Sign-In (Firebase)

By default, Google login uses a demo sandbox. To enable **real Google accounts**:

### 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. **Add project** → name it (e.g. `prepai`)
3. **Build → Authentication → Sign-in method** → enable **Google**
4. **Build → Firestore Database** → create database (production mode)

### 2. Deploy Firestore security rules

Copy `firestore.rules` into Firebase Console → Firestore → **Rules** → Publish.

Or with Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

### 3. Register a web app

1. Firebase → **Project settings** → **Your apps** → add **Web** app
2. Copy the `firebaseConfig` values into your `.env` file:

```env
VITE_FIREBASE_API_KEY="..."
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="..."
VITE_FIREBASE_APP_ID="..."
```

3. **Authentication → Settings → Authorized domains** — add:
   - `localhost`
   - Your deploy URL (e.g. `your-app.onrender.com`)

4. Restart the dev server: `npm run dev`

Google Sign-In will now open the real Google account picker.

## Deploy to Render (free tier)

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New → Blueprint** or **Web Service**
3. Connect the GitHub repo
4. Settings (if not using `render.yaml`):
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm start`
5. Add environment variables (same as `.env`, especially `GEMINI_API_KEY` and all `VITE_FIREBASE_*` vars)
6. Add your Render URL to Firebase **Authorized domains**
7. Deploy

> **Note:** `VITE_*` variables must be set in Render **before** the build runs — they are baked into the frontend at build time.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (frontend + API) |
| `npm run build` | Production build |
| `npm start` | Run production server |
| `npm run lint` | TypeScript check |

## Repository

https://github.com/arnavtelangi10-arch/Prepai
