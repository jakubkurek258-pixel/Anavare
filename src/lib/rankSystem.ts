export interface RankInfo {
  name: string;
  badge: string;
  minLevel: number;
}

export const RANK_LIST: RankInfo[] = [
  { name: 'Newcomer', badge: '🌱', minLevel: 1 },
  { name: 'Explorer', badge: '🔹', minLevel: 10 },
  { name: 'Adventurer', badge: '🚀', minLevel: 20 },
  { name: 'Challenger', badge: '🛡️', minLevel: 30 },
  { name: 'Competitor', badge: '⭐', minLevel: 40 },
  { name: 'Elite', badge: '💎', minLevel: 50 },
  { name: 'Veteran', badge: '🔥', minLevel: 60 },
  { name: 'Master', badge: '⚔️', minLevel: 70 },
  { name: 'Champion', badge: '👑', minLevel: 80 },
  { name: 'Hero', badge: '🌟', minLevel: 90 },
  { name: 'Legend', badge: '🪽', minLevel: 100 },
  { name: 'Apex Predator', badge: '🐲', minLevel: 110 },
  { name: 'Ascended Divine', badge: '✨', minLevel: 130 },
  { name: 'Cosmic Sentinel', badge: '🪐', minLevel: 160 },
  { name: 'Primordial Overlord', badge: '☄️', minLevel: 200 },
  { name: 'Celestial Sovereign', badge: '🌌', minLevel: 250 },
  { name: 'Chrono Walker', badge: '⏳', minLevel: 300 },
  { name: 'Dimensional Traveler', badge: '🌀', minLevel: 350 },
  { name: 'Omnipresent Deity', badge: '🪐', minLevel: 400 },
  { name: 'Absolute Transcendence', badge: '♾️', minLevel: 450 },
  { name: 'Eternal Creator', badge: '☀️', minLevel: 500 }
];

export function getUserRank(level: number): RankInfo {
  // Search backward to find the highest rank the user qualifies for
  for (let i = RANK_LIST.length - 1; i >= 0; i--) {
    if (level >= RANK_LIST[i].minLevel) {
      return RANK_LIST[i];
    }
  }
  return RANK_LIST[0];
}
