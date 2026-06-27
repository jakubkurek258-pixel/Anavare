import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Sparkles, Award, Star, Compass, ShieldCheck, Swords, Check, Volume2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGamification } from '../context/GamificationContext';
import { trackEvent } from '../lib/firebase';

export default function RewardShowcase() {
  const { user } = useAuth();
  const { triggerMockLevelUp, triggerMockStreak } = useGamification();
  const [activeStreakModal, setActiveStreakModal] = useState<boolean>(false);
  const [streakVal, setStreakVal] = useState<number>(0);

  // Sound effects emulation or trigger helper
  const playRewardSound = (type: 'streak' | 'level') => {
    try {
      if (typeof window !== 'undefined') {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        if (type === 'streak') {
          // Energetic, ascending synthesizer sweep
          const now = audioCtx.currentTime;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          
          osc.frequency.setValueAtTime(261.63, now); // C4
          osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.65); // C6
          
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);
          
          osc.start();
          osc.stop(now + 0.7);
        }
      }
    } catch {
      // AudioContext blocked or unsupported, fail silently
    }
  };

  useEffect(() => {
    if (!user) return;

    const streakKey = `anavare_streak_${user.id}`;
    const levelKey = `anavare_level_${user.id}`;
    const streakDateKey = `anavare_streak_date_${user.id}`;

    const todayStr = new Date().toISOString().split('T')[0];

    // Read stored variables
    const storedStreakStr = localStorage.getItem(streakKey);
    const storedLevelStr = localStorage.getItem(levelKey);
    const storedStreakDate = localStorage.getItem(streakDateKey);

    const currentStreak = user.streak || 0;
    const currentLevel = user.level || 1;

    // Safety initializer for new state caches
    if (storedStreakStr === null || storedLevelStr === null) {
      localStorage.setItem(streakKey, String(currentStreak));
      localStorage.setItem(levelKey, String(currentLevel));
      localStorage.setItem(streakDateKey, todayStr);
      return;
    }

    const storedStreakVal = Number(storedStreakStr);
    const storedLevelVal = Number(storedLevelStr);

    // 1. STREAK UP EVALUATION
    // The legacy StreakRewardModal has been completely disabled and removed.
    // We update local coordinates silently here to prevent desync loop states, while
    // GamificationContext's beautiful daily streak celebration overlay serves as the single source of truth.
    if (currentStreak > storedStreakVal) {
      trackEvent('streak_reward_celebration', { streakValue: currentStreak });
      localStorage.setItem(streakKey, String(currentStreak));
      localStorage.setItem(streakDateKey, todayStr);
    }

    // 2. LEVEL UP EVALUATION
    // The legacy LevelUpModal has been completely disabled and removed. 
    // We update local coordinates silently here to prevent desync loop states, while
    // GamificationContext's beautiful level up display serves as the single source of truth.
    if (currentLevel > storedLevelVal) {
      trackEvent('level_reward_celebration', { previousLevel: storedLevelVal, newLevel: currentLevel });
      localStorage.setItem(levelKey, String(currentLevel));
    }

    // Sync in case of any drift
    if (currentStreak < storedStreakVal) {
      localStorage.setItem(streakKey, String(currentStreak));
    }
    if (currentLevel < storedLevelVal) {
      localStorage.setItem(levelKey, String(currentLevel));
    }

  }, [user]);

  // Handle dry-run test demo buttons (for debug & user testing feedback)
  const triggerDemoStreak = () => {
    triggerMockStreak();
  };

  const triggerDemoLevel = () => {
    triggerMockLevelUp();
  };

  if (!user) return null;

  return (
    <>
      {/* PERSISTENT FLOATING LABELS IN SCREEN MARGINS TO ENABLE QUICK REWARD DRY-RUN PLAYGROUND */}
      <div 
        id="reward-simulator-panel"
        className="fixed bottom-4 right-4 z-40 p-2.5 rounded-lg border border-indigo-500/20 bg-black/60 backdrop-blur-md flex flex-col gap-1.5 text-[10px] shadow-lg opacity-40 hover:opacity-100 transition-opacity"
      >
        <span className="font-mono text-[8px] uppercase tracking-wider text-indigo-400 font-bold">REWARD SYSTEMS SIMULATOR</span>
        <div className="flex gap-2">
          <button
            onClick={triggerDemoStreak}
            id="test-streak-demo-btn"
            className="px-2 py-1 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-mono border border-orange-500/20 rounded cursor-pointer transition-colors"
          >
            🔥 Demo Streak (Duolingo Style)
          </button>
          <button
            onClick={triggerDemoLevel}
            id="test-level-demo-btn"
            className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-mono border border-indigo-500/20 rounded cursor-pointer transition-colors"
          >
            🎉 Demo Level Up
          </button>
        </div>
      </div>

      <AnimatePresence>
        {/* DAILY STREAK INCREASE MODAL */}
        {activeStreakModal && (
          <StreakRewardModal 
            streak={streakVal} 
            onClose={() => setActiveStreakModal(false)} 
          />
        )}
      </AnimatePresence>
    </>
  );
}

// -------------------------------------------------------------
// STREAK REWARD OVERLAY SUBCOMPONENT
// -------------------------------------------------------------
interface StreakRewardProps {
  streak: number;
  onClose: () => void;
}

function StreakRewardModal({ streak, onClose }: StreakRewardProps) {
  const [timerRemaining, setTimerRemaining] = useState<number>(4);

  // Auto-close sequence
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onClose]);

  return (
    <div 
      id="streak-celebration-overlay" 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', bounce: 0.35, duration: 0.7 } }}
        exit={{ opacity: 0, scale: 0.9, y: 15, transition: { duration: 0.2 } }}
        className="w-full max-w-sm rounded-2xl bg-gradient-to-b from-[#1c0f10] to-[#040203] border border-orange-500/30 p-6 flex flex-col items-center text-center shadow-[0_0_50px_rgba(239,68,68,0.25)] relative overflow-hidden"
      >
        {/* Immersive background flame rays */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-600/10 blur-[50px] rounded-full pointer-events-none"></div>
        
        {/* Top telemetry icon row */}
        <div className="flex justify-between w-full text-[8px] font-mono text-orange-500/50 uppercase tracking-widest absolute top-4 px-6">
          <span>STREAK CALIBRATION</span>
          <span>SYS SECURED</span>
        </div>

        {/* BIG ANAMATED FLAME (DOPAMINE FEEDBACK) */}
        <div className="relative mt-6 mb-8 flex items-center justify-center">
          
          {/* Flame aura ripples */}
          <motion.div 
            animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="absolute w-28 h-28 bg-orange-500/15 rounded-full blur-xl"
          />
          <motion.div 
            animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.3, 0.1] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut', delay: 0.3 }}
            className="absolute w-36 h-36 bg-red-500/10 rounded-full blur-2xl"
          />

          {/* Layered CSS Flames */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            
            {/* Dark Orange Outer Flame */}
            <motion.div 
              animate={{ 
                borderRadius: ["42% 58% 50% 50% / 40% 45% 55% 60%", "50% 45% 55% 45% / 50% 60% 40% 50%", "42% 58% 50% 50% / 40% 45% 55% 60%"],
                rotate: [-2, 3, -1],
                scale: [1, 1.05, 0.98]
              }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              className="absolute w-24 h-24 bg-gradient-to-t from-red-600 to-orange-500 shadow-[0_0_20px_rgba(185,28,28,0.4)]"
              style={{ transformOrigin: 'bottom center' }}
            />

            {/* Orange Mid Flame */}
            <motion.div 
              animate={{ 
                borderRadius: ["50% 45% 55% 45% / 50% 60% 40% 50%", "45% 50% 40% 55% / 45% 50% 50% 55%", "50% 45% 55% 45% / 50% 60% 40% 50%"],
                rotate: [3, -3, 2],
                scale: [1, 1.08, 0.95]
              }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut', delay: 0.1 }}
              className="absolute w-18 h-18 bg-gradient-to-t from-orange-500 to-amber-400 shadow-[0_0_15px_rgba(249,115,22,0.5)]"
              style={{ transformOrigin: 'bottom center' }}
            />

            {/* Bright Yellow Inner Core */}
            <motion.div 
              animate={{ 
                borderRadius: ["45% 55% 50% 50% / 55% 55% 45% 45%", "52% 48% 52% 48% / 48% 52% 48% 52%", "45% 55% 50% 50% / 55% 55% 45% 45%"],
                rotate: [-2, 2, -1],
                scale: [0.95, 1.1, 0.95]
              }}
              transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
              className="absolute w-11 h-11 bg-white shadow-[0_0_10px_rgba(255,255,255,0.7)]"
              style={{ transformOrigin: 'bottom center' }}
            />

            {/* Floating embers inside flame area */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Flame className="w-10 h-10 text-orange-900 mix-blend-overlay rotate-12 shrink-0 animate-pulse" />
            </div>

          </div>
        </div>

        {/* STREAK NUMBERS AND CONTENT */}
        <h3 className="font-display font-black text-xs text-orange-500 tracking-widest uppercase mb-1 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-spin" />
          DAY STREAK INCREASED!
          <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-spin" />
        </h3>

        <h2 className="font-display font-black text-5xl text-white tracking-tighter text-glow-orange mt-2 flex items-baseline gap-1.5 justify-center">
          <span>{streak}</span>
          <span className="text-xl text-orange-400 font-bold uppercase tracking-wider block">DAYS</span>
        </h2>

        <p className="text-[10px] font-mono text-orange-400/80 uppercase tracking-widest mt-1 block mb-4">
          Consecutive Days in a Row
        </p>

        <p className="font-sans text-[11.5px] text-slate-300 leading-relaxed max-w-xs mt-1">
          The discipline fire burns! Consecutive activity locks in your daily progress, multiplies XP potential, and dispatches bonus rewards.
        </p>

        {/* REWARD SLOTS XP VALUE */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.4, type: 'spring' } }}
          className="mt-6 w-full p-3.5 rounded-xl border border-orange-500/25 bg-orange-500/5 flex items-center justify-between shadow-inner"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/30">
              <Star className="w-4 h-4 text-orange-400 fill-orange-400/20" />
            </div>
            <div className="text-left">
              <span className="text-[10.5px] font-bold text-slate-200 block">Streak Completion Bonus</span>
              <span className="text-[9px] font-mono text-slate-500 uppercase block">Daily multiplier applied</span>
            </div>
          </div>
          <span className="font-mono text-xs font-black text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 shadow-[0_0_8px_rgba(249,115,22,0.15)]">
            +50 XP
          </span>
        </motion.div>

        {/* INTERACTION ROW */}
        <div className="mt-7 w-full space-y-2">
          <button
            onClick={onClose}
            id="streak-continue-btn"
            className="w-full py-2.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-mono text-[10.5px] uppercase font-black rounded-lg border border-orange-400/30 shadow-[0_4px_15px_rgba(249,115,22,0.3)] transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
          >
            Carry the Flame <ArrowRight className="w-3.5 h-3.5" />
          </button>
          
          <div className="w-full flex justify-center">
            <span className="text-[9px] font-mono text-slate-500 uppercase block">
              Auto closing in {timerRemaining}s...
            </span>
          </div>
        </div>

      </motion.div>
    </div>
  );
}

