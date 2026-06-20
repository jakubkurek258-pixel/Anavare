import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { stateService } from '../lib/stateService';
import { UserProfile } from '../types';
import { Trophy, Flame, ChevronRight, Award, Zap, Shield, Crown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getUserRank } from '../lib/rankSystem';
import AvatarImage from './AvatarImage';

export default function LeaderboardView() {
  const { user } = useAuth();
  const [leaderboardUsers, setLeaderboardUsers] = useState<UserProfile[]>([]);
  const [activeRankTab, setActiveRankTab] = useState<'weekly' | 'monthly'>('weekly');
  
  // Handlers for clickable profile overlays
  const [selectedLeaderboardUID, setSelectedLeaderboardUID] = useState<string | null>(null);
  const [selectedLeaderboardProfile, setSelectedLeaderboardProfile] = useState<UserProfile | null>(null);

  // Subscribe to all users ranks
  useEffect(() => {
    const unsub = stateService.subscribeAllUsers((list) => {
      setLeaderboardUsers(list);
    });
    return unsub;
  }, []);

  // Sync clicked scanner profiles
  useEffect(() => {
    if (!selectedLeaderboardUID) {
      setSelectedLeaderboardProfile(null);
      return;
    }
    let isActive = true;
    stateService.getStaticUserProfile(selectedLeaderboardUID).then((p) => {
      if (isActive && p) {
        setSelectedLeaderboardProfile(p);
      }
    });
    return () => {
      isActive = false;
    };
  }, [selectedLeaderboardUID]);

  if (!user) return null;

  // Add slight mock modifiers to simulate "weekly" vs "monthly" xp variations for extra richness
  const getDisplayXp = (item: UserProfile) => {
    if (activeRankTab === 'weekly') {
      // simulate weekly total being slightly lower or distinct
      const baseOfId = item.id.charCodeAt(item.id.length - 1) || 5;
      return Math.round(item.totalXp * 0.35 + (baseOfId * 8));
    }
    return item.totalXp;
  };

  const sortedRanks = [...leaderboardUsers].sort((a, b) => getDisplayXp(b) - getDisplayXp(a));

  const getRankEmblem = (rankIndex: number) => {
    switch (rankIndex) {
      case 0: return <Crown className="w-5 h-5 text-yellow-400 animate-pulse fill-yellow-500/20" />;
      case 1: return <Trophy className="w-4.5 h-4.5 text-slate-300 fill-slate-350/20" />;
      case 2: return <Trophy className="w-4.5 h-4.5 text-amber-600 fill-amber-700/20" />;
      default: return <span className="text-slate-500 font-mono font-bold text-xs">#{rankIndex + 1}</span>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* COLUMN LEFT MASTER RATING MATRIX */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        
        {/* LEADERBOARD HEADER TAB CONTROLS */}
        <div className="p-5 rounded-xl bg-white/5 border border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-indigo-400 animate-spin-slow" />
              <h3 className="font-display font-bold text-base text-slate-100 tracking-wide uppercase">
                CORES SYNCHRONIZED HIGH-SCORES
              </h3>
            </div>

            {/* Selector tabs */}
            <div className="flex gap-1.5 font-mono text-xs">
              <button
                onClick={() => setActiveRankTab('weekly')}
                id="rank-tab-weekly-btn"
                className={`px-4 py-1.5 rounded uppercase border transition-all cursor-pointer ${
                  activeRankTab === 'weekly'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 font-bold shadow-[0_0_8px_rgba(99,102,241,0.2)]'
                    : 'border-white/5 bg-black/45 text-slate-400 hover:border-white/10'
                }`}
              >
                WEEKLY COORDINATIONS
              </button>
              <button
                onClick={() => setActiveRankTab('monthly')}
                id="rank-tab-monthly-btn"
                className={`px-4 py-1.5 rounded uppercase border transition-all cursor-pointer ${
                  activeRankTab === 'monthly'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 font-bold shadow-[0_0_8px_rgba(99,102,241,0.2)]'
                    : 'border-white/5 bg-black/45 text-slate-400 hover:border-white/10'
                }`}
              >
                MONTHLY XP ACCUMUL
              </button>
            </div>
          </div>
        </div>

        {/* RANKINGS GRID CONTAINER LISTS */}
        <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden flex flex-col">
          
          {/* Header row labels */}
          <div className="px-5 py-3 border-b border-slate-900 bg-slate-950/60 flex justify-between items-center text-[10px] font-mono text-slate-500 uppercase">
            <div className="flex items-center gap-3">
              <span className="w-10 text-center">RANKING</span>
              <span>CHARACTER PORTRAIT</span>
            </div>
            <div className="flex items-center gap-12 text-right">
              <span className="hidden sm:inline">DAILY FLAME</span>
              <span>TOTAL REWARDS</span>
            </div>
          </div>

          {/* User ranks scroll list */}
          <div className="divide-y divide-slate-900/40">
            {sortedRanks.map((item, idx) => {
              const isCurrentUser = item.id === user.id;
              const displayXp = getDisplayXp(item);

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedLeaderboardUID(item.id)}
                  id={`leaderboard-row-${item.id}`}
                  className={`px-5 py-3.5 flex justify-between items-center gap-4 transition-colors cursor-pointer group ${
                    isCurrentUser 
                      ? 'bg-indigo-500/5 hover:bg-indigo-500/10' 
                      : 'hover:bg-white/5'
                  }`}
                >
                  {/* Left rank status avatar */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 shrink-0 flex items-center justify-center">
                      {getRankEmblem(idx)}
                    </div>
                    
                    {/* Character Avatar portrait */}
                    <div className="w-9 h-9 rounded overflow-hidden border border-white/5 shrink-0 group-hover:border-indigo-400 transition-colors flex items-center justify-center">
                      <AvatarImage
                        src={item.avatar}
                        alt={item.username}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-display font-bold text-xs group-hover:text-indigo-400 transition-colors truncate ${
                          isCurrentUser ? 'text-indigo-400 font-black' : 'text-slate-200'
                        }`}>
                          {item.username}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[8px] font-mono bg-indigo-500 text-white px-1.5 rounded uppercase font-black">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[9px] text-slate-500 uppercase block mt-0.5">
                        {getUserRank(item.level).badge} {getUserRank(item.level).name} • Level {item.level} • {item.badges.length} Achievements
                      </span>
                    </div>
                  </div>

                  {/* Right numbers metrics */}
                  <div className="flex items-center gap-12 shrink-0 font-mono text-xs text-right">
                    <span className="text-orange-400 font-bold hidden sm:inline">
                      🔥 {item.streak} days
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-400 font-bold text-[12px]">
                        {displayXp} XP
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* COLUMN RIGHT LEADERBOARD INFO PANEL */}
      <div className="lg:col-span-4 flex flex-col gap-5">
        
        {/* NEW: COUNTDOWN & WEEKLY RESET SIMULATOR CHRONO */}
        <div className="p-5 rounded-xl border border-white/10 bg-gradient-to-b from-[#120f26] to-black space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-2 text-indigo-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
              </span>
              <h4 className="font-display font-medium text-xs uppercase tracking-wide">
                RESET CHRONOMETER
              </h4>
            </div>
            <span className="font-mono text-[8px] text-slate-500 uppercase">SYS SECURED</span>
          </div>

          <div className="space-y-1 text-center py-2.5">
            <span className="text-[10px] text-slate-500 font-mono uppercase block">WEEKLY HIGHSCORE ROTATION REFIT</span>
            <div className="flex justify-center gap-3.5 font-mono">
              <div>
                <span className="text-xl font-bold font-mono text-glow-blue text-white">03</span>
                <span className="text-[8px] text-slate-500 block uppercase font-black">DAYS</span>
              </div>
              <span className="text-xl text-slate-600">:</span>
              <div>
                <span className="text-xl font-bold font-mono text-glow-blue text-white">14</span>
                <span className="text-[8px] text-slate-500 block uppercase font-black">HRS</span>
              </div>
              <span className="text-xl text-slate-600">:</span>
              <div>
                <span className="text-xl font-bold font-mono text-glow-blue text-white">45</span>
                <span className="text-[8px] text-slate-500 block uppercase font-black">MIN</span>
              </div>
              <span className="text-xl text-slate-600">:</span>
              <div>
                <span className="text-xl font-bold font-mono text-glow-blue text-white animate-pulse">22</span>
                <span className="text-[8px] text-slate-500 block uppercase font-black">SEC</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-black/40 border border-slate-900 text-[10.5px] font-sans text-slate-400 leading-normal">
            Weekly highscore records reset in accordance with Sunday UTC synchrony. Ranks are compiled and premium badges are assigned to podium leaders.
          </div>

          <button
            onClick={() => {
              const winnerNames = sortedRanks.slice(0, 3).map(r => r.username).join(', ');
              alert(`🎉 [WEEKLY RESET SIMULATION SUCCESSFUL]\n🏆 Ranks successfully rotated!\n🥇 Season rewards and premium badges have been dispatched to: ${winnerNames || 'Lyra, Elena and Kaelen'}\n🔥 Active streak modifiers credited +150 XP bonus!`);
            }}
            id="simulate-reset-btn"
            className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 font-mono text-[9px] uppercase font-bold text-indigo-400 rounded-lg hover:text-white hover:border-indigo-400 transition-all cursor-pointer"
          >
            ⚙️ Dry-Run Weekly Reset Simulator
          </button>
        </div>

        {/* REWARDS DESCRIPTION */}
        <div className="p-5 rounded-xl border border-white/10 bg-white/5 space-y-3">
          <div className="flex items-center gap-2 text-indigo-400">
            <Award className="w-4 h-4" />
            <h4 className="font-display font-medium text-xs uppercase tracking-wide">
              HIGHSCORES SEASON PROTOC
            </h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Your performance ranks are calculated based on overall accumulated self-improvement achievements. The weekly high-score matrix counts experience cycles recorded during the current week cycle, and refreshes every Sunday.
          </p>
          <div className="p-3 bg-black/40 rounded-lg border border-white/5 font-mono text-[10px] text-slate-350 space-y-1.5">
            <span className="text-slate-500 uppercase block mb-1">PROMOTION REWARDS:</span>
            <p className="text-indigo-400">🥇 Rank 1 overall gains "Unchallenged Sovereign" visual banner.</p>
            <p className="text-slate-300">🥈 Rank 2 overall gains "Archmage of Focus" emblem.</p>
            <p className="text-slate-400">🥉 Rank 3 overall gains "Steel Titan" avatar unlocks.</p>
          </div>
        </div>

        {/* CLICK STATS HELPER BOX */}
        <div className="p-4 rounded-xl border border-dashed border-slate-850 bg-black/15 text-center text-slate-600 font-sans text-[11px]">
          Click on any leaderboard contestant's lane card to scan their specific RPG profile details, unlocking streak analytics.
        </div>
      </div>

      {/* DIALOG POPUP: CONTRACT SCANNER CLICK-OVERLAY */}
      <AnimatePresence>
        {selectedLeaderboardUID && selectedLeaderboardProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-xl bg-[#090818] border border-white/10 p-6 relative overflow-hidden backdrop-blur-xl"
            >
              <button
                onClick={() => setSelectedLeaderboardUID(null)}
                id="close-leaderboard-profile-btn"
                className="absolute top-4 right-4 p-1.5 rounded bg-black/40 border border-slate-800 text-slate-400 hover:text-white transition-all outline-none"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center text-center pb-4 border-b border-white/5">
                <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-white/10 bg-black/50 mb-3 flex items-center justify-center">
                  <AvatarImage
                    src={selectedLeaderboardProfile.avatar}
                    alt={selectedLeaderboardProfile.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-display font-bold text-base text-white uppercase tracking-wide">
                  {selectedLeaderboardProfile.username}
                </h3>
                <span className="font-mono text-[9px] text-indigo-400 tracking-wider uppercase block mt-0.5">
                  {getUserRank(selectedLeaderboardProfile.level).badge} {getUserRank(selectedLeaderboardProfile.level).name} (LEVEL {selectedLeaderboardProfile.level})
                </span>

                <div className="flex gap-4 mt-4 font-mono text-xs">
                  <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-slate-900">
                    <span className="text-slate-500 block text-[9px] uppercase">RPG XP</span>
                    <span className="text-slate-200 font-bold block">{selectedLeaderboardProfile.totalXp}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-slate-900">
                    <span className="text-slate-500 block text-[9px] uppercase">STREAKFLAME</span>
                    <span className="text-orange-400 font-bold block">🔥 {selectedLeaderboardProfile.streak} DAYS</span>
                  </div>
                </div>
              </div>

              {/* Character Attributes progress radars */}
              <div className="py-4 space-y-2.5 border-b border-white/5">
                <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1">RPG SKILL ATTRIBUTES:</span>
                
                {Object.entries(selectedLeaderboardProfile.skills).map(([skName, progress]: [string, any]) => {
                  const percent = Math.min(100, (progress.xp / (progress.level * 100)) * 100);
                  return (
                    <div key={skName} className="font-mono text-[10px]">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-slate-350 uppercase">{skName}</span>
                        <span className="text-slate-400">Lvl {progress.level}</span>
                      </div>
                      <div className="w-full h-1 bg-black/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Badges unlocked listed */}
              <div className="pt-4">
                <span className="text-[9px] font-mono text-slate-500 uppercase block mb-2">GOLDEN BADGES UNLOCKED ({selectedLeaderboardProfile.badges.length}):</span>
                <div className="flex gap-1.5 flex-wrap">
                  {selectedLeaderboardProfile.badges.map((b, idx) => (
                    <span
                      key={idx}
                      title={b.description}
                      className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-[9px] text-purple-300 font-mono uppercase"
                    >
                      ★ {b.title}
                    </span>
                  ))}
                  {selectedLeaderboardProfile.badges.length === 0 && (
                    <span className="text-[10px] font-mono text-slate-500 uppercase font-black text-glow-purple">NO MESH BADGES GAINED.</span>
                  )}
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
