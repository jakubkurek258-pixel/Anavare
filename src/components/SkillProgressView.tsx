import React from 'react';
import { useAuth } from '../context/AuthContext';
import { BADGE_LIBRARY } from '../data/rpgAssets';
import { TaskCategory } from '../types';
import { 
  Heart, Dumbbell, BookOpen, CheckSquare, Coins, Layers, 
  Lock, Award, Shield, Compass, Swords, Zap, Crown
} from 'lucide-react';

export default function SkillProgressView() {
  const { user } = useAuth();

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

  return (
    <div className="flex flex-col gap-8">
      
      {/* SECTION 1: CORE SKILL GRID MAPPING */}
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
                className="p-5 rounded-xl border border-white/10 bg-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
              >
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg bg-black/40 border border-slate-800 ${meta.textColor}`}>
                      {meta.icon}
                    </div>
                    <span className="font-display font-medium text-xs tracking-wide text-slate-100 uppercase">
                      {meta.title}
                    </span>
                  </div>
                  <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded bg-black/40 ${meta.textColor}`}>
                    Lvl {skill.level}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 font-sans leading-relaxed mb-4 min-h-[32px]">
                  {meta.description}
                </p>

                {/* Skill XP bar */}
                <div className="font-mono text-[10px] mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-500 uppercase">EXPERIENCE</span>
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
                <div className="pt-2 border-t border-slate-900/60">
                  <span className="text-[8px] font-mono text-slate-500 uppercase block mb-1">XP TRIGGER TRIGGERS</span>
                  <div className="flex flex-col gap-1">
                    {meta.actions.map((act, aIdx) => (
                      <div key={aIdx} className="flex items-center gap-1.5 text-[9px] text-slate-400 font-sans">
                        <span className={meta.textColor}>✓</span>
                        <span className="truncate">{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: GLOWING ACHIEVEMENTS CABINET */}
      <div className="p-6 rounded-xl bg-white/5 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" />
            <h3 className="font-display font-bold text-base tracking-wide text-indigo-300 uppercase">
              ACHIEVEMENTS CABINET
            </h3>
          </div>
          <span className="font-mono text-xs text-indigo-450 bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/25">
            UNLOCKED: {badges.length} / {BADGE_LIBRARY.length}
          </span>
        </div>

        <p className="text-xs text-slate-400 mb-6 font-sans">
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
                <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center border transition-all ${
                  isUnlocked 
                    ? 'border-indigo-400/30 bg-indigo-900/20 text-indigo-300' 
                    : 'border-slate-800 bg-black/80'
                }`}>
                  {isUnlocked ? (
                    getBadgeIcon(b.icon, true)
                  ) : (
                    <Lock className="w-5 h-5 text-slate-700" />
                  )}
                </div>

                <h4 className={`font-display font-bold text-xs uppercase ${isUnlocked ? 'text-glow-purple text-pink-200' : 'text-slate-650'}`}>
                  {b.title}
                </h4>

                <p className="text-[10px] text-slate-400/80 font-sans mt-1 leading-normal truncate w-full px-1">
                  {b.description}
                </p>

                {isUnlocked && userUnlockInfo && (
                  <span className="font-mono text-[8px] text-purple-400 uppercase mt-2.5 px-2 py-0.5 rounded bg-purple-950/20">
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
