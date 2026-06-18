import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup, 
  GoogleAuthProvider,
  sendEmailVerification,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, isFirebaseEnabled } from '../lib/firebase';
import { UserProfile } from '../types';
import { stateService } from '../lib/stateService';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [localAuthId, setLocalAuthId] = useState<string | null>(() => localStorage.getItem('anavare_auth_uid'));
  const [loading, setLoading] = useState(true);

  const activeUid = isFirebaseEnabled ? (firebaseUser?.uid || null) : localAuthId;

  // Listen to Firebase Auth state change only
  useEffect(() => {
    console.log("[AuthContext INFO] Initializing onAuthStateChanged. isFirebaseEnabled:", isFirebaseEnabled);
    if (isFirebaseEnabled && auth) {
      const unsubAuth = auth.onAuthStateChanged((fUser) => {
        console.log("[AuthContext INFO] onAuthStateChanged fired. User:", fUser ? fUser.email : "null", "UID:", fUser?.uid);
        
        // Always sync the firebaseUser reference
        setFirebaseUser(fUser);
        
        if (!fUser) {
          console.log("[AuthContext SUCCESS] No Firebase session found. Resetting state.");
          setUser(null);
          setLoading(false);
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

  // Synchronize user profile subscriptions
  useEffect(() => {
    let active = true;
    let unsubscribeUser: (() => void) | null = null;

    console.log("[AuthContext INFO] Subscription Effect evaluation. activeUid:", activeUid, "firebaseUser UID:", firebaseUser?.uid);

    if (activeUid) {
      console.log("[AuthContext INFO] Player activeUid detected. Starting subscription & setting loading=true");
      setLoading(true);
      
      unsubscribeUser = stateService.subscribeToUser(activeUid, async (profile) => {
        if (!active) {
          console.log("[AuthContext INFO] Subscription fired after unmount. Ignoring update.");
          return;
        }

        console.log("[AuthContext INFO] subscribeToUser snapshot emitted. Profile retrieved:", profile ? profile.username : "null");

        if (profile) {
          console.log("[AuthContext SUCCESS] Profile loaded successfully for user:", profile.username);
          setUser(profile);
          setLoading(false);
        } else if (isFirebaseEnabled && firebaseUser) {
          console.log("[AuthContext WARNING] Profile does not exist yet for Firebase User:", firebaseUser.uid, "Creating default profile...");
          try {
            const usernameOfEmail = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Warrior';
            const newProf = await stateService.createUserProfile({
              id: firebaseUser.uid,
              username: usernameOfEmail,
              email: firebaseUser.email || '',
              avatar: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&q=80',
            });
            
            if (active) {
              console.log("[AuthContext SUCCESS] Default profile created successfully in state:", newProf.username);
              setUser(newProf);
            }
          } catch (err) {
            console.error('[AuthContext ERROR] Failed to create user profile dynamically in Firestore:', err);
          } finally {
            if (active) {
              setLoading(false);
            }
          }
        } else {
          console.log("[AuthContext WARNING] No snapshot profile and not live Firebase session. Cleaning up emulator state.");
          localStorage.removeItem('anavare_auth_uid');
          if (active) {
            setLocalAuthId(null);
            setUser(null);
            setLoading(false);
          }
        }
      });
    } else {
      console.log("[AuthContext INFO] No active Uid found. Clearing user and setting loading=false.");
      setUser(null);
      setLoading(false);
    }

    return () => {
      console.log("[AuthContext INFO] Cleaning up active subscriber for:", activeUid || "none");
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
        console.log("[AuthContext INFO] Authenticating with Live Firebase...");
        const result = await signInWithEmailAndPassword(auth, email, pass);
        console.log("[AuthContext SUCCESS] Firebase authentication completed.", result.user.uid);
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
    setLoading(true);
    try {
      if (isFirebaseEnabled && auth) {
        console.log("[AuthContext INFO] Creating credentials on Live Firebase auth...");
        const credentials = await createUserWithEmailAndPassword(auth, email, pass);
        if (credentials.user) {
          console.log("[AuthContext SUCCESS] Live Firebase credentials created. Provisioning user profile document in Firestore...");
          // We immediately write the custom username specified during registration to ensure accuracy
          const newProfile = await stateService.createUserProfile({
            id: credentials.user.uid,
            username: username.trim() || 'Warrior',
            email: email.trim(),
            avatar: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=150&q=80',
          });
          console.log("[AuthContext SUCCESS] Firestore profile created:", newProfile);
          
          try {
            await sendEmailVerification(credentials.user);
            console.log("[AuthContext SUCCESS] Verification protocol dispatched.");
          } catch (verifErr) {
            console.warn("[AuthContext WARNING] Dispatched email protocol warning:", verifErr);
          }
        }
      } else {
        console.log("[AuthContext INFO] Registrating custom user inside Emulator Database...");
        const users = JSON.parse(localStorage.getItem('anavare_users') || '{}');
        if (Object.values(users).some((u: any) => u.email === email)) {
          throw new Error('E-mail already exists in local database!');
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
        console.log("[AuthContext SUCCESS] Google pop-up credentials received:", credentials.user.uid);
      } else {
        console.log("[AuthContext INFO] Emulating Google login connection...");
        localStorage.setItem('anavare_auth_uid', 'mock_hero_id');
        setLocalAuthId('mock_hero_id');
      }
    } catch (err) {
      console.error("[AuthContext ERROR] Google link failure:", err);
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
      setProfileAvatar
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
