import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Stethoscope,
  Building2,
  Clock,
  Phone,
  AlertCircle,
  Plus,
  Trash2,
  UserCheck,
  CheckCircle,
  X,
  Search,
  ShieldCheck,
  DollarSign,
  UserPlus,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import StatusBadge from '../../components/workspace/StatusBadge';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import { clinicApi } from '../../services/api/clinic.api';

export const ReceptionistDoctorsPage = ({ initialTab = 'roster' }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Determine active tab from props, route pathname, or search query
  const resolveCurrentTab = () => {
    if (initialTab === 'manage') return 'manage';
    if (location.pathname.includes('manage-doctors')) return 'manage';
    if (searchParams.get('tab') === 'manage') return 'manage';
    return 'roster';
  };

  const [activeTab, setActiveTab] = useState(resolveCurrentTab);

  // Sync activeTab whenever route or search query updates
  useEffect(() => {
    setActiveTab(resolveCurrentTab());
  }, [location.pathname, searchParams, initialTab]);

  const { tokens, callNextToken } = useWorkspaceStore();
  const { addToast } = useToast();

  const [clinic, setClinic] = useState({ name: 'Apollo Clinic & Polyclinic', city: 'Kolkata' });
  const [clinicDoctors, setClinicDoctors] = useState([]);
  const [availablePlatformDoctors, setAvailablePlatformDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search in manage tab
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState('EXISTING'); // 'EXISTING' or 'NEW'
  const [doctorToRemove, setDoctorToRemove] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Existing Form
  const [existingForm, setExistingForm] = useState({
    selectedDoctorId: '',
    room: 'Room 212 (2nd Floor)',
    shift: '10:00 AM – 02:00 PM',
    fee: 500,
    phoneExt: 'Ext 212',
  });

  // Add New Form
  const [newDoctorForm, setNewDoctorForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    specialization: 'General Physician',
    qualifications: 'MBBS, MD',
    registrationNumber: '',
    room: 'Room 214 (2nd Floor)',
    shift: '09:30 AM – 01:30 PM',
    fee: 500,
    phoneExt: 'Ext 214',
    experienceYears: 5,
  });

  // Tab change handler updates both state and URL
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'manage') {
      navigate('/receptionist/manage-doctors');
    } else {
      navigate('/receptionist/doctors');
    }
  };

  // Load clinic data and platform doctors
  const loadData = async () => {
    setLoading(true);
    try {
      const [profile, docs, availDocs] = await Promise.all([
        clinicApi.getClinicProfile(user),
        clinicApi.getClinicDoctors(user?.id || 'default'),
        clinicApi.getAvailablePlatformDoctors(user?.id || 'default'),
      ]);

      setClinic(profile);
      setClinicDoctors(docs);
      setAvailablePlatformDoctors(availDocs);

      if (availDocs.length > 0) {
        setExistingForm((prev) => ({ ...prev, selectedDoctorId: availDocs[0].id }));
      }
    } catch (err) {
      console.warn('Failed to load clinic doctor roster:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleRosterUpdate = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setClinicDoctors(e.detail);
        clinicApi.getAvailablePlatformDoctors(user?.id || 'default').then(setAvailablePlatformDoctors);
      } else {
        loadData();
      }
    };

    window.addEventListener('oshud_clinic_doctors_updated', handleRosterUpdate);
    return () => {
      window.removeEventListener('oshud_clinic_doctors_updated', handleRosterUpdate);
    };
  }, [user]);

  // Handle Adding Doctor with Duplicate Prevention & Loading Spinner
  const handleAddDoctorSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (addMode === 'EXISTING') {
        if (!existingForm.selectedDoctorId) {
          addToast('Please select a doctor to assign.', 'error');
          setIsSubmitting(false);
          return;
        }

        const found = availablePlatformDoctors.find((d) => d.id === existingForm.selectedDoctorId);
        if (!found) {
          addToast('Selected doctor is either invalid or already assigned.', 'error');
          setIsSubmitting(false);
          return;
        }

        // Duplicate guard
        const alreadyInClinic = clinicDoctors.some(
          (cd) =>
            cd.id === found.id ||
            cd.doctorId === found.id ||
            (found.email && cd.email && cd.email.toLowerCase() === found.email.toLowerCase()) ||
            (found.phone && cd.phone && cd.phone === found.phone)
        );

        if (alreadyInClinic) {
          addToast(`Dr. ${found.fullName || found.name} is already assigned to this clinic!`, 'error');
          setIsSubmitting(false);
          return;
        }

        await clinicApi.addDoctorToClinic(user?.id || 'default', {
          isExisting: true,
          existingDoctor: found,
          room: existingForm.room,
          shift: existingForm.shift,
          fee: existingForm.fee,
          phoneExt: existingForm.phoneExt,
        });

        addToast(`${found.fullName || found.name} linked to ${clinic.name} roster!`, 'success');
      } else {
        // Mode B: Registering a new doctor in backend
        if (!newDoctorForm.fullName || !newDoctorForm.phone || !newDoctorForm.password) {
          addToast('Please provide doctor name, phone, and password.', 'error');
          setIsSubmitting(false);
          return;
        }

        const cleanPhone = newDoctorForm.phone.replace(/[^0-9]/g, '');
        const cleanEmail = newDoctorForm.email ? newDoctorForm.email.toLowerCase() : null;

        // Duplicate guard
        const alreadyExists = clinicDoctors.some(
          (cd) =>
            (cleanPhone && cd.phone && cd.phone.replace(/[^0-9]/g, '') === cleanPhone) ||
            (cleanEmail && cd.email && cd.email.toLowerCase() === cleanEmail)
        );

        if (alreadyExists) {
          addToast(
            `A doctor with phone ${newDoctorForm.phone} or email ${newDoctorForm.email} already exists in this clinic.`,
            'error'
          );
          setIsSubmitting(false);
          return;
        }

        await clinicApi.addDoctorToClinic(user?.id || 'default', {
          isNew: true,
          ...newDoctorForm,
        });

        addToast(
          `Dr. ${newDoctorForm.fullName} successfully registered and added to clinic roster!`,
          'success'
        );
      }

      setShowAddModal(false);
      await loadData();
    } catch (error) {
      addToast(error.message || 'Failed to add doctor to clinic.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Removing Doctor
  const handleConfirmRemoveDoctor = async () => {
    if (!doctorToRemove) return;
    try {
      await clinicApi.removeDoctorFromClinic(user?.id || 'default', doctorToRemove.id);
      addToast(`${doctorToRemove.name} removed from clinic roster.`, 'success');
      setDoctorToRemove(null);
      await loadData();
    } catch (error) {
      addToast(error.message || 'Failed to remove doctor.', 'error');
    }
  };

  // Filtered doctors for manage list
  const filteredClinicDoctors = clinicDoctors.filter((doc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.name?.toLowerCase().includes(q) ||
      doc.specialty?.toLowerCase().includes(q) ||
      doc.room?.toLowerCase().includes(q) ||
      doc.phone?.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header with Title and Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-heading font-extrabold text-forest-900">
              Clinic Doctor Roster & Chamber Management
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-100 text-forest-800 uppercase">
              {clinic.name}
            </span>
          </div>
          <p className="text-xs text-brandText-secondary mt-0.5">
            Real-time room occupancy, live consulting tokens, and add/remove clinic doctor personnel.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-2 bg-surface-warm p-1.5 rounded-2xl border border-brandBorder-subtle self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleTabChange('roster')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'roster'
                ? 'bg-forest-800 text-white shadow-sm'
                : 'text-brandText-secondary hover:text-forest-900 hover:bg-surface-pure'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Doctor Availability ({clinicDoctors.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('manage')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'manage'
                ? 'bg-forest-800 text-white shadow-sm'
                : 'text-brandText-secondary hover:text-forest-900 hover:bg-surface-pure'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add / Remove Doctors</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle p-12 text-center space-y-3 shadow-card">
          <Loader2 className="w-8 h-8 text-forest-700 animate-spin mx-auto" />
          <p className="text-xs font-bold text-forest-900">Loading Clinic Doctor Roster...</p>
          <p className="text-[11px] text-brandText-secondary">Synchronizing doctor chambers and credentials</p>
        </div>
      ) : activeTab === 'roster' ? (
        /* ================= TAB 1: DOCTOR AVAILABILITY & CHAMBERS ================= */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clinicDoctors.map((doc) => {
              const docTokens = tokens.filter(
                (t) =>
                  t.doctorId === doc.id ||
                  t.doctorId === doc.doctorId ||
                  (t.doctorName && doc.name && t.doctorName.toLowerCase().includes(doc.name.toLowerCase())) ||
                  (doc.name && t.doctorName && doc.name.toLowerCase().includes(t.doctorName.toLowerCase()))
              );

              const serving = docTokens.find((t) => t.status === 'SERVING');
              const waiting = docTokens.filter((t) => t.status === 'WAITING');

              return (
                <div
                  key={doc.id}
                  className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 space-y-4 hover:border-forest-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-heading font-extrabold text-base text-forest-900">
                          {doc.name}
                        </h3>
                        <p className="text-xs text-forest-700 font-semibold">
                          {doc.specialty || doc.specialization}
                        </p>
                        <p className="text-[11px] text-brandText-secondary mt-0.5">
                          {doc.room} &bull; {doc.phoneExt || 'Chamber Ext'} &bull; {doc.qualifications || 'MBBS'}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          serving
                            ? 'bg-emerald-100 text-emerald-800'
                            : doc.status === 'ON_BREAK'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {serving ? 'CONSULTING' : doc.status ? doc.status.replace('_', ' ') : 'AVAILABLE'}
                      </span>
                    </div>

                    <div className="p-3.5 bg-surface-warm rounded-2xl border border-brandBorder-subtle flex items-center justify-between text-xs">
                      <div>
                        <p className="text-[10px] text-brandText-muted uppercase">Now In Chamber</p>
                        <p className="font-mono font-extrabold text-forest-900 text-sm mt-0.5">
                          {serving ? `Token #${serving.tokenNumber}` : 'Chamber Free'}
                        </p>
                        <p className="text-[11px] text-forest-800 font-semibold truncate max-w-[150px]">
                          {serving?.patientName || 'Awaiting patient'}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] text-brandText-muted uppercase">Lobby Waiting</p>
                        <p className="font-bold text-forest-900 text-sm mt-0.5 font-mono">
                          {waiting.length} Patients
                        </p>
                        <p className="text-[10px] text-brandText-secondary">
                          Fee: ₹{doc.fee || 500}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-brandBorder-subtle flex items-center justify-between text-xs text-brandText-secondary">
                    <span>
                      Shift: <strong>{doc.shift || '10:00 AM – 02:00 PM'}</strong>
                    </span>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        callNextToken(doc.id);
                        addToast(`Summoned next token for ${doc.name}!`, 'success');
                      }}
                      className="text-xs py-1"
                    >
                      Call Next
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ================= TAB 2: MANAGE CLINIC DOCTORS (ADD / REMOVE) ================= */
        <div className="space-y-6">
          <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 space-y-5">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brandBorder-subtle pb-4">
              <div>
                <h2 className="font-heading font-extrabold text-base text-forest-900">
                  Clinic Doctor Staff Directory
                </h2>
                <p className="text-xs text-brandText-secondary">
                  Add consulting physicians to this facility or remove doctors from active clinic rosters
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-brandText-muted" />
                  <input
                    type="text"
                    placeholder="Search doctor or chamber..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                  />
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={Plus}
                  onClick={() => setShowAddModal(true)}
                  className="text-xs font-bold"
                >
                  Add Doctor to Clinic
                </Button>
              </div>
            </div>

            {/* Doctors Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-brandBorder-subtle text-brandText-muted font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Doctor Profile</th>
                    <th className="py-3 px-3">Specialization</th>
                    <th className="py-3 px-3">Chamber & Floor</th>
                    <th className="py-3 px-3">Consulting Shift</th>
                    <th className="py-3 px-3">Consult Fee</th>
                    <th className="py-3 px-3">Contact</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brandBorder-subtle">
                  {filteredClinicDoctors.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-brandText-secondary">
                        No clinic doctors found. Click <strong>Add Doctor to Clinic</strong> to link doctors.
                      </td>
                    </tr>
                  ) : (
                    filteredClinicDoctors.map((doc) => (
                      <tr key={doc.id} className="hover:bg-surface-warm/50 transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center font-bold text-xs">
                              {doc.name ? doc.name.replace('Dr.', '').trim().charAt(0) : 'D'}
                            </div>
                            <div>
                              <p className="font-bold text-forest-900">{doc.name}</p>
                              <p className="text-[10px] text-brandText-secondary">
                                Reg: {doc.registrationNumber || 'WBMC-REG'} &bull; {doc.qualifications || 'MBBS'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="font-medium text-forest-800">
                            {doc.specialty || doc.specialization}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="font-mono font-bold text-forest-900 bg-surface-warm px-2 py-0.5 rounded-lg border border-brandBorder-subtle">
                            {doc.room}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="text-forest-700 font-medium">
                            {doc.shift || '10:00 AM – 02:00 PM'}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="font-bold text-forest-900">
                            ₹{doc.fee || 500}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <p className="text-forest-800">{doc.phone || 'Ext: ' + (doc.phoneExt || '204')}</p>
                          <p className="text-[10px] text-brandText-muted">{doc.email || '—'}</p>
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setDoctorToRemove(doc)}
                            className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors inline-flex items-center gap-1 font-bold text-xs"
                            title="Remove Doctor from Clinic"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Remove</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADD DOCTOR MODAL ================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-forest-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-floating max-w-xl w-full p-6 space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-brandBorder-subtle pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-forest-50 text-forest-800 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-base text-forest-900">
                    Add Doctor to {clinic.name}
                  </h3>
                  <p className="text-xs text-brandText-secondary">
                    Attach registered platform doctor or onboard a new doctor profile
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-brandText-muted hover:text-forest-900 hover:bg-surface-warm disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-2 gap-2 bg-surface-warm p-1.5 rounded-2xl border border-brandBorder-subtle text-xs font-bold">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setAddMode('EXISTING')}
                className={`py-2 rounded-xl transition-all ${
                  addMode === 'EXISTING'
                    ? 'bg-forest-800 text-white shadow-sm'
                    : 'text-brandText-secondary hover:text-forest-900'
                }`}
              >
                Attach Platform Doctor
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setAddMode('NEW')}
                className={`py-2 rounded-xl transition-all ${
                  addMode === 'NEW'
                    ? 'bg-forest-800 text-white shadow-sm'
                    : 'text-brandText-secondary hover:text-forest-900'
                }`}
              >
                Onboard & Register New Doctor
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddDoctorSubmit} className="space-y-4">
              {addMode === 'EXISTING' ? (
                <>
                  {availablePlatformDoctors.length === 0 ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-4 h-4 text-amber-700" />
                        <span>All Platform Doctors Already Assigned</span>
                      </div>
                      <p className="text-[11px] text-amber-800">
                        Every registered platform doctor is already in your clinic roster. To assign another doctor, select <strong>Onboard & Register New Doctor</strong> above.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-bold text-forest-800">
                        Select Available Registered Doctor
                      </label>
                      <select
                        required
                        disabled={isSubmitting}
                        value={existingForm.selectedDoctorId}
                        onChange={(e) =>
                          setExistingForm({ ...existingForm, selectedDoctorId: e.target.value })
                        }
                        className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium disabled:opacity-50"
                      >
                        {availablePlatformDoctors.map((doc) => (
                          <option key={doc.id} value={doc.id}>
                            {doc.fullName || doc.name} — {doc.specialization || doc.specialty || 'General Physician'} ({doc.phone || doc.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-forest-800">Chamber Room</label>
                      <input
                        type="text"
                        required
                        disabled={isSubmitting}
                        value={existingForm.room}
                        onChange={(e) => setExistingForm({ ...existingForm, room: e.target.value })}
                        placeholder="e.g. Room 212 (2nd Floor)"
                        className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-forest-800">Intercom Ext</label>
                      <input
                        type="text"
                        disabled={isSubmitting}
                        value={existingForm.phoneExt}
                        onChange={(e) =>
                          setExistingForm({ ...existingForm, phoneExt: e.target.value })
                        }
                        placeholder="e.g. Ext 212"
                        className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-forest-800">Consulting Shift</label>
                      <input
                        type="text"
                        required
                        disabled={isSubmitting}
                        value={existingForm.shift}
                        onChange={(e) => setExistingForm({ ...existingForm, shift: e.target.value })}
                        placeholder="e.g. 10:00 AM – 02:00 PM"
                        className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-forest-800">Consultation Fee (₹)</label>
                      <input
                        type="number"
                        required
                        min={0}
                        disabled={isSubmitting}
                        value={existingForm.fee}
                        onChange={(e) => setExistingForm({ ...existingForm, fee: e.target.value })}
                        placeholder="500"
                        className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium disabled:opacity-50"
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* Mode B: Registering New Doctor */
                <>
                  <div>
                    <label className="text-xs font-bold text-forest-800">Doctor Full Name</label>
                    <input
                      type="text"
                      required
                      disabled={isSubmitting}
                      value={newDoctorForm.fullName}
                      onChange={(e) =>
                        setNewDoctorForm({ ...newDoctorForm, fullName: e.target.value })
                      }
                      placeholder="e.g. Dr. Kaushik Sen"
                      className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium disabled:opacity-50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-forest-800">Phone Number (Login ID)</label>
                      <input
                        type="text"
                        required
                        disabled={isSubmitting}
                        value={newDoctorForm.phone}
                        onChange={(e) =>
                          setNewDoctorForm({ ...newDoctorForm, phone: e.target.value })
                        }
                        placeholder="9876543210"
                        className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-forest-800">Email Address</label>
                      <input
                        type="email"
                        disabled={isSubmitting}
                        value={newDoctorForm.email}
                        onChange={(e) =>
                          setNewDoctorForm({ ...newDoctorForm, email: e.target.value })
                        }
                        placeholder="doctor@gmail.com"
                        className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-forest-800">Password</label>
                      <input
                        type="password"
                        required
                        disabled={isSubmitting}
                        value={newDoctorForm.password}
                        onChange={(e) =>
                          setNewDoctorForm({ ...newDoctorForm, password: e.target.value })
                        }
                        placeholder="Min 6 characters"
                        className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-forest-800">Medical Reg No.</label>
                      <input
                        type="text"
                        disabled={isSubmitting}
                        value={newDoctorForm.registrationNumber}
                        onChange={(e) =>
                          setNewDoctorForm({
                            ...newDoctorForm,
                            registrationNumber: e.target.value,
                          })
                        }
                        placeholder="e.g. WBMC-84291"
                        className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-forest-800">Specialization</label>
                      <input
                        type="text"
                        disabled={isSubmitting}
                        value={newDoctorForm.specialization}
                        onChange={(e) =>
                          setNewDoctorForm({ ...newDoctorForm, specialization: e.target.value })
                        }
                        placeholder="e.g. Orthopedics, Cardiology"
                        className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-forest-800">Qualifications</label>
                      <input
                        type="text"
                        disabled={isSubmitting}
                        value={newDoctorForm.qualifications}
                        onChange={(e) =>
                          setNewDoctorForm({ ...newDoctorForm, qualifications: e.target.value })
                        }
                        placeholder="e.g. MBBS, MS (Ortho)"
                        className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-forest-800">Chamber Room</label>
                      <input
                        type="text"
                        required
                        disabled={isSubmitting}
                        value={newDoctorForm.room}
                        onChange={(e) =>
                          setNewDoctorForm({ ...newDoctorForm, room: e.target.value })
                        }
                        placeholder="Room 214"
                        className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-forest-800">Consultation Fee (₹)</label>
                      <input
                        type="number"
                        required
                        min={0}
                        disabled={isSubmitting}
                        value={newDoctorForm.fee}
                        onChange={(e) =>
                          setNewDoctorForm({ ...newDoctorForm, fee: e.target.value })
                        }
                        placeholder="500"
                        className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium disabled:opacity-50"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-brandBorder-subtle flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => setShowAddModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting || (addMode === 'EXISTING' && availablePlatformDoctors.length === 0)}
                  leftIcon={isSubmitting ? Loader2 : Plus}
                  className={`text-xs font-bold shadow-md ${isSubmitting ? 'cursor-not-allowed opacity-90' : ''}`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{addMode === 'EXISTING' ? 'Linking Doctor...' : 'Registering Doctor...'}</span>
                    </span>
                  ) : addMode === 'EXISTING' ? (
                    'Link Doctor to Clinic'
                  ) : (
                    'Register & Link Doctor'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= REMOVE DOCTOR CONFIRMATION MODAL ================= */}
      {doctorToRemove && (
        <div className="fixed inset-0 z-50 bg-forest-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-floating max-w-sm w-full p-6 text-center space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-heading font-extrabold text-base text-forest-900">
                Remove Doctor from Clinic?
              </h3>
              <p className="text-xs text-brandText-secondary mt-1">
                Are you sure you want to remove <strong>{doctorToRemove.name}</strong> from{' '}
                <strong>{clinic.name}</strong> roster? Their consultations and chamber room assignment will be unlinked.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDoctorToRemove(null)}
                className="flex-1 text-xs"
              >
                Keep Doctor
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmRemoveDoctor}
                className="flex-1 text-xs font-bold"
              >
                Yes, Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistDoctorsPage;
