import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Habit, UserStats, ScreenType } from '../types';

interface HomeScreenProps {
  userStats: UserStats;
  habits: Habit[];
  onToggleHabit: (habitId: string) => void;
  onNavigate: (screen: ScreenType) => void;
  onOpenNotifications: () => void;
  unreadCount: number;
  onLogout?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  userStats,
  habits,
  onToggleHabit,
  onNavigate,
  onOpenNotifications,
  unreadCount,
  onLogout,
}) => {
  const [avatarError, setAvatarError] = useState(false);
  const totalHabits = habits.length;
  const completedHabits = habits.filter((h) => h.completedToday).length;
  const percentage = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

  // Circumference for r=40 is 2 * PI * 40 = 251.2
  const circumference = 251.2;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const handleToggle = (id: string, currentlyCompleted: boolean) => {
    onToggleHabit(id);
    if (!currentlyCompleted && completedHabits + 1 === totalHabits) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#4ade80', '#6ee7b7', '#facc15', '#ffffff'],
      });
    }
  };

  const getHabitIcon = (iconType: Habit['iconType']) => {
    switch (iconType) {
      case 'water':
        return (
          <svg className="w-4 h-4 fill-current text-[#4ade80]" viewBox="0 0 24 24">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
        );
      case 'runner':
        return (
          <svg className="w-4 h-4 fill-current text-[#4ade80]" viewBox="0 0 24 24">
            <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7z" />
          </svg>
        );
      case 'book':
        return (
          <svg className="w-4 h-4 fill-current text-[#4ade80]" viewBox="0 0 24 24">
            <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
          </svg>
        );
      case 'moon':
        return (
          <svg className="w-4 h-4 fill-current text-[#4ade80]" viewBox="0 0 24 24">
            <path d="M9.37 5.51A7.35 7.35 0 0 0 9.1 7.5c0 4.08 3.32 7.4 7.4 7.4.68 0 1.35-.09 1.99-.27A9.03 9.03 0 0 1 10.5 21c-4.97 0-9-4.03-9-9 0-4.08 2.74-7.53 6.64-8.63.41-.12.83.17.87.59.04.18-.01.37-.14.55z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 fill-current text-[#4ade80]" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="8" />
          </svg>
        );
    }
  };

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <div className="w-full flex-1 flex flex-col px-5 pt-1 pb-4 overflow-y-auto no-scrollbar">
      {/* App Header */}
      <section className="flex items-center justify-between mt-1 mb-4" data-purpose="app-header">
        {/* Logo */}
        <div className="flex items-center tracking-tight">
          <span className="text-2xl font-bold text-white tracking-tight">
            kaizen<span className="text-[#4ade80] font-light text-2xl">+</span>
          </span>
        </div>

        {/* Notification Button */}
        <button
          aria-label="Notificações"
          onClick={onOpenNotifications}
          className="relative p-2 rounded-full hover:bg-zinc-800 transition active:scale-95 cursor-pointer"
        >
          <svg className="w-6 h-6 text-[#4ade80] stroke-current fill-none stroke-2" viewBox="0 0 24 24">
            <path
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {unreadCount > 0 && (
            <>
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#4ade80] rounded-full animate-ping" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#4ade80] rounded-full" />
            </>
          )}
        </button>
      </section>

      {/* User Profile Banner */}
      <section className="relative mb-5" data-purpose="profile-welcome">
        <div
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="flex items-center gap-3.5 cursor-pointer p-1 -ml-1 rounded-2xl hover:bg-zinc-900/40 transition active:scale-[0.99]"
        >
          {/* Plant/Sprout Avatar or User Google Avatar */}
          <div className="w-13 h-13 rounded-full bg-emerald-950/70 border border-[#4ade80]/40 p-1 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
            {userStats.avatarUrl && !avatarError ? (
              <img
                src={userStats.avatarUrl}
                alt={userStats.name}
                referrerPolicy="no-referrer"
                onError={() => setAvatarError(true)}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="p-1.5 flex items-center justify-center">
                <svg className="w-7 h-7 text-[#4ade80] fill-current" viewBox="0 0 24 24">
                  <path d="M12 3C8.5 3 6 5.5 6 9c0 3.2 2.2 5.9 5.2 6.7V19H9v2h6v-2h-2.2v-3.3C16.8 14.8 19 12.1 19 9c0-3.5-2.5-6-7-6zm0 2.2c3.1 0 4.8 1.6 4.8 3.8 0 2.3-1.8 4.2-4.8 4.2-3 0-4.8-1.9-4.8-4.2 0-2.2 1.7-3.8 4.8-3.8z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              Olá, <span className="text-[#4ade80]">{userStats.name}</span>
              <span className="text-lg">👋</span>
            </h1>
            <p className="text-xs text-zinc-400 font-normal">Pequenas ações, grandes mudanças.</p>
          </div>
        </div>

        {/* Profile Dropdown Menu */}
        {showProfileMenu && (
          <div className="absolute left-0 top-16 z-30 w-52 bg-[#1a1c1a] border border-[#2b302c] rounded-2xl p-2 shadow-2xl animate-in fade-in duration-150">
            <div className="px-2 py-1.5 border-b border-[#252825] mb-1">
              <p className="text-xs font-bold text-white truncate">{userStats.name}</p>
              {userStats.email && (
                <p className="text-[10px] text-zinc-400 truncate">{userStats.email}</p>
              )}
              <p className="text-[10px] text-[#4ade80] mt-0.5">Nível {userStats.level} • {userStats.points} pts</p>
            </div>
            <button
              onClick={() => {
                setShowProfileMenu(false);
                onNavigate('gamification');
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-gray-300 hover:bg-[#252a26] hover:text-white transition flex items-center gap-2 cursor-pointer"
            >
              <span>🏆</span> Conquistas & XP
            </button>
            <button
              onClick={() => {
                setShowProfileMenu(false);
                if (onLogout) {
                  onLogout();
                } else {
                  onNavigate('login');
                }
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-950/30 transition flex items-center gap-2 cursor-pointer mt-1"
            >
              <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Sair da conta</span>
            </button>
          </div>
        )}
      </section>

      {/* Today's Progress Card */}
      <section className="bg-[#202020] rounded-2xl p-4 relative overflow-hidden border border-zinc-800/80 shadow-lg mb-5 leaf-pattern">
        {/* Botanical Leaf Subtle SVG in Background */}
        <div className="absolute -right-3 -top-3 opacity-15 pointer-events-none">
          <svg className="w-24 h-24 text-emerald-300 stroke-current fill-none stroke-[1.2]" viewBox="0 0 100 100">
            <path d="M20,90 Q50,50 85,15 Q55,50 20,90 Z" />
            <path d="M45,60 Q65,45 80,42" />
            <path d="M55,50 Q75,32 90,26" />
            <path d="M35,70 Q50,60 65,60" />
          </svg>
        </div>

        <h2 className="text-sm font-medium text-zinc-200 mb-3.5">Seu progresso hoje</h2>

        <div className="grid grid-cols-12 gap-3 items-center">
          {/* Circular Progress Gauge */}
          <div className="col-span-5 flex flex-col items-center justify-center relative">
            <div className="relative w-30 h-30 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Track circle */}
                <circle cx="50" cy="50" fill="transparent" r="40" stroke="#2c2d2c" strokeWidth="7" />
                {/* Progress bar circle */}
                <circle
                  cx="50"
                  cy="50"
                  fill="transparent"
                  r="40"
                  stroke="#4ade80"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  strokeWidth="7.5"
                  className="transition-all duration-700 ease-out"
                />
              </svg>

              {/* Center Metric Info */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold text-[#4ade80] tracking-tight">{percentage}%</span>
                <span className="text-[10px] text-zinc-400 font-medium">
                  {completedHabits} de {totalHabits} hábitos
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Mini Cards */}
          <div className="col-span-7 flex flex-col gap-2">
            {/* Stat 1: Streak */}
            <div
              onClick={() => onNavigate('gamification')}
              className="bg-[#282828]/80 hover:bg-zinc-800 transition rounded-xl px-3 py-2 flex items-center justify-between border border-zinc-700/40 cursor-pointer active:scale-[0.98]"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-950/40 flex items-center justify-center text-[#4ade80]">
                  <svg className="w-4 h-4 fill-current text-[#4ade80]" viewBox="0 0 24 24">
                    <path d="M12 23c-4.97 0-9-4.03-9-9 0-4.09 2.76-7.86 5.86-10.87.52-.51 1.36-.26 1.54.44.44 1.7 1.34 3.23 2.6 4.43 0-2.8 1.4-5.4 3.4-7.2.5-.4 1.2-.1 1.3.5.4 2.3 1.7 4.3 3.3 5.7 1.5 1.4 2.5 3.3 2.5 5.5 0 5.8-4.5 10.5-11.5 10.5zm.2-16.7c-.8 1.2-1.2 2.6-1.2 4.1 0 .6-.4 1.1-1 1.1s-1-.5-1-1.1c0-1.2-.3-2.3-.9-3.3-1.9 2.4-3.1 5-3.1 7.9 0 3.9 3.1 7 7 7s7-3.1 7-7c0-1.7-.7-3.2-1.8-4.4-1.8-1.7-3.4-3.5-5-4.3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{userStats.streakDays} dias</p>
                  <p className="text-[9.5px] text-zinc-400">Sequência atual</p>
                </div>
              </div>
              <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </div>

            {/* Stat 2: Points */}
            <div
              onClick={() => onNavigate('gamification')}
              className="bg-[#282828]/80 hover:bg-zinc-800 transition rounded-xl px-3 py-2 flex items-center justify-between border border-zinc-700/40 cursor-pointer active:scale-[0.98]"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-950/40 flex items-center justify-center text-[#4ade80]">
                  <svg className="w-4 h-4 fill-none stroke-current stroke-2 text-[#4ade80]" viewBox="0 0 24 24">
                    <path
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{userStats.points} pontos</p>
                  <p className="text-[9.5px] text-zinc-400">Pontos acumulados</p>
                </div>
              </div>
              <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </div>

            {/* Stat 3: Level */}
            <div
              onClick={() => onNavigate('gamification')}
              className="bg-[#282828]/80 hover:bg-zinc-800 transition rounded-xl px-3 py-2 flex items-center justify-between border border-zinc-700/40 cursor-pointer active:scale-[0.98]"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-950/40 flex items-center justify-center text-[#4ade80]">
                  <svg className="w-4 h-4 fill-none stroke-current stroke-2 text-[#4ade80]" viewBox="0 0 24 24">
                    <path
                      d="M9 19v2m6-2v2M5 3h14v7a7 7 0 01-14 0V3z M5 7H3a2 2 0 00-2 2 4 4 0 004 4h0M19 7h2a2 2 0 012 2 4 4 0 01-4 4h0"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Nível {userStats.level}</p>
                  <p className="text-[9.5px] text-zinc-400">Continue assim!</p>
                </div>
              </div>
              <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Habits List Section */}
      <section className="bg-[#202020] rounded-2xl p-4 border border-zinc-800/80 shadow-md">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3 px-0.5">
          <h2 className="text-sm font-semibold text-white">Hábitos de hoje</h2>
          <button
            onClick={() => onNavigate('habits')}
            aria-label="Ver mais opções de hábitos"
            className="text-zinc-400 hover:text-white p-1 rounded transition cursor-pointer"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>
        </div>

        {/* Habits List Items */}
        <div className="flex flex-col gap-2.5">
          {habits.length === 0 ? (
            <div className="py-7 px-4 text-center rounded-xl bg-[#262626]/40 border border-dashed border-zinc-700/60 flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-emerald-950/40 border border-[#4ade80]/20 flex items-center justify-center text-[#4ade80] mb-2">
                <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                  <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-zinc-200">Nenhum hábito cadastrado ainda</p>
              <p className="text-[11px] text-zinc-400 mt-1 max-w-[220px]">
                Sua conta começa limpa. Toque abaixo para adicionar seu primeiro hábito.
              </p>
            </div>
          ) : (
            habits.map((habit) => (
              <div
                key={habit.id}
                onClick={() => handleToggle(habit.id, habit.completedToday)}
                className="flex items-center justify-between p-3 rounded-xl bg-[#262626] hover:bg-zinc-800/70 border border-transparent transition cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800/80 flex items-center justify-center text-[#4ade80]">
                    {getHabitIcon(habit.iconType)}
                  </div>
                  <span
                    className={`text-sm font-medium transition select-none ${
                      habit.completedToday ? 'text-white' : 'text-zinc-200'
                    }`}
                  >
                    {habit.name}
                  </span>
                </div>

                {/* Checkbox Circle Indicator */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition ${
                    habit.completedToday
                      ? 'bg-[#4ade80] text-zinc-950'
                      : 'border-2 border-zinc-500 bg-transparent text-transparent'
                  }`}
                >
                  {habit.completedToday && (
                    <svg className="w-4 h-4 stroke-current stroke-[2.5] fill-none" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Habit Outline Button */}
        <button
          onClick={() => onNavigate('create-habit')}
          className="w-full mt-3.5 py-2.5 px-4 rounded-xl border border-dashed border-zinc-700 hover:border-[#4ade80]/70 hover:bg-zinc-800/40 text-[#4ade80] text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-[0.98] cursor-pointer"
        >
          <svg className="w-4 h-4 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
            <line x1="12" x2="12" y1="5" y2="19" />
            <line x1="5" x2="19" y1="12" y2="12" />
          </svg>
          Adicionar hábito
        </button>
      </section>
    </div>
  );
};
