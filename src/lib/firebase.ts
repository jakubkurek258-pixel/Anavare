import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, logEvent, isSupported } from 'firebase/analytics';
import firebaseConfigJson from '../../firebase-applet-config.json';


declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

// Support environment variables (required for secure deployment) and fallbacks to the applet config JSON, with safe mock fallbacks for local-first testing
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey || "mock-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain || "mock-auth-domain",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId || "mock-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket || "mock-storage-bucket",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId || "mock-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId || "mock-app-id",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigJson.measurementId || "mock-measurement-id",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId || "(default)"
};

console.log("[ENV DEBUG]", {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  resolvedApiKey: firebaseConfig.apiKey
});

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
  firebaseConfig.apiKey === 'mock-api-key' ||
  firebaseConfig.projectId === 'mock-project';

export let app: any = null;
export let analytics: any = null;
let dbInstance: any = null;
let authInstance: any = null;
let storageInstance: any = null;

let gtagInitialized = false;

function initGtag(measurementId: string) {
  if (typeof window === 'undefined') {
    console.warn("[Analytics] Analytics not supported in this environment");
    return;
  }
  
  if (gtagInitialized) return;

  try {
    // 1. Initialize dataLayer and gtag function
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer!.push(arguments);
    };

    // 2. Configure default options and debug_mode for DebugView/Realtime
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      cookie_flags: 'max-age=7200;Secure;SameSite=None', // Critical for iframe/sandboxes (Google AI Studio preview runs in an iframe)
      debug_mode: true, // Forces immediate dispatch and appears in GA4 DebugView
      send_page_view: true
    });

    // 3. Inject the standard GA4 gtag.js script from Google CDN
    const scriptId = 'google-analytics-gtag-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      
      script.onload = () => {
        console.log("[Analytics] Initialized successfully");
        // Trigger a guaranteed test event on load for Realtime & DebugView verification
        trackEvent('app_analytics_init', { timing: 'on_successful_script_load' });
      };
      script.onerror = (err) => {
        console.error(`[Analytics] Failed to load gtag.js script from Google tagmanager CDN. Error:`, err);
      };
      
      document.head.appendChild(script);
    } else {
      console.log("[Analytics] Initialized successfully");
    }

    gtagInitialized = true;
  } catch (err) {
    console.error("[Analytics] Error during GA4 gtag initialization:", err);
  }
}

// Safe browser-only tag initialization regardless of Firebase database mock status
if (typeof window !== 'undefined') {
  if (firebaseConfig.measurementId && firebaseConfig.measurementId !== 'mock') {
    initGtag(firebaseConfig.measurementId);
  } else {
    console.warn("[Analytics] Analytics not supported in this environment");
  }
} else {
  console.warn("[Analytics] Analytics not supported in this environment");
}

if (!isMockConfig) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    console.log("[Firebase] Core App initialized successfully.");
    
    // Enabling forced long polling to bypass proxy websocket/HTTP2 streaming constraints and eliminate transmission timeout errors.
    const firestoreSettings = {
      experimentalForceLongPolling: true,
      useFetchStreams: false
    };

    const dbId = firebaseConfig.firestoreDatabaseId;
    try {
      dbInstance = (dbId && dbId !== '(default)' && dbId !== 'default')
        ? initializeFirestore(app, firestoreSettings, dbId)
        : initializeFirestore(app, firestoreSettings);
      console.log("[Firebase] Firestore database initialized successfully.");
    } catch (dbError) {
      console.error("[Firebase ERROR] Failed to initialize Firestore database:", dbError);
    }
    
    try {
      authInstance = getAuth(app);
      setPersistence(authInstance, browserLocalPersistence).then(() => {
        console.log("[Firebase] Auth persistence set to browserLocalPersistence successfully.");
      }).catch((err) => {
        console.warn("[Firebase] Failed to set Firebase Auth persistence to browserLocalPersistence:", err);
      });
      console.log("[Firebase] Auth initialized successfully.");
    } catch (authError) {
      console.error("[Firebase ERROR] Failed to initialize Firebase Auth:", authError);
    }

    try {
      storageInstance = getStorage(app);
      console.log("[Firebase] Storage initialized successfully.");
    } catch (storageError) {
      console.warn("[Firebase WARNING] Storage not initialized (may be disabled/restricted in the project):", storageError);
    }

    // Safe browser-only Firebase Analytics SDK companion registration
    if (typeof window !== 'undefined') {
      isSupported().then((supported) => {
        if (supported && app) {
          try {
            analytics = getAnalytics(app);
            console.log("[Analytics] Firebase Analytics companion registered successfully.");
          } catch (e) {
            console.warn("[Analytics] Firebase getAnalytics failed, relying fully on direct gtag.js client.", e);
          }
        }
      }).catch((err) => {
        console.warn("[Analytics] Could not check if Firebase Analytics companion supported:", err);
      });
    }
  } catch (error) {
    console.warn("Failed to initialize Firebase SDK, falling back to local mode:", error);
  }
} else {
  console.log("Anavare initializing in local-first sandbox mode (Firebase keys not provided or mock-api-key detected).");
}

export const db = dbInstance;
export const auth = authInstance;
export const storage = storageInstance;
export const isFirebaseEnabled = !isMockConfig && dbInstance !== null && authInstance !== null;
export const isAuthEnabled = !isMockConfig && authInstance !== null;

// Reusable helper function for tracking analytics events
export function trackEvent(eventName: string, params?: object) {
  const enrichParams = {
    ...(params || {}),
    timestamp: new Date().toISOString(),
    environment: import.meta.env.MODE || 'development',
    window_location: typeof window !== 'undefined' ? window.location.href : 'ssr',
    is_iframe: typeof window !== 'undefined' ? (window.self !== window.top) : false
  };

  let sentViaGtag = false;
  let sentViaFirebase = false;

  // 1. Try sending via direct gtag.js first (most reliable, sandbox/cookie compliant)
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    try {
      window.gtag('event', eventName, enrichParams);
      sentViaGtag = true;
    } catch (error) {
      console.error(`[Analytics] Error tracking event via standard gtag for "${eventName}":`, error);
    }
  }

  // 2. Try tracking via Firebase Analytics package
  if (analytics) {
    try {
      logEvent(analytics, eventName, enrichParams);
      sentViaFirebase = true;
    } catch (error) {
      console.error(`[Analytics] Error tracking event via Firebase SDK wrapper for "${eventName}":`, error);
    }
  }

  if (sentViaGtag || sentViaFirebase) {
    console.log(`[Analytics] Event sent: ${eventName}`, enrichParams);
  } else {
    // Fallback logging if analytics is disabled / blocked / not supported
    console.warn(`[Analytics] Analytics disabled or blocked. Fallback tracked locally: "${eventName}"`, enrichParams);
  }
}

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
