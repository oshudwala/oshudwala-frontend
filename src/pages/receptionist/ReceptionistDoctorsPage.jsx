import React, { useState, useEffect, useMemo } from 'react';
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
  CheckCircle2,
  X,
  Search,
  ShieldCheck,
  DollarSign,
  UserPlus,
  Loader2,
  AlertTriangle,
  Edit3,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CalendarPlus,
  Check,
  Filter,
  CalendarDays,
  Layers,
  Power,
  RefreshCw,
  FileText,
  Calendar,
} from 'lucide-react';
import StatusBadge from '../../components/workspace/StatusBadge';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import ImageDropzone from '../../components/common/ImageDropzone';
import { clinicApi } from '../../services/api/clinic.api';
import doctorApi from '../../services/api/doctor.api';
import { adminApi } from '../../services/api/admin.api';
import accountRegistry from '../../services/api/accountRegistry';

const SCHEDULE_TYPES = [
  {
    id: 'DAILY',
    title: 'Daily',
    description: 'Available every day (Monday to Sunday)',
    badge: 'Daily',
  },
  {
    id: 'WEEKLY_CUSTOM',
    title: 'Weekly (Custom Days)',
    description: 'Select specific recurring days each week',
    badge: 'Weekly Custom',
  },
  {
    id: 'WEEKLY_SPECIFIC_DAY',
    title: 'Weekly (Specific Day)',
    description: 'Recurring consultation on one designated weekday',
    badge: 'Weekly Recurring',
  },
  {
    id: 'MONTHLY_SPECIFIC_DATES',
    title: 'Monthly (Specific Dates)',
    description: 'Consultations on fixed calendar dates each month (e.g. 1st, 15th)',
    badge: 'Monthly Dates',
  },
  {
    id: 'MONTHLY_SPECIFIC_WEEKDAY',
    title: 'Monthly (Specific Weekday)',
    description: 'Consultation on designated week occurrences (e.g. 1st & 3rd Saturday)',
    badge: 'Monthly Weekday',
  },
  {
    id: 'SPECIFIC_DATE_EXCEPTION',
    title: 'Specific Date (Exception)',
    description: 'One-off or special session date with custom notes',
    badge: 'One-off Exception',
  },
];

const STANDARD_TIME_SLOTS = [
  '08:00 AM',
  '08:30 AM',
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '12:30 PM',
  '01:00 PM',
  '01:30 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
  '05:00 PM',
  '05:30 PM',
  '06:00 PM',
  '06:30 PM',
  '07:00 PM',
  '07:30 PM',
  '08:00 PM',
  '08:30 PM',
  '09:00 PM',
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const FULL_WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTH_WEEKS = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Last Week'];

export const ReceptionistDoctorsPage = ({ initialTab = 'roster' }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Determine active tab from props, route pathname, or search query
  const resolveCurrentTab = () => {
    if (initialTab === 'assign') return 'assign';
    if (initialTab === 'manage') return 'manage';
    if (location.pathname.includes('assign-doctors')) return 'assign';
    if (location.pathname.includes('manage-doctors')) return 'manage';
    if (searchParams.get('tab') === 'assign') return 'assign';
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
  const [allPlatformDoctors, setAllPlatformDoctors] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search in manage tab
  const [searchQuery, setSearchQuery] = useState('');

  // Status toggling & submittings
  const [togglingStatusId, setTogglingStatusId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Modals state for Manage tab
  const [showAddModal, setShowAddModal] = useState(false);
  const [doctorToEdit, setDoctorToEdit] = useState(null);
  const [doctorToRemove, setDoctorToRemove] = useState(null);

  // Add Doctor Form state (matches Admin Panel parity with ImageDropzone and shift start/end)
  const [addDoctorForm, setAddDoctorForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    specialization: 'General Physician',
    qualifications: 'MBBS, MD',
    registrationNumber: '',
    experienceYears: '5',
    fee: '500',
    startTime: '09:30 AM',
    endTime: '01:30 PM',
    imageUrl: '',
  });

  // Edit Doctor Form state
  const [editDoctorForm, setEditDoctorForm] = useState({
    id: '',
    fullName: '',
    email: '',
    phone: '',
    specialization: '',
    qualifications: '',
    registrationNumber: '',
    experienceYears: '5',
    fee: '500',
    startTime: '09:30 AM',
    endTime: '01:30 PM',
    imageUrl: '',
  });

  // ================= ASSIGN DOCTORS TAB STATE =================
  const [assignView, setAssignView] = useState('wizard'); // 'wizard' | 'directory'
  const [assignStep, setAssignStep] = useState(1); // 1 = Clinic & Chamber, 2 = Doctor, 3 = Schedule & Fee, 4 = Review

  // Step 1: Chamber setup for this clinic
  const [assignChamber, setAssignChamber] = useState('Chamber 1 (Room 204)');
  const [assignPhoneExt, setAssignPhoneExt] = useState('Ext 204');

  // Step 2: Doctor selection
  const [assignSelectedDoctor, setAssignSelectedDoctor] = useState(null);
  const [assignDoctorSearch, setAssignDoctorSearch] = useState('');
  const [assignSpecFilter, setAssignSpecFilter] = useState('all');

  // Step 3: Fee & Schedule Setup
  const [assignFee, setAssignFee] = useState('500');
  const [assignStartTime, setAssignStartTime] = useState('10:00 AM');
  const [assignEndTime, setAssignEndTime] = useState('01:00 PM');
  const [assignCapacity, setAssignCapacity] = useState('25');
  const [assignScheduleType, setAssignScheduleType] = useState('WEEKLY_CUSTOM');

  const [assignWeeklyDays, setAssignWeeklyDays] = useState(['Mon', 'Wed', 'Fri']);
  const [assignWeeklyDay, setAssignWeeklyDay] = useState('Wednesday');
  const [assignMonthlyDates, setAssignMonthlyDates] = useState([1, 15]);
  const [assignMonthlyWeeks, setAssignMonthlyWeeks] = useState(['Week 1', 'Week 3']);
  const [assignMonthlyWeekday, setAssignMonthlyWeekday] = useState('Saturday');
  const [assignExceptionDate, setAssignExceptionDate] = useState('');
  const [assignExceptionNotes, setAssignExceptionNotes] = useState('');

  // Active directory search & deletion
  const [directorySearch, setDirectorySearch] = useState('');
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);

  // Tab change handler updates both state and URL
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'manage') {
      navigate('/receptionist/manage-doctors');
    } else if (tab === 'assign') {
      navigate('/receptionist/assign-doctors');
    } else {
      navigate('/receptionist/doctors');
    }
  };

  // Load clinic data, platform doctors and assignments
  const loadData = async () => {
    setLoading(true);
    try {
      const [profile, docs, availDocs, allEntities, allAssignments] = await Promise.all([
        clinicApi.getClinicProfile(user),
        clinicApi.getClinicDoctors(user?.id || 'default'),
        clinicApi.getAvailablePlatformDoctors(user?.id || 'default'),
        adminApi.fetchAllEntities(false),
        adminApi.getDoctorClinicAssignments(),
      ]);

      setClinic(profile);
      setClinicDoctors(docs);
      setAvailablePlatformDoctors(availDocs);
      setAllPlatformDoctors(allEntities.doctors || []);

      // Filter assignments for this clinic
      const clinicName = profile.name || 'Apollo Clinic';
      const clinicId = profile.id || user?.id || 'default';
      const myAssignments = (allAssignments || []).filter(
        (a) =>
          a.clinicId === clinicId ||
          a.clinicId === 'cln-01' ||
          (a.clinicName && clinicName && a.clinicName.toLowerCase().includes(clinicName.toLowerCase())) ||
          (clinicName && a.clinicName && clinicName.toLowerCase().includes(a.clinicName.toLowerCase()))
      );
      setAssignments(myAssignments.length > 0 ? myAssignments : allAssignments || []);
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
    window.addEventListener('oshud_doctor_status_changed', handleRosterUpdate);
    return () => {
      window.removeEventListener('oshud_clinic_doctors_updated', handleRosterUpdate);
      window.removeEventListener('oshud_doctor_status_changed', handleRosterUpdate);
    };
  }, [user]);

  // Sync fee when assigning a doctor
  useEffect(() => {
    if (assignSelectedDoctor) {
      if (assignSelectedDoctor.consultationFeePaise) {
        setAssignFee(String(Math.round(assignSelectedDoctor.consultationFeePaise / 100)));
      } else if (assignSelectedDoctor.consultationFee) {
        setAssignFee(String(assignSelectedDoctor.consultationFee));
      } else if (assignSelectedDoctor.fee) {
        setAssignFee(String(assignSelectedDoctor.fee));
      }
    }
  }, [assignSelectedDoctor]);

  // ================= ACTION: ADD DOCTOR =================
  const handleAddDoctorSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (!addDoctorForm.fullName || !addDoctorForm.phone || !addDoctorForm.password) {
        addToast('Please provide doctor full name, phone number, and password.', 'error');
        setIsSubmitting(false);
        return;
      }

      const cleanPhone = addDoctorForm.phone.replace(/[^0-9]/g, '');
      const cleanEmail = addDoctorForm.email ? addDoctorForm.email.toLowerCase() : null;

      // Duplicate guard
      const alreadyExists = clinicDoctors.some(
        (cd) =>
          (cleanPhone && cd.phone && cd.phone.replace(/[^0-9]/g, '') === cleanPhone) ||
          (cleanEmail && cd.email && cd.email.toLowerCase() === cleanEmail)
      );

      if (alreadyExists) {
        addToast(
          `A doctor with phone ${addDoctorForm.phone} or email ${addDoctorForm.email} already exists in this clinic.`,
          'error'
        );
        setIsSubmitting(false);
        return;
      }

      const sTime = addDoctorForm.startTime || '09:30 AM';
      const eTime = addDoctorForm.endTime || '01:30 PM';
      const shiftStr = `${sTime} – ${eTime}`;

      await clinicApi.addDoctorToClinic(user?.id || 'default', {
        isNew: true,
        fullName: addDoctorForm.fullName,
        email: addDoctorForm.email,
        phone: cleanPhone,
        password: addDoctorForm.password,
        specialization: addDoctorForm.specialization,
        qualifications: addDoctorForm.qualifications,
        registrationNumber: addDoctorForm.registrationNumber,
        experienceYears: Number(addDoctorForm.experienceYears) || 5,
        fee: Number(addDoctorForm.fee) || 500,
        startTime: sTime,
        endTime: eTime,
        shift: shiftStr,
        imageUrl: addDoctorForm.imageUrl,
      });

      addToast(
        `Dr. ${addDoctorForm.fullName} successfully registered and added to clinic roster!`,
        'success'
      );

      setShowAddModal(false);
      // Reset form
      setAddDoctorForm({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        specialization: 'General Physician',
        qualifications: 'MBBS, MD',
        registrationNumber: '',
        experienceYears: '5',
        fee: '500',
        startTime: '09:30 AM',
        endTime: '01:30 PM',
        imageUrl: '',
      });
      await loadData();
    } catch (error) {
      addToast(error.message || 'Failed to add doctor to clinic.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================= ACTION: OPEN EDIT MODAL =================
  const handleOpenEdit = (doc) => {
    setDoctorToEdit(doc);
    let sTime = doc.startTime || '09:30 AM';
    let eTime = doc.endTime || '01:30 PM';
    if (!doc.startTime && doc.shift && doc.shift.includes('–')) {
      const parts = doc.shift.split('–').map((p) => p.trim());
      if (parts[0]) sTime = parts[0];
      if (parts[1]) eTime = parts[1];
    } else if (!doc.startTime && doc.shift && doc.shift.includes('-')) {
      const parts = doc.shift.split('-').map((p) => p.trim());
      if (parts[0]) sTime = parts[0];
      if (parts[1]) eTime = parts[1];
    }

    setEditDoctorForm({
      id: doc.id,
      fullName: doc.name || doc.fullName || '',
      email: doc.email || '',
      phone: doc.phone || '',
      specialization: doc.specialty || doc.specialization || 'General Physician',
      qualifications: doc.qualifications || 'MBBS',
      registrationNumber: doc.registrationNumber || '',
      experienceYears: String(doc.experienceYears || '5'),
      fee: String(doc.fee || '500'),
      startTime: sTime,
      endTime: eTime,
      imageUrl: doc.imageUrl || '',
    });
  };

  // ================= ACTION: SUBMIT EDIT DOCTOR =================
  const handleEditDoctorSubmit = async (e) => {
    e.preventDefault();
    if (!doctorToEdit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const sTime = editDoctorForm.startTime || '09:30 AM';
      const eTime = editDoctorForm.endTime || '01:30 PM';
      const shiftStr = `${sTime} – ${eTime}`;

      await clinicApi.updateClinicDoctor(user?.id || 'default', doctorToEdit.id, {
        fullName: editDoctorForm.fullName,
        email: editDoctorForm.email,
        phone: editDoctorForm.phone,
        specialization: editDoctorForm.specialization,
        qualifications: editDoctorForm.qualifications,
        registrationNumber: editDoctorForm.registrationNumber,
        experienceYears: Number(editDoctorForm.experienceYears) || 0,
        fee: Number(editDoctorForm.fee) || 500,
        startTime: sTime,
        endTime: eTime,
        shift: shiftStr,
        imageUrl: editDoctorForm.imageUrl,
      });

      addToast(`Dr. ${editDoctorForm.fullName} profile updated successfully!`, 'success');
      setDoctorToEdit(null);
      await loadData();
    } catch (err) {
      addToast(err.message || 'Failed to update doctor details.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================= ACTION: ACTIVATE / DEACTIVATE (30 DAYS DEADLINE) =================
  const handleToggleDoctorStatus = async (doc) => {
    const isCurrentlyDeactivated = doc.status === 'DEACTIVATED';
    const newStatus = isCurrentlyDeactivated ? 'ACTIVE' : 'DEACTIVATED';
    setTogglingStatusId(doc.id);

    try {
      // 1. Update in clinicApi
      await clinicApi.updateClinicDoctor(user?.id || 'default', doc.id, {
        status: newStatus,
        deactivatedAt: newStatus === 'DEACTIVATED' ? new Date().toISOString() : null,
        purgeDeadline: newStatus === 'DEACTIVATED' ? Date.now() + 30 * 24 * 60 * 60 * 1000 : null,
      });

      // 2. Update global entity status in adminApi / accountRegistry
      await adminApi.setStatus(doc.userId || doc.id, 'DOCTOR', newStatus, doc);

      addToast(
        newStatus === 'DEACTIVATED'
          ? `Dr. ${doc.name} deactivated. 30-day deadline scheduled before permanent purge.`
          : `Dr. ${doc.name} activated and consultations restored!`,
        'success'
      );
      await loadData();
    } catch (err) {
      addToast(err.message || 'Failed to update doctor status.', 'error');
    } finally {
      setTogglingStatusId(null);
    }
  };

  // ================= ACTION: REMOVE / DELETE DOCTOR =================
  const handleConfirmRemoveDoctor = async () => {
    if (!doctorToRemove) return;
    try {
      await clinicApi.removeDoctorFromClinic(user?.id || 'default', doctorToRemove.id);
      addToast(`Dr. ${doctorToRemove.name} removed from clinic roster.`, 'success');
      setDoctorToRemove(null);
      await loadData();
    } catch (error) {
      addToast(error.message || 'Failed to remove doctor.', 'error');
    }
  };

  // ================= ASSIGN WIZARD SUBMIT =================
  const handleSaveAssignment = async () => {
    if (!assignSelectedDoctor) {
      addToast('Please select a doctor to assign.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const scheduleSummary = computedScheduleSummary;
      const payload = {
        clinicId: clinic.id || user?.id || 'cln-01',
        clinicName: clinic.name || 'Apollo Clinic & Polyclinic',
        clinicAddress: clinic.address || 'Kolkata',
        doctorId: assignSelectedDoctor.id,
        doctorName: assignSelectedDoctor.fullName || assignSelectedDoctor.name,
        doctorSpecialization: assignSelectedDoctor.specialization || assignSelectedDoctor.specialty || 'General Physician',
        doctorQualifications: assignSelectedDoctor.qualifications || 'MBBS',
        doctorImageUrl: assignSelectedDoctor.imageUrl || '',
        consultationFee: Number(assignFee) || 500,
        chamberNo: assignChamber,
        startTime: assignStartTime,
        endTime: assignEndTime,
        timeSlot: `${assignStartTime} – ${assignEndTime}`,
        maxCapacity: Number(assignCapacity) || 25,
        scheduleType: assignScheduleType,
        scheduleSummary,
        weeklyCustomDays: assignScheduleType === 'WEEKLY_CUSTOM' ? assignWeeklyDays : [],
        weeklySpecificDay: assignScheduleType === 'WEEKLY_SPECIFIC_DAY' ? assignWeeklyDay : '',
        monthlyDates: assignScheduleType === 'MONTHLY_SPECIFIC_DATES' ? assignMonthlyDates : [],
        monthlyWeeks: assignScheduleType === 'MONTHLY_SPECIFIC_WEEKDAY' ? assignMonthlyWeeks : [],
        monthlyWeekday: assignScheduleType === 'MONTHLY_SPECIFIC_WEEKDAY' ? assignMonthlyWeekday : '',
        exceptionDate: assignScheduleType === 'SPECIFIC_DATE_EXCEPTION' ? assignExceptionDate : '',
        exceptionNotes: assignScheduleType === 'SPECIFIC_DATE_EXCEPTION' ? assignExceptionNotes : '',
      };

      await adminApi.assignDoctorToClinic(payload);

      // Also ensure doctor is linked to this clinic's local roster
      try {
        await clinicApi.addDoctorToClinic(user?.id || 'default', {
          isExisting: true,
          existingDoctor: assignSelectedDoctor,
          room: assignChamber,
          shift: `${assignStartTime} – ${assignEndTime}`,
          fee: assignFee,
          phoneExt: assignPhoneExt,
        });
      } catch {}

      addToast(
        `Dr. ${assignSelectedDoctor.fullName || assignSelectedDoctor.name} assigned to ${clinic.name} successfully!`,
        'success'
      );

      // Switch to directory view
      setAssignView('directory');
      setAssignStep(1);
      setAssignSelectedDoctor(null);
      await loadData();
    } catch (err) {
      addToast(err.message || 'Failed to save doctor assignment.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove Assignment
  const handleRemoveAssignment = async () => {
    if (!assignmentToDelete) return;
    try {
      await adminApi.removeDoctorClinicAssignment(assignmentToDelete.id);
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentToDelete.id));
      addToast('Doctor unassigned from clinic successfully.', 'success');
      setAssignmentToDelete(null);
    } catch {
      addToast('Failed to remove assignment.', 'error');
    }
  };

  // ================= COMPUTED SUMMARIES & FILTERS =================
  const computedScheduleSummary = useMemo(() => {
    const timeSpan = `${assignStartTime} – ${assignEndTime}`;
    switch (assignScheduleType) {
      case 'DAILY':
        return `Daily (Mon – Sun) • ${timeSpan}`;
      case 'WEEKLY_CUSTOM':
        return `Weekly on ${assignWeeklyDays.join(', ') || 'No days selected'} • ${timeSpan}`;
      case 'WEEKLY_SPECIFIC_DAY':
        return `Weekly every ${assignWeeklyDay} • ${timeSpan}`;
      case 'MONTHLY_SPECIFIC_DATES':
        return `Monthly on ${assignMonthlyDates.map((d) => `${d}th`).join(', ') || 'No dates'} • ${timeSpan}`;
      case 'MONTHLY_SPECIFIC_WEEKDAY':
        return `Monthly on ${assignMonthlyWeeks.join(' & ')} ${assignMonthlyWeekday} • ${timeSpan}`;
      case 'SPECIFIC_DATE_EXCEPTION':
        return `Specific Date: ${assignExceptionDate || 'Not selected'} • ${timeSpan}`;
      default:
        return `${assignScheduleType} • ${timeSpan}`;
    }
  }, [
    assignScheduleType,
    assignStartTime,
    assignEndTime,
    assignWeeklyDays,
    assignWeeklyDay,
    assignMonthlyDates,
    assignMonthlyWeeks,
    assignMonthlyWeekday,
    assignExceptionDate,
  ]);

  // Filtered doctors for manage list
  const filteredClinicDoctors = clinicDoctors.filter((doc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (doc.name || doc.fullName || '').toLowerCase().includes(q) ||
      (doc.specialty || doc.specialization || '').toLowerCase().includes(q) ||
      (doc.shift || '').toLowerCase().includes(q) ||
      (doc.registrationNumber || '').toLowerCase().includes(q) ||
      (doc.phone || '').includes(q)
    );
  });

  // Filtered doctors for Assign Wizard Step 2
  const filteredPlatformDoctors = useMemo(() => {
    return allPlatformDoctors.filter((d) => {
      const q = assignDoctorSearch.toLowerCase();
      const matchesSearch =
        (d.fullName || d.name || '').toLowerCase().includes(q) ||
        (d.specialization || d.specialty || '').toLowerCase().includes(q) ||
        (d.registrationNumber || '').toLowerCase().includes(q) ||
        (d.qualifications || '').toLowerCase().includes(q);
      const matchesSpec =
        assignSpecFilter === 'all' ||
        (d.specialization || d.specialty || '').toLowerCase() === assignSpecFilter.toLowerCase();
      return matchesSearch && matchesSpec;
    });
  }, [allPlatformDoctors, assignDoctorSearch, assignSpecFilter]);

  // Unique specializations for filter pills
  const availableSpecializations = useMemo(() => {
    const set = new Set();
    allPlatformDoctors.forEach((d) => {
      const spec = d.specialization || d.specialty;
      if (spec) set.add(spec);
    });
    return Array.from(set);
  }, [allPlatformDoctors]);

  // Filtered Directory in Assign tab
  const filteredAssignments = useMemo(() => {
    const q = directorySearch.toLowerCase();
    return assignments.filter((a) => {
      return (
        (a.doctorName || '').toLowerCase().includes(q) ||
        (a.doctorSpecialization || '').toLowerCase().includes(q) ||
        (a.chamberNo || '').toLowerCase().includes(q) ||
        (a.scheduleSummary || '').toLowerCase().includes(q)
      );
    });
  }, [assignments, directorySearch]);

  return (
    <div className="space-y-6">
      {/* Header with Title and 3 Dedicated Tab Switchers */}
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
            Real-time room occupancy, live consulting tokens, doctor staff management, and step-by-step clinic scheduling.
          </p>
        </div>

        {/* 3 Dedicated Tabs */}
        <div className="flex items-center gap-2 bg-surface-warm p-1.5 rounded-2xl border border-brandBorder-subtle self-start sm:self-auto overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => handleTabChange('roster')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
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
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'manage'
                ? 'bg-forest-800 text-white shadow-sm'
                : 'text-brandText-secondary hover:text-forest-900 hover:bg-surface-pure'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add / Remove Doctors</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('assign')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'assign'
                ? 'bg-forest-800 text-white shadow-sm'
                : 'text-brandText-secondary hover:text-forest-900 hover:bg-surface-pure'
            }`}
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            <span>Assign Doctors ({assignments.length})</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle p-12 text-center space-y-3 shadow-card">
          <Loader2 className="w-8 h-8 text-forest-700 animate-spin mx-auto" />
          <p className="text-xs font-bold text-forest-900">Loading Clinic Doctor Roster...</p>
          <p className="text-[11px] text-brandText-secondary">Synchronizing doctor chambers, schedules, and credentials</p>
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
                      <div className="flex items-center gap-3">
                        {doc.imageUrl ? (
                          <img
                            src={doc.imageUrl}
                            alt={doc.name}
                            className="w-11 h-11 rounded-2xl object-cover border border-brandBorder-subtle shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-2xl bg-forest-50 text-forest-800 flex items-center justify-center font-bold text-sm shrink-0 border border-forest-100">
                            {doc.name ? doc.name.replace('Dr.', '').trim().charAt(0) : 'D'}
                          </div>
                        )}
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
                      </div>

                      {(() => {
                        const effectiveStatus = doctorApi.getDutyStatus(doc.id || doc.doctorId) || doc.status || 'AVAILABLE';
                        const isConsulting = Boolean(serving) || effectiveStatus === 'IN_CONSULTATION';
                        return (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              isConsulting
                                ? 'bg-emerald-100 text-emerald-800'
                                : effectiveStatus === 'ON_BREAK'
                                ? 'bg-amber-100 text-amber-800'
                                : effectiveStatus === 'OFFLINE'
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {isConsulting ? 'IN CONSULTATION' : effectiveStatus.replace('_', ' ')}
                          </span>
                        );
                      })()}
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
                      className="text-xs py-1 font-bold"
                    >
                      Call Next
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : activeTab === 'manage' ? (
        /* ================= TAB 2: MANAGE CLINIC DOCTORS (ADMIN PARITY) ================= */
        <div className="space-y-6">
          <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 space-y-5">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brandBorder-subtle pb-4">
              <div>
                <h2 className="font-heading font-extrabold text-base text-forest-900">
                  Clinic Doctor Staff Directory
                </h2>
                <p className="text-xs text-brandText-secondary">
                  Add new doctors with photo avatar, edit credentials, deactivate with 30-day purge deadline, or delete.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-brandText-muted" />
                  <input
                    type="text"
                    placeholder="Search doctor, shift timing, reg no..."
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

            {/* Doctors Table with Full Admin Parity Actions */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-brandBorder-subtle text-brandText-muted font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Doctor Profile</th>
                    <th className="py-3 px-3">Specialization</th>
                    <th className="py-3 px-3">Shift Timing</th>
                    <th className="py-3 px-3">Fee</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brandBorder-subtle">
                  {filteredClinicDoctors.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-brandText-secondary">
                        No clinic doctors found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredClinicDoctors.map((doc) => {
                      const isDeactivated = doc.status === 'DEACTIVATED';
                      const isToggling = togglingStatusId === doc.id;

                      return (
                        <tr key={doc.id} className="hover:bg-surface-warm/50 transition-colors">
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-2.5">
                              {doc.imageUrl ? (
                                <img
                                  src={doc.imageUrl}
                                  alt={doc.name}
                                  className="w-9 h-9 rounded-xl object-cover border border-brandBorder-subtle shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center font-bold text-xs shrink-0 border border-forest-100">
                                  {doc.name ? doc.name.replace('Dr.', '').trim().charAt(0) : 'D'}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-forest-900">{doc.name}</p>
                                <p className="text-[10px] text-brandText-secondary">
                                  Reg: {doc.registrationNumber || 'WBMC-REG'} &bull; {doc.qualifications || 'MBBS'}
                                  {doc.experienceYears ? ` &bull; ${doc.experienceYears} yrs exp` : ''}
                                </p>
                                <p className="text-[10px] text-brandText-muted">{doc.phone || doc.email || '—'}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="font-medium text-forest-800 bg-forest-50 px-2 py-0.5 rounded-lg border border-forest-100">
                              {doc.specialty || doc.specialization}
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="font-mono text-xs font-semibold text-forest-900 bg-surface-warm px-2 py-1 rounded-lg border border-brandBorder-subtle">
                              {doc.shift || (doc.startTime ? `${doc.startTime} – ${doc.endTime}` : '09:30 AM – 01:30 PM')}
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="font-bold text-forest-900">
                              ₹{doc.fee || 500}
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            {isDeactivated ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                <AlertTriangle className="w-3 h-3" />
                                Deactivated (Purge in 30d)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle className="w-3 h-3" />
                                Active
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(doc)}
                                className="p-1.5 rounded-lg text-forest-700 hover:text-forest-900 hover:bg-forest-50 border border-brandBorder-subtle transition-colors"
                                title="Edit Doctor Profile & Chamber"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Activate / Deactivate (30 Days Deadline) Button */}
                              <button
                                type="button"
                                disabled={isToggling}
                                onClick={() => handleToggleDoctorStatus(doc)}
                                className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors inline-flex items-center gap-1 ${
                                  isDeactivated
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                } ${isToggling ? 'opacity-60 cursor-not-allowed' : ''}`}
                                title={isDeactivated ? 'Restore Doctor Login' : 'Deactivate with 30-day purge deadline'}
                              >
                                {isToggling ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Power className="w-3 h-3" />
                                )}
                                <span>{isDeactivated ? 'Activate' : 'Deactivate'}</span>
                              </button>

                              {/* Delete Doctor Button */}
                              <button
                                type="button"
                                onClick={() => setDoctorToRemove(doc)}
                                className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-100 transition-colors"
                                title="Remove Doctor from Clinic"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ================= TAB 3: ASSIGN DOCTORS (STEP-BY-STEP WIZARD & DIRECTORY) ================= */
        <div className="space-y-6">
          {/* Sub-header & View Toggle */}
          <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-heading font-extrabold text-forest-900">
                    Clinic Doctor Scheduling & Assignments
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-forest-100 text-forest-800">
                    {clinic.name}
                  </span>
                </div>
                <p className="text-xs text-brandText-secondary mt-0.5">
                  Configure chamber rooms, consultation fees, shift times, and custom recurring schedules for registered physicians.
                </p>
              </div>

              {/* View Switcher Pills */}
              <div className="flex items-center gap-1.5 bg-surface-warm p-1 rounded-2xl border border-brandBorder-subtle self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setAssignView('wizard')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    assignView === 'wizard'
                      ? 'bg-forest-800 text-white shadow-sm'
                      : 'text-brandText-secondary hover:text-forest-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>New Assignment Wizard</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAssignView('directory')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    assignView === 'directory'
                      ? 'bg-forest-800 text-white shadow-sm'
                      : 'text-brandText-secondary hover:text-forest-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Active Assignments ({assignments.length})</span>
                </button>
              </div>
            </div>

            {assignView === 'wizard' ? (
              /* ================= WIZARD MODE ================= */
              <div className="mt-6 space-y-6">
                {/* 4-Step Indicator Bar */}
                <div className="grid grid-cols-4 gap-2 border-b border-brandBorder-subtle pb-4">
                  {[
                    { step: 1, label: 'Clinic & Chamber', icon: Building2 },
                    { step: 2, label: 'Select Doctor', icon: Stethoscope },
                    { step: 3, label: 'Fee & Schedule', icon: CalendarDays },
                    { step: 4, label: 'Review & Confirm', icon: CheckCircle2 },
                  ].map((s) => {
                    const isDone = assignStep > s.step;
                    const isCurrent = assignStep === s.step;
                    const Icon = s.icon;

                    return (
                      <div
                        key={s.step}
                        onClick={() => {
                          if (isDone) setAssignStep(s.step);
                        }}
                        className={`flex items-center gap-2 p-2 rounded-xl transition-all ${
                          isCurrent
                            ? 'bg-forest-50 border border-forest-200'
                            : isDone
                            ? 'cursor-pointer hover:bg-surface-warm'
                            : 'opacity-50'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isCurrent
                              ? 'bg-forest-800 text-white shadow-sm'
                              : isDone
                              ? 'bg-emerald-600 text-white'
                              : 'bg-surface-warm text-brandText-muted'
                          }`}
                        >
                          {isDone ? <Check className="w-4 h-4" /> : s.step}
                        </div>
                        <div className="hidden sm:block">
                          <p className={`text-xs font-bold ${isCurrent ? 'text-forest-900' : 'text-brandText-main'}`}>
                            {s.label}
                          </p>
                          <p className="text-[10px] text-brandText-secondary">
                            {isDone ? 'Completed' : isCurrent ? 'Active Setup' : 'Pending'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* STEP 1: CLINIC & CHAMBER VERIFICATION */}
                {assignStep === 1 && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="p-4 bg-forest-50/70 border border-forest-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-forest-800 text-white flex items-center justify-center shadow-sm">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-forest-900 text-sm">{clinic.name}</h4>
                          <p className="text-xs text-brandText-secondary">
                            {clinic.address} &bull; {clinic.chamberCount || '6 Chambers'}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 self-start sm:self-auto">
                        Authenticated Facility
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-forest-800 mb-1">
                          Designate Chamber Room *
                        </label>
                        <select
                          value={assignChamber}
                          onChange={(e) => setAssignChamber(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-bold"
                        >
                          <option value="Chamber 1 (Room 204)">Chamber 1 (Room 204 - 2nd Floor)</option>
                          <option value="Chamber 2 (Room 206)">Chamber 2 (Room 206 - 2nd Floor)</option>
                          <option value="Chamber 3 (Room 208)">Chamber 3 (Room 208 - 2nd Floor)</option>
                          <option value="Chamber 4 (Room 210)">Chamber 4 (Room 210 - 2nd Floor)</option>
                          <option value="Chamber 5 (Room 212)">Chamber 5 (Room 212 - 2nd Floor)</option>
                          <option value="Chamber 6 (Room 214)">Chamber 6 (Room 214 - 2nd Floor)</option>
                          <option value="VIP Consulting Suite A">VIP Consulting Suite A (1st Floor)</option>
                        </select>
                        <p className="text-[11px] text-brandText-secondary mt-1">
                          Chamber where patient queue tokens will be summoned.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-forest-800 mb-1">
                          Chamber Intercom Ext
                        </label>
                        <input
                          type="text"
                          value={assignPhoneExt}
                          onChange={(e) => setAssignPhoneExt(e.target.value)}
                          placeholder="e.g. Ext 204"
                          className="w-full px-3.5 py-2.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                        />
                        <p className="text-[11px] text-brandText-secondary mt-1">
                          Direct phone intercom for receptionist communication.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-3">
                      <Button
                        variant="primary"
                        size="md"
                        rightIcon={ArrowRight}
                        onClick={() => setAssignStep(2)}
                        className="font-bold text-xs"
                      >
                        Proceed to Select Doctor
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 2: SELECT REGISTERED DOCTOR */}
                {assignStep === 2 && (
                  <div className="space-y-4 animate-fade-in">
                    {/* Search & Specialty Filters */}
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                      <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-brandText-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search doctor by name, registration no, qualification..."
                          value={assignDoctorSearch}
                          onChange={(e) => setAssignDoctorSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                        <button
                          type="button"
                          onClick={() => setAssignSpecFilter('all')}
                          className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-colors whitespace-nowrap ${
                            assignSpecFilter === 'all'
                              ? 'bg-forest-800 text-white'
                              : 'bg-surface-warm text-brandText-secondary hover:text-forest-900'
                          }`}
                        >
                          All Specializations
                        </button>
                        {availableSpecializations.slice(0, 4).map((spec) => (
                          <button
                            key={spec}
                            type="button"
                            onClick={() => setAssignSpecFilter(spec)}
                            className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-colors whitespace-nowrap ${
                              assignSpecFilter === spec
                                ? 'bg-forest-800 text-white'
                                : 'bg-surface-warm text-brandText-secondary hover:text-forest-900'
                            }`}
                          >
                            {spec}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Doctors Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[380px] overflow-y-auto pr-1">
                      {filteredPlatformDoctors.map((doc) => {
                        const isSelected = assignSelectedDoctor?.id === doc.id;

                        return (
                          <div
                            key={doc.id}
                            onClick={() => setAssignSelectedDoctor(doc)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-forest-50/80 border-forest-600 ring-2 ring-forest-500 shadow-md'
                                : 'bg-surface-pure border-brandBorder-subtle hover:border-forest-300'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {doc.imageUrl ? (
                                <img
                                  src={doc.imageUrl}
                                  alt={doc.fullName || doc.name}
                                  className="w-10 h-10 rounded-xl object-cover shrink-0 border border-brandBorder-subtle"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center font-bold text-xs shrink-0">
                                  {(doc.fullName || doc.name || 'D').replace('Dr.', '').trim().charAt(0)}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-forest-900 text-xs truncate">
                                  {doc.fullName || doc.name}
                                </h4>
                                <p className="text-[11px] text-forest-700 font-semibold truncate">
                                  {doc.specialization || doc.specialty || 'General Physician'}
                                </p>
                                <p className="text-[10px] text-brandText-secondary truncate mt-0.5">
                                  Reg: {doc.registrationNumber || 'WBMC-REG'} &bull; {doc.qualifications || 'MBBS'}
                                </p>
                              </div>
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 ${
                                  isSelected
                                    ? 'bg-forest-800 text-white border-forest-800'
                                    : 'border-brandBorder-subtle bg-surface-warm'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3" />}
                              </div>
                            </div>

                            <div className="mt-3 pt-2 border-t border-brandBorder-subtle/70 flex items-center justify-between text-[11px]">
                              <span className="text-brandText-secondary">
                                Exp: <strong>{doc.experienceYears || 5} yrs</strong>
                              </span>
                              <span className="font-extrabold text-forest-900">
                                Base: ₹{doc.consultationFeePaise ? Math.round(doc.consultationFeePaise / 100) : doc.fee || 500}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-brandBorder-subtle">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={ArrowLeft}
                        onClick={() => setAssignStep(1)}
                        className="text-xs"
                      >
                        Back to Chamber
                      </Button>
                      <Button
                        variant="primary"
                        size="md"
                        disabled={!assignSelectedDoctor}
                        rightIcon={ArrowRight}
                        onClick={() => setAssignStep(3)}
                        className="font-bold text-xs"
                      >
                        Continue to Fee & Schedule Setup
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 3: FEE & SCHEDULE SETUP (ALL 6 RECURRING TYPES) */}
                {assignStep === 3 && (
                  <div className="space-y-5 animate-fade-in">
                    {/* Selected Doctor pill */}
                    <div className="p-3 bg-surface-warm rounded-2xl border border-brandBorder-subtle flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <Stethoscope className="w-4 h-4 text-forest-700" />
                        <div>
                          <p className="font-bold text-forest-900">
                            Assigning: {assignSelectedDoctor?.fullName || assignSelectedDoctor?.name}
                          </p>
                          <p className="text-[11px] text-brandText-secondary">
                            Chamber: <strong>{assignChamber}</strong> &bull; {clinic.name}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAssignStep(2)}
                        className="text-[11px] font-bold text-forest-700 hover:underline"
                      >
                        Change Doctor
                      </button>
                    </div>

                    {/* Fee, Times, Capacity */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-forest-800 mb-1">
                          Clinic Consultation Fee (₹) *
                        </label>
                        <div className="relative">
                          <DollarSign className="w-3.5 h-3.5 text-brandText-muted absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="number"
                            min="0"
                            required
                            value={assignFee}
                            onChange={(e) => setAssignFee(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-forest-800 mb-1">
                          Start Time *
                        </label>
                        <select
                          value={assignStartTime}
                          onChange={(e) => setAssignStartTime(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                        >
                          {STANDARD_TIME_SLOTS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-forest-800 mb-1">
                          End Time *
                        </label>
                        <select
                          value={assignEndTime}
                          onChange={(e) => setAssignEndTime(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                        >
                          {STANDARD_TIME_SLOTS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-forest-800 mb-1">
                          Max Capacity *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="200"
                          value={assignCapacity}
                          onChange={(e) => setAssignCapacity(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                        />
                      </div>
                    </div>

                    {/* Schedule Type Selection (6 Types) */}
                    <div>
                      <label className="block text-xs font-bold text-forest-900 mb-2">
                        Select Schedule Recurrence Type
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {SCHEDULE_TYPES.map((st) => {
                          const isSelected = assignScheduleType === st.id;

                          return (
                            <div
                              key={st.id}
                              onClick={() => setAssignScheduleType(st.id)}
                              className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-forest-50/90 border-forest-600 ring-2 ring-forest-500'
                                  : 'bg-surface-pure border-brandBorder-subtle hover:border-forest-300'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-xs text-forest-900">{st.title}</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-warm text-brandText-secondary">
                                  {st.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-brandText-secondary leading-snug">
                                {st.description}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Schedule Type Specific Options */}
                    <div className="p-4 bg-surface-warm rounded-2xl border border-brandBorder-subtle space-y-3">
                      {assignScheduleType === 'WEEKLY_CUSTOM' && (
                        <div>
                          <label className="block text-xs font-bold text-forest-800 mb-2">
                            Select Recurring Weekdays
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {WEEKDAYS.map((day) => {
                              const active = assignWeeklyDays.includes(day);
                              return (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => {
                                    setAssignWeeklyDays((prev) =>
                                      active ? prev.filter((d) => d !== day) : [...prev, day]
                                    );
                                  }}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    active
                                      ? 'bg-forest-800 text-white shadow-sm'
                                      : 'bg-surface-pure border border-brandBorder-subtle text-brandText-secondary hover:text-forest-900'
                                  }`}
                                >
                                  {day}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {assignScheduleType === 'WEEKLY_SPECIFIC_DAY' && (
                        <div>
                          <label className="block text-xs font-bold text-forest-800 mb-1">
                            Recurring Day of Week
                          </label>
                          <select
                            value={assignWeeklyDay}
                            onChange={(e) => setAssignWeeklyDay(e.target.value)}
                            className="px-3 py-2 text-xs bg-surface-pure border border-brandBorder-subtle rounded-xl font-medium focus:outline-none focus:border-forest-500"
                          >
                            {FULL_WEEKDAYS.map((d) => (
                              <option key={d} value={d}>
                                Every {d}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {assignScheduleType === 'MONTHLY_SPECIFIC_DATES' && (
                        <div>
                          <label className="block text-xs font-bold text-forest-800 mb-1.5">
                            Calendar Dates of Month (1 – 31)
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((date) => {
                              const active = assignMonthlyDates.includes(date);
                              return (
                                <button
                                  key={date}
                                  type="button"
                                  onClick={() => {
                                    setAssignMonthlyDates((prev) =>
                                      active ? prev.filter((d) => d !== date) : [...prev, date]
                                    );
                                  }}
                                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                                    active
                                      ? 'bg-forest-800 text-white'
                                      : 'bg-surface-pure border border-brandBorder-subtle text-brandText-secondary hover:text-forest-900'
                                  }`}
                                >
                                  {date}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {assignScheduleType === 'MONTHLY_SPECIFIC_WEEKDAY' && (
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-forest-800">
                            Month Week Occurrence & Weekday
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {MONTH_WEEKS.map((w) => {
                              const active = assignMonthlyWeeks.includes(w);
                              return (
                                <button
                                  key={w}
                                  type="button"
                                  onClick={() => {
                                    setAssignMonthlyWeeks((prev) =>
                                      active ? prev.filter((item) => item !== w) : [...prev, w]
                                    );
                                  }}
                                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                                    active
                                      ? 'bg-forest-800 text-white'
                                      : 'bg-surface-pure border border-brandBorder-subtle text-brandText-secondary'
                                  }`}
                                >
                                  {w}
                                </button>
                              );
                            })}
                          </div>
                          <select
                            value={assignMonthlyWeekday}
                            onChange={(e) => setAssignMonthlyWeekday(e.target.value)}
                            className="mt-2 px-3 py-2 text-xs bg-surface-pure border border-brandBorder-subtle rounded-xl font-medium focus:outline-none focus:border-forest-500"
                          >
                            {FULL_WEEKDAYS.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {assignScheduleType === 'SPECIFIC_DATE_EXCEPTION' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-forest-800 mb-1">
                              Special Date *
                            </label>
                            <input
                              type="date"
                              required
                              value={assignExceptionDate}
                              onChange={(e) => setAssignExceptionDate(e.target.value)}
                              className="w-full px-3 py-2 text-xs bg-surface-pure border border-brandBorder-subtle rounded-xl font-medium focus:outline-none focus:border-forest-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-forest-800 mb-1">
                              Notes / Reason
                            </label>
                            <input
                              type="text"
                              value={assignExceptionNotes}
                              onChange={(e) => setAssignExceptionNotes(e.target.value)}
                              placeholder="e.g. Free Eye Checkup Camp"
                              className="w-full px-3 py-2 text-xs bg-surface-pure border border-brandBorder-subtle rounded-xl font-medium focus:outline-none focus:border-forest-500"
                            />
                          </div>
                        </div>
                      )}

                      {/* Live Calculated Summary */}
                      <div className="pt-2 border-t border-brandBorder-subtle flex items-center justify-between text-xs">
                        <span className="text-brandText-secondary">Calculated Summary:</span>
                        <span className="font-extrabold text-forest-900 bg-surface-pure px-2.5 py-1 rounded-lg border border-brandBorder-subtle">
                          {computedScheduleSummary}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-brandBorder-subtle">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={ArrowLeft}
                        onClick={() => setAssignStep(2)}
                        className="text-xs"
                      >
                        Back to Doctor
                      </Button>
                      <Button
                        variant="primary"
                        size="md"
                        rightIcon={ArrowRight}
                        onClick={() => setAssignStep(4)}
                        className="font-bold text-xs"
                      >
                        Proceed to Final Review
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 4: REVIEW & CONFIRM */}
                {assignStep === 4 && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="bg-forest-50/80 border border-forest-200 rounded-3xl p-5 space-y-4">
                      <div className="flex items-center gap-2 text-forest-900 font-extrabold text-sm border-b border-forest-200 pb-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span>Confirm Doctor Assignment Details</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        {/* Facility Box */}
                        <div className="p-3.5 bg-surface-pure rounded-2xl border border-brandBorder-subtle space-y-1">
                          <p className="text-[10px] text-brandText-muted uppercase font-bold">Designated Facility</p>
                          <p className="font-extrabold text-forest-900 text-sm">{clinic.name}</p>
                          <p className="text-brandText-secondary">{clinic.address}</p>
                          <p className="text-forest-700 font-semibold pt-1">
                            Chamber: <strong>{assignChamber}</strong> ({assignPhoneExt})
                          </p>
                        </div>

                        {/* Doctor Box */}
                        <div className="p-3.5 bg-surface-pure rounded-2xl border border-brandBorder-subtle space-y-1">
                          <p className="text-[10px] text-brandText-muted uppercase font-bold">Assigned Physician</p>
                          <p className="font-extrabold text-forest-900 text-sm">
                            {assignSelectedDoctor?.fullName || assignSelectedDoctor?.name}
                          </p>
                          <p className="text-forest-700 font-semibold">
                            {assignSelectedDoctor?.specialization || assignSelectedDoctor?.specialty || 'General Physician'}
                          </p>
                          <p className="text-brandText-secondary">
                            Reg: {assignSelectedDoctor?.registrationNumber || 'WBMC-REG'} &bull; {assignSelectedDoctor?.qualifications || 'MBBS'}
                          </p>
                        </div>
                      </div>

                      {/* Fee and Timing breakdown */}
                      <div className="p-3.5 bg-surface-pure rounded-2xl border border-brandBorder-subtle grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <p className="text-[10px] text-brandText-muted uppercase font-bold">Clinic Consultation Fee</p>
                          <p className="font-extrabold text-forest-900 text-base mt-0.5">₹{assignFee}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-brandText-muted uppercase font-bold">Session Shift Hours</p>
                          <p className="font-bold text-forest-800 text-xs mt-0.5">
                            {assignStartTime} – {assignEndTime}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-brandText-muted uppercase font-bold">Queue Max Capacity</p>
                          <p className="font-bold text-forest-800 text-xs mt-0.5">
                            {assignCapacity} Patients per slot
                          </p>
                        </div>
                      </div>

                      {/* Schedule Summary Banner */}
                      <div className="p-3.5 bg-forest-800 text-white rounded-2xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-emerald-300" />
                          <span className="font-bold">Schedule Recurrence:</span>
                          <span>{computedScheduleSummary}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white uppercase">
                          {assignScheduleType.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={ArrowLeft}
                        onClick={() => setAssignStep(3)}
                        disabled={isSubmitting}
                        className="text-xs"
                      >
                        Edit Configuration
                      </Button>
                      <Button
                        variant="primary"
                        size="md"
                        disabled={isSubmitting}
                        onClick={handleSaveAssignment}
                        leftIcon={isSubmitting ? Loader2 : CheckCircle2}
                        className="font-bold text-xs"
                      >
                        {isSubmitting ? 'Confirming Assignment...' : 'Confirm & Save Doctor Assignment'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ================= DIRECTORY MODE: ACTIVE ASSIGNMENTS ================= */
              <div className="mt-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-brandBorder-subtle pb-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-3.5 h-3.5 text-brandText-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search active doctor schedules or chamber..."
                      value={directorySearch}
                      onChange={(e) => setDirectorySearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                    />
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={Plus}
                    onClick={() => {
                      setAssignView('wizard');
                      setAssignStep(1);
                    }}
                    className="text-xs font-bold"
                  >
                    Assign Another Doctor
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-brandBorder-subtle text-brandText-muted font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-3">Assigned Doctor</th>
                        <th className="py-3 px-3">Chamber</th>
                        <th className="py-3 px-3">Schedule & Recurrence</th>
                        <th className="py-3 px-3">Timing</th>
                        <th className="py-3 px-3">Fee & Cap</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brandBorder-subtle">
                      {filteredAssignments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-brandText-secondary">
                            No doctor assignments found for this facility. Click <strong>Assign Another Doctor</strong> to configure schedules.
                          </td>
                        </tr>
                      ) : (
                        filteredAssignments.map((asg) => (
                          <tr key={asg.id} className="hover:bg-surface-warm/50 transition-colors">
                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-2.5">
                                {asg.doctorImageUrl ? (
                                  <img
                                    src={asg.doctorImageUrl}
                                    alt={asg.doctorName}
                                    className="w-9 h-9 rounded-xl object-cover shrink-0 border border-brandBorder-subtle"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center font-bold text-xs shrink-0">
                                    {(asg.doctorName || 'D').replace('Dr.', '').trim().charAt(0)}
                                  </div>
                                )}
                                <div>
                                  <p className="font-bold text-forest-900">{asg.doctorName}</p>
                                  <p className="text-[10px] text-forest-700 font-semibold">
                                    {asg.doctorSpecialization}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-3">
                              <span className="font-mono font-bold text-forest-900 bg-surface-warm px-2 py-0.5 rounded-lg border border-brandBorder-subtle">
                                {asg.chamberNo}
                              </span>
                            </td>

                            <td className="py-3.5 px-3">
                              <span className="text-forest-900 font-medium">
                                {asg.scheduleSummary || 'Standard Recurring'}
                              </span>
                            </td>

                            <td className="py-3.5 px-3">
                              <span className="text-forest-800 font-mono">
                                {asg.timeSlot || `${asg.startTime} – ${asg.endTime}`}
                              </span>
                            </td>

                            <td className="py-3.5 px-3">
                              <p className="font-extrabold text-forest-900">₹{asg.consultationFee}</p>
                              <p className="text-[10px] text-brandText-secondary">Cap: {asg.maxCapacity || 25}</p>
                            </td>

                            <td className="py-3.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => setAssignmentToDelete(asg)}
                                className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-100 transition-colors inline-flex items-center gap-1 font-bold text-xs"
                                title="Unassign Doctor Schedule"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Unassign</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD DOCTOR TO CLINIC (ADMIN PARITY WITH IMAGE DROPZONE) ================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm transition-opacity" onClick={() => setShowAddModal(false)} />
          <div className="min-h-full flex items-center justify-center p-3 sm:p-4 text-center">
            <div className="w-full max-w-xl bg-surface-pure rounded-3xl p-6 sm:p-7 shadow-floating border border-brandBorder-subtle text-left relative overflow-hidden animate-scale-up my-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-brandBorder-subtle">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-forest-50 border border-forest-100 flex items-center justify-center text-forest-700">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-base text-forest-900">
                      Add Doctor to {clinic.name}
                    </h3>
                    <p className="text-xs text-brandText-secondary">
                      Register a doctor profile with shift timing and consultation details
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

              {/* Form */}
              <form onSubmit={handleAddDoctorSubmit} className="space-y-4 mt-4">
                {/* Drag and Drop Image Upload (Admin Parity) */}
                <ImageDropzone
                  value={addDoctorForm.imageUrl}
                  onChange={(img) => setAddDoctorForm((prev) => ({ ...prev, imageUrl: img }))}
                  label="Doctor Profile Photo"
                  description="Drag & drop doctor photo here or click to browse. Square format recommended."
                  aspectRatio="square"
                />

                <div>
                  <label className="block text-xs font-semibold text-brandText-main mb-1">
                    Doctor Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={addDoctorForm.fullName}
                    onChange={(e) => setAddDoctorForm({ ...addDoctorForm, fullName: e.target.value })}
                    placeholder="e.g. Dr. Kaushik Sen"
                    className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      Phone Number (Login ID) *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isSubmitting}
                      value={addDoctorForm.phone}
                      onChange={(e) => setAddDoctorForm({ ...addDoctorForm, phone: e.target.value })}
                      placeholder="9876543210"
                      className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      disabled={isSubmitting}
                      value={addDoctorForm.email}
                      onChange={(e) => setAddDoctorForm({ ...addDoctorForm, email: e.target.value })}
                      placeholder="doctor@gmail.com"
                      className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        disabled={isSubmitting}
                        value={addDoctorForm.password}
                        onChange={(e) => setAddDoctorForm({ ...addDoctorForm, password: e.target.value })}
                        placeholder="Min 6 characters"
                        className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brandText-muted hover:text-forest-900"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      disabled={isSubmitting}
                      value={addDoctorForm.registrationNumber}
                      onChange={(e) => setAddDoctorForm({ ...addDoctorForm, registrationNumber: e.target.value })}
                      placeholder="e.g. WBMC-84291"
                      className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      Specialization *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isSubmitting}
                      value={addDoctorForm.specialization}
                      onChange={(e) => setAddDoctorForm({ ...addDoctorForm, specialization: e.target.value })}
                      placeholder="e.g. Cardiology"
                      className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      Qualifications
                    </label>
                    <input
                      type="text"
                      disabled={isSubmitting}
                      value={addDoctorForm.qualifications}
                      onChange={(e) => setAddDoctorForm({ ...addDoctorForm, qualifications: e.target.value })}
                      placeholder="e.g. MBBS, MD"
                      className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      Experience (Years)
                    </label>
                    <input
                      type="number"
                      min="0"
                      disabled={isSubmitting}
                      value={addDoctorForm.experienceYears}
                      onChange={(e) => setAddDoctorForm({ ...addDoctorForm, experienceYears: e.target.value })}
                      placeholder="5"
                      className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      Consultation Fee (₹) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      disabled={isSubmitting}
                      value={addDoctorForm.fee}
                      onChange={(e) => setAddDoctorForm({ ...addDoctorForm, fee: e.target.value })}
                      placeholder="500"
                      className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      Shift Start Time
                    </label>
                    <select
                      disabled={isSubmitting}
                      value={addDoctorForm.startTime || '09:30 AM'}
                      onChange={(e) => setAddDoctorForm({ ...addDoctorForm, startTime: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                    >
                      {STANDARD_TIME_SLOTS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      Shift End Time
                    </label>
                    <select
                      disabled={isSubmitting}
                      value={addDoctorForm.endTime || '01:30 PM'}
                      onChange={(e) => setAddDoctorForm({ ...addDoctorForm, endTime: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                    >
                      {STANDARD_TIME_SLOTS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

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
                    disabled={isSubmitting}
                    leftIcon={isSubmitting ? Loader2 : Plus}
                    className="text-xs font-bold shadow-md"
                  >
                    {isSubmitting ? 'Registering...' : 'Register & Add Doctor'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT DOCTOR DETAILS (ADMIN PARITY) ================= */}
      {doctorToEdit && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm transition-opacity" onClick={() => setDoctorToEdit(null)} />
          <div className="min-h-full flex items-center justify-center p-3 sm:p-4 text-center">
            <div className="w-full max-w-xl bg-surface-pure rounded-3xl p-6 sm:p-7 shadow-floating border border-brandBorder-subtle text-left relative overflow-hidden animate-scale-up my-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-brandBorder-subtle">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-forest-50 border border-forest-100 flex items-center justify-center text-forest-700">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-base text-forest-900">
                      Edit Doctor Details
                    </h3>
                    <p className="text-xs text-brandText-secondary">
                      Update credentials, avatar photo, shift timings, and fees
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setDoctorToEdit(null)}
                  className="p-1 rounded-lg text-brandText-muted hover:text-forest-900 hover:bg-surface-warm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditDoctorSubmit} className="space-y-4 mt-4">
                {/* Drag and Drop Image Upload */}
                <ImageDropzone
                  value={editDoctorForm.imageUrl}
                  onChange={(img) => setEditDoctorForm((prev) => ({ ...prev, imageUrl: img }))}
                  label="Doctor Profile Photo"
                  description="Drag & drop new photo or click to browse."
                  aspectRatio="square"
                />

                <div>
                  <label className="block text-xs font-semibold text-brandText-main mb-1">
                    Doctor Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={editDoctorForm.fullName}
                    onChange={(e) => setEditDoctorForm({ ...editDoctorForm, fullName: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      disabled={isSubmitting}
                      value={editDoctorForm.phone}
                      onChange={(e) => setEditDoctorForm({ ...editDoctorForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      disabled={isSubmitting}
                      value={editDoctorForm.email}
                      onChange={(e) => setEditDoctorForm({ ...editDoctorForm, email: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      Specialization *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isSubmitting}
                      value={editDoctorForm.specialization}
                      onChange={(e) => setEditDoctorForm({ ...editDoctorForm, specialization: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      Qualifications
                    </label>
                    <input
                      type="text"
                      disabled={isSubmitting}
                      value={editDoctorForm.qualifications}
                      onChange={(e) => setEditDoctorForm({ ...editDoctorForm, qualifications: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      Registration No
                    </label>
                    <input
                      type="text"
                      disabled={isSubmitting}
                      value={editDoctorForm.registrationNumber}
                      onChange={(e) => setEditDoctorForm({ ...editDoctorForm, registrationNumber: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      Consultation Fee (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      disabled={isSubmitting}
                      value={editDoctorForm.fee}
                      onChange={(e) => setEditDoctorForm({ ...editDoctorForm, fee: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      Experience (Yrs)
                    </label>
                    <input
                      type="number"
                      min="0"
                      disabled={isSubmitting}
                      value={editDoctorForm.experienceYears}
                      onChange={(e) => setEditDoctorForm({ ...editDoctorForm, experienceYears: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      Shift Start Time
                    </label>
                    <select
                      disabled={isSubmitting}
                      value={editDoctorForm.startTime || '09:30 AM'}
                      onChange={(e) => setEditDoctorForm({ ...editDoctorForm, startTime: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                    >
                      {STANDARD_TIME_SLOTS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      Shift End Time
                    </label>
                    <select
                      disabled={isSubmitting}
                      value={editDoctorForm.endTime || '01:30 PM'}
                      onChange={(e) => setEditDoctorForm({ ...editDoctorForm, endTime: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                    >
                      {STANDARD_TIME_SLOTS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-brandBorder-subtle flex items-center justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => setDoctorToEdit(null)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSubmitting}
                    leftIcon={isSubmitting ? Loader2 : Check}
                    className="text-xs font-bold"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: REMOVE DOCTOR FROM CLINIC ================= */}
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
                <strong>{clinic.name}</strong> roster? Chamber room assignment and queue allocations will be unlinked.
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

      {/* ================= MODAL: UNASSIGN DOCTOR CONFIRMATION ================= */}
      {assignmentToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm" onClick={() => setAssignmentToDelete(null)} />
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-surface-pure rounded-3xl p-6 shadow-floating border border-brandBorder-subtle text-left relative animate-scale-up space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-base text-forest-900">
                  Unassign Doctor Schedule?
                </h3>
                <p className="text-xs text-brandText-secondary mt-1">
                  Are you sure you want to unassign <strong>{assignmentToDelete.doctorName}</strong> from{' '}
                  <strong>{assignmentToDelete.chamberNo}</strong>? This recurring schedule will be deactivated.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setAssignmentToDelete(null)}>
                  Cancel
                </Button>
                <Button variant="danger" size="sm" onClick={handleRemoveAssignment}>
                  Confirm Unassign
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistDoctorsPage;
