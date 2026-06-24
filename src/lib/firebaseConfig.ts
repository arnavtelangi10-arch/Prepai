import fallbackConfig from "../../firebase-applet-config.json";

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

function fromEnv(): Partial<FirebaseClientConfig> {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
}

function isComplete(config: Partial<FirebaseClientConfig>): config is FirebaseClientConfig {
  return Boolean(
    config.apiKey &&
      config.authDomain &&
      config.projectId &&
      config.storageBucket &&
      config.messagingSenderId &&
      config.appId,
  );
}

export function resolveFirebaseConfig(): FirebaseClientConfig {
  const envConfig = fromEnv();
  if (isComplete(envConfig) && !envConfig.apiKey.includes("DummyKey")) {
    return envConfig;
  }
  return fallbackConfig as FirebaseClientConfig;
}

export function isDummyFirebaseConfig(config: FirebaseClientConfig): boolean {
  return !config.apiKey || config.apiKey.includes("DummyKey");
}
