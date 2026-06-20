import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Swords, Eye, Mail, Lock, Shield, Sparkles, UserPlus } from 'lucide-react';
import { COMPANIONS_AVATARS } from '../data/rpgAssets';
import { validateUsername } from '../lib/usernameValidator';

interface LoginViewProps {
  initialIsSignUp?: boolean;
  onBackToLanding?: () => void;
}

export default function LoginView({ initialIsSignUp = false, onBackToLanding }: LoginViewProps) {
  const { loginWithEmail, registerWithEmail, loginWithGoogle, isFirebase, forgotPassword } = useAuth();
  const [isSignUp, setIsSignUp] = useState(initialIsSignUp);
  
  // Form input states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Feedback states
  const [errorText, setErrorText] = useState('');
  const [infoText, setInfoText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Forgot Password modal states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatusText, setResetStatusText] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  // Sign up companion select
  const [selectedAvatarIdx, setSelectedAvatarIdx] = useState(3); // Valkyrie default

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setErrorText('');
    setInfoText('');
    setSubmitting(true);

    try {
      if (isSignUp) {
        if (!username.trim()) {
          setErrorText('Please specify your RPG character name.');
          setSubmitting(false);
          return;
        }
        if (!validateUsername(username.trim())) {
          setErrorText('This username is not allowed. Please choose another one.');
          setSubmitting(false);
          return;
        }
        await registerWithEmail(username.trim(), email.trim(), password);
        setInfoText('✓ Character registered! Please check your inbox for verification protocols.');
      } else {
        await loginWithEmail(email.trim(), password);
      }
    } catch (err: any) {
      if (isSignUp) {
        const msg = err.message || '';
        if (msg.includes('auth/operation-not-allowed') || msg.includes('operation-not-allowed')) {
          setErrorText('⚠️ Email/Password login is not enabled in your Firebase Console! To enable: Go to Firebase Console -> Authentication -> Sign-in method -> Add new provider -> select "Email/Password", toggle "Enable", and click "Save". Once enabled, registration will work instantly!');
        } else {
          setErrorText(msg || 'Verification failure under authorized channels.');
        }
      } else {
        const msg = err.message || '';
        if (msg.includes('auth/operation-not-allowed') || msg.includes('operation-not-allowed')) {
          setErrorText('⚠️ Email/Password login is not enabled in your Firebase Console! To enable: Go to Firebase Console -> Authentication -> Sign-in method -> Add new provider -> select "Email/Password", toggle "Enable", and click "Save". Once enabled, registration will work instantly!');
        } else {
          // If login fails (wrong email, password, user not found, or any invalid format/creds),
          // show a safe, clear, generic error message and keep the user on the login screen.
          setErrorText('Incorrect email or password');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorText('');
    setInfoText('');
    setSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setErrorText(err.message || 'Google link connection coordinates offline.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetStatusText(null);
    setResetLoading(true);
    try {
      await forgotPassword(resetEmail.trim());
      setResetStatusText({
        type: 'success',
        message: 'Password reset email sent. Check your inbox.'
      });
    } catch (err: any) {
      console.warn("[LoginView WARNING] forgotPassword failed:", err);
      // Show requested safe message to avoid disclosing account existence
      setResetStatusText({
        type: 'success', // Show safe info message layout
        message: 'If this account exists, a reset email has been sent.'
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#050512] cyber-grid relative overflow-hidden">
      
      {onBackToLanding && (
        <button 
          onClick={onBackToLanding}
          className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/5 bg-black/40 hover:bg-slate-905 hover:border-indigo-500/40 text-slate-400 hover:text-white font-mono text-[9px] uppercase font-bold tracking-wider transition-all z-10 cursor-pointer text-left"
        >
          ← Back to Landing
        </button>
      )}

      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-lg rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col items-center">
        
        {/* Glow accent top bar */}
        <div className="absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r from-transparent via-indigo-500 to-purple-500"></div>

        {/* Console Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <Swords className="w-7 h-7 text-indigo-400 animate-bounce" />
            <h1 className="font-display font-black text-3xl tracking-wider text-glow-blue text-white uppercase">
              Anavare
            </h1>
          </div>
          <p className="font-mono text-[10px] uppercase text-indigo-400 tracking-widest block font-bold">
            Real-Life Gamification Interface v2.5
          </p>
          <span className="font-sans text-xs text-slate-400 mt-2 block">
            Treat your habits, studies, and health goals like an epic roleplaying game.
          </span>
        </div>

        {/* FEEDBACK LABELS */}
        {errorText && (
          <div className="w-full mb-4 p-3 rounded-lg bg-rose-950/20 border border-rose-500/25 text-rose-300 font-sans text-xs flex items-center gap-2">
            <Shield className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorText}</span>
          </div>
        )}

        {infoText && (
          <div className="w-full mb-4 p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/25 text-emerald-300 font-sans text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{infoText}</span>
          </div>
        )}

        {/* SUB-FORMS CONTAINER */}
        <form onSubmit={handleAuthSubmit} className="w-full flex flex-col gap-4">
          
          {/* Email + Pass Controls */}
          <div className="space-y-3">
            
            {/* Username for sign up only */}
            {isSignUp && (
              <div>
                <label className="block text-[9px] font-mono uppercase text-slate-400 mb-1">CHARACTER NAME (USERNAME)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500">
                    🧬
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter adventurer name..."
                    className="w-full pl-9 pr-4 py-2 bg-black/50 rounded-lg border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyber-blue outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[9px] font-mono uppercase text-slate-400 mb-1">EMAIL ADDRESS</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-600" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter contact coordinates..."
                  className="w-full pl-9 pr-4 py-2 bg-black/50 rounded-lg border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyber-blue outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-mono uppercase text-slate-400 mb-1">PASS KEY</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-600" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password passkey..."
                  className="w-full pl-9 pr-4 py-2 bg-black/50 rounded-lg border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyber-blue outline-none"
                />
              </div>
              {!isSignUp && (
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email || '');
                      setResetStatusText(null);
                      setShowForgotModal(true);
                    }}
                    className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 hover:underline transition-colors cursor-pointer outline-none"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* SATELLITE AVATAR PICKER FOR NEW CHARACTER REGISTRATION */}
          {isSignUp && (
            <div className="p-3.5 rounded-lg border border-slate-800 bg-black/35">
              <span className="block text-[9px] font-mono uppercase text-slate-400 mb-2">INITIAL COMPANION PORTRAIT</span>
              <div className="grid grid-cols-6 gap-2">
                {COMPANIONS_AVATARS.map((av, idx) => {
                  const isChosen = selectedAvatarIdx === idx;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setSelectedAvatarIdx(idx)}
                      id={`setup-avatar-${av.id}`}
                      className={`relative aspect-square rounded overflow-hidden border transition-all ${
                        isChosen ? 'border-cyber-blue scale-105 shadow-[0_0_8px_rgba(0,240,255,0.4)]' : 'border-slate-800 opacity-60'
                      }`}
                    >
                      <img
                        src={av.url}
                        alt={av.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form Trigger Submission button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-[40px] font-display font-black text-xs uppercase clip-cyber bg-gradient-to-r from-indigo-500 to-purple-600 text-white cursor-pointer transition-all active:scale-95 shadow-[0_0_15px_rgba(99,102,241,0.4)] disabled:opacity-40"
          >
            {submitting 
              ? 'TRANSMITTING COILS...' 
              : isSignUp 
                ? 'CREATE CHARACTER AVATAR' 
                : 'INITIATE PLAY CONSOLE'
            }
          </button>
        </form>

        {/* Separator block */}
        <div className="relative w-full text-center my-4">
          <div className="absolute inset-y-1/2 inset-x-0 h-[1px] bg-white/5"></div>
          <span className="relative px-3 bg-[#050512] text-slate-500 font-mono text-[9px] uppercase">or connect with credentials</span>
        </div>

        {/* GOOGLE SIGN IN LINK AND SANDBOX BYPASS TRIGGER */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={handleGoogleAuth}
            disabled={submitting}
            id="login-google-btn"
            className="w-full py-2.5 rounded-lg border border-white/10 bg-white/5 text-xs font-mono lowercase tracking-wide hover:border-indigo-400/50 hover:bg-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer outline-none"
          >
            <span className="text-glow-blue uppercase font-bold text-[10px] text-indigo-400">
              {isFirebase ? '🌐 CONNECT WITH GOOGLE AUTH' : '🚀 BYPASS SYSTEM / PLAY MOCK DEMO'}
            </span>
          </button>
          
          {/* SANDBOX ENVIRONMENT CLARIFIER LOG */}
          {!isFirebase && (
            <div className="p-3 bg-cyan-950/15 rounded-lg border border-cyan-500/10 text-[10px] text-slate-400 text-center font-sans leading-relaxed">
              💡 <span className="text-cyan-400 font-medium">Auto-detection:</span> Local development environment. Clicking <span className="text-white font-bold">Bypass System</span> immediately launches the RPG platform using local persistent state. Play instantly without configuring credentials!
            </div>
          )}
        </div>

        {/* Alternate registration view tabs */}
        <div className="mt-6 text-[11px] font-sans text-slate-400 text-center">
          {isSignUp ? (
            <p>
              Already activated a coordinates profile?{' '}
              <button 
                onClick={() => { setIsSignUp(false); setErrorText(''); setInfoText(''); }} 
                id="toggle-auth-login-view"
                className="text-indigo-400 hover:underline uppercase font-mono font-bold text-[10px] tracking-wider ml-1"
              >
                Initalize Login
              </button>
            </p>
          ) : (
            <p>
              First visit to Anavare territory?{' '}
              <button 
                onClick={() => { setIsSignUp(true); setErrorText(''); setInfoText(''); }}
                id="toggle-auth-signup-view"
                className="text-pink-400 hover:underline uppercase font-mono font-bold text-[10px] tracking-wider ml-1"
              >
                Assemble Avatar
              </button>
            </p>
          )}
        </div>

      </div>

      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-xl bg-[#09091e] border border-slate-800 p-6 shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden">
            {/* Glow accent top bar */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-indigo-500 to-pink-500"></div>

            <div className="mb-4">
              <h3 className="font-display font-black text-base uppercase text-glow-blue text-white tracking-wider flex items-center gap-1.5">
                🌌 Recover Pass Key
              </h3>
              <p className="font-sans text-[11px] text-slate-400 mt-1">
                Enter your registered contact coordinates below to transmit a secure reset password sequence.
              </p>
            </div>

            {resetStatusText && (
              <div className={`mb-4 p-3 rounded-lg text-xs flex items-start gap-2 border ${
                resetStatusText.type === 'error' 
                  ? 'bg-rose-950/20 border-rose-500/25 text-rose-300' 
                  : 'bg-emerald-950/20 border-emerald-500/25 text-emerald-300'
              }`}>
                <span className="shrink-0">
                  {resetStatusText.type === 'error' ? '⚠️' : '✓'}
                </span>
                <span className="font-sans leading-normal">{resetStatusText.message}</span>
              </div>
            )}

            <form onSubmit={handleSendReset} className="space-y-4">
              <div>
                <label className="block text-[9px] font-mono uppercase text-slate-400 mb-1">EMAIL ADDRESS</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-600" />
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter email address..."
                    className="w-full pl-9 pr-4 py-2 bg-black/60 rounded-lg border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyber-blue outline-none animate-pulse-subtle"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 py-2 rounded-lg border border-slate-800 hover:border-slate-700 bg-transparent text-slate-400 hover:text-white font-mono text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-mono text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer shadow-[0_0_10px_rgba(99,102,241,0.35)] disabled:opacity-40 outline-none"
                >
                  {resetLoading ? 'TRANSMITTING...' : 'SEND RESET'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
