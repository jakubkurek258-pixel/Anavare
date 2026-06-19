import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  where, 
  getDoc,
  getDocs,
  arrayUnion,
  arrayRemove,
  increment,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { db, auth, isFirebaseEnabled, OperationType, handleFirestoreError, storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  UserProfile, 
  RPGTask, 
  RPGPost, 
  RPGComment, 
  UserLesson, 
  RPGNotification, 
  TaskCategory, 
  TaskDifficulty,
  Badge,
  UserSkills,
  Course,
  Lesson
} from '../types';
import { BADGE_LIBRARY, COMPANIONS_AVATARS, SAMPLE_COURSES } from '../data/rpgAssets';
import { containsBadWord } from './usernameValidator';

// Helper to protect Firebase async actions from network hanging indefinitely
function withTimeout<T>(promise: Promise<T>, timeoutMs = 10000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firebase network transmission timeout.')), timeoutMs)
    )
  ]);
}

// Helper to wait for Firebase Auth state to be fully resolved
function waitForAuthUser(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!isFirebaseEnabled) {
      resolve(null);
      return;
    }
    if (!auth) {
      reject(new Error('Firebase Authentication is not available.'));
      return;
    }
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }
    
    let resolved = false;
    const unsubscribe = auth.onAuthStateChanged((user: any) => {
      if (!resolved) {
        resolved = true;
        unsubscribe();
        if (user) {
          resolve(user);
        } else {
          reject(new Error('Authentication required: No currentUser is logged in.'));
        }
      }
    }, (err: any) => {
      if (!resolved) {
        resolved = true;
        unsubscribe();
        reject(err);
      }
    });

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        unsubscribe();
        reject(new Error('Firebase Auth initialization timed out.'));
      }
    }, 5000);
  });
}

// Fallback in-memory and LocalStorage structures for full offline simulation in sandboxed containers
class LocalRPGEngine {
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor() {
    this.initLocalStorage();
  }

  private initLocalStorage() {
    if (!localStorage.getItem('anavare_users')) {
      const defaultUsers: { [id: string]: UserProfile } = {
        'mock_hero_id': {
          id: 'mock_hero_id',
          username: 'ValkyriePrime',
          email: 'valkyrie@anavare.org',
          avatar: COMPANIONS_AVATARS[3].url,
          level: 2,
          xp: 80,
          requiredXp: 200,
          totalXp: 180,
          streak: 4,
          lastActiveDate: new Date().toISOString().split('T')[0],
          skills: {
            health: { level: 2, xp: 40 },
            fitness: { level: 1, xp: 90 },
            learning: { level: 2, xp: 10 },
            productivity: { level: 1, xp: 50 },
            finance: { level: 1, xp: 20 },
            mindset: { level: 1, xp: 80 },
          },
          badges: [
            { id: 'badge_first_step', title: 'First Step', description: 'Complete your very first task in Anavare.', icon: 'Sword', unlockedAt: new Date().toISOString() }
          ],
          createdAt: new Date().toISOString(),
        },
        'system_rival': {
          id: 'system_rival',
          username: 'ChronosStryder',
          email: 'stryder@anavare.org',
          avatar: COMPANIONS_AVATARS[1].url,
          level: 5,
          xp: 120,
          requiredXp: 500,
          totalXp: 1220,
          streak: 8,
          skills: {
            health: { level: 4, xp: 30 },
            fitness: { level: 5, xp: 50 },
            learning: { level: 3, xp: 10 },
            productivity: { level: 3, xp: 80 },
            finance: { level: 4, xp: 90 },
            mindset: { level: 2, xp: 60 },
          },
          badges: [],
          createdAt: new Date().toISOString(),
        },
        'system_sage': {
          id: 'system_sage',
          username: 'EtherealNova',
          email: 'nova@anavare.org',
          avatar: COMPANIONS_AVATARS[2].url,
          level: 3,
          xp: 150,
          requiredXp: 300,
          totalXp: 450,
          streak: 12,
          skills: {
            health: { level: 2, xp: 20 },
            fitness: { level: 2, xp: 10 },
            learning: { level: 4, xp: 80 },
            productivity: { level: 2, xp: 70 },
            finance: { level: 1, xp: 40 },
            mindset: { level: 3, xp: 50 },
          },
          badges: [],
          createdAt: new Date().toISOString(),
        }
      };
      localStorage.setItem('anavare_users', JSON.stringify(defaultUsers));
    }

    if (!localStorage.getItem('anavare_tasks')) {
      const defaultTasks: RPGTask[] = [
        {
          id: 'task_1',
          userId: 'mock_hero_id',
          title: '30-minute cardio session',
          category: 'fitness',
          difficulty: 'medium',
          completed: false,
          recurring: 'daily',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'task_2',
          userId: 'mock_hero_id',
          title: 'Read deep sleep science lesson',
          category: 'health',
          difficulty: 'easy',
          completed: true,
          completedAt: new Date().toISOString(),
          recurring: 'none',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'task_3',
          userId: 'mock_hero_id',
          title: 'Refactor finance investing vaults',
          category: 'finance',
          difficulty: 'hard',
          completed: false,
          recurring: 'none',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'task_4',
          userId: 'mock_hero_id',
          title: 'Morning Stoic reflection',
          category: 'mindset',
          difficulty: 'easy',
          completed: false,
          recurring: 'daily',
          createdAt: new Date().toISOString(),
        }
      ];
      localStorage.setItem('anavare_tasks', JSON.stringify(defaultTasks));
    }

    if (!localStorage.getItem('anavare_posts')) {
      const defaultPosts: RPGPost[] = [
        {
          id: 'post_1',
          userId: 'system_rival',
          authorName: 'ChronosStryder',
          authorAvatar: COMPANIONS_AVATARS[1].url,
          content: 'Just reached Level 5! Iron Born badge unlocked. Morning cardio completed in darkness to calibrate my biology! 🥋🔥 Let\'s level up our real life!',
          imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&q=80',
          likes: ['mock_hero_id'],
          likesCount: 1,
          commentsCount: 2,
          createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        },
        {
          id: 'post_2',
          userId: 'system_sage',
          authorName: 'EtherealNova',
          authorAvatar: COMPANIONS_AVATARS[2].url,
          content: 'Stoicism is key. "The impediment to action advances action." Setbacks are just high-XP boss fights. Highly recommend finishing the Stoic Fortress course!',
          likes: [],
          likesCount: 0,
          commentsCount: 1,
          createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        }
      ];
      localStorage.setItem('anavare_posts', JSON.stringify(defaultPosts));
    }

    if (!localStorage.getItem('anavare_comments')) {
      const defaultComments: { [postId: string]: RPGComment[] } = {
        'post_1': [
          {
            id: 'comment_1_1',
            postId: 'post_1',
            userId: 'system_sage',
            authorName: 'EtherealNova',
            authorAvatar: COMPANIONS_AVATARS[2].url,
            content: 'Incredible speed! What are your main skills?',
            parentCommentId: null,
            createdAt: new Date(Date.now() - 3600000 * 3.5).toISOString(),
          },
          {
            id: 'comment_1_2',
            postId: 'post_1',
            userId: 'system_rival',
            authorName: 'ChronosStryder',
            authorAvatar: COMPANIONS_AVATARS[1].url,
            content: 'Mainly Fitness and Finance. Health is getting up there too.',
            parentCommentId: 'comment_1_1',
            createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
          }
        ],
        'post_2': [
          {
            id: 'comment_2_1',
            postId: 'post_2',
            userId: 'mock_hero_id',
            authorName: 'ValkyriePrime',
            authorAvatar: COMPANIONS_AVATARS[3].url,
            content: 'Agreed. That Marcus Aurelius lesson was legendary.',
            parentCommentId: null,
            createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
          }
        ]
      };
      localStorage.setItem('anavare_comments', JSON.stringify(defaultComments));
    }

    if (!localStorage.getItem('anavare_lessons')) {
      const defaultLessons: UserLesson[] = [
        {
          id: 'mock_hero_id_course_health_1_c1_l1',
          userId: 'mock_hero_id',
          courseId: 'course_health_1',
          lessonId: 'c1_l1',
          completed: true,
          completedAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('anavare_lessons', JSON.stringify(defaultLessons));
    }

    if (!localStorage.getItem('anavare_notifications')) {
      const defaultNotifications: RPGNotification[] = [
        {
          id: 'notif_1',
          userId: 'mock_hero_id',
          title: '🔥 Streak Level Up! ',
          message: 'Your self-improvement streak is now 4 days. Keep it up!',
          type: 'streak',
          read: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 'notif_2',
          userId: 'mock_hero_id',
          title: '🏆 Sword of Discipline Unlocked',
          message: 'You have unlocked the "First Step" achievement badge!',
          type: 'badge',
          read: true,
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
        }
      ];
      localStorage.setItem('anavare_notifications', JSON.stringify(defaultNotifications));
    }
  }

  // Pub Sub implementation
  public subscribe(eventKey: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(eventKey)) {
      this.listeners.set(eventKey, new Set());
    }
    this.listeners.get(eventKey)!.add(callback);

    // Initial publish
    const currentData = this.getEventData(eventKey);
    callback(currentData);

    return () => {
      this.listeners.get(eventKey)?.delete(callback);
    };
  }

  public notify(eventKey: string) {
    if (this.listeners.has(eventKey)) {
      const data = this.getEventData(eventKey);
      this.listeners.get(eventKey)!.forEach(callback => callback(data));
    }
  }

  private getEventData(eventKey: string): any {
    const parts = eventKey.split(':');
    const type = parts[0];
    const id = parts[1];

    if (type === 'user') {
      const users = JSON.parse(localStorage.getItem('anavare_users') || '{}');
      return users[id] || null;
    }
    if (type === 'users_list') {
      const users = JSON.parse(localStorage.getItem('anavare_users') || '{}');
      return Object.values(users);
    }
    if (type === 'tasks') {
      const tasks: RPGTask[] = JSON.parse(localStorage.getItem('anavare_tasks') || '[]');
      return tasks.filter(t => t.userId === id);
    }
    if (type === 'posts') {
      const posts: RPGPost[] = JSON.parse(localStorage.getItem('anavare_posts') || '[]');
      return [...posts].sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    }
    if (type === 'comments') {
      const allComments = JSON.parse(localStorage.getItem('anavare_comments') || '{}');
      const comments: RPGComment[] = allComments[id] || [];
      return [...comments].sort((a,b) => a.createdAt.localeCompare(b.createdAt));
    }
    if (type === 'lessons') {
      const lessons: UserLesson[] = JSON.parse(localStorage.getItem('anavare_lessons') || '[]');
      return lessons.filter(l => l.userId === id);
    }
    if (type === 'courses') {
      return JSON.parse(localStorage.getItem('anavare_custom_courses') || '[]');
    }
    if (type === 'notifications') {
      const notifs: RPGNotification[] = JSON.parse(localStorage.getItem('anavare_notifications') || '[]');
      return notifs
        .filter(n => n.userId === id)
        .sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    }
    return null;
  }

  // Mutations
  public writeUser(user: UserProfile | undefined | null) {
    if (!user || !user.id) return;
    const users = JSON.parse(localStorage.getItem('anavare_users') || '{}');
    users[user.id] = user;
    localStorage.setItem('anavare_users', JSON.stringify(users));
    this.notify(`user:${user.id}`);
    this.notify('users_list:global');
  }

  public writeTasks(userId: string, tasks: RPGTask[]) {
    localStorage.setItem('anavare_tasks', JSON.stringify(tasks));
    this.notify(`tasks:${userId}`);
  }

  public writePosts(posts: RPGPost[]) {
    localStorage.setItem('anavare_posts', JSON.stringify(posts));
    this.notify('posts:feed');
  }

  public writeComments(postId: string, comments: RPGComment[]) {
    const all = JSON.parse(localStorage.getItem('anavare_comments') || '{}');
    all[postId] = comments;
    localStorage.setItem('anavare_comments', JSON.stringify(all));
    this.notify(`comments:${postId}`);
  }

  public writeLessons(userId: string, lessons: UserLesson[]) {
    localStorage.setItem('anavare_lessons', JSON.stringify(lessons));
    this.notify(`lessons:${userId}`);
  }

  public writeNotifications(userId: string, notifs: RPGNotification[]) {
    localStorage.setItem('anavare_notifications', JSON.stringify(notifs));
    this.notify(`notifications:${userId}`);
  }
}

export const localRPG = new LocalRPGEngine();

// Helper to determine XP based on difficulty
export function getXpReward(difficulty: TaskDifficulty): number {
  switch (difficulty) {
    case 'easy': return 15;
    case 'medium': return 35;
    case 'hard': return 75;
    case 'epic': return 150;
    default: return 10;
  }
}

// Global RPG Level Up mechanics
export function addXpToUserProfile(
  user: UserProfile, 
  xpAmount: number, 
  category?: TaskCategory,
  isTaskCompletion?: boolean
): { updatedUser: UserProfile; actions: string[] } {
  const updatedUser = JSON.parse(JSON.stringify(user)) as UserProfile;
  const actions: string[] = [];

  // 1. Add XP to global stats
  updatedUser.xp += xpAmount;
  updatedUser.totalXp += xpAmount;

  // Global Level Up evaluation loop
  while (updatedUser.xp >= updatedUser.requiredXp) {
    updatedUser.xp -= updatedUser.requiredXp;
    updatedUser.level += 1;
    updatedUser.requiredXp = updatedUser.level * 100;
    actions.push(`LEVELUP:${updatedUser.level}`);
  }

  // 2. Add XP to specific skill category
  if (category && updatedUser.skills[category]) {
    const skill = updatedUser.skills[category];
    skill.xp += xpAmount;
    
    // Skill Level Up evaluation loops (each level requires skillLevel * 100)
    const getSkillReq = (lvl: number) => lvl * 100;
    while (skill.xp >= getSkillReq(skill.level)) {
      skill.xp -= getSkillReq(skill.level);
      skill.level += 1;
      actions.push(`SKILLUP:${category}:${skill.level}`);
    }
  }

  // 3. Badges Check
  const currentBadgeIds = new Set(updatedUser.badges.map(b => b.id));
  const newBadges: Badge[] = [];

  // Check Badge conditions
  if (isTaskCompletion && !currentBadgeIds.has('badge_first_step')) {
    const badgeDef = BADGE_LIBRARY.find(b => b.id === 'badge_first_step')!;
    newBadges.push({ ...badgeDef, unlockedAt: new Date().toISOString() });
  }
  if (!currentBadgeIds.has('badge_level_5') && updatedUser.level >= 5) {
    const badgeDef = BADGE_LIBRARY.find(b => b.id === 'badge_level_5')!;
    newBadges.push({ ...badgeDef, unlockedAt: new Date().toISOString() });
  }
  if (category === 'health' && updatedUser.skills.health.level >= 3 && !currentBadgeIds.has('badge_health_adept')) {
    const badgeDef = BADGE_LIBRARY.find(b => b.id === 'badge_health_adept')!;
    newBadges.push({ ...badgeDef, unlockedAt: new Date().toISOString() });
  }
  if (category === 'finance' && updatedUser.skills.finance.level >= 3 && !currentBadgeIds.has('badge_finance_investor')) {
    const badgeDef = BADGE_LIBRARY.find(b => b.id === 'badge_finance_investor')!;
    newBadges.push({ ...badgeDef, unlockedAt: new Date().toISOString() });
  }
  if (category === 'fitness' && updatedUser.skills.fitness.level >= 3 && !currentBadgeIds.has('badge_fitness_warrior')) {
    const badgeDef = BADGE_LIBRARY.find(b => b.id === 'badge_fitness_warrior')!;
    newBadges.push({ ...badgeDef, unlockedAt: new Date().toISOString() });
  }
  if (category === 'learning' && updatedUser.skills.learning.level >= 3 && !currentBadgeIds.has('badge_learning_scholar')) {
    const badgeDef = BADGE_LIBRARY.find(b => b.id === 'badge_learning_scholar')!;
    newBadges.push({ ...badgeDef, unlockedAt: new Date().toISOString() });
  }
  if (difficulty_epic_check(xpAmount) && !currentBadgeIds.has('badge_epic_conqueror')) {
    const badgeDef = BADGE_LIBRARY.find(b => b.id === 'badge_epic_conqueror')!;
    newBadges.push({ ...badgeDef, unlockedAt: new Date().toISOString() });
  }
  if (updatedUser.streak >= 3 && !currentBadgeIds.has('badge_streak_3')) {
    const badgeDef = BADGE_LIBRARY.find(b => b.id === 'badge_streak_3')!;
    newBadges.push({ ...badgeDef, unlockedAt: new Date().toISOString() });
  }
  if (updatedUser.streak >= 7 && !currentBadgeIds.has('badge_streak_7')) {
    const badgeDef = BADGE_LIBRARY.find(b => b.id === 'badge_streak_7')!;
    newBadges.push({ ...badgeDef, unlockedAt: new Date().toISOString() });
  }

  if (newBadges.length > 0) {
    updatedUser.badges = [...updatedUser.badges, ...newBadges];
    newBadges.forEach(b => {
      actions.push(`BADGE:${b.title}`);
    });
  }

  return { updatedUser, actions };
}

function difficulty_epic_check(xp: number): boolean {
  return xp >= 150; // Epic gives 150 xp
}

export function updateUserStreak(user: UserProfile): { updatedUser: UserProfile; actions: string[] } {
  const updatedUser = JSON.parse(JSON.stringify(user)) as UserProfile;
  const actions: string[] = [];
  
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Get yesterday's date in UTC
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  const yesterdayStr = d.toISOString().split('T')[0];

  const lastActive = updatedUser.lastActiveDate || '';

  if (lastActive === todayStr) {
    // Already active today; streak remains unchanged
  } else if (lastActive === yesterdayStr) {
    // Consecutive day
    updatedUser.streak = (updatedUser.streak || 0) + 1;
    updatedUser.lastActiveDate = todayStr;
    actions.push(`STREAKUP:${updatedUser.streak}`);
  } else {
    // Missed a day (or first time user activity)
    updatedUser.streak = 1;
    updatedUser.lastActiveDate = todayStr;
    actions.push(`STREAKRESET:1`);
  }

  return { updatedUser, actions };
}

async function performDailyTaskCleanup(userId: string): Promise<void> {
  if (!userId) return;
  const todayStr = new Date().toISOString().split('T')[0];

  if (isFirebaseEnabled) {
    try {
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(tasksQuery);

      const batch = writeBatch(db);
      let hasDeletes = false;

      snapshot.forEach((doc) => {
        const taskData = doc.data() as RPGTask;
        if (taskData.completed && taskData.completedAt) {
          const completedDateStr = taskData.completedAt.split('T')[0];
          if (completedDateStr < todayStr) {
            batch.delete(doc.ref);
            hasDeletes = true;
          }
        }
      });

      if (hasDeletes) {
        await batch.commit();
      }
    } catch (err) {
      console.warn('[Cleanup Warning] Failed to clean up completed tasks daily:', err);
    }
  } else {
    // Offline local task cleanup
    const all: RPGTask[] = JSON.parse(localStorage.getItem('anavare_tasks') || '[]');
    const filtered = all.filter((task) => {
      if (task.userId !== userId) return true;
      if (!task.completed || !task.completedAt) return true;
      
      const completedDateStr = task.completedAt.split('T')[0];
      return completedDateStr >= todayStr;
    });
    
    localStorage.setItem('anavare_tasks', JSON.stringify(filtered));
    localRPG.notify(`tasks:${userId}`);
  }
}

async function syncToLeaderboard(userId: string, profile: UserProfile): Promise<void> {
  if (!isFirebaseEnabled) return;
  try {
    const lbRef = doc(db, 'leaderboard', userId);
    await setDoc(lbRef, {
      userId: profile.id,
      username: profile.username,
      xp: profile.totalXp,
      level: profile.level,
      avatar: profile.avatar || 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=150&q=80',
      streak: profile.streak || 0,
      badgesCount: profile.badges?.length || 0
    });
  } catch (err) {
    console.warn('[Leaderboard Warning] Failed to sync to leaderboard:', err);
  }
}

async function syncLeaderboardFields(userId: string, fields: Partial<UserProfile>): Promise<void> {
  if (!isFirebaseEnabled) return;
  try {
    const lbRef = doc(db, 'leaderboard', userId);
    const updatePayload: any = { userId };
    if (fields.username !== undefined) updatePayload.username = fields.username;
    if (fields.totalXp !== undefined) updatePayload.xp = fields.totalXp;
    if (fields.level !== undefined) updatePayload.level = fields.level;
    if (fields.avatar !== undefined) updatePayload.avatar = fields.avatar;
    if (fields.streak !== undefined) updatePayload.streak = fields.streak;
    if (fields.badges !== undefined) updatePayload.badgesCount = fields.badges.length;
    
    await setDoc(lbRef, updatePayload, { merge: true });
  } catch (err) {
    console.warn('[Leaderboard Warning] Failed to update leaderboard fields:', err);
  }
}

/**
 * Cloudinary Universal Upload Helper
 * Conforms to:
 * - Cloud name: duhjznmfp
 * - Unsigned upload preset: rpg_upload
 * - Endpoint: https://api.cloudinary.com/v1_1/duhjznmfp/ or https://api.cloudinary.com/v1_1/rpgapp123/
 */
export async function uploadFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const mime = file.type.toLowerCase();

  const isJpg = mime === 'image/jpeg' || ext === 'jpg' || ext === 'jpeg';
  const isPng = mime === 'image/png' || ext === 'png';
  const isWebp = mime === 'image/webp' || ext === 'webp';
  const isImageValidated = isJpg || isPng || isWebp;

  const isMp4 = mime === 'video/mp4' || ext === 'mp4';
  const isMov = mime === 'video/quicktime' || mime === 'video/x-quicktime' || mime === 'video/mov' || ext === 'mov';
  const isVideoValidated = isMp4 || isMov;

  if (!isImageValidated && !isVideoValidated) {
    throw new Error('Unsupported file format. Images must be: jpg, jpeg, png, webp. Videos must be: mp4, mov.');
  }

  if (isImageValidated) {
    const maxImageSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxImageSize) {
      throw new Error('The selected image is too large. Maximum size for image uploads is 10 MB.');
    }
  }

  if (isVideoValidated) {
    const maxVideoSize = 100 * 1024 * 1024; // 100 MB
    if (file.size > maxVideoSize) {
      throw new Error('The selected video is too large. Maximum size for video uploads is 100 MB.');
    }
  }

  const resourceType = isImageValidated ? 'image' : 'video';
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'duhjznmfp';
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'rpg_upload';

  // Build both endpoint templates to guarantee matching whatever config preset rules are active.
  const uploadEndpoints = [
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`
  ];

  let lastError: any = null;

  for (const url of uploadEndpoints) {
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', uploadPreset);

      const res = await fetch(url, {
        method: 'POST',
        body: fd
      });

      if (res.ok) {
        const bodyObj = await res.json();
        if (bodyObj.secure_url) {
          console.log(`[Cloudinary] Succesful upload via URL: ${url}`);
          return bodyObj.secure_url;
        }
      } else {
        const errText = await res.text();
        console.warn(`[Cloudinary] Attempt failed at ${url}: ${errText}`);
        lastError = new Error(`Cloudinary responded with error: ${errText}`);
      }
    } catch (e: any) {
      console.warn(`[Cloudinary] Network failure on URL ${url}:`, e);
      lastError = e;
    }
  }

  throw lastError || new Error('All Cloudinary retry endpoints failed to absorb this payload.');
}

/**
 * STATE SERVICE FOR THE REACT VIEW COUPLING
 */
export const stateService = {
  // -----------------------------------------
  // MEDIA UPLOADS (Cloudinary Integration)
  // -----------------------------------------
  async uploadMedia(file: File, folder: string, userId: string): Promise<string> {
    if (!userId) {
      throw new Error('Only authenticated users can upload media.');
    }
    // Perform Cloudinary Upload bypassing Firebase Storage completely!
    return uploadFile(file);
  },

  // -----------------------------------------
  // USER PROFILES & LEADERBOARD
  // -----------------------------------------
  
  // Real-time user profile snapshot
  subscribeToUser(userId: string, callback: (user: UserProfile | null) => void): () => void {
    if (!userId) return () => {};
    
    if (isFirebaseEnabled) {
      const userRef = doc(db, 'users', userId);
      return onSnapshot(userRef, (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as UserProfile);
        } else {
          callback(null);
        }
      }, (err) => {
        console.warn(`[Firestore Warning] onSnapshot failed for path: users/${userId}:`, err);
        // Call callback with null to trigger fallback profile provisioning or offline state
        callback(null);
      });
    } else {
      return localRPG.subscribe(`user:${userId}`, callback);
    }
  },

  // Real-time all users for Social Ranking / Leaderboards
  subscribeAllUsers(callback: (users: UserProfile[]) => void): () => void {
    if (isFirebaseEnabled) {
      const q = query(collection(db, 'leaderboard'), orderBy('xp', 'desc'), limit(50));
      return onSnapshot(q, (snapshot) => {
        const usersList: UserProfile[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          usersList.push({
            id: data.userId || d.id,
            username: data.username || 'Warrior',
            email: '',
            avatar: data.avatar || 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=150&q=80',
            level: data.level || 1,
            xp: data.xp || 0,
            requiredXp: (data.level || 1) * 100,
            totalXp: data.xp || 0,
            streak: data.streak || 0,
            skills: {
              health: { level: 1, xp: 0 },
              fitness: { level: 1, xp: 0 },
              learning: { level: 1, xp: 0 },
              productivity: { level: 1, xp: 0 },
              finance: { level: 1, xp: 0 },
              mindset: { level: 1, xp: 0 },
            },
            badges: Array.from({ length: data.badgesCount || 0 }).map((_, i) => ({
              id: `badge_placeholder_${i}`,
              title: 'Achievement',
              description: 'Award details',
              icon: '★',
              unlockedAt: new Date().toISOString()
            })),
            createdAt: new Date().toISOString()
          } as UserProfile);
        });
        callback(usersList);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'leaderboard');
      });
    } else {
      return localRPG.subscribe('users_list:global', (users) => {
        const sorted = (users as UserProfile[]).sort((a,b) => b.totalXp - a.totalXp);
        callback(sorted);
      });
    }
  },

  async getStaticUserProfile(userId: string): Promise<UserProfile | null> {
    if (isFirebaseEnabled) {
      try {
        const d = await getDoc(doc(db, 'users', userId));
        return d.exists() ? (d.data() as UserProfile) : null;
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${userId}`);
      }
    } else {
      const all = JSON.parse(localStorage.getItem('anavare_users') || '{}');
      return all[userId] || null;
    }
  },

  async createUserProfile(user: Omit<UserProfile, 'badges' | 'skills' | 'level' | 'xp' | 'requiredXp' | 'totalXp' | 'streak' | 'createdAt'>): Promise<UserProfile> {
    const freshProfile: UserProfile = {
      ...user,
      level: 1,
      xp: 0,
      requiredXp: 100,
      totalXp: 0,
      streak: 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
      skills: {
        health: { level: 1, xp: 0 },
        fitness: { level: 1, xp: 0 },
        learning: { level: 1, xp: 0 },
        productivity: { level: 1, xp: 0 },
        finance: { level: 1, xp: 0 },
        mindset: { level: 1, xp: 0 },
      },
      badges: [],
      createdAt: new Date().toISOString()
    };

    if (isFirebaseEnabled) {
      try {
        console.log(`[stateService INFO] Writing user profile for UID: ${user.id} to Firestore...`);
        await setDoc(doc(db, 'users', user.id), freshProfile);
        await syncToLeaderboard(user.id, freshProfile);
        console.log(`[stateService SUCCESS] User profile written to Firestore for UID: ${user.id}`);
      } catch (err) {
        console.error(`[stateService FATAL] Profile creation failed for UID: ${user.id}. Err:`, err);
        handleFirestoreError(err, OperationType.CREATE, `users/${user.id}`);
      }
    } else {
      localRPG.writeUser(freshProfile);
    }

    return freshProfile;
  },

  // Update profile variables (like Changing Avatars, Username, lastActiveDate etc.)
  async updateUserProfileFields(userId: string, fields: Partial<UserProfile>): Promise<void> {
    if (isFirebaseEnabled) {
      try {
        await updateDoc(doc(db, 'users', userId), fields);
        await syncLeaderboardFields(userId, fields);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
      }
    } else {
      const key = `user:${userId}`;
      const users = JSON.parse(localStorage.getItem('anavare_users') || '{}');
      if (users[userId]) {
        users[userId] = { ...users[userId], ...fields };
        localStorage.setItem('anavare_users', JSON.stringify(users));
        localRPG.writeUser(users[userId]);
      }
    }
  },

  // -----------------------------------------
  // TASKS MODULE
  // -----------------------------------------
  subscribeToTasks(userId: string, callback: (tasks: RPGTask[]) => void): () => void {
    if (!userId) return () => {};

    // Run safe client sync task cleanup daily in background
    performDailyTaskCleanup(userId).catch(console.error);

    if (isFirebaseEnabled) {
      const q = query(collection(db, 'tasks'), where('userId', '==', userId));
      return onSnapshot(q, (snapshot) => {
        const list: RPGTask[] = [];
        snapshot.forEach(doc => {
          list.push(doc.data() as RPGTask);
        });
        // Sort by creation or completed state
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        callback(list);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'tasks');
      });
    } else {
      return localRPG.subscribe(`tasks:${userId}`, callback);
    }
  },

  async addTask(userId: string, title: string, category: TaskCategory, difficulty: TaskDifficulty, recurring: 'none' | 'daily' | 'weekly' = 'none', dueDate?: string): Promise<void> {
    const taskId = 'task_' + Math.random().toString(36).substring(2, 11);
    const newTask: RPGTask = {
      id: taskId,
      userId,
      title: title.trim(),
      category,
      difficulty,
      completed: false,
      completedAt: null,
      recurring,
      dueDate: dueDate || null,
      createdAt: new Date().toISOString(),
    };

    if (isFirebaseEnabled) {
      try {
        await withTimeout(setDoc(doc(db, 'tasks', taskId), newTask));
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `tasks/${taskId}`);
      }
    } else {
      const all: RPGTask[] = JSON.parse(localStorage.getItem('anavare_tasks') || '[]');
      all.push(newTask);
      localRPG.writeTasks(userId, all);
      localRPG.writeUser(JSON.parse(localStorage.getItem('anavare_users') || '{}')[userId]); // enforce update alerts
    }
  },

  async completeTask(userId: string, taskId: string): Promise<void> {
    // 1. Fetch the task details
    let task: RPGTask | null = null;
    if (isFirebaseEnabled) {
      try {
        const d = await withTimeout(getDoc(doc(db, 'tasks', taskId)));
        if (d.exists()) task = d.data() as RPGTask;
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `tasks/${taskId}`);
      }
    } else {
      const all: RPGTask[] = JSON.parse(localStorage.getItem('anavare_tasks') || '[]');
      task = all.find(t => t.id === taskId) || null;
    }

    if (!task || task.completed) return;

    // 2. Complete task
    const completedAt = new Date().toISOString();
    const xpPayout = getXpReward(task.difficulty);

    if (isFirebaseEnabled) {
      try {
        // Run atomic updates through transaction
        await runTransaction(db, async (transaction) => {
          const taskRef = doc(db, 'tasks', taskId);
          const taskDoc = await transaction.get(taskRef);
          if (!taskDoc.exists()) {
            throw new Error('Task does not exist');
          }
          const freshTask = taskDoc.data() as RPGTask;
          if (freshTask.completed) return null; // already completed

          // Fetch User BEFORE doing any writes
          const userRef = doc(db, 'users', userId);
          const userDoc = await transaction.get(userRef);

          // Now we can define writes since all reads are complete
          transaction.update(taskRef, {
            completed: true,
            completedAt
          });

          if (userDoc.exists()) {
            const uProfile = userDoc.data() as UserProfile;
            
            // a. Update daily streak
            const { updatedUser: streakUpdatedUser, actions: streakActions } = updateUserStreak(uProfile);
            
            // b. Add XP with isTaskCompletion = true
            const { updatedUser: finalUser, actions: xpActions } = addXpToUserProfile(
              streakUpdatedUser, 
              xpPayout, 
              freshTask.category, 
              true
            );
            
            const allActions = [...streakActions, ...xpActions];

            transaction.set(userRef, finalUser);
            return { finalUser, allActions };
          }
          return null;
        }).then(async (result) => {
          if (result) {
            const { finalUser, allActions } = result;
            await syncToLeaderboard(userId, finalUser);
            // Trigger notifications for level up / badges
            for (const act of allActions) {
              await this.createNotificationFromAction(userId, act);
            }
          }
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `tasks/${taskId}`);
      }
    } else {
      // Offline local mutation
      const all: RPGTask[] = JSON.parse(localStorage.getItem('anavare_tasks') || '[]');
      const taskIndex = all.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        all[taskIndex].completed = true;
        all[taskIndex].completedAt = completedAt;
        localRPG.writeTasks(userId, all);
      }

      const users = JSON.parse(localStorage.getItem('anavare_users') || '{}');
      if (users[userId]) {
        const uProfile = users[userId];
        
        // 1. Update daily streak
        const { updatedUser: streakUpdatedUser, actions: streakActions } = updateUserStreak(uProfile);
        
        // 2. Add XP with isTaskCompletion = true
        const { updatedUser: finalUpdatedUser, actions: xpActions } = addXpToUserProfile(
          streakUpdatedUser, 
          xpPayout, 
          task.category, 
          true
        );
        
        const allActions = [...streakActions, ...xpActions];

        localRPG.writeUser(finalUpdatedUser);

        // Notify local subscribers
        for (const act of allActions) {
          this.createLocalNotificationFromAction(userId, act);
        }
      }
    }
  },

  async deleteTask(userId: string, taskId: string): Promise<void> {
    if (isFirebaseEnabled) {
      try {
        await deleteDoc(doc(db, 'tasks', taskId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `tasks/${taskId}`);
      }
    } else {
      const all: RPGTask[] = JSON.parse(localStorage.getItem('anavare_tasks') || '[]');
      const filtered = all.filter(t => t.id !== taskId);
      localRPG.writeTasks(userId, filtered);
      localRPG.writeUser(JSON.parse(localStorage.getItem('anavare_users') || '{}')[userId]);
    }
  },

  async deleteSocialPost(postId: string, userId: string): Promise<void> {
    if (isFirebaseEnabled) {
      try {
        const postRef = doc(db, 'posts', postId);
        const postDoc = await getDoc(postRef);
        if (postDoc.exists()) {
          const postData = postDoc.data() as RPGPost;
          const authorId = postData.authorId || postData.userId;
          if (authorId !== userId) {
            throw new Error('Unauthorized: You are not the author of this post.');
          }
          await deleteDoc(postRef);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `posts/${postId}`);
      }
    } else {
      const list: RPGPost[] = JSON.parse(localStorage.getItem('anavare_posts') || '[]');
      const filtered = list.filter(p => p.id !== postId);
      localRPG.writePosts(filtered);
    }
  },

  async deleteCourse(courseId: string, userId: string): Promise<void> {
    if (isFirebaseEnabled) {
      try {
        const courseRef = doc(db, 'courses', courseId);
        const courseDoc = await getDoc(courseRef);
        if (courseDoc.exists()) {
          const courseData = courseDoc.data() as Course;
          if (courseData.creatorId !== userId) {
            throw new Error('Unauthorized: You are not the creator of this course.');
          }
          await deleteDoc(courseRef);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `courses/${courseId}`);
      }
    } else {
      const courses: Course[] = JSON.parse(localStorage.getItem('anavare_custom_courses') || '[]');
      const filtered = courses.filter(c => c.id !== courseId);
      localStorage.setItem('anavare_custom_courses', JSON.stringify(filtered));
      localRPG.notify('courses:custom');
    }
  },

  async deleteAccount(userId: string, reason?: string): Promise<void> {
    console.log(`[Account Deletion] Initiating deletion sequence for User ${userId}. Reason provided: ${reason || 'None'}`);

    if (isFirebaseEnabled) {
      try {
        const batch = writeBatch(db);

        // 1. Log the deletion reason under the 'deletion_reasons' collection
        if (reason && reason.trim()) {
          const reasonId = 'reason_' + Math.random().toString(36).substring(2, 11);
          const reasonRef = doc(db, 'deletion_reasons', reasonId);
          batch.set(reasonRef, {
            id: reasonId,
            userId,
            reason: reason.trim(),
            timestamp: new Date().toISOString()
          });
        }

        // 2. Query and delete all posts created by the user
        const postsQ = query(collection(db, 'posts'), where('userId', '==', userId));
        const postsSnapshot = await getDocs(postsQ);
        postsSnapshot.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });

        // 3. Query and delete all courses created/owned by the user
        const coursesQ = query(collection(db, 'courses'), where('creatorId', '==', userId));
        const coursesSnapshot = await getDocs(coursesQ);
        coursesSnapshot.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });

        // 4. Query and delete all userLessons completed trackers
        const userLessonsQ = query(collection(db, 'userLessons'), where('userId', '==', userId));
        const userLessonsSnapshot = await getDocs(userLessonsQ);
        userLessonsSnapshot.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });

        // 5. Query and delete all tasks linked to this user
        const tasksQ = query(collection(db, 'tasks'), where('userId', '==', userId));
        const tasksSnapshot = await getDocs(tasksQ);
        tasksSnapshot.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });

        // 6. Query and delete all notifications linked to this user
        const notificationsQ = query(collection(db, 'notifications'), where('userId', '==', userId));
        const notificationsSnapshot = await getDocs(notificationsQ);
        notificationsSnapshot.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });

        // 7. Delete leaderboard entry
        const leaderboardRef = doc(db, 'leaderboard', userId);
        const lDoc = await getDoc(leaderboardRef);
        if (lDoc.exists()) {
          batch.delete(leaderboardRef);
        }

        // 8. Delete user profile document
        const userRef = doc(db, 'users', userId);
        batch.delete(userRef);

        // Commit all deletions
        await batch.commit();

        // 9. Fully delete authentication user account from Firebase
        const currentUser = auth?.currentUser;
        if (currentUser && currentUser.uid === userId) {
          try {
            await currentUser.delete();
          } catch (authErr) {
            console.warn('[Account Deletion] Auth credential deletion requires fresh login or is not direct:', authErr);
            // If it fails (e.g. requires re-authentication or is disabled), we still sign out
            await auth?.signOut();
          }
        } else {
          await auth?.signOut();
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${userId}/account`);
      }
    } else {
      // Offline local storage cleanup
      const users = JSON.parse(localStorage.getItem('anavare_users') || '{}');
      if (users[userId]) {
        delete users[userId];
        localStorage.setItem('anavare_users', JSON.stringify(users));
      }

      // Remove posts
      const posts: RPGPost[] = JSON.parse(localStorage.getItem('anavare_posts') || '[]');
      const filteredPosts = posts.filter(p => p.userId !== userId && p.authorId !== userId);
      localStorage.setItem('anavare_posts', JSON.stringify(filteredPosts));

      // Remove custom courses
      const courses: Course[] = JSON.parse(localStorage.getItem('anavare_custom_courses') || '[]');
      const filteredCourses = courses.filter(c => c.creatorId !== userId);
      localStorage.setItem('anavare_custom_courses', JSON.stringify(filteredCourses));

      // Remove private tasks
      const tasks: RPGTask[] = JSON.parse(localStorage.getItem('anavare_tasks') || '[]');
      const filteredTasks = tasks.filter(t => t.userId !== userId);
      localStorage.setItem('anavare_tasks', JSON.stringify(filteredTasks));

      // Remove notifications
      const notifications: RPGNotification[] = JSON.parse(localStorage.getItem('anavare_notifications') || '[]');
      const filteredNotifications = notifications.filter(n => n.userId !== userId);
      localStorage.setItem('anavare_notifications', JSON.stringify(filteredNotifications));

      // Delete active user tracking
      localStorage.removeItem('anavare_current_user_id');

      // Trigger change
      localRPG.notify('users:change');
      localRPG.notify('posts:feed');
      localRPG.notify('courses:custom');
    }
  },

  // -----------------------------------------
  // SOCIAL FEED MODULE
  // -----------------------------------------
  subscribeToPosts(callback: (posts: RPGPost[]) => void): () => void {
    if (isFirebaseEnabled) {
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
      return onSnapshot(q, (snapshot) => {
        const posts: RPGPost[] = [];
        snapshot.forEach(doc => {
          posts.push(doc.data() as RPGPost);
        });
        callback(posts);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'posts');
      });
    } else {
      return localRPG.subscribe('posts:feed', callback);
    }
  },

  async createSocialPost(userId: string, authorName: string, authorAvatar: string, content: string, imageUrl?: string | null): Promise<void> {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      throw new Error('Validation Error: Content cannot be empty.');
    }

    if (containsBadWord(trimmedContent)) {
      throw new Error('This content is not allowed.');
    }

    const postId = 'post_' + Math.random().toString(36).substring(2, 11);
    
    let finalUserId = userId;
    let finalAuthorId = userId;

    if (isFirebaseEnabled) {
      const currentUser = await waitForAuthUser();
      if (!currentUser) {
        throw new Error('Authentication state unresolved or missing.');
      }
      finalUserId = currentUser.uid;
      finalAuthorId = currentUser.uid;
    }

    const newPost: RPGPost = {
      id: postId,
      userId: finalUserId,
      authorId: finalAuthorId,
      authorName,
      authorAvatar,
      content: trimmedContent,
      imageUrl: imageUrl || null,
      likes: [],
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
    };

    if (isFirebaseEnabled) {
      try {
        await setDoc(doc(db, 'posts', postId), newPost);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `posts/${postId}`);
      }
    } else {
      const list: RPGPost[] = JSON.parse(localStorage.getItem('anavare_posts') || '[]');
      list.unshift(newPost);
      localRPG.writePosts(list);

      // Award 20 XP for post creation to incentivize social progress sharing!
      const users = JSON.parse(localStorage.getItem('anavare_users') || '{}');
      if (users[userId]) {
        const { updatedUser, actions } = addXpToUserProfile(users[userId], 20, 'mindset');
        localRPG.writeUser(updatedUser);
        for (const act of actions) {
          this.createLocalNotificationFromAction(userId, act);
        }
      }
    }
  },

  async updateSocialPost(postId: string, userId: string, fields: { content?: string, imageUrl?: string | null }): Promise<void> {
    if (!userId) {
      throw new Error('Authentication required.');
    }
    if (fields.content !== undefined && containsBadWord(fields.content)) {
      throw new Error('This content is not allowed.');
    }
    if (isFirebaseEnabled) {
      try {
        const postRef = doc(db, 'posts', postId);
        const d = await getDoc(postRef);
        if (!d.exists()) {
          throw new Error('Selected post does not exist in records.');
        }
        const post = d.data() as RPGPost;
        if (post.userId !== userId) {
          throw new Error('Security Violation: You are not authorized to modify other profiles\' data contents.');
        }
        await updateDoc(postRef, {
          ...(fields.content !== undefined ? { content: fields.content.trim() } : {}),
          ...(fields.imageUrl !== undefined ? { imageUrl: fields.imageUrl || null } : {})
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `posts/${postId}`);
      }
    } else {
      const list: RPGPost[] = JSON.parse(localStorage.getItem('anavare_posts') || '[]');
      const postIndex = list.findIndex(p => p.id === postId);
      if (postIndex !== -1) {
        const post = list[postIndex];
        if (post.userId !== userId) {
          throw new Error('Security Violation: You are not authorized to modify other profiles\' data contents.');
        }
        if (fields.content !== undefined) post.content = fields.content.trim();
        if (fields.imageUrl !== undefined) post.imageUrl = fields.imageUrl || null;
        localRPG.writePosts(list);
      }
    }
  },

  async toggleLikePost(postId: string, userId: string): Promise<void> {
    if (isFirebaseEnabled) {
      try {
        const postRef = doc(db, 'posts', postId);
        const d = await getDoc(postRef);
        if (d.exists()) {
          const post = d.data() as RPGPost;
          const alreadyLiked = post.likes.includes(userId);
          const newLikes = alreadyLiked 
            ? post.likes.filter(id => id !== userId)
            : [...post.likes, userId];
          
          await updateDoc(postRef, {
            likes: newLikes,
            likesCount: newLikes.length
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `posts/${postId}`);
      }
    } else {
      const list: RPGPost[] = JSON.parse(localStorage.getItem('anavare_posts') || '[]');
      const postIndex = list.findIndex(p => p.id === postId);
      if (postIndex !== -1) {
        const post = list[postIndex];
        const index = post.likes.indexOf(userId);
        if (index === -1) {
          post.likes.push(userId);
          // Let's issue a notification to post author if not self
          if (post.userId !== userId) {
            this.createLocalNotification(post.userId, '💖 Post Liked!', `${userId} liked your progress post.`, 'social');
          }
        } else {
          post.likes.splice(index, 1);
        }
        post.likesCount = post.likes.length;
        localRPG.writePosts(list);
      }
    }
  },

  // -----------------------------------------
  // SOCIAL NESTED COMMENTS MODULE
  // -----------------------------------------
  subscribeToComments(postId: string, callback: (comments: RPGComment[]) => void): () => void {
    if (isFirebaseEnabled) {
      const q = query(
        collection(db, 'posts', postId, 'comments'), 
        orderBy('createdAt', 'asc')
      );
      return onSnapshot(q, (snapshot) => {
        const comments: RPGComment[] = [];
        snapshot.forEach(doc => {
          comments.push(doc.data() as RPGComment);
        });
        callback(comments);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, `posts/${postId}/comments`);
      });
    } else {
      return localRPG.subscribe(`comments:${postId}`, callback);
    }
  },

  async addComment(
    postId: string, 
    userId: string, 
    authorName: string, 
    authorAvatar: string, 
    content: string, 
    parentCommentId: string | null = null
  ): Promise<void> {
    if (containsBadWord(content)) {
      throw new Error('This content is not allowed.');
    }
    const commentId = 'comment_' + Math.random().toString(36).substring(2, 11);
    const newComment: RPGComment = {
      id: commentId,
      postId,
      userId,
      authorName,
      authorAvatar,
      content: content.trim(),
      parentCommentId,
      createdAt: new Date().toISOString(),
    };

    if (isFirebaseEnabled) {
      try {
        // Create in subcollection
        await setDoc(doc(db, 'posts', postId, 'comments', commentId), newComment);
        // Increment comment count on master post
        await updateDoc(doc(db, 'posts', postId), {
          commentsCount: increment(1)
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `posts/${postId}/comments/${commentId}`);
      }
    } else {
      const allComments = JSON.parse(localStorage.getItem('anavare_comments') || '{}');
      if (!allComments[postId]) allComments[postId] = [];
      allComments[postId].push(newComment);
      localRPG.writeComments(postId, allComments[postId]);

      // update comment count on post
      const list: RPGPost[] = JSON.parse(localStorage.getItem('anavare_posts') || '[]');
      const postIndex = list.findIndex(p => p.id === postId);
      if (postIndex !== -1) {
        list[postIndex].commentsCount += 1;
        localRPG.writePosts(list);

        // Notify author of comment
        const post = list[postIndex];
        if (post.userId !== userId) {
          this.createLocalNotification(post.userId, '💬 New Comment!', `${authorName} commented on your post: "${content.substring(0,30)}..."`, 'social');
        }
      }
    }
  },

  // -----------------------------------------
  // COURSES & LESSON COMPLETIONS
  // -----------------------------------------
  subscribeToUserLessons(userId: string, callback: (lessons: UserLesson[]) => void): () => void {
    if (!userId) return () => {};

    if (isFirebaseEnabled) {
      const q = query(collection(db, 'userLessons'), where('userId', '==', userId));
      return onSnapshot(q, (snapshot) => {
        const list: UserLesson[] = [];
        snapshot.forEach(doc => {
          list.push(doc.data() as UserLesson);
        });
        callback(list);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'userLessons');
      });
    } else {
      return localRPG.subscribe(`lessons:${userId}`, callback);
    }
  },

  async completeLesson(userId: string, courseId: string, lessonId: string, lXP: number, proofUrl?: string, proofType?: 'image' | 'video'): Promise<void> {
    const docId = `${userId}_${courseId}_${lessonId}`;
    const newLessonComplete: UserLesson = {
      id: docId,
      userId,
      courseId,
      lessonId,
      completed: true,
      completedAt: new Date().toISOString(),
      ...(proofUrl ? { proofUrl, proofType } : {})
    };

    if (isFirebaseEnabled) {
      try {
        await setDoc(doc(db, 'userLessons', docId), newLessonComplete);

        // Fetch User profile to credit XP
        const uDoc = await getDoc(doc(db, 'users', userId));
        if (uDoc.exists()) {
          const uProfile = uDoc.data() as UserProfile;
          const { updatedUser, actions } = addXpToUserProfile(uProfile, lXP, 'learning');
          await setDoc(doc(db, 'users', userId), updatedUser);
          await syncToLeaderboard(userId, updatedUser);
          
          for (const act of actions) {
            await this.createNotificationFromAction(userId, act);
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `userLessons/${docId}`);
      }
    } else {
      const lessons: UserLesson[] = JSON.parse(localStorage.getItem('anavare_lessons') || '[]');
      if (!lessons.some(l => l.id === docId)) {
        lessons.push(newLessonComplete);
        localRPG.writeLessons(userId, lessons);

        // Update User Profile
        const users = JSON.parse(localStorage.getItem('anavare_users') || '{}');
        if (users[userId]) {
          const uProfile = users[userId];
          const { updatedUser, actions } = addXpToUserProfile(uProfile, lXP, 'learning');
          localRPG.writeUser(updatedUser);
          for (const act of actions) {
            this.createLocalNotificationFromAction(userId, act);
          }
        }
      }
    }
  },

  // -----------------------------------------
  // COURSES SUBSCRIPTION & CREATION
  // -----------------------------------------
  subscribeToCourses(userId: string, callback: (courses: Course[]) => void): () => void {
    if (!userId) return () => {};

    if (isFirebaseEnabled) {
      const q = query(collection(db, 'courses'));
      return onSnapshot(q, (snapshot) => {
        const customList: Course[] = [];
        snapshot.forEach(doc => {
          customList.push(doc.data() as Course);
        });
        callback([...SAMPLE_COURSES, ...customList]);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'courses');
      });
    } else {
      const getMerged = () => {
        const custom: Course[] = JSON.parse(localStorage.getItem('anavare_custom_courses') || '[]');
        return [...SAMPLE_COURSES, ...custom];
      };

      return localRPG.subscribe('courses:custom', () => {
        callback(getMerged());
      });
    }
  },

  async createCourse(
    userId: string, 
    title: string, 
    description: string, 
    category: TaskCategory, 
    xpReward: number, 
    image: string, 
    lessons: Lesson[]
  ): Promise<Course> {
    // Permission Verification: Check level 60+ (Veteran rank)
    let userProfile: UserProfile | null = null;
    if (isFirebaseEnabled) {
      try {
        const uDoc = await getDoc(doc(db, 'users', userId));
        if (uDoc.exists()) {
          userProfile = uDoc.data() as UserProfile;
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${userId}`);
      }
    } else {
      const users = JSON.parse(localStorage.getItem('anavare_users') || '{}');
      userProfile = users[userId] || null;
    }

    if (!userProfile) {
      throw new Error('User profile not found.');
    }

    if (userProfile.level < 10) {
      throw new Error('Unauthorized: Course creation is locked. You must reach Level 10 to unlock this capability.');
    }

    const courseId = 'course_custom_' + Math.random().toString(36).substring(2, 11);
    const newCourse: Course = {
      id: courseId,
      title: title.trim(),
      description: description.trim(),
      category,
      xpReward,
      image: image.trim() || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80',
      coverImageUrl: image.trim() || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80',
      lessons: lessons.map((l, idx) => {
        const mappedLesson: Lesson = {
          id: l.id || `l_${idx}_${Math.random().toString(36).substring(2, 5)}`,
          title: l.title.trim(),
          description: l.description.trim(),
          duration: l.duration || '10 min',
          xpReward: l.xpReward || 50,
          contentMarkdown: l.contentMarkdown || '### New Lesson\n\nLesson objectives and real-life quest details.'
        };
        if (l.videoUrl) {
          mappedLesson.videoUrl = l.videoUrl.trim();
        }
        if (l.imageUrl) {
          mappedLesson.imageUrl = l.imageUrl.trim();
        }
        return mappedLesson;
      }),
      creatorId: userId
    };

    if (isFirebaseEnabled) {
      try {
        await setDoc(doc(db, 'courses', courseId), newCourse);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `courses/${courseId}`);
      }
    } else {
      const courses: Course[] = JSON.parse(localStorage.getItem('anavare_custom_courses') || '[]');
      courses.push(newCourse);
      localStorage.setItem('anavare_custom_courses', JSON.stringify(courses));
      localRPG.notify('courses:custom');
    }

    return newCourse;
  },

  // -----------------------------------------
  // NOTIFICATIONS SYSTEM
  // -----------------------------------------
  subscribeToNotifications(userId: string, callback: (notifications: RPGNotification[]) => void): () => void {
    if (!userId) return () => {};

    if (isFirebaseEnabled) {
      const q = query(collection(db, 'notifications'), where('userId', '==', userId));
      return onSnapshot(q, (snapshot) => {
        const notifs: RPGNotification[] = [];
        snapshot.forEach(doc => {
          notifs.push(doc.data() as RPGNotification);
        });
        notifs.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
        callback(notifs);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'notifications');
      });
    } else {
      return localRPG.subscribe(`notifications:${userId}`, callback);
    }
  },

  async markNotificationRead(notificationId: string): Promise<void> {
    if (isFirebaseEnabled) {
      try {
        await updateDoc(doc(db, 'notifications', notificationId), { read: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `notifications/${notificationId}`);
      }
    } else {
      const all: RPGNotification[] = JSON.parse(localStorage.getItem('anavare_notifications') || '[]');
      const notifIdx = all.findIndex(n => n.id === notificationId);
      if (notifIdx !== -1) {
        all[notifIdx].read = true;
        const userId = all[notifIdx].userId;
        localRPG.writeNotifications(userId, all);
        localRPG.writeUser(JSON.parse(localStorage.getItem('anavare_users') || '{}')[userId]); // trigger user updates
      }
    }
  },

  async clearAllNotifications(userId: string): Promise<void> {
    if (isFirebaseEnabled) {
      try {
        const q = query(collection(db, 'notifications'), where('userId', '==', userId));
        const d = await getDocs(q);
        const batch = writeBatch(db);
        d.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `notifications/clear/${userId}`);
      }
    } else {
      const all: RPGNotification[] = JSON.parse(localStorage.getItem('anavare_notifications') || '[]');
      const filtered = all.filter(n => n.userId !== userId);
      localRPG.writeNotifications(userId, filtered);
      localRPG.writeUser(JSON.parse(localStorage.getItem('anavare_users') || '{}')[userId]);
    }
  },

  // Notification generation internal helpers
  async createNotificationFromAction(userId: string, actionString: string) {
    let title = '';
    let message = '';
    let type: 'system' | 'level_up' | 'streak' | 'badge' | 'social' = 'system';

    if (actionString.startsWith('LEVELUP:')) {
      title = '🚀 RPG Level Up! ';
      message = `Excellent progression! You leveled up to character Level ${actionString.split(':')[1]}!`;
      type = 'level_up';
    } else if (actionString.startsWith('SKILLUP:')) {
      const parts = actionString.split(':');
      title = `🧬 Skill Leveled: ${parts[1].toUpperCase()}`;
      message = `Your real-life ${parts[1]} path expanded to level ${parts[2]}!`;
      type = 'system';
    } else if (actionString.startsWith('BADGE:')) {
      title = '🏆 Achievement Unlocked!';
      message = `You unlocked the golden RPG badge: "${actionString.split(':')[1]}". Check out your profile wall!`;
      type = 'badge';
    } else if (actionString.startsWith('STREAKUP:')) {
      const parts = actionString.split(':');
      title = '🔥 Streak Maintained!';
      message = `Your self-improvement streak is now ${parts[1]} days. Keep it up!`;
      type = 'streak';
    } else if (actionString.startsWith('STREAKRESET:')) {
      title = '⚡ Streak Reset';
      message = `Your streak has reset back to 1. Start a new consecutive streak check today!`;
      type = 'streak';
    }

    if (title && message) {
      const notifId = 'notif_' + Math.random().toString(36).substring(2, 11);
      const notif: RPGNotification = {
        id: notifId,
        userId,
        title,
        message,
        type,
        read: false,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'notifications', notifId), notif);
    }
  },

  createLocalNotificationFromAction(userId: string, actionString: string) {
    let title = '';
    let message = '';
    let type: 'system' | 'level_up' | 'streak' | 'badge' | 'social' = 'system';

    if (actionString.startsWith('LEVELUP:')) {
      title = '🚀 RPG Level Up! ';
      message = `Excellent progression! You leveled up to character Level ${actionString.split(':')[1]}!`;
      type = 'level_up';
    } else if (actionString.startsWith('SKILLUP:')) {
      const parts = actionString.split(':');
      title = `🧬 Skill Leveled: ${parts[1].toUpperCase()}`;
      message = `Your real-life ${parts[1]} path expanded to level ${parts[2]}!`;
      type = 'system';
    } else if (actionString.startsWith('BADGE:')) {
      title = '🏆 Achievement Unlocked!';
      message = `You unlocked the golden RPG badge: "${actionString.split(':')[1]}". Check out your profile wall!`;
      type = 'badge';
    } else if (actionString.startsWith('STREAKUP:')) {
      const parts = actionString.split(':');
      title = '🔥 Streak Maintained!';
      message = `Your self-improvement streak is now ${parts[1]} days. Keep it up!`;
      type = 'streak';
    } else if (actionString.startsWith('STREAKRESET:')) {
      title = '⚡ Streak Reset';
      message = `Your streak has reset back to 1. Start a new consecutive streak check today!`;
      type = 'streak';
    }

    if (title && message) {
      this.createLocalNotification(userId, title, message, type);
    }
  },

  createLocalNotification(
    userId: string, 
    title: string, 
    message: string, 
    type: 'system' | 'level_up' | 'streak' | 'badge' | 'social' = 'system'
  ) {
    const all: RPGNotification[] = JSON.parse(localStorage.getItem('anavare_notifications') || '[]');
    const newN: RPGNotification = {
      id: 'notif_' + Math.random().toString(36).substring(2, 11),
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString()
    };
    all.unshift(newN);
    localRPG.writeNotifications(userId, all);
    const user = JSON.parse(localStorage.getItem('anavare_users') || '{}')[userId];
    if (user) {
      localRPG.writeUser(user); // force updates
    }
  }
};
