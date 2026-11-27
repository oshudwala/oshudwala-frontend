import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Megaphone,
  ChevronDown,
  AlertTriangle,
  Wrench,
  Clock,
  X,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { announcementApi } from '../../services/api/announcement.api';

const SEEN_STORAGE_KEY = 'oshud_seen_announcement_ids';

const PRIORITY_META = {
  URGENT: {
    label: 'Emergency',
    icon: AlertTriangle,
    badge: 'bg-rose-100 text-rose-700 border-rose-200',
    card: 'bg-rose-50/70 border-rose-200/80 hover:bg-rose-50',
    iconBox: 'bg-rose-100 text-rose-600',
  },
  WARNING: {
    label: 'Maintenance',
    icon: Wrench,
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    card: 'bg-amber-50/60 border-amber-200/80 hover:bg-amber-50',
    iconBox: 'bg-amber-100 text-amber-700',
  },
  INFO: {
    label: 'General',
    icon: Megaphone,
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    card: 'bg-forest-50/50 border-forest-100 hover:bg-forest-50/90',
    iconBox: 'bg-forest-100 text-forest-700',
  },
};

const PRIORITY_WEIGHT = { URGENT: 3, WARNING: 2, INFO: 1 };

const formatTimeAgo = (iso) => {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

export const AnnouncementsDropdown = ({ isOpen, onToggle, onClose, roleOverride = '' }) => {
  const { user } = useAuth();
  const containerRef = useRef(null);

  const [announcements, setAnnouncements] = useState([]);
  const [seenIds, setSeenIds] = useState(() => {
    try {
      const raw = localStorage.getItem(SEEN_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const userRole =
    roleOverride ||
    (typeof user?.role === 'object' ? user?.role?.name : user?.role) ||
    '';

  const fetchAnnouncements = useCallback(async () => {
    try {
      const list = await announcementApi.getActiveAnnouncements(userRole);
      const now = Date.now();
      const valid = (list || [])
        .filter((item) => {
          if (item.isActive === false) return false;
          if (item.expiresAt && new Date(item.expiresAt).getTime() <= now) return false;
          return true;
        })
        .sort((a, b) => {
          const diff = (PRIORITY_WEIGHT[b.priority] || 1) - (PRIORITY_WEIGHT[a.priority] || 1);
          if (diff !== 0) return diff;
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

      setAnnouncements(valid);
    } catch {
      // Silent fallback
    }
  }, [userRole]);

  useEffect(() => {
    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 120000);
    window.addEventListener('oshud_announcements_updated', fetchAnnouncements);
    return () => {
      clearInterval(interval);
      window.removeEventListener('oshud_announcements_updated', fetchAnnouncements);
    };
  }, [fetchAnnouncements]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose?.();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const markAllSeen = () => {
    const ids = announcements.map((a) => a.id);
    const merged = Array.from(new Set([...seenIds, ...ids]));
    setSeenIds(merged);
    try {
      localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(merged));
    } catch {}
  };

  const unreadCount = announcements.filter((a) => !seenIds.includes(a.id)).length;
  const hasUrgent = announcements.some((a) => a.priority === 'URGENT');

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button: Megaphone + Down Arrow */}
      <button
        type="button"
        onClick={() => onToggle?.()}
        className={`relative flex items-center gap-1 px-2 xs:px-2.5 py-1.5 sm:py-2 rounded-full border transition-all cursor-pointer ${
          isOpen
            ? 'bg-forest-100 border-forest-300 text-forest-800 shadow-2xs'
            : hasUrgent
            ? 'bg-rose-50 hover:bg-rose-100/80 border-rose-200 text-rose-700'
            : 'bg-forest-50/70 hover:bg-forest-100 border-forest-100 text-forest-700'
        }`}
        aria-label="Platform announcements"
        title="Platform Announcements"
      >
        <div className="relative">
          <Megaphone className={`w-4 h-4 xs:w-[18px] xs:h-[18px] ${hasUrgent ? 'animate-pulse' : ''}`} />
          {unreadCount > 0 && (
            <span
              className={`absolute -top-2 -right-2 min-w-[16px] h-[16px] px-1 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center ring-1.5 ring-white shadow-2xs ${
                hasUrgent ? 'bg-rose-600 animate-pulse' : 'bg-emerald-600'
              }`}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2.5 sm:w-96 bg-surface-pure rounded-2xl border border-brandBorder-subtle shadow-floating overflow-hidden z-50 animate-fade-in">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-forest-900 to-forest-800 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-400/20 border border-emerald-300/30 flex items-center justify-center text-emerald-300">
                <Megaphone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-heading font-extrabold leading-tight">
                  Announcements
                </h3>
                <p className="text-[10px] text-forest-200">
                  {announcements.length > 0
                    ? `${announcements.length} active platform broadcast${announcements.length > 1 ? 's' : ''}`
                    : 'All systems running normally'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllSeen}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-emerald-200 transition-colors cursor-pointer"
                  title="Mark all as seen"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>Mark read</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-white/15 text-forest-200 hover:text-white transition-colors cursor-pointer"
                aria-label="Close announcements"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body List */}
          <div className="max-h-[65vh] sm:max-h-96 overflow-y-auto p-3 space-y-2.5 bg-surface-warm/30">
            {announcements.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <div className="w-11 h-11 rounded-2xl bg-forest-50 border border-forest-100 flex items-center justify-center mx-auto text-forest-600">
                  <Megaphone className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-forest-900">No active announcements</p>
                <p className="text-[11px] text-brandText-secondary max-w-[220px] mx-auto">
                  Important updates, maintenance alerts, and emergency notices will appear here.
                </p>
              </div>
            ) : (
              announcements.map((item) => {
                const meta = PRIORITY_META[item.priority] || PRIORITY_META.INFO;
                const Icon = meta.icon;
                const isUnseen = !seenIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (isUnseen) {
                        const merged = [...seenIds, item.id];
                        setSeenIds(merged);
                        try {
                          localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(merged));
                        } catch {}
                      }
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${meta.card}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${meta.iconBox}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${meta.badge}`}
                          >
                            {meta.label}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {isUnseen && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" title="New" />
                            )}
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-brandText-muted">
                              <Clock className="w-2.5 h-2.5" />
                              {formatTimeAgo(item.createdAt)}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs font-bold text-forest-950 leading-snug">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-brandText-secondary leading-relaxed whitespace-pre-line">
                          {item.message}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsDropdown;