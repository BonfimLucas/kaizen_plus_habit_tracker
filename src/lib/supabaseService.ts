import { supabase, isSupabaseConfigured } from './supabase';
import { Habit, UserStats, Challenge, Reward, LeaderboardUser } from '../types';
import { getLocalDateString } from './gamification';

// ─────────────────────────────────────────────────────────────
// TIPOS DO BANCO DE DADOS POSTGRESQL (SUPABASE)
// ─────────────────────────────────────────────────────────────

export interface DbProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DbHabit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  frequency: string;
  target_value: number;
  unit: string | null;
  start_date: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DbHabitLog {
  id: string;
  habit_id: string;
  completed_at: string;
  status: string;
  notes?: string | null;
  created_at?: string;
}

export interface DbUserProgress {
  id?: string;
  user_id: string;
  total_points: number;
  level: number;
  coins: number;
  created_at?: string;
  updated_at?: string;
}

export interface DbChallenge {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date?: string | null;
  points_reward: number;
  is_active: boolean;
}

export interface DbUserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  status: string;
  progress: number;
  completed_at?: string | null;
}

export interface DbBadge {
  id: string;
  name: string;
  description: string | null;
  criteria: string | null;
  icon_url: string | null;
}

export interface DbUserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
}

// ─────────────────────────────────────────────────────────────
// FUNÇÕES AUXILIARES DE CONVERSÃO
// ─────────────────────────────────────────────────────────────

/**
 * Serializa metadados extras da aplicação (categoria e ícone)
 * na coluna `description` da tabela `habits`.
 */
export function encodeHabitDescription(
  category: string,
  iconType: string,
  extraDescription = ''
): string {
  try {
    return JSON.stringify({ category, iconType, extraDescription });
  } catch {
    return `${category}|${iconType}|${extraDescription}`;
  }
}

/**
 * Desserializa os metadados da coluna `description`.
 */
export function decodeHabitDescription(desc: string | null): {
  category: Habit['category'];
  iconType: Habit['iconType'];
  extraDescription: string;
} {
  const fallback = {
    category: 'Saúde' as Habit['category'],
    iconType: 'water' as Habit['iconType'],
    extraDescription: '',
  };

  if (!desc) return fallback;

  try {
    const parsed = JSON.parse(desc);
    return {
      category: parsed.category || fallback.category,
      iconType: parsed.iconType || fallback.iconType,
      extraDescription: parsed.extraDescription || '',
    };
  } catch {
    // Formato legado simples
    const parts = desc.split('|');
    if (parts.length >= 2) {
      return {
        category: (parts[0] as Habit['category']) || fallback.category,
        iconType: (parts[1] as Habit['iconType']) || fallback.iconType,
        extraDescription: parts.slice(2).join('|'),
      };
    }
    return fallback;
  }
}

/**
 * Calcula a sequência de dias consecutivos para um hábito a partir dos seus logs.
 */
export function calculateHabitStreak(logs: DbHabitLog[]): number {
  if (!logs || logs.length === 0) return 0;

  const datesSet = new Set<string>();
  for (const log of logs) {
    if (log.status === 'completed' && log.completed_at) {
      datesSet.add(getLocalDateString(new Date(log.completed_at)));
    }
  }

  const sortedDates = Array.from(datesSet).sort().reverse();
  if (sortedDates.length === 0) return 0;

  const todayStr = getLocalDateString();
  const yesterdayStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getLocalDateString(d);
  })();

  const mostRecent = sortedDates[0];
  if (mostRecent !== todayStr && mostRecent !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  let checkDate = new Date(mostRecent + 'T12:00:00');

  for (const dateStr of sortedDates) {
    const curStr = getLocalDateString(checkDate);
    if (dateStr === curStr) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (dateStr < curStr) {
      break;
    }
  }

  return streak;
}

// ─────────────────────────────────────────────────────────────
// SERVIÇOS DE PERFIL (PROFILES)
// ─────────────────────────────────────────────────────────────

export async function fetchProfile(userId: string): Promise<DbProfile | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[SupabaseService] Erro ao buscar profile:', error.message);
      return null;
    }

    return data as DbProfile;
  } catch (err) {
    console.error('[SupabaseService] Falha de rede ao buscar profile:', err);
    return null;
  }
}

export async function upsertProfile(profile: {
  id: string;
  display_name: string;
  avatar_url?: string | null;
}): Promise<DbProfile | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: profile.id,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url || null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[SupabaseService] Erro ao atualizar profile:', error.message);
      return null;
    }

    return data as DbProfile;
  } catch (err) {
    console.error('[SupabaseService] Falha de rede ao atualizar profile:', err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// SERVIÇOS DE PROGRESSO (USER_PROGRESS)
// ─────────────────────────────────────────────────────────────

export async function fetchUserProgress(userId: string): Promise<DbUserProgress | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('id, user_id, total_points, level, coins, created_at, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[SupabaseService] Erro ao buscar user_progress:', error.message);
      return null;
    }

    return data as DbUserProgress;
  } catch (err) {
    console.error('[SupabaseService] Falha de rede ao buscar user_progress:', err);
    return null;
  }
}

export async function saveUserProgress(progress: {
  user_id: string;
  total_points: number;
  level: number;
  coins: number;
}): Promise<DbUserProgress | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const payload = {
      total_points: Math.max(0, progress.total_points),
      level: Math.max(1, progress.level),
      coins: Math.max(0, progress.coins),
      updated_at: new Date().toISOString(),
    };

    // 1. Tenta localizar registro existente do usuário
    const { data: existing, error: selectErr } = await supabase
      .from('user_progress')
      .select('id')
      .eq('user_id', progress.user_id)
      .maybeSingle();

    if (selectErr) {
      console.warn('[SupabaseService] Aviso ao buscar user_progress antes de salvar:', selectErr.message);
    }

    if (existing?.id) {
      // Atualiza registro existente por ID
      const { data, error } = await supabase
        .from('user_progress')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .maybeSingle();

      if (error) {
        console.warn('[SupabaseService] Erro ao atualizar user_progress:', error.message);
        return null;
      }

      return data as DbUserProgress;
    } else {
      // Insere novo registro com ID UUID gerado na aplicação
      const newId = crypto.randomUUID();
      const { data, error } = await supabase
        .from('user_progress')
        .insert({
          id: newId,
          user_id: progress.user_id,
          ...payload,
          created_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (error) {
        console.warn('[SupabaseService] Erro ao inserir user_progress:', error.message);
        return null;
      }

      return data as DbUserProgress;
    }
  } catch (err) {
    console.error('[SupabaseService] Falha de rede ao salvar user_progress:', err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// SERVIÇOS DE HÁBITOS (HABITS, HABIT_LOGS, HABIT_GOALS)
// ─────────────────────────────────────────────────────────────

export async function fetchUserHabits(userId: string): Promise<{
  habits: Habit[];
  logs: DbHabitLog[];
}> {
  if (!isSupabaseConfigured()) {
    return { habits: [], logs: [] };
  }

  try {
    // 1. Busca todos os hábitos ativos do usuário
    const { data: dbHabits, error: habitsErr } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (habitsErr) {
      console.error('[SupabaseService] Erro ao buscar habits:', habitsErr.message);
      return { habits: [], logs: [] };
    }

    if (!dbHabits || dbHabits.length === 0) {
      return { habits: [], logs: [] };
    }

    const habitIds = dbHabits.map((h: DbHabit) => h.id);

    // 2. Busca todos os logs associados a estes hábitos
    const { data: dbLogs, error: logsErr } = await supabase
      .from('habit_logs')
      .select('id, habit_id, completed_at, status, notes, created_at')
      .in('habit_id', habitIds)
      .order('completed_at', { ascending: false });

    if (logsErr) {
      console.warn('[SupabaseService] Erro ao buscar habit_logs:', logsErr.message);
    }

    const allLogs: DbHabitLog[] = dbLogs || [];
    const todayStr = getLocalDateString();

    // 3. Mapeia para a estrutura Habit esperada pelos componentes
    const habits: Habit[] = dbHabits.map((h: DbHabit) => {
      const decoded = decodeHabitDescription(h.description);
      const habitLogs = allLogs.filter((l) => l.habit_id === h.id);

      // Concluído hoje se houver log com status = 'completed' na data local de hoje
      const completedToday = habitLogs.some((l) => {
        if (l.status !== 'completed' || !l.completed_at) return false;
        return getLocalDateString(new Date(l.completed_at)) === todayStr;
      });

      const streakDays = calculateHabitStreak(habitLogs);

      return {
        id: h.id,
        userId: h.user_id,
        name: h.name,
        category: decoded.category,
        frequency: (h.frequency as Habit['frequency']) || 'Todos os dias',
        goalNumber: Number(h.target_value) || 1,
        unit: h.unit || 'vezes',
        completedToday,
        streakDays,
        iconType: decoded.iconType,
      };
    });

    return { habits, logs: allLogs };
  } catch (err) {
    console.error('[SupabaseService] Falha de rede ao buscar hábitos e logs:', err);
    return { habits: [], logs: [] };
  }
}

export async function createHabitInDb(
  userId: string,
  habit: Omit<Habit, 'id' | 'completedToday' | 'streakDays'>
): Promise<Habit | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const habitId = crypto.randomUUID();
    const todayStr = getLocalDateString();
    const encodedDesc = encodeHabitDescription(habit.category, habit.iconType);

    // 1. Insere em `habits`
    const { data: createdHabit, error: habitErr } = await supabase
      .from('habits')
      .insert({
        id: habitId,
        user_id: userId,
        name: habit.name,
        description: encodedDesc,
        frequency: habit.frequency,
        target_value: habit.goalNumber,
        unit: habit.unit,
        start_date: todayStr,
        is_active: true,
      })
      .select()
      .single();

    if (habitErr) {
      console.error('[SupabaseService] Erro ao inserir habit:', habitErr.message);
      return null;
    }

    // 2. Insere registro em `habit_goals`
    const { error: goalErr } = await supabase.from('habit_goals').insert({
      id: crypto.randomUUID(),
      habit_id: habitId,
      target_value: habit.goalNumber,
      unit: habit.unit,
      effective_from: todayStr,
    });

    if (goalErr) {
      console.warn('[SupabaseService] Aviso ao inserir habit_goal:', goalErr.message);
    }

    return {
      id: createdHabit.id,
      userId: createdHabit.user_id,
      name: createdHabit.name,
      category: habit.category,
      frequency: habit.frequency,
      goalNumber: habit.goalNumber,
      unit: habit.unit,
      completedToday: false,
      streakDays: 0,
      iconType: habit.iconType,
    };
  } catch (err) {
    console.error('[SupabaseService] Falha ao criar hábito no banco:', err);
    return null;
  }
}

export async function updateHabitInDb(
  habitId: string,
  updates: Partial<Habit>
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) updatePayload.name = updates.name;
    if (updates.frequency !== undefined) updatePayload.frequency = updates.frequency;
    if (updates.goalNumber !== undefined) updatePayload.target_value = updates.goalNumber;
    if (updates.unit !== undefined) updatePayload.unit = updates.unit;

    if (updates.category !== undefined || updates.iconType !== undefined) {
      updatePayload.description = encodeHabitDescription(
        updates.category || 'Saúde',
        updates.iconType || 'water'
      );
    }

    const { error } = await supabase
      .from('habits')
      .update(updatePayload)
      .eq('id', habitId);

    if (error) {
      console.error('[SupabaseService] Erro ao atualizar habit:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[SupabaseService] Falha ao atualizar hábito no banco:', err);
    return false;
  }
}

export async function deleteHabitFromDb(habitId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    // 1. Remove logs associados
    await supabase.from('habit_logs').delete().eq('habit_id', habitId);
    // 2. Remove metas associadas
    await supabase.from('habit_goals').delete().eq('habit_id', habitId);
    // 3. Remove o hábito
    const { error } = await supabase.from('habits').delete().eq('id', habitId);

    if (error) {
      console.error('[SupabaseService] Erro ao excluir habit:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[SupabaseService] Falha ao excluir hábito no banco:', err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// REGISTRO E DESMARCAÇÃO DE CONCLUSÃO (HABIT_LOGS)
// ─────────────────────────────────────────────────────────────

/**
 * Registra a conclusão de um hábito na data de hoje.
 */
export async function logHabitCompletionInDb(
  habitId: string
): Promise<DbHabitLog | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const todayStr = getLocalDateString();
    const nowIso = new Date().toISOString();

    // 1. Verifica se já existe log deste hábito hoje
    const { data: existingLogs } = await supabase
      .from('habit_logs')
      .select('id, completed_at, status')
      .eq('habit_id', habitId);

    const alreadyCompleted = (existingLogs || []).some(
      (l) => l.completed_at && getLocalDateString(new Date(l.completed_at)) === todayStr
    );

    if (alreadyCompleted) {
      return (existingLogs || [])[0] as DbHabitLog;
    }

    // 2. Insere novo registro de log
    const { data, error } = await supabase
      .from('habit_logs')
      .insert({
        id: crypto.randomUUID(),
        habit_id: habitId,
        completed_at: nowIso,
        status: 'completed',
      })
      .select()
      .single();

    if (error) {
      console.error('[SupabaseService] Erro ao inserir habit_log:', error.message);
      return null;
    }

    return data as DbHabitLog;
  } catch (err) {
    console.error('[SupabaseService] Falha ao registrar log de conclusão:', err);
    return null;
  }
}

/**
 * Remove o log de conclusão de hoje (desmarcação).
 */
export async function removeHabitCompletionFromDb(
  habitId: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const todayStr = getLocalDateString();

    // 1. Busca os logs do hábito
    const { data: existingLogs, error: fetchErr } = await supabase
      .from('habit_logs')
      .select('id, completed_at')
      .eq('habit_id', habitId);

    if (fetchErr || !existingLogs) {
      console.warn('[SupabaseService] Erro ao buscar logs para remover:', fetchErr?.message);
      return false;
    }

    // 2. Filtra os logs que correspondem à data de hoje
    const todayLogIds = existingLogs
      .filter((l) => l.completed_at && getLocalDateString(new Date(l.completed_at)) === todayStr)
      .map((l) => l.id);

    if (todayLogIds.length === 0) {
      return true;
    }

    // 3. Remove os logs de hoje
    const { error: delErr } = await supabase
      .from('habit_logs')
      .delete()
      .in('id', todayLogIds);

    if (delErr) {
      console.error('[SupabaseService] Erro ao deletar habit_logs:', delErr.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[SupabaseService] Falha ao remover log de conclusão:', err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// DESAFIOS (CHALLENGES E USER_CHALLENGES)
// ─────────────────────────────────────────────────────────────

export async function fetchChallengesFromDb(userId: string): Promise<Challenge[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    // 1. Busca os desafios ativos cadastrados
    const { data: dbChallenges, error: chalErr } = await supabase
      .from('challenges')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (chalErr || !dbChallenges || dbChallenges.length === 0) {
      return [];
    }

    // 2. Busca o progresso do usuário para esses desafios
    const { data: dbUserChallenges } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('user_id', userId);

    const userChalMap = new Map<string, DbUserChallenge>();
    (dbUserChallenges || []).forEach((uc: DbUserChallenge) => {
      userChalMap.set(uc.challenge_id, uc);
    });

    return dbChallenges.map((c: DbChallenge) => {
      const userProgress = userChalMap.get(c.id);
      const iconType: Challenge['iconType'] = c.name.toLowerCase().includes('água')
        ? 'water'
        : c.name.toLowerCase().includes('estud')
        ? 'book'
        : 'fire';

      const total = c.name.toLowerCase().includes('água') ? 5 : 7;
      const current = userProgress ? userProgress.progress : 0;
      const completed = userProgress ? userProgress.status === 'completed' : false;

      return {
        id: c.id,
        title: c.name,
        desc: c.description || '',
        iconType,
        current,
        total,
        completed,
      };
    });
  } catch (err) {
    console.error('[SupabaseService] Erro ao buscar desafios:', err);
    return [];
  }
}

export async function saveUserChallengeProgress(
  userId: string,
  challengeId: string,
  progress: number,
  completed: boolean
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const { data: existing } = await supabase
      .from('user_challenges')
      .select('id')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .maybeSingle();

    if (existing?.id) {
      await supabase
        .from('user_challenges')
        .update({
          progress,
          status: completed ? 'completed' : 'in_progress',
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('user_challenges').insert({
        id: crypto.randomUUID(),
        user_id: userId,
        challenge_id: challengeId,
        progress,
        status: completed ? 'completed' : 'in_progress',
        completed_at: completed ? new Date().toISOString() : null,
      });
    }
  } catch (err) {
    console.warn('[SupabaseService] Erro ao salvar progresso de desafio:', err);
  }
}

// ─────────────────────────────────────────────────────────────
// MEDALHAS E RECOMPENSAS (BADGES E USER_BADGES)
// ─────────────────────────────────────────────────────────────

export async function fetchBadgesFromDb(userId: string): Promise<Reward[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data: dbBadges, error: badgeErr } = await supabase
      .from('badges')
      .select('*')
      .order('created_at', { ascending: true });

    if (badgeErr || !dbBadges || dbBadges.length === 0) {
      return [];
    }

    const { data: dbUserBadges } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId);

    const earnedSet = new Set((dbUserBadges || []).map((ub: DbUserBadge) => ub.badge_id));

    return dbBadges.map((b: DbBadge) => {
      const iconType: Reward['iconType'] =
        b.icon_url === 'lock'
          ? 'lock'
          : b.icon_url === 'coins'
          ? 'coins'
          : 'shield';

      const total =
        b.criteria === 'streak_14'
          ? 14
          : b.criteria === 'challenges_10'
          ? 10
          : 7;

      return {
        id: b.id,
        title: b.name,
        desc: b.description || '',
        iconType,
        unlocked: earnedSet.has(b.id),
        current: 0,
        total,
      };
    });
  } catch (err) {
    console.error('[SupabaseService] Erro ao buscar badges:', err);
    return [];
  }
}

export async function awardBadgeInDb(userId: string, badgeId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const { data: existing } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('badge_id', badgeId)
      .maybeSingle();

    if (!existing) {
      await supabase.from('user_badges').insert({
        id: crypto.randomUUID(),
        user_id: userId,
        badge_id: badgeId,
        earned_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn('[SupabaseService] Erro ao conceder badge:', err);
  }
}

// ─────────────────────────────────────────────────────────────
// LEADERBOARD REAL (USER_PROGRESS + PROFILES)
// ─────────────────────────────────────────────────────────────

export async function fetchLeaderboardFromDb(
  currentUserId?: string
): Promise<LeaderboardUser[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    // 1. Busca os top 15 usuários ordenados por total_points
    const { data: progressList, error: progErr } = await supabase
      .from('user_progress')
      .select('user_id, total_points')
      .order('total_points', { ascending: false })
      .limit(15);

    if (progErr || !progressList || progressList.length === 0) {
      return [];
    }

    const userIds = progressList.map((p) => p.user_id);

    // 2. Busca os perfis correspondentes
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds);

    const profileMap = new Map<string, DbProfile>();
    (profiles || []).forEach((prof: DbProfile) => {
      profileMap.set(prof.id, prof);
    });

    return progressList.map((prog, index) => {
      const prof = profileMap.get(prog.user_id);
      const isCurrent = prog.user_id === currentUserId;
      const baseName = prof?.display_name || (isCurrent ? 'Você' : `Usuário ${index + 1}`);
      const name = isCurrent ? `${baseName} (Você)` : baseName;

      return {
        rank: index + 1,
        name,
        points: prog.total_points || 0,
        streakDays: 0, // calculado
        isCurrentUser: isCurrent,
        avatarSeed: prof?.id || `user_${index}`,
        avatarUrl: prof?.avatar_url || undefined,
      };
    });
  } catch (err) {
    console.error('[SupabaseService] Erro ao buscar leaderboard:', err);
    return [];
  }
}

