import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bell,
  CheckCircle2,
  Truck,
  Calendar,
  ArrowRight,
  Shield,
  Stethoscope,
  Building2,
  Bike,
  Clock,
  Trash2,
  CheckCheck,
  FileText,
  Wallet,
  Users,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { notificationApi } from '../../services/api/notification.api';

export const NotificationsDropdown = ({ isOpen, onClose, onUnreadCountChange }) => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const { user } = useAuth();
  const { t } = useLanguage();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const [isLoading, setIsLoading] = useState(false);

  const rawRole = typeof user?.role === 'object' ? user?.role?.name || user?.role?.role : user?.role;
  const roleStr = String(rawRole || '').trim().toUpperCase();
  const normalizedRole = useMemo(() => {
    if (roleStr.includes('ADMIN')) return 'SUPER_ADMIN';
    if (roleStr.includes('PHARMAC')) return 'PHARMACY';
    if (roleStr.includes('DOCTOR')) return 'DOCTOR';
    if (roleStr.includes('RIDER')) return 'RIDER';
    if (roleStr.includes('CLINIC') || roleStr.includes('RECEPTIONIST')) return 'CLINIC';
    return 'PATIENT';
  }, [roleStr]);

  // Load user's dedicated notifications
  const loadNotifications = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await notificationApi.getNotifications({}, user);
      const items = data.items || [];
      const unread =
        typeof data.unreadCount === 'number'
          ? data.unreadCount
          : items.filter((n) => !n.isRead && !n.readAt).length;

      setNotifications(items);
      setUnreadCount(unread);
      if (onUnreadCountChange) onUnreadCountChange(unread);

      // Dispatch global event for workspace header sync
      window.dispatchEvent(
        new CustomEvent('oshud_unread_count_updated', {
          detail: { count: unread, userId: user?.id || user?.userId },
        })
      );
    } catch (err) {
      console.warn('Error loading notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Clean up any legacy demo notification cache keys from browser storage
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('oshud_user_notifs_v2_')) {
          localStorage.removeItem(k);
        }
      });
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }

    const handleSync = () => {
      loadNotifications();
    };

    window.addEventListener('oshud_order_created', handleSync);
    window.addEventListener('oshud_order_status_updated', handleSync);
    window.addEventListener('oshud_prescription_created', handleSync);
    window.addEventListener('oshud_prescription_verified', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('oshud_order_created', handleSync);
      window.removeEventListener('oshud_order_status_updated', handleSync);
      window.removeEventListener('oshud_prescription_created', handleSync);
      window.removeEventListener('oshud_prescription_verified', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [isOpen, user]);

  // Listen for outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Mark single notification as read and navigate
  const handleItemClick = async (n) => {
    if (!n.isRead && !n.readAt) {
      await notificationApi.markAsRead(n.id, user);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === n.id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      if (onUnreadCountChange) onUnreadCountChange(Math.max(0, unreadCount - 1));
    }
    onClose();
    if (n.link) {
      navigate(n.link);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    await notificationApi.markAllAsRead(user);
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, isRead: true, readAt: new Date().toISOString() }))
    );
    setUnreadCount(0);
    if (onUnreadCountChange) onUnreadCountChange(0);
  };

  // Delete single notification
  const handleDeleteItem = async (e, id) => {
    e.stopPropagation();
    await notificationApi.deleteNotification(id, user);
    setNotifications((prev) => prev.filter((item) => item.id !== id));
    const nextUnread = notifications.filter(
      (item) => item.id !== id && !item.isRead && !item.readAt
    ).length;
    setUnreadCount(nextUnread);
    if (onUnreadCountChange) onUnreadCountChange(nextUnread);
  };

  // Clear read notifications
  const handleClearRead = async () => {
    await notificationApi.clearReadNotifications(user);
    setNotifications((prev) => prev.filter((item) => !item.isRead && !item.readAt));
  };

  // Profile icon & title styling
  const getProfileHeaderInfo = () => {
    switch (normalizedRole) {
      case 'SUPER_ADMIN':
        return {
          icon: Shield,
          title: 'Super Admin Alerts',
          subtitle: 'System & Platform Governance',
          color: 'bg-indigo-50 text-indigo-700',
        };
      case 'PHARMACY':
        return {
          icon: Building2,
          title: 'Pharmacy Operations',
          subtitle: 'Prescriptions & Dispensing',
          color: 'bg-emerald-50 text-emerald-800',
        };
      case 'DOCTOR':
        return {
          icon: Stethoscope,
          title: 'Doctor Clinical Desk',
          subtitle: 'Patients & Consultations',
          color: 'bg-teal-50 text-teal-800',
        };
      case 'CLINIC':
        return {
          icon: Building2,
          title: 'Clinic Front Desk',
          subtitle: 'Roster & Patient Queue',
          color: 'bg-blue-50 text-blue-800',
        };
      case 'RIDER':
        return {
          icon: Bike,
          title: 'Rider Fleet Desk',
          subtitle: 'Deliveries & COD Cash',
          color: 'bg-amber-50 text-amber-800',
        };
      default:
        return {
          icon: Bell,
          title: 'My Health Updates',
          subtitle: 'Orders & Appointments',
          color: 'bg-forest-50 text-forest-800',
        };
    }
  };

  const profileHeader = getProfileHeaderInfo();
  const HeaderIcon = profileHeader.icon;

  // Icon mapping per notification
  const getNotificationIcon = (n) => {
    const cat = String(n.category || '').toUpperCase();
    const title = String(n.title || '').toLowerCase();

    if (cat === 'DELIVERY' || title.includes('rider') || title.includes('delivery')) {
      return { icon: Truck, color: 'bg-amber-100 text-amber-800' };
    }
    if (cat === 'PRESCRIPTION' || title.includes('prescription')) {
      return { icon: FileText, color: 'bg-emerald-100 text-emerald-800' };
    }
    if (cat === 'APPOINTMENT' || title.includes('appointment')) {
      return { icon: Calendar, color: 'bg-blue-100 text-blue-800' };
    }
    if (cat === 'QUEUE' || title.includes('queue') || title.includes('token')) {
      return { icon: Users, color: 'bg-teal-100 text-teal-800' };
    }
    if (
      cat === 'WALLET' ||
      title.includes('cash') ||
      title.includes('remittance') ||
      title.includes('incentive')
    ) {
      return { icon: Wallet, color: 'bg-purple-100 text-purple-800' };
    }
    if (cat === 'PHARMACY' || title.includes('stock')) {
      return { icon: Building2, color: 'bg-rose-100 text-rose-800' };
    }
    if (
      cat === 'SECURITY' ||
      cat === 'SYSTEM' ||
      title.includes('review') ||
      title.includes('clinic')
    ) {
      return { icon: Shield, color: 'bg-indigo-100 text-indigo-800' };
    }
    return { icon: CheckCircle2, color: 'bg-forest-100 text-forest-800' };
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return 'Recent';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      return `${Math.floor(hours / 24)}d ago`;
    } catch (e) {
      return 'Recent';
    }
  };

  const displayedNotifications =
    activeTab === 'unread'
      ? notifications.filter((n) => !n.isRead && !n.readAt)
      : notifications;

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[410px] max-w-[calc(100vw-1.5rem)] bg-surface-pure rounded-3xl shadow-floating border border-brandBorder-subtle z-50 overflow-hidden animate-scale-up"
    >
      {/* Header with Role Title & Badge */}
      <div className="p-3.5 sm:p-4 border-b border-brandBorder-subtle bg-surface-warm/80 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`p-2 rounded-2xl flex-shrink-0 ${profileHeader.color}`}>
              <HeaderIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="font-heading font-extrabold text-sm text-forest-900 leading-tight truncate">
                {profileHeader.title}
              </h4>
              <p className="text-[11px] text-brandText-secondary font-medium truncate">
                {profileHeader.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {unreadCount > 0 ? (
              <span className="text-[10px] sm:text-[11px] font-bold text-white bg-rose-500 px-2.5 py-0.5 rounded-full shadow-2xs animate-pulse">
                {unreadCount} New
              </span>
            ) : (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Up to date
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-brandText-muted hover:text-forest-900 hover:bg-forest-100/70 transition-colors sm:hidden"
              aria-label="Close notifications"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Filters and Quick Actions */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-brandBorder-subtle/70 text-xs">
          <div className="flex items-center gap-1 bg-surface-pure p-0.5 rounded-xl border border-brandBorder-subtle">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-forest-800 text-white shadow-2xs'
                  : 'text-brandText-secondary hover:text-forest-900'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                activeTab === 'unread'
                  ? 'bg-forest-800 text-white shadow-2xs'
                  : 'text-brandText-secondary hover:text-forest-900'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-bold text-forest-700 hover:text-forest-900 flex items-center gap-1 hover:underline p-1"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
            {notifications.some((n) => n.isRead || n.readAt) && (
              <button
                type="button"
                onClick={handleClearRead}
                className="text-[11px] font-medium text-slate-500 hover:text-rose-600 p-1"
                title="Clear read notifications"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-[60vh] sm:max-h-[380px] overflow-y-auto divide-y divide-brandBorder-subtle/70">
        {displayedNotifications.length > 0 ? (
          displayedNotifications.map((n) => {
            const isUnread = !n.isRead && !n.readAt;
            const iconObj = getNotificationIcon(n);
            const Icon = iconObj.icon;

            return (
              <div
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={`p-3.5 hover:bg-forest-50/70 cursor-pointer transition-colors flex items-start gap-3 relative group ${
                  isUnread ? 'bg-forest-50/30' : 'bg-surface-pure'
                }`}
              >
                {/* Unread indicator dot */}
                {isUnread && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-4 right-3.5 ring-2 ring-white" />
                )}

                <div className={`p-2.5 rounded-2xl flex-shrink-0 mt-0.5 ${iconObj.color}`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="min-w-0 flex-1 pr-4">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-xs truncate ${
                        isUnread ? 'font-extrabold text-forest-900' : 'font-semibold text-slate-800'
                      }`}
                    >
                      {n.title}
                    </p>
                    <span className="text-[10px] font-mono text-brandText-muted flex-shrink-0">
                      {formatRelativeTime(n.createdAt)}
                    </span>
                  </div>

                  <p className="text-[11px] text-brandText-secondary mt-1 leading-relaxed line-clamp-2">
                    {n.desc || n.body}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="text-forest-700 font-bold inline-flex items-center gap-1 group-hover:underline">
                      <span>View details</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteItem(e, n.id)}
                      className="sm:opacity-0 sm:group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-1"
                      title="Dismiss notification"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-xs text-brandText-secondary space-y-2">
            <Bell className="w-8 h-8 mx-auto text-brandText-muted opacity-40 mb-1" />
            <p className="font-bold text-forest-900">
              No {activeTab === 'unread' ? 'unread ' : ''}notifications
            </p>
            <p className="text-[11px] text-brandText-muted max-w-xs mx-auto">
              You are all caught up. Only original notifications from your account will appear here.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-surface-warm/80 border-t border-brandBorder-subtle flex items-center justify-between text-xs text-brandText-muted">
        <button
          type="button"
          onClick={loadNotifications}
          disabled={isLoading}
          className="text-[10px] font-bold text-forest-800 hover:underline inline-flex items-center gap-1"
        >
          <Clock className="w-3 h-3" />
          <span>{isLoading ? 'Syncing...' : 'Sync Now'}</span>
        </button>
      </div>
    </div>
  );
};

export default NotificationsDropdown;