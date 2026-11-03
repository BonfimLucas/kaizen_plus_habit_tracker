import React from 'react';
import { AppNotification } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#161816] border border-[#2b332d] rounded-3xl p-5 shadow-2xl relative flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#282d29]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1b2b20] border border-[#4ade80]/40 flex items-center justify-center text-[#4ade80]">
              <svg className="w-4 h-4 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Notificações</h3>
              <p className="text-[11px] text-zinc-400">Suas atualizações e alertas diários</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar notificações"
            className="w-8 h-8 rounded-full bg-[#202421] text-gray-400 hover:text-white flex items-center justify-center border border-[#2e3630] transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-3 space-y-2.5">
          {notifications.length === 0 ? (
            <p className="text-xs text-center text-zinc-500 py-8">Nenhuma notificação por enquanto.</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 rounded-2xl border text-xs transition ${
                  !n.read
                    ? 'bg-[#1a231d] border-[#385542] text-white'
                    : 'bg-[#1a1c1a] border-[#292c29] text-zinc-300 opacity-80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-semibold text-xs">
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />}
                    <span className={!n.read ? 'text-[#4ade80]' : 'text-zinc-200'}>{n.title}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 shrink-0">{n.time}</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{n.description}</p>
              </div>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-[#282d29] flex gap-2">
          <button
            onClick={onMarkAllRead}
            className="flex-1 py-2 text-xs text-[#4ade80] hover:text-[#6ee7b7] font-medium transition cursor-pointer text-center"
          >
            Marcar todas como lidas
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#252825] hover:bg-[#303530] text-xs font-semibold text-zinc-300 transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
