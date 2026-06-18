import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { stateService } from '../lib/stateService';
import { RPGNotification } from '../types';
import { Bell, Check, Trash2, X, Zap, Crown, Award, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<RPGNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = stateService.subscribeToNotifications(user.id, (list) => {
      setNotifications(list);
    });
    return unsub;
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await stateService.markNotificationRead(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (!user) return;
    try {
      await stateService.clearAllNotifications(user.id);
    } catch (err) {
      console.error(err);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'level_up': 
        return <Crown className="w-4 h-4 text-amber-400" />;
      case 'streak': 
        return <Zap className="w-4 h-4 text-indigo-400" />;
      case 'badge': 
        return <Award className="w-4 h-4 text-purple-400" />;
      case 'social':
        return <MessageSquare className="w-4 h-4 text-emerald-400" />;
      default: 
        return <Bell className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="relative z-40">
      {/* Trigger Button with Ping indicator */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        id="notification-bell-trigger"
        className="relative p-2 rounded-lg bg-black/40 border border-slate-800 text-slate-300 hover:text-indigo-400 hover:border-indigo-400/40 transition-all outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500 text-[10px] font-bold text-white items-center justify-center">
              {unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Floating Panel Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop click dismisser */}
            <div 
              className="fixed inset-0 bg-transparent" 
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-3 w-80 md:w-96 rounded-xl bg-[#090818] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl"
            >
              {/* Header block */}
              <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/60">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-400 animate-pulse" />
                  <h3 className="font-display font-semibold text-sm text-white tracking-wide uppercase">
                    LOGS & COMMUNICATIONS
                  </h3>
                </div>
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    id="clear-all-notifications-btn"
                    className="flex items-center gap-1 text-[10px] uppercase font-mono text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    <Trash2 className="w-3. h-3" />
                    WIPE ALERTS
                  </button>
                )}
              </div>

              {/* Alert list body */}
              <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 font-mono text-xs">
                    SYSTEM QUIET. NO ACTIVE ALERTS.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      className={`p-3.5 flex gap-3 transition-colors ${
                        notif.read ? 'bg-transparent text-slate-400' : 'bg-indigo-500/5 text-slate-100'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {getNotifIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-display font-medium text-xs truncate">
                            {notif.title}
                          </span>
                          <span className="font-mono text-[9px] text-slate-500 shrink-0">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed break-words font-sans text-slate-300">
                          {notif.message}
                        </p>
                      </div>
                      {!notif.read && (
                        <button
                          onClick={(e) => handleMarkRead(notif.id, e)}
                          title="Mark read"
                          id={`notif-mark-read-${notif.id}`}
                          className="self-center p-1 rounded hover:bg-indigo-500/20 text-indigo-400 hover:text-white transition-all shrink-0"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer status bar */}
              <div className="px-4 py-2 bg-black/50 border-t border-white/5 flex justify-between items-center font-mono text-[9px] text-indigo-400/60">
                <span>AV-LOG ENGINE v1.4</span>
                <span>STATUS: STABLE</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
