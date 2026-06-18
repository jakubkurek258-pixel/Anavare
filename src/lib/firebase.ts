import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Support both environment variables (required for Vercel) and the JSON fallback file
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigJson.measurementId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId || "(default)"
};

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
  };
}

// Check if it's the default mock configuration
export const isMockConfig =
  !firebaseConfig.apiKey ||
  firebaseConfig.apiKey.includes('mock-api-key') ||
  firebaseConfig.projectId === 'mock-project';

let app;
let dbInstance: any = null;
let authInstance: any = null;
let storageInstance: any = null;

if (!isMockConfig) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    // Enabling forced long polling to bypass proxy websocket/HTTP2 streaming constraints and eliminate transmission timeout errors.
    const firestoreSettings = {
      experimentalForceLongPolling: true,
      useFetchStreams: false
    };

    const dbId = firebaseConfig.firestoreDatabaseId;
    dbInstance = (dbId && dbId !== '(default)' && dbId !== 'default')
      ? initializeFirestore(app, firestoreSettings, dbId)
      : initializeFirestore(app, firestoreSettings);
    
    authInstance = getAuth(app);
    storageInstance = getStorage(app);
    console.log("Firebase initialized successfully with real credentials and forced long-polling.");
  } catch (error) {
    console.warn("Failed to initialize Firebase SDK, falling back to local mode:", error);
  }
} else {
  console.log("Anavare initializing in local-first sandbox mode (Firebase keys not provided).");
}

export const db = dbInstance;
export const auth = authInstance;
export const storage = storageInstance;
export const isFirebaseEnabled = !isMockConfig && dbInstance !== null && authInstance !== null && storageInstance !== null;

// Mandatory Error Handling wrapper conforming strictly to the platform specs
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentAuth = authInstance;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth?.currentUser?.uid || null,
      email: currentAuth?.currentUser?.email || null,
      emailVerified: currentAuth?.currentUser?.emailVerified || null,
      isAnonymous: currentAuth?.currentUser?.isAnonymous || null,
      tenantId: currentAuth?.currentUser?.tenantId || null,
      providerInfo: currentAuth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Raised: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
