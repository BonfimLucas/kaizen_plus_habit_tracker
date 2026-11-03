import React from 'react';
import { ScreenType } from '../types';

interface BottomNavProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate }) => {
  const isHome = currentScreen === 'home';
  const isHabits = currentScreen === 'habits';
  const isProgress = currentScreen === 'progress' || currentScreen === 'gamification';

  return (
    <div className="w-full bg-[#141414]/95 backdrop-blur-md border-t border-[#262826] pt-2 pb-2 shrink-0 z-40">
      <nav className="w-full px-8 py-1 flex items-center justify-between" data-purpose="bottom-tab-navigation">
        {/* Início */}
        <button
          onClick={() => onNavigate('home')}
          aria-label="Aba Início"
          className={`flex flex-col items-center gap-1 transition group cursor-pointer ${
            isHome ? 'text-[#4ade80]' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {isHome ? (
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <span className="text-[10px] font-medium tracking-tight">Início</span>
        </button>

        {/* Hábitos */}
        <button
          onClick={() => onNavigate('habits')}
          aria-label="Aba Hábitos"
          className={`flex flex-col items-center gap-1 transition group cursor-pointer ${
            isHabits ? 'text-[#4ade80]' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {isHabits ? (
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <span className="text-[10px] font-medium tracking-tight">Hábitos</span>
        </button>

        {/* Progresso */}
        <button
          onClick={() => onNavigate('progress')}
          aria-label="Aba Progresso"
          className={`flex flex-col items-center gap-1 transition group cursor-pointer ${
            isProgress ? 'text-[#4ade80]' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {isProgress ? (
            <div className="relative">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M4 19h4V9H4v10zm6 0h4V5h-4v14zm6 0h4v-7h-4v7z" />
              </svg>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#4ade80] rounded-full shadow-[0_0_6px_#4ade80]" />
            </div>
          ) : (
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M4 19h4V9H4v10zm6 0h4V5h-4v14zm6 0h4v-7h-4v7z" />
            </svg>
          )}
          <span className="text-[10px] font-medium tracking-tight">Progresso</span>
        </button>
      </nav>

    </div>
  );
};
