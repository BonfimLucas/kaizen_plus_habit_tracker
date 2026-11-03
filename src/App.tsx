import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { ScreenType, Habit, UserStats, Challenge, Reward, AppNotification, LeaderboardUser } from './types';
import {
  initialHabits,
  initialChallenges,
  initialRewards,
  initialNotifications,
  createEmptyUserStats,
  createInitialLeaderboard,
} from './data/initialData';
import {
  processHabitCompletion,
  recalcStatsFromHistory,
  calcWeeklyTarget,
  saveHistory,
  loadHistory,
  DailyRecord,
  getLocalDateString,
} from './lib/gamification';
import {
  fetchProfile,
  upsertProfile,
  fetchUserProgress,
  saveUserProgress,
  fetchUserHabits,
  createHabitInDb,
  updateHabitInDb,
  deleteHabitFromDb,
  logHabitCompletionInDb,
  removeHabitCompletionFromDb,
  fetchChallengesFromDb,
  saveUserChallengeProgress,
  fetchBadgesFromDb,
  awardBadgeInDb,
  fetchLeaderboardFromDb,
} from './lib/supabaseService';
import { BottomNav } from './components/BottomNav';
import { NotificationsModal } from './components/NotificationsModal';
import { RankingModal } from './components/RankingModal';
import { AuthScreen } from './screens/AuthScreen';
import { HomeScreen } from './screens/HomeScreen';
import { HabitsScreen } from './screens/HabitsScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { CreateHabitScreen } from './screens/CreateHabitScreen';
import { GamificationScreen } from './screens/GamificationScreen';
import { supabase, isSupabaseConfigured, signOutUser } from './lib/supabase';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Estados em memória da conta ativa
  const [userStats, setUserStats] = useState<UserStats>(() => createEmptyUserStats());
  const [habits, setHabits] = useState<Habit[]>(() => initialHabits);
  const [challenges, setChallenges] = useState<Challenge[]>(() => initialChallenges);
  const [rewards, setRewards] = useState<Reward[]>(() => initialRewards);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => initialNotifications);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>(() => createInitialLeaderboard());
  const [history, setHistory] = useState<DailyRecord[]>([]);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isRankingOpen, setIsRankingOpen] = useState(false);

  // Flag para evitar requisições concorrentes duplicadas
  const loadingUserRef = useRef<string | null>(null);

  // ─────────────────────────────────────────────────────────────
  // LIMPEZA DE ESTADO EM MEMÓRIA (LOGOUT / TROCA DE CONTA)
  // ─────────────────────────────────────────────────────────────
  const clearUserState = useCallback(() => {
    loadingUserRef.current = null;
    setCurrentUser(null);
    setActiveUserId(null);
    setIsDataLoaded(false);
    setLoadError(null);
    setHabits([]);
    setHistory([]);
    setUserStats(createEmptyUserStats());
    setChallenges(initialChallenges);
    setRewards(initialRewards);
    setLeaderboard([]);
    setNotifications([]);
  }, []);

  // ─────────────────────────────────────────────────────────────
  // CARREGAMENTO REAL DO SUPABASE
  // ─────────────────────────────────────────────────────────────
  const loadUserData = useCallback(async (user: User) => {
    const userId = user.id;
    if (loadingUserRef.current === userId) return;
    loadingUserRef.current = userId;

    const meta = user.user_metadata || {};
    const fallbackName =
      meta.full_name ||
      meta.name ||
      user.email?.split('@')[0] ||
      'Você';
    const fallbackAvatar = meta.avatar_url || meta.picture || undefined;

    try {
      // 1. Carrega Perfil do Supabase
      let dbProfile = await fetchProfile(userId);
      if (!dbProfile) {
        dbProfile = await upsertProfile({
          id: userId,
          display_name: fallbackName,
          avatar_url: fallbackAvatar,
        });
      }

      const resolvedName = dbProfile?.display_name || fallbackName;
      const resolvedAvatar = dbProfile?.avatar_url || fallbackAvatar;

      // 2. Carrega Progresso do Usuário do Supabase (user_progress)
      let dbProgress = await fetchUserProgress(userId);
      if (!dbProgress) {
        dbProgress = await saveUserProgress({
          user_id: userId,
          total_points: 0,
          level: 1,
          coins: 0,
        });
      }

      // 3. Carrega Hábitos e Logs de Conclusão do Supabase (habits e habit_logs)
      const { habits: loadedHabits, logs: loadedLogs } = await fetchUserHabits(userId);

      // Constrói o histórico diário derivado dos habit_logs reais do Supabase
      const derivedHistory: DailyRecord[] = loadedLogs.map((log) => {
        const dateStr = log.completed_at
          ? getLocalDateString(new Date(log.completed_at))
          : getLocalDateString();
        return {
          key: `${userId}_${log.habit_id}_${dateStr}`,
          userId,
          habitId: log.habit_id,
          date: dateStr,
          rewardClaimed: log.status === 'completed',
          updatedAt: log.created_at || new Date().toISOString(),
        };
      });

      // 4. Carrega Desafios do Supabase (challenges e user_challenges)
      let loadedChallenges = await fetchChallengesFromDb(userId);
      if (loadedChallenges.length === 0) {
        loadedChallenges = initialChallenges;
      }

      // 5. Carrega Medalhas do Supabase (badges e user_badges)
      let loadedRewards = await fetchBadgesFromDb(userId);
      if (loadedRewards.length === 0) {
        loadedRewards = initialRewards;
      }

      // 6. Carrega Ranking Global do Supabase
      let loadedLeaderboard = await fetchLeaderboardFromDb(userId);
      if (loadedLeaderboard.length === 0) {
        loadedLeaderboard = createInitialLeaderboard(
          resolvedName,
          resolvedAvatar,
          dbProgress?.total_points || 0,
          0
        );
      }

      // 7. Consolida estatísticas
      const baseStats: UserStats = {
        userId,
        name: resolvedName,
        email: user.email,
        avatarUrl: resolvedAvatar,
        level: dbProgress?.level || 1,
        currentXp: (dbProgress?.total_points || 0) % 100,
        maxXp: 100,
        points: dbProgress?.total_points || 0,
        coins: dbProgress?.coins || 0,
        streakDays: 0,
        bestStreakDays: 0,
        overallConsistency: 0,
        weeklyTargetCount: calcWeeklyTarget(loadedHabits),
        weeklyCompletedCount: 0,
      };

      // Recalcula streaks, semanais e consistência a partir do histórico real de logs
      const { stats: finalStats, challenges: recalcChal, rewards: recalcRew } =
        recalcStatsFromHistory(
          baseStats,
          derivedHistory,
          loadedChallenges,
          loadedRewards,
          loadedHabits
        );

      finalStats.weeklyTargetCount = calcWeeklyTarget(loadedHabits);

      // Atualiza o ranking para o usuário atual
      const updatedLeaderboard = loadedLeaderboard.map((u) =>
        u.isCurrentUser
          ? { ...u, points: finalStats.points, streakDays: finalStats.streakDays, name: `${resolvedName} (Você)`, avatarUrl: resolvedAvatar }
          : u
      );

      // Atualiza estado em memória
      setCurrentUser(user);
      setActiveUserId(userId);
      setHabits(loadedHabits);
      setHistory(derivedHistory);
      setUserStats(finalStats);
      setChallenges(recalcChal);
      setRewards(recalcRew);
      setLeaderboard(updatedLeaderboard);
      setIsDataLoaded(true);
      setLoadError(null);

      // Salva snapshot local em cache de backup (apenas para resiliência offline)
      try {
        localStorage.setItem(`kaizen_habits_${userId}`, JSON.stringify(loadedHabits));
        localStorage.setItem(`kaizen_stats_${userId}`, JSON.stringify(finalStats));
        saveHistory(userId, derivedHistory);
      } catch (cacheErr) {
        console.warn('[Kaizen] Aviso ao gravar cache local:', cacheErr);
      }
    } catch (err: any) {
      console.error('[Kaizen] Erro ao carregar dados do usuário:', err);
      setCurrentUser(user);
      setActiveUserId(userId);
      setLoadError('Não foi possível conectar ao banco de dados para carregar suas informações.');
    } finally {
      loadingUserRef.current = null;
    }
  }, []);

  // ─────────────────────────────────────────────────────────────
  // MONITOR DE SESSÃO DO SUPABASE AUTH
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsAuthLoading(false);
      return;
    }

    let isMounted = true;

    // 1. Recupera sessão existente
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return;
      if (error) console.error('[Supabase Auth] Erro ao obter sessão:', error);
      if (session?.user) {
        loadUserData(session.user);
        setCurrentScreen('home');
      } else {
        clearUserState();
        setCurrentScreen('login');
      }
      setIsAuthLoading(false);
    });

    // 2. Ouve alterações de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        if (session.user.id !== activeUserId) {
          clearUserState();
          loadUserData(session.user);
        }
        setCurrentScreen((prev) => (prev === 'login' || prev === 'register' ? 'home' : prev));
      } else {
        clearUserState();
        if (event === 'SIGNED_OUT') setCurrentScreen('login');
      }
      setIsAuthLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [activeUserId, clearUserState, loadUserData]);

  // ─────────────────────────────────────────────────────────────
  // HANDLER CENTRALIZADO DE CONCLUSÃO / DESMARCAÇÃO
  // ─────────────────────────────────────────────────────────────
  const handleCompleteHabit = useCallback(
    async (habitId: string, completed: boolean) => {
      if (!activeUserId || !isDataLoaded) return;

      const currentHabit = habits.find((h) => h.id === habitId);
      if (!currentHabit) return;

      // Evita cliques repetidos no mesmo estado
      if (currentHabit.completedToday === completed) return;

      // 1. Processa gamificação centralizada (concede ou reverte 50pts e 30XP)
      const result = processHabitCompletion({
        userId: activeUserId,
        habitId,
        completed,
        currentStats: userStats,
        history,
        challenges,
        rewards,
        habits,
      });

      // 2. Atualiza estado visual local imediatamente (otimista)
      const updatedHabits = habits.map((h) =>
        h.id === habitId ? { ...h, completedToday: completed } : h
      );
      result.stats.weeklyTargetCount = calcWeeklyTarget(updatedHabits);

      setHabits(updatedHabits);
      setHistory(result.history);
      setUserStats(result.stats);
      setChallenges(result.challenges);
      setRewards(result.rewards);
      setLeaderboard((prev) =>
        prev.map((u) => (u.isCurrentUser ? { ...u, points: result.stats.points } : u))
      );

      // 3. Atualiza cache local
      try {
        localStorage.setItem(`kaizen_habits_${activeUserId}`, JSON.stringify(updatedHabits));
        localStorage.setItem(`kaizen_stats_${activeUserId}`, JSON.stringify(result.stats));
        saveHistory(activeUserId, result.history);
      } catch {
        /* silencioso */
      }

      // 4. PERSISTÊNCIA REAL NO SUPABASE
      try {
        if (completed) {
          // Insere registro de log no banco
          await logHabitCompletionInDb(habitId);
        } else {
          // Remove registro de log no banco
          await removeHabitCompletionFromDb(habitId);
        }

        // Atualiza progresso (pontos, nível, moedas) em `user_progress`
        await saveUserProgress({
          user_id: activeUserId,
          total_points: result.stats.points,
          level: result.stats.level,
          coins: result.stats.coins,
        });

        // Persiste progresso de desafios concluídos ou avançados
        for (const chal of result.challenges) {
          await saveUserChallengeProgress(
            activeUserId,
            chal.id,
            chal.current,
            chal.completed
          );
        }

        // Persiste medalhas recém-desbloqueadas
        for (const rew of result.rewards) {
          if (rew.unlocked) {
            await awardBadgeInDb(activeUserId, rew.id);
          }
        }
      } catch (dbErr) {
        console.error('[Kaizen] Falha ao persistir conclusão no Supabase:', dbErr);
      }
    },
    [activeUserId, isDataLoaded, habits, userStats, history, challenges, rewards]
  );

  // ─────────────────────────────────────────────────────────────
  // HANDLERS DE CRIAÇÃO, EDIÇÃO E EXCLUSÃO DE HÁBITOS
  // ─────────────────────────────────────────────────────────────

  const handleAddHabit = useCallback(
    async (newHabit: Habit) => {
      if (!activeUserId || !isDataLoaded) return;

      try {
        // 1. Criação real no Supabase
        const created = await createHabitInDb(activeUserId, {
          name: newHabit.name,
          category: newHabit.category,
          frequency: newHabit.frequency,
          goalNumber: newHabit.goalNumber,
          unit: newHabit.unit,
          iconType: newHabit.iconType,
        });

        const habitToUse = created || { ...newHabit, id: crypto.randomUUID(), userId: activeUserId };

        const updatedHabits = [...habits, habitToUse];
        const newTarget = calcWeeklyTarget(updatedHabits);
        const newStats = { ...userStats, weeklyTargetCount: newTarget };

        setHabits(updatedHabits);
        setUserStats(newStats);

        // Atualiza cache
        localStorage.setItem(`kaizen_habits_${activeUserId}`, JSON.stringify(updatedHabits));
        localStorage.setItem(`kaizen_stats_${activeUserId}`, JSON.stringify(newStats));
      } catch (err) {
        console.error('[Kaizen] Erro ao cadastrar hábito:', err);
      }
    },
    [activeUserId, isDataLoaded, habits, userStats]
  );

  const handleUpdateHabit = useCallback(
    async (updated: Habit) => {
      if (!activeUserId || !isDataLoaded) return;

      const previous = habits.find((h) => h.id === updated.id);
      const wasCompleted = previous?.completedToday ?? false;
      const isNowCompleted = updated.completedToday;

      const updatedHabits = habits.map((h) => (h.id === updated.id ? updated : h));
      setHabits(updatedHabits);

      // Persiste no banco
      updateHabitInDb(updated.id, updated).catch((err) =>
        console.error('[Kaizen] Erro ao atualizar hábito no banco:', err)
      );

      // Se o status de conclusão mudou, executa a gamificação centralizada
      if (isNowCompleted !== wasCompleted) {
        handleCompleteHabit(updated.id, isNowCompleted);
      }
    },
    [activeUserId, isDataLoaded, habits, handleCompleteHabit]
  );

  const handleDeleteHabit = useCallback(
    async (habitId: string) => {
      if (!activeUserId || !isDataLoaded) return;

      try {
        // 1. Remove do Supabase
        await deleteHabitFromDb(habitId);

        // 2. Remove do estado local
        const updatedHabits = habits.filter((h) => h.id !== habitId);
        const newTarget = calcWeeklyTarget(updatedHabits);
        const newStats = { ...userStats, weeklyTargetCount: newTarget };

        setHabits(updatedHabits);
        setUserStats(newStats);

        // Atualiza cache
        localStorage.setItem(`kaizen_habits_${activeUserId}`, JSON.stringify(updatedHabits));
        localStorage.setItem(`kaizen_stats_${activeUserId}`, JSON.stringify(newStats));
      } catch (err) {
        console.error('[Kaizen] Erro ao excluir hábito:', err);
      }
    },
    [activeUserId, isDataLoaded, habits, userStats]
  );

  // ─────────────────────────────────────────────────────────────
  // AUTENTICAÇÃO E SESSÃO
  // ─────────────────────────────────────────────────────────────

  const handleLoginSuccess = (_userName: string) => {
    if (currentUser) {
      loadUserData(currentUser);
    }
    setCurrentScreen('home');
  };

  const handleLogout = async () => {
    clearUserState();
    setCurrentScreen('login');
    try {
      await signOutUser();
    } catch (err) {
      console.error('[Supabase Auth] Erro ao realizar logout:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const handleMarkAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const showBottomNav = ['home', 'habits', 'progress', 'gamification'].includes(currentScreen);

  // ─────────────────────────────────────────────────────────────
  // TELAS DE CARREGAMENTO E RECUPERAÇÃO
  // ─────────────────────────────────────────────────────────────

  if (isAuthLoading) {
    return (
      <div className="min-h-screen w-full bg-[#141414] text-white flex flex-col items-center justify-center select-none">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 border-2 border-[#4ade80]/20 border-t-[#4ade80] rounded-full animate-spin" />
          <div className="absolute w-3 h-3 bg-[#4ade80] rounded-full" />
        </div>
        <p className="mt-4 text-xs font-medium text-zinc-400 tracking-wide">
          Conectando ao Kaizen+...
        </p>
      </div>
    );
  }

  if (loadError && currentUser) {
    return (
      <div className="min-h-screen w-full bg-[#141414] text-white flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-14 h-14 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
          <svg className="w-7 h-7 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-base font-bold text-white mb-1.5">Recuperação de Dados</h2>
        <p className="text-xs text-zinc-400 max-w-xs mb-5 leading-relaxed">{loadError}</p>
        <div className="flex gap-3">
          <button
            onClick={() => loadUserData(currentUser)}
            className="px-4 py-2.5 rounded-xl bg-[#4ade80] hover:bg-[#3ec473] text-zinc-950 text-xs font-semibold transition cursor-pointer"
          >
            Tentar novamente
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition cursor-pointer"
          >
            Sair da conta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#141414] text-white flex flex-col select-none">
      <main
        className="w-full min-h-screen flex flex-col overflow-hidden relative"
        data-purpose="mobile-phone-app"
      >
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {currentScreen === 'login' && (
            <AuthScreen
              initialMode="login"
              onLoginSuccess={handleLoginSuccess}
              onNavigateHome={() => setCurrentScreen('home')}
            />
          )}

          {currentScreen === 'home' && (
            <HomeScreen
              userStats={userStats}
              habits={habits}
              onToggleHabit={(id) => {
                const habit = habits.find((h) => h.id === id);
                if (habit) handleCompleteHabit(id, !habit.completedToday);
              }}
              onNavigate={setCurrentScreen}
              onOpenNotifications={() => setIsNotificationsOpen(true)}
              unreadCount={unreadCount}
              onLogout={handleLogout}
            />
          )}

          {currentScreen === 'habits' && (
            <HabitsScreen
              habits={habits}
              onNavigate={setCurrentScreen}
              onUpdateHabit={handleUpdateHabit}
              onDeleteHabit={handleDeleteHabit}
              onCompleteHabit={handleCompleteHabit}
            />
          )}

          {currentScreen === 'progress' && (
            <ProgressScreen
              userStats={userStats}
              habits={habits}
              history={history}
              onNavigate={setCurrentScreen}
            />
          )}

          {currentScreen === 'create-habit' && (
            <CreateHabitScreen
              onNavigate={setCurrentScreen}
              onAddHabit={handleAddHabit}
            />
          )}

          {currentScreen === 'gamification' && (
            <GamificationScreen
              userStats={userStats}
              challenges={challenges}
              rewards={rewards}
              onOpenRanking={() => setIsRankingOpen(true)}
              onNavigate={setCurrentScreen}
            />
          )}
        </div>

        {showBottomNav && (
          <BottomNav
            currentScreen={currentScreen}
            onNavigate={setCurrentScreen}
          />
        )}

        <RankingModal
          isOpen={isRankingOpen}
          onClose={() => setIsRankingOpen(false)}
          users={leaderboard}
        />

        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          notifications={notifications}
          onMarkAllRead={handleMarkAllRead}
        />
      </main>
    </div>
  );
}
