import React, { useState, useEffect } from 'react';
import { 
  Swords, Shield, Compass, GraduationCap, Users, Trophy, 
  Sparkles, CheckCircle2, ChevronRight, Zap, Play, 
  Flame, Award, Target, BookOpen, Brain, Dumbbell, 
  BarChart3, Gamepad2, ArrowRight, Lock, Disc, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LandingViewProps {
  onGetStarted: (mode: 'login' | 'signup') => void;
}

export default function LandingView({ onGetStarted }: LandingViewProps) {
  // Stat preview selector
  const [activeStat, setActiveStat] = useState<'discipline' | 'focus' | 'strength' | 'intelligence'>('discipline');
  
  // Interactive XP Simulator states
  const [simulatorXp, setSimulatorXp] = useState(35);
  const [simulatorLevel, setSimulatorLevel] = useState(1);
  const [showLevelUpSparkle, setShowLevelUpSparkle] = useState(false);
  const [simulatedQuestCount, setSimulatedQuestCount] = useState(0);

  // Auto-typing mock terminal status lines
  const [terminalLine, setTerminalLine] = useState(0);
  const terminalTexts = [
    '> Scanning real-world task coordinates...',
    '> Discipline module: 120% efficiency.',
    '> Core synchronized: Prepare for quest calibration.',
    '> Ready for direct user uplink: Welcome, Player.'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTerminalLine(prev => (prev + 1) % terminalTexts.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleSimulateQuest = () => {
    const xpReward = 25;
    setSimulatedQuestCount(prev => prev + 1);
    
    setSimulatorXp(prev => {
      const nextXp = prev + xpReward;
      if (nextXp >= 100) {
        // Trigger Level-Up!
        setSimulatorLevel(lvl => lvl + 1);
        setShowLevelUpSparkle(true);
        setTimeout(() => setShowLevelUpSparkle(false), 2000);
        return nextXp - 100;
      }
      return nextXp;
    });
  };

  const getRankTitle = (lvl: number) => {
    if (lvl < 10) return 'Recruit (Lvl 1-9)';
    if (lvl < 20) return 'Squire (Lvl 10-19)';
    if (lvl < 30) return 'Gallant Sentinel (Lvl 20-39)';
    if (lvl < 60) return 'Elite Vanguard (Lvl 40-59)';
    return 'Veteran Champion (Lvl 60+)';
  };

  const statDetails = {
    discipline: {
      name: 'Discipline',
      icon: <Target className="w-5 h-5 text-emerald-400" />,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/25',
      desc: 'Build habits and resist short-term impulses. Boosted by finishing tasks before deadline and logging morning goals.',
      questIdea: 'Complete administrative bookkeeping before 11:00 AM.',
      multiplier: 'x1.5 Golden Badge Drop Rate'
    },
    focus: {
      name: 'Focus',
      icon: <Brain className="w-5 h-5 text-indigo-400" />,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10 border-indigo-500/25',
      desc: 'Hone mental energy on absolute priorities. Boosted by executing 25-minute Deep Work Pomodoro periods.',
      questIdea: 'Perform 4 uninterrupted study sprints without context switching.',
      multiplier: 'x1.2 XP Payout on Academic Modules'
    },
    strength: {
      name: 'Strength & Vigor',
      icon: <Dumbbell className="w-5 h-5 text-rose-400" />,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/25',
      desc: 'Keep physical energy levels peak. Boosted by hydration logs, strength routines, or hitting physical step goals.',
      questIdea: 'Execute 40-minute weights or high-intensity interval track.',
      multiplier: 'x1.4 Daily Active Streak Buffer'
    },
    intelligence: {
      name: 'Intelligence',
      icon: <BookOpen className="w-5 h-5 text-amber-400" />,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/25',
      desc: 'Absorb complex structures of thought. Boosted by completing specialized Academy lessons, courses, or reading non-fiction books.',
      questIdea: 'Analyze 3 chapters on compound interest models or system coding theory.',
      multiplier: 'Unlocks Custom Academy at Level 10+'
    }
  };

  return (
    <div className="min-h-screen bg-[#050512] text-slate-105 font-sans relative overflow-x-hidden selection:bg-indigo-505 selection:text-white">
      
      {/* Decorative cyber grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1b4b_1px,transparent_1px),linear-gradient(to_bottom,#1e1b4b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35 pointer-events-none"></div>

      {/* Decorative side lights */}
      <div className="absolute top-[5%] left-[-10%] w-[500px] h-[500px] bg-indigo-650/10 blur-[130px] rounded-full pointer-events-none"></div>
      <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-purple-650/10 blur-[130px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[5%] left-[10%] w-[450px] h-[450px] bg-sky-650/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* LANDING NAVIGATION */}
      <nav className="sticky top-0 z-50 bg-[#050512]/75 backdrop-blur-md border-b border-white/5 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Swords className="w-6 h-6 text-indigo-400 animate-pulse" />
            <span className="font-display font-black text-xl sm:text-2xl tracking-wider text-white uppercase bg-clip-text">
              ANAVARE
            </span>
          </div>

          {/* Links / Navigation */}
          <div className="hidden md:flex items-center gap-8 text-xs font-mono uppercase tracking-wider text-slate-400">
            <a href="#about" className="hover:text-white transition-colors">// THE LAWS</a>
            <a href="#features" className="hover:text-white transition-colors">// CORE SYSTEM</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">// INITIATION STEP</a>
            <a href="#simulator" className="hover:text-white transition-colors">// PREVIEW MATRIX</a>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onGetStarted('login')}
              className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-350 hover:text-white transition-all cursor-pointer"
            >
              LOG IN
            </button>
            <button 
              onClick={() => onGetStarted('signup')}
              className="px-5 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 border border-indigo-400/30 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(99,102,241,0.35)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              Sign Up Free
            </button>
          </div>

        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-24 md:pt-20 md:pb-32 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Hero Copy */}
          <div className="lg:col-span-7 flex flex-col gap-6 text-left">
            
            {/* Tagline Badge */}
            <div className="self-start inline-flex items-center gap-2 px-3 py-1 bg-indigo-950/40 border border-indigo-500/30 rounded-full font-mono text-[10px] text-indigo-300 uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5 text-indigo-400 animate-pulse animate-duration-1000" />
              <span>LEVEL 2.5 REAL-LIFE RPG SYSTEM ACTIVE</span>
            </div>

            {/* Display Title */}
            <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl tracking-tight text-white leading-[1.05] uppercase">
              Turn Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 font-extrabold text-glow-purple">
                Life Into A Game
              </span>
            </h1>

            {/* Subtitle */}
            <p className="font-sans text-sm sm:text-base md:text-lg text-slate-400 max-w-xl leading-relaxed">
              Anavare transforms real-world duties, studies, health parameters, and habits into rewarding experience campaigns. Construct your heroic profile, conquer habits, gain level ranks, and upgrade real-world skills.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <button 
                onClick={() => onGetStarted('signup')}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-display font-black uppercase tracking-wider text-xs shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_40px_rgba(99,102,241,0.6)] cursor-pointer hover:scale-102 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Gamepad2 className="w-4 h-4" />
                CREATE YOUR AVATAR NOW
                <ArrowRight className="w-4.5 h-4.5" />
              </button>
              
              <a 
                href="#simulator"
                className="px-6 py-4 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-mono font-bold text-xs uppercase tracking-wider transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-indigo-400" />
                TRY SIMULATION
              </a>
            </div>

            {/* Mini terminal readout widget */}
            <div className="border border-indigo-950/60 bg-black/55 backdrop-blur-md rounded-lg p-3 max-w-lg mt-4 flex items-center gap-2.5 font-mono text-[10px] text-indigo-400 shadow-inner">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <div className="relative overflow-hidden h-4 flex-grow">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={terminalLine}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="block font-medium"
                  >
                    {terminalTexts[terminalLine]}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Visual Console Preview */}
          <div className="lg:col-span-5 relative mt-8 lg:mt-0">
            <div className="absolute inset-0 bg-indigo-500/20 blur-[90px] rounded-full pointer-events-none"></div>
            
            {/* Interactive Badge Hover Graphic Card */}
            <div className="relative border border-white/10 rounded-2xl bg-gradient-to-br from-indigo-950/20 to-purple-950/20 backdrop-blur-2xl p-6 shadow-2xl">
              
              {/* Outer corner marks */}
              <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-indigo-400/60"></div>
              <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-indigo-400/60"></div>
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-indigo-400/60"></div>
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-indigo-400/60"></div>

              {/* Gilded Glimmer Ring Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400 animate-bounce" />
                  <span className="font-mono text-[9px] uppercase tracking-widest text-orange-400">DAILY COMBUSTION STREAK: 12 DAYS</span>
                </div>
                <div className="px-2 py-0.5 rounded border border-indigo-500/35 bg-indigo-950/50 font-mono text-[8px] text-indigo-300">
                  SECURE MODE
                </div>
              </div>

              {/* Main Profile Layout Mock */}
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-indigo-500/45 p-1 bg-black/60 shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=150&auto=format&fit=crop&q=80"
                    alt="Player Portrait"
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
                <div>
                  <h3 className="font-display font-medium text-sm text-white flex items-center gap-1.5 uppercase tracking-wider">
                    VALKYRIE_77
                    <Award className="w-4 h-4 text-indigo-400" />
                  </h3>
                  <span className="font-mono text-[10px] text-indigo-300 uppercase tracking-widest block">SQUIRE RANK (LVL 14)</span>
                  <div className="flex gap-1 mt-1.5">
                    <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[8px] rounded uppercase">DISCIPLINE L12</span>
                    <span className="px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[8px] rounded uppercase">FOCUS L10</span>
                  </div>
                </div>
              </div>

              {/* XP progress panel */}
              <div className="mt-6 space-y-2">
                <div className="flex justify-between font-mono text-[8px] text-slate-400">
                  <span className="uppercase">GLOBAL COGNITIVE EXPERIENCE PROGRESS</span>
                  <span>780 / 1400 XP</span>
                </div>
                <div className="w-full h-3 bg-black/65 border border-indigo-950/60 rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full w-[55%] animate-pulse"></div>
                </div>
              </div>

              {/* Mock active task quest log */}
              <div className="mt-6 bg-black/40 border border-white/5 rounded-xl p-4 text-left space-y-3">
                <div className="flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-mono text-[9px] text-slate-500 uppercase tracking-wider">ACTIVE DAILY QUEST LOG</span>
                </div>
                
                <div className="border-l-2 border-emerald-500 pl-3 py-0.5 flex justify-between items-center bg-emerald-950/10">
                  <div>
                    <span className="font-display font-bold text-xs text-slate-200 block">Morning Cold Splash Coordination</span>
                    <span className="font-mono text-[8.5px] text-emerald-400 uppercase">// DISCIPLINE REWARD</span>
                  </div>
                  <span className="text-slate-450 text-[10px] font-mono shrink-0">+15 XP</span>
                </div>

                <div className="border-l-2 border-indigo-500 pl-3 py-0.5 flex justify-between items-center bg-indigo-950/10 opacity-75">
                  <div>
                    <span className="font-display font-medium text-xs text-slate-450 block line-through">Deep Study Codex Reading</span>
                    <span className="font-mono text-[8.5px] text-slate-500 uppercase">// INTELLIGENCE • COMPLETED</span>
                  </div>
                  <span className="text-emerald-400 text-[10px] font-mono shrink-0">✓ COMPLETED</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ABOUT THE APP */}
      <section id="about" className="py-20 bg-slate-950/20 border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <span className="font-mono text-indigo-400 text-xs tracking-widest uppercase block font-bold">// THE GRAND CALIBRATION</span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-tight">
              Life RPG: Why Gamify Your Reality?
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              We find it easy to sink hundreds of hours leveling up fictional avatars in video games. But when it comes to organizing actual careers, reading lists, training, and sleep, we lack feedback loops. Anavare introduces structural gamification loops into your real-world coordinates.
            </p>
          </div>

          {/* Three comparison Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-5xl mx-auto">
            
            <div className="p-6 rounded-2xl border border-white/5 bg-black/40 flex flex-col gap-4 text-left">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 font-mono font-bold">
                01
              </div>
              <h3 className="font-display font-bold text-base text-slate-200 uppercase tracking-wide">
                Track Real Actions
              </h3>
              <p className="text-slate-450 text-xs sm:text-sm leading-relaxed">
                Log real-world work items, workout schedules, and study modules. No simulated game commands—only true achievements receive validation matrices.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-white/5 bg-black/40 flex flex-col gap-4 text-left">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 font-mono font-bold">
                02
              </div>
              <h3 className="font-display font-bold text-base text-slate-200 uppercase tracking-wide">
                Continuous Feedback Loops
              </h3>
              <p className="text-slate-450 text-xs sm:text-sm leading-relaxed">
                Experience instant gratification with real sound design alerts, instant experience increments, streak notifications, level metrics, and unique badge rewards on completing tasks.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-white/5 bg-black/40 flex flex-col gap-4 text-left">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 font-mono font-bold">
                03
              </div>
              <h3 className="font-display font-bold text-base text-slate-200 uppercase tracking-wide">
                Social Uplift Mentorship
              </h3>
              <p className="text-slate-450 text-xs sm:text-sm leading-relaxed">
                Share your accomplishments on the secure global social post matrix feed. Like posts, leave comments, gain levels, and compete gracefully on weekly/monthly leaderboards.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CORE FEATURES SECTION */}
      <section id="features" className="py-24 px-4 relative">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center space-y-3 mb-16">
            <span className="font-mono text-purple-400 text-xs tracking-widest uppercase block font-bold">// SYSTEM BLUEPRINTS</span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-tight">
              Designed To Level Up Your Character
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
              Explore the game mechanics designed to reshape study discipline, physical training margins, and mental power.
            </p>
          </div>

          {/* Grid Layout of Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            
            {/* feature 1: Tasks / Quests */}
            <div className="bg-gradient-to-b from-white/[0.02] to-transparent border border-white/5 p-6 rounded-2xl flex flex-col gap-4 text-left group hover:border-indigo-500/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 transition-all">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-slate-200 uppercase tracking-wide flex items-center gap-2">
                  Quest Log Quests
                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded uppercase">Core</span>
                </h3>
                <p className="text-slate-450 text-xs sm:text-sm leading-relaxed mt-2">
                  Create daily recurring or weekly goals. Each task represents a "Quest" with difficulty modifiers (Easy, Medium, Hard, Epic) awarding corresponding XP rewards.
                </p>
              </div>
            </div>

            {/* feature 2: Profile stats system */}
            <div className="bg-gradient-to-b from-white/[0.02] to-transparent border border-white/5 p-6 rounded-2xl flex flex-col gap-4 text-left group hover:border-purple-500/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 transition-all">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-slate-200 uppercase tracking-wide">
                  Four core character stats
                </h3>
                <p className="text-slate-450 text-xs sm:text-sm leading-relaxed mt-2">
                  Build intelligence (studies, reading, courses), discipline (habits, productivity tasks), focus (uninterrupted workflow), and strength (fitness, hydration & health parameters).
                </p>
              </div>
            </div>

            {/* feature 3: Rank progression */}
            <div className="bg-gradient-to-b from-white/[0.02] to-transparent border border-white/5 p-6 rounded-2xl flex flex-col gap-4 text-left group hover:border-amber-500/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/20 transition-all">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-slate-200 uppercase tracking-wide">
                  500-level rank progression
                </h3>
                <p className="text-slate-450 text-xs sm:text-sm leading-relaxed mt-2">
                  Unlock prestigious status titles and profile badges every 10 levels. Transition from Recruit (Level 1) to Squire, Knight, Champion, Sentinel and beyond.
                </p>
              </div>
            </div>

            {/* feature 4: Academy Courses */}
            <div className="bg-gradient-to-b from-white/[0.02] to-transparent border border-white/5 p-6 rounded-2xl flex flex-col gap-4 text-left group hover:border-sky-500/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 group-hover:bg-sky-500/20 transition-all">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-slate-200 uppercase tracking-wide flex items-center gap-2">
                  Custom academy creator
                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded uppercase font-bold">Lvl 10+</span>
                </h3>
                <p className="text-slate-450 text-xs sm:text-sm leading-relaxed mt-2">
                  Once you reach Level 10, gain permission to create customized course programs. Share deep learning quests with markdown instructions and high XP payouts.
                </p>
              </div>
            </div>

            {/* feature 5: Streaks & daily multiplier */}
            <div className="bg-gradient-to-b from-white/[0.02] to-transparent border border-white/5 p-6 rounded-2xl flex flex-col gap-4 text-left group hover:border-orange-500/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:bg-orange-500/20 transition-all">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-slate-200 uppercase tracking-wide">
                  Active streak multipliers
                </h3>
                <p className="text-slate-450 text-xs sm:text-sm leading-relaxed mt-2">
                  Complete tasks consistently to keep your daily flame burning. Maintain your streak to trigger XP multipliers and unlock temporary capability enhancements.
                </p>
              </div>
            </div>

            {/* feature 6: Built-in Community Hub */}
            <div className="bg-gradient-to-b from-white/[0.02] to-transparent border border-white/5 p-6 rounded-2xl flex flex-col gap-4 text-left group hover:border-indigo-400/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-slate-500/10 flex items-center justify-center text-slate-350 group-hover:bg-slate-500/25 transition-all">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-slate-200 uppercase tracking-wide">
                  Enthusiast chronicle feed
                </h3>
                <p className="text-slate-450 text-xs sm:text-sm leading-relaxed mt-2">
                  Write progress messages inside the social directory. Share quest wins, level completions, and coordinate with buddies on real-world milestones.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* INTERACTIVE PREVIEW WIDGET (SIMULATOR) */}
      <section id="simulator" className="py-20 bg-slate-950/45 border-y border-white/5 relative px-4">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center space-y-3 mb-12">
            <span className="font-mono text-indigo-400 text-xs tracking-widest uppercase block font-bold">// THE PLAYGROUND DECK</span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-tight">
              Interact With The System Matrix
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
              Test out the gamification mechanisms live. Tick off custom simulated quests to watch your experience bar crawl and trigger a level up!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-5xl mx-auto items-start">
            
            {/* Stats controller tab selection (Left) */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <span className="font-mono text-[9px] text-slate-550 uppercase block tracking-widest text-left mb-1">RPG CORES SELECTION:</span>
              {(Object.keys(statDetails) as Array<keyof typeof statDetails>).map((key) => {
                const isSelected = activeStat === key;
                const stat = statDetails[key];
                return (
                  <button
                    key={key}
                    onClick={() => setActiveStat(key)}
                    id={`landing-stat-trigger-${key}`}
                    className={`p-4 rounded-xl text-left border flex items-center gap-3 transition-all duration-200 cursor-pointer outline-none ${
                      isSelected 
                        ? 'bg-white/5 border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                        : 'bg-black/20 border-white/5 hover:border-white/10 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="shrink-0 p-2 rounded-lg bg-black/40">
                      {stat.icon}
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-center">
                        <span className="font-display font-bold text-xs uppercase text-slate-200">{stat.name}</span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>}
                      </div>
                      <span className="text-[10px] text-slate-450 line-clamp-1 mt-0.5">{stat.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Interactive live preview deck (Right) */}
            <div className="lg:col-span-7 border border-white/10 bg-[#07071a]/85 backdrop-blur-md rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
              
              {/* LEVEL UP SHIELD ALERT SPARKLE OVERLAY */}
              <AnimatePresence>
                {showLevelUpSparkle && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    key="levelUpOverlay"
                    className="absolute inset-0 bg-indigo-950/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-6"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-indigo-505/20 blur-[30px] rounded-full animate-ping"></div>
                      <Trophy className="w-16 h-16 text-amber-400 mb-4 animate-bounce relative" />
                    </div>
                    <h3 className="font-display font-black text-2xl tracking-widest text-glow-purple text-pink-300 uppercase animate-pulse">
                      ▲ LEVEL UP! ▲
                    </h3>
                    <p className="font-mono text-xs text-indigo-300 mt-1 uppercase tracking-widest">
                      YOU ADVANCED TO LEVEL {simulatorLevel}
                    </p>
                    <span className="font-sans text-[11px] text-slate-450 max-w-sm mt-3 leading-relaxed">
                      Your attributes expanded. Ranks have been synchronized on the blockchain console simulation grid!
                    </span>
                    <button 
                      onClick={() => setShowLevelUpSparkle(false)}
                      className="mt-6 px-4 py-1.5 rounded border border-indigo-400/40 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-305 font-mono text-[10px] uppercase cursor-pointer"
                    >
                      RESUME PROTOCOL
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Dynamic Gilded Card header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5 text-left">
                <div>
                  <h4 className="font-mono text-[10px] text-indigo-400 uppercase tracking-widest">// THE CHARACTER PREVIEW</h4>
                  <span className="font-display font-black text-base text-white tracking-wide uppercase">PLAYER_DEMO_ACCOUNT</span>
                </div>
                <div className="text-left sm:text-right">
                  <span className="font-mono text-[9px] text-slate-500 uppercase block">RANK CAPABILITY STATE</span>
                  <span className="font-display font-bold text-xs text-indigo-305 uppercase tracking-wide block">
                    {getRankTitle(simulatorLevel)}
                  </span>
                </div>
              </div>

              {/* Stat card parameters visualizer detail (Active choice) */}
              <div className="space-y-4 text-left">
                <div className={`p-4 rounded-xl border ${statDetails[activeStat].bgColor} space-y-2 relative transition-all duration-300`}>
                  <div className="flex items-center gap-2">
                    {statDetails[activeStat].icon}
                    <span className="font-display font-bold text-xs uppercase text-white tracking-wider">{statDetails[activeStat].name} Attribute Tracker</span>
                  </div>
                  <p className="text-xs text-slate-350 leading-relaxed">
                    {statDetails[activeStat].desc}
                  </p>
                  
                  {/* Quest log item preview */}
                  <div className="mt-4 bg-black/45 border border-white/5 rounded-lg p-3">
                    <span className="font-mono text-[8.5px] text-slate-500 block uppercase mb-1.5">// TRIGGER QUEST EXAMPLE FOR DISPATCH:</span>
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-sans text-xs text-slate-205 font-medium leading-normal">{statDetails[activeStat].questIdea}</span>
                      <span className="text-glow-yellow text-amber-300 text-[10px] font-mono shrink-0">+25 XP</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 pt-2 border-t border-white/5">
                    <span>COGNITIVE MULTIPLIER:</span>
                    <span className={`font-semibold ${statDetails[activeStat].color}`}>{statDetails[activeStat].multiplier}</span>
                  </div>
                </div>
              </div>

              {/* Central interactive level xp bar system */}
              <div className="space-y-3 pt-2 text-left">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-mono text-[9px] text-slate-500 block uppercase">SIMULATOR PROGRESS</span>
                    <span className="font-display font-bold text-xs text-slate-250 uppercase tracking-wide">
                      LEVEL {simulatorLevel} • EXPERIENCE POINTS
                    </span>
                  </div>
                  <span className="font-mono text-xs text-indigo-300 font-bold">{simulatorXp} / 100 XP</span>
                </div>
                
                {/* Visual bar container */}
                <div className="w-full h-4 bg-black/60 border border-white/5 rounded-md p-0.5 overflow-hidden shadow-inner flex items-center relative">
                  <motion.div 
                    animate={{ width: `${simulatorXp}%` }}
                    transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-sm shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                  />
                  <div className="absolute inset-0 flex items-center justify-center font-mono text-[8px] text-white/40 select-none tracking-widest hover:text-white transition-opacity">
                    SIMULATION MATRIX STREAM
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pt-3.5">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-400 shrink-0" />
                    <span className="font-mono text-[9px] text-slate-450 uppercase leading-snug">
                      Quests simulated: <span className="text-white font-bold">{simulatedQuestCount}</span> • xp multiplier active
                    </span>
                  </div>
                  
                  <button
                    onClick={handleSimulateQuest}
                    id="trigger-simulator-quest-button"
                    className="px-5 py-2.5 rounded-lg bg-white text-black hover:bg-slate-200 hover:scale-103 font-display font-black text-xs uppercase tracking-wider transition-all duration-200 shrink-0 cursor-pointer shadow-[0_4px_12px_rgba(255,255,255,0.2)]"
                  >
                    Simulate Task Completed
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-24 px-4 relative">
        <div className="max-w-7xl mx-auto text-center">
          
          <div className="space-y-3 mb-16">
            <span className="font-mono text-indigo-400 text-xs tracking-widest uppercase block font-bold">// INITIATING DEPLOYMENT</span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-tight">
              Begin Your Quest In Five Steps
            </h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
              Transforming your habits and building real-world resilience is incredibly straightforward. Here is the operational protocol.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 max-w-6xl mx-auto relative">
            
            {/* Step 1 */}
            <div className="space-y-4 text-left p-6 rounded-xl border border-white/5 bg-black/25 relative flex flex-col justify-between h-full hover:border-indigo-500/10 transition-all">
              <div className="font-mono text-3xl text-slate-700 font-black tracking-tighter">01</div>
              <div className="space-y-1.5">
                <h4 className="font-display font-bold text-sm text-slate-200 uppercase tracking-wide">Register Avatar</h4>
                <p className="text-slate-450 text-xs leading-relaxed">
                  Design your custom RPG nickname avatar setup in seconds. Your metrics will sync with secure cloud databases.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-4 text-left p-6 rounded-xl border border-white/5 bg-black/25 relative flex flex-col justify-between h-full hover:border-indigo-500/10 transition-all">
              <div className="font-mono text-3xl text-slate-700 font-black tracking-tighter">02</div>
              <div className="space-y-1.5">
                <h4 className="font-display font-bold text-sm text-slate-200 uppercase tracking-wide">Issue Daily Quests</h4>
                <p className="text-slate-450 text-xs leading-relaxed">
                  Write down daily productivity study tasks, hydration lists, gym schedules, or work milestones.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-4 text-left p-6 rounded-xl border border-white/5 bg-black/25 relative flex flex-col justify-between h-full hover:border-indigo-500/10 transition-all">
              <div className="font-mono text-3xl text-slate-700 font-black tracking-tighter">03</div>
              <div className="space-y-1.5">
                <h4 className="font-display font-bold text-sm text-slate-200 uppercase tracking-wide">Capture XP Gain</h4>
                <p className="text-slate-450 text-xs leading-relaxed">
                  Toggle on completed items. Instantly gain Experience Points (XP) mapped directly to your targeted skills.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="space-y-4 text-left p-6 rounded-xl border border-white/5 bg-black/25 relative flex flex-col justify-between h-full hover:border-indigo-500/10 transition-all">
              <div className="font-mono text-3xl text-slate-700 font-black tracking-tighter">04</div>
              <div className="space-y-1.5">
                <h4 className="font-display font-bold text-sm text-slate-200 uppercase tracking-wide">Unlock Capability</h4>
                <p className="text-slate-450 text-xs leading-relaxed">
                  Climb the ranks to hit level 10 and unlock our custom Academy, letting you build user courses.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="space-y-4 text-left p-6 rounded-xl border border-white/5 bg-black/25 relative flex flex-col justify-between h-full hover:border-indigo-500/10 transition-all">
              <div className="font-mono text-3xl text-slate-700 font-black tracking-tighter">05</div>
              <div className="space-y-1.5">
                <h4 className="font-display font-bold text-sm text-slate-200 uppercase tracking-wide">Master Life</h4>
                <p className="text-slate-450 text-xs leading-relaxed">
                  Compare results on high-score boards. Complete daily challenges to establish healthy morning habits.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* DISCORD COMMUNITY SECTION */}
      <section id="community" className="py-20 bg-gradient-to-t from-slate-950/40 to-transparent border-t border-white/5 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl border border-[#5865f2]/20 rounded-2xl bg-gradient-to-br from-[#181c38]/40 to-[#0c0d1c]/80 backdrop-blur-xl p-8 md:p-12 mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden text-left">
            
            {/* Background blur Discord signature */}
            <div className="absolute top-[-20%] right-[-10%] w-[250px] h-[250px] bg-[#5865f2]/10 blur-[80px] rounded-full pointer-events-none"></div>

            {/* Copy */}
            <div className="space-y-4 max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5865f2]/10 border border-[#5865f2]/30 font-mono text-[10px] text-[#5865f2] uppercase tracking-wider font-bold">
                <Disc className="w-3.5 h-3.5 text-[#5865f2] animate-spin" />
                <span>Uplink Node: Joined Discord</span>
              </div>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight">
                Join our Global Brotherhood matrices
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                We maintain an active online headquarters. Meet fellow players, organize focus streams, log active habits cooperatively, challenge companions, and gain advice on optimizing sleep, fitness margins, and compound asset design.
              </p>
              <div className="flex gap-6 pt-2 font-mono text-[10.5px] text-slate-500">
                <div>ONLINE: <span className="text-white font-bold font-mono">1,480+ PLAYERS</span></div>
                <div>DAILY EVENTS: <span className="text-indigo-400 font-bold font-mono">2 CALIBRATIONS</span></div>
              </div>
            </div>

            {/* Button call */}
            <a 
              href="https://discord.gg/Pq3u3XaDc" 
              target="_blank" 
              rel="noopener noreferrer"
              id="landing-discord-community-button"
              className="px-6 py-4 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] text-white font-display font-black text-xs uppercase tracking-wider transition-all duration-200 shrink-0 cursor-pointer shadow-[0_0_20px_rgba(88,101,242,0.45)] hover:shadow-[0_0_35px_rgba(88,101,242,0.6)] hover:scale-103 active:scale-95 flex items-center gap-2"
            >
              <Disc className="w-4 h-4" />
              JOIN DISCORD SERVER
            </a>

          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-24 px-4 text-center border-t border-white/5 relative">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="relative inline-block">
            <Swords className="w-12 h-12 text-indigo-400 mx-auto animate-pulse" />
          </div>

          <div className="space-y-3">
            <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-white uppercase tracking-tight">
              Start Your Journey Today
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Do not leave your personal parameters to simulated algorithms. Begin mapping out your core character advancement and unlock your potential.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto pt-4">
            <button 
              onClick={() => onGetStarted('signup')}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-650 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-display font-black uppercase tracking-wider text-xs shadow-[0_0_30px_rgba(99,102,241,0.5)] cursor-pointer hover:scale-103 active:scale-95 transition-all duration-200"
            >
              CREATE FREE AVATAR
            </button>
            <button 
              onClick={() => onGetStarted('login')}
              className="px-6 py-4 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              ACCESS CONSOLE LOG
            </button>
          </div>

          <div className="pt-8 font-mono text-[9px] text-slate-550 uppercase tracking-widest block select-none">
            ⚡ CONSOLE SYNC CODES SECURED • VERIFIED INGRESS ⚡
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-[#04040e] py-8 text-center select-none font-mono text-[10px] text-slate-600 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <Swords className="w-4 h-4 text-indigo-400" />
            <span className="font-display font-bold text-slate-400 uppercase tracking-wider">ANAVARE LIFEPATH</span>
          </div>
          <span className="text-center sm:text-left text-slate-650 font-mono text-[9.5px]">
            ALL SYSTEMS STANDING SECURE • PRODUCTION PRE-INTEGRATION LEVEL RPG 
          </span>
          <span className="font-mono text-[9px]">
            © 2026 COIL NETWORKS CO.
          </span>
        </div>
      </footer>

    </div>
  );
}
