import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Users,
  Clock,
  Calendar,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  X,
  Save,
  Check,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import doctorApi from '../../services/api/doctor.api';
import { adminApi } from '../../services/api/admin.api';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const DoctorClinicsPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const doctorId = user?.id || 'default';

  const [associatedClinics, setAssociatedClinics] = useState(() => doctorApi.getAssociatedClinics(doctorId));
  const [selectedClinicId, setSelectedClinicId] = useState(() => {
    const list = doctorApi.getAssociatedClinics(doctorId);
    return list[0]?.id || null;
  });

  const [platformClinics, setPlatformClinics] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [showEditClinicModal, setShowEditClinicModal] = useState(false);

  // Form: Add Clinic
  const [addForm, setAddForm] = useState({
    selectedPlatformClinicId: '',
    name: '',
    address: '',
    city: 'Kolkata',
    phone: '',
    chamber: 'Room 204 (2nd Floor)',
    phoneExt: 'Ext 204',
    consultationFee: 600,
    deskStaff: 'Front Desk Receptionist',
  });

  // Form: Edit Clinic Basic Info
  const [editClinicForm, setEditClinicForm] = useState({
    id: '',
    name: '',
    chamber: '',
    phoneExt: '',
    consultationFee: 600,
    deskStaff: '',
  });

  // Form: Edit Schedule
  const [editingSchedule, setEditingSchedule] = useState([]);

  // Fetch website/platform clinics for the Add Clinic dropdown
  useEffect(() => {
    const fetchPlatformClinics = async () => {
      try {
        const res = await adminApi.getClinics({ limit: 50 });
        if (Array.isArray(res?.clinics)) {
          setPlatformClinics(res.clinics);
          if (res.clinics.length > 0) {
            setAddForm((prev) => ({
              ...prev,
              selectedPlatformClinicId: res.clinics[0].id,
              name: res.clinics[0].name,
              address: res.clinics[0].line1 || res.clinics[0].address || 'Kolkata',
              city: res.clinics[0].city || 'Kolkata',
              phone: res.clinics[0].phone || '+91 33 2200 1100',
            }));
          }
        }
      } catch (err) {
        console.warn('Notice loading website clinics:', err);
      }
    };
    fetchPlatformClinics();
  }, []);

  // Listen to clinics updates
  useEffect(() => {
    const handleUpdate = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setAssociatedClinics(e.detail);
        if (!selectedClinicId && e.detail.length > 0) {
          setSelectedClinicId(e.detail[0].id);
        }
      }
    };
    window.addEventListener('oshud_doctor_clinics_updated', handleUpdate);
    return () => {
      window.removeEventListener('oshud_doctor_clinics_updated', handleUpdate);
    };
  }, [selectedClinicId]);

  // Selected clinic object
  const selectedClinic =
    associatedClinics.find((c) => c.id === selectedClinicId) || associatedClinics[0] || null;

  // Handle selecting a platform clinic in the Add modal dropdown
  const handlePlatformClinicSelect = (clinicId) => {
    const found = platformClinics.find((c) => c.id === clinicId);
    if (found) {
      setAddForm((prev) => ({
        ...prev,
        selectedPlatformClinicId: clinicId,
        name: found.name,
        address: found.line1 || found.address || `${found.city}`,
        city: found.city || 'Kolkata',
        phone: found.phone || '+91 33 2200 1100',
        chamber: found.settings?.chamberCount ? `Room 201` : 'Room 204 (2nd Floor)',
      }));
    } else {
      setAddForm((prev) => ({ ...prev, selectedPlatformClinicId: clinicId }));
    }
  };

  // Submit Add Associated Clinic
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!addForm.name) {
      addToast('Please enter clinic name.', 'error');
      return;
    }

    const newClinic = doctorApi.addAssociatedClinic(doctorId, {
      name: addForm.name,
      address: addForm.address,
      city: addForm.city,
      phone: addForm.phone,
      chamber: addForm.chamber,
      phoneExt: addForm.phoneExt,
      consultationFee: addForm.consultationFee,
      deskStaff: addForm.deskStaff,
    });

    setAssociatedClinics(newClinic);
    setSelectedClinicId(newClinic[0]?.id || null);
    setShowAddModal(false);
    addToast(`${addForm.name} added to your Associated Clinics!`, 'success');
  };

  // Open Edit Schedule Modal for currently selected clinic
  const handleOpenEditSchedule = (clinic) => {
    const target = clinic || selectedClinic;
    if (!target) return;
    const initialSchedule = (target.schedule && target.schedule.length > 0)
      ? target.schedule.map((s) => ({ ...s }))
      : DAYS_OF_WEEK.map((d) => ({
          day: d,
          morning: '09:30 AM – 01:30 PM',
          evening: d === 'Sunday' ? 'Weekly Off' : '05:00 PM – 08:30 PM',
          isOff: d === 'Sunday',
        }));
    setEditingSchedule(initialSchedule);
    setShowEditScheduleModal(true);
  };

  // Save Modified Schedule
  const handleSaveSchedule = (e) => {
    e.preventDefault();
    if (!selectedClinic) return;

    const updated = doctorApi.updateClinicDetails(doctorId, selectedClinic.id, {
      schedule: editingSchedule,
    });
    setAssociatedClinics(updated);
    setShowEditScheduleModal(false);
    addToast(`Weekly timetable updated for ${selectedClinic.name}!`, 'success');
  };

  // Open Edit Clinic Info Modal
  const handleOpenEditClinic = (clinic, e) => {
    if (e) e.stopPropagation();
    setEditClinicForm({
      id: clinic.id,
      name: clinic.name,
      chamber: clinic.chamber,
      phoneExt: clinic.phoneExt,
      consultationFee: clinic.consultationFee,
      deskStaff: clinic.deskStaff || 'Reception Desk Coordinator',
    });
    setShowEditClinicModal(true);
  };

  // Save Edit Clinic Info
  const handleSaveClinicInfo = (e) => {
    e.preventDefault();
    const updated = doctorApi.updateClinicDetails(doctorId, editClinicForm.id, {
      name: editClinicForm.name,
      chamber: editClinicForm.chamber,
      phoneExt: editClinicForm.phoneExt,
      consultationFee: Number(editClinicForm.consultationFee),
      deskStaff: editClinicForm.deskStaff,
    });
    setAssociatedClinics(updated);
    setShowEditClinicModal(false);
    addToast('Clinic details updated!', 'success');
  };

  // Remove Clinic
  const handleRemoveClinic = (clinicId, clinicName, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to unlink ${clinicName} from your associated clinics?`)) {
      return;
    }
    const updated = doctorApi.removeAssociatedClinic(doctorId, clinicId);
    setAssociatedClinics(updated);
    if (selectedClinicId === clinicId) {
      setSelectedClinicId(updated[0]?.id || null);
    }
    addToast(`${clinicName} unlinked from your associated clinics.`, 'info');
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-forest-900">
            Associated Clinics & Practice Schedule
          </h1>
          <p className="text-xs text-brandText-secondary mt-0.5">
            Manage your affiliated polyclinics, chamber room assignments, and configure your weekly consultation schedule.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={Plus}
          onClick={() => setShowAddModal(true)}
          className="text-xs font-bold shadow-sm"
        >
          Add Associated Clinic
        </Button>
      </div>

      {/* Associated Clinics Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-heading font-bold text-forest-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-forest-600" />
            <span>Associated Clinics ({associatedClinics.length})</span>
          </h2>
          <span className="text-xs text-brandText-secondary">
            Click on any clinic to view and edit its consultation schedule below
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {associatedClinics.map((clinic) => {
            const isSelected = selectedClinic?.id === clinic.id;
            return (
              <div
                key={clinic.id}
                onClick={() => setSelectedClinicId(clinic.id)}
                className={`group bg-surface-pure rounded-3xl border-2 p-6 space-y-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-forest-600 shadow-card bg-forest-50/20'
                    : 'border-brandBorder-subtle shadow-subtle hover:border-forest-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-3 rounded-2xl ${
                        isSelected ? 'bg-forest-800 text-white' : 'bg-forest-50 text-forest-700'
                      }`}
                    >
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-base text-forest-900 group-hover:text-forest-700 transition-colors">
                        {clinic.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-100 text-forest-800 uppercase">
                          {clinic.status?.replace('_', ' ') || 'AFFILIATED'}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Active Schedule Selected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Edit / Remove controls */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => handleOpenEditClinic(clinic, e)}
                      className="p-1.5 rounded-lg text-brandText-muted hover:text-forest-800 hover:bg-surface-warm"
                      title="Edit Chamber Info"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {associatedClinics.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => handleRemoveClinic(clinic.id, clinic.name, e)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                        title="Unlink Clinic"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-brandText-secondary">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-forest-600 flex-shrink-0 mt-0.5" />
                    <span>{clinic.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-forest-600 flex-shrink-0" />
                    <span>{clinic.phone} &bull; Ext: {clinic.phoneExt || 'Chamber Ext'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-forest-600 flex-shrink-0" />
                    <span>Reception Coordinator: {clinic.deskStaff || 'Receptionist Desk'}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-brandBorder-subtle flex items-center justify-between text-xs">
                  <div>
                    <p className="text-[10px] text-brandText-muted uppercase">Chamber & Fee</p>
                    <p className="font-extrabold text-sm text-forest-900">
                      {clinic.chamber} &bull; ₹{clinic.consultationFee}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedClinicId(clinic.id);
                      handleOpenEditSchedule(clinic);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-forest-800 hover:bg-forest-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Edit Schedule</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= SECTION 2: EMBEDDED WEEKLY SCHEDULE ================= */}
      {selectedClinic && (
        <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brandBorder-subtle pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-forest-700" />
                <h3 className="font-heading font-extrabold text-lg sm:text-xl text-forest-900">
                  Weekly Consultation Timetable
                </h3>
              </div>
              <p className="text-xs text-brandText-secondary mt-1">
                Showing consultation hours for: <strong className="text-forest-900">{selectedClinic.name}</strong> ({selectedClinic.chamber}).
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              leftIcon={Edit2}
              onClick={() => handleOpenEditSchedule(selectedClinic)}
              className="text-xs font-bold border-forest-600 text-forest-800 hover:bg-forest-50 self-start sm:self-auto"
            >
              Modify Weekly Schedule
            </Button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-brandBorder-subtle">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-warm border-b border-brandBorder-subtle">
                  <th className="p-3.5 font-bold text-forest-900">Day</th>
                  <th className="p-3.5 font-bold text-forest-900">Chamber Shift 1 (Morning)</th>
                  <th className="p-3.5 font-bold text-forest-900">Chamber Shift 2 (Evening)</th>
                  <th className="p-3.5 font-bold text-forest-900 text-right">Consultation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brandBorder-subtle">
                {(selectedClinic.schedule || []).map((slot) => (
                  <tr key={slot.day} className={`hover:bg-forest-50/20 ${slot.isOff ? 'bg-slate-50/50' : ''}`}>
                    <td className="p-3.5 font-bold text-forest-900">{slot.day}</td>
                    <td className="p-3.5 font-medium text-forest-800">
                      {slot.isOff ? 'Chamber Closed' : slot.morning || '09:30 AM – 01:30 PM'}
                    </td>
                    <td className="p-3.5 font-medium text-forest-800">
                      {slot.isOff ? 'Chamber Closed' : slot.evening || '05:00 PM – 08:30 PM'}
                    </td>
                    <td className="p-3.5 text-right">
                      {slot.isOff ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          Weekly Off
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Consulting
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD ASSOCIATED CLINIC ================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-forest-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-floating max-w-lg w-full p-6 space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-brandBorder-subtle pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-forest-100 text-forest-800">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-lg text-forest-900">
                    Add Associated Polyclinic
                  </h3>
                  <p className="text-xs text-brandText-secondary">
                    Select a clinic already registered on the website or enter clinic details.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-xl text-brandText-muted hover:text-forest-900 hover:bg-surface-warm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              {/* Select from existing registered clinics */}
              {platformClinics.length > 0 && (
                <div>
                  <label className="font-bold text-forest-800">
                    Choose from Website Registered Clinics
                  </label>
                  <select
                    value={addForm.selectedPlatformClinicId}
                    onChange={(e) => handlePlatformClinicSelect(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-surface-warm border border-brandBorder-subtle rounded-xl font-medium focus:outline-none focus:border-forest-500"
                  >
                    {platformClinics.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} &mdash; {c.city} ({c.line1 || 'Main Clinic'})
                      </option>
                    ))}
                    <option value="CUSTOM">+ Enter Custom Polyclinic Name</option>
                  </select>
                </div>
              )}

              <div>
                <label className="font-bold text-forest-800">Clinic Name *</label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="e.g. Apollo Clinic & Polyclinic"
                  className="w-full mt-1 px-3 py-2 bg-surface-warm border border-brandBorder-subtle rounded-xl font-medium focus:outline-none focus:border-forest-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-forest-800">Address / Area</label>
                  <input
                    type="text"
                    value={addForm.address}
                    onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                    placeholder="Sector 1, Salt Lake City"
                    className="w-full mt-1 px-3 py-2 bg-surface-warm border border-brandBorder-subtle rounded-xl font-medium focus:outline-none focus:border-forest-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-forest-800">City</label>
                  <input
                    type="text"
                    value={addForm.city}
                    onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
                    placeholder="Kolkata"
                    className="w-full mt-1 px-3 py-2 bg-surface-warm border border-brandBorder-subtle rounded-xl font-medium focus:outline-none focus:border-forest-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-forest-800">Chamber Room *</label>
                  <input
                    type="text"
                    required
                    value={addForm.chamber}
                    onChange={(e) => setAddForm({ ...addForm, chamber: e.target.value })}
                    placeholder="Room 204 (2nd Floor)"
                    className="w-full mt-1 px-3 py-2 bg-surface-warm border border-brandBorder-subtle rounded-xl font-medium focus:outline-none focus:border-forest-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-forest-800">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={addForm.consultationFee}
                    onChange={(e) => setAddForm({ ...addForm, consultationFee: e.target.value })}
                    placeholder="600"
                    className="w-full mt-1 px-3 py-2 bg-surface-warm border border-brandBorder-subtle rounded-xl font-medium focus:outline-none focus:border-forest-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-forest-800">Phone Ext</label>
                  <input
                    type="text"
                    value={addForm.phoneExt}
                    onChange={(e) => setAddForm({ ...addForm, phoneExt: e.target.value })}
                    placeholder="Ext 204"
                    className="w-full mt-1 px-3 py-2 bg-surface-warm border border-brandBorder-subtle rounded-xl font-medium focus:outline-none focus:border-forest-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-forest-800">Contact / Phone</label>
                  <input
                    type="tel"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    placeholder="+91 33 4012 3456"
                    className="w-full mt-1 px-3 py-2 bg-surface-warm border border-brandBorder-subtle rounded-xl font-medium focus:outline-none focus:border-forest-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-brandBorder-subtle">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  leftIcon={Plus}
                  className="font-bold shadow-md"
                >
                  Add Clinic
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT WEEKLY SCHEDULE ================= */}
      {showEditScheduleModal && selectedClinic && (
        <div className="fixed inset-0 z-50 bg-forest-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-floating max-w-xl w-full p-6 space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-brandBorder-subtle pb-3">
              <div>
                <h3 className="font-heading font-extrabold text-lg text-forest-900">
                  Edit Schedule for {selectedClinic.name}
                </h3>
                <p className="text-xs text-brandText-secondary mt-0.5">
                  Configure your morning and evening shifts or mark days off.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditScheduleModal(false)}
                className="p-1 rounded-xl text-brandText-muted hover:text-forest-900 hover:bg-surface-warm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-3.5 text-xs">
              <div className="space-y-3">
                {editingSchedule.map((slot, idx) => (
                  <div
                    key={slot.day}
                    className={`p-3 rounded-2xl border transition-all ${
                      slot.isOff
                        ? 'bg-slate-50 border-slate-200 opacity-80'
                        : 'bg-surface-warm border-brandBorder-subtle'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-forest-900 text-sm">{slot.day}</span>
                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-forest-800">
                        <input
                          type="checkbox"
                          checked={!slot.isOff}
                          onChange={(e) => {
                            const updated = [...editingSchedule];
                            updated[idx].isOff = !e.target.checked;
                            setEditingSchedule(updated);
                          }}
                          className="rounded text-forest-700 focus:ring-forest-500 w-4 h-4"
                        />
                        <span>{slot.isOff ? 'Day Off' : 'Active Shift'}</span>
                      </label>
                    </div>

                    {!slot.isOff && (
                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <div>
                          <label className="text-[10px] font-bold text-forest-800">Morning Shift</label>
                          <input
                            type="text"
                            value={slot.morning}
                            onChange={(e) => {
                              const updated = [...editingSchedule];
                              updated[idx].morning = e.target.value;
                              setEditingSchedule(updated);
                            }}
                            placeholder="09:30 AM – 01:30 PM"
                            className="w-full mt-0.5 px-2.5 py-1.5 bg-surface-pure border border-brandBorder-subtle rounded-xl text-xs font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-forest-800">Evening Shift</label>
                          <input
                            type="text"
                            value={slot.evening}
                            onChange={(e) => {
                              const updated = [...editingSchedule];
                              updated[idx].evening = e.target.value;
                              setEditingSchedule(updated);
                            }}
                            placeholder="05:00 PM – 08:30 PM"
                            className="w-full mt-0.5 px-2.5 py-1.5 bg-surface-pure border border-brandBorder-subtle rounded-xl text-xs font-medium"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-brandBorder-subtle">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditScheduleModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  leftIcon={Save}
                  className="font-bold shadow-md"
                >
                  Save Weekly Schedule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT CLINIC DETAILS ================= */}
      {showEditClinicModal && (
        <div className="fixed inset-0 z-50 bg-forest-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-floating max-w-sm w-full p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-brandBorder-subtle pb-3">
              <h3 className="font-heading font-extrabold text-base text-forest-900">
                Edit Chamber Details
              </h3>
              <button
                type="button"
                onClick={() => setShowEditClinicModal(false)}
                className="p-1 rounded-xl text-brandText-muted hover:text-forest-900 hover:bg-surface-warm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClinicInfo} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-forest-800">Clinic Name</label>
                <input
                  type="text"
                  required
                  value={editClinicForm.name}
                  onChange={(e) => setEditClinicForm({ ...editClinicForm, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-surface-warm border border-brandBorder-subtle rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-forest-800">Chamber Room</label>
                <input
                  type="text"
                  required
                  value={editClinicForm.chamber}
                  onChange={(e) => setEditClinicForm({ ...editClinicForm, chamber: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-surface-warm border border-brandBorder-subtle rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-forest-800">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    value={editClinicForm.consultationFee}
                    onChange={(e) => setEditClinicForm({ ...editClinicForm, consultationFee: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-surface-warm border border-brandBorder-subtle rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-forest-800">Phone Ext</label>
                  <input
                    type="text"
                    value={editClinicForm.phoneExt}
                    onChange={(e) => setEditClinicForm({ ...editClinicForm, phoneExt: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-surface-warm border border-brandBorder-subtle rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-brandBorder-subtle">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditClinicModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  leftIcon={Save}
                  className="font-bold shadow-md"
                >
                  Save Details
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorClinicsPage;
