import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup, 
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, isFirebaseEnabled, isAuthEnabled } from '../lib/firebase';
import { UserProfile } from '../types';
import { stateService } from '../lib/stateService';
import { validateUsername } from '../lib/usernameValidator';
import { antiSpam } from '../lib/antiSpam';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isFirebase: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (username: string, email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setProfileAvatar: (avatarUrl: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [localAuthId, setLocalAuthId] = useState<string | null>(() => localStorage.getItem('anavare_auth_uid'));
  const [loading, setLoading] = useState(true);

  const isRegisteringRef = useRef(false);

  const activeUid = isFirebaseEnabled ? (firebaseUser?.uid || null) : localAuthId;

  // Listen to Firebase Auth state change only
  useEffect(() => {
    console.log("[AuthContext INFO] Initializing onAuthStateChanged. isFirebaseEnabled:", isFirebaseEnabled);
    if (isFirebaseEnabled && auth) {
      const unsubAuth = auth.onAuthStateChanged((fUser) => {
        console.log("[AuthContext INFO] onAuthStateChanged fired. User:", fUser ? fUser.email : "null", "UID:", fUser?.uid);
        
        // Sync the firebaseUser reference immediately to prevent UI lag
        setFirebaseUser(fUser);
        
        if (!fUser) {
          console.log("[AuthContext SUCCESS] No Firebase session found. Resetting state.");
          setUser(null);
          setLoading(false);
        } else {
          // Perform reload in the background without delaying the authentication state propagation
          if (!isRegisteringRef.current) {
            fUser.reload().then(() => {
              console.log("[AuthContext INFO] User reload completed in background successfully.");
              // Refresh firebase user reference after reload to get up-to-date fields like emailVerified
              setFirebaseUser(auth.currentUser);
            }).catch((e) => {
              console.warn("[AuthContext WARNING] Could not reload user in background:", e);
            });
          }
        }
      });
      return unsubAuth;
    } else {
      console.log("[AuthContext INFO] Running in non-Firebase local emulator mode. localAuthId:", localAuthId);
      if (!localAuthId) {
        console.log("[AuthContext SUCCESS] No local emulator session. Resetting state.");
        setUser(null);
        setLoading(false);
      }
    }
  }, [localAuthId]);

  // Reset anti-spam cache whenever user logs out, logins or changes
  useEffect(() => {
    if (activeUid) {
      antiSpam.resetForUser(activeUid);
    } else {
      antiSpam.resetAll();
    }
  }, [activeUid]);

  // Synchronize user profile subscriptions
  useEffect(() => {
    let active = true;
    let unsubscribeUser: (() => void) | null = null;

    console.log("[AuthContext INFO] Subscription Effect evaluation. activeUid:", activeUid, "firebaseUser UID:", firebaseUser?.uid);

    const uid = activeUid;
    // Safeguard: Only run onSnapshot when uid exists
    if (!uid) {
      setUser(null);
      setLoading(false);
      return;
    }

    console.log("[AuthContext INFO] Player activeUid verified. Starting safe subscription & setting loading=true. UID:", uid);
    setLoading(true);
    
    unsubscribeUser = stateService.subscribeToUser(uid, async (profile) => {
      if (!active) {
        console.log("[AuthContext INFO] Subscription fired after unmount. Ignoring update.");
        return;
      }

      console.log("[AuthContext INFO] subscribeToUser snapshot emitted. Profile retrieved:", profile ? profile.username : "null");

      if (profile) {
        console.log("[AuthContext SUCCESS] Profile loaded successfully for user:", profile.username);
        setUser(profile);
        setLoading(false);
      } else {
        console.warn("[AuthContext WARNING] Snapshot user profile is empty (null) for UID:", uid);
        
        // If registration is active, we don't clear user or set loading=false yet, because the document is being provisioned
        if (isRegisteringRef.current) {
          console.log("[AuthContext INFO] Registration is currently in progress. Postponing state reset.");
          return;
        }

        if (!isFirebaseEnabled) {
          console.log("[AuthContext INFO] Dynamic local cleanup sequence triggered.");
          localStorage.removeItem('anavare_auth_uid');
          if (active) {
            setLocalAuthId(null);
            setUser(null);
            setLoading(false);
          }
        } else {
          if (active) {
            setUser(null);
            setLoading(false);
          }
        }
      }
    });

    return () => {
      console.log("[AuthContext INFO] Cleaning up active subscriber for:", uid);
      active = false;
      if (unsubscribeUser) {
        unsubscribeUser();
      }
    };
  }, [activeUid, firebaseUser]);

  const loginWithEmail = async (email: string, pass: string) => {
    console.log("[AuthContext ACTION] User submitted Login. Email:", email);
    setLoading(true);
    try {
      if (isFirebaseEnabled && auth) {
        console.log("[AuthContext INFO] Authenticating with Live Firebase. Email used:", email);
        const result = await signInWithEmailAndPassword(auth, email, pass);
        console.log("[AuthContext SUCCESS] Firebase authentication completed. UID:", result.user.uid);
        
        // After login, attempt to reload user to get correct emailVerified state, but never block or crash if reload fails
        try {
          await result.user.reload();
          console.log("[AuthContext INFO] User reload completed successfully after login.");
        } catch (reloadErr) {
          console.warn("[AuthContext WARNING] Failed to reload user after login:", reloadErr);
        }
        setFirebaseUser(auth.currentUser || result.user);
      } else {
        console.log("[AuthContext INFO] Authenticating with Local Emulator database...");
        const users = JSON.parse(localStorage.getItem('anavare_users') || '{}');
        const found = Object.values(users).find((u: any) => u.email === email) as UserProfile | undefined;
        if (found) {
          console.log("[AuthContext SUCCESS] Local emulator user authenticated.", found.id);
          localStorage.setItem('anavare_auth_uid', found.id);
          setLocalAuthId(found.id);
        } else {
          throw new Error('Character email not found in local database. Please proceed to Sign Up to create your RPG avatar.');
        }
      }
    } catch (err) {
      console.error("[AuthContext ERROR] Login with email failed:", err);
      setLoading(false);
      throw err;
    }
  };

  const registerWithEmail = async (username: string, email: string, pass: string) => {
    console.log("[AuthContext ACTION] User submitted Registration. Username:", username, "Email:", email);
    
    if (!validateUsername(username)) {
      throw new Error("This username is not allowed. Please choose another one.");
    }

    setLoading(true);
    isRegisteringRef.current = true;
    try {
      if (isFirebaseEnabled && auth) {
        console.log("[AuthContext INFO] Creating credentials on Live Firebase auth...");
        let credentials;
        try {
          credentials = await createUserWithEmailAndPassword(auth, email, pass);
        } catch (firebaseErr: any) {
          if (firebaseErr && (firebaseErr.code === 'auth/email-already-in-use' || String(firebaseErr.message || '').includes('email-already-in-use'))) {
            throw new Error("An account with this email already exists.");
          }
          throw firebaseErr;
        }

        if (credentials && credentials.user) {
          const user = credentials.user;
          console.log("[AuthContext SUCCESS] Live Firebase credentials created for user CID:", user.uid);
          
          // Wait for auth to transition and sync with current user state explicitly if delayed
          let syncWait = 0;
          while (syncWait < 20 && (!auth.currentUser || auth.currentUser.uid !== user.uid)) {
            await new Promise((resolve) => setTimeout(resolve, 50));
            syncWait++;
          }

          // Force Firebase Auth to initialize and cache the initial ID Token
          // This ensures that downstream SDK calls recognize the authenticated context
          await user.getIdToken(true);
          
          // Introduce a strategic, controlled brief delay (800ms) to allow 
          // the Auth context session state to fully propagate to the local Firestore instance client.
          // This guarantees request.auth.uid !== null when writing `/users/{userId}`.
          await new Promise((resolve) => setTimeout(resolve, 800));

          console.log("[AuthContext INFO] Handshaking active. Proceeding with user profile document provisioning in Firestore...");

          // We immediately write the custom username specified during registration to ensure accuracy
          const newProfile = await stateService.createUserProfile({
            id: user.uid,
            username: username.trim() || 'Warrior',
            email: email.trim(),
            avatar: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=150&q=80',
          });
          console.log("[AuthContext SUCCESS] Firestore profile created successfully:", newProfile);
          
          try {
            await sendEmailVerification(user);
            console.log("[AuthContext SUCCESS] Verification protocol dispatched.");
          } catch (verifErr) {
            console.warn("[AuthContext WARNING] Dispatched email protocol warning:", verifErr);
          }

          setFirebaseUser(user);
        }
      } else {
        console.log("[AuthContext INFO] Registrating custom user inside Emulator Database...");
        const users = JSON.parse(localStorage.getItem('anavare_users') || '{}');
        if (Object.values(users).some((u: any) => u.email === email)) {
          throw new Error('An account with this email already exists.');
        }
        
        const customUid = 'user_' + Math.random().toString(36).substring(2, 11);
        const newProfile = await stateService.createUserProfile({
          id: customUid,
          username: username.trim() || 'NewbieWarrior',
          email: email.trim(),
          avatar: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=150&q=80',
        });
        console.log("[AuthContext SUCCESS] Local profile saved:", newProfile);
        localStorage.setItem('anavare_auth_uid', customUid);
        setLocalAuthId(customUid);
      }
    } catch (err) {
      console.error("[AuthContext ERROR] Registration failed:", err);
      setLoading(false);
      throw err;
    } finally {
      isRegisteringRef.current = false;
    }
  };

  const loginWithGoogle = async () => {
    console.log("[AuthContext ACTION] User clicked Login with Google.");
    setLoading(true);
    try {
      if (isFirebaseEnabled && auth) {
        console.log("[AuthContext INFO] Initializing Firebase Standard Google Auth Popup...");
        const provider = new GoogleAuthProvider();
        const credentials = await signInWithPopup(auth, provider);
        const user = credentials.user;
        console.log("[AuthContext SUCCESS] Google pop-up credentials received:", user.uid);
        
        // Wait for token synchronization
        await user.getIdToken(true);

        // Check if user profile already exists. SINGLE SOURCE OF TRUTH.
        const existingProfile = await stateService.getStaticUserProfile(user.uid);
        if (!existingProfile) {
          console.log("[AuthContext INFO] No existing Firestore profile found for Google user. Provisioning new profile now...");
          const rawUsername = user.displayName || user.email?.split('@')[0] || 'Warrior';
          // Clean username to strictly match /^[a-zA-Z0-9_]+$/
          const cleanedUsername = rawUsername.replace(/[^a-zA-Z0-9_]/g, '') || 'Warrior';
          let finalUsername = cleanedUsername.substring(0, 20);
          if (finalUsername.length < 3) {
            finalUsername = (finalUsername + '___').substring(0, 3);
          }
          await stateService.createUserProfile({
            id: user.uid,
            username: finalUsername,
            email: user.email || '',
            avatar: user.photoURL || 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=150&q=80',
          });
          console.log("[AuthContext SUCCESS] Google user profile created in Firestore successfully.");
        } else {
          console.log("[AuthContext INFO] Existing Firestore profile found for Google user. Profile creation skipped.");
        }
      } else {
        console.log("[AuthContext INFO] Emulating Google login connection...");
        localStorage.setItem('anavare_auth_uid', 'mock_hero_id');
        setLocalAuthId('mock_hero_id');
      }
    } catch (err) {
      console.error("[AuthContext ERROR] Google login failed:", err);
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    console.log("[AuthContext ACTION] Logging out current user session.");
    setLoading(true);
    try {
      if (isFirebaseEnabled && auth) {
        await signOut(auth);
        console.log("[AuthContext SUCCESS] Signed out from Live Firebase auth service.");
      } else {
        localStorage.removeItem('anavare_auth_uid');
        setLocalAuthId(null);
        console.log("[AuthContext SUCCESS] Cleared local emulator session ID.");
      }
    } catch (err) {
      console.error("[AuthContext ERROR] Sign out protocol failed:", err);
      setLoading(false);
      throw err;
    }
  };

  const resendVerification = async () => {
    if (isFirebaseEnabled && firebaseUser) {
      await sendEmailVerification(firebaseUser);
    } else {
      console.log('Verification sent! (Simulated local response)');
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const p = await stateService.getStaticUserProfile(user.id);
      if (p) setUser(p);
    }
  };

  const setProfileAvatar = async (avatarUrl: string) => {
    if (user) {
      await stateService.updateUserProfileFields(user.id, { avatar: avatarUrl });
    }
  };

  const sendPasswordReset = async (email: string) => {
    if (!email || !email.trim()) {
      throw new Error("Email address is required.");
    }
    console.log("[AuthContext ACTION] Initiating password reset request. Email:", email.trim());
    if (isAuthEnabled && auth) {
      try {
        await sendPasswordResetEmail(auth, email.trim());
        console.log("[AuthContext SUCCESS] Firebase sendPasswordResetEmail completed successfully. Email sent to:", email.trim());
      } catch (err: any) {
        console.error("[AuthContext ERROR] Firebase sendPasswordResetEmail failed. Email:", email.trim(), "Error Code:", err?.code, "Full Error:", err);
        throw err;
      }
    } else {
      console.error("[AuthContext ERROR] Cannot send password reset: Firebase Auth is not enabled or running in local mock mode.");
      throw new Error("Firebase Auth is running in local mock/sandbox mode. Real Firebase credentials must be configured to send actual reset emails.");
    }
  };

  const forgotPassword = async (email: string) => {
    await sendPasswordReset(email);
  };

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      loading,
      isFirebase: isFirebaseEnabled,
      loginWithEmail,
      registerWithEmail,
      loginWithGoogle,
      logout,
      resendVerification,
      refreshProfile,
      setProfileAvatar,
      sendPasswordReset,
      forgotPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used inside an AuthProvider.');
  }
  return context;
}
