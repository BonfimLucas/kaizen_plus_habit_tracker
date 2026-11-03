import React from 'react';
import { LeaderboardUser } from '../types';

interface RankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: LeaderboardUser[];
}

export const RankingModal: React.FC<RankingModalProps> = ({ isOpen, onClose, users }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#161816] border border-[#2b332d] rounded-3xl p-5 shadow-2xl relative overflow-hidden flex flex-col">
        {/* Glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#4ade80]/15 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#282d29]">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Ranking Semanal</h3>
              <p className="text-[11px] text-[#4ade80] font-medium">Liga Esmeralda • Termina em 2 dias</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar ranking"
            className="w-8 h-8 rounded-full bg-[#202421] text-gray-400 hover:text-white flex items-center justify-center border border-[#2e3630] transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Podiums / Top 3 visual preview */}
        {(() => {
          const firstUser = users.find((u) => u.isCurrentUser) || users.find((u) => u.rank === 1);
          const secondUser = users.find((u) => !u.isCurrentUser && u.rank === 2);
          const thirdUser = users.find((u) => !u.isCurrentUser && u.rank === 3);

          return (
            <div className="grid grid-cols-3 gap-2 pt-4 pb-4 items-end text-center">
              {/* #2 */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-[#202521] border border-gray-400 flex items-center justify-center text-sm font-bold text-gray-300 relative shadow">
                  🥈
                </div>
                <span className="text-[11px] font-semibold text-white mt-1.5 truncate max-w-[80px]">
                  {secondUser?.name || 'Aguardando'}
                </span>
                <span className="text-[10px] text-gray-400">
                  {secondUser ? `${secondUser.points} pts` : '--'}
                </span>
                <div className="w-full h-12 bg-[#202421] border border-[#2b332d] rounded-t-lg mt-1 flex items-center justify-center text-xs font-bold text-gray-400">
                  #2
                </div>
              </div>

              {/* #1 Current User */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-[#1b3824] border-2 border-[#4ade80] flex items-center justify-center text-base font-bold text-[#4ade80] shadow-lg shadow-[#4ade80]/20">
                    🥇
                  </div>
                  <span className="absolute -top-2 -right-1 text-xs">👑</span>
                </div>
                <span className="text-xs font-bold text-[#4ade80] mt-1.5 truncate max-w-[85px]">
                  {firstUser?.name || 'Você'}
                </span>
                <span className="text-[11px] font-bold text-white">
                  {firstUser?.points ?? 0} pts
                </span>
                <div className="w-full h-18 bg-gradient-to-t from-[#1b3824] to-[#254d31] border border-[#4ade80]/50 rounded-t-lg mt-1 flex items-center justify-center text-sm font-extrabold text-[#4ade80]">
                  #1
                </div>
              </div>

              {/* #3 */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-[#242017] border border-amber-600/60 flex items-center justify-center text-sm font-bold text-amber-500 relative shadow">
                  🥉
                </div>
                <span className="text-[11px] font-semibold text-white mt-1.5 truncate max-w-[80px]">
                  {thirdUser?.name || 'Aguardando'}
                </span>
                <span className="text-[10px] text-gray-400">
                  {thirdUser ? `${thirdUser.points} pts` : '--'}
                </span>
                <div className="w-full h-9 bg-[#202421] border border-[#2b332d] rounded-t-lg mt-1 flex items-center justify-center text-xs font-bold text-amber-600">
                  #3
                </div>
              </div>
            </div>
          );
        })()}

        {/* Full List */}
        <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar pr-0.5">
          {users.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-6">Nenhum competidor no ranking ainda.</p>
          ) : (
            users.map((u) => (
            <div
              key={u.name}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition ${
                u.isCurrentUser
                  ? 'bg-[#1b2b20] border-[#4ade80]/60 text-white font-semibold shadow-sm'
                  : 'bg-[#1e221f] border-[#29302b] text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-5 font-bold text-center ${u.rank === 1 ? 'text-[#4ade80]' : 'text-gray-400'}`}>
                  {u.rank}
                </span>
                <div className="w-6 h-6 rounded-full bg-[#273029] flex items-center justify-center text-[10px] font-bold text-[#4ade80]">
                  {u.name.charAt(0)}
                </div>
                <span className="truncate max-w-[120px]">{u.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400 flex items-center gap-0.5">
                  🔥 {u.streakDays}d
                </span>
                <span className="font-bold text-[#4ade80]">{u.points} pts</span>
              </div>
            </div>
          )))
        }
        </div>

        {/* Bottom CTA */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-2.5 rounded-xl bg-[#4ade80] hover:bg-[#43cd76] active:scale-[0.98] transition text-[#0c2411] font-semibold text-xs cursor-pointer"
        >
          Continuar pontuando
        </button>
      </div>
    </div>
  );
};
