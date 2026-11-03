import { Habit, Challenge, Reward, UserStats, AppNotification, LeaderboardUser } from '../types';

/**
 * Cria um objeto UserStats zerado e limpo para novos usuários.
 */
export const createEmptyUserStats = (
  name = 'Você',
  email?: string,
  avatarUrl?: string,
  userId?: string
): UserStats => ({
  userId,
  name,
  email,
  avatarUrl,
  level: 1,
  currentXp: 0,
  maxXp: 100,
  points: 0,
  coins: 0,
  streakDays: 0,
  bestStreakDays: 0,
  overallConsistency: 0,
  weeklyTargetCount: 0,
  weeklyCompletedCount: 0,
});

export const initialUserStats: UserStats = createEmptyUserStats();

// Lista de hábitos começa vazia para contas novas
export const initialHabits: Habit[] = [];

// Desafios zerados (nenhum pré-concluído)
export const initialChallenges: Challenge[] = [
  {
    id: 'chal-1',
    title: '7 dias consecutivos',
    desc: 'Complete 7 dias seguidos de hábitos.',
    iconType: 'fire',
    current: 0,
    total: 7,
    completed: false,
  },
  {
    id: 'chal-2',
    title: 'Beber água por 5 dias',
    desc: 'Beba água por 5 dias esta semana.',
    iconType: 'water',
    current: 0,
    total: 5,
    completed: false,
  },
  {
    id: 'chal-3',
    title: 'Estudar por 7 dias',
    desc: 'Estude por 7 dias esta semana.',
    iconType: 'book',
    current: 0,
    total: 7,
    completed: false,
  },
];

// Recompensas zeradas (nenhuma pré-desbloqueada)
export const initialRewards: Reward[] = [
  {
    id: 'rew-1',
    title: 'Insígnia "Constante"',
    desc: 'Complete 7 dias consecutivos.',
    iconType: 'shield',
    unlocked: false,
    current: 0,
    total: 7,
  },
  {
    id: 'rew-2',
    title: 'Insígnia "Focado"',
    desc: 'Complete 14 dias consecutivos.',
    iconType: 'lock',
    unlocked: false,
    current: 0,
    total: 14,
  },
  {
    id: 'rew-3',
    title: '250 moedas',
    desc: 'Complete 10 desafios.',
    iconType: 'coins',
    unlocked: false,
    current: 0,
    total: 10,
  },
];

// Sem notificações fictícias
export const initialNotifications: AppNotification[] = [];

/**
 * Cria o ranking inicial apenas com o usuário atual zerado
 */
export const createInitialLeaderboard = (
  userName = 'Você',
  avatarUrl?: string,
  points = 0,
  streakDays = 0
): LeaderboardUser[] => [
  {
    rank: 1,
    name: `${userName} (Você)`,
    points,
    streakDays,
    isCurrentUser: true,
    avatarSeed: 'user',
    avatarUrl,
  },
];

export const initialLeaderboard: LeaderboardUser[] = createInitialLeaderboard();
