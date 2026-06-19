import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginView from './components/LoginView';
import LandingView from './components/LandingView';
import DashboardView from './components/DashboardView';
import SkillProgressView from './components/SkillProgressView';
import CoursesView from './components/CoursesView';
import SocialFeedView from './components/SocialFeedView';
import LeaderboardView from './components/LeaderboardView';
import NotificationCenter from './components/NotificationCenter';
import AvatarPicker from './components/AvatarPicker';
import ProfileView from './components/ProfileView';
import AvatarImage from './components/AvatarImage';
import { 
  Gamepad2, Compass, GraduationCap, Users, Trophy, 
  LogOut, ShieldAlert, Swords, CircleCheck, Info, User
} from 'lucide-react';

function MasterGameConsole() {
  const { user, logout, isFirebase, firebaseUser, resendVerification } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'progress' | 'community' | 'profile'>('home');
  const [progressSubTab, setProgressSubTab] = useState<'skills' | 'academy'>('skills');
  const [communitySubTab, setCommunitySubTab] = useState<'feed' | 'leaderboard'>('feed');
  const [showAvatarPrompt, setShowAvatarPrompt] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);

  if (!user) return null;

  const handleNavigate = (tab: 'home' | 'progress' | 'community' | 'profile', subTab?: string) => {
    setActiveTab(tab);
    if (tab === 'progress' && subTab) {
      setProgressSubTab(subTab as 'skills' | 'academy');
    } else if (tab === 'community' && subTab) {
      setCommunitySubTab(subTab as 'feed' | 'leaderboard');
    }
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home': 
        return <DashboardView onNavigate={handleNavigate} />;
      case 'progress': 
        return (
          <div className="flex flex-col gap-6">
            {/* PROGRESS sub-tab segmented control */}
            <div className="flex bg-white/5 backdrop-blur-md p-1 border border-white/10 rounded-lg w-full max-w-sm select-none justify-evenly overflow-x-auto gap-1 self-start">
              {[
                { id: 'skills', label: 'Skill Trees', icon: <Compass className="w-3.5 h-3.5" /> },
                { id: 'academy', label: 'Academy', icon: <GraduationCap className="w-3.5 h-3.5" /> }
              ].map((subTab) => {
                const isActive = progressSubTab === subTab.id;
                return (
                  <button
                    key={subTab.id}
                    onClick={() => setProgressSubTab(subTab.id as any)}
                    className={`py-1.5 px-4 flex items-center gap-1.5 rounded-md font-display text-[11px] font-bold uppercase cursor-pointer transition-all outline-none ${
                      isActive 
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                        : 'text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    {subTab.icon}
                    <span>{subTab.label}</span>
                  </button>
                );
              })}
            </div>
            
            <div className="transition-all duration-300">
              {progressSubTab === 'skills' ? <SkillProgressView /> : <CoursesView />}
            </div>
          </div>
        );
      case 'community': 
        return (
          <div className="flex flex-col gap-6">
            {/* COMMUNITY sub-tab segmented control */}
            <div className="flex bg-white/5 backdrop-blur-md p-1 border border-white/10 rounded-lg w-full max-w-sm select-none justify-evenly overflow-x-auto gap-1 self-start">
              {[
                { id: 'feed', label: 'Community Feed', icon: <Users className="w-3.5 h-3.5" /> },
                { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-3.5 h-3.5" /> }
              ].map((subTab) => {
                const isActive = communitySubTab === subTab.id;
                return (
                  <button
                    key={subTab.id}
                    onClick={() => setCommunitySubTab(subTab.id as any)}
                    className={`py-1.5 px-4 flex items-center gap-1.5 rounded-md font-display text-[11px] font-bold uppercase cursor-pointer transition-all outline-none ${
                      isActive 
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                        : 'text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    {subTab.icon}
                    <span>{subTab.label}</span>
                  </button>
                );
              })}
            </div>
            
            <div className="transition-all duration-300">
              {communitySubTab === 'feed' ? <SocialFeedView /> : <LeaderboardView />}
            </div>
          </div>
        );
      case 'profile': 
        return <ProfileView />;
      default: 
        return <DashboardView onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050512] text-slate-100 cyber-grid flex flex-col font-sans transition-all relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[450px] h-[450px] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[450px] h-[450px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none"></div>

      {/* TOP HEADER CONSOLE NAVIGATION */}
      <header className="sticky top-0 z-30 w-full bg-black/40 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          
          {/* LOGO */}
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-indigo-400 animate-pulse" />
            <span className="font-display font-black text-xl tracking-wider text-glow-blue text-white uppercase select-none">
              ANAVARE
            </span>
          </div>

          {/* ONLINE ENVIRONMENT INDICATOR AND CONTROLS */}
          <div className="flex items-center gap-3.5">
            
            {/* Environment Badge */}
            <span className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-mono text-[9px] border uppercase ${
              isFirebase 
                ? 'bg-emerald-950/20 border-emerald-500/25 text-emerald-400' 
                : 'bg-white/5 border-white/10 text-indigo-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isFirebase ? 'bg-emerald-400' : 'bg-indigo-400'} animate-ping`}></span>
              <span>{isFirebase ? 'CLOUD REAL-TIME ACTIVE' : 'SANDBOX SIMULATED'}</span>
            </span>

            {/* QUICK HEALTHBAR MINI METRICS */}
            <button 
              onClick={() => setShowAvatarPrompt(!showAvatarPrompt)}
              id="avatar-picker-mini-trigger"
              className="flex items-center gap-2 p-1.5 pr-2.5 rounded-lg bg-black/45 hover:bg-slate-900 border border-slate-800 transition-colors duration-200 text-left cursor-pointer outline-none overflow-hidden"
              title="Click to change Character Avatar"
            >
              <div className="w-7 h-7 rounded-md overflow-hidden border border-slate-850 shrink-0">
                <AvatarImage
                  src={user.avatar}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden sm:block">
                <span className="text-[10px] font-display font-bold text-white block -mb-0.5">{user.username}</span>
                <span className="text-[8.5px] font-mono text-indigo-400 block">LVL {user.level}</span>
              </div>
            </button>

            {/* Real-time Notifications system */}
            <NotificationCenter />

            {/* Sign Out clickers */}
            <button
              onClick={() => logout()}
              id="logout-button-trigger"
              className="p-2 rounded-lg bg-black/40 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all cursor-pointer outline-none"
              title="Deploy Out"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>

          </div>
        </div>
      </header>

      {/* CORE WORKSPACE CONSOLE */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
        
        {/* CHARACTER SWAP PROMPT ACCORDION */}
        {showAvatarPrompt && (
          <div className="mb-2">
            <AvatarPicker 
              currentAvatar={user.avatar} 
              onSelect={() => setShowAvatarPrompt(false)} 
            />
          </div>
        )}

        {/* PERSISTENT ENVIRONMENT WARNING BANNER FOR DUMMY KEYS */}
        {!isFirebase && (
          <div className="p-3.5 bg-yellow-950/25 border border-yellow-500/20 text-yellow-300 text-xs rounded-xl flex items-start gap-2 max-w-4xl">
            <Info className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Anavare Companion Notice:</span> Running in Local Sandbox state using memory storage. Enable your live Firestore cloud backend and auth database by completing standard Firebase setup inside secrets dashboard!
            </div>
          </div>
        )}

        {/* UNVERIFIED EMAIL WARNING BANNER */}
        {isFirebase && firebaseUser && !firebaseUser.emailVerified && (
          <div className="p-3.5 bg-rose-950/25 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-start justify-between gap-3 max-w-4xl">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold font-display uppercase tracking-wider block text-[10px] text-rose-300 mb-0.5">Verification Warning</span>
                <span className="text-slate-300">Your email is unverified. Check your inbox for the confirmation email to secure your profile!</span>
              </div>
            </div>
            <button 
              onClick={async () => {
                setIsSendingVerification(true);
                try {
                  await resendVerification();
                  setVerificationSent(true);
                } catch (e) {
                  console.error(e);
                } finally {
                  setIsSendingVerification(false);
                }
              }}
              disabled={verificationSent || isSendingVerification}
              className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-rose-300 rounded font-bold uppercase text-[10px] tracking-wider border border-rose-500/20 hover:border-rose-500/30 cursor-pointer select-none transition-all outline-none shrink-0"
            >
              {isSendingVerification ? 'Sending...' : verificationSent ? 'Sent!' : 'Resend'}
            </button>
          </div>
        )}

        {/* TWO-TIER NAVIGATION BAR (TABS SELECTORS) */}
        {/* Responsive Desktop Side tabs or Top Tabs bar */}
        <div className="flex bg-white/5 backdrop-blur-md border border-white/10 p-1.5 rounded-xl w-full select-none justify-evenly overflow-x-auto gap-1">
          {[
            { id: 'home', label: 'HOME', icon: <Gamepad2 className="w-4.5 h-4.5" /> },
            { id: 'progress', label: 'PROGRESS', icon: <Compass className="w-4.5 h-4.5" /> },
            { id: 'community', label: 'COMMUNITY', icon: <Users className="w-4.5 h-4.5" /> },
            { id: 'profile', label: 'PROFILE', icon: <User className="w-4.5 h-4.5" /> }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                id={`navigation-tab-selector-${tab.id}`}
                className={`py-2 px-4 sm:px-6 flex items-center gap-2 rounded-lg font-display text-xs font-bold uppercase cursor-pointer transition-all outline-none ${
                  isActive 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline-block">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* KEY VIEWPORT DISPLAY */}
        <div className="transition-all duration-300">
          {renderActiveView()}
        </div>

      </main>

      {/* FOOTER METRICS SYSTEM STATUS */}
      <footer className="mt-12 border-t border-slate-900 bg-[#04040e] py-6 text-center select-none font-mono text-[10px] text-slate-600">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span>🎮 ANAVARE LIFE-RPG SYSTEM ENG-v2.5</span>
          <span className="hidden sm:inline">ALL CORES ONLINE • STANDING SECURED</span>
          <span>© 2026 COIL NETWORKS CO.</span>
        </div>
      </footer>

    </div>
  );
}

function LoadingConsoleScreen() {
  return (
    <div className="min-h-screen bg-[#050512] text-indigo-400 cyber-grid flex flex-col items-center justify-center font-mono">
      <div className="flex flex-col items-center gap-4">
        <Swords className="w-12 h-12 text-indigo-400 animate-bounce" />
        <div className="text-center">
          <h2 className="text-xl font-bold tracking-widest uppercase text-white mb-1">ANAVARE LIFEPATH</h2>
          <p className="text-[10px] text-slate-500 tracking-wider">RETRIEVING SELF-IMPROVEMENT CORES...</p>
        </div>
        {/* Loading progress bar indicator */}
        <div className="w-48 h-1 bg-black/50 border border-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 animate-[pulse_1.5s_infinite] w-3/4"></div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  if (loading) {
    return <LoadingConsoleScreen />;
  }

  if (user) {
    return <MasterGameConsole />;
  }

  if (showAuth) {
    return (
      <LoginView 
        initialIsSignUp={authMode === 'signup'} 
        onBackToLanding={() => setShowAuth(false)} 
      />
    );
  }

  return (
    <LandingView 
      onGetStarted={(mode) => {
        setAuthMode(mode);
        setShowAuth(true);
      }} 
    />
  );
}
