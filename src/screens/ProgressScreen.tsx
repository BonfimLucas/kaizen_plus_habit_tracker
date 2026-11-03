import React, { useState, useMemo } from 'react';
import { UserStats, Habit, ScreenType } from '../types';
import { DailyRecord, getLocalDateString } from '../lib/gamification';

interface ProgressScreenProps {
  userStats: UserStats;
  habits: Habit[];
  history: DailyRecord[];
  onNavigate: (screen: ScreenType) => void;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({
  userStats,
  habits,
  history,
  onNavigate,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'semana' | 'mes'>('semana');
  const [activeTooltip, setActiveTooltip] = useState<{ day: string; percent: string } | null>(null);

  /**
   * Calcula os dados da semana atual com base no histórico real.
   * Cada dia mostra a % de hábitos únicos completados com recompensa naquele dia.
   */
  const daysData = useMemo(() => {
    const today = new Date();
    const dow = today.getDay(); // 0=Dom ... 6=Sáb
    const diffToMonday = dow === 0 ? -6 : 1 - dow;

    const totalHabits = habits.length;

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + diffToMonday + i);
      const dateStr = getLocalDateString(d);
      const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
      const fullDayNames = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

      // Conta hábitos únicos completados neste dia
      const uniqueCompletions = new Set(
        history
          .filter(
            (r) =>
              r.userId === userStats.userId &&
              r.rewardClaimed &&
              r.date === dateStr
          )
          .map((r) => r.habitId)
      ).size;

      const percent = totalHabits > 0 ? Math.min(100, Math.round((uniqueCompletions / totalHabits) * 100)) : 0;
      const isWeekend = i >= 5; // Sáb e Dom
      const isFuture = dateStr > getLocalDateString(today);

      return {
        day: dayNames[i],
        fullDay: fullDayNames[i],
        percent: isFuture ? 0 : percent,
        isWeekend,
        isFuture,
      };
    });
  }, [habits, history, userStats.userId]);

  const handleBarTap = (day: string, percent: number) => {
    setActiveTooltip({ day, percent: `${percent}%` });
    setTimeout(() => setActiveTooltip(null), 2500);
  };

  // Melhor hábito: o que tem mais streakDays
  const bestHabit = useMemo(() => {
    if (habits.length === 0) return null;
    return habits.reduce((best, h) => (h.streakDays > (best?.streakDays ?? -1) ? h : best), habits[0]);
  }, [habits]);

  const consistencyCircumference = 251.2;
  const consistencyOffset =
    consistencyCircumference - (userStats.overallConsistency / 100) * consistencyCircumference;

  // Desempenho por hábito: agrupa por habitId contando dias com recompensa concedida nos últimos 30
  const habitPerformance = useMemo(() => {
    const today = new Date();
    const last30: string[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      last30.push(getLocalDateString(d));
    }

    return habits.map((habit) => {
      const completedDays = new Set(
        history
          .filter(
            (r) =>
              r.userId === userStats.userId &&
              r.habitId === habit.id &&
              r.rewardClaimed &&
              last30.includes(r.date)
          )
          .map((r) => r.date)
      ).size;
      const percent = Math.round((completedDays / 30) * 100);
      return { habit, completedDays, percent };
    });
  }, [habits, history, userStats.userId]);

  const getHabitIcon = (habit: Habit) => {
    switch (habit.iconType) {
      case 'water':
        return (
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
        );
      case 'runner':
        return (
          <svg className="w-3.5 h-3.5 fill-none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'book':
        return (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      default:
        return <span className="text-[10px]">✨</span>;
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col px-4 pt-1 pb-4 overflow-y-auto no-scrollbar gap-4">
      {/* Header */}
      <section className="mt-1 flex items-start justify-between" data-purpose="screen-header">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold text-white tracking-tight">Meu progresso</h1>
          <p className="text-xs text-[#8e968e] font-normal">Acompanhe sua evolução e mantenha a consistência.</p>
        </div>

        
      </section>

      {/* Card de hábitos concluídos */}
      <article className="bg-[#1c1e1c] border border-[#2a2d2a] rounded-2xl p-4 shadow-xl flex flex-col space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-1.5 text-xs font-medium text-gray-300">
              <span>Hábitos concluídos</span>
            </div>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-2xl font-bold text-[#4ade80]">{userStats.weeklyCompletedCount}</span>
              <span className="text-sm text-[#8e968e]">de</span>
              <span className="text-xl font-bold text-white">{userStats.weeklyTargetCount}</span>
            </div>
            <p className="text-[11px] text-[#8e968e]">conclusões</p>
          </div>

          <div className="text-right">
            <div className="inline-flex items-center border border-[#4ade80]/40 bg-[#4ade80]/10 px-3 py-1 rounded-full text-[#4ade80] text-sm font-semibold tracking-tight shadow-sm">
              {userStats.weeklyTargetCount > 0
                ? Math.round((userStats.weeklyCompletedCount / userStats.weeklyTargetCount) * 100)
                : 0}%
            </div>
            <div className="text-[10px] text-[#8e968e] mt-1">da meta semanal</div>
          </div>
        </div>

        {/* Gráfico de barras semanal — dados reais */}
        <div className="relative pt-2" data-purpose="weekly-bar-chart">
          {activeTooltip && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-900 border border-[#2a2d2a] text-[#4ade80] text-[10px] font-semibold px-2 py-0.5 rounded shadow-lg animate-in fade-in duration-150">
              {activeTooltip.day}: {activeTooltip.percent} concluído
            </div>
          )}

          <div className="flex items-end justify-between h-36 px-1 relative">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 border-b border-[#2a2d2a]">
              <div className="border-b border-dashed border-gray-600 w-full flex justify-end text-[9px] text-[#8e968e] pr-1">100</div>
              <div className="border-b border-dashed border-gray-600 w-full flex justify-end text-[9px] text-[#8e968e] pr-1">75</div>
              <div className="border-b border-dashed border-gray-600 w-full flex justify-end text-[9px] text-[#8e968e] pr-1">50</div>
              <div className="border-b border-dashed border-gray-600 w-full flex justify-end text-[9px] text-[#8e968e] pr-1">25</div>
              <div className="w-full flex justify-end text-[9px] text-[#8e968e] pr-1">0</div>
            </div>

            {daysData.map((d) => (
              <div
                key={d.day}
                onClick={() => handleBarTap(d.fullDay, d.percent)}
                className="flex flex-col items-center flex-1 z-10 group cursor-pointer"
              >
                <span className="text-[10px] text-[#8e968e] mb-1 group-hover:text-[#4ade80] font-medium transition-colors">
                  {d.isFuture ? '' : `${d.percent}%`}
                </span>
                <div className="w-6 bg-[#363a36] rounded-t-md h-24 flex items-end overflow-hidden">
                  <div
                    className={`w-full rounded-t-md transition-all duration-500 group-hover:brightness-125 ${
                      d.isFuture
                        ? 'bg-[#2a2d2a]'
                        : d.isWeekend && d.percent < 50
                        ? 'bg-gray-500'
                        : 'bg-[#4ade80]'
                    }`}
                    style={{ height: `${d.isFuture ? 0 : d.percent}%` }}
                  />
                </div>
                <span className="text-[11px] text-[#8e968e] font-medium mt-2 group-hover:text-white transition-colors">
                  {d.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sub-cards de meta */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="bg-[#202220] border border-[#2a2d2a]/60 rounded-xl p-2.5 flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full bg-[#4ade80]/20 text-[#4ade80] flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-white leading-tight">Meta semanal</div>
              <div className="text-[10px] text-[#8e968e] leading-tight mt-0.5">
                {userStats.weeklyCompletedCount}/{userStats.weeklyTargetCount} conclusões
              </div>
            </div>
          </div>

          <div className="bg-[#202220] border border-[#2a2d2a]/60 rounded-xl p-2.5 flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-white leading-tight">
                Faltam {Math.max(0, userStats.weeklyTargetCount - userStats.weeklyCompletedCount)} conclusões
              </div>
              <div className="text-[10px] text-[#8e968e] leading-tight mt-0.5">para sua meta</div>
            </div>
          </div>
        </div>
      </article>

      {/* Consistência geral */}
      <article className="bg-[#1c1e1c] border border-[#2a2d2a] rounded-2xl p-4 shadow-xl flex flex-col space-y-3">
        <h2 className="text-xs font-semibold text-gray-300">Consistência geral</h2>
        <div className="flex items-center space-x-4">
          <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" fill="none" r="40" stroke="#2a2d2a" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                fill="none"
                r="40"
                stroke="#4ade80"
                strokeDasharray={consistencyCircumference}
                strokeDashoffset={consistencyOffset}
                strokeLinecap="round"
                strokeWidth="8"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-bold text-white tracking-tight">{userStats.overallConsistency}%</span>
            </div>
          </div>

          <div className="flex-1 space-y-1.5">
            <div>
              <h3 className="text-xs font-bold text-[#4ade80]">
                {userStats.overallConsistency >= 70
                  ? 'Excelente!'
                  : userStats.overallConsistency >= 40
                  ? 'Bom progresso!'
                  : 'Continue assim!'}
              </h3>
              <p className="text-[11px] text-[#8e968e] leading-snug">
                {userStats.overallConsistency >= 70
                  ? 'Você mantém uma ótima sequência.'
                  : 'Cada dia conta. Mantenha o ritmo!'}
              </p>
            </div>
            <div className="pt-1 space-y-1">
              <div className="flex items-center space-x-1.5 text-xs text-gray-200">
                <svg className="w-3.5 h-3.5 text-[#4ade80] fill-current flex-shrink-0" viewBox="0 0 24 24">
                  <path d="M12 23c-4.97 0-9-4.03-9-9 0-4.13 2.8-8.23 7.06-11.23.51-.36 1.21-.06 1.34.54.4 1.83 1.39 3.49 2.76 4.67.22.19.55.15.71-.09.91-1.37 2.05-3.08 2.5-4.48.16-.48.74-.7 1.13-.42C20.35 4.96 22 8.78 22 14c0 4.97-4.03 9-9 9z" />
                </svg>
                <span className="font-medium text-[11px]">
                  Sequência atual: <strong className="text-white">{userStats.streakDays} dias</strong>
                </span>
              </div>
              <div className="text-[10px] text-[#8e968e] pl-5">Melhor sequência: {userStats.bestStreakDays} dias</div>
            </div>
          </div>
        </div>
      </article>

      {/* Grid de destaques */}
      <div className="grid grid-cols-2 gap-3" data-purpose="metrics-grid">
        {/* Melhor hábito */}
        <article className="bg-[#1c1e1c] border border-[#2a2d2a] rounded-2xl p-3.5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-300 leading-tight">Melhor hábito</span>
            <svg className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 24 24">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </div>

          {bestHabit ? (
            <div className="flex flex-col items-center text-center my-1">
              <div className="w-12 h-12 rounded-full bg-[#4ade80]/15 border border-[#4ade80]/30 flex items-center justify-center text-[#4ade80] mb-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-xs font-bold text-white">{bestHabit.name}</span>
              <span className="mt-1.5 inline-block text-[10px] font-semibold text-[#4ade80] bg-[#4ade80]/10 border border-[#4ade80]/30 rounded-full px-2 py-0.5">
                {bestHabit.streakDays} dias seguidos
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center my-1">
              <span className="text-xs text-[#8e968e]">Nenhum hábito ainda</span>
            </div>
          )}

          <p className="text-[9.5px] text-center text-[#8e968e] leading-tight">
            {bestHabit ? 'Parabéns! Continue assim.' : 'Crie seu primeiro hábito.'}
          </p>
        </article>

        {/* Evolução */}
        <article className="bg-[#1c1e1c] border border-[#2a2d2a] rounded-2xl p-3.5 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-300 leading-tight">Evolução</span>
            <div className="w-5 h-5 rounded-md bg-[#4ade80]/10 flex items-center justify-center text-[#4ade80]">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <div className="text-center my-0.5">
            <div className="text-lg font-bold text-[#4ade80] tracking-tight">
              {userStats.points} pts
            </div>
            <p className="text-[9px] text-[#8e968e]">pontos acumulados</p>
          </div>

          <div className="w-full h-12 relative overflow-hidden flex items-end">
            <svg className="w-full h-11" preserveAspectRatio="none" viewBox="0 0 100 40">
              <defs>
                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#4ade80" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#4ade80" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <polygon fill="url(#chartGradient)" points="0,32 15,26 30,30 45,22 60,25 75,18 90,14 90,40 0,40" />
              <polyline fill="none" points="0,32 15,26 30,30 45,22 60,25 75,18 90,14" stroke="#4ade80" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              <circle cx="90" cy="14" fill="#6ee7b7" r="2.5" stroke="#1c1e1c" strokeWidth="1" />
            </svg>
          </div>

          <p className="text-[9.5px] text-center text-[#8e968e] leading-tight">
            Nível {userStats.level} — continue evoluindo!
          </p>
        </article>
      </div>

      {/* Desempenho por hábito — dados reais dos últimos 30 dias */}
      <section className="bg-[#1c1e1c] border border-[#2a2d2a] rounded-2xl p-4 shadow-xl mb-2" data-purpose="habit-performance-list">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-xs font-semibold text-gray-200 tracking-wide">Desempenho por hábito (30 dias)</h2>
          <button
            onClick={() => onNavigate('habits')}
            className="text-[11px] text-[#4ade80] hover:underline font-medium px-2 py-0.5 rounded-md hover:bg-[#202220] cursor-pointer"
            type="button"
          >
            Ver todos
          </button>
        </div>

        {habitPerformance.length === 0 ? (
          <p className="text-xs text-[#8e968e] text-center py-4">Nenhum hábito cadastrado ainda.</p>
        ) : (
          <div className="space-y-4">
            {habitPerformance.map(({ habit, completedDays, percent }) => (
              <div key={habit.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#202220] border border-[#2a2d2a] flex items-center justify-center text-[#4ade80]">
                      {getHabitIcon(habit)}
                    </div>
                    <span className="text-xs font-semibold text-white">{habit.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#4ade80]">{percent}%</span>
                    <span className="text-[10px] text-[#8e968e] block">{completedDays} de 30 dias</span>
                  </div>
                </div>
                <div className="w-full bg-[#363a36] rounded-full h-1.5 overflow-hidden">
                  <div className="bg-[#4ade80] h-full rounded-full" style={{ width: `${percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
