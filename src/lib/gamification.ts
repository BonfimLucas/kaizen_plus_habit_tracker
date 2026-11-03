/**
 * gamification.ts
 *
 * Motor central de gamificação do Kaizen+.
 * Toda lógica de recompensas passa por este módulo.
 *
 * Regras fundamentais:
 *  - Concluir hábito: +50 pontos e +30 XP.
 *  - Desmarcar hábito: reverte (-50 pontos e -30 XP).
 *  - Marcar novamente: concede novamente a recompensa (+50 pts, +30 XP).
 *  - Cliques repetidos no mesmo estado: não duplicam nem alteram valores.
 *  - Criação/edição/exclusão de hábito: zero pontos e zero XP.
 */

import { UserStats, Challenge, Reward } from '../types';

// ─────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────
export const POINTS_PER_COMPLETION = 50;
export const XP_PER_COMPLETION = 30;
export const XP_PER_LEVEL = 100; // cada nível exige 100 XP

// ─────────────────────────────────────────────────────────────
// Tipos de histórico
// ─────────────────────────────────────────────────────────────
export interface DailyRecord {
  /** Chave composta: userId_habitId_YYYY-MM-DD */
  key: string;
  userId: string;
  habitId: string;
  /** Data local YYYY-MM-DD */
  date: string;
  /** Recompensa ativa para este hábito nesta data */
  rewardClaimed: boolean;
  /** Última atualização */
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Utilitários de data (sempre hora local)
// ─────────────────────────────────────────────────────────────

/** Retorna a data local atual como string YYYY-MM-DD */
export function getLocalDateString(d: Date = new Date()): string {
  return d.toLocaleDateString('en-CA'); // 'en-CA' produz YYYY-MM-DD
}

/** Retorna início (segunda) e fim (domingo) da semana que contém `d` */
export function getWeekRange(d: Date = new Date()): { start: string; end: string } {
  const day = d.getDay(); // 0=Dom, 1=Seg ... 6=Sáb
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return {
    start: getLocalDateString(monday),
    end: getLocalDateString(sunday),
  };
}

/** Compara duas strings YYYY-MM-DD */
function dateInRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

// ─────────────────────────────────────────────────────────────
// Armazenamento do histórico por usuário
// ─────────────────────────────────────────────────────────────
export function historyStorageKey(userId: string): string {
  return `kaizen_history_${userId}`;
}

export function loadHistory(userId: string): DailyRecord[] {
  try {
    const raw = localStorage.getItem(historyStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as DailyRecord[];
  } catch {
    return [];
  }
}

export function saveHistory(userId: string, records: DailyRecord[]): void {
  try {
    localStorage.setItem(historyStorageKey(userId), JSON.stringify(records));
  } catch (err) {
    console.error('[Kaizen] Erro ao persistir histórico:', err);
  }
}

/** Cria a chave composta do registro */
export function buildRecordKey(userId: string, habitId: string, date: string): string {
  return `${userId}_${habitId}_${date}`;
}

/** Obtém o registro de um hábito numa data, ou undefined */
export function findRecord(
  history: DailyRecord[],
  userId: string,
  habitId: string,
  date: string
): DailyRecord | undefined {
  const key = buildRecordKey(userId, habitId, date);
  return history.find((r) => r.key === key);
}

/** Insere ou substitui um registro no array (imutável) */
export function upsertRecord(history: DailyRecord[], record: DailyRecord): DailyRecord[] {
  const idx = history.findIndex((r) => r.key === record.key);
  if (idx === -1) return [...history, record];
  const next = [...history];
  next[idx] = record;
  return next;
}

// ─────────────────────────────────────────────────────────────
// Lógica de nível (XP) bidirecional e consistente
// ─────────────────────────────────────────────────────────────
export interface LevelResult {
  level: number;
  currentXp: number;
  maxXp: number;
}

/**
 * Aplica variação de XP (positiva ou negativa) de forma segura.
 * Calcula o total de XP acumulado e deriva level e currentXp.
 */
export function applyXpGain(
  currentLevel: number,
  currentXp: number,
  xpDelta: number
): LevelResult {
  const totalXp = Math.max(0, (currentLevel - 1) * XP_PER_LEVEL + currentXp + xpDelta);
  const newLevel = Math.floor(totalXp / XP_PER_LEVEL) + 1;
  const newXp = totalXp % XP_PER_LEVEL;
  return { level: newLevel, currentXp: newXp, maxXp: XP_PER_LEVEL };
}

// ─────────────────────────────────────────────────────────────
// Cálculo de sequência a partir do histórico
// ─────────────────────────────────────────────────────────────

/**
 * Retorna os dias distintos que tiveram ao menos uma conclusão ativa.
 */
export function getActiveDates(history: DailyRecord[], userId: string): string[] {
  const dates = new Set<string>();
  for (const r of history) {
    if (r.userId === userId && r.rewardClaimed) {
      dates.add(r.date);
    }
  }
  return Array.from(dates).sort();
}

/**
 * Calcula a sequência atual a partir de `today` para trás,
 * percorrendo dias consecutivos com atividade.
 */
export function calcCurrentStreak(activeDates: string[], today: string): number {
  if (activeDates.length === 0) return 0;
  const sortedDesc = [...activeDates].sort().reverse();
  const latestActive = sortedDesc[0];

  if (latestActive !== today) {
    const yesterday = subtractDays(today, 1);
    if (latestActive !== yesterday) return 0;
  }

  let streak = 0;
  let checkDate = latestActive === today ? today : subtractDays(today, 1);

  for (const d of sortedDesc) {
    if (d === checkDate) {
      streak++;
      checkDate = subtractDays(checkDate, 1);
    } else if (d < checkDate) {
      break;
    }
  }
  return streak;
}

function subtractDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() - days);
  return getLocalDateString(d);
}

// ─────────────────────────────────────────────────────────────
// Contagem semanal
// ─────────────────────────────────────────────────────────────

/** Número de conclusões ativas na semana atual */
export function calcWeeklyCompletions(history: DailyRecord[], userId: string): number {
  const { start, end } = getWeekRange();
  return history.filter(
    (r) => r.userId === userId && r.rewardClaimed && dateInRange(r.date, start, end)
  ).length;
}

// ─────────────────────────────────────────────────────────────
// Atualização de desafios
// ─────────────────────────────────────────────────────────────

export function recalcChallenges(
  challenges: Challenge[],
  history: DailyRecord[],
  userId: string,
  streakDays: number,
  habits: Array<{ id: string; iconType: string; name: string; frequency?: string }>
): Challenge[] {
  const waterIds = habits
    .filter((h) => h.iconType === 'water' || h.name.toLowerCase().includes('água'))
    .map((h) => h.id);
  const studyIds = habits
    .filter((h) => h.iconType === 'book' || h.name.toLowerCase().includes('estud'))
    .map((h) => h.id);

  const { start, end } = getWeekRange();

  // Dias únicos de água concluídos nesta semana
  const waterDays = new Set<string>();
  history.forEach((r) => {
    if (r.userId === userId && r.rewardClaimed && waterIds.includes(r.habitId) && dateInRange(r.date, start, end)) {
      waterDays.add(r.date);
    }
  });

  // Dias únicos de estudo concluídos nesta semana
  const studyDays = new Set<string>();
  history.forEach((r) => {
    if (r.userId === userId && r.rewardClaimed && studyIds.includes(r.habitId) && dateInRange(r.date, start, end)) {
      studyDays.add(r.date);
    }
  });

  return challenges.map((c) => {
    let current = c.current;
    if (c.id.includes('1') || c.title.toLowerCase().includes('consecutivo')) {
      current = Math.min(c.total, streakDays);
    } else if (c.id.includes('2') || c.title.toLowerCase().includes('água')) {
      current = Math.min(c.total, waterDays.size);
    } else if (c.id.includes('3') || c.title.toLowerCase().includes('estud')) {
      current = Math.min(c.total, studyDays.size);
    }
    const completed = current >= c.total;
    return { ...c, current, completed };
  });
}

// ─────────────────────────────────────────────────────────────
// Atualização de recompensas
// ─────────────────────────────────────────────────────────────

export function recalcRewards(
  rewards: Reward[],
  streakDays: number,
  completedChallengesCount: number
): { rewards: Reward[]; coinsGained: number } {
  let coinsGained = 0;

  const updated = rewards.map((r) => {
    let current = r.current ?? 0;
    let unlocked = r.unlocked;

    if (r.id.includes('1') || r.title.toLowerCase().includes('constante')) {
      current = Math.min(r.total ?? 7, streakDays);
      if (streakDays >= (r.total ?? 7) && !unlocked) {
        unlocked = true;
      }
    } else if (r.id.includes('2') || r.title.toLowerCase().includes('focado')) {
      current = Math.min(r.total ?? 14, streakDays);
      if (streakDays >= (r.total ?? 14) && !unlocked) {
        unlocked = true;
      }
    } else if (r.id.includes('3') || r.title.toLowerCase().includes('moedas')) {
      current = Math.min(r.total ?? 10, completedChallengesCount);
      if (completedChallengesCount >= (r.total ?? 10) && !unlocked) {
        unlocked = true;
        coinsGained += 250;
      }
    }

    return { ...r, current, unlocked };
  });

  return { rewards: updated, coinsGained };
}

// ─────────────────────────────────────────────────────────────
// Processamento principal de conclusão e desmarcação
// ─────────────────────────────────────────────────────────────

export interface CompletionInput {
  userId: string;
  habitId: string;
  /** true = marcar como concluído; false = desmarcar */
  completed: boolean;
  currentStats: UserStats;
  history: DailyRecord[];
  challenges: Challenge[];
  rewards: Reward[];
  habits: Array<{ id: string; iconType: string; name: string; frequency?: string }>;
}

export interface CompletionResult {
  stats: UserStats;
  history: DailyRecord[];
  challenges: Challenge[];
  rewards: Reward[];
  /** true se uma recompensa foi concedida ou revertida */
  rewardGranted: boolean;
}

/**
 * Processa a marcação ou desmarcação de um hábito com regras reversíveis e idempotentes:
 * - Se concluindo e ainda não estava marcado hoje: +50 pts e +30 XP.
 * - Se desmarcando e estava marcado hoje: -50 pts e -30 XP (reversão).
 * - Se marcado novamente após desmarcar: +50 pts e +30 XP novamente.
 * - Cliques repetidos no mesmo estado: não duplicam.
 */
export function processHabitCompletion(input: CompletionInput): CompletionResult {
  const { userId, habitId, completed, currentStats, challenges, rewards, habits } = input;
  let history = input.history;

  const today = getLocalDateString();
  const existingRecord = findRecord(history, userId, habitId, today);
  const wasClaimedToday = existingRecord?.rewardClaimed ?? false;

  let pointsDelta = 0;
  let xpDelta = 0;
  let rewardGranted = false;

  if (completed && !wasClaimedToday) {
    // Marcou novo hábito hoje: concede pontos e XP
    pointsDelta = POINTS_PER_COMPLETION;
    xpDelta = XP_PER_COMPLETION;
    rewardGranted = true;
  } else if (!completed && wasClaimedToday) {
    // Desmarcou hábito que estava pontuado: reverte valores
    pointsDelta = -POINTS_PER_COMPLETION;
    xpDelta = -XP_PER_COMPLETION;
  }

  // Atualiza registro no histórico
  const record: DailyRecord = {
    key: buildRecordKey(userId, habitId, today),
    userId,
    habitId,
    date: today,
    rewardClaimed: completed, // true se concluído, false se desmarcado
    updatedAt: new Date().toISOString(),
  };
  history = upsertRecord(history, record);

  // Calcula novas estatísticas
  const newPoints = Math.max(0, currentStats.points + pointsDelta);
  const levelResult = applyXpGain(
    currentStats.level,
    currentStats.currentXp,
    xpDelta
  );

  // Recalcula sequência e semana com base nas datas ativas reais
  const activeDates = getActiveDates(history, userId);
  const newStreak = calcCurrentStreak(activeDates, today);
  const newBestStreak = Math.max(currentStats.bestStreakDays, newStreak);
  const newWeeklyCompleted = calcWeeklyCompletions(history, userId);

  // Consistência geral (% dos últimos 30 dias com atividade)
  const last30 = getLast30Days();
  const activeLast30 = last30.filter((d) => activeDates.includes(d)).length;
  const overallConsistency = last30.length > 0 ? Math.round((activeLast30 / last30.length) * 100) : 0;

  const updatedStats: UserStats = {
    ...currentStats,
    points: newPoints,
    ...levelResult,
    streakDays: newStreak,
    bestStreakDays: newBestStreak,
    weeklyCompletedCount: newWeeklyCompleted,
    overallConsistency,
  };

  // Recalcula desafios e medalhas
  const updatedChallenges = recalcChallenges(challenges, history, userId, newStreak, habits);
  const completedChallengesCount = updatedChallenges.filter((c) => c.completed).length;
  const { rewards: updatedRewards, coinsGained } = recalcRewards(
    rewards,
    newStreak,
    completedChallengesCount
  );

  if (coinsGained > 0) {
    updatedStats.coins = updatedStats.coins + coinsGained;
  }

  return {
    stats: updatedStats,
    history,
    challenges: updatedChallenges,
    rewards: updatedRewards,
    rewardGranted,
  };
}

// ─────────────────────────────────────────────────────────────
// Auxiliares
// ─────────────────────────────────────────────────────────────
function getLast30Days(): string[] {
  const days: string[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(getLocalDateString(d));
  }
  return days;
}

export function recalcStatsFromHistory(
  stats: UserStats,
  history: DailyRecord[],
  challenges: Challenge[],
  rewards: Reward[],
  habits: Array<{ id: string; iconType: string; name: string; frequency?: string }>
): { stats: UserStats; challenges: Challenge[]; rewards: Reward[] } {
  const userId = stats.userId ?? '';
  const today = getLocalDateString();

  const activeDates = getActiveDates(history, userId);
  const newStreak = calcCurrentStreak(activeDates, today);
  const newBestStreak = Math.max(stats.bestStreakDays, newStreak);
  const newWeeklyCompleted = calcWeeklyCompletions(history, userId);

  const last30 = getLast30Days();
  const activeLast30 = last30.filter((d) => activeDates.includes(d)).length;
  const overallConsistency = last30.length > 0 ? Math.round((activeLast30 / last30.length) * 100) : 0;

  const updatedStats: UserStats = {
    ...stats,
    streakDays: newStreak,
    bestStreakDays: newBestStreak,
    weeklyCompletedCount: newWeeklyCompleted,
    overallConsistency,
  };

  const updatedChallenges = recalcChallenges(challenges, history, userId, newStreak, habits);
  const completedChallengesCount = updatedChallenges.filter((c) => c.completed).length;
  const { rewards: updatedRewards, coinsGained } = recalcRewards(
    rewards,
    newStreak,
    completedChallengesCount
  );
  if (coinsGained > 0) {
    updatedStats.coins = updatedStats.coins + coinsGained;
  }

  return { stats: updatedStats, challenges: updatedChallenges, rewards: updatedRewards };
}

export function calcWeeklyTarget(habits: Array<{ frequency: string }>): number {
  return habits.reduce((acc, h) => {
    if (h.frequency === 'Todos os dias') return acc + 7;
    if (h.frequency === 'Dias úteis') return acc + 5;
    if (h.frequency === 'Semanal') return acc + 1;
    return acc + 7;
  }, 0);
}
