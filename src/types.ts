export type ScreenType =
  | 'login'
  | 'register'
  | 'home'
  | 'habits'
  | 'progress'
  | 'create-habit'
  | 'gamification';

export type HabitCategory = 'Saúde' | 'Produtividade' | 'Mindfulness' | 'Estudos' | 'Outros';

export type HabitFrequency = 'Todos os dias' | 'Dias úteis' | 'Personalizado' | 'Semanal';

export interface Habit {
  id: string;
  userId?: string;
  name: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  goalNumber: number;
  unit: string;
  completedToday: boolean;
  streakDays: number;
  iconType: 'water' | 'runner' | 'book' | 'moon' | 'heart' | 'target' | 'lotus' | 'sparkles';
  // Detailed tracking
  waterGlasses?: boolean[]; // 8 glasses for water
  exerciseDays?: { day: string; fullDay: string; checked: boolean }[]; // Mon-Sun
  currentMinutes?: number;
  sleepHours?: number;
  sleepMinutes?: number;
}

export interface Challenge {
  id: string;
  title: string;
  desc: string;
  iconType: 'fire' | 'water' | 'book';
  current: number;
  total: number;
  completed: boolean;
}

export interface Reward {
  id: string;
  title: string;
  desc: string;
  iconType: 'shield' | 'lock' | 'coins';
  unlocked: boolean;
  /** true se o usuário já visualizou/resgatou (para evitar dupla concessão de moedas) */
  claimed?: boolean;
  current?: number;
  total?: number;
}

export interface UserStats {
  userId?: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  level: number;
  currentXp: number;
  maxXp: number;
  points: number;
  coins: number;
  streakDays: number;
  bestStreakDays: number;
  overallConsistency: number; // e.g. 82%
  weeklyTargetCount: number; // calculado dinamicamente
  weeklyCompletedCount: number;
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: 'streak' | 'challenge' | 'reminder';
}

export interface LeaderboardUser {
  rank: number;
  name: string;
  points: number;
  streakDays: number;
  isCurrentUser?: boolean;
  avatarSeed: string;
  avatarUrl?: string;
}
