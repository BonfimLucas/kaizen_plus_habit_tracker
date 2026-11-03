import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Habit, ScreenType } from '../types';

interface HabitsScreenProps {
  habits: Habit[];
  onNavigate: (screen: ScreenType) => void;
  onUpdateHabit?: (updatedHabit: Habit) => void;
  onDeleteHabit?: (habitId: string) => void;
  /** Handler centralizado de conclusão/desmarcação */
  onCompleteHabit: (habitId: string, completed: boolean) => void;
}

type FilterType = 'todos' | 'ativos' | 'andamento' | 'concluidos';

export const HabitsScreen: React.FC<HabitsScreenProps> = ({
  habits,
  onNavigate,
  onDeleteHabit,
  onCompleteHabit,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('todos');

  const getHabitIcon = (iconType: Habit['iconType']) => {
    switch (iconType) {
      case 'water':
        return (
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
        );
      case 'runner':
        return (
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <circle cx="13.5" cy="5.5" r="2.5" />
            <path d="M9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7" />
          </svg>
        );
      case 'book':
        return (
          <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            <line x1="12" x2="16" y1="6" y2="6" />
            <line x1="12" x2="16" y1="10" y2="10" />
          </svg>
        );
      case 'moon':
        return (
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12.3 2a10 10 0 0 0 9.7 13.7 10 10 0 1 1-13.7-13.7 8.5 8.5 0 0 0 4 0zm5.7 1.5h3v1.5l-2 2h2v1.5h-4.5V7l2-2h-2V3.5z" />
          </svg>
        );
      case 'heart':
        return (
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="8" />
          </svg>
        );
    }
  };

  const handleToggle = (habit: Habit) => {
    const nextState = !habit.completedToday;
    onCompleteHabit(habit.id, nextState);

    if (nextState) {
      confetti({
        particleCount: 35,
        spread: 55,
        origin: { y: 0.6 },
        colors: ['#4ade80', '#38bdf8', '#ffffff'],
      });
    }
  };

  // Filtragem de hábitos
  const filteredHabits = habits.filter((habit) => {
    if (activeFilter === 'todos' || activeFilter === 'ativos') return true;
    if (activeFilter === 'andamento') return !habit.completedToday;
    if (activeFilter === 'concluidos') return habit.completedToday;
    return true;
  });

  return (
    <div className="w-full flex-1 flex flex-col px-5 pt-1 pb-4 overflow-y-auto no-scrollbar">
      {/* TopBar */}
      <div className="pt-2 pb-3 flex items-center justify-between shrink-0" data-purpose="screen-navigation-header">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('home')}
            aria-label="Voltar"
            className="w-9 h-9 rounded-full bg-[#1b1d1b] border border-[#2b2d2b] flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-xl font-bold tracking-tight text-white">Meus hábitos</h1>
        </div>

        <button
          onClick={() => onNavigate('create-habit')}
          className="flex items-center space-x-1.5 text-[#4ade80] hover:text-green-300 font-medium text-sm transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v8m-4-4h8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Novo hábito</span>
        </button>
      </div>

      {/* Filter Chips */}
      <nav aria-label="Filtro de hábitos" className="py-2 overflow-x-auto no-scrollbar flex space-x-2 shrink-0">
        {(['todos', 'ativos', 'andamento', 'concluidos'] as FilterType[]).map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === filter
                ? 'bg-[#213024] text-[#4ade80] border border-[#4ade80]/50'
                : 'bg-[#1a1b1a] text-gray-400 hover:text-gray-200 border border-transparent'
            }`}
          >
            {filter === 'todos' ? 'Todos' : filter === 'ativos' ? 'Ativos' : filter === 'andamento' ? 'Em andamento' : 'Concluídos'}
          </button>
        ))}
      </nav>

      {/* Habit Cards List */}
      <div className="space-y-3.5 pt-2">
        {filteredHabits.map((habit) => (
          <article
            key={habit.id}
            className={`bg-[#1e201e] rounded-2xl p-4 border transition-all duration-200 shadow-md ${
              habit.completedToday ? 'border-[#4ade80]/30 bg-[#162218]/50' : 'border-[#2b2e2b]'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3.5">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                    habit.completedToday
                      ? 'bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/40'
                      : 'bg-[#232723] text-[#4ade80] border border-zinc-800'
                  }`}
                >
                  {getHabitIcon(habit.iconType)}
                </div>
                <div>
                  <h2 className="font-semibold text-base text-gray-100">{habit.name}</h2>
                  <p className="text-xs text-[#8e938e] mt-0.5">
                    Meta: {habit.goalNumber} {habit.unit} • {habit.frequency}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Botão de Conclusão / Desmarcação simples e unificado */}
                <button
                  onClick={() => handleToggle(habit)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                    habit.completedToday
                      ? 'bg-[#1b2a1f] text-[#4ade80] border-[#4ade80]/40 shadow-sm'
                      : 'bg-[#252825] text-gray-300 hover:text-white border-zinc-700'
                  }`}
                >
                  {habit.completedToday ? (
                    <>
                      <svg className="w-3.5 h-3.5 stroke-current stroke-[2.5] fill-none" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>Concluído</span>
                    </>
                  ) : (
                    <span>Pendente</span>
                  )}
                </button>

                {onDeleteHabit && (
                  <button
                    onClick={() => onDeleteHabit(habit.id)}
                    aria-label="Excluir hábito"
                    title="Excluir hábito"
                    className="text-zinc-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-950/20 transition cursor-pointer"
                  >
                    <svg className="w-4 h-4 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar & Sequence */}
            <div className="w-full bg-[#2b2d2b] h-1.5 rounded-full mt-3.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  habit.completedToday ? 'bg-[#4ade80] w-full' : 'bg-transparent w-0'
                }`}
              />
            </div>

            <div className="flex justify-between items-center text-xs mt-2.5 text-zinc-400">
              <span className="text-[11px]">
                {habit.completedToday ? 'Concluído hoje (+50 pts)' : 'Pendente para hoje'}
              </span>
              <span className="text-[11px] font-medium text-zinc-300 flex items-center gap-1">
                <span>🔥</span>
                <span>{habit.streakDays} dias seguidos</span>
              </span>
            </div>
          </article>
        ))}

        {/* Estado vazio */}
        {filteredHabits.length === 0 && (
          <div className="py-12 px-4 text-center rounded-2xl bg-[#1e201e]/60 border border-dashed border-[#2b2e2b] flex flex-col items-center justify-center mt-2">
            <div className="w-12 h-12 rounded-full bg-[#232723] border border-[#4ade80]/30 flex items-center justify-center text-[#4ade80] mb-3">
              <span className="text-xl">🌱</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-200">
              {activeFilter === 'todos' ? 'Sua lista de hábitos está limpa' : 'Nenhum hábito neste filtro'}
            </h3>
            <p className="text-xs text-[#8e938e] mt-1.5 max-w-[240px]">
              {activeFilter === 'todos'
                ? 'Cadastre hábitos para acompanhar seu progresso diário e manter a consistência.'
                : 'Alterne os filtros acima para visualizar seus outros hábitos.'}
            </p>
            {activeFilter === 'todos' && (
              <button
                onClick={() => onNavigate('create-habit')}
                className="mt-4 px-4 py-2 rounded-xl bg-[#4ade80] hover:bg-[#3ec473] text-[#131b15] font-semibold text-xs transition cursor-pointer"
              >
                + Cadastrar Novo Hábito
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
