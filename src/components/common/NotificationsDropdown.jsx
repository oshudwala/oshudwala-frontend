import React, { useRef, useEffect } from 'react';
import { Bell, CheckCircle2, Truck, Calendar, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export const NotificationsDropdown = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const { t } = useLanguage();

  const notifications = [
    {
      id: 'notif-1',
      icon: Truck,
      color: 'bg-emerald-100 text-emerald-700',
      title: t('notif_rider_title', 'Rider is on the way!'),
      desc: t('notif_rider_desc', 'Kamrul Islam is 800m away with your order OW-89214. OTP: 4829'),
      time: t('notif_rider_time', '10m ago'),
      link: '/orders'
    },
    {
      id: 'notif-2',
      icon: Calendar,
      color: 'bg-blue-100 text-blue-700',
      title: t('notif_token_title', 'Appointment Token Reminder'),
      desc: t('notif_token_desc', 'Dr. Priya Sharma is currently serving token GP-11. Your token: GP-14'),
      time: t('notif_token_time', '25m ago'),
      link: '/appointments'
    },
    {
      id: 'notif-3',
      icon: CheckCircle2,
      color: 'bg-amber-100 text-amber-700',
      title: t('notif_rx_title', 'Prescription Verified'),
      desc: t('notif_rx_desc', 'Prescription RX-841920 approved by MedPlus pharmacist.'),
      time: t('notif_rx_time', '2h ago'),
      link: '/profile'
    }
  ];

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

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface-pure rounded-2xl shadow-floating border border-brandBorder-subtle z-50 overflow-hidden animate-fade-in"
    >
      <div className="p-4 border-b border-brandBorder-subtle flex items-center justify-between bg-surface-warm">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-forest-700" />
          <h4 className="font-heading font-bold text-sm text-forest-800">
            {t('notifications', 'Notifications')}
          </h4>
        </div>
        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
          {t('new_badge', '2 New')}
        </span>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-brandBorder-subtle">
        {notifications.map((n) => {
          const Icon = n.icon;
          return (
            <div
              key={n.id}
              onClick={() => {
                onClose();
                navigate(n.link);
              }}
              className="p-3.5 hover:bg-forest-50/50 cursor-pointer transition-colors flex items-start gap-3"
            >
              <div className={`p-2 rounded-xl flex-shrink-0 ${n.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-forest-800 truncate">{n.title}</p>
                  <span className="text-[10px] text-brandText-secondary">{n.time}</span>
                </div>
                <p className="text-xs text-brandText-secondary mt-0.5 leading-snug">{n.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-2.5 bg-surface-warm border-t border-brandBorder-subtle text-center">
        <button
          onClick={() => {
            onClose();
            navigate('/profile');
          }}
          className="text-xs font-semibold text-forest-700 hover:text-forest-800 inline-flex items-center gap-1"
        >
          {t('view_all_activity', 'View all activity')} <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default NotificationsDropdown;
