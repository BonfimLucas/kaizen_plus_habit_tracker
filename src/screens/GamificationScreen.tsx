import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { UserStats, Challenge, Reward, ScreenType } from '../types';

interface GamificationScreenProps {
  userStats: UserStats;
  challenges: Challenge[];
  rewards: Reward[];
  onOpenRanking: () => void;
  onNavigate: (screen: ScreenType) => void;
}

export const GamificationScreen: React.FC<GamificationScreenProps> = ({
  userStats,
  challenges,
  rewards,
  onOpenRanking,
  onNavigate,
}) => {
  const [activeToast, setActiveToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setActiveToast(message);
    setTimeout(() => setActiveToast(null), 2400);
  };

  const handleClaimReward = (rewardTitle: string) => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#4ade80', '#facc15', '#ffffff'],
    });
    showToast(`Conquista: ${rewardTitle}!`);
  };

  return (
    <div className="w-full flex-1 flex flex-col px-4 pt-1 pb-4 overflow-y-auto no-scrollbar space-y-4">
      {/* Toast */}
      {activeToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#16271c] border border-[#4ade80]/60 text-[#4ade80] px-4 py-2 rounded-2xl text-xs font-semibold shadow-xl animate-in fade-in duration-200">
          {activeToast}
        </div>
      )}

      {/* HeaderSection */}
      <section className="flex justify-between items-start pt-1" data-purpose="page-header">
        <div className="flex items-start gap-2.5 max-w-[72%]">
          <button
            onClick={() => onNavigate('home')}
            aria-label="Voltar"
            className="mt-0.5 w-8 h-8 rounded-full bg-[#1b1d1b] border border-[#2b2d2b] flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer shrink-0"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">Gamificação</h1>
            <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
              Continue evoluindo e desbloqueando conquistas incríveis.
            </p>
          </div>
        </div>

        {/* Ranking Button */}
        <button
          onClick={onOpenRanking}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1b221d] border border-[#2b4434] text-[#4ade80] text-xs font-semibold shadow-sm hover:bg-[#223026] transition-colors active:scale-95 cursor-pointer shrink-0 mt-0.5"
          data-purpose="ranking-trigger"
        >
          <span className="text-sm">🏆</span>
          <span>Ranking</span>
        </button>
      </section>

      {/* EvolutionCard */}
      <section className="bg-[#191c1a] border border-[#262c28] rounded-2xl p-4 shadow-lg relative overflow-hidden" data-purpose="user-evolution-card">
        {/* Glow Backdrop */}
        <div className="absolute -left-10 -top-10 w-32 h-32 bg-[#4ade80]/10 rounded-full blur-2xl pointer-events-none" />

        <h2 className="text-sm font-semibold text-neutral-200 mb-3.5">Minha evolução</h2>

        <div className="flex items-center gap-4">
          {/* Hexagonal Level Emblem */}
          <div className="relative w-24 h-28 flex items-center justify-center shrink-0">
            <div className="absolute inset-0 bg-gradient-to-b from-[#4ade80]/80 to-[#1e5837] hexagon-badge p-[2.5px] badge-glow">
              <div className="w-full h-full bg-[#131714] hexagon-badge flex flex-col items-center justify-center relative">
                {/* Laurel decoration & Level Details */}
                <span className="text-[9px] uppercase tracking-wider text-[#4ade80]/90 font-medium -mt-1">
                  ✦ Nível ✦
                </span>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  {/* Left Laurel */}
                  <svg className="w-3.5 h-7 text-[#4ade80]/80 stroke-current" fill="none" viewBox="0 0 24 48">
                    <path d="M18 6C14 10 12 18 13 26C14 34 20 40 22 42" strokeLinecap="round" strokeWidth="2.5" />
                    <path d="M14 12C10 12 6 15 7 18" strokeLinecap="round" strokeWidth="2.5" />
                    <path d="M13 22C8 22 4 25 5 28" strokeLinecap="round" strokeWidth="2.5" />
                    <path d="M14 32C10 32 6 36 7 39" strokeLinecap="round" strokeWidth="2.5" />
                  </svg>
                  <span className="text-3xl font-extrabold text-white tracking-tight">{userStats.level}</span>
                  {/* Right Laurel */}
                  <svg className="w-3.5 h-7 text-[#4ade80]/80 stroke-current scale-x-[-1]" fill="none" viewBox="0 0 24 48">
                    <path d="M18 6C14 10 12 18 13 26C14 34 20 40 22 42" strokeLinecap="round" strokeWidth="2.5" />
                    <path d="M14 12C10 12 6 15 7 18" strokeLinecap="round" strokeWidth="2.5" />
                    <path d="M13 22C8 22 4 25 5 28" strokeLinecap="round" strokeWidth="2.5" />
                    <path d="M14 32C10 32 6 36 7 39" strokeLinecap="round" strokeWidth="2.5" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* XP Details & Progress Segments */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            {/* Segmented Progress Bar */}
            <div className="flex gap-1.5 h-2.5 w-full mb-2">
              {[...Array(7)].map((_, i) => {
                const ratio = userStats.maxXp > 0 ? userStats.currentXp / userStats.maxXp : 0;
                const isFilled = i < Math.round(ratio * 7);
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-[2px] transition-all duration-300 ${
                      isFilled
                        ? 'bg-[#4ade80] shadow-[0_0_8px_rgba(74,222,128,0.5)]'
                        : 'bg-[#252a27]'
                    }`}
                  />
                );
              })}
            </div>

            {/* Numeric XP progress */}
            <div className="flex items-baseline gap-1.5 mb-3">
              <span className="text-base font-bold text-[#4ade80]">{userStats.currentXp}</span>
              <span className="text-xs text-neutral-400">/ {userStats.maxXp} XP</span>
            </div>

            {/* Currency/Status Mini Chips */}
            <div className="flex items-center gap-3">
              {/* Points Chip */}
              <div className="flex items-center gap-1.5 bg-[#202522] border border-[#2a312d] px-2.5 py-1 rounded-xl">
                <span className="text-xs">⭐</span>
                <div className="leading-none">
                  <span className="text-xs font-bold text-white block">{userStats.points}</span>
                  <span className="text-[9px] text-neutral-400">pontos</span>
                </div>
              </div>

              {/* Coins Chip */}
              <div className="flex items-center gap-1.5 bg-[#202522] border border-[#2a312d] px-2.5 py-1 rounded-xl">
                <span className="text-xs">🪙</span>
                <div className="leading-none">
                  <span className="text-xs font-bold text-white block">{userStats.coins}</span>
                  <span className="text-[9px] text-neutral-400">moedas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Challenges Section */}
      <section className="space-y-3" data-purpose="challenges-container">
        <div className="flex justify-between items-center px-0.5">
          <h2 className="text-sm font-semibold text-white tracking-wide">Desafios</h2>
          <button
            onClick={() => showToast('Todos os desafios disponíveis estão visíveis abaixo.')}
            className="text-xs text-neutral-400 hover:text-[#4ade80] transition-colors font-medium cursor-pointer"
          >
            Ver todos
          </button>
        </div>

        {challenges.length === 0 ? (
          <div className="p-4 text-center rounded-2xl bg-[#191c1a] border border-[#262c28] text-xs text-zinc-400">
            Nenhum desafio ativo no momento.
          </div>
        ) : (
          challenges.map((challenge) => {
            const percent = challenge.total > 0 ? Math.min(100, Math.round((challenge.current / challenge.total) * 100)) : 0;
            return (
              <article
                key={challenge.id}
                className="bg-[#191c1a] border border-[#262c28] rounded-2xl p-3.5 flex flex-col gap-2.5 hover:border-[#323a35] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1e2721] border border-[#28382d] flex items-center justify-center text-[#4ade80] shrink-0">
                      {challenge.iconType === 'fire' && (
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 23c4.97 0 9-4.03 9-9 0-4.04-2.82-7.53-6.42-8.58-.33-.1-.58-.37-.58-.72v-.2c0-.52-.39-.95-.91-.99-2.61-.2-5.09 1.25-6.09 3.65C6 9.25 6 11.5 7 13.5c.2.4-.04.9-.49.88-.41-.02-.75-.32-.82-.73C5.23 10.95 5.5 8.1 6.8 5.8 4.45 7.65 3 10.63 3 14c0 4.97 4.03 9 9 9z" />
                        </svg>
                      )}
                      {challenge.iconType === 'water' && (
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                        </svg>
                      )}
                      {challenge.iconType === 'book' && (
                        <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                          <line x1="12" x2="16" y1="6" y2="6" />
                          <line x1="12" x2="16" y1="10" y2="10" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-white">{challenge.title}</h3>
                      <p className="text-[11px] text-neutral-400">{challenge.desc}</p>
                    </div>
                  </div>

                  {challenge.completed ? (
                    <span className="inline-flex items-center gap-1 bg-[#16271c] border border-[#4ade80]/40 text-[#4ade80] text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                      <svg className="w-3 h-3 stroke-current stroke-[2.5]" fill="none" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      COMPLETO
                    </span>
                  ) : (
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#4ade80]">{challenge.current}</span>
                      <span className="text-[11px] text-neutral-400">/ {challenge.total}</span>
                    </div>
                  )}
                </div>

                <div className="w-full bg-[#242926] h-1.5 rounded-full overflow-hidden mt-0.5">
                  <div
                    className="bg-[#4ade80] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(74,222,128,0.4)]"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </article>
            );
          })
        )}
      </section>

      {/* Rewards Section */}
      <section className="space-y-3 pt-1" data-purpose="rewards-container">
        <div className="flex justify-between items-center px-0.5">
          <h2 className="text-sm font-semibold text-white tracking-wide">Recompensas</h2>
          <button
            onClick={() => showToast('Mais insígnias serão desbloqueadas conforme seu nível aumentar!')}
            className="text-xs text-neutral-400 hover:text-[#4ade80] transition-colors font-medium cursor-pointer"
          >
            Ver todas
          </button>
        </div>

        {rewards.length === 0 ? (
          <div className="p-4 text-center rounded-2xl bg-[#191c1a] border border-[#262c28] text-xs text-zinc-400">
            Nenhuma recompensa disponível.
          </div>
        ) : (
          rewards.map((reward) => (
            <article
              key={reward.id}
              onClick={() => reward.unlocked && handleClaimReward(reward.title)}
              className={`bg-[#191c1a] border border-[#262c28] rounded-2xl p-3.5 flex flex-col gap-2 hover:border-[#323a35] transition-all ${
                reward.unlocked ? 'cursor-pointer active:scale-[0.99]' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${
                      reward.unlocked
                        ? 'bg-[#1a2920] border-[#274431] text-[#4ade80]'
                        : reward.iconType === 'coins'
                        ? 'bg-[#242217] border-[#3f391e] text-yellow-500'
                        : 'bg-[#202422] border-[#2b332e] text-neutral-400'
                    }`}
                  >
                    {reward.iconType === 'shield' && (
                      <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <polygon fill="currentColor" points="12 8 13.5 11 17 11.3 14.3 13.7 15.2 17 12 15.2 8.8 17 9.7 13.7 7 11.3 10.5 11" />
                      </svg>
                    )}
                    {reward.iconType === 'lock' && (
                      <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                        <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    )}
                    {reward.iconType === 'coins' && (
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 3.34 2 5s4.48 3 10 3 10-1.34 10-3-4.48-3-10-3zm0 5c-5.52 0-10-1.34-10-3v3c0 1.66 4.48 3 10 3s10-1.34 10-3V4c0 1.66-4.48 3-10 3zm0 5c-5.52 0-10-1.34-10-3v3c0 1.66 4.48 3 10 3s10-1.34 10-3V9c0 1.66-4.48 3-10 3zm0 5c-5.52 0-10-1.34-10-3v3c0 1.66 4.48 3 10 3s10-1.34 10-3v-3c0 1.66-4.48 3-10 3z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white leading-tight">{reward.title}</h3>
                    <p className="text-[11px] text-neutral-400 mt-0.5">{reward.desc}</p>
                  </div>
                </div>

                {reward.unlocked ? (
                  <span className="inline-flex items-center gap-1 bg-[#14261a] border border-[#4ade80]/40 text-[#4ade80] text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                    <svg className="w-3 h-3 stroke-current stroke-[2.5]" fill="none" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    DESBLOQUEADA
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-transparent border border-neutral-600 text-neutral-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <svg className="w-2.5 h-2.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                      <rect height="11" rx="2" width="18" x="3" y="11" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    BLOQUEADA
                  </span>
                )}
              </div>

              {!reward.unlocked && reward.total && (
                <div className="flex items-center gap-3 pl-12 pt-0.5">
                  <div className="text-[11px] text-neutral-400 font-medium whitespace-nowrap min-w-[36px]">
                    <span className="text-white font-bold">{reward.current || 0}</span> / {reward.total}
                  </div>
                  <div className="flex-1 bg-[#242926] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#4ade80] h-full rounded-full transition-all duration-500 shadow-[0_0_6px_rgba(74,222,128,0.3)]"
                      style={{ width: `${Math.min(100, Math.round(((reward.current || 0) / reward.total) * 100))}%` }}
                    />
                  </div>
                </div>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
};
