import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Sparkles, Award, Star, Compass, ShieldCheck, Swords, Check, Volume2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { trackEvent } from '../lib/firebase';

export default function RewardShowcase() {
  const { user } = useAuth();
  const [activeStreakModal, setActiveStreakModal] = useState<boolean>(false);
  const [activeLevelModal, setActiveLevelModal] = useState<boolean>(false);
  const [streakVal, setStreakVal] = useState<number>(0);
  const [levelVal, setLevelVal] = useState<number>(1);
  const [prevLevel, setPrevLevel] = useState<number>(1);

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
        } else {
          // Glorious Level-Up major chord trumpet fanfare
          const playNote = (freq: number, startTime: number, duration: number) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.frequency.setValueAtTime(freq, startTime);
            osc.type = 'sine';
            
            gain.gain.setValueAtTime(0.12, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            
            osc.start(startTime);
            osc.stop(startTime + duration);
          };
          
          const now = audioCtx.currentTime;
          playNote(523.25, now, 0.2); // C5
          playNote(659.25, now + 0.15, 0.2); // E5
          playNote(783.99, now + 0.3, 0.2); // G5
          playNote(1046.50, now + 0.45, 0.8); // C6
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
    // Trigger when current streak is greater than stored, and not yet celebrated today
    if (currentStreak > storedStreakVal) {
      if (storedStreakDate !== todayStr) {
        setStreakVal(currentStreak);
        setActiveStreakModal(true);
        playRewardSound('streak');
        trackEvent('streak_reward_celebration', { streakValue: currentStreak });
        
        // Persist local state immediately to block spamming on component updates
        localStorage.setItem(streakKey, String(currentStreak));
        localStorage.setItem(streakDateKey, todayStr);
      } else {
        // Already shown today, just align the count silently
        localStorage.setItem(streakKey, String(currentStreak));
      }
    }

    // 2. LEVEL UP EVALUATION
    // Trigger when current level is greater than stored level
    if (currentLevel > storedLevelVal) {
      setPrevLevel(storedLevelVal);
      setLevelVal(currentLevel);
      setActiveLevelModal(true);
      playRewardSound('level');
      trackEvent('level_reward_celebration', { previousLevel: storedLevelVal, newLevel: currentLevel });

      // Persist local state immediately
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
    setStreakVal((user?.streak || 5) + 1);
    setActiveStreakModal(true);
    playRewardSound('streak');
  };

  const triggerDemoLevel = () => {
    setPrevLevel(user?.level || 4);
    setLevelVal((user?.level || 4) + 1);
    setActiveLevelModal(true);
    playRewardSound('level');
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

        {/* LEVEL UP MODAL */}
        {activeLevelModal && (
          <LevelUpModal 
            prevLevel={prevLevel}
            level={levelVal} 
            userXP={user.xp}
            requiredXP={user.requiredXp}
            onClose={() => setActiveLevelModal(false)} 
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

// -------------------------------------------------------------
// LEVEL UP REWARD OVERLAY SUBCOMPONENT
// -------------------------------------------------------------
interface LevelUpProps {
  prevLevel: number;
  level: number;
  userXP: number;
  requiredXP: number;
  onClose: () => void;
}

function LevelUpModal({ prevLevel, level, userXP, requiredXP, onClose }: LevelUpProps) {
  const [fillProgress, setFillProgress] = useState<number>(0);

  useEffect(() => {
    // Stagger progress bar filling to emulate game animation on load
    const timer = setTimeout(() => {
      const percentage = Math.min(Math.floor((userXP / requiredXP) * 100), 100);
      setFillProgress(percentage);
    }, 400);

    return () => clearTimeout(timer);
  }, [userXP, requiredXP]);

  // Sparkles container helper
  const sparkles = Array.from({ length: 40 });

  return (
    <div 
      id="level-celebration-overlay" 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1, transition: { type: 'spring', bounce: 0.4, duration: 0.85 } }}
        exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.25 } }}
        className="w-full max-w-md rounded-2xl bg-gradient-to-b from-[#131130] to-black border border-indigo-500/20 p-6 flex flex-col items-center text-center shadow-[0_0_80px_rgba(99,102,241,0.35)] relative overflow-hidden my-auto"
      >
        {/* Confetti Sparks (Framer motion simulated floating particles) */}
        {sparkles.map((_, idx) => {
          const size = Math.random() * 5 + 3;
          const left = Math.random() * 100;
          const delay = Math.random() * 1.5;
          const duration = Math.random() * 2 + 1.5;
          const colorList = ['bg-amber-400', 'bg-indigo-400', 'bg-purple-400', 'bg-emerald-400', 'bg-cyan-400'];
          const color = colorList[Math.floor(Math.random() * colorList.length)];
          
          return (
            <motion.div
              key={idx}
              initial={{ y: 350, x: (Math.random() - 0.5) * 150, opacity: 0 }}
              animate={{ 
                y: -150, 
                x: (Math.random() - 0.5) * 200, 
                opacity: [0, 1, 1, 0],
                rotate: [0, Math.random() * 360]
              }}
              transition={{ repeat: Infinity, duration, delay, ease: 'easeOut' }}
              className={`absolute rounded-full pointer-events-none ${color}`}
              style={{ width: size, height: size, left: `${left}%` }}
            />
          );
        })}

        {/* Aura gradient circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-600/10 blur-[80px] rounded-full pointer-events-none"></div>
        <div className="absolute top-[-5%] right-[-5%] w-32 h-32 bg-purple-600/10 blur-[50px] rounded-full pointer-events-none"></div>

        {/* Telemetry frame headers */}
        <div className="flex justify-between w-full text-[8px] font-mono text-indigo-500/50 uppercase tracking-widest absolute top-4 px-6">
          <span>CHARACTER UPGRADE MATRIX</span>
          <span>SUCCESS SECURED</span>
        </div>

        {/* CELEBRATION SHIELD */}
        <div className="relative mt-5 mb-6 flex items-center justify-center">
          {/* Outer glowing pulsing halo */}
          <motion.div 
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3], rotate: 360 }}
            transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
            className="absolute w-32 h-32 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full opacity-60 blur-md shadow-[0_0_30px_rgba(99,102,241,0.5)]"
          />
          <motion.div 
            animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.4, 0.1] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            className="absolute w-40 h-40 bg-purple-600/20 rounded-full blur-xl animate-pulse"
          />

          <div className="relative w-24 h-24 rounded-2xl bg-black border-2 border-amber-400 rotate-45 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <div className="-rotate-45 flex flex-col items-center">
              <Award className="w-10 h-10 text-amber-400 animate-[pulse_2s_infinite] drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
            </div>
          </div>
        </div>

        {/* LEVEL UP TITLES */}
        <h3 className="font-display font-black text-xs text-amber-400 tracking-widest uppercase mb-1 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          RANKING PROMOTED
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
        </h3>

        <h2 className="font-display font-black text-4xl text-white tracking-widest uppercase text-glow-indigo">
          LEVEL UP!
        </h2>

        {/* LEVEL NUMBERS TRANSITION */}
        <div className="flex items-center gap-4 mt-3 mb-1 select-none text-white justify-center">
          <div className="px-3.5 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-400 font-mono text-sm uppercase">
            LVL {prevLevel}
          </div>
          <motion.div 
            animate={{ x: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="text-amber-400 font-bold"
          >
            ➔
          </motion.div>
          <div className="px-5 py-2 bg-gradient-to-br from-amber-400 to-amber-600 border border-amber-300 rounded-xl text-black font-display font-black text-xl shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-[bounce_1.5s_infinite]">
            LVL {level}
          </div>
        </div>

        <p className="text-[10.5px] font-mono text-slate-500 uppercase tracking-widest mt-1 block">
          RPG Core Evolution Lock-In
        </p>

        {/* PROGRESS XP BAR TO CORRESPONDING LEVEL */}
        <div className="w-full mt-6 px-4 space-y-1">
          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 uppercase tracking-wider">
            <span>Next Level Progression</span>
            <span className="text-indigo-400 font-bold">{userXP} / {requiredXP} XP</span>
          </div>
          <div className="w-full h-3 bg-black/50 border border-slate-800 rounded-full overflow-hidden p-[1.5px]">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(99,102,241,0.6)]"
              style={{ width: `${fillProgress}%` }}
            />
          </div>
        </div>

        {/* UNLOCKED PERKS PREVIEW PANEL (DUOLINGO CUSTOM BONUS) */}
        <div className="mt-6 w-full text-left space-y-2.5">
          <span className="text-[9.5px] font-mono text-slate-500 uppercase block tracking-widest border-b border-white/5 pb-1">
            🎁 EVOLUTION PERKS & REWARDS UNLOCKED:
          </span>

          <div className="grid grid-cols-1 gap-2">
            
            <div className="p-2.5 bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all rounded-xl flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Compass className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <span className="text-[10.5px] font-bold text-slate-200 block">Prestige Multiplier (1.2x)</span>
                <span className="text-[9px] text-slate-500 block leading-tight">Every completed task yields added bonus yields</span>
              </div>
            </div>

            <div className="p-2.5 bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all rounded-xl flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Star className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <span className="text-[10.5px] font-bold text-slate-200 block">Level {level} Elite Crown Avatar Border</span>
                <span className="text-[9px] text-slate-500 block leading-tight">Visual rank border added to profile headers</span>
              </div>
            </div>

            <div className="p-2.5 bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all rounded-xl flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="text-[10.5px] font-bold text-slate-200 block">+50 Energy Capacity Bounds</span>
                <span className="text-[9px] text-slate-500 block leading-tight">Expanded resource limits assigned to daily goals</span>
              </div>
            </div>

          </div>
        </div>

        {/* ACTION CLAIM REWARDS CONTINUE BUTTON */}
        <button
          onClick={onClose}
          id="level-continue-btn"
          className="w-full mt-7 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-mono text-[10.5px] uppercase font-black rounded-lg border border-indigo-400/30 shadow-[0_4px_15px_rgba(99,102,241,0.3)] transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
        >
          Claim Upgrades & Secure <Check className="w-3.5 h-3.5" />
        </button>

      </motion.div>
    </div>
  );
}
