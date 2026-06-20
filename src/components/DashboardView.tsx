import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { stateService, getXpReward } from '../lib/stateService';
import { RPGTask, TaskCategory, TaskDifficulty, RPGPost } from '../types';
import { getUserRank } from '../lib/rankSystem';
import AvatarImage from './AvatarImage';
import { 
  Zap, Plus, Calendar, CheckSquare, Dumbbell, Award, 
  Trash2, Flame, RefreshCw, Layers, ShieldCheck, Heart, 
  BookOpen, Coins, CircleCheck, MessageSquare, Send, ArrowRight, Sparkles,
  Timer, Droplets, Sun, ChevronDown, ChevronUp, Play, Pause, Square, Activity, Trophy, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Deterministic list of Daily Challenges (shifting every day of the month)
const DAILY_CHALLENGES = [
  {
    id: "breathing_calibration",
    title: "Synchronized Breathing Calibration",
    desc: "Perform 5 cycles of controlled diaphragmatic breathing to stabilize neural active focus, align oxygenation margins, and zero out peripheral cognitive drag.",
    category: "mindset" as TaskCategory,
    xpReward: 100,
    icon: "🧬",
    instruction: "Breathe in harmony with the glowing core expansion. Inhale as it expands, hold as it glows, and exhale as it deepens.",
    type: "breathing"
  },
  {
    id: "sunlight_calibration",
    title: "Circadian Solar Lock-In",
    desc: "Expose your vision to direct outdoor solar rays for 10-15 minutes (without looking directly at the sun) to suppress melatonin synthesis and anchor metabolic engines.",
    category: "health" as TaskCategory,
    xpReward: 100,
    icon: "🌅",
    instruction: "Anchor your circadian clock by confirming direct solar rays standard exposure.",
    type: "sunlight"
  },
  {
    id: "hydration_matrix",
    title: "Hydration Threshold Activation",
    desc: "Ingest 1 full liter (approx. 32oz) of filtered room temperature water immediately to prime digestive fluid channels and trigger metabolic cell recovery.",
    category: "health" as TaskCategory,
    xpReward: 100,
    icon: "💧",
    instruction: "Consume a full container of water to initiate cellular energy engines.",
    type: "hydration"
  },
  {
    id: "pomodoro_focus",
    title: "Deep Workspace Lockout Protocol",
    desc: "Shut down all non-essential application windows and coordinate 25 minutes of zero-distraction deep work on your primary intellectual goal today.",
    category: "productivity" as TaskCategory,
    xpReward: 100,
    icon: "⏱️",
    instruction: "Lock yourself in for a 25-minute Pomodoro deep work sequence.",
    type: "pomodoro"
  }
];

export default function DashboardView({ onNavigate }: { onNavigate?: (tab: 'home' | 'progress' | 'community' | 'profile', subTab?: string) => void }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<RPGTask[]>([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('productivity');
  const [taskDifficulty, setTaskDifficulty] = useState<TaskDifficulty>('easy');
  const [taskRecurring, setTaskRecurring] = useState<'none' | 'daily' | 'weekly'>('none');
  const [dueDate, setDueDate] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Community feed preview states
  const [posts, setPosts] = useState<RPGPost[]>([]);
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const [quickPostContent, setQuickPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [quickPostError, setQuickPostError] = useState<string | null>(null);

  // GUI control states
  const [isPersonalQuestsExpanded, setIsPersonalQuestsExpanded] = useState(false);
  const [isChallengeRunning, setIsChallengeRunning] = useState(false);
  const [challengeSuccessMsg, setChallengeSuccessMsg] = useState<string | null>(null);
  
  // Interactive Simulator States
  const [breathingCycle, setBreathingCycle] = useState(1);
  const [breathingPhase, setBreathingPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [breathingProgress, setBreathingProgress] = useState(0); // 0 to 100 for current phase progress

  const [pomodoroSeconds, setPomodoroSeconds] = useState(1500); // 25:00
  const [pomodoroRunning, setPomodoroRunning] = useState(false);

  const [hydrationGulpCount, setHydrationGulpCount] = useState(0);
  const [sunlightNote, setSunlightNote] = useState('');

  // Refs for timers
  const breathingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pomodoroTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Determine current deterministic challenge based on current date
  const todayDateObj = new Date();
  const todayStr = todayDateObj.toISOString().split('T')[0];
  const dayOfMonth = todayDateObj.getDate();
  const currentChallenge = DAILY_CHALLENGES[dayOfMonth % DAILY_CHALLENGES.length];

  // Subscribe to tasks
  useEffect(() => {
    if (!user) return;
    const unsub = stateService.subscribeToTasks(user.id, (list) => {
      setTasks(list);
    });
    return unsub;
  }, [user]);

  // Subscribe to community feed
  useEffect(() => {
    setIsFeedLoading(true);
    const unsub = stateService.subscribeToPosts((feed) => {
      setPosts(feed);
      setIsFeedLoading(false);
    });
    return unsub;
  }, []);

  // Breathing simulation phase transitions
  useEffect(() => {
    if (!isChallengeRunning || currentChallenge.type !== 'breathing') {
      if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
      return;
    }

    setBreathingCycle(1);
    setBreathingPhase('Inhale');
    setBreathingProgress(0);

    let phaseTimer = 0;
    breathingTimerRef.current = setInterval(() => {
      phaseTimer += 10; // increment state every 100ms for smooth rendering
      setBreathingProgress((phaseTimer / 4000) * 100);

      if (phaseTimer >= 4000) {
        phaseTimer = 0;
        setBreathingProgress(0);
        
        setBreathingPhase(prev => {
          if (prev === 'Inhale') return 'Hold';
          if (prev === 'Hold') return 'Exhale';
          
          setBreathingCycle(c => {
            if (c >= 4) {
              if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
            }
            return c + 1;
          });
          return 'Inhale';
        });
      }
    }, 100);

    return () => {
      if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
    };
  }, [isChallengeRunning, currentChallenge.type]);

  // Pomodoro countdown timer
  useEffect(() => {
    if (pomodoroRunning && isChallengeRunning && currentChallenge.type === 'pomodoro') {
      pomodoroTimerRef.current = setInterval(() => {
        setPomodoroSeconds(s => {
          if (s <= 1) {
            setPomodoroRunning(false);
            if (pomodoroTimerRef.current) clearInterval(pomodoroTimerRef.current);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (pomodoroTimerRef.current) clearInterval(pomodoroTimerRef.current);
    }

    return () => {
      if (pomodoroTimerRef.current) clearInterval(pomodoroTimerRef.current);
    };
  }, [pomodoroRunning, isChallengeRunning, currentChallenge.type]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] font-mono text-cyan-400">
        LOADING DATA ENGINE...
      </div>
    );
  }

  // Synchronize completed tasks with a persistence ledger
  useEffect(() => {
    if (!user || !tasks || tasks.length === 0) return;
    
    const ledgerKey = `completed_xp_ledger_${user.id}`;
    let ledger: Array<{ id: string; xp: number; completedAt: string; category?: TaskCategory; difficulty?: TaskDifficulty }> = [];
    try {
      ledger = JSON.parse(localStorage.getItem(ledgerKey) || '[]');
    } catch (e) {
      ledger = [];
    }
    
    let updated = false;
    tasks.forEach(t => {
      if (t.completed && t.completedAt) {
        const isAlreadyLogged = ledger.some(item => item.id === t.id);
        if (!isAlreadyLogged) {
          ledger.push({
            id: t.id,
            xp: getXpReward(t.difficulty),
            completedAt: t.completedAt,
            category: t.category,
            difficulty: t.difficulty
          });
          updated = true;
        }
      }
    });
    
    if (updated) {
      localStorage.setItem(ledgerKey, JSON.stringify(ledger));
    }
  }, [tasks, user]);

  // Calculate daily & total stats
  const getTasksCompletedTodayMerged = () => {
    const ledgerKey = `completed_xp_ledger_${user.id}`;
    let ledger: Array<{ id: string; xp: number; completedAt: string; category?: TaskCategory; difficulty?: TaskDifficulty }> = [];
    try {
      ledger = JSON.parse(localStorage.getItem(ledgerKey) || '[]');
    } catch (e) {
      ledger = [];
    }

    const todayLedger = ledger.filter(item => item.completedAt?.startsWith(todayStr));
    const mergedList: Array<{ id: string; category: TaskCategory; difficulty: TaskDifficulty }> = [];
    
    tasks.forEach(t => {
      if (t.completed && t.completedAt?.startsWith(todayStr)) {
        mergedList.push({
          id: t.id,
          category: t.category,
          difficulty: t.difficulty
        });
      }
    });
    
    todayLedger.forEach(item => {
      if (!mergedList.some(existing => existing.id === item.id)) {
        mergedList.push({
          id: item.id,
          category: item.category || 'productivity',
          difficulty: item.difficulty || 'medium'
        });
      }
    });
    
    return mergedList;
  };

  const getTasksCompletedTotalMerged = () => {
    const ledgerKey = `completed_xp_ledger_${user.id}`;
    let ledger: Array<{ id: string; xp: number; completedAt: string; category?: TaskCategory; difficulty?: TaskDifficulty }> = [];
    try {
      ledger = JSON.parse(localStorage.getItem(ledgerKey) || '[]');
    } catch (e) {
      ledger = [];
    }
    
    const mergedList: Array<{ id: string; category: TaskCategory; difficulty: TaskDifficulty }> = [];
    
    tasks.forEach(t => {
      if (t.completed) {
        mergedList.push({
          id: t.id,
          category: t.category,
          difficulty: t.difficulty
        });
      }
    });
    
    ledger.forEach(item => {
      if (!mergedList.some(existing => existing.id === item.id)) {
        mergedList.push({
          id: item.id,
          category: item.category || 'productivity',
          difficulty: item.difficulty || 'medium'
        });
      }
    });
    
    return mergedList;
  };

  const tasksCompletedTodayMerged = getTasksCompletedTodayMerged();
  const tasksCompletedTotalMerged = getTasksCompletedTotalMerged();

  const completedToday = tasksCompletedTodayMerged.length;
  const xpGainedToday = tasksCompletedTodayMerged.reduce((accum, t) => accum + getXpReward(t.difficulty), 0);
  const totalCompleted = tasksCompletedTotalMerged.length;
  const pendingTasks = tasks.filter(t => !t.completed);

  // Task creation and management
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setIsSubmitting(true);
    
    const titleVal = taskTitle.trim();
    const categoryVal = taskCategory;
    const diffVal = taskDifficulty;
    const recVal = taskRecurring;
    const dueVal = dueDate;

    setTaskTitle('');
    setTaskRecurring('none');
    setDueDate('');

    try {
      await stateService.addTask(
        user.id,
        titleVal,
        categoryVal,
        diffVal,
        recVal,
        dueVal
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPostContent.trim()) return;
    setIsPosting(true);
    setQuickPostError(null);
    try {
      await stateService.createSocialPost(
        user.id,
        user.username,
        user.avatar,
        quickPostContent.trim(),
        null
      );
      setQuickPostContent('');
    } catch (err: any) {
      console.error("[Dashboard Quick Post ERROR]", err);
      setQuickPostError(err?.message || 'Error occurred during transmit sequence.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleCompleteTask = async (id: string) => {
    try {
      await stateService.completeTask(user.id, id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await stateService.deleteTask(user.id, id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCompletedTasks = async () => {
    setIsSubmitting(true);
    try {
      const completedTasks = tasks.filter(t => t.completed);
      await Promise.all(completedTasks.map(t => stateService.deleteTask(user.id, t.id)));
    } catch (err) {
      console.error('Failed to delete completed tasks:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Claim Daily Mission Challenge Completion
  const handleSealChallenge = async () => {
    try {
      setIsSubmitting(true);
      await stateService.completeDailyChallenge(
        user.id,
        currentChallenge.category,
        currentChallenge.xpReward,
        currentChallenge.title
      );
      
      setChallengeSuccessMsg(`You have successfully synchronized today's challenge: "${currentChallenge.title}" (+${currentChallenge.xpReward} XP)!`);
      setIsChallengeRunning(false);
      
      // reset states
      setHydrationGulpCount(0);
      setSunlightNote('');
      setPomodoroSeconds(1500);
      setPomodoroRunning(false);
    } catch (err: any) {
      console.error(err);
      setChallengeSuccessMsg(err.message || "Failed to commit challenge coordinates.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryColor = (cat: TaskCategory) => {
    switch (cat) {
      case 'health': return 'text-rose-400 border-rose-500/30 bg-rose-950/20';
      case 'fitness': return 'text-orange-400 border-orange-500/30 bg-orange-950/20';
      case 'learning': return 'text-sky-400 border-sky-500/30 bg-sky-950/20';
      case 'productivity': return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20';
      case 'finance': return 'text-amber-400 border-amber-500/30 bg-amber-950/20';
      case 'mindset': return 'text-purple-400 border-purple-500/30 bg-purple-950/20';
    }
  };

  const getDifficultyBadge = (diff: TaskDifficulty) => {
    switch (diff) {
      case 'easy': return 'text-slate-400 border-slate-800 bg-slate-900/60';
      case 'medium': return 'text-blue-400 border-blue-500/20 bg-blue-950/10';
      case 'hard': return 'text-orange-400 border-orange-500/30 bg-orange-950/10';
      case 'epic': return 'text-purple-400 border-purple-500/40 bg-purple-950/20 animate-pulse';
    }
  };

  const getCategoryIcon = (cat: TaskCategory) => {
    switch (cat) {
      case 'health': return <Heart className="w-3.5 h-3.5" />;
      case 'fitness': return <Dumbbell className="w-3.5 h-3.5" />;
      case 'learning': return <BookOpen className="w-3.5 h-3.5" />;
      case 'productivity': return <CheckSquare className="w-3.5 h-3.5" />;
      case 'finance': return <Coins className="w-3.5 h-3.5" />;
      case 'mindset': return <Layers className="w-3.5 h-3.5" />;
    }
  };

  const filteredTasks = tasks.filter(t => filterCategory === 'all' || t.category === filterCategory);

  // SVG Circular progress math
  const progressPercent = Math.min(100, Math.max(0, (user.xp / user.requiredXp) * 100));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const isChallengeCompletedToday = user.lastChallengeCompletedDate === todayStr;

  // Render specific simulated activities
  const renderInteractiveChallengeSimNode = () => {
    switch (currentChallenge.type) {
      case 'breathing':
        const phaseColors = {
          Inhale: 'from-violet-500 to-indigo-500 shadow-indigo-500/50',
          Hold: 'from-purple-500 to-pink-500 shadow-pink-500/50',
          Exhale: 'from-indigo-500 to-cyan-500 shadow-cyan-500/50'
        };
        const sizeClasses = {
          Inhale: 'scale-[1.25]',
          Hold: 'scale-[1.35] shadow-[0_0_25px_rgba(168,85,247,0.8)]',
          Exhale: 'scale-[0.80]'
        };
        
        return (
          <div className="flex flex-col items-center py-6 text-center">
            <span className="font-mono text-[10px] text-indigo-400 uppercase tracking-widest mb-1 block">STREAK INITIATION CHAMBER</span>
            <span className="font-display font-medium text-slate-300 text-sm mb-5">STOIC BREATHING COUNTER: Cycle {breathingCycle} of 4</span>

            {/* Glowing Concentric Target Breathing Sphere */}
            <div className="w-48 h-48 flex items-center justify-center relative mb-6">
              {/* Pulsing Outer Rings */}
              <div className="absolute inset-0 rounded-full border border-white/5 animate-pulse scale-110"></div>
              <div className="absolute inset-2 rounded-full border border-indigo-500/5 scale-105"></div>
              
              {/* Main Breathing Bubble Component */}
              <div 
                className={`w-32 h-32 rounded-full bg-gradient-to-tr ${phaseColors[breathingPhase]} flex flex-col items-center justify-center transition-all duration-[4000ms] ease-in-out select-none transform ${sizeClasses[breathingPhase]}`}
              >
                <span className="font-display font-black tracking-widest text-white uppercase text-sm drop-shadow-md animate-pulse">
                  {breathingPhase}
                </span>
                <span className="text-[9px] font-mono text-white/80 mt-1 drop-shadow-md">
                  {breathingPhase === 'Inhale' ? 'Exhale fully first' : breathingPhase === 'Hold' ? 'Hold solar lock' : 'Release tension'}
                </span>
              </div>
            </div>

            {/* Stage Bar progress */}
            <div className="w-full max-w-xs mt-3 h-1 bg-black/60 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-indigo-400 transition-all duration-100 ease-linear" 
                style={{ width: `${breathingProgress}%` }}
              ></div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setIsChallengeRunning(false)}
                className="px-4 py-2 font-mono text-[10px] uppercase tracking-wider rounded border border-white/10 hover:border-white/20 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Eject Protocol
              </button>
              <button
                onClick={handleSealChallenge}
                disabled={breathingCycle < 4 || isSubmitting}
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:opacity-95 text-white font-mono text-[11px] uppercase font-bold tracking-widest clip-cyber shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>{breathingCycle < 4 ? 'Complete Cycles to Seal' : 'TRANSMIT & SEAL PROTOCOL'}</span>
              </button>
            </div>
            {breathingCycle < 4 && (
              <button 
                onClick={handleSealChallenge} 
                className="mt-3.5 text-[9px] font-mono text-slate-500 hover:text-indigo-400 transition-all underline shrink-0 outline-none"
              >
                (Demo Bypass: Complete Instantly anyway)
              </button>
            )}
          </div>
        );

      case 'sunlight':
        return (
          <div className="py-2.5 flex flex-col items-center">
            <Sun className="w-12 h-12 text-yellow-400 animate-spin-slow mb-4" />
            <span className="text-xs text-slate-400 block text-center max-w-md leading-relaxed font-sans mb-5">
              Exposure to natural daylight releases cortical and neural serotonin blocks, resets sleep circadian rhythms, and accelerates biological wakefulness. Enter brief calibration log below to certify outside sunlight exposure:
            </span>
            <div className="w-full max-w-md">
              <textarea
                value={sunlightNote}
                onChange={(e) => setSunlightNote(e.target.value)}
                placeholder="E.g., Solar calibration locked in details! Blue sky, high lux photons absorbed to anchor circadian engine..."
                className="w-full h-20 px-3.5 py-2.5 rounded-lg bg-black/60 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-yellow-500 outline-none resize-none font-sans placeholder-slate-600 mb-4"
              />
              <div className="flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setIsChallengeRunning(false)}
                  className="px-4 py-2 font-mono text-[10px] uppercase tracking-wider rounded border border-white/15 hover:border-white/30 text-slate-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSealChallenge}
                  disabled={!sunlightNote.trim() || isSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-mono text-[11px] font-bold uppercase tracking-wider rounded clip-cyber transition-all disabled:opacity-40 shadow-[0_0_15px_rgba(234,179,8,0.3)] cursor-pointer"
                >
                  Confirm Solar Lock-In
                </button>
              </div>
            </div>
          </div>
        );

      case 'hydration':
        return (
          <div className="py-4.5 flex flex-col items-center text-center">
            <Droplets className="w-11 h-11 text-cyan-400 animate-bounce mb-3" />
            <span className="font-display text-sm font-semibold text-slate-300 uppercase tracking-wider mb-1">CELLULAR FLOOD SEQUENCE</span>
            <span className="text-xs text-slate-500 block max-w-md font-sans mb-6">
              Consuming water triggers immediate somatic fluid balance, rehydrates tissues, and locks in energy production efficiency.
            </span>

            {/* Clickable Graphic Cup filled with water */}
            <div className="relative w-28 h-36 border-4 border-slate-700/80 rounded-b-3xl bg-black/40 overflow-hidden flex flex-col justify-end shadow-inner mb-6 group cursor-pointer" onClick={() => hydrationGulpCount < 4 && setHydrationGulpCount(g => g + 1)}>
              {/* Interactive Water level filled */}
              <div 
                className="w-full bg-gradient-to-t from-cyan-600/70 to-cyan-400/80 hover:to-cyan-300/85 transition-all duration-500 ease-in-out relative border-t border-cyan-300/30"
                style={{ height: `${(1.0 - (hydrationGulpCount / 4)) * 96}%` }}
              >
                {/* Bubble details */}
                <div className="absolute top-2 left-4 w-1.5 h-1.5 rounded-full bg-white/40 animate-ping"></div>
                <div className="absolute top-6 right-6 w-1 h-1 rounded-full bg-white/30 animate-bounce"></div>
              </div>
              {hydrationGulpCount < 4 && (
                <div className="absolute inset-0 flex items-center justify-center font-mono text-[9px] text-cyan-300 uppercase font-black tracking-widest bg-black/10 select-none group-hover:scale-105 transition-transform">
                  TAP TO GULP
                </div>
              )}
            </div>

            <span className="font-mono text-xs tracking-wider uppercase text-cyan-400 font-bold mb-5">
              CAPACITY SATISFIED: {hydrationGulpCount} / 4 GLASSES GULP-FLOW
            </span>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsChallengeRunning(false)}
                className="px-4 py-2 font-mono text-[10px] uppercase rounded border border-white/10 text-slate-500 hover:text-slate-350"
              >
                Abort Intake
              </button>
              <button
                type="button"
                onClick={handleSealChallenge}
                disabled={hydrationGulpCount < 4 || isSubmitting}
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white font-mono text-[11px] uppercase font-bold tracking-widest clip-cyber shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                Claim Hydration Payout
              </button>
            </div>
            {hydrationGulpCount < 4 && (
              <button 
                onClick={handleSealChallenge}
                className="mt-3.5 text-[9px] font-mono text-slate-500 hover:text-cyan-400 transition-all underline cursor-pointer hover:font-bold"
              >
                (Demo Bypass: Complete instantly anyway)
              </button>
            )}
          </div>
        );

      case 'pomodoro':
        const formatTime = (sec: number) => {
          const m = Math.floor(sec / 60);
          const s = sec % 60;
          return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        };
        const pomodoroPercent = (pomodoroSeconds / 1500) * 100;
        
        return (
          <div className="py-4.5 flex flex-col items-center text-center">
            <Timer className="w-12 h-12 text-indigo-400 animate-pulse mb-3" />
            <span className="font-display text-sm font-semibold text-slate-300 uppercase tracking-widest mb-1">POMODORO DEEP BLOCK DETECTOR</span>
            <span className="text-xs text-slate-500 max-w-sm block font-sans mb-5 leading-normal">
              Eliminate sensory signals, align work space, and keep absolute focus tracking on a singular milestone goal.
            </span>

            {/* Retro glowing digital chronos counter */}
            <div className="p-8 rounded-xl bg-black/60 border border-slate-900 shadow-[0_0_20px_rgba(99,102,241,0.1)] mb-5 text-center min-w-[240px]">
              <span className="font-mono text-4xl block text-indigo-400 tracking-widest select-none font-bold font-mono">
                {formatTime(pomodoroSeconds)}
              </span>
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-1 block">
                {pomodoroRunning ? 'FOCUS LOCK ENGAGED' : 'TIMER HOLD-STANDBY'}
              </span>
            </div>

            {/* Flat loading meter line */}
            <div className="w-full max-w-sm h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/5 mb-6">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-1000 ease-linear" 
                style={{ width: `${pomodoroPercent}%` }}
              ></div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setPomodoroRunning(prev => !prev);
                }}
                className={`px-5 py-2 hover:opacity-95 text-xs font-mono font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                  pomodoroRunning 
                    ? 'bg-rose-500/20 text-rose-450 border border-rose-500/30' 
                    : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                }`}
              >
                {pomodoroRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{pomodoroRunning ? 'PAUSE PROTOCOL' : 'LAUNCH MATRIX'}</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setPomodoroRunning(false);
                  setPomodoroSeconds(1500);
                }}
                className="px-4 py-2 font-mono text-slate-400 text-xs uppercase hover:text-white border border-white/15 rounded"
              >
                Reset
              </button>

              <button
                onClick={handleSealChallenge}
                disabled={isSubmitting}
                className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-white font-mono text-xs font-bold uppercase tracking-wider clip-cyber transition-all disabled:opacity-40 shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>COMPLETE SESSION</span>
              </button>
            </div>
            {pomodoroSeconds > 0 && (
              <button 
                onClick={handleSealChallenge} 
                className="mt-3.5 text-[9px] font-mono text-slate-500 hover:text-indigo-450 transition-all underline cursor-pointer"
              >
                (Demo Bypass: Complete instantly anyway)
              </button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* COLUMN LEFT: CORE PLAYER RPG METER & CHALLENGE HERO HUB */}
      <div className="lg:col-span-8 flex flex-col gap-6">

        {/* 1. MASTER DAILY SPOTLIGHT MISSION HERO CARD */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#101026] via-[#08081a] to-[#04040e] border border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.6)] relative overflow-hidden group">
          {/* Futuristic corner frame design elements */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-indigo-500/40 rounded-tl-lg"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-indigo-500/40 rounded-tr-lg"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-indigo-500/40 rounded-bl-lg"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-indigo-500/40 rounded-br-lg"></div>
          
          <div className="absolute top-[-20%] right-[-10%] w-[320px] h-[320px] bg-purple-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-purple-500/15 transition-all"></div>
          
          {/* Category Tag Header */}
          <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-4 mb-5">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 font-bold text-lg select-none">
                {currentChallenge.icon}
              </span>
              <div>
                <span className="font-mono text-[9px] text-indigo-400 block uppercase tracking-widest font-black">ACTIVE CHRONOS CHALLENGE</span>
                <span className="text-[10px] text-slate-400 font-mono uppercase">EPIC SINGLE PRIMARY DIRECTIVE</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full border border-pink-500/20 bg-pink-950/15 text-[10px] font-mono text-purple-400 uppercase font-extrabold animate-pulse">
                +{currentChallenge.xpReward} XP REWARD
              </span>
              <span className="text-xs text-orange-400 flex items-center gap-0.5 font-mono select-none">
                🔥 SOLID STREAK UP
              </span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!isChallengeCompletedToday && !isChallengeRunning && (
              <motion.div 
                key="spotlight-front"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <h1 className="font-display font-black text-2xl tracking-wider text-white uppercase text-glow-indigo">
                    {currentChallenge.title}
                  </h1>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed tracking-wide">
                    {currentChallenge.desc}
                  </p>
                </div>

                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900 leading-relaxed font-sans text-[11px] text-slate-400">
                  <span className="font-mono text-[9px] text-slate-500 uppercase block mb-1">CO-CONSTRUCTION MANDATE:</span>
                  Unlock continuous character level-ups and maintain streak counters. Completion initiates an automated real-time dispatch to the community feed loop to establish social accountability and prevent FOMO.
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setChallengeSuccessMsg(null);
                      setIsChallengeRunning(true);
                    }}
                    id="trigger-spotlight-challenge-btn"
                    className="w-full relative py-3.5 bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-700 hover:opacity-95 text-white font-display font-bold uppercase text-xs tracking-widest clip-cyber shadow-[0_0_24px_rgba(99,102,241,0.45)] hover:shadow-[0_0_35px_rgba(139,92,246,0.65)] hover:scale-[1.01] transition-all cursor-pointer block text-center"
                  >
                    🚀 START TODAY'S CHALLENGE
                  </button>
                </div>
              </motion.div>
            )}

            {!isChallengeCompletedToday && isChallengeRunning && (
              <motion.div 
                key="spotlight-active"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-xl border border-slate-900 bg-slate-950/25 relative"
              >
                {/* Closing cross */}
                <button 
                  onClick={() => setIsChallengeRunning(false)}
                  className="absolute top-2.5 right-2.5 p-1 rounded-md text-slate-500 hover:text-white hover:bg-white/5 transition-all outline-none border-none shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>

                <h3 className="font-mono text-[9px] text-indigo-400 uppercase tracking-widest mb-1 font-bold">ACTIVE SIMULATED INTERACTIVE STAGE</h3>
                <h4 className="font-display font-medium text-slate-200 text-sm mb-4 uppercase">{currentChallenge.title}</h4>
                
                {renderInteractiveChallengeSimNode()}
              </motion.div>
            )}

            {isChallengeCompletedToday && (
              <motion.div 
                key="spotlight-completed"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-6 flex flex-col items-center text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] select-none">
                  <CircleCheck className="w-9 h-9 stroke-[2.5]" />
                </div>
                
                <div className="space-y-1">
                  <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest font-black block">DAILY PROTOCOL ANCHORED</span>
                  <h3 className="font-display font-black text-xl text-white uppercase tracking-wider">
                    CHALLENGE MASTERED TODAY!
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm leading-normal">
                    Today's chronological mission has been submitted and saved in your persistent record profiles. +100 XP gained and streak counter updated successfully.
                  </p>
                </div>

                <div className="px-5 py-2 rounded bg-emerald-950/20 border border-emerald-500/20 font-mono text-[10px] text-emerald-300">
                  ⚡ WEEKLY RANK LEAD LEVEL CONFIGURED • NEXT CHALLENGE REFRESHES TOMORROW
                </div>

                <p className="text-[10px] text-indigo-400 font-mono italic">
                  👥 47 other guardians synchronized their biological clock today! Maintain the loop to preserve momentum.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toast / Challenge feedback dialog */}
          {challengeSuccessMsg && (
            <div className="mt-4 p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/30 text-[11px] font-sans text-indigo-300 flex justify-between items-center animate-fade-in">
              <span>🎉 {challengeSuccessMsg}</span>
              <button onClick={() => setChallengeSuccessMsg(null)} className="text-indigo-400 hover:text-white font-mono font-bold text-[9px] uppercase pl-2 font-mono">
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* 2. CHRONICLE COMMUNITY FEED LOG SHORTCUT PREVIEW */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4.5 h-4.5 text-purple-400" />
              <h3 className="font-display font-semibold text-sm tracking-wide text-slate-250 uppercase">
                ACTIVE VANGUARD LOG CONSOLE
              </h3>
            </div>
            {onNavigate && (
              <button 
                onClick={() => onNavigate('community', 'feed')}
                className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer outline-none bg-none border-none p-0"
              >
                Expand feed chronicles <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Post Box first */}
          <form onSubmit={handleQuickPost} className="p-3 bg-black/45 rounded-xl border border-slate-900/60 flex gap-2">
            <input 
              type="text"
              required
              value={quickPostContent}
              onChange={(e) => setQuickPostContent(e.target.value)}
              placeholder="Deploy a quick transmission directly to feed..."
              className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors outline-none font-sans text-xs"
              disabled={isPosting}
            />
            <button
              type="submit"
              disabled={isPosting || !quickPostContent.trim()}
              className="px-4 rounded-lg h-[32px] bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-mono text-[10px] uppercase font-bold tracking-wider transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isPosting ? 'DEPLOY...' : 'POST'}</span>
            </button>
          </form>

          {quickPostError && (
            <span className="text-[10px] font-mono text-pink-400 -mt-2 px-1">
              ⚠️ {quickPostError}
            </span>
          )}

          {/* Preview list */}
          <div className="space-y-3">
            {isFeedLoading ? (
              <div className="text-center py-4 text-xs font-mono text-slate-500 animate-pulse">
                SYNCING BROADCAST CORE...
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-4 text-[10px] font-mono text-slate-600">
                TRANS-SPACE QUIET. NO SHOUTS SIGNALED YET.
              </div>
            ) : (
              posts.slice(0, 2).map((post) => (
                <div key={post.id} className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl flex items-start gap-3 hover:bg-white/[0.04] transition-all">
                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-800 shrink-0 mt-0.5">
                    <AvatarImage 
                      src={post.authorAvatar} 
                      alt={post.authorName} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display font-bold text-[11px] text-slate-200">{post.authorName}</span>
                      <span className="text-[8px] font-mono text-slate-550">
                        {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-350 mt-1 line-clamp-2 leading-relaxed font-sans">
                      {post.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. OPTIONAL COLLAPSIBLE HABITS LEDGER (REMOVES INITIAL CHOICE OVERLOAD) */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden transition-all">
          <button
            onClick={() => setIsPersonalQuestsExpanded(!isPersonalQuestsExpanded)}
            id="personal-ledger-toggle-btn"
            className="w-full p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors outline-none cursor-pointer"
          >
            <div className="flex items-center gap-2 text-left">
              <CheckSquare className="w-4.5 h-4.5 text-indigo-400" />
              <div>
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-200">
                  STANDARD HABITS REGISTRY & CHORES Ledger ({tasks.length})
                </h4>
                <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                  Expand to record personal tasks, recurring sub-objectives, and habit track coordinates.
                </p>
              </div>
            </div>
            {isPersonalQuestsExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 animate-pulse" />
            )}
          </button>

          {isPersonalQuestsExpanded && (
            <div className="p-5 border-t border-white/5 bg-[#03030c]/60 space-y-5 animate-fade-in">
              {/* Add Chore form */}
              <div className="p-5 rounded-xl border border-slate-800 bg-black/35">
                <h3 className="font-display font-semibold text-xs tracking-wider text-indigo-300 mb-3.5 uppercase">
                  SUMMON NEW PERSONAL CHORE COORDINATES
                </h3>

                <form onSubmit={handleAddTask} className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="E.g., Complete 30-min coding workout..."
                      className="md:col-span-2 px-3.5 py-2.5 rounded-lg bg-black/60 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-400 transition-colors outline-none font-sans"
                    />

                    <select
                      value={taskCategory}
                      onChange={(e) => setTaskCategory(e.target.value as TaskCategory)}
                      className="px-3 py-2.5 rounded-lg bg-black/60 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:outline-none outline-none font-sans"
                    >
                      <option value="productivity">🚀 Productivity</option>
                      <option value="fitness">💪 Fitness</option>
                      <option value="learning">📚 Learning</option>
                      <option value="health">❤️ Health</option>
                      <option value="finance">🪙 Finance</option>
                      <option value="mindset">🧬 Mindset</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                    <div className="md:col-span-2">
                      <span className="block text-[9px] text-slate-500 font-mono mb-1 uppercase">DIFFICULTY COGNITIVE RATIO</span>
                      <div className="flex gap-1.5">
                        {(['easy', 'medium', 'hard', 'epic'] as TaskDifficulty[]).map((diff) => (
                          <button
                            key={diff}
                            type="button"
                            onClick={() => setTaskDifficulty(diff)}
                            className={`flex-1 py-1.5 text-[10px] font-mono uppercase rounded border transition-all ${
                              taskDifficulty === diff 
                                ? 'border-indigo-500 bg-indigo-500/15 text-indigo-450 font-bold' 
                                : 'border-white/5 bg-black/20 text-slate-400 hover:border-white/10'
                            }`}
                          >
                            {diff}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[9px] text-slate-500 font-mono mb-1 uppercase">CHORE CYCLE</span>
                      <select
                        value={taskRecurring}
                        onChange={(e) => setTaskRecurring(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded bg-black/40 border border-slate-850 text-xs text-slate-300 focus:outline-none outline-none font-sans"
                      >
                        <option value="none">One Time Only</option>
                        <option value="daily">Daily Loop</option>
                        <option value="weekly">Weekly Cycle</option>
                      </select>
                    </div>

                    <div className="self-end">
                      <button
                        type="submit"
                        disabled={isSubmitting || !taskTitle.trim()}
                        className="w-full h-[34px] font-display font-medium text-xs uppercase clip-cyber bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)] hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-45"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Summon
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Timeline list of Chores */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-lg border border-slate-900/60">
                  <span className="font-mono text-[10px] text-slate-400 uppercase font-black">CHORE REGISTRY</span>
                  
                  {tasks.some(t => t.completed) && (
                    <button
                      onClick={handleDeleteCompletedTasks}
                      className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-mono uppercase rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 border border-rose-500/30 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>PRUNE COMPLETE ({tasks.filter(t => t.completed).length})</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {filteredTasks.length === 0 ? (
                    <div className="text-center py-8">
                      <CircleCheck className="w-8 h-8 text-slate-650 mx-auto mb-1.5 animate-pulse" />
                      <p className="text-slate-550 font-mono text-[10px]">ALL CHORE BOUNDARIES CLEARED IN THIS COMN.</p>
                    </div>
                  ) : (
                    filteredTasks.map((task) => (
                      <div 
                        key={task.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-4 transition-all duration-300 ${
                          task.completed 
                            ? 'border-emerald-500/10 bg-emerald-950/5 opacity-60' 
                            : 'border-white/5 bg-black/25 hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <button
                            onClick={() => !task.completed && handleCompleteTask(task.id)}
                            disabled={task.completed}
                            className={`mt-0.5 w-4.5 h-4.5 rounded border transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                              task.completed 
                                ? 'border-emerald-500 bg-emerald-500 text-black' 
                                : 'border-slate-600 hover:border-indigo-400 bg-black/40'
                            }`}
                          >
                            {task.completed && <CheckSquare className="w-3.5 h-3.5" />}
                          </button>

                          <div className="min-w-0">
                            <span className={`text-xs block font-sans truncate ${
                              task.completed ? 'line-through text-slate-500' : 'text-slate-200'
                            }`}>
                              {task.title}
                            </span>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[8px] font-mono uppercase border ${getCategoryColor(task.category)}`}>
                                {getCategoryIcon(task.category)}
                                <span>{task.category}</span>
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase border ${getDifficultyBadge(task.difficulty)}`}>
                                {task.difficulty}
                              </span>
                              {task.recurring !== 'none' && (
                                <span className="text-[8px] font-mono text-slate-500 flex items-center gap-0.5 uppercase">
                                  <RefreshCw className="w-2.5 h-2.5 animate-spin-slow" />
                                  <span>{task.recurring}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
                          {!task.completed ? (
                            <span className="text-cyan-400 font-bold text-[10px]">
                              +{getXpReward(task.difficulty)} XP
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-black text-[9px] uppercase">
                              PAID OUT
                            </span>
                          )}
                          
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 rounded text-slate-550 hover:text-rose-450 hover:bg-rose-500/10 transition-colors cursor-pointer border-none bg-none outline-none"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* COLUMN RIGHT: USER COCKPIT DETAILS & STREAKS (PERSTENT METER BOX) */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        
        {/* AVATAR & XP LEVEL METER COCKPIT */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-white/5 to-[#0b0b1a]/60 border border-white/10 flex flex-col items-center text-center relative overflow-hidden">
          {/* Circular level display */}
          <div className="relative w-32 h-32 mb-4 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90 absolute inset-0">
              <circle cx="64" cy="64" r="48" className="stroke-slate-800/80" strokeWidth="5.5" fill="transparent" />
              <circle cx="64" cy="64" r="48" className="stroke-indigo-400 transition-all duration-700 ease-out" strokeWidth="5.5" fill="transparent" strokeDasharray={2 * Math.PI * 48} strokeDashoffset={2 * Math.PI * 48 - (progressPercent / 100) * (2 * Math.PI * 48)} strokeLinecap="round" />
            </svg>
            <div className="w-[110px] h-[110px] rounded-full overflow-hidden border border-white/10 bg-black/60 flex items-center justify-center">
              <AvatarImage src={user.avatar} alt={user.username} className="w-full h-full object-cover select-none" />
            </div>
          </div>

          <h2 className="font-display font-black text-base text-slate-100 uppercase tracking-widest text-glow-blue">
            {user.username}
          </h2>
          <span className="font-mono text-[9px] text-indigo-400 uppercase tracking-widest mt-1 font-extrabold block">
            {getUserRank(user.level).badge} {getUserRank(user.level).name}
          </span>

          {/* XP progress details */}
          <div className="w-full mt-4 p-3 bg-black/40 rounded-xl border border-white/5 font-mono text-left">
            <div className="flex justify-between items-center text-[10px] mb-1.5 uppercase font-black text-slate-400">
              <span>LVL {user.level} RATING</span>
              <span className="text-indigo-400">{user.xp} / {user.requiredXp} XP</span>
            </div>
            
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_8px_rgba(139,92,246,0.6)] transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="flex gap-1.5 mt-3.5 items-center justify-center flex-wrap">
            <span className="text-[9px] text-slate-500 font-mono uppercase">BADGES:</span>
            {user.badges.slice(0, 4).map((badge, idx) => (
              <span key={idx} title={badge.title} className="w-4.5 h-4.5 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-[8px] text-purple-400 select-none">
                ★
              </span>
            ))}
            {user.badges.length > 4 && <span className="text-[9px] font-mono text-slate-550">+{user.badges.length - 4}</span>}
            {user.badges.length === 0 && <span className="text-[9px] font-mono text-slate-600">NONE</span>}
          </div>
        </div>

        {/* PERSISTENT WEEK GRID STREAKS */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between gap-3 mb-3.5">
            <div className="flex items-center gap-2">
              <Flame className="w-4.5 h-4.5 text-orange-400 animate-bounce" />
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-pink-200">
                DAILY SYNCHRONY
              </h3>
            </div>
            <span className="font-mono text-xs text-orange-400 font-bold bg-orange-400/10 border border-orange-400/25 px-2.5 py-0.5 rounded">
              {user.streak} DAYS FLAME
            </span>
          </div>

          <p className="text-[10.5px] text-slate-450 leading-relaxed font-sans mb-4 border-l-2 border-indigo-500/20 pl-2.5">
            Complete at least one real-world calibration coordinate daily to foster your flame. Continuous streaks amplify experience points multipliers.
          </p>

          {/* Weekday boxes */}
          <div className="grid grid-cols-7 gap-1.5 font-mono text-[9px] text-center text-slate-500 leading-normal">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, dIdx) => {
              const d = new Date();
              const currentDayIndex = d.getDay();
              const isPastOrToday = dIdx <= currentDayIndex;
              const isActive = user.streak >= (dIdx + 1) || (currentDayIndex === dIdx && isChallengeCompletedToday);
              
              return (
                <div key={dIdx} className="flex flex-col items-center">
                  <span className="mb-1 text-[9px] text-slate-400 font-bold">{day}</span>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${
                    isActive 
                      ? 'bg-gradient-to-br from-pink-500/20 to-orange-500/20 border-orange-500/50 text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.15)] font-bold' 
                      : isPastOrToday 
                        ? 'bg-black/35 border-slate-900 text-slate-650' 
                        : 'bg-black/20 border-slate-950 text-slate-800'
                  }`}>
                    {isActive ? '🔥' : '•'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TOTAL METRICS SLIDES */}
        <div className="p-4 rounded-xl border border-white/10 bg-white/5 grid grid-cols-2 gap-3 text-center">
          <div className="p-3 rounded-lg bg-black/20 border border-white/5">
            <span className="text-slate-500 font-mono text-[9px] uppercase block mb-0.5 font-bold">XP DEPOSITED</span>
            <span className="text-indigo-400 text-base font-display font-black">+{xpGainedToday}</span>
          </div>
          <div className="p-3 rounded-lg bg-black/20 border border-white/5">
            <span className="text-slate-500 font-mono text-[9px] uppercase block mb-0.5 font-bold">TOTAL CHORES</span>
            <span className="text-purple-400 text-base font-display font-black">{totalCompleted}</span>
          </div>
        </div>

      </div>

    </div>
  );
}
