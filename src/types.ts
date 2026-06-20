export interface SkillProgress {
  level: number;
  xp: number;
}

export interface UserSkills {
  health: SkillProgress;
  fitness: SkillProgress;
  learning: SkillProgress;
  productivity: SkillProgress;
  finance: SkillProgress;
  mindset: SkillProgress;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar: string; // url or key
  level: number;
  xp: number;
  requiredXp: number;
  totalXp: number;
  streak: number;
  lastActiveDate?: string; // YYYY-MM-DD
  lastChallengeCompletedDate?: string; // YYYY-MM-DD
  skills: UserSkills;
  badges: Badge[];
  createdAt: string;
}

export type TaskCategory = 'health' | 'fitness' | 'learning' | 'productivity' | 'finance' | 'mindset';
export type TaskDifficulty = 'easy' | 'medium' | 'hard' | 'epic';

export interface RPGTask {
  id: string;
  userId: string;
  title: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  completed: boolean;
  completedAt?: string | null;
  dueDate?: string | null; // YYYY-MM-DD
  recurring: 'none' | 'daily' | 'weekly';
  createdAt: string;
  description?: string;
  skillTreeId?: string;
  skillNodeId?: string;
  xpReward?: number;
}

export interface RPGComment {
  id: string;
  postId: string;
  userId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  parentCommentId: string | null;
  createdAt: string;
  replies?: RPGComment[]; // tree structure in React memory
}

export interface RPGPost {
  id: string;
  userId: string;
  authorId?: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  imageUrl?: string | null;
  likes: string[]; // uids of users who liked
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  xpReward: number;
  contentMarkdown: string;
  videoUrl?: string;
  imageUrl?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  xpReward: number;
  image: string;
  lessons: Lesson[];
  creatorId?: string;
  coverImageUrl?: string;
}

export interface UserLesson {
  id: string; // userId_courseId_lessonId
  userId: string;
  courseId: string;
  lessonId: string;
  completed: boolean;
  completedAt: string;
  proofUrl?: string;
  proofType?: 'image' | 'video';
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  type: 'tasks' | 'category' | 'social';
  category?: TaskCategory;
  xpReward: number;
  completed: boolean;
}

export interface RPGNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'system' | 'level_up' | 'streak' | 'badge' | 'social';
  read: boolean;
  createdAt: string;
}
