import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { stateService, getXpReward } from '../lib/stateService';
import { RPGTask, TaskCategory, TaskDifficulty } from '../types';
import { getUserRank } from '../lib/rankSystem';
import AvatarImage from './AvatarImage';
import { 
  Zap, Plus, Calendar, CheckSquare, Dumbbell, Award, 
  Trash2, Flame, RefreshCw, Layers, ShieldCheck, Heart, 
  BookOpen, Coins, CircleCheck
} from 'lucide-react';

export default function DashboardView() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<RPGTask[]>([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('productivity');
  const [taskDifficulty, setTaskDifficulty] = useState<TaskDifficulty>('easy');
  const [taskRecurring, setTaskRecurring] = useState<'none' | 'daily' | 'weekly'>('none');
  const [dueDate, setDueDate] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load and subscribe to tasks
  useEffect(() => {
    if (!user) return;
    const unsub = stateService.subscribeToTasks(user.id, (list) => {
      setTasks(list);
    });
    return unsub;
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] font-mono text-cyan-400">
        LOADING DATA ENGINE...
      </div>
    );
  }

  // Synchronize completed tasks with a persistence ledger so XP & counts don't disappear when completed tasks are deleted
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

  // Calculate stats
  const todayStr = new Date().toISOString().split('T')[0];

  // Merge current tasks list with ledger for accurate daily & total metrics
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

  // Dynamic daily quests list (usually static/refreshed daily)
  const dailyQuests = [
    { id: 'q1', title: 'Power Surge', desc: 'Complete 2 Fitness or Health tasks today.', completed: tasksCompletedTodayMerged.filter(t => t.category === 'fitness' || t.category === 'health').length >= 2, reward: 50 },
    { id: 'q2', title: 'Scholastic Might', desc: 'Read any lesson inside the Courses catalog today.', completed: user.badges.length > 0 || totalCompleted > 3, reward: 75 },
    { id: 'q3', title: 'Epic Vanguard', desc: 'Submit and conquer any EPIC difficulty activity.', completed: tasksCompletedTodayMerged.some(t => t.difficulty === 'epic'), reward: 120 }
  ];

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
      stateService.addTask(
        user.id,
        titleVal,
        categoryVal,
        diffVal,
        recVal,
        dueVal
      ).catch(console.error);
    } catch (err) {
      console.error(err);
    }

    setTimeout(() => {
      setIsSubmitting(false);
    }, 1000);
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

      {/* COLUMN LEFT: CORE PLAYER RPG METER & DAILY STREAK BOX */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        
        {/* AVATAR & LEVEL METER HUB */}
        <div className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 flex flex-col items-center text-center relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
          
          {/* Circular SVG level indicator */}
          <div className="relative w-36 h-36 mb-4 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90 absolute inset-0">
              {/* Track */}
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-slate-800"
                strokeWidth="6"
                fill="transparent"
              />
              {/* Progress */}
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-indigo-500 transition-all duration-700 ease-out"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="w-[124px] h-[124px] rounded-full overflow-hidden border border-white/10 bg-black/60 shadow-[0_0_15px_rgba(99,102,241,0.1)] flex items-center justify-center relative">
              <AvatarImage
                src={user.avatar}
                alt={user.username}
                className="w-full h-full object-cover select-none"
              />
            </div>
          </div>

          <h2 className="font-display font-bold text-lg text-slate-100 tracking-wide text-glow-blue uppercase">
            {user.username}
          </h2>
          <span className="font-mono text-[10px] text-indigo-400 uppercase tracking-widest mt-1 font-bold">
            {getUserRank(user.level).badge} {getUserRank(user.level).name}
          </span>

          {/* XP details readout bar */}
          <div className="w-full mt-4 p-3 rounded-lg border border-white/5 bg-black/40 font-mono">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-slate-400 font-medium">LEVEL {user.level} • {getUserRank(user.level).badge}</span>
              <span className="text-indigo-400 font-semibold">{user.xp} / {user.requiredXp} XP</span>
            </div>
            {/* Horizontal progress bar mini */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_8px_rgba(139,92,246,0.6)] transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Quick micro badges list */}
          <div className="flex gap-1.5 mt-4 items-center flex-wrap justify-center">
            <span className="text-[10px] text-slate-500 font-mono">BADGES:</span>
            {user.badges.slice(0, 4).map((badge, idx) => (
              <span 
                key={idx} 
                title={badge.title} 
                className="w-5 h-5 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-[10px] text-purple-400"
              >
                ★
              </span>
            ))}
            {user.badges.length > 4 && (
              <span className="text-[10px] font-mono text-slate-400">+{user.badges.length - 4}</span>
            )}
            {user.badges.length === 0 && (
              <span className="text-[10px] font-mono text-slate-500">NONE UNLOCKED</span>
            )}
          </div>
        </div>

        {/* DAILY STREAK BOX */}
        <div className="p-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400 animate-bounce" />
              <h3 className="font-display font-medium text-sm tracking-wide text-pink-200">
                DAILY RPG STREAK
              </h3>
            </div>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-orange-400/10 border border-orange-400/20 text-orange-400 font-bold">
              {user.streak} DAYS
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-sans mb-3">
            Every day you complete at least one real-world task coordinates, your flame expands. Maintain the streak to multiply your XP multipliers.
          </p>
          <div className="grid grid-cols-7 gap-1 font-mono text-[10px] text-center text-slate-500">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, dIdx) => {
              const isActive = user.streak >= dIdx + 1; // dummy visually appealing streak tracking
              return (
                <div key={dIdx} className="flex flex-col items-center">
                  <span className="mb-1 text-[9px] text-slate-400">{day}</span>
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center border transition-colors ${
                    isActive 
                      ? 'bg-gradient-to-br from-pink-500/20 to-orange-500/20 border-orange-500/50 text-orange-400' 
                      : 'bg-black/40 border-slate-900 text-slate-600'
                  }`}>
                    {isActive ? '🔥' : '•'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* QUICK STATS & ARCHIVE OVERVIEW */}
        <div className="p-4 rounded-xl border border-white/10 bg-white/5 grid grid-cols-2 gap-3 text-center">
          <div className="p-3.5 rounded-lg bg-black/20 border border-white/5">
            <span className="text-slate-400 font-mono text-[10px] uppercase block mb-1">XP TODAY</span>
            <span className="text-indigo-400 text-lg font-display font-bold">+{xpGainedToday}</span>
          </div>
          <div className="p-3.5 rounded-lg bg-black/20 border border-white/5">
            <span className="text-slate-400 font-mono text-[10px] uppercase block mb-1">TOTAL COMPLI</span>
            <span className="text-purple-400 text-lg font-display font-bold">{totalCompleted}</span>
          </div>
        </div>

      </div>

      {/* COLUMN RIGHT: INTERACTIVE TASKS & DAILY QUEST CONSOLE */}
      <div className="lg:col-span-8 flex flex-col gap-6">

        {/* DAILY QUESTS BAR (GAMIFIED BOARDS) */}
        <div className="p-5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-indigo-400" />
            <h3 className="font-display font-semibold text-sm text-indigo-300 tracking-wide uppercase">
              ACTIVE DAILY QUESTS
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {dailyQuests.map((quest) => (
              <div 
                key={quest.id} 
                className={`p-3 rounded-lg border transition-all ${
                  quest.completed 
                    ? 'border-emerald-500/30 bg-emerald-950/10 text-emerald-300' 
                    : 'border-slate-800/80 bg-black/20 text-slate-300'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-display font-bold text-xs uppercase text-glow-blue">
                    {quest.title}
                  </span>
                  {quest.completed ? (
                    <span className="text-[10px] font-mono text-emerald-400 uppercase font-black">
                      [COMPLETE]
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-cyan-400 font-semibold">
                      +{quest.reward} XP
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 leading-normal font-sans">
                  {quest.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CREATE TASK ENGINE CONSOLE */}
        <div className="p-5 rounded-xl cyber-glass border border-slate-800/80 bg-[#090918]">
          <h3 className="font-display font-semibold text-sm tracking-wide text-slate-200 mb-3 uppercase">
            ADD NEW TASK COORDINATES
          </h3>

          <form onSubmit={handleAddTask} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Task title input */}
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Declare real-world activity goal..."
                className="md:col-span-2 px-3.5 py-2 rounded-lg bg-black/60 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyber-blue transition-colors outline-none font-sans"
              />

              {/* Task category selecting list */}
              <select
                value={taskCategory}
                onChange={(e) => setTaskCategory(e.target.value as TaskCategory)}
                className="px-3 py-2 rounded-lg bg-black/60 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyber-blue outline-none"
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
              {/* Difficulty selectors */}
              <div className="md:col-span-2">
                <span className="block text-[10px] text-slate-500 font-mono mb-1 uppercase">DIFFICULTY RANK</span>
                <div className="flex gap-1.5">
                  {(['easy', 'medium', 'hard', 'epic'] as TaskDifficulty[]).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setTaskDifficulty(diff)}
                      className={`flex-1 py-1 text-[10px] font-mono uppercase rounded border transition-all ${
                        taskDifficulty === diff 
                          ? 'border-indigo-500 bg-indigo-500/15 text-indigo-400 font-bold shadow-[0_0_8px_rgba(99,102,241,0.2)]' 
                          : 'border-white/5 bg-black/20 text-slate-400 hover:border-white/10'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recurring selector */}
              <div>
                <span className="block text-[10px] text-slate-500 font-mono mb-1 uppercase">RECURRENCE</span>
                <select
                  value={taskRecurring}
                  onChange={(e) => setTaskRecurring(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded bg-black/40 border border-slate-800 text-[11px] text-slate-300 focus:outline-none focus:border-cyber-blue outline-none"
                >
                  <option value="none">Once Only</option>
                  <option value="daily">Daily Loop</option>
                  <option value="weekly">Weekly Cycle</option>
                </select>
              </div>

              {/* Submit trigger btn */}
              <div className="self-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !taskTitle.trim()}
                  className="w-full h-[34px] font-display font-bold text-xs uppercase clip-cyber bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)] hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Plus className="w-4 h-4" />
                  SUMMON TASK
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ACTIVE CHECKS LIST TIMELINE */}
        <div className="p-5 rounded-xl bg-white/5 border border-white/10 flex-1 flex flex-col min-h-[350px]">
          
          {/* Headline controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 justify-between w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4.5 h-4.5 text-indigo-400" />
                <h3 className="font-display font-semibold text-sm tracking-wide text-slate-200">
                  ACTIVE CHORES TIMELINE
                </h3>
              </div>
              
              {tasks.some(t => t.completed) && (
                <button
                  onClick={handleDeleteCompletedTasks}
                  disabled={isSubmitting}
                  className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono uppercase rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer disabled:opacity-40"
                  title="Clear All Completed Tasks"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear Done ({tasks.filter(t => t.completed).length})</span>
                </button>
              )}
            </div>
            
            {/* Filter buttons */}
            <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
              {['all', 'productivity', 'fitness', 'learning', 'health', 'finance', 'mindset'].map((cat) => (
                <button
                   key={cat}
                   onClick={() => setFilterCategory(cat)}
                   className={`px-2.5 py-1 text-[10px] font-mono uppercase rounded transition-all ${
                     filterCategory === cat
                       ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_8px_rgba(99,102,241,0.15)]'
                       : 'bg-black/30 text-slate-400 border border-white/5 hover:border-white/10'
                   }`}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Tasks Grid List */}
          <div className="flex-grow flex flex-col gap-2 overflow-y-auto max-h-[400px] pr-1">
            {filteredTasks.length === 0 ? (
              <div className="m-auto text-center py-8">
                <CircleCheck className="w-10 h-10 text-slate-600 mx-auto mb-2 animate-pulse" />
                <p className="text-slate-500 font-mono text-xs">NO ACTIVE TASK OBJECTIVES IN THIS CATEGORY.</p>
                <p className="text-[10px] text-slate-600 font-sans mt-0.5">Use the coordinates submitter above to populate your adventure.</p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div 
                  key={task.id}
                  className={`p-3.5 rounded-lg border flex items-center justify-between gap-4 transition-all duration-300 ${
                    task.completed 
                      ? 'border-emerald-500/20 bg-emerald-950/10 opacity-60' 
                      : 'border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/10'
                  }`}
                >
                  {/* Task Meta */}
                  <div className="flex-grow flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => !task.completed && handleCompleteTask(task.id)}
                      disabled={task.completed}
                      className={`mt-0.5 w-[18px] h-[18px] rounded border transition-colors flex items-center justify-center shrink-0 cursor-pointer ${
                        task.completed 
                          ? 'border-emerald-500 bg-emerald-500 text-black' 
                          : 'border-slate-600 hover:border-indigo-400 bg-black/40'
                      }`}
                    >
                      {task.completed && <CheckSquare className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="min-w-0">
                      <span className={`text-xs block font-sans truncate ${
                        task.completed ? 'line-through text-slate-500' : 'text-slate-100'
                      }`}>
                        {task.title}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        {/* Target Skill badge */}
                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono uppercase border ${getCategoryColor(task.category)}`}>
                          {getCategoryIcon(task.category)}
                          <span>{task.category}</span>
                        </div>
                        {/* Difficulty badge */}
                        <div className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase border ${getDifficultyBadge(task.difficulty)}`}>
                          <span>{task.difficulty}</span>
                        </div>
                        {/* Recurrence Indicator */}
                        {task.recurring !== 'none' && (
                          <span className="text-[8px] font-mono text-slate-500 flex items-center gap-0.5 uppercase">
                            <RefreshCw className="w-2.5 h-2.5 animate-spin-slow" />
                            {task.recurring}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Complete/Cancel Payout indicators */}
                  <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
                    {!task.completed ? (
                      <span className="text-cyan-400 font-semibold text-[11px] font-bold">
                        +{getXpReward(task.difficulty)} XP
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-bold text-[10px] uppercase">
                        PAID OUT
                      </span>
                    )}
                    
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      id={`delete-task-btn-${task.id}`}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Purge Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pending metrics */}
          <div className="pt-3 border-t border-slate-900 mt-3 flex justify-between items-center text-slate-500 font-mono text-[10px]">
            <span>STREAK MULTIPLIER: {1.0 + (user.streak * 0.05).toFixed(2)}x</span>
            <span>{pendingTasks.length} PENDING OBJECTIVES</span>
          </div>

        </div>

      </div>

    </div>
  );
}
