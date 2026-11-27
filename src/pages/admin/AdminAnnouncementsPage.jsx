import React, { useState, useEffect, useMemo } from 'react';
import {
  Megaphone,
  Wrench,
  AlertTriangle,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Power,
  Clock,
  Users,
  Search,
  Eye,
  CheckCircle2,
  PauseCircle,
} from 'lucide-react';
import { announcementApi } from '../../services/api/announcement.api';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

const TYPE_OPTIONS = [
  {
    value: 'INFO',
    label: 'General',
    subtitle: 'Updates, offers & general info',
    icon: Megaphone,
    activeCard: 'border-forest-600 bg-forest-50/90 ring-2 ring-forest-500/20',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    previewBar: 'bg-gradient-to-r from-forest-900 via-forest-800 to-emerald-900 text-white',
    previewBadge: 'bg-emerald-400/20 text-emerald-200 border border-emerald-300/30',
  },
  {
    value: 'WARNING',
    label: 'Maintenance',
    subtitle: 'Scheduled downtime & service notice',
    icon: Wrench,
    activeCard: 'border-amber-500 bg-amber-50/90 ring-2 ring-amber-400/25',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    previewBar: 'bg-gradient-to-r from-amber-500 via-amber-500 to-orange-500 text-amber-950',
    previewBadge: 'bg-amber-950/15 text-amber-950 border border-amber-950/20',
  },
  {
    value: 'URGENT',
    label: 'Emergency',
    subtitle: 'Critical alert shown immediately to all',
    icon: AlertTriangle,
    activeCard: 'border-rose-500 bg-rose-50/90 ring-2 ring-rose-400/25',
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
    previewBar: 'bg-gradient-to-r from-rose-700 via-red-600 to-rose-700 text-white',
    previewBadge: 'bg-white/20 text-white border border-white/30',
  },
];

const ROLE_OPTIONS = [
  { value: 'ALL', label: 'Everyone (All Portals)' },
  { value: 'PATIENT', label: 'Patients' },
  { value: 'DOCTOR', label: 'Doctors' },
  { value: 'PHARMACY', label: 'Pharmacies' },
  { value: 'RECEPTIONIST', label: 'Receptionists' },
  { value: 'RIDER', label: 'Riders' },
  { value: 'SUPER_ADMIN', label: 'Super Admins' },
];

const toLocalDatetimeInput = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatDisplayDate = (isoString) => {
  if (!isoString) return 'No expiry';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getTypeMeta = (priority) =>
  TYPE_OPTIONS.find((t) => t.value === priority) || TYPE_OPTIONS[0];

export const AdminAnnouncementsPage = () => {
  const { addToast } = useToast();

  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | ACTIVE | PAUSED | EXPIRED
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('INFO');
  const [targetRoles, setTargetRoles] = useState(['ALL']);
  const [isActive, setIsActive] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');

  const loadAnnouncements = async () => {
    setIsLoading(true);
    try {
      const list = await announcementApi.getAdminAnnouncements();
      setAnnouncements(list);
    } catch (err) {
      addToast(err?.response?.data?.message || err.message || 'Failed to load announcements', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const resetForm = () => {
    setEditingItem(null);
    setTitle('');
    setMessage('');
    setPriority('INFO');
    setTargetRoles(['ALL']);
    setIsActive(true);
    setExpiresAt('');
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setTitle(item.title || '');
    setMessage(item.message || '');
    setPriority(item.priority || 'INFO');
    setTargetRoles(Array.isArray(item.targetRoles) && item.targetRoles.length > 0 ? item.targetRoles : ['ALL']);
    setIsActive(item.isActive !== false);
    setExpiresAt(toLocalDatetimeInput(item.expiresAt));
    setIsModalOpen(true);
  };

  const toggleRole = (roleValue) => {
    if (roleValue === 'ALL') {
      setTargetRoles(['ALL']);
      return;
    }
    setTargetRoles((prev) => {
      const withoutAll = prev.filter((r) => r !== 'ALL');
      if (withoutAll.includes(roleValue)) {
        const next = withoutAll.filter((r) => r !== roleValue);
        return next.length > 0 ? next : ['ALL'];
      }
      return [...withoutAll, roleValue];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (title.trim().length < 2 || message.trim().length < 2) {
      addToast('Title and message must be at least 2 characters.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        message: message.trim(),
        priority,
        targetRoles: targetRoles.length > 0 ? targetRoles : ['ALL'],
        isActive,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      };

      if (editingItem) {
        await announcementApi.updateAnnouncement(editingItem.id, payload);
        addToast('Announcement updated and synced live!', 'success');
      } else {
        await announcementApi.createAnnouncement(payload);
        addToast('Announcement broadcasted live!', 'success');
      }

      setIsModalOpen(false);
      resetForm();
      loadAnnouncements();
    } catch (err) {
      addToast(err?.response?.data?.message || err.message || 'Failed to save announcement', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await announcementApi.updateAnnouncement(item.id, { isActive: !item.isActive });
      addToast(item.isActive ? 'Announcement paused.' : 'Announcement resumed live!', 'success');
      loadAnnouncements();
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}" permanently?`)) return;
    try {
      await announcementApi.deleteAnnouncement(item.id);
      addToast('Announcement deleted.', 'success');
      loadAnnouncements();
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to delete announcement', 'error');
    }
  };

  const nowTs = Date.now();
  const isItemExpired = (item) => Boolean(item.expiresAt && new Date(item.expiresAt).getTime() <= nowTs);

  const stats = useMemo(() => {
    const active = announcements.filter((a) => a.isActive && !isItemExpired(a)).length;
    const emergency = announcements.filter((a) => a.isActive && !isItemExpired(a) && a.priority === 'URGENT').length;
    const maintenance = announcements.filter((a) => a.isActive && !isItemExpired(a) && a.priority === 'WARNING').length;
    return { total: announcements.length, active, emergency, maintenance };
  }, [announcements]);

  const filteredList = useMemo(() => {
    return announcements.filter((item) => {
      const expired = isItemExpired(item);
      if (statusFilter === 'ACTIVE' && (!item.isActive || expired)) return false;
      if (statusFilter === 'PAUSED' && (item.isActive || expired)) return false;
      if (statusFilter === 'EXPIRED' && !expired) return false;
      if (typeFilter !== 'ALL' && item.priority !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchMsg = item.message?.toLowerCase().includes(q);
        if (!matchTitle && !matchMsg) return false;
      }
      return true;
    });
  }, [announcements, statusFilter, typeFilter, searchQuery]);

  const selectedTypeMeta = getTypeMeta(priority);
  const SelectedIcon = selectedTypeMeta.icon;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-forest-900 via-forest-800 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 text-[10px] font-bold uppercase tracking-wider">
              Platform Controls
            </span>
            <span className="text-xs text-forest-200">Global Broadcast Bar</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold mt-1.5 flex items-center gap-2.5">
            <Megaphone className="w-7 h-7 text-emerald-300" />
            <span>Platform Announcements</span>
          </h1>
          <p className="text-xs sm:text-sm text-forest-200 mt-1 max-w-xl">
            Publish General notices, Maintenance schedules, or Emergency alerts directly to the top header bar across all portals.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={loadAnnouncements}
            leftIcon={RefreshCw}
            className="text-white border-white/30 hover:bg-white/10"
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={openCreateModal}
            leftIcon={Plus}
            className="bg-emerald-500 hover:bg-emerald-400 text-forest-950 font-extrabold border-0 shadow-md"
          >
            New Announcement
          </Button>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-surface-pure rounded-2xl p-4 border border-brandBorder-subtle shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-brandText-muted">Total Broadcasts</p>
          <p className="text-2xl font-heading font-extrabold text-forest-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-surface-pure rounded-2xl p-4 border border-emerald-200/80 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Live Right Now</p>
          <p className="text-2xl font-heading font-extrabold text-emerald-700 mt-1">{stats.active}</p>
        </div>
        <div className="bg-surface-pure rounded-2xl p-4 border border-amber-200/80 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Active Maintenance</p>
          <p className="text-2xl font-heading font-extrabold text-amber-700 mt-1">{stats.maintenance}</p>
        </div>
        <div className="bg-surface-pure rounded-2xl p-4 border border-rose-200/80 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Active Emergency</p>
          <p className="text-2xl font-heading font-extrabold text-rose-700 mt-1">{stats.emergency}</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-surface-pure rounded-3xl p-5 sm:p-6 border border-brandBorder-subtle shadow-card space-y-5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {['ALL', 'ACTIVE', 'PAUSED', 'EXPIRED'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === status
                    ? 'bg-forest-800 text-white shadow-2xs'
                    : 'bg-surface-warm text-brandText-secondary hover:text-forest-900 border border-brandBorder-subtle'
                }`}
              >
                {status === 'ALL' ? 'All Status' : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-surface-warm text-forest-900 border border-brandBorder-subtle focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="INFO">General</option>
              <option value="WARNING">Maintenance</option>
              <option value="URGENT">Emergency</option>
            </select>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-brandText-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
            />
          </div>
        </div>

        {/* Announcements List */}
        {isLoading ? (
          <div className="py-14 text-center text-xs text-brandText-secondary">
            Loading platform announcements...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-14 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-forest-50 border border-forest-100 flex items-center justify-center mx-auto text-forest-700">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-forest-900">No announcements found</p>
              <p className="text-xs text-brandText-secondary mt-0.5">
                Create a General, Maintenance, or Emergency broadcast to notify users instantly.
              </p>
            </div>
            <Button variant="primary" size="sm" leftIcon={Plus} onClick={openCreateModal}>
              Create First Announcement
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredList.map((item) => {
              const meta = getTypeMeta(item.priority);
              const TypeIcon = meta.icon;
              const expired = isItemExpired(item);
              const liveNow = item.isActive && !expired;

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 rounded-2xl bg-surface-warm/60 hover:bg-surface-warm border border-brandBorder-subtle transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${meta.badge}`}
                      >
                        <TypeIcon className="w-3 h-3" />
                        <span>{meta.label}</span>
                      </span>

                      {liveNow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          LIVE
                        </span>
                      ) : expired ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-200 text-slate-700">
                          EXPIRED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                          <PauseCircle className="w-3 h-3" />
                          PAUSED
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 text-[11px] text-brandText-secondary font-medium">
                        <Users className="w-3 h-3 text-forest-600" />
                        {(item.targetRoles || ['ALL']).join(', ')}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-forest-950">{item.title}</h4>
                      <p className="text-xs text-brandText-secondary mt-0.5 leading-relaxed">
                        {item.message}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-brandText-muted">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Created: {formatDisplayDate(item.createdAt)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expires: {formatDisplayDate(item.expiresAt)}
                      </span>
                    </div>
                  </div>

                  {/* Row Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-brandBorder-subtle">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        item.isActive
                          ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{item.isActive ? 'Pause' : 'Activate'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="p-2 rounded-xl bg-surface-pure hover:bg-forest-50 text-forest-800 border border-brandBorder-subtle transition-colors cursor-pointer"
                      title="Edit announcement"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="p-2 rounded-xl bg-surface-pure hover:bg-rose-50 text-rose-600 border border-brandBorder-subtle hover:border-rose-200 transition-colors cursor-pointer"
                      title="Delete announcement"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Announcement Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Platform Announcement' : 'Broadcast New Announcement'}
        subtitle="Displayed immediately on the global header bar across selected portals"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Announcement Type Selector: General / Maintenance / Emergency */}
          <div>
            <label className="block text-xs font-bold text-forest-900 mb-2">Announcement Type</label>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = priority === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? opt.activeCard
                        : 'border-brandBorder-subtle bg-surface-pure hover:bg-surface-warm'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1 text-forest-900" />
                    <p className="text-xs font-extrabold text-forest-950">{opt.label}</p>
                    <p className="text-[10px] text-brandText-secondary leading-tight mt-0.5">
                      {opt.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-forest-900 mb-1">Headline / Title</label>
            <input
              type="text"
              required
              maxLength={150}
              placeholder="e.g. Scheduled System Maintenance Tonight 11 PM – 12 AM"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-600"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-bold text-forest-900 mb-1">Announcement Message</label>
            <textarea
              required
              rows={3}
              maxLength={2000}
              placeholder="Write clear instructions or details for users..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-600 resize-none"
            />
          </div>

          {/* Target Audience Chips */}
          <div>
            <label className="block text-xs font-bold text-forest-900 mb-1.5">Target Audience</label>
            <div className="flex flex-wrap gap-1.5">
              {ROLE_OPTIONS.map((role) => {
                const selected = targetRoles.includes(role.value);
                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => toggleRole(role.value)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                      selected
                        ? 'bg-forest-800 text-white border-forest-800'
                        : 'bg-surface-warm text-brandText-secondary border-brandBorder-subtle hover:border-forest-400'
                    }`}
                  >
                    {role.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Expiry Date & Publish Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-xs font-bold text-forest-900 mb-1">
                Auto-Expire At <span className="font-normal text-brandText-muted">(Optional)</span>
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-600"
              />
            </div>

            <label className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-warm border border-brandBorder-subtle cursor-pointer">
              <span className="text-xs font-bold text-forest-900">Publish Immediately</span>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-forest-700"
              />
            </label>
          </div>

          {/* Live Header Preview */}
          <div className="space-y-1.5 pt-1">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-brandText-muted flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>Live Header Bar Preview</span>
            </p>
            <div className={`rounded-xl px-3 py-2 flex items-center gap-2 text-xs ${selectedTypeMeta.previewBar}`}>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase flex-shrink-0 ${selectedTypeMeta.previewBadge}`}
              >
                <SelectedIcon className="w-3 h-3" />
                <span>{selectedTypeMeta.label}</span>
              </span>
              <p className="truncate">
                <span className="font-bold mr-1.5">{title || 'Announcement Headline'}</span>
                <span className="opacity-90">{message || 'Your broadcast message will appear right here...'}</span>
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={isSaving} className="flex-1">
              {isSaving ? 'Publishing...' : editingItem ? 'Save Changes' : 'Broadcast Now'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminAnnouncementsPage;