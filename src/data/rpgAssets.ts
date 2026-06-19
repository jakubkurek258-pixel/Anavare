import { Course, Badge } from '../types';

export const COMPANIONS_AVATARS = [
  { id: 'av1', name: 'Cyber Rogue', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&q=80' },
  { id: 'av2', name: 'Neon Samurai', url: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=150&q=80' },
  { id: 'av3', name: 'Solar Mage', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=150&q=80' },
  { id: 'av4', name: 'Techno Valkyrie', url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=150&q=80' },
  { id: 'av6', name: 'Synthesized Sage', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=150&q=80' }
];

export const BADGE_LIBRARY: Omit<Badge, 'unlockedAt'>[] = [
  {
    id: 'badge_first_step',
    title: 'First Step',
    description: 'Complete your very first task in Anavare.',
    icon: 'Sword'
  },
  {
    id: 'badge_level_5',
    title: 'Rising Hero',
    description: 'Reach user Level 5 and begin your legend.',
    icon: 'ShieldAlert'
  },
  {
    id: 'badge_health_adept',
    title: 'Vitality Novice',
    description: 'Reach Level 3 in the Health skill.',
    icon: 'Heart'
  },
  {
    id: 'badge_finance_investor',
    title: 'Gold Miner',
    description: 'Reach Level 3 in the Finance skill.',
    icon: 'Coins'
  },
  {
    id: 'badge_fitness_warrior',
    title: 'Iron Born',
    description: 'Reach Level 3 in the Fitness skill.',
    icon: 'Flame'
  },
  {
    id: 'badge_learning_scholar',
    title: 'Grand Archmage',
    description: 'Reach Level 3 in the Learning skill.',
    icon: 'BookOpen'
  },
  {
    id: 'badge_epic_conqueror',
    title: 'Epic Conqueror',
    description: 'Complete an Epic difficulty task.',
    icon: 'Crown'
  },
  {
    id: 'badge_streak_3',
    title: 'Tri-Force Streak',
    description: 'Achieve a 3-day daily streak.',
    icon: 'Zap'
  },
  {
    id: 'badge_streak_7',
    title: 'Undefeated',
    description: 'Achieve a 7-day daily streak.',
    icon: 'FlameKindling'
  }
];

export const SAMPLE_COURSES: Course[] = [
  {
    id: 'course_health_1',
    title: 'Chronicles of Sleep & Vitality',
    description: 'Master circadian rhythm synchronization and sleep mechanics to skyrocket your energy bar.',
    category: 'health',
    xpReward: 200,
    image: 'https://images.unsplash.com/photo-1511295742364-92b9345f6852?w=400&q=80',
    lessons: [
      {
        id: 'c1_l1',
        title: 'Light & Darkness Calibration',
        description: 'Synchronize your biological clock using visual photons and darkness cycles.',
        duration: '10 min',
        xpReward: 50,
        contentMarkdown: `### 🌞 Photon Alignment Protocol\n\nTo synchronize your internal biological clock, you must master light exposure.\n\n*   **Morning Sunlight:** Expose your eyes (no sunglasses) to 10-15 minutes of direct morning sunlight within 1 hour of waking. This triggers cortisol secretion for focused energy.\n*   **Blue Light Blocking:** Dim all screens or wear amber glasses 2 hours before bed to allow melatonin production.\n\n#### 🎯 Real-life Quest:\nStep outside tomorrow morning and breathe under the sun for 10 minutes without looking at your smartphone.`
      },
      {
        id: 'c1_l2',
        title: 'Deep Rest Recovery Tactics',
        description: 'Increase non-REM deep sleep by tuning environmental variables.',
        duration: '15 min',
        xpReward: 50,
        contentMarkdown: `### 💤 Deep Sleep Mechanics\n\nDeep sleep is when physical restoration occurs.\n\n1.  **Temperature Drops:** Keep your chamber cool (around 18°C or 65°F). Your body must drop core temperature to plunge into deep sleep.\n2.  **No Caffeine after 2 PM:** Caffeine blocks adenosine receptors, preventing sleep pressure build-up.\n\n#### 🎯 Real-life Quest:\nDrop your room temperature down and avoid eating any calories 3 hours before sleep tonight.`
      }
    ]
  },
  {
    id: 'course_finance_1',
    title: 'The Compound Wealth Formula',
    description: 'Learn the core principles of capital growth, passive investing, and asset allocation.',
    category: 'finance',
    xpReward: 300,
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&q=80',
    lessons: [
      {
        id: 'c2_l1',
        title: 'Automating Golden Flow',
        description: 'Set up automatic partitions to direct your gold pieces before you can spend them.',
        duration: '12 min',
        xpReward: 60,
        contentMarkdown: `### 🪙 Wealth Separation Protocol\n\nStop budgeting manually. Automate your accounts.\n\n*   **Pay Yourself First:** Configure your bank account to automatically route 15% of all income into an index fund account immediately upon receiving it.\n*   **Categorized Vaults:** Set up distinct envelopes or sub-accounts for essential expenses, entertainment, and safety reserves.\n\n#### 🎯 Real-life Quest:\nCreate an automated transfer in your bank account of at least 5% to your savings/investing portfolio.`
      },
      {
        id: 'c2_l2',
        title: 'The Infinite Compounder',
        description: 'Calculate and unleash the explosive physics of compounding interest.',
        duration: '15 min',
        xpReward: 60,
        contentMarkdown: `### 📈 Exponential growth curves\n\nCompounding is the 8th wonder of the world.\n\nIf you invest $500 monthly with 8% compound annual return, you will accumulate approximately:\n- 10 years: $91,000\n- 20 years: $294,000\n- 30 years: $745,000\n\n#### 🎯 Real-life Quest:\nUse a compound interest calculator online to map out your 10-year growth model based on your saving capabilities.`
      }
    ]
  },
  {
    id: 'course_mindset_1',
    title: 'Stoic Fortress Construction',
    description: 'Forging mental resilience against random life encounters using ancient emotional control tools.',
    category: 'mindset',
    xpReward: 250,
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&q=80',
    lessons: [
      {
        id: 'c3_l1',
        title: 'The Dichotomy of Control',
        description: 'Differentiate between internal intentions and external outputs.',
        duration: '10 min',
        xpReward: 50,
        contentMarkdown: `### 🛡️ Stoic Shielding\n\nEpictetus taught: "Some things are in our control, and others are not."\n\n*   **Internal Control:** Your judgments, responses, intentions, and character.\n*   **External Factors:** Traffic, weather, other people's behavior, macroeconomics.\n\n#### 🎯 Real-life Quest:\nWhen you face an annoying event today, declare instantly: "This is outside my control, its impact depends entirely on my response."`
      },
      {
        id: 'c3_l2',
        title: 'Amor Fati - Love of Fate',
        description: 'Transforming setbacks into positive character-building encounters.',
        duration: '12 min',
        xpReward: 70,
        contentMarkdown: `### 🔥 Amor Fati Protocol\n\nDo not merely tolerate setbacks, welcome them as fuel.\n\n*   Marcus Aurelius wrote: "The impediment to action advances action. What stands in the way becomes the way."\n*   Setbacks are opportunities to practice patience, courage, and resourcefulness.\n\n#### 🎯 Real-life Quest:\nIdentify a recent failure or problem in your life. Write down 3 distinct ways this obstacle has forced you to gain strength.`
      }
    ]
  }
];
