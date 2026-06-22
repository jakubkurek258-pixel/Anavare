import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { stateService, getXpReward } from '../lib/stateService';
import { trackEvent } from '../lib/firebase';
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
    title: "Neural Lung Core Calibration",
    desc: "Release cognitive fatigue and stabilize focus. Perform 5 cycles of calming, slow diaphragmatic breathing (5s inhale, 2s gentle hold, 7s smooth exhale).",
    category: "mindset" as TaskCategory,
    xpReward: 100,
    icon: "🌬️",
    instruction: "Breathe in harmony with the glowing core expansion. Follow the expanding ring's rhythm, and lock your focus into the flow.",
    type: "breathing"
  },
  {
    id: "hydration_wake",
    title: "The First Splash: Awakening Hydration",
    desc: "Instantly wake up your digestive organs and cells by drinking 1 tall glass of pure, cool water right after waking up.",
    category: "health" as TaskCategory,
    xpReward: 100,
    icon: "💧",
    instruction: "Drink up! Rehydrating early boosts cognitive function and metabolizes overnight sleep fatigue.",
    type: "hydration"
  },
  {
    id: "morning_light",
    title: "Circadian Solar Anchor Protocol",
    desc: "Spend 10-15 minutes outside in indirect natural morning sunlight to anchor your sleep cycle and kickstart biological dopamine levels.",
    category: "health" as TaskCategory,
    xpReward: 100,
    icon: "🌅",
    instruction: "Anchor your circadian clock by confirming direct solar rays standard exposure.",
    type: "sunlight"
  },
  {
    id: "workspace_declutter",
    title: "Deconstruct the Chaos: 10-Min Space Purge",
    desc: "A tidy physical space leads directly to a focused mind. Clean, organize, or micro-declutter your desk or room for exactly 10 minutes.",
    category: "productivity" as TaskCategory,
    xpReward: 100,
    icon: "🧹",
    instruction: "Put away the clutter! Clear your visual field to build robust mental clarity indexes.",
    type: "generic"
  },
  {
    id: "gentle_mobility",
    title: "Joint Harmonizer: 5-Min Fluid Mobility",
    desc: "Release stored physical tension. Spend 5 minutes working on slow, soothing hip and shoulder ranges of motion.",
    category: "fitness" as TaskCategory,
    xpReward: 100,
    icon: "🧘",
    instruction: "Follow basic slow circular joint rotations. Gentle, soothing, and fully restorative.",
    type: "generic"
  },
  {
    id: "pomodoro_activation",
    title: "Quantum Focus Block: The Pomodoro Lock",
    desc: "Execute a zero-distraction 25-minute Pomodoro deep work sprint on your highest-leverage goal of the day.",
    category: "productivity" as TaskCategory,
    xpReward: 100,
    icon: "⏱️",
    instruction: "Lock yourself in for a 25-minute Pomodoro deep work sequence. Silence the sensory net.",
    type: "pomodoro"
  },
  {
    id: "nasal_breathing",
    title: "Stoic Oxygenation: 3-Min Nasal Flow",
    desc: "Breathe only through your nose for 3 minutes. Nasal breathing increases filtration, filters allergens, and switches the brain to calm focus.",
    category: "mindset" as TaskCategory,
    xpReward: 100,
    icon: "👃",
    instruction: "Inhale and exhale purely through the nasal passages. Breathe deeply down into your belly.",
    type: "generic"
  },
  {
    id: "quick_workout",
    title: "The Spark: 10-Min Rapid Workout",
    desc: "No gym? No problem. Complete a quick, energetic 10-minute bodyweight circuit or active movement to boost chemical endorphins.",
    category: "fitness" as TaskCategory,
    xpReward: 100,
    icon: "⚡",
    instruction: "Perform simple squats, jumping jacks, or pushups. Just get the kinetic engine active.",
    type: "generic"
  },
  {
    id: "digital_detox_morning",
    title: "Mind Shield: 1-Hour Morning Screen Detox",
    desc: "Do not check any social media, notification networks, or feed algorithms for the first 60 minutes after waking up.",
    category: "productivity" as TaskCategory,
    xpReward: 100,
    icon: "📵",
    instruction: "Keep your mind clear of external dopamine triggers during your golden first hour of consciousness.",
    type: "generic"
  },
  {
    id: "slow_deep_breath",
    title: "Waking Up: 10 Deep conscious breaths",
    desc: "Right after wake up, sit upright and take 10 deep, conscious chest and belly expansions to oxygenate your blood.",
    category: "mindset" as TaskCategory,
    xpReward: 100,
    icon: "🌬️",
    instruction: "Slow, deep, conscious expansions of your belly. No rush, absolute clarity.",
    type: "generic"
  },
  {
    id: "hydration_marathon",
    title: "Water Forge: The 2-Liter Milestones",
    desc: "Keep somatic hydration parameters steady! Consume at least 2 full liters of pure water throughout the day.",
    category: "health" as TaskCategory,
    xpReward: 100,
    icon: "🥛",
    instruction: "Log your progress. Carry a water bottle with you and keep taking gentle sips to stay peak energized.",
    type: "generic"
  },
  {
    id: "unprocessed_meal",
    title: "Somatic Fuel: Clean Earth-Grown Meal",
    desc: "Nourish your cells with high-quality nutrients. Eat at least one fully unprocessed, nutrient-dense natural meal today.",
    category: "health" as TaskCategory,
    xpReward: 100,
    icon: "🥗",
    instruction: "Choose fresh vegetables, clean proteins, and whole foods. Avoid processed ingredients for this block.",
    type: "generic"
  },
  {
    id: "no_sugary_drinks",
    title: "Zero Sugar Rush: Pure Liquid Discipline",
    desc: "Eliminate sugary sodas, energy drinks, and highly sweetened beverages for the entire day. Hydrate with water or tea.",
    category: "health" as TaskCategory,
    xpReward: 100,
    icon: "🚫",
    instruction: "Protect your metabolism, reduce brain fog, and lock in consistent, non-flickering energy levels.",
    type: "generic"
  },
  {
    id: "power_squats",
    title: "Lower Core Blast: 20 Stoic Squats",
    desc: "Perform 20 controlled, full-range air squats to activate your system's largest muscle groups and boost circulation.",
    category: "fitness" as TaskCategory,
    xpReward: 100,
    icon: "🦵",
    instruction: "Keep your chest up, heels flat on the floor, and drop your posture knee-parallel.",
    type: "generic"
  },
  {
    id: "pushup_matrix",
    title: "Upper Core Forge: 10 Calibrated Push-Ups",
    desc: "Strengthen your shoulder and chest chain. Complete 10 standard push-ups (or knee push-ups / incline pushups).",
    category: "fitness" as TaskCategory,
    xpReward: 100,
    icon: "💪",
    instruction: "Keep your core locked tight, lower slowly, and push away from the earth as one unified frame.",
    type: "generic"
  },
  {
    id: "focused_learning",
    title: "Neural Expansion: 10-Min Lesson Session",
    desc: "Spend 10 minutes intentionally learning something completely new—read a science article, watch an educational tutorial, or practice coding.",
    category: "learning" as TaskCategory,
    xpReward: 100,
    icon: "🧠",
    instruction: "Expand your theoretical horizons. Feed your brain raw information coordinates and take brief synthesis notes.",
    type: "generic"
  },
  {
    id: "daily_clean_walk",
    title: "The Explorer's Path: 20-Min Recovery Walk",
    desc: "Engage in a scenic 20-minute outdoor walk to active-recover tired muscles, clear high stress levels, and let the brain wander.",
    category: "fitness" as TaskCategory,
    xpReward: 100,
    icon: "🚶",
    instruction: "A simple walk down the block with no active phone distractions. Absorb the surroundings.",
    type: "generic"
  },
  {
    id: "five_min_silence",
    title: "Zen Frequency: 5 Minutes of Pure Silence",
    desc: "Sit in absolute, quiet stillness with zero sensory loops (no music, no screens, no reading) for 5 minutes.",
    category: "mindset" as TaskCategory,
    xpReward: 100,
    icon: "🧘",
    instruction: "Quiet the ambient noise. Let your thoughts pass by like harmless clouds on radar.",
    type: "generic"
  },
  {
    id: "read_pages",
    title: "Tome Synthesis: 5 to 10 Book Pages",
    desc: "Read 5 to 10 pages of any physical book or specialized non-fiction publication text to boost intellectual depth.",
    category: "learning" as TaskCategory,
    xpReward: 100,
    icon: "📚",
    instruction: "Build deeper comprehension. Slow down your focus and absorb high-density written concepts.",
    type: "generic"
  },
  {
    id: "self_improvement_reflect",
    title: "The Self-Mirror: Evolution Logging",
    desc: "Reflect and write down exactly one behavioral trend, habit, or attribute in yourself you wish to intentionally refine.",
    category: "mindset" as TaskCategory,
    xpReward: 100,
    icon: "📝",
    instruction: "Honest, stoic self-acknowledgement is the core cornerstone of behavioral level-ups.",
    type: "generic"
  },
  {
    id: "one_kind_act",
    title: "Empathetic Catalyst: One Kind Gesture",
    desc: "Do something genuinely kind, helpful, or encouraging for someone else today with absolute humility.",
    category: "mindset" as TaskCategory,
    xpReward: 100,
    icon: "❤️",
    instruction: "Text a supportive message, help a friend finish an errand, or encourage a peer. Connect human nodes.",
    type: "generic"
  },
  {
    id: "five_min_stretching",
    title: "Spinal Decompression: 10-Min Full Stretch",
    desc: "Slowly lengthen your muscle fibers. Spend 10 minutes in a full-body stretching sequence, focusing on leg and neck tension.",
    category: "fitness" as TaskCategory,
    xpReward: 100,
    icon: "🙆",
    instruction: "Hold each stretch gently for 20-30 seconds. Do not bounce—just breathe through the muscle release.",
    type: "generic"
  },
  {
    id: "no_phone_block",
    title: "Deep Presence: 30-Min Phone Lockout",
    desc: "Place your phone in another room or inside a closed drawer for exactly 30 minutes while awake to reset attention parameters.",
    category: "productivity" as TaskCategory,
    xpReward: 100,
    icon: "📵",
    instruction: "Silence the visual and digital attention hooks. Restore your dopamine baseline.",
    type: "generic"
  },
  {
    id: "avoided_task",
    title: "Slaying the Dragon: Tackle One Avoided Task",
    desc: "Identify that one high-resistance chore or task you have been procrastinating, and spend at least 10 minutes working on it.",
    category: "productivity" as TaskCategory,
    xpReward: 100,
    icon: "🎯",
    instruction: "Action cures fear. Start the task immediately; you'll find the resistance melts away within minutes.",
    type: "generic"
  },
  {
    id: "plan_tomorrow",
    title: "Tactical Blueprint: Plan Tomorrow Today",
    desc: "Specify your top 3 critical objectives for tomorrow. Write them down so you can wake up with absolute tactical velocity.",
    category: "productivity" as TaskCategory,
    xpReward: 100,
    icon: "📋",
    instruction: "Do not leave tomorrow to chance. Anchor your intentions and plan your offensive.",
    type: "generic"
  },
  {
    id: "plank_hold",
    title: "Defensive Vault: Plank Endurance Hold",
    desc: "Perform a plank hold to test and align core defense. Attempt to hold standard correct position for up to 2 minutes.",
    category: "fitness" as TaskCategory,
    xpReward: 100,
    icon: "🛡️",
    instruction: "Elbows aligned beneath shoulders, neck neutral, belly tight. Hold the matrix line.",
    type: "generic"
  },
  {
    id: "consume_greens",
    title: "Biological Optimizer: Eat Unprocessed Greens",
    desc: "Ensure cellular vitality by eating at least one fresh fruit or dark green raw vegetable today.",
    category: "health" as TaskCategory,
    xpReward: 100,
    icon: "🥦",
    instruction: "Provide vital micronutrients, minerals, and natural fiber to fuel your biological engine.",
    type: "generic"
  },
  {
    id: "one_min_gratitude",
    title: "Wealth Index: 1-Min Relentless Gratitude",
    desc: "Spend 1 minute reviewing exactly 3 separate aspects of your current life context that you are deeply grateful for.",
    category: "mindset" as TaskCategory,
    xpReward: 100,
    icon: "🙏",
    instruction: "Notice the simple abundance present around you. Shift your mental paradigm from scarcity to wealth.",
    type: "generic"
  },
  {
    id: "victory_journal",
    title: "Victory Ledger: 3 Wins of the Day",
    desc: "Write down exactly 3 small things or actions you did well or handled with excellence today to lock in confidence.",
    category: "mindset" as TaskCategory,
    xpReward: 100,
    icon: "🌟",
    instruction: "Reinforce positive neuro-association pathways. Champion your micro-wins to fuel confidence.",
    type: "generic"
  },
  {
    id: "breathing_warmth",
    title: "The Resonance: 5-Min Calm Breathing",
    desc: "Engage in a continuous 5-minute deep focus breathing session to lower biological stress markers.",
    category: "mindset" as TaskCategory,
    xpReward: 100,
    icon: "🌬️",
    instruction: "Breathe calmly. Inhale slow, rhythmic air and exhale longer to activate parasympathetic mastery.",
    type: "generic"
  },
  {
    id: "daily_reset_bonus",
    title: "The Daily Reset: 15-Min Pure Offline Detox",
    desc: "Disconnect to reconnect. Spend 15 minutes fully offline: no smartphone, no desktop, no wireless audio, and no screens.",
    category: "productivity" as TaskCategory,
    xpReward: 100,
    icon: "🔥",
    instruction: "Sit with an analog notepad, stretch, clean, or meditate. Completely detach from the sensory net.",
    type: "generic"
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
  const [isFeedPreviewExpanded, setIsFeedPreviewExpanded] = useState(false);
  const [isChallengeRunning, setIsChallengeRunning] = useState(false);
  const [challengeSuccessMsg, setChallengeSuccessMsg] = useState<string | null>(null);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  
  // Live Community Ticker States No. 6
  const [tickerIdx, setTickerIdx] = useState(0);
  
  // Interactive Simulator States
  const [breathingCycle, setBreathingCycle] = useState(1);
  const [breathingPhase, setBreathingPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [breathingProgress, setBreathingProgress] = useState(0); // 0 to 100 for current phase progress

  const [pomodoroSeconds, setPomodoroSeconds] = useState(1500); // 25:00
  const [pomodoroRunning, setPomodoroRunning] = useState(false);

  const [hydrationGulpCount, setHydrationGulpCount] = useState(0);
  const [sunlightNote, setSunlightNote] = useState('');
  
  // Generic challenge tracking states
  const [genericConfirmed, setGenericConfirmed] = useState(false);
  const [genericNote, setGenericNote] = useState('');

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

  // Set up community live ticker cycle No. 6
  useEffect(() => {
    const totalEvents = getTickerEvents().length;
    if (totalEvents === 0) return;
    
    const tickerTimer = setInterval(() => {
      setTickerIdx((prev) => (prev + 1) % totalEvents);
    }, 4500);
    
    return () => clearInterval(tickerTimer);
  }, [posts]);

  // Combined real-time Firestore activity logs & fallback virtual logging No. 6
  const getTickerEvents = () => {
    const virtualEvents = [
      { id: 'v1', text: '🏆 Emma reached Level 5 (+200 XP)', icon: '⭐' },
      { id: 'v2', text: '🔥 Noah completed a morning mindset challenge', icon: '⚡' },
      { id: 'v3', text: '🎯 Sophia accomplished Level 2 Stoic breathing protocol', icon: '🧬' },
      { id: 'v4', text: '💪 Alex checked off a high-intensity physical workout chore', icon: '🏋️' },
      { id: 'v5', text: '🪙 Liam mastered Financial stewardship lesson 1', icon: '💰' },
      { id: 'v6', text: '📚 Maya unlocked the productivity focal scholar badge', icon: '🎓' },
    ];
    
    const realEvents = posts.slice(0, 4).map((post, idx) => ({
      id: `real_${post.id}_${idx}`,
      text: `🛰️ ${post.authorName}: "${post.content.length > 55 ? post.content.substring(0, 52) + '...' : post.content}"`,
      icon: '💬'
    }));

    return [...realEvents, ...virtualEvents];
  };

  // No. 5 Rotating Motivational Message Generator
  const getMotivationalGreeting = () => {
    const messages = [
      `🔥 You're currently on a ${user.streak}-day active synchrony streak!`,
      `⚡ Only ${user.requiredXp - user.xp} XP until you unlock Level ${user.level + 1}!`,
      `🏆 Complete today's mission: "${currentChallenge.title}" for bonus XP coordinates!`,
      `🚀 Keep your momentum going, ${user.username || 'Traveler'}! Every completed protocol adds up.`,
      `⭐ You're making elite progress every single day. The coordinates are aligning!`,
    ];
    
    const idx = (dayOfMonth + (todayDateObj.getHours() % 12)) % messages.length;
    return messages[idx];
  };

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
    
    const phaseDurations: Record<'Inhale' | 'Hold' | 'Exhale', number> = {
      Inhale: 5000, // Calming 5s inhale
      Hold: 2000,   // Relaxed 2s brief pause/hold
      Exhale: 7000  // Calming 7s smooth exhale
    };

    let currentPhase: 'Inhale' | 'Hold' | 'Exhale' = 'Inhale';
    let currentLimit = phaseDurations[currentPhase];

    breathingTimerRef.current = setInterval(() => {
      phaseTimer += 100;
      const progress = Math.min((phaseTimer / currentLimit) * 100, 100);
      setBreathingProgress(progress);

      if (phaseTimer >= currentLimit) {
        phaseTimer = 0;
        setBreathingProgress(0);
        
        if (currentPhase === 'Inhale') {
          currentPhase = 'Hold';
          currentLimit = phaseDurations.Hold;
          setBreathingPhase('Hold');
        } else if (currentPhase === 'Hold') {
          currentPhase = 'Exhale';
          currentLimit = phaseDurations.Exhale;
          setBreathingPhase('Exhale');
        } else {
          // Exhale finished, checking cycle limits (5 cycles)
          let reachedLimit = false;
          setBreathingCycle(c => {
            if (c >= 5) {
              reachedLimit = true;
              return c;
            }
            return c + 1;
          });

          if (reachedLimit) {
            if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
            return;
          }

          currentPhase = 'Inhale';
          currentLimit = phaseDurations.Inhale;
          setBreathingPhase('Inhale');
        }
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
      trackEvent('create_post', { container: 'dashboard', character: user.username });
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
      trackEvent('complete_task', { task_id: id });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await stateService.deleteTask(user.id, id);
      trackEvent('delete_task', { task_id: id });
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
      
      trackEvent('complete_challenge', { 
        challenge_id: currentChallenge.id, 
        challenge_title: currentChallenge.title, 
        xp_reward: currentChallenge.xpReward 
      });
      
      setChallengeSuccessMsg(`You have successfully synchronized today's challenge: "${currentChallenge.title}" (+${currentChallenge.xpReward} XP)!`);
      setIsChallengeRunning(false);
      setShowCelebrationModal(true);
      
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
        
        // Synced transition lengths (in ms)
        const phaseTransDurations = {
          Inhale: '5000ms',
          Hold: '2000ms',
          Exhale: '7000ms'
        };
        
        return (
          <div className="flex flex-col items-center py-6 text-center">
            <span className="font-mono text-[10px] text-indigo-400 uppercase tracking-widest mb-1 block">STREAK INITIATION CHAMBER</span>
            <span className="font-display font-medium text-slate-300 text-sm mb-5">CALMING BREATHING COUNTER: Cycle {breathingCycle} of 5</span>
 
            {/* Glowing Concentric Target Breathing Sphere */}
            <div className="w-48 h-48 flex items-center justify-center relative mb-6">
              {/* Pulsing Outer Rings */}
              <div className="absolute inset-0 rounded-full border border-white/5 animate-pulse scale-110"></div>
              <div className="absolute inset-2 rounded-full border border-indigo-500/5 scale-105"></div>
              
              {/* Main Breathing Bubble Component */}
              <div 
                className={`w-32 h-32 rounded-full bg-gradient-to-tr ${phaseColors[breathingPhase]} flex flex-col items-center justify-center transition-all ease-in-out select-none transform ${sizeClasses[breathingPhase]}`}
                style={{ transitionDuration: phaseTransDurations[breathingPhase] }}
              >
                <span className="font-display font-black tracking-widest text-white uppercase text-sm drop-shadow-md animate-pulse">
                  {breathingPhase}
                </span>
                <span className="text-[9px] font-mono text-white/80 mt-1 drop-shadow-md px-2 text-center">
                  {breathingPhase === 'Inhale' ? 'Slowly fill your lungs 🌬️' : breathingPhase === 'Hold' ? 'Suspend gently 🧘' : 'Gentle, soothing release 🌊'}
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
                disabled={breathingCycle < 5 || isSubmitting}
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:opacity-95 text-white font-mono text-[11px] uppercase font-bold tracking-widest clip-cyber shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>{breathingCycle < 5 ? 'Complete Cycles to Seal' : 'TRANSMIT & SEAL PROTOCOL'}</span>
              </button>
            </div>
            {breathingCycle < 5 && (
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
        return (
          <div className="py-4 flex flex-col items-center">
            {/* Visual Header */}
            <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl mb-4 animate-bounce">
              {currentChallenge.icon}
            </div>
            
            <p className="text-xs text-slate-300 text-center max-w-md leading-relaxed font-sans mb-5 px-3">
              {currentChallenge.instruction || "Anchor your commitment to raw, self-directed development. Perform this routine to build robust discipline nodes and earn rewards."}
            </p>

            {/* Reflection Note Pad */}
            <div className="w-full max-w-md space-y-4 px-3">
              <div className="bg-black/25 rounded-xl border border-white/5 p-4 flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="generic-task-confirm"
                  checked={genericConfirmed}
                  onChange={(e) => setGenericConfirmed(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-700 bg-black text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="generic-task-confirm" className="text-xs font-mono text-slate-350 uppercase tracking-wider cursor-pointer select-none">
                  Check to confirm protocol complete (+{currentChallenge.xpReward} XP pending)
                </label>
              </div>

              <textarea
                value={genericNote}
                onChange={(e) => setGenericNote(e.target.value)}
                placeholder="Log your thoughts, habits tracker notes, or any personal evolution insights (optional)..."
                className="w-full h-20 px-3.5 py-2.5 rounded-lg bg-black/60 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:focus:border-indigo-500 outline-none resize-none font-sans placeholder-slate-600 shadow-inner"
              />

              <div className="flex justify-end gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsChallengeRunning(false);
                    setGenericConfirmed(false);
                  }}
                  className="px-4 py-2 font-mono text-[10px] uppercase tracking-wider rounded border border-white/10 hover:border-white/20 text-slate-500 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleSealChallenge();
                    setGenericConfirmed(false);
                  }}
                  disabled={!genericConfirmed || isSubmitting}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:opacity-95 text-white font-mono text-[11px] uppercase font-bold tracking-widest clip-cyber shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>Transmit & Seal Protocol</span>
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  const getNextLevelUnlockText = () => {
    const nextLevel = user.level + 1;
    if (nextLevel <= 3) return `"Scholar Apprentice" Portrait package, and unlocks the Finance Accumulator Skill Tree!`;
    if (nextLevel <= 5) return `"Adept Stoic" Achievement Badge, and unlocks the stoic breathing guidance loop level 2!`;
    if (nextLevel <= 8) return `"Master Guardian" Companion Profile overlay, and unlocks exclusive custom portraits package (+350 XP bonus!)`;
    return `"Eternal Archon" Legendary status title, and locks in elite tier rewards!`;
  };

  return (
    <div className="w-full flex flex-col gap-6 items-center">
      
      {/* CELEBRATION MODAL OVERLAY */}
      <AnimatePresence>
        {showCelebrationModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              className="max-w-md w-full bg-gradient-to-b from-[#1b193d] to-[#04020a] border-2 border-indigo-500/50 rounded-2xl shadow-[0_0_50px_rgba(99,102,241,0.4)] p-6 text-center relative overflow-hidden"
            >
              {/* Confetti sparkle animations */}
              <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-violet-400 via-indigo-500 to-cyan-500"></div>
              
              {/* Confetti simulation elements (emojis cascade) */}
              <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-1/4 left-1/4 animate-bounce text-2xl">🔥</div>
                <div className="absolute top-1/3 right-1/4 animate-ping text-xl">⚡</div>
                <div className="absolute top-2/3 left-1/3 animate-pulse text-2xl">⭐</div>
                <div className="absolute top-1/2 right-1/3 animate-bounce text-xl">✨</div>
                <div className="absolute top-4/5 left-1/2 text-2xl">👑</div>
              </div>

              <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-yellow-300 rounded-full flex items-center justify-center mx-auto mb-5 shadow-[0_0_25px_rgba(234,179,8,0.4)] select-none">
                <Trophy className="w-10 h-10 text-slate-950 stroke-[2.5] animate-bounce" />
              </div>

              <span className="font-mono text-[10px] text-amber-400 uppercase tracking-widest font-black block mb-1">
                MISSION COMPLETED • SECURED SUCCESS
              </span>
              <h2 className="font-display font-black text-2xl text-white uppercase tracking-wider mb-3 leading-tight text-glow-indigo">
                CONGRATULATIONS!
              </h2>
              
              <div className="p-4 bg-black/55 border border-white/5 rounded-xl text-left space-y-2 mb-6">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-450">MISSION DEPOSIT:</span>
                  <span className="text-emerald-400 font-bold">+{currentChallenge.xpReward} XP</span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-450">STREAK MULTIPLIER:</span>
                  <span className="text-orange-400 font-bold">{user.streak} DAYS ACTIVE</span>
                </div>
                <div className="h-[1px] bg-white/5 my-1" />
                <div className="text-[11px] text-slate-300 font-sans leading-relaxed text-center">
                  "Awesome progress! Today's chronological coordinates have been verified. Keep up the daily flow to preserve multi-day score modifiers."
                </div>
              </div>

              <button
                onClick={() => setShowCelebrationModal(false)}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-display font-bold uppercase text-xs tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] cursor-pointer outline-none border-none"
              >
                Claim XP & Hold the Flame
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* No. 6 LIVE COMMUNITY INTERACTIVE TICKER */}
      <div className="w-full max-w-4xl bg-black/50 border border-indigo-500/15 rounded-2xl px-4 py-2 flex items-center overflow-hidden shadow-inner gap-3">
        <div className="flex items-center gap-1.5 shrink-0 px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-[9px] font-mono uppercase font-black tracking-widest">
          <Activity className="w-3 h-3 text-indigo-400 animate-pulse" />
          <span>Vanguard Live Radar</span>
        </div>
        <div className="flex-1 overflow-hidden relative h-5 flex items-center">
          <AnimatePresence mode="wait">
            {getTickerEvents().length > 0 && (
              <motion.div
                key={tickerIdx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.45 }}
                className="text-xs text-slate-300 font-sans font-medium flex items-center gap-2"
              >
                <span>{getTickerEvents()[tickerIdx]?.icon}</span>
                <span className="truncate">{getTickerEvents()[tickerIdx]?.text}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="shrink-0 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="font-mono text-[8px] text-emerald-400 uppercase tracking-widest font-bold">ONLINE</span>
        </div>
      </div>

      {/* ==========================================
          ABOVE THE FOLD: MAIN DUOLINGO PRIMARY HUB
          ========================================== */}
      <div className="w-full max-w-4xl bg-gradient-to-b from-[#0a0921] to-[#04030d] rounded-3xl border border-indigo-500/25 p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
        
        {/* Subtle geometric glowing grid behind above the fold stats */}
        <div className="absolute top-0 right-0 w-[240px] h-[240px] bg-indigo-500/10 blur-[90px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[240px] h-[240px] bg-rose-500/5 blur-[90px] rounded-full pointer-events-none"></div>

        {/* No. 5 MOTIVATIONAL DYNAMIC DECRYPT greeter */}
        <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-black/35 border border-indigo-500/15 flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <span className="block font-mono text-[8px] text-indigo-400 tracking-wider uppercase font-black mb-1">MOTIVATIONAL DECRYPT MATRIX</span>
            <p className="font-sans text-xs md:text-sm text-slate-100 font-medium leading-relaxed italic truncate">
              {getMotivationalGreeting()}
            </p>
          </div>
          <div className="shrink-0 w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-300 font-bold text-sm">
            ✦
          </div>
        </div>

        {/* 1. TOP HUD VITAL METRICS BLOCK */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center border-b border-indigo-500/10 pb-6 mb-6">
          
          {/* Streak Indicator Widget */}
          <div className="flex items-center gap-3.5 bg-black/40 border border-orange-500/20 p-4 rounded-2xl shadow-[0_4px_15px_rgba(249,115,22,0.05)]">
            <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/30 rounded-xl flex items-center justify-center">
              <Flame className="w-7 h-7 text-orange-400 animate-pulse" />
            </div>
            <div>
              <span className="block font-mono text-[9px] text-slate-500 uppercase tracking-widest">CURRENT FLAME</span>
              <span className="font-display font-black text-xl text-orange-400 uppercase tracking-wide">
                {user.streak} Days Active
              </span>
            </div>
          </div>

          {/* Level representation Indicator */}
          <div className="flex items-center gap-3.5 bg-black/40 border border-indigo-500/20 p-4 rounded-2xl shadow-[0_4px_15px_rgba(99,102,241,0.05)]">
            <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-center">
              <Award className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <span className="block font-mono text-[9px] text-slate-500 uppercase tracking-widest">VANGUARD RANK</span>
              <span className="font-display font-black text-lg text-white uppercase tracking-wide truncate block max-w-[180px]">
                Level {user.level} Adept
              </span>
            </div>
          </div>

          {/* XP Progress Bar Gauge */}
          <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col justify-center">
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-450 uppercase mb-2">
              <span>XP TRACKER</span>
              <span className="text-cyan-400 font-bold">{user.xp} / {user.requiredXp} XP</span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-white/5 relative">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600 transition-all duration-700 ease-out shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <span className="text-[8px] text-slate-500 font-mono tracking-wider mt-1.5 uppercase text-right">
              {Math.round(progressPercent)}% toward Level {user.level + 1}
            </span>
          </div>

        </div>

        {/* 2. CHRONO TODAY'S MISSION CARD (LARGE) */}
        <div className="bg-gradient-to-br from-[#121132] via-[#08071e] to-[#030209] rounded-2xl border-2 border-indigo-500/35 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.6)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[40px] pointer-events-none"></div>

          {/* Today badge header */}
          <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4 gap-4 flex-wrap">
            <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-lg font-mono text-[10px] text-indigo-300 uppercase tracking-widest font-black flex items-center gap-1.5">
              <span>{currentChallenge.icon}</span>
              <span>DAILY CAMPAIGN MISSION</span>
            </span>
            <div className="flex items-center gap-2 font-mono text-xs text-orange-400 font-bold">
              <span>🔥 MULTIPLIER {(1.0 + user.streak * 0.05).toFixed(2)}x LOCK</span>
              <span className="px-2 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20 text-[9px]">
                +{currentChallenge.xpReward} XP
              </span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!isChallengeCompletedToday && !isChallengeRunning && (
              <motion.div 
                key="front-layout"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <h1 className="font-display font-black text-2xl md:text-3xl tracking-wider text-white uppercase text-glow-indigo">
                    {currentChallenge.title}
                  </h1>
                  <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-sans max-w-2xl">
                    {currentChallenge.desc}
                  </p>
                </div>

                <div className="p-4 bg-slate-950/50 rounded-xl border border-white/5 leading-relaxed font-sans text-xs text-slate-400 flex items-start gap-2.5">
                  <span className="text-lg">🎯</span>
                  <div>
                    <span className="font-mono text-[9px] text-slate-500 uppercase block font-bold mb-0.5">ESTABLISH CHRONO VELOCITY:</span>
                    Completing this daily synchronization anchors your life path index, feeds the collective, and advances your skill tree stats. Start the active calibration lock now.
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setChallengeSuccessMsg(null);
                      setIsChallengeRunning(true);
                    }}
                    id="trigger-spotlight-challenge-btn"
                    className="w-full relative py-4 bg-gradient-to-r from-emerald-500 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-display font-bold uppercase text-xs md:text-sm tracking-widest rounded-xl shadow-[0_0_24px_rgba(99,102,241,0.45)] hover:shadow-[0_0_35px_rgba(139,92,246,0.65)] hover:scale-[1.01] transition-all cursor-pointer block text-center border-none"
                  >
                    🚀 START TODAY'S MISSION
                  </button>
                </div>
              </motion.div>
            )}

            {!isChallengeCompletedToday && isChallengeRunning && (
              <motion.div 
                key="active-layout"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-xl border border-white/5 bg-black/45 relative">
                  <button 
                    onClick={() => setIsChallengeRunning(false)}
                    className="absolute top-3 right-3 p-1 rounded-md text-slate-500 hover:text-white hover:bg-white/5 transition-all outline-none border-none cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <h3 className="font-mono text-[9px] text-indigo-400 uppercase tracking-widest mb-1 font-bold">ACTIVE SIMULATED INTERACTIVE STAGE</h3>
                  <h4 className="font-display font-medium text-slate-200 text-sm mb-4 uppercase">{currentChallenge.title}</h4>
                  
                  {renderInteractiveChallengeSimNode()}
                </div>
              </motion.div>
            )}

            {isChallengeCompletedToday && (
              <motion.div 
                key="completed-layout"
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
                    MISSION MASTERED TODAY!
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm leading-normal">
                    Nice! Today's challenge is completed. +100 XP gained and streak counter updated. Your progress was dispatched to the feed matrix.
                  </p>
                </div>

                <div className="px-5 py-2 rounded bg-emerald-950/20 border border-emerald-500/20 font-mono text-[9px] text-emerald-300">
                  ⚡ WEEKLY RANK PROGRESS SECURED • LOG BACK IN TOMORROW FOR THE NEXT STAGE
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toast feedback dialog */}
          {challengeSuccessMsg && (
            <div className="mt-4 p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/30 text-[11px] font-sans text-indigo-300 flex justify-between items-center animate-fade-in gap-3">
              <span>🎉 {challengeSuccessMsg}</span>
              <button onClick={() => setChallengeSuccessMsg(null)} className="text-indigo-400 hover:text-white font-mono font-bold text-[9px] uppercase pl-2 font-mono bg-transparent border-none cursor-pointer">
                Dismiss
              </button>
            </div>
          )}
        </div>

      </div>

      {/* ==============================================
          RETENTION FORECAST & GAMIFICATION FUTURES (REWARD PREVIEW)
          ============================================== */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Tomorrow's Reward Preview Card */}
        <div className="p-5 rounded-2xl bg-[#0b0417]/80 border border-purple-500/20 flex flex-col justify-between hover:border-purple-500/35 transition-all">
          <div>
            <div className="flex items-center gap-2 text-purple-400 font-display font-black text-[10px] uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4 animate-spin-slow text-purple-400" />
              <span>Tomorrow's Reward Forecast</span>
            </div>
            <h4 className="font-display font-bold text-xs uppercase text-slate-200 mb-1">
              "Solar Flare Aura" Preview
            </h4>
            <p className="text-[11px] text-slate-400 font-sans leading-normal">
              Maintain your daily calibration loop tomorrow tool to unpack the exclusive "Solar Flare" profile aura animation and a +150 bonus XP booster loot container!
            </p>
          </div>
          <div className="mt-3.5 pt-2 border-t border-white/5 flex items-center justify-between text-[8.5px] font-mono uppercase text-purple-400">
            <span>PRESERVE STREAK</span>
            <span>DAY {user.streak + 1} UNLOCK</span>
          </div>
        </div>

        {/* Next Streak Reward Card */}
        <div className="p-5 rounded-2xl bg-[#1a0a10]/80 border border-rose-500/25 flex flex-col justify-between hover:border-rose-500/35 transition-all">
          <div>
            <div className="flex items-center gap-2 text-rose-400 font-display font-black text-[10px] uppercase tracking-wider mb-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Streak Milestone</span>
            </div>
            <h4 className="font-display font-bold text-xs uppercase text-slate-200 mb-1">
              Consistency Catalyst (Day 7)
            </h4>
            <p className="text-[11px] text-slate-400 font-sans leading-normal">
              Secure a solid 7-Day active coordinate sequence to forge the magnificent "Consistency Catalyst" Champion Badge with permanent +5% experience multiplier!
            </p>
          </div>
          <div className="mt-3.5 pt-2 border-t border-white/5 flex items-center justify-between text-[8.5px] font-mono uppercase text-orange-400">
            <span>CURRENT FLAME: {user.streak} DAYS</span>
            <span>{Math.max(1, 7 - user.streak)} DAYS REMAIN</span>
          </div>
        </div>

        {/* Next Level Unlock Card */}
        <div className="p-5 rounded-2xl bg-[#030e16]/80 border border-cyan-500/20 flex flex-col justify-between hover:border-cyan-500/35 transition-all">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-display font-black text-[10px] uppercase tracking-wider mb-2">
              <Trophy className="w-4 h-4 text-cyan-400" />
              <span>Next Level Unlock (Lvl {user.level + 1})</span>
            </div>
            <h4 className="font-display font-bold text-xs uppercase text-slate-200 mb-1">
              Ranks & Customization
            </h4>
            <p className="text-[11px] text-slate-400 font-sans leading-normal">
              Reaching level {user.level + 1} unlocks: {getNextLevelUnlockText()} Take action to deposits XP points towards this target profile lock.
            </p>
          </div>
          <div className="mt-3.5 pt-2 border-t border-white/5 flex items-center justify-between text-[8.5px] font-mono uppercase text-cyan-400">
            <span>LEVEL {user.level} ACTIVE</span>
            <span>{user.requiredXp - user.xp} XP REMAINING</span>
          </div>
        </div>

      </div>

      {/* ========================================================
          BELOW THE FOLD: SECONDARY FEATURES ENCAPSULATED / TIDIED
          ======================================================== */}
      <div className="w-full max-w-4xl space-y-4">
        
        {/* COLLAPSIBLE SYSTEM 1: STANDARD CHORES LEDGER */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden transition-all shadow-md">
          <button
            onClick={() => setIsPersonalQuestsExpanded(!isPersonalQuestsExpanded)}
            id="personal-ledger-toggle-btn"
            className="w-full p-4.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors outline-none cursor-pointer border-none bg-transparent"
          >
            <div className="flex items-center gap-3 text-left">
              <CheckSquare className="w-5 h-5 text-indigo-400" />
              <div>
                <span className="font-display font-black text-[10px] text-indigo-400 tracking-widest block uppercase">PERSONAL STAT CHORES</span>
                <h4 className="font-display font-bold text-sm tracking-wide text-white uppercase mt-0.5">
                  Standard Habits & Chores Ledger ({tasks.length})
                </h4>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase bg-black/45 hover:bg-black/65 text-slate-400 px-2 py-1 rounded">
                {isPersonalQuestsExpanded ? 'CONCEAL LEDGER' : 'EXPAND LEDGER'}
              </span>
              {isPersonalQuestsExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>
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
                      className="md:col-span-2 px-3.5 py-2.5 rounded-lg bg-black/60 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-400 transition-colors outline-none font-sans outline-none"
                    />

                    <select
                      value={taskCategory}
                      onChange={(e) => setTaskCategory(e.target.value as TaskCategory)}
                      className="px-3 py-2.5 rounded-lg bg-black/60 border border-slate-800 text-xs text-slate-300 focus:outline-none outline-none font-sans"
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
                      <div className="flex gap-1.5 align-middle">
                        {(['easy', 'medium', 'hard', 'epic'] as TaskDifficulty[]).map((diff) => (
                          <button
                            key={diff}
                            type="button"
                            onClick={() => setTaskDifficulty(diff)}
                            className={`flex-1 py-1.5 text-[10px] font-mono uppercase rounded border transition-all cursor-pointer ${
                              taskDifficulty === diff 
                                ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300 font-bold' 
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
                        className="w-full h-[34px] font-display font-medium text-xs uppercase clip-cyber bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)] hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-45 outline-none border-none"
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
                    <div className="text-center py-10 px-4 bg-slate-950/35 rounded-xl border border-dashed border-indigo-500/10 flex flex-col items-center justify-center space-y-3.5">
                      <Sparkles className="w-8 h-8 text-indigo-400/80 animate-pulse" />
                      <div className="space-y-1">
                        <p className="font-display font-black text-xs text-white uppercase tracking-wider block">Your Chore Board is Pristine!</p>
                        <p className="text-[11px] text-slate-400 font-sans max-w-sm leading-relaxed mx-auto">
                          All personal chore boundaries are cleared. Summon a new custom task above to earn XP and progress towards your next rank!
                        </p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => {
                          const inputEl = document.querySelector('input[placeholder*="Complete 30-min"]') as HTMLInputElement;
                          if (inputEl) inputEl.focus();
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/25 text-[9px] font-mono font-bold text-indigo-300 uppercase tracking-widest transition-all cursor-pointer"
                      >
                        ⚡ Summon Custom Chore
                      </button>
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
                            className={`mt-0.5 w-[18px] h-[18px] rounded border transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                              task.completed 
                                ? 'border-emerald-500 bg-emerald-500 text-black' 
                                : 'border-slate-650 hover:border-indigo-400 bg-black/40'
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
                            className="p-1 rounded text-slate-550 hover:text-rose-450 hover:bg-rose-500/10 transition-colors cursor-pointer border-none bg-none outline-none bg-transparent"
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

        {/* COLLAPSIBLE SYSTEM 2: VANGUARD LOG FEED (OPTIONAL SOCIAL CONSOLE) */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden transition-all shadow-md">
          <button
            onClick={() => setIsFeedPreviewExpanded(!isFeedPreviewExpanded)}
            id="social-radar-toggle-btn"
            className="w-full p-4.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors outline-none cursor-pointer border-none bg-transparent"
          >
            <div className="flex items-center gap-3 text-left">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              <div>
                <span className="font-display font-black text-[10px] text-purple-400 tracking-widest block uppercase">COMMUNITY INTEL</span>
                <h4 className="font-display font-bold text-sm tracking-wide text-white uppercase mt-0.5">
                  Vanguard Log Transmission Feed ({posts.length})
                </h4>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase bg-black/45 hover:bg-black/65 text-slate-400 px-2 py-1 rounded">
                {isFeedPreviewExpanded ? 'CONCEAL CONSOLE' : 'ENGAGE RADAR'}
              </span>
              {isFeedPreviewExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 text-purple-400 animate-pulse" />
              )}
            </div>
          </button>

          {isFeedPreviewExpanded && (
            <div className="p-5 border-t border-white/5 bg-[#03030c]/60 space-y-4 animate-fade-in text-left">
              
              <p className="text-[11px] text-slate-450 font-sans max-w-xl">
                Broadcasting accomplishments coordinates establishes high-fidelity accountability limits with fellow virtual travelers. Send a brief shout below:
              </p>

              {/* Quick Post Box first */}
              <form onSubmit={handleQuickPost} className="p-3 bg-black/45 rounded-xl border border-slate-900/60 flex gap-2">
                <input 
                  type="text"
                  required
                  value={quickPostContent}
                  onChange={(e) => setQuickPostContent(e.target.value)}
                  placeholder="Deploy a quick transmission directly to feed..."
                  className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors outline-none font-sans"
                  disabled={isPosting}
                />
                <button
                  type="submit"
                  disabled={isPosting || !quickPostContent.trim()}
                  className="px-4 rounded-lg h-[32px] bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-mono text-[10px] uppercase font-bold tracking-wider transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5 outline-none border-none"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isPosting ? 'DEPLOY...' : 'POST'}</span>
                </button>
              </form>

              {quickPostError && (
                <span className="text-[10px] font-mono text-pink-400 -mt-2 px-1 block">
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
                  posts.slice(0, 3).map((post) => (
                    <div key={post.id} className="p-3.5 bg-white/[0.01] border border-white/5 rounded-xl flex items-start gap-3 hover:bg-white/[0.03] transition-all">
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
                          <span className="text-[8px] font-mono text-slate-500">
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

                {onNavigate && (
                  <button 
                    onClick={() => onNavigate('community', 'feed')}
                    className="w-full py-2 bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 text-[10px] font-mono text-purple-400 uppercase tracking-widest text-center rounded-lg transition-all cursor-pointer outline-none block"
                  >
                    🚀 Enter Community Tab for Full Broadcast Feeds
                  </button>
                )}
              </div>

            </div>
          )}
        </div>

        {/* PERSISTENT HISTORICAL CALENDAR AND STATS SEGMENT */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          
          {/* Week Streak Tracker Box */}
          <div className="md:col-span-8 p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between text-left">
            <div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-4.5 h-4.5 text-orange-400 animate-bounce" />
                  <h3 className="font-display font-black text-[10px] uppercase tracking-wider text-pink-200">
                    Somatic Habit Weekly Grid Tracker
                  </h3>
                </div>
                <span className="font-mono text-xs text-orange-400 font-bold bg-orange-400/10 border border-orange-400/25 px-2 py-0.5 rounded">
                  🔥 {user.streak} Days Stream
                </span>
              </div>
              <p className="text-[10.5px] text-slate-400 leading-relaxed font-sans mb-3">
                Preserve continuous daily synchronization momentum to multiply your incoming training coordinate payouts. Multiple weeks build-up creates high-tier multiplier caps.
              </p>
            </div>

            {/* Week boxes */}
            <div className="grid grid-cols-7 gap-1.5 font-mono text-[9px] text-center text-slate-550 leading-normal">
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
                        ? 'bg-gradient-to-br from-pink-500/25 to-orange-500/25 border-orange-500/50 text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.15)] font-bold' 
                        : isPastOrToday 
                          ? 'bg-black/35 border-slate-900 text-slate-600' 
                          : 'bg-black/20 border-slate-950 text-slate-800'
                    }`}>
                      {isActive ? '🔥' : '•'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cumulative Total statistics box */}
          <div className="md:col-span-4 p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between text-left">
            <span className="font-display font-black text-[10px] text-slate-500 tracking-widest block uppercase mb-1">AGGREGATED LIFETIME LOGS</span>
            <div className="space-y-3 my-auto">
              <div className="p-3.5 rounded-xl bg-black/35 border border-white/5 flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-slate-400">Total Chores Cleared</span>
                <span className="text-purple-400 font-display font-black text-lg">+{totalCompleted}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-black/35 border border-white/5 flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-slate-400">Today's XP Received</span>
                <span className="text-indigo-400 font-display font-black text-lg">+{xpGainedToday}</span>
              </div>
            </div>
            <p className="text-[8px] font-mono text-slate-600 uppercase text-center mt-2 tracking-widest">
              Verified & synced in memory core
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
