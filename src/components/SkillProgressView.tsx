import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BADGE_LIBRARY } from '../data/rpgAssets';
import { TaskCategory, RPGTask, TaskDifficulty } from '../types';
import { stateService } from '../lib/stateService';
import { getUserRank } from '../lib/rankSystem';
import { 
  Heart, Dumbbell, BookOpen, CheckSquare, Coins, Layers, 
  Lock, Award, Shield, Compass, Swords, Zap, Crown, Flame, 
  Sparkles, Check, ChevronRight, Trophy, Target, Plus, Trash2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Nested detailed Skill Nodes schemas mapped statically
export const SCHEMA_SKILL_NODES: { [key in TaskCategory]: { id: string; name: string; description: string; xpReward: number }[] } = {
  health: [
    { id: 'circadian_lock', name: 'Circadian Lock', description: 'Early photons capture, morning sunlight anchoring, and evening twilight blue-light blockades.', xpReward: 50 },
    { id: 'deep_rest', name: 'Deep Rest Sanctuary', description: 'Body cooling parameters, complete blackout chambers, and slow delta wave state recovery.', xpReward: 75 },
    { id: 'hydration_base', name: 'Hydration Anchor', description: 'Clean electrolyte cell-saturations and hydration checkpoints throughout waking hours.', xpReward: 40 },
  ],
  fitness: [
    { id: 'iron_core', name: 'Iron Core Strength', description: 'Heavy spinal bracing, compound lift load, and static/dynamic core resilience.', xpReward: 80 },
    { id: 'cardio_blast', name: 'Cardio Engine', description: 'Sustained heart-rate conditioning, aerobic threshold maintenance, and lactic clearing speed.', xpReward: 60 },
    { id: 'flex_reset', name: 'Flexibility Reset', description: 'Myofascial decompression, functional flexibility, and posture realignment slots.', xpReward: 40 },
  ],
  learning: [
    { id: 'tech_scholar', name: 'Technical Scholar', description: 'Framework code review, specialized computing modules, and algorithmic problem drills.', xpReward: 90 },
    { id: 'curious_reader', name: 'Non-Fiction Anchor', description: 'Critical literature consumption, active marginalia writing, and knowledge synthesis.', xpReward: 55 },
    { id: 'science_pillar', name: 'Empirical Pillar', description: 'Mathematical hypothesis formulation, testing models, and bias reduction checks.', xpReward: 65 },
  ],
  productivity: [
    { id: 'pomodoro_flow', name: 'Pomodoro Mastery', description: 'High focus timed Pomodoro increments with strict zero-noise attention lock.', xpReward: 50 },
    { id: 'execution_ledg', name: 'Task Board Execution', description: 'Proactive daily action checklist sweeps, task triage, and priority level locks.', xpReward: 60 },
    { id: 'room_reset', name: 'Workspace Calibration', description: 'Physical hygiene cleanups, visual cognitive load sweeps, and tool arrangement.', xpReward: 45 },
  ],
  finance: [
    { id: 'saving_habit', name: 'Vault Partitioning', description: 'Enforcing capital preservation by routing automatic wealth allocations before consumption.', xpReward: 70 },
    { id: 'investment_core', name: 'Investment Core', description: 'Global index fund indexing, compound curves calculations, and expense audits.', xpReward: 85 },
    { id: 'asset_review', name: 'Balance Ledgering', description: 'Checking dynamic asset holdings, updating liabilities, and identifying saving leaks.', xpReward: 50 },
  ],
  mindset: [
    { id: 'stoic_shield', name: 'Stoic Fortress', description: 'Epictetus-style control partition checks, cognitive reframing, and resilience filters.', xpReward: 75 },
    { id: 'gratitude_lock', name: 'Gratitude Anchor', description: 'Active writing of daily fortune logs and thanking teachers/peers.', xpReward: 40 },
    { id: 'mindful_sit', name: 'Mindful Sitting', description: 'Soma biofeedback loops, quiet focus sits, and thoughts observation.', xpReward: 60 },
  ]
};

export default function SkillProgressView() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<RPGTask[]>([]);
  const [claimedQuests, setClaimedQuests] = useState<string[]>([]);
  const [animationQuestId, setAnimationQuestId] = useState<string | null>(null);

  // Skill Nodes interactivity states
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | null>(null);
  const [activeTaskFormNodeId, setActiveTaskFormNodeId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newXpReward, setNewXpReward] = useState<number>(50);
  const [formError, setFormError] = useState<string | null>(null);

  const handleToggleTask = async (task: RPGTask) => {
    if (!user) return;
    try {
      if (task.completed) return;
      await stateService.completeTask(user.id, task.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;
    try {
      await stateService.deleteTask(user.id, taskId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleForgeTask = async (nodeId: string) => {
    if (!user || !selectedCategory) return;
    if (!newTitle.trim()) {
      setFormError('Title cannot be blank.');
      return;
    }
    
    // Choose appropriate difficulty from target XP
    let difficulty: TaskDifficulty = 'easy';
    if (newXpReward <= 15) difficulty = 'easy';
    else if (newXpReward <= 50) difficulty = 'medium';
    else if (newXpReward <= 100) difficulty = 'hard';
    else difficulty = 'epic';

    try {
      setFormError(null);
      await stateService.addTask(
        user.id,
        newTitle.trim(),
        selectedCategory, // (category matches skillTreeId)
        difficulty,
        'none',
        undefined,
        newDesc.trim() || undefined,
        selectedCategory, // skillTreeId matches category
        nodeId, // skillNodeId
        newXpReward // xpReward
      );
      
      // Close form and wipe fields on success
      setActiveTaskFormNodeId(null);
      setNewTitle('');
      setNewDesc('');
    } catch (e) {
      console.error(e);
      setFormError(e instanceof Error ? e.message : 'Action failed. Permissions check.');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Load and subscribe to tasks to check daily quest metrics
  useEffect(() => {
    if (!user) return;
    const unsub = stateService.subscribeToTasks(user.id, (list) => {
      setTasks(list);
    });
    return unsub;
  }, [user]);

  // Load claimed quests for today from persistent localStorage
  useEffect(() => {
    if (!user) return;
    const claimsKey = `claimed_quests_hub_${user.id}_${todayStr}`;
    try {
      const saved = JSON.parse(localStorage.getItem(claimsKey) || '[]');
      setClaimedQuests(saved);
    } catch (e) {
      setClaimedQuests([]);
    }
  }, [user, todayStr]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] font-mono text-cyan-400">
        LOADING SKILL GRAPHICS...
      </div>
    );
  }

  const { skills, badges } = user;

  // Unpack unlocked badge ids
  const unlockedBadgeIds = new Set(badges.map(b => b.id));

  // Meta about each skillset
  const skillDetails: { [key in TaskCategory]: { 
    title: string; 
    icon: React.ReactNode; 
    color: string;
    textColor: string;
    shadow: string; 
    description: string;
    actions: string[];
  }} = {
    health: {
      title: 'HEALTH (VITALITY)',
      icon: <Heart className="w-5 h-5" />,
      color: 'bg-rose-500',
      textColor: 'text-rose-400',
      shadow: 'shadow-rose-500/10 border-rose-500/20',
      description: 'Strengthen biological systems, immune resilience, and circadian energy.',
      actions: ['Direct Sunlight Calibration', 'Cool deep sleep cycles', '8-glasses hydration blocks']
    },
    fitness: {
      title: 'FITNESS (STR & DEX)',
      icon: <Dumbbell className="w-5 h-5" />,
      color: 'bg-orange-500',
      textColor: 'text-orange-400',
      shadow: 'shadow-orange-500/10 border-orange-500/20',
      description: 'Physical toughness, muscular strength, aerobic power, and stamina metrics.',
      actions: ['Cardiovascular conditioning', 'Weight resistance training', 'Stretching and motility resets']
    },
    learning: {
      title: 'LEARNING (INT)',
      icon: <BookOpen className="w-5 h-5" />,
      color: 'bg-sky-500',
      textColor: 'text-sky-400',
      shadow: 'shadow-sky-500/10 border-sky-500/20',
      description: 'Acquiring professional skills, tech libraries, literature, and technical mastery.',
      actions: ['Anavare complete courses', 'Non-fiction books study', 'Technical library research']
    },
    productivity: {
      title: 'PRODUCTIVITY (AGI)',
      icon: <CheckSquare className="w-5 h-5" />,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-400',
      shadow: 'shadow-emerald-500/10 border-emerald-500/20',
      description: 'Execution speed, deep work stamina, focus routines, and task-checklist ratios.',
      actions: ['Clear active chore checklists', 'Focus pomodoro loops', 'Workspace structure resets']
    },
    finance: {
      title: 'FINANCE (LUCK & WEALTH)',
      icon: <Coins className="w-5 h-5" />,
      color: 'bg-amber-500',
      textColor: 'text-amber-400',
      shadow: 'shadow-amber-500/10 border-amber-500/20',
      description: 'Accumulating assets, managing expenditure margins, and compound growth setups.',
      actions: ['Portion savings automatic transfer', 'Review cashout flow logs', 'Examine assets balance charts']
    },
    mindset: {
      title: 'MINDSET (WIS)',
      icon: <Layers className="w-5 h-5" />,
      color: 'bg-purple-500',
      textColor: 'text-purple-400',
      shadow: 'shadow-purple-500/10 border-purple-500/20',
      description: 'Emotional control, stoic resilience, present gratitude, and mental clarity.',
      actions: ['Dichotomy of control calibration', 'Gratitude journal entries', 'Guided meditation sits']
    }
  };

  // Maps Lucide Icons dynamically
  const getBadgeIcon = (iconName: string, unlocked: boolean) => {
    const defaultClazz = `w-6 h-6 ${unlocked ? 'text-purple-400' : 'text-slate-600'}`;
    switch (iconName) {
      case 'Sword': return <Swords className={defaultClazz} />;
      case 'ShieldAlert': return <Shield className={defaultClazz} />;
      case 'Heart': return <Heart className={defaultClazz} />;
      case 'Coins': return <Coins className={defaultClazz} />;
      case 'Flame': return <Zap className={defaultClazz} />;
      case 'BookOpen': return <BookOpen className={defaultClazz} />;
      case 'Crown': return <Crown className={defaultClazz} />;
      case 'Zap': return <Zap className={defaultClazz} />;
      default: return <Award className={defaultClazz} />;
    }
  };

  // Calculate Metrics
  const completedTodayChoreCount = tasks.filter(t => t.completed && t.completedAt?.startsWith(todayStr)).length;
  const isChallengeDoneThisDay = user.lastChallengeCompletedDate === todayStr;

  // Active Quest Conditions
  const QUEST_LIBRARY = [
    {
      id: 'active_quests_chore_mass',
      title: 'Somatic Chore Sweep',
      desc: 'Complete at least 2 standard chores inside the Habits or Todo Ledger today.',
      currProgress: completedTodayChoreCount,
      targetProgress: 2,
      isMet: completedTodayChoreCount >= 2,
      reward: 50
    },
    {
      id: 'active_quests_spotlight_lock',
      title: 'Spotlight Focus Sentinel',
      desc: 'Anchor today\'s primary spotlight daily challenge to claim epic champion status.',
      currProgress: isChallengeDoneThisDay ? 1 : 0,
      targetProgress: 1,
      isMet: isChallengeDoneThisDay,
      reward: 75
    },
    {
      id: 'active_quests_scholastic_deep',
      title: 'Academy Intellectual Lift',
      desc: 'Advance professional metrics or unlock any badge milestones.',
      currProgress: badges.length > 0 ? 1 : 0,
      targetProgress: 1,
      isMet: badges.length > 0 || user.level > 1,
      reward: 100
    }
  ];

  const handleClaimQuest = async (questId: string, xpReward: number) => {
    if (claimedQuests.includes(questId)) return;
    
    setAnimationQuestId(questId);
    try {
      await stateService.claimQuestXp(user.id, xpReward);
      
      const newClaims = [...claimedQuests, questId];
      setClaimedQuests(newClaims);
      const claimsKey = `claimed_quests_hub_${user.id}_${todayStr}`;
      localStorage.setItem(claimsKey, JSON.stringify(newClaims));
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => {
        setAnimationQuestId(null);
      }, 1500);
    }
  };

  const currentLevelProgressPercent = Math.min(100, Math.max(0, (user.xp / user.requiredXp) * 100));

  // Dynamic next level milestone unlock target
  const getNextLevelUnlockText = () => {
    const nextLevel = user.level + 1;
    if (nextLevel <= 3) return `"Scholar Apprentice" Portrait package, and unlocks the Finance Accumulator Skill Tree!`;
    if (nextLevel <= 5) return `"Adept Stoic" Achievement Badge, and unlocks the stoic breathing guidance loop level 2!`;
    if (nextLevel <= 8) return `"Master Guardian" Companion Profile overlay, and unlocks exclusive custom portraits package (+350 XP bonus!)`;
    return `"Eternal Archon" Legendary status title, and locks in elite tier rewards!`;
  };

  return (
    <div className="flex flex-col gap-8">
      
      {/* ========================================================
          NEW: MASTER PROGRESSION & GAMIFICATION SYSTEMS PANEL
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CHRONOS XP PROGRESS BLOCK (PROMINENT GAUGE) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-gradient-to-br from-[#12122b] via-[#090919] to-black border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.55)] relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400 animate-bounce" />
                <span className="font-display font-black text-xs text-white uppercase tracking-wider">LEVEL PROGRESSION COCKPIT</span>
              </div>
              <span className="font-mono text-[10px] text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded uppercase">SYSTEM LEVEL ACTIVE</span>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <span className="text-[10px] text-slate-500 font-mono block uppercase">CURRENT LEVEL</span>
                <span className="font-display font-black text-4xl text-white tracking-wide text-glow-blue">Lvl {user.level}</span>
                <span className="font-mono text-[10px] text-indigo-400 block mt-1 uppercase font-bold">{getUserRank(user.level).badge} {getUserRank(user.level).name}</span>
              </div>
              
              <div className="text-right font-mono text-xs text-slate-450">
                <span>{user.xp} / {user.requiredXp} XP</span>
              </div>
            </div>

            {/* Glowing Progressive Gauge */}
            <div className="relative">
              <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden border border-white/5 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 shadow-[0_0_12px_rgba(99,102,241,0.6)] transition-all duration-700 ease-out"
                  style={{ width: `${currentLevelProgressPercent}%` }}
                ></div>
              </div>
              <span className="absolute right-0 -bottom-5 font-mono text-[8px] text-slate-500 uppercase font-black">NEXT: LEVEL {user.level + 1}</span>
            </div>
          </div>

          {/* Next Milestone Lock Box */}
          <div className="mt-8 p-3.5 rounded-xl border border-dashed border-indigo-500/30 bg-indigo-500/5 leading-relaxed font-sans text-xs text-slate-350 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <span className="block font-mono text-[9px] text-indigo-300 uppercase font-black tracking-widest">NEXT MILESTONE GOAL (Lvl {user.level + 1})</span>
              <p className="mt-0.5 text-slate-300 font-medium">Reaching Level {user.level + 1} unlocks: {getNextLevelUnlockText()}</p>
            </div>
          </div>
        </div>

        {/* RECURRING STREAK SYSTEM HISTORICAL SUMMARY */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-gradient-to-br from-[#150f1f] via-[#09050d] to-black border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400 animate-bounce" />
                <span className="font-display font-bold text-xs uppercase tracking-wider text-orange-300">STREAK SYSTEM ENGINE</span>
              </div>
              <span className="font-mono text-[10px] text-orange-400 font-extrabold bg-orange-400/10 px-2 py-0.5 rounded border border-orange-450/20">
                {user.streak} DAYS ACTIVE
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-sans mb-5">
              Your dedication flame is fortified by daily synchronization. Cleared calendar grids increase your core multipliers, giving you +5% additional XP per continuous active day!
            </p>

            {/* Streak Progress History Rows */}
            <div className="grid grid-cols-7 gap-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => {
                const isCompleted = user.streak >= (idx + 1) || (idx === new Date().getDay() && isChallengeDoneThisDay);
                return (
                  <div key={idx} className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-500 font-mono block mb-1 font-bold">{day}</span>
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                      isCompleted 
                        ? 'bg-gradient-to-br from-pink-500/20 to-orange-500/20 border-orange-500/40 text-orange-400 font-black' 
                        : 'bg-black/40 border-slate-900 text-slate-700'
                    }`}>
                      {isCompleted ? '🔥' : '•'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 border-t border-white/5 pt-3 flex justify-between items-center text-[9px] font-mono text-slate-500 uppercase">
            <span>MULTIPLIER: {(1.0 + user.streak * 0.05).toFixed(2)}x BONUS</span>
            <span>NEXT THRESHOLD: {user.streak >= 7 ? 'ELITE MAX' : `${7 - (user.streak % 7)} DAYS TO REVENUE`}</span>
          </div>
        </div>

      </div>

      {/* DETAILED DAILY QUESTS BOARD SYSTEM */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-5">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400 animate-pulse" />
            <span className="font-display font-black text-sm tracking-wider text-white uppercase">DAILY QUESTS MATRIX BOARD</span>
          </div>
          <span className="text-[10px] text-slate-450 font-mono uppercase">COMPLETED REWARDS RESET DAILY AT UTCMIDNIGHT</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {QUEST_LIBRARY.map((quest) => {
            const isClaimed = claimedQuests.includes(quest.id);
            const isAnimating = animationQuestId === quest.id;
            
            return (
              <div 
                key={quest.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 transition-all relative overflow-hidden ${
                  isClaimed 
                    ? 'border-emerald-500/10 bg-emerald-950/5 opacity-60' 
                    : quest.isMet 
                      ? 'border-indigo-500/40 bg-indigo-505/5 shadow-[0_0_15px_rgba(99,102,241,0.25)]' 
                      : 'border-white/5 bg-black/25'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className={`font-display font-bold text-xs uppercase ${quest.isMet && !isClaimed ? 'text-indigo-300' : 'text-slate-200'}`}>
                      {quest.title}
                    </h4>
                    {!isClaimed && (
                      <span className="font-mono text-[9px] text-cyan-400 font-extrabold bg-cyan-950/15 px-1.5 py-0.5 rounded border border-cyan-500/10 select-none">
                        +{quest.reward} XP
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans mb-3 min-h-[32px]">
                    {quest.desc}
                  </p>

                  {/* Progress Meter bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 uppercase">
                      <span>STABILITY</span>
                      <span>{Math.min(quest.targetProgress, quest.currProgress)} / {quest.targetProgress}</span>
                    </div>
                    <div className="w-full h-1 bg-black/60 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full transition-all duration-500 ${isClaimed ? 'bg-emerald-500' : quest.isMet ? 'bg-indigo-400' : 'bg-slate-700'}`}
                        style={{ width: `${(Math.min(quest.targetProgress, quest.currProgress) / quest.targetProgress) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  {isClaimed ? (
                    <div className="w-full py-2 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>REWARD CLAIMED</span>
                    </div>
                  ) : quest.isMet ? (
                    <button
                      onClick={() => handleClaimQuest(quest.id, quest.reward)}
                      className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-mono text-[10px] font-bold uppercase tracking-widest rounded-lg transition-transform active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                    >
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      <span>CLAIM REWARD</span>
                    </button>
                  ) : (
                    <div className="w-full py-2 bg-black/30 border border-slate-900 text-slate-550 font-mono text-[9px] font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 select-none font-medium">
                      <Lock className="w-3 h-3" />
                      <span>COORDINATE LOCK</span>
                    </div>
                  )}
                </div>

                {/* Particle explosion overlays */}
                <AnimatePresence>
                  {isAnimating && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-indigo-950/90 flex flex-col items-center justify-center text-center p-3 z-10"
                    >
                      <Sparkles className="w-8 h-8 text-yellow-400 animate-spin mb-1" />
                      <span className="font-display font-black text-sm uppercase tracking-widest text-white block">CLAIMED!</span>
                      <span className="text-[10px] font-mono text-indigo-300 block">+{quest.reward} XP Deposited</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          EXISTING: CHARACTER PROGRESSION SKILLS GRAPH MATRIX
          ======================================================== */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Compass className="w-5 h-5 text-indigo-400 animate-spin-slow" />
          <h3 className="font-display font-bold text-base tracking-wide text-indigo-300">
            RPG CHARACTER SKILL DEVELOPMENT PATHS
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(Object.keys(skills) as TaskCategory[]).map((key) => {
            const skill = skills[key];
            const meta = skillDetails[key];
            const skillProgressPercent = Math.min(100, (skill.xp / (skill.level * 100)) * 100);

            return (
              <div 
                key={key}
                className="p-5 rounded-2xl border border-white/10 bg-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:border-white/20 transition-all flex flex-col justify-between min-h-[220px]"
              >
                <div>
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg bg-black/45 border border-slate-800 ${meta.textColor}`}>
                        {meta.icon}
                      </div>
                      <span className="font-display font-bold text-xs tracking-wide text-slate-100 uppercase">
                        {meta.title}
                      </span>
                    </div>
                    <span className={`font-mono font-black text-xs px-2.5 py-0.5 rounded bg-black/45 ${meta.textColor} border border-white/5`}>
                      Lvl {skill.level}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed mb-4 min-h-[32px]">
                    {meta.description}
                  </p>
                </div>

                <div>
                  {/* Skill XP bar */}
                  <div className="font-mono text-[9px] mb-3">
                    <div className="flex justify-between mb-1 text-slate-500 uppercase font-black">
                      <span>EXPERIENCE</span>
                      <span className={meta.textColor}>{skill.xp} / {skill.level * 100} XP</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/50 border border-slate-900/60 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${meta.color} transition-all duration-500 ease-out`}
                        style={{ width: `${skillProgressPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Skill unlock guidelines */}
                  <div className="pt-2 border-t border-slate-900/60 mt-1">
                    <span className="text-[7.5px] text-slate-550 uppercase block mb-1 font-bold font-mono">STABILITY FACTORS:</span>
                    <div className="flex flex-col gap-1">
                      {meta.actions.map((act, aIdx) => (
                        <div key={aIdx} className="flex items-center gap-1.5 text-[9px] text-slate-450 font-sans">
                          <span className={meta.textColor}>✓</span>
                          <span className="truncate">{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setSelectedCategory(selectedCategory === key ? null : key);
                      setActiveTaskFormNodeId(null);
                    }}
                    className={`mt-4 w-full py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedCategory === key 
                        ? 'bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.25)]' 
                        : 'bg-black/40 hover:bg-black/65 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{selectedCategory === key ? 'Collapse Skill Tree' : 'Forge Skill Tree'}</span>
                    <ChevronRight className={`w-3 h-3 transition-transform ${selectedCategory === key ? 'rotate-90' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dedicated Skill Nodes Board */}
        {selectedCategory && (
          <div className="mt-6 p-6 rounded-2xl bg-gradient-to-b from-[#0c0a25] to-[#04020a] border border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.15)] relative overflow-hidden">
            {/* Decorative scanner line */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
            
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-400 animate-spin-slow" />
                <div>
                  <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest font-bold font-black">INTELLIGENT TREE FORGE</span>
                  <h3 className="font-display font-black text-sm text-white uppercase tracking-wider">
                    {skillDetails[selectedCategory].title} NODES MATRIX
                  </h3>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedCategory(null)}
                className="p-1 px-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-slate-450 hover:text-white font-mono text-[9px] uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close Tree Nodes
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-sans max-w-2xl mb-6">
              Forging customized, targeted node behaviors creates high-fidelity actionable checkpoints. Complete these node-specific missions to directly boost your character's <b className="text-[#818cf8]">{skillDetails[selectedCategory].title}</b> progress bar.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
              {SCHEMA_SKILL_NODES[selectedCategory].map((node, nIdx) => {
                // Get tasks corresponding to this node
                const nodeTasks = tasks.filter(t => t.skillTreeId === selectedCategory && t.skillNodeId === node.id);
                const completedNodeTasks = nodeTasks.filter(t => t.completed);
                
                return (
                  <div 
                    key={node.id} 
                    className="rounded-xl border border-white/5 bg-black/40 p-5 flex flex-col justify-between hover:border-indigo-500/20 transition-all relative"
                  >
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span className="font-mono text-[8px] text-slate-500 uppercase tracking-widest">NODE {nIdx + 1}</span>
                    </div>

                    <div>
                      {/* Node Header */}
                      <div className="pb-3 border-b border-white/5">
                        <h4 className="font-display font-medium text-xs text-white uppercase tracking-wider text-indigo-300">
                          {node.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 leading-normal font-sans mt-1.5">
                          {node.description}
                        </p>
                      </div>

                      {/* Node Task Checklist Status Gauge */}
                      <div className="my-4 space-y-1">
                        <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 uppercase">
                          <span>NODE COMPLETIONS</span>
                          <span>{completedNodeTasks.length} / {nodeTasks.length}</span>
                        </div>
                        <div className="w-full h-1 bg-black/60 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
                            style={{ width: `${nodeTasks.length > 0 ? (completedNodeTasks.length / nodeTasks.length) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Inner Node Custom Forge Tasks Checklist */}
                      <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                        {nodeTasks.length === 0 ? (
                          <div className="py-5 text-center text-[10px] font-mono text-slate-600 border border-dashed border-white/5 rounded-lg p-2">
                            NO ACTIVE MISSIONS FORGED
                          </div>
                        ) : (
                          nodeTasks.map((t) => (
                            <div 
                              key={t.id} 
                              className={`p-2.5 rounded-lg border flex items-center justify-between gap-2.5 transition-all text-[11px] ${
                                t.completed 
                                  ? 'bg-emerald-950/10 border-emerald-500/10 text-slate-400 line-through' 
                                  : 'bg-white/[0.01] border-white/5 text-slate-250'
                              }`}
                            >
                              <label className="flex items-start gap-2 cursor-pointer select-none truncate">
                                <input 
                                  type="checkbox"
                                  checked={t.completed}
                                  onChange={() => handleToggleTask(t)}
                                  className="w-3.5 h-3.5 mt-0.5 rounded cursor-pointer border border-white/10 text-indigo-600 bg-black accent-indigo-500 shrink-0"
                                />
                                <div className="truncate">
                                  <span className="font-medium truncate block">{t.title}</span>
                                  {t.description && (
                                    <span className="text-[9px] text-slate-500 block leading-none truncate mt-0.5">{t.description}</span>
                                  )}
                                </div>
                              </label>
                              
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="font-mono text-[9px] text-indigo-400 shrink-0">
                                  +{t.xpReward || 50} XP
                                </span>
                                <button 
                                  onClick={() => handleDeleteTask(t.id)}
                                  className="p-1 hover:bg-white/5 text-slate-600 hover:text-red-400 rounded transition-colors"
                                  title="Purge Task"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Node Interaction Trigger */}
                    <div className="mt-4 pt-3 border-t border-white/5">
                      {activeTaskFormNodeId === node.id ? (
                        <div className="p-3 rounded-lg border border-indigo-500/30 bg-indigo-950/20 space-y-3">
                          <div className="flex justify-between items-center pb-1 border-b border-white/5">
                            <span className="text-[9px] font-mono text-indigo-300 uppercase tracking-widest font-black">Forge Node Mission</span>
                            <button onClick={() => setActiveTaskFormNodeId(null)} className="text-slate-500 hover:text-white">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          
                          <div className="space-y-2">
                            <input 
                              type="text"
                              placeholder="Mission Title..."
                              value={newTitle}
                              onChange={(e) => setNewTitle(e.target.value)}
                              className="w-full bg-black/65 border border-white/10 rounded px-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
                            />
                            
                            <input 
                              type="text"
                              placeholder="Execution details (optional)..."
                              value={newDesc}
                              onChange={(e) => setNewDesc(e.target.value)}
                              className="w-full bg-black/65 border border-white/10 rounded px-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
                            />
                            
                            <div className="flex items-center justify-between">
                              <label className="text-[9px] font-mono text-slate-500 uppercase font-black">Target XP Payout:</label>
                              <select 
                                value={newXpReward}
                                onChange={(e) => setNewXpReward(Number(e.target.value))}
                                className="bg-black/80 border border-white/10 rounded text-[10px] text-slate-300 font-mono px-1 py-0.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
                              >
                                <option value="40">40 XP (Basic)</option>
                                <option value="60">60 XP (Sustained)</option>
                                <option value="80">80 XP (Intense)</option>
                                <option value="100">100 XP (Epic)</option>
                              </select>
                            </div>
                            
                            {formError && (
                              <div className="text-[9px] font-mono text-red-400 bg-red-950/25 border border-red-500/20 px-2 py-0.5 rounded leading-tight">
                                ERROR: {formError}
                              </div>
                            )}

                            <button 
                              onClick={() => handleForgeTask(node.id)}
                              className="w-full py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-mono text-[9px] uppercase font-black tracking-widest rounded shadow transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Forge Mission</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => {
                            setNewTitle('');
                            setNewDesc('');
                            setNewXpReward(node.xpReward);
                            setFormError(null);
                            setActiveTaskFormNodeId(node.id);
                          }}
                          className="w-full py-1.5 hover:bg-white/5 border border-dashed border-slate-800 hover:border-indigo-500/40 text-slate-400 hover:text-white rounded text-[10px] font-mono uppercase tracking-widest transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Forge Custom Mission</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: GLOWING ACHIEVEMENTS cabinet */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" />
            <h3 className="font-display font-medium text-sm tracking-wide text-indigo-350 uppercase">
              ACHIEVEMENTS CABINET
            </h3>
          </div>
          <span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/25 font-bold">
            UNLOCKED: {badges.length} / {BADGE_LIBRARY.length}
          </span>
        </div>

        <p className="text-xs text-slate-450 mb-6 font-sans">
          Complete high-tier tasks and reach milestone level ranks across different character progression attributes to forge persistent digital achievement badges.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {BADGE_LIBRARY.map((b) => {
            const isUnlocked = unlockedBadgeIds.has(b.id);
            const userUnlockInfo = badges.find(ub => ub.id === b.id);

            return (
              <div 
                key={b.id}
                className={`p-4 rounded-xl border flex flex-col items-center text-center transition-all ${
                  isUnlocked 
                    ? 'border-indigo-500/30 bg-indigo-500/5 shadow-[0_0_15px_rgba(99,102,241,0.15)] text-slate-100' 
                    : 'border-slate-850 bg-black/40 text-slate-550'
                }`}
              >
                {/* Icon Circle Container */}
                <div className={`w-11 h-11 rounded-full mb-3 flex items-center justify-center border transition-all ${
                  isUnlocked 
                    ? 'border-indigo-400/30 bg-indigo-900/20 text-indigo-300' 
                    : 'border-slate-800 bg-black/80'
                }`}>
                  {isUnlocked ? (
                    getBadgeIcon(b.icon, true)
                  ) : (
                    <Lock className="w-4.5 h-4.5 text-slate-700" />
                  )}
                </div>

                <h4 className={`font-display font-bold text-xs uppercase ${isUnlocked ? 'text-glow-purple text-pink-200' : 'text-slate-650'}`}>
                  {b.title}
                </h4>

                <p className="text-[10px] text-slate-400/80 font-sans mt-1 leading-normal truncate w-full px-1">
                  {b.description}
                </p>

                {isUnlocked && userUnlockInfo && (
                  <span className="font-mono text-[8px] text-purple-400 uppercase mt-2.5 px-2 py-0.5 rounded bg-purple-950/20 border border-purple-500/10">
                    UNLOCKED: {new Date(userUnlockInfo.unlockedAt).toLocaleDateString()}
                  </span>
                )}
                {!isUnlocked && (
                  <span className="font-mono text-[8px] text-slate-600 uppercase mt-2.5 px-2 py-0.5 rounded bg-slate-900/10">
                    LOCKED STATUS
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
