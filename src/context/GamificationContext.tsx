import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './AuthContext';
import { playSound } from '../utils/audio';
import { Trophy, Flame, Award, Sparkles, X, Star, Zap, CheckCircle2 } from 'lucide-react';
import { UserProfile, Badge } from '../types';

interface GamificationContextType {
  triggerMockXpGain: (amount: number) => void;
  triggerMockLevelUp: () => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}

// Level lock text descriptions for satisfying reward reviews No. 4 and No. 2
export function getLevelRewardDescription(lvl: number): string {
  if (lvl <= 2) return "Unlocked 'Scholar Apprentice' Avatar Portrait block, and advanced Mindset calibration!";
  if (lvl === 3) return "Unlocked the Finance Accumulator Skill Tree, and obtained late-night focus soundtracks!";
  if (lvl === 4) return "Unlocked the custom 'Starlight Compass' badge & detailed stats metrics!";
  if (lvl === 5) return "Unlocked Stoic Breathing loop level 2, and the magnificent 'Adept Stoic' Champion Badge!";
  if (lvl === 6) return "Unlocked the 'Vesta Protector' Profile border, (+250 XP bonus!)";
  if (lvl === 7) return "Unlocked Level 7 Legendary Avatar Frame and golden core particle outlines!";
  if (lvl === 8) return "Unlocked 'Guardian of Time' legendary status title, and high-intensity task matrices!";
  return "Unlocked Supreme Chrono Sovereign title, elite tier frames, and immortal profile customization controls!";
}

interface FloatingXp {
  id: string;
  amount: number;
  x: number;
  y: number;
}

interface BadgeUnlockEvent {
  id: string;
  title: string;
  icon: string;
  description: string;
}

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  // Track previous user state to detect increases safely
  const prevUserRef = useRef<UserProfile | null>(null);

  // Track levels and streaks we have already celebrated in this session to prevent duplicate modals or spamming
  const celebratedLevelsRef = useRef<Set<number>>(new Set());
  const celebratedStreaksRef = useRef<Set<number>>(new Set());
  
  // HUD interaction animations
  const [floatingXpList, setFloatingXpList] = useState<FloatingXp[]>([]);
  const [levelUpModal, setLevelUpModal] = useState<{ show: boolean; level: number } | null>(null);
  const [streakCelebration, setStreakCelebration] = useState<{ show: boolean; streak: number; isMilestone: boolean } | null>(null);
  const [badgeUnlock, setBadgeUnlock] = useState<BadgeUnlockEvent | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!user) {
      prevUserRef.current = null;
      return;
    }

    const prev = prevUserRef.current;
    
    // First loading baseline - skip celebration matching to prevent spurious popups on login
    if (!prev) {
      prevUserRef.current = user;
      // Mark current level and current streak as already celebrated/handled so they never re-trigger on initial load or refreshes
      celebratedLevelsRef.current.add(user.level);
      celebratedStreaksRef.current.add(user.streak);
      return;
    }

    // 1. Detect XP Increase
    if (user.totalXp > prev.totalXp) {
      const xpGained = user.totalXp - prev.totalXp;
      // Trigger floating XP bubble
      const randomOffset = Math.random() * 60 - 30; // slight horizontal drift
      const newFloating: FloatingXp = {
        id: Math.random().toString(36).substring(2, 9),
        amount: xpGained,
        x: window.innerWidth / 2 + randomOffset,
        y: window.innerHeight - 150
      };
      
      setFloatingXpList((prevList) => [...prevList, newFloating]);
      playSound('xp');

      // Trigger a rapid clean-up of older floaters after animation completes
      setTimeout(() => {
        setFloatingXpList((prevList) => prevList.filter((item) => item.id !== newFloating.id));
      }, 1800);
    }

    // 2. Detect Level Up
    if (user.level > prev.level && !celebratedLevelsRef.current.has(user.level)) {
      celebratedLevelsRef.current.add(user.level);
      setLevelUpModal({ show: true, level: user.level });
      setShowConfetti(true);
      playSound('levelup');
      
      // Auto dismiss confetti after 6 seconds to prevent performance degradation
      setTimeout(() => {
        setShowConfetti(false);
      }, 6000);
    }

    // 3. Detect Streak Increase
    if (user.streak > prev.streak && !celebratedStreaksRef.current.has(user.streak)) {
      celebratedStreaksRef.current.add(user.streak);
      const isMilestone = user.streak % 3 === 0 || user.streak % 5 === 0;
      setStreakCelebration({ show: true, streak: user.streak, isMilestone });
      playSound('streak');
      
      if (isMilestone) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    }

    // 4. Detect Badge Addition
    if (user.badges.length > prev.badges.length) {
      // Find the newly unlocked badges
      const prevIds = new Set(prev.badges.map(b => b.id));
      const newlyAdded = user.badges.filter(b => !prevIds.has(b.id));
      
      if (newlyAdded.length > 0) {
        const latest = newlyAdded[0];
        setBadgeUnlock({
          id: latest.id,
          title: latest.title,
          description: latest.description,
          icon: latest.icon || 'Star'
        });
        playSound('badge');
      }
    }

    // Keep memory cache of user stable
    prevUserRef.current = user;
  }, [user]);

  // Handle manual mock feedback for immediate click tests
  const triggerMockXpGain = (amount: number) => {
    const randomOffset = Math.random() * 80 - 40;
    const newFloating: FloatingXp = {
      id: Math.random().toString(36).substring(2, 9),
      amount: amount,
      x: window.innerWidth / 2 + randomOffset,
      y: window.innerHeight - 200
    };
    setFloatingXpList((prevList) => [...prevList, newFloating]);
    playSound('xp');
    setTimeout(() => {
      setFloatingXpList((prevList) => prevList.filter((item) => item.id !== newFloating.id));
    }, 1800);
  };

  const triggerMockLevelUp = () => {
    setLevelUpModal({ show: true, level: (user?.level || 1) + 1 });
    setShowConfetti(true);
    playSound('levelup');
    setTimeout(() => setShowConfetti(false), 6000);
  };

  // Confetti generator engine
  const renderConfetti = () => {
    if (!showConfetti) return null;
    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4', '#f43f5e', '#a855f7'];
    
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
        {Array.from({ length: 80 }).map((_, i) => {
          const size = 6 + Math.random() * 10;
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          const shapeCircle = Math.random() > 0.5;
          const initialX = Math.random() * window.innerWidth;
          const leftOffset = Math.random() * 300 - 150;
          const duration = 2.5 + Math.random() * 3;
          
          return (
            <motion.div
              key={i}
              initial={{ 
                x: initialX, 
                y: -10, 
                opacity: 1, 
                scale: 0.1,
                rotate: Math.random() * 360 
              }}
              animate={{ 
                x: initialX + leftOffset,
                y: window.innerHeight + 10,
                opacity: [1, 1, 0.7, 0],
                scale: [0.1, 1.2, 1, 0.5],
                rotate: Math.random() * 720 + 360
              }}
              transition={{ 
                duration, 
                ease: "easeOut"
              }}
              className="absolute pointer-events-none"
              style={{
                width: size,
                height: size,
                backgroundColor: randomColor,
                borderRadius: shapeCircle ? '50%' : '2px',
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <GamificationContext.Provider value={{ triggerMockXpGain, triggerMockLevelUp }}>
      {children}

      {/* Floating XP bubble indicators */}
      <div className="fixed inset-0 pointer-events-none z-[90]">
        <AnimatePresence>
          {floatingXpList.map((item) => (
            <motion.div
              key={item.id}
              initial={{ x: item.x, y: item.y, opacity: 0, scale: 0.4 }}
              animate={{ 
                y: item.y - 180, 
                opacity: [0, 1, 1, 0], 
                scale: [0.4, 1.4, 1.2, 0.8] 
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.6, ease: "easeOut" }}
              className="absolute text-center select-none filter drop-shadow-[0_2px_12px_rgba(34,197,94,0.4)]"
            >
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-display font-black text-sm md:text-base px-3 py-1 rounded-full flex items-center gap-1.5 border border-emerald-400/30">
                <Zap className="w-4 h-4 fill-black stroke-black stroke-[2]" />
                <span>+{item.amount} XP</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 2. FULLSCREEN LEVEL UP MODAL */}
      <AnimatePresence>
        {levelUpModal?.show && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.82, y: 30, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="max-w-md w-full bg-gradient-to-b from-[#1b124a] via-[#0b032d] to-[#03011c] border border-indigo-500/35 rounded-2xl p-6 md:p-8 text-center relative overflow-hidden shadow-[0_0_80px_rgba(99,102,241,0.5)]"
            >
              {/* Decorative side accent lasers */}
              <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500"></div>
              <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.3)_0,transparent_75%)]"></div>

              {/* Glowing starburst effect background */}
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[conic-gradient(from_0deg,transparent,rgba(99,102,241,0.08),transparent,rgba(236,72,153,0.08))] pointer-events-none"
              ></motion.div>

              {/* Animated Giant level trophy circle container */}
              <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center">
                <div className="absolute inset-0 bg-indigo-500/15 rounded-full border border-indigo-400/30 animate-ping"></div>
                <div className="absolute inset-2 bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 rounded-full flex items-center justify-center shadow-[0_0_35px_rgba(245,158,11,0.5)] select-none">
                  <Award className="w-14 h-14 text-slate-950 stroke-[2.2] animate-bounce" />
                </div>
              </div>

              <span className="font-mono text-[10px] text-amber-400 uppercase tracking-widest font-black block mb-1">
                COORDINATES ASCENDED
              </span>
              <h2 className="font-display font-black text-4xl text-white uppercase tracking-wider mb-2 text-glow-indigo">
                LEVEL UP!
              </h2>
              <div className="text-display font-black text-5xl text-glow-blue text-cyan-400 mb-6 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                LEVEL {levelUpModal.level}
              </div>

              {/* Reward unlock details box */}
              <div className="p-4 bg-black/60 border border-white/5 rounded-xl text-left space-y-2.5 mb-6 shadow-inner">
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono font-bold uppercase">
                  <Star className="w-4 h-4 fill-amber-400 animate-pulse" />
                  <span>UNLOCKED PERKS & REWARDS</span>
                </div>
                <p className="text-xs text-slate-350 font-sans leading-relaxed">
                  {getLevelRewardDescription(levelUpModal.level)}
                </p>
                <div className="h-[1px] bg-white/5 my-1" />
                <p className="text-[10px] text-slate-500 font-sans leading-normal italic text-center">
                  "Your chronological capacities expand. Access the tabs or active calibration paths to locate your new unlocks."
                </p>
              </div>

              <button
                onClick={() => setLevelUpModal(null)}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 via-indigo-600 to-purple-600 hover:from-emerald-400 hover:via-indigo-505 hover:to-purple-500 text-white font-display font-bold uppercase text-xs tracking-widest rounded-xl transition-all cursor-pointer border-none shadow-[0_0_30px_rgba(16,185,129,0.35)] outline-none"
              >
                Engage Coordinates & Claim
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. STREAK CELEBRATION DISPATCH OVERLAY */}
      <AnimatePresence>
        {streakCelebration?.show && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              className={`max-w-md w-full bg-gradient-to-b ${
                streakCelebration.isMilestone 
                  ? 'from-[#2e0e1c] via-[#0f030a] to-[#050104] border-rose-500/40 shadow-[0_0_60px_rgba(244,63,94,0.4)]'
                  : 'from-[#1c123d] via-[#090320] to-[#03010b] border-indigo-500/30'
              } border-2 rounded-2xl p-6 text-center relative overflow-hidden`}
            >
              {/* Flame animated particles */}
              <div className="absolute inset-0 pointer-events-none opacity-10">
                <div className="absolute bottom-4 left-1/4 animate-bounce text-xl">🔥</div>
                <div className="absolute bottom-8 right-1/4 animate-pulse text-2xl">🔥</div>
                <div className="absolute bottom-12 left-1/2 text-xl">⚡</div>
              </div>

              {/* Pulsing fire circle */}
              <div className="relative w-24 h-24 mx-auto mb-5 flex items-center justify-center">
                <div className="absolute inset-0 bg-orange-500/10 rounded-full animate-ping"></div>
                <div className="absolute inset-2 bg-gradient-to-tr from-orange-500 via-orange-400 to-amber-300 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.6)] select-none">
                  <Flame className="w-12 h-12 text-slate-950 animate-pulse stroke-[2.2]" />
                </div>
              </div>

              <span className="font-mono text-[9px] text-orange-400 uppercase tracking-widest font-black block mb-1">
                DAILY SYNCHRONY SECURED
              </span>
              <h2 className="font-display font-black text-2xl text-white uppercase tracking-wider mb-2">
                {streakCelebration.isMilestone ? '🔥 EPIC STREAK MILESTONE!' : '🔥 STREAK PRESERVED!'}
              </h2>
              
              <div className={`font-display font-black text-4xl mb-4 ${streakCelebration.isMilestone ? 'text-rose-400 text-glow-pink' : 'text-orange-400 text-glow-orange'}`}>
                {streakCelebration.streak} Days Active
              </div>

              <div className="p-4 bg-black/60 border border-white/5 rounded-xl text-left mb-6 font-sans">
                {streakCelebration.isMilestone ? (
                  <p className="text-xs text-rose-300 font-bold text-center leading-normal">
                    ⚡ Incredible! Realizing a {streakCelebration.streak} day sequence unlocks solid premium experience multipliers. Keep feeding the fire!
                  </p>
                ) : (
                  <p className="text-xs text-slate-350 text-center leading-relaxed">
                    You have securely synchronized your biological coordinates for {streakCelebration.streak} days running. Streak index has been locked in database!
                  </p>
                )}
                <div className="h-[1px] bg-white/5 my-2" />
                <div className="flex justify-between items-center text-[10px] font-mono uppercase text-slate-400">
                  <span>MULTIPLIER GAIN:</span>
                  <span className="text-orange-400 font-bold">{(1.0 + streakCelebration.streak * 0.05).toFixed(2)}x LOCK</span>
                </div>
              </div>

              <button
                onClick={() => setStreakCelebration(null)}
                className={`w-full py-3.5 ${
                  streakCelebration.isMilestone 
                    ? 'bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400' 
                    : 'bg-gradient-to-r from-amber-500 to-orange-600'
                } text-white font-display font-bold uppercase text-xs tracking-widest rounded-xl transition-all cursor-pointer border-none shadow-md`}
              >
                Secure Flame Coordinates
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. TOAST NOTIFICATION FOR BADGE UNLOCKS No. 8 */}
      <AnimatePresence>
        {badgeUnlock && (
          <div className="fixed bottom-6 right-6 z-[100] max-w-sm w-full p-4">
            <motion.div
              initial={{ x: 100, y: 100, opacity: 0, scale: 0.9 }}
              animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              exit={{ x: 50, opacity: 0 }}
              className="bg-black/90 backdrop-blur-md border-2 border-purple-500/50 rounded-xl p-4 shadow-[0_8px_32px_rgba(139,92,246,0.35)] relative overflow-hidden"
            >
              {/* Pulsing light behind badge */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 blur-[20px] pointer-events-none"></div>
              
              <div className="flex gap-4 items-start text-left relative">
                <div className="w-12 h-12 bg-purple-500/20 border border-purple-400/40 rounded-xl flex items-center justify-center shrink-0">
                  <Star className="w-6 h-6 text-purple-400 animate-spin-slow fill-purple-400/20" />
                </div>
                <div className="min-w-0 flex-1 space-y-1 font-sans">
                  <span className="font-mono text-[9px] text-purple-400 uppercase tracking-widest font-black block">
                    ACHIEVEMENT UNLOCKED
                  </span>
                  <h4 className="font-display font-bold text-sm text-white uppercase tracking-wide">
                    {badgeUnlock.title}
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-normal">
                    {badgeUnlock.description}
                  </p>
                </div>
                <button 
                  onClick={() => setBadgeUnlock(null)}
                  className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-white/5 transition-all outline-none border-none cursor-pointer bg-transparent"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {renderConfetti()}

    </GamificationContext.Provider>
  );
}
