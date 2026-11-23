import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Stethoscope,
  Calendar,
  Clock,
  Coins,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Search,
  Filter,
  Plus,
  Trash2,
  Sparkles,
  AlertCircle,
  CalendarPlus,
  Power,
  MapPin,
  ShieldCheck,
  Check,
  Activity,
  ChevronRight,
  Info,
  CalendarDays,
  Layers,
  RefreshCw,
  FileText,
  X,
} from 'lucide-react';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/workspace/StatusBadge';
import { useToast } from '../../context/ToastContext';
import adminApi from '../../services/api/admin.api';
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

export const AdminAssignDoctorsPage = () => {
  const { addToast } = useToast();

  // View state: 'wizard' | 'directory'
  const [activeView, setActiveView] = useState('wizard');

  // Wizard Step: 1 = Clinic, 2 = Doctor, 3 = Fee & Schedule, 4 = Review & Confirm
  const [currentStep, setCurrentStep] = useState(1);

  // Entities state
  const initialEntities = accountRegistry.getEntities();
  const [clinics, setClinics] = useState(initialEntities.clinics || []);
  const [doctors, setDoctors] = useState(initialEntities.doctors || []);
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Clinic Selection State
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [clinicSearch, setClinicSearch] = useState('');
  const [clinicCityFilter, setClinicCityFilter] = useState('all');

  // Step 2: Doctor Selection State
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [doctorSpecFilter, setDoctorSpecFilter] = useState('all');

  // Step 3: Fee & Schedule Setup State
  const [consultationFee, setConsultationFee] = useState('500');
  const [chamberNo, setChamberNo] = useState('Chamber 1');
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('01:00 PM');
  const [maxCapacity, setMaxCapacity] = useState('25');
  const [scheduleType, setScheduleType] = useState('WEEKLY_CUSTOM');

  // Specific schedule details
  const [weeklyCustomDays, setWeeklyCustomDays] = useState(['Mon', 'Wed', 'Fri']);
  const [weeklySpecificDay, setWeeklySpecificDay] = useState('Wednesday');
  const [monthlyDates, setMonthlyDates] = useState([1, 15]);
  const [monthlyWeeks, setMonthlyWeeks] = useState(['Week 1', 'Week 3']);
  const [monthlyWeekday, setMonthlyWeekday] = useState('Saturday');
  const [exceptionDate, setExceptionDate] = useState('');
  const [exceptionNotes, setExceptionNotes] = useState('');

  // Directory search/filter
  const [directorySearch, setDirectorySearch] = useState('');
  const [itemToDelete, setItemToDelete] = useState(null);

  // Load backend entities & assignments
  const loadData = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      const [entitiesRes, assignmentsRes] = await Promise.all([
        adminApi.fetchAllEntities(forceRefresh),
        adminApi.getDoctorClinicAssignments(),
      ]);

      if (entitiesRes.clinics?.length) setClinics(entitiesRes.clinics);
      if (entitiesRes.doctors?.length) setDoctors(entitiesRes.doctors);
      if (assignmentsRes) setAssignments(assignmentsRes);
    } catch (err) {
      console.warn('Error loading assignment entities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update default fee when doctor is selected
  useEffect(() => {
    if (selectedDoctor) {
      if (selectedDoctor.consultationFeePaise) {
        setConsultationFee(String(Math.round(selectedDoctor.consultationFeePaise / 100)));
      } else if (selectedDoctor.consultationFee) {
        setConsultationFee(String(selectedDoctor.consultationFee));
      }
    }
  }, [selectedDoctor]);

  // Filtered Clinics
  const filteredClinics = useMemo(() => {
    return clinics.filter((c) => {
      const q = clinicSearch.toLowerCase();
      const matchesSearch =
        (c.name || '').toLowerCase().includes(q) ||
        (c.line1 || '').toLowerCase().includes(q) ||
        (c.city || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(q);
      const matchesCity = clinicCityFilter === 'all' || (c.city || '').toLowerCase() === clinicCityFilter.toLowerCase();
      return matchesSearch && matchesCity;
    });
  }, [clinics, clinicSearch, clinicCityFilter]);

  // Unique clinic cities
  const clinicCities = useMemo(() => {
    const set = new Set();
    clinics.forEach((c) => {
      if (c.city) set.add(c.city);
    });
    return Array.from(set);
  }, [clinics]);

  // Filtered Doctors
  const filteredDoctors = useMemo(() => {
    return doctors.filter((d) => {
      const q = doctorSearch.toLowerCase();
      const matchesSearch =
        (d.fullName || d.name || '').toLowerCase().includes(q) ||
        (d.specialization || d.specialty || '').toLowerCase().includes(q) ||
        (d.registrationNumber || '').toLowerCase().includes(q) ||
        (d.qualifications || '').toLowerCase().includes(q);
      const matchesSpec =
        doctorSpecFilter === 'all' ||
        (d.specialization || d.specialty || '').toLowerCase() === doctorSpecFilter.toLowerCase();
      return matchesSearch && matchesSpec;
    });
  }, [doctors, doctorSearch, doctorSpecFilter]);

  // Unique doctor specializations
  const doctorSpecializations = useMemo(() => {
    const set = new Set();
    doctors.forEach((d) => {
      const spec = d.specialization || d.specialty;
      if (spec) set.add(spec);
    });
    return Array.from(set);
  }, [doctors]);

  // Compute Schedule Summary string
  const computedScheduleSummary = useMemo(() => {
    const timeSpan = `${startTime} – ${endTime}`;
    switch (scheduleType) {
      case 'DAILY':
        return `Daily (Mon – Sun) • ${timeSpan}`;
      case 'WEEKLY_CUSTOM':
        return `Weekly on ${weeklyCustomDays.join(', ') || 'No days selected'} • ${timeSpan}`;
      case 'WEEKLY_SPECIFIC_DAY':
        return `Weekly every ${weeklySpecificDay} • ${timeSpan}`;
      case 'MONTHLY_SPECIFIC_DATES':
        return `Monthly on dates: ${monthlyDates.join(', ') || 'None'} • ${timeSpan}`;
      case 'MONTHLY_SPECIFIC_WEEKDAY':
        return `Monthly: ${monthlyWeeks.join(' & ') || 'Weeks'} ${monthlyWeekday} • ${timeSpan}`;
      case 'SPECIFIC_DATE_EXCEPTION':
        return `One-off: ${exceptionDate || 'Date pending'} • ${timeSpan}${
          exceptionNotes ? ` (${exceptionNotes})` : ''
        }`;
      default:
        return `Standard • ${timeSpan}`;
    }
  }, [
    scheduleType,
    startTime,
    endTime,
    weeklyCustomDays,
    weeklySpecificDay,
    monthlyDates,
    monthlyWeeks,
    monthlyWeekday,
    exceptionDate,
    exceptionNotes,
  ]);

  // Handle Step 1 -> 2
  const handleProceedToDoctor = () => {
    if (!selectedClinic) {
      addToast('Please select a registered clinic first.', 'error');
      return;
    }
    setCurrentStep(2);
  };

  // Handle Step 2 -> 3
  const handleProceedToSchedule = () => {
    if (!selectedDoctor) {
      addToast('Please select a doctor to assign.', 'error');
      return;
    }
    setCurrentStep(3);
  };

  // Handle Step 3 -> 4
  const handleProceedToReview = () => {
    if (!consultationFee || Number(consultationFee) <= 0) {
      addToast('Please specify a valid clinic consultation fee.', 'error');
      return;
    }
    if (!chamberNo.trim()) {
      addToast('Please assign a chamber or room number.', 'error');
      return;
    }
    if (scheduleType === 'WEEKLY_CUSTOM' && weeklyCustomDays.length === 0) {
      addToast('Please select at least one day for weekly custom schedule.', 'error');
      return;
    }
    if (scheduleType === 'MONTHLY_SPECIFIC_DATES' && monthlyDates.length === 0) {
      addToast('Please select at least one calendar date of the month.', 'error');
      return;
    }
    if (scheduleType === 'MONTHLY_SPECIFIC_WEEKDAY' && monthlyWeeks.length === 0) {
      addToast('Please select week occurrences (e.g. 1st Week, 3rd Week).', 'error');
      return;
    }
    if (scheduleType === 'SPECIFIC_DATE_EXCEPTION' && !exceptionDate) {
      addToast('Please pick the exception session date.', 'error');
      return;
    }
    setCurrentStep(4);
  };

  // Submit Final Assignment
  const handleConfirmAssignment = async () => {
    if (!selectedClinic || !selectedDoctor) return;
    setIsSubmitting(true);
    try {
      const payload = {
        clinicId: selectedClinic.id || selectedClinic.userId,
        clinicName: selectedClinic.name,
        clinicAddress: selectedClinic.line1
          ? `${selectedClinic.line1}, ${selectedClinic.city || 'Kolkata'}`
          : selectedClinic.address || 'Kolkata',
        clinicCity: selectedClinic.city || 'Kolkata',
        clinicImage: selectedClinic.imageUrl || '',
        doctorId: selectedDoctor.id || selectedDoctor.userId,
        doctorName: selectedDoctor.fullName || selectedDoctor.name,
        doctorSpecialization: selectedDoctor.specialization || selectedDoctor.specialty || 'Specialist',
        doctorQualifications: selectedDoctor.qualifications || 'MBBS',
        doctorImage: selectedDoctor.imageUrl || '',
        doctorPhone: selectedDoctor.phone || '',
        consultationFee: Number(consultationFee) || 500,
        chamberNo: chamberNo.trim(),
        startTime,
        endTime,
        timeSlot: `${startTime} - ${endTime}`,
        maxCapacity: Number(maxCapacity) || 25,
        scheduleType,
        scheduleSummary: computedScheduleSummary,
        availableDays:
          scheduleType === 'DAILY'
            ? WEEKDAYS
            : scheduleType === 'WEEKLY_CUSTOM'
            ? weeklyCustomDays
            : scheduleType === 'WEEKLY_SPECIFIC_DAY'
            ? [weeklySpecificDay.slice(0, 3)]
            : scheduleType === 'MONTHLY_SPECIFIC_WEEKDAY'
            ? [monthlyWeekday.slice(0, 3)]
            : ['Special'],
        scheduleDetails: {
          weeklyCustomDays,
          weeklySpecificDay,
          monthlyDates,
          monthlyWeeks,
          monthlyWeekday,
          exceptionDate,
          exceptionNotes,
        },
      };

      const newAssignment = await adminApi.assignDoctorToClinic(payload);
      addToast(
        `Successfully assigned ${payload.doctorName} to ${payload.clinicName} (${payload.chamberNo})!`,
        'success'
      );

      // Refresh assignments
      const updated = await adminApi.getDoctorClinicAssignments();
      setAssignments(updated);

      // Reset wizard
      setCurrentStep(1);
      setSelectedClinic(null);
      setSelectedDoctor(null);
      setActiveView('directory');
    } catch (err) {
      addToast(err.message || 'Failed to complete doctor assignment.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Assignment Status
  const handleToggleStatus = async (assignmentId) => {
    try {
      const updated = await adminApi.toggleAssignmentStatus(assignmentId);
      setAssignments(updated);
      addToast('Assignment status updated.', 'success');
    } catch {
      addToast('Failed to toggle status.', 'error');
    }
  };

  // Remove Assignment
  const handleRemoveAssignment = async () => {
    if (!itemToDelete) return;
    try {
      await adminApi.removeDoctorClinicAssignment(itemToDelete.id);
      setAssignments((prev) => prev.filter((a) => a.id !== itemToDelete.id));
      addToast('Doctor unassigned from clinic successfully.', 'success');
      setItemToDelete(null);
    } catch {
      addToast('Failed to remove assignment.', 'error');
    }
  };

  // Filtered Directory
  const filteredAssignments = useMemo(() => {
    const q = directorySearch.toLowerCase();
    return assignments.filter((a) => {
      return (
        (a.doctorName || '').toLowerCase().includes(q) ||
        (a.clinicName || '').toLowerCase().includes(q) ||
        (a.doctorSpecialization || '').toLowerCase().includes(q) ||
        (a.chamberNo || '').toLowerCase().includes(q) ||
        (a.scheduleSummary || '').toLowerCase().includes(q)
      );
    });
  }, [assignments, directorySearch]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-forest-700 text-xs font-bold uppercase tracking-wider mb-1">
            <CalendarPlus className="w-4 h-4 text-forest-600" />
            <span>Operations & Management Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-forest-900 tracking-tight">
            Assign Doctors to Clinics
          </h1>
          <p className="text-xs sm:text-sm text-brandText-secondary mt-1 max-w-3xl">
            Configure clinic-specific consultation fees, dedicated chambers, and multi-tier recurring schedules (Daily, Weekly custom, Monthly dates/weekdays, and exception sessions).
          </p>
        </div>

        {/* View Switcher: Wizard vs Directory */}
        <div className="flex items-center gap-2">
          <div className="bg-surface-pure border border-brandBorder-subtle p-1 rounded-2xl flex items-center shadow-xs">
            <button
              onClick={() => setActiveView('wizard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeView === 'wizard'
                  ? 'bg-forest-800 text-white shadow-sm'
                  : 'text-brandText-secondary hover:text-forest-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Assignment</span>
            </button>
            <button
              onClick={() => setActiveView('directory')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeView === 'directory'
                  ? 'bg-forest-800 text-white shadow-sm'
                  : 'text-brandText-secondary hover:text-forest-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Active Rosters ({assignments.length})</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            isLoading={isLoading}
            leftIcon={RefreshCw}
            className="text-xs"
          >
            Sync
          </Button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* VIEW 1: STEP-BY-STEP ASSIGNMENT WIZARD                         */}
      {/* ============================================================== */}
      {activeView === 'wizard' && (
        <div className="space-y-6">
          {/* Stepper Progress Bar */}
          <div className="bg-surface-pure p-4 rounded-3xl border border-brandBorder-subtle shadow-card">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { num: 1, title: 'Select Clinic', sub: selectedClinic ? selectedClinic.name : 'Choose center' },
                { num: 2, title: 'Select Doctor', sub: selectedDoctor ? selectedDoctor.fullName || selectedDoctor.name : 'Choose specialist' },
                { num: 3, title: 'Fee & Schedule', sub: `₹${consultationFee} • ${scheduleType.replace(/_/g, ' ')}` },
                { num: 4, title: 'Review & Confirm', sub: 'Verify & activate' },
              ].map((st) => {
                const isPassed = currentStep > st.num;
                const isCurrent = currentStep === st.num;
                return (
                  <div
                    key={st.num}
                    onClick={() => {
                      if (st.num === 1) setCurrentStep(1);
                      if (st.num === 2 && selectedClinic) setCurrentStep(2);
                      if (st.num === 3 && selectedClinic && selectedDoctor) setCurrentStep(3);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                      isCurrent
                        ? 'bg-forest-50/90 border-forest-500 shadow-sm'
                        : isPassed
                        ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                        : 'bg-surface-warm/50 border-brandBorder-subtle opacity-70'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                        isPassed
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-forest-800 text-white'
                          : 'bg-forest-100 text-forest-700'
                      }`}
                    >
                      {isPassed ? <Check className="w-4 h-4" /> : st.num}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-forest-900 truncate">{st.title}</p>
                      <p className="text-[10px] text-brandText-muted truncate">{st.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* STEP 1: SELECT CLINIC                                         */}
          {/* ------------------------------------------------------------ */}
          {currentStep === 1 && (
            <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-card space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brandBorder-subtle">
                <div>
                  <h2 className="text-lg font-heading font-extrabold text-forest-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-forest-700" />
                    <span>Step 1: Select Registered Clinic</span>
                  </h2>
                  <p className="text-xs text-brandText-secondary mt-0.5">
                    Pick the clinic or polyclinic where the doctor will conduct consultations.
                  </p>
                </div>

                {/* Search & City Filter */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-brandText-muted" />
                    <input
                      type="text"
                      value={clinicSearch}
                      onChange={(e) => setClinicSearch(e.target.value)}
                      placeholder="Search clinic name, address..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                    />
                  </div>

                  {clinicCities.length > 0 && (
                    <select
                      value={clinicCityFilter}
                      onChange={(e) => setClinicCityFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                    >
                      <option value="all">All Cities</option>
                      {clinicCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Clinic Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClinics.map((clinic) => {
                  const isSelected = selectedClinic?.id === clinic.id;
                  return (
                    <div
                      key={clinic.id}
                      onClick={() => setSelectedClinic(clinic)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all relative flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? 'bg-forest-50/90 border-forest-500 shadow-md ring-2 ring-forest-500/20'
                          : 'bg-surface-pure hover:bg-forest-50/40 border-brandBorder-subtle hover:border-forest-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-forest-50 border border-forest-100 flex items-center justify-center text-forest-700 flex-shrink-0 overflow-hidden">
                          {clinic.imageUrl ? (
                            <img src={clinic.imageUrl} alt="Clinic" className="w-full h-full object-cover" />
                          ) : (
                            <Building2 className="w-6 h-6" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-xs sm:text-sm text-forest-900 truncate">{clinic.name}</h3>
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected ? 'bg-forest-700 border-forest-700 text-white' : 'border-brandBorder-subtle'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                          <p className="text-[11px] text-brandText-secondary truncate mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-brandText-muted flex-shrink-0" />
                            <span>
                              {clinic.line1 ? `${clinic.line1}, ${clinic.city || 'Kolkata'}` : clinic.address || 'Kolkata'}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-brandBorder-light flex items-center justify-between text-[11px]">
                        <span className="text-brandText-secondary font-medium">
                          {clinic.chamberCount || '6 Chambers'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-100">
                          Certified Clinic
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredClinics.length === 0 && (
                <div className="py-12 text-center text-xs text-brandText-muted">
                  No registered clinics found matching your search.
                </div>
              )}

              {/* Step 1 Actions Bar */}
              <div className="pt-4 border-t border-brandBorder-subtle flex items-center justify-between">
                <div>
                  {selectedClinic && (
                    <span className="text-xs font-semibold text-forest-800">
                      Selected: <strong>{selectedClinic.name}</strong> ({selectedClinic.city || 'Kolkata'})
                    </span>
                  )}
                </div>
                <Button
                  variant="primary"
                  size="md"
                  rightIcon={ArrowRight}
                  onClick={handleProceedToDoctor}
                  disabled={!selectedClinic}
                  className="font-bold px-6 shadow-card"
                >
                  Proceed to Select Doctor
                </Button>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------ */}
          {/* STEP 2: SELECT DOCTOR                                         */}
          {/* ------------------------------------------------------------ */}
          {currentStep === 2 && (
            <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-card space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brandBorder-subtle">
                <div>
                  <h2 className="text-lg font-heading font-extrabold text-forest-900 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-forest-700" />
                    <span>Step 2: Select Registered Doctor</span>
                  </h2>
                  <p className="text-xs text-brandText-secondary mt-0.5">
                    Assigning to <strong>{selectedClinic?.name}</strong>. Choose a licensed specialist from the roster.
                  </p>
                </div>

                {/* Search & Specialization Filter */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-brandText-muted" />
                    <input
                      type="text"
                      value={doctorSearch}
                      onChange={(e) => setDoctorSearch(e.target.value)}
                      placeholder="Search doctor by name, spec..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                    />
                  </div>

                  {doctorSpecializations.length > 0 && (
                    <select
                      value={doctorSpecFilter}
                      onChange={(e) => setDoctorSpecFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                    >
                      <option value="all">All Specializations</option>
                      {doctorSpecializations.map((spec) => (
                        <option key={spec} value={spec}>
                          {spec}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Doctor Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDoctors.map((doc) => {
                  const docId = doc.id || doc.userId;
                  const isSelected = selectedDoctor?.id === doc.id || selectedDoctor?.userId === doc.userId;
                  return (
                    <div
                      key={docId}
                      onClick={() => setSelectedDoctor(doc)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all relative flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? 'bg-forest-50/90 border-forest-500 shadow-md ring-2 ring-forest-500/20'
                          : 'bg-surface-pure hover:bg-forest-50/40 border-brandBorder-subtle hover:border-forest-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-forest-50 border border-forest-100 flex items-center justify-center text-forest-700 flex-shrink-0 overflow-hidden ring-2 ring-forest-300/40">
                          {doc.imageUrl ? (
                            <img src={doc.imageUrl} alt="Doctor" className="w-full h-full object-cover" />
                          ) : (
                            <Stethoscope className="w-6 h-6" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-xs sm:text-sm text-forest-900 truncate">
                              {doc.fullName || doc.name}
                            </h3>
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected ? 'bg-forest-700 border-forest-700 text-white' : 'border-brandBorder-subtle'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                          <p className="text-[11px] font-semibold text-emerald-800 truncate mt-0.5">
                            {doc.specialization || doc.specialty || 'General Physician'}
                          </p>
                          <p className="text-[10px] text-brandText-secondary truncate">
                            {doc.qualifications || 'MBBS'} &bull; {doc.experienceYears || '5'} Yrs Exp
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-brandBorder-light flex items-center justify-between text-[11px]">
                        <span className="text-brandText-muted font-mono">
                          {doc.registrationNumber || 'WBMC-REG'}
                        </span>
                        <span className="font-mono font-bold text-forest-900">
                          Fee: ₹{doc.consultationFeePaise ? Math.round(doc.consultationFeePaise / 100) : doc.consultationFee || 500}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredDoctors.length === 0 && (
                <div className="py-12 text-center text-xs text-brandText-muted">
                  No registered doctors found matching your search.
                </div>
              )}

              {/* Step 2 Actions Bar */}
              <div className="pt-4 border-t border-brandBorder-subtle flex items-center justify-between">
                <Button
                  variant="outline"
                  size="md"
                  leftIcon={ArrowLeft}
                  onClick={() => setCurrentStep(1)}
                  className="font-bold"
                >
                  Back to Clinic
                </Button>
                <div className="flex items-center gap-3">
                  {selectedDoctor && (
                    <span className="text-xs font-semibold text-forest-800 hidden sm:inline">
                      Selected: <strong>{selectedDoctor.fullName || selectedDoctor.name}</strong>
                    </span>
                  )}
                  <Button
                    variant="primary"
                    size="md"
                    rightIcon={ArrowRight}
                    onClick={handleProceedToSchedule}
                    disabled={!selectedDoctor}
                    className="font-bold px-6 shadow-card"
                  >
                    Proceed to Fee & Schedule
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------ */}
          {/* STEP 3: FEE & SCHEDULE SETUP                                  */}
          {/* ------------------------------------------------------------ */}
          {currentStep === 3 && (
            <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-card space-y-6 animate-fade-in">
              <div className="pb-3 border-b border-brandBorder-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-heading font-extrabold text-forest-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-forest-700" />
                    <span>Step 3: Fee & Schedule Setup</span>
                  </h2>
                  <p className="text-xs text-brandText-secondary mt-0.5">
                    Configure clinic-specific pricing, chamber allocation, operating hours, and multi-tier recurrence rules.
                  </p>
                </div>

                {/* Quick Context Pill */}
                <div className="flex items-center gap-2 bg-forest-50 p-2 rounded-2xl border border-forest-100 text-xs">
                  <span className="font-bold text-forest-900">{selectedClinic?.name}</span>
                  <span className="text-brandText-muted">&bull;</span>
                  <span className="font-bold text-emerald-800">{selectedDoctor?.fullName || selectedDoctor?.name}</span>
                </div>
              </div>

              {/* Sub-Section 1: Commercials, Chamber & Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Clinic-specific Fee */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-forest-900 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-forest-700" />
                    <span>Clinic-Specific Consultation Fee (₹) *</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(e.target.value)}
                    placeholder="e.g. 600"
                    className="w-full px-3 py-2 text-sm font-bold font-mono text-forest-900 bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                  />
                  <span className="text-[10px] text-brandText-muted">Fee specifically charged at this clinic desk</span>
                </div>

                {/* Chamber / Room No. */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-forest-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-forest-700" />
                    <span>Chamber / Room Allocation *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={chamberNo}
                    onChange={(e) => setChamberNo(e.target.value)}
                    placeholder="e.g. Chamber 2 (Room 204)"
                    className="w-full px-3 py-2 text-xs font-bold text-forest-900 bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                  />
                  <span className="text-[10px] text-brandText-muted">Room identifier for patient token tickets</span>
                </div>

                {/* Max Capacity per Session */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-forest-900 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-forest-700" />
                    <span>Max Capacity (Patients / Session) *</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(e.target.value)}
                    placeholder="25"
                    className="w-full px-3 py-2 text-sm font-bold font-mono text-forest-900 bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                  />
                  <span className="text-[10px] text-brandText-muted">Max booking tokens accepted per schedule session</span>
                </div>
              </div>

              {/* Sub-Section 2: Start Time & End Time */}
              <div className="bg-surface-warm/40 p-4 rounded-2xl border border-brandBorder-subtle space-y-3">
                <h3 className="text-xs font-bold text-forest-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-forest-700" />
                  <span>Session Consultation Hours</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Start Time */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-brandText-secondary">
                      Start Time *
                    </label>
                    <select
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold text-forest-900 bg-surface-pure border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                    >
                      {STANDARD_TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* End Time */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-brandText-secondary">
                      End Time *
                    </label>
                    <select
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold text-forest-900 bg-surface-pure border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                    >
                      {STANDARD_TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Sub-Section 3: Schedule Type Selector (All 6 Options Requested) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-forest-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-forest-700" />
                    <span>Select Schedule Type *</span>
                  </label>
                  <span className="text-[11px] text-forest-700 font-bold bg-forest-50 px-2.5 py-0.5 rounded-full border border-forest-100">
                    {computedScheduleSummary}
                  </span>
                </div>

                {/* 6 Schedule Type Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {SCHEDULE_TYPES.map((type) => {
                    const isSelected = scheduleType === type.id;
                    return (
                      <div
                        key={type.id}
                        onClick={() => setScheduleType(type.id)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-forest-50/90 border-forest-500 shadow-sm ring-2 ring-forest-500/20'
                            : 'bg-surface-pure hover:bg-forest-50/40 border-brandBorder-subtle'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-xs text-forest-900">{type.title}</p>
                          <div
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              isSelected ? 'bg-forest-700 border-forest-700 text-white' : 'border-brandBorder-subtle'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                        <p className="text-[11px] text-brandText-secondary mt-1">{type.description}</p>
                      </div>
                    );
                  })}
                </div>

                {/* DYNAMIC SUB-CONTROLS ACCORDING TO CHOSEN SCHEDULE TYPE */}

                {/* Option 1: Daily */}
                {scheduleType === 'DAILY' && (
                  <div className="p-4 rounded-2xl bg-forest-50/70 border border-forest-200 text-xs text-forest-900 space-y-2">
                    <div className="flex items-center gap-2 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-forest-700" />
                      <span>Doctor is active 7 days a week (Monday to Sunday)</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {WEEKDAYS.map((day) => (
                        <span key={day} className="px-2.5 py-1 rounded-lg bg-forest-800 text-white font-bold text-[11px]">
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Option 2: Weekly (Custom Days) */}
                {scheduleType === 'WEEKLY_CUSTOM' && (
                  <div className="p-4 rounded-2xl bg-surface-warm/40 border border-brandBorder-subtle space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-forest-900">Select Available Days of the Week:</span>
                      <div className="flex items-center gap-2 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setWeeklyCustomDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])}
                          className="text-forest-700 hover:underline font-bold"
                        >
                          Weekdays
                        </button>
                        <span>&bull;</span>
                        <button
                          type="button"
                          onClick={() => setWeeklyCustomDays(['Sat', 'Sun'])}
                          className="text-forest-700 hover:underline font-bold"
                        >
                          Weekends
                        </button>
                        <span>&bull;</span>
                        <button
                          type="button"
                          onClick={() => setWeeklyCustomDays(WEEKDAYS)}
                          className="text-forest-700 hover:underline font-bold"
                        >
                          All Days
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {WEEKDAYS.map((day) => {
                        const isDaySelected = weeklyCustomDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              if (isDaySelected) {
                                setWeeklyCustomDays(weeklyCustomDays.filter((d) => d !== day));
                              } else {
                                setWeeklyCustomDays([...weeklyCustomDays, day]);
                              }
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                              isDaySelected
                                ? 'bg-forest-800 text-white shadow-sm'
                                : 'bg-surface-pure border border-brandBorder-subtle text-brandText-secondary hover:bg-forest-50'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Option 3: Weekly (Specific Day) */}
                {scheduleType === 'WEEKLY_SPECIFIC_DAY' && (
                  <div className="p-4 rounded-2xl bg-surface-warm/40 border border-brandBorder-subtle space-y-3">
                    <span className="text-xs font-bold text-forest-900 block">Choose the Designated Recurring Weekday:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                      {FULL_WEEKDAYS.map((fDay) => {
                        const isSelected = weeklySpecificDay === fDay;
                        return (
                          <button
                            key={fDay}
                            type="button"
                            onClick={() => setWeeklySpecificDay(fDay)}
                            className={`p-2.5 rounded-xl text-xs font-bold transition-all text-center ${
                              isSelected
                                ? 'bg-forest-800 text-white shadow-sm'
                                : 'bg-surface-pure border border-brandBorder-subtle text-brandText-secondary hover:bg-forest-50'
                            }`}
                          >
                            {fDay}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Option 4: Monthly (Specific Dates) */}
                {scheduleType === 'MONTHLY_SPECIFIC_DATES' && (
                  <div className="p-4 rounded-2xl bg-surface-warm/40 border border-brandBorder-subtle space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-forest-900">
                        Pick Specific Calendar Dates of Each Month (1–31):
                      </span>
                      <div className="flex items-center gap-2 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setMonthlyDates([1, 15])}
                          className="text-forest-700 hover:underline font-bold"
                        >
                          1st & 15th
                        </button>
                        <span>&bull;</span>
                        <button
                          type="button"
                          onClick={() => setMonthlyDates([10, 20, 30])}
                          className="text-forest-700 hover:underline font-bold"
                        >
                          10th, 20th, 30th
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 sm:grid-cols-11 md:grid-cols-16 gap-1.5">
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((dateNum) => {
                        const isDateSelected = monthlyDates.includes(dateNum);
                        return (
                          <button
                            key={dateNum}
                            type="button"
                            onClick={() => {
                              if (isDateSelected) {
                                setMonthlyDates(monthlyDates.filter((d) => d !== dateNum));
                              } else {
                                setMonthlyDates([...monthlyDates, dateNum].sort((a, b) => a - b));
                              }
                            }}
                            className={`py-2 rounded-xl text-xs font-bold font-mono transition-all text-center ${
                              isDateSelected
                                ? 'bg-forest-800 text-white shadow-sm'
                                : 'bg-surface-pure border border-brandBorder-subtle text-brandText-secondary hover:bg-forest-50'
                            }`}
                          >
                            {dateNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Option 5: Monthly (Specific Weekday) */}
                {scheduleType === 'MONTHLY_SPECIFIC_WEEKDAY' && (
                  <div className="p-4 rounded-2xl bg-surface-warm/40 border border-brandBorder-subtle space-y-4">
                    {/* Week occurrences */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-forest-900 block">
                        Select Week Occurrences in the Month:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {MONTH_WEEKS.map((w) => {
                          const isWeekSelected = monthlyWeeks.includes(w);
                          return (
                            <button
                              key={w}
                              type="button"
                              onClick={() => {
                                if (isWeekSelected) {
                                  setMonthlyWeeks(monthlyWeeks.filter((item) => item !== w));
                                } else {
                                  setMonthlyWeeks([...monthlyWeeks, w]);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                isWeekSelected
                                  ? 'bg-forest-800 text-white shadow-sm'
                                  : 'bg-surface-pure border border-brandBorder-subtle text-brandText-secondary hover:bg-forest-50'
                              }`}
                            >
                              {w}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Weekday */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-forest-900 block">Select Designated Weekday:</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                        {FULL_WEEKDAYS.map((fDay) => {
                          const isSelected = monthlyWeekday === fDay;
                          return (
                            <button
                              key={fDay}
                              type="button"
                              onClick={() => setMonthlyWeekday(fDay)}
                              className={`p-2 rounded-xl text-xs font-bold transition-all text-center ${
                                isSelected
                                  ? 'bg-forest-800 text-white shadow-sm'
                                  : 'bg-surface-pure border border-brandBorder-subtle text-brandText-secondary hover:bg-forest-50'
                              }`}
                            >
                              {fDay}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Option 6: Specific Date (Exception) */}
                {scheduleType === 'SPECIFIC_DATE_EXCEPTION' && (
                  <div className="p-4 rounded-2xl bg-surface-warm/40 border border-brandBorder-subtle space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-forest-900">
                          Specific Calendar Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={exceptionDate}
                          onChange={(e) => setExceptionDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-bold text-forest-900 bg-surface-pure border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-forest-900">
                          Exception Notes / Purpose (Optional)
                        </label>
                        <input
                          type="text"
                          value={exceptionNotes}
                          onChange={(e) => setExceptionNotes(e.target.value)}
                          placeholder="e.g. Free Health Camp, Guest Consultant"
                          className="w-full px-3 py-2 text-xs text-forest-900 bg-surface-pure border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3 Actions Bar */}
              <div className="pt-4 border-t border-brandBorder-subtle flex items-center justify-between">
                <Button
                  variant="outline"
                  size="md"
                  leftIcon={ArrowLeft}
                  onClick={() => setCurrentStep(2)}
                  className="font-bold"
                >
                  Back to Doctor
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  rightIcon={ArrowRight}
                  onClick={handleProceedToReview}
                  className="font-bold px-6 shadow-card"
                >
                  Proceed to Review & Confirm
                </Button>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------ */}
          {/* STEP 4: REVIEW & CONFIRM                                      */}
          {/* ------------------------------------------------------------ */}
          {currentStep === 4 && (
            <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-card space-y-6 animate-fade-in">
              <div className="pb-3 border-b border-brandBorder-subtle">
                <h2 className="text-lg font-heading font-extrabold text-forest-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Step 4: Review & Finalize Doctor Assignment</span>
                </h2>
                <p className="text-xs text-brandText-secondary mt-0.5">
                  Verify the doctor mapping, consultation fees, chamber room, and recurring consultation schedule before activating.
                </p>
              </div>

              {/* Assignment Summary Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Clinic Card Summary */}
                <div className="p-5 rounded-2xl bg-forest-50/60 border border-forest-200 space-y-3">
                  <span className="text-[10px] font-bold text-forest-800 uppercase tracking-wider block">
                    Target Clinic / Center
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-surface-pure border border-forest-200 flex items-center justify-center text-forest-800 flex-shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-sm text-forest-900">{selectedClinic?.name}</h3>
                      <p className="text-xs text-brandText-secondary mt-0.5">
                        {selectedClinic?.line1 ? `${selectedClinic.line1}, ${selectedClinic.city || 'Kolkata'}` : selectedClinic?.address || 'Kolkata'}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-forest-200/80 flex items-center justify-between text-xs">
                    <span className="text-brandText-secondary font-medium">Allocated Chamber:</span>
                    <span className="font-bold text-forest-900">{chamberNo}</span>
                  </div>
                </div>

                {/* Doctor Card Summary */}
                <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Assigned Specialist
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-surface-pure border border-emerald-200 flex items-center justify-center text-emerald-800 flex-shrink-0">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-sm text-forest-900">
                        {selectedDoctor?.fullName || selectedDoctor?.name}
                      </h3>
                      <p className="text-xs text-emerald-800 font-semibold mt-0.5">
                        {selectedDoctor?.specialization || selectedDoctor?.specialty || 'General Physician'}
                      </p>
                      <p className="text-[10px] text-brandText-secondary">
                        {selectedDoctor?.qualifications || 'MBBS'} &bull; {selectedDoctor?.registrationNumber || 'WBMC-REG'}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between text-xs">
                    <span className="text-brandText-secondary font-medium">Clinic Fee:</span>
                    <span className="font-bold font-mono text-emerald-900 text-sm">₹{consultationFee}</span>
                  </div>
                </div>
              </div>

              {/* Schedule & Capacity Details Breakdown */}
              <div className="p-5 rounded-2xl bg-surface-warm/40 border border-brandBorder-subtle space-y-3">
                <h3 className="text-xs font-bold text-forest-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-forest-700" />
                  <span>Configured Roster & Recurrence Rules</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
                  <div>
                    <span className="text-brandText-muted block text-[11px]">Schedule Type</span>
                    <span className="font-bold text-forest-900">{scheduleType.replace(/_/g, ' ')}</span>
                  </div>
                  <div>
                    <span className="text-brandText-muted block text-[11px]">Consultation Timings</span>
                    <span className="font-bold text-forest-900">{startTime} to {endTime}</span>
                  </div>
                  <div>
                    <span className="text-brandText-muted block text-[11px]">Token Capacity</span>
                    <span className="font-bold text-forest-900">{maxCapacity} Patients / Session</span>
                  </div>
                </div>

                <div className="p-3 bg-surface-pure rounded-xl border border-brandBorder-subtle mt-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-forest-700 flex-shrink-0" />
                  <span className="text-xs font-bold text-forest-900">
                    Live Booking Display: {computedScheduleSummary}
                  </span>
                </div>
              </div>

              {/* Step 4 Actions Bar */}
              <div className="pt-4 border-t border-brandBorder-subtle flex items-center justify-between">
                <Button
                  variant="outline"
                  size="md"
                  leftIcon={ArrowLeft}
                  onClick={() => setCurrentStep(3)}
                  disabled={isSubmitting}
                  className="font-bold"
                >
                  Back to Schedule Setup
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={Check}
                  onClick={handleConfirmAssignment}
                  isLoading={isSubmitting}
                  className="font-bold px-8 shadow-card"
                >
                  Confirm & Activate Assignment
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 2: ACTIVE ASSIGNMENTS DIRECTORY & LEDGER                  */}
      {/* ============================================================== */}
      {activeView === 'directory' && (
        <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-card space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brandBorder-subtle">
            <div>
              <h2 className="text-lg font-heading font-extrabold text-forest-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-forest-700" />
                <span>Active Doctor-Clinic Assignments ({assignments.length})</span>
              </h2>
              <p className="text-xs text-brandText-secondary mt-0.5">
                Overview of all currently active and configured doctor assignments across the clinic network.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-brandText-muted" />
                <input
                  type="text"
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  placeholder="Search by doctor, clinic, room..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                />
              </div>

              <Button
                variant="primary"
                size="sm"
                leftIcon={Plus}
                onClick={() => {
                  setCurrentStep(1);
                  setActiveView('wizard');
                }}
                className="text-xs font-bold shadow-card whitespace-nowrap"
              >
                Assign Doctor
              </Button>
            </div>
          </div>

          {/* Assignments Table */}
          <div className="border border-brandBorder-subtle rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-warm text-brandText-secondary font-semibold border-b border-brandBorder-subtle">
                <tr>
                  <th className="py-3 px-3.5">Doctor & Specialty</th>
                  <th className="py-3 px-3.5">Clinic & Chamber</th>
                  <th className="py-3 px-3.5">Fee</th>
                  <th className="py-3 px-3.5">Schedule & Timings</th>
                  <th className="py-3 px-3.5">Capacity</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brandBorder-light bg-surface-pure">
                {filteredAssignments.map((asg) => (
                  <tr key={asg.id} className="hover:bg-forest-50/40 transition-colors">
                    {/* Doctor Column */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-forest-50 border border-forest-100 flex items-center justify-center text-forest-700 flex-shrink-0">
                          <Stethoscope className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-forest-900">{asg.doctorName}</p>
                          <p className="text-[10px] text-emerald-800 font-semibold">{asg.doctorSpecialization}</p>
                        </div>
                      </div>
                    </td>

                    {/* Clinic & Chamber */}
                    <td className="py-3 px-3.5">
                      <p className="font-bold text-forest-900">{asg.clinicName}</p>
                      <p className="text-[10px] text-brandText-secondary font-medium">
                        {asg.chamberNo} &bull; {asg.clinicCity || 'Kolkata'}
                      </p>
                    </td>

                    {/* Fee */}
                    <td className="py-3 px-3.5 font-mono font-bold text-forest-900">
                      ₹{asg.consultationFee}
                    </td>

                    {/* Schedule & Timings */}
                    <td className="py-3 px-3.5 max-w-xs">
                      <div className="space-y-0.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-forest-100 text-forest-800 inline-block">
                          {asg.scheduleType?.replace(/_/g, ' ') || 'WEEKLY'}
                        </span>
                        <p className="text-[11px] font-medium text-forest-900">{asg.scheduleSummary}</p>
                      </div>
                    </td>

                    {/* Capacity */}
                    <td className="py-3 px-3.5">
                      <span className="font-bold font-mono text-forest-900">{asg.maxCapacity || 25}</span>
                      <span className="text-[10px] text-brandText-muted block">patients / slot</span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3.5">
                      <StatusBadge status={asg.status || 'ACTIVE'} />
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(asg.id)}
                          title="Toggle Active / Inactive"
                          className={`p-1.5 rounded-lg border transition-all ${
                            asg.status === 'INACTIVE'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              : 'bg-surface-pure text-forest-700 border-brandBorder-subtle hover:bg-forest-50'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setItemToDelete(asg)}
                          title="Unassign Doctor"
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-brandBorder-subtle hover:border-rose-200 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredAssignments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-brandText-muted">
                      No assignments found. Click "Assign Doctor" to create your first clinic-specialist schedule.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Unassign Doctor */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm" onClick={() => setItemToDelete(null)} />
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-surface-pure rounded-3xl p-6 shadow-floating border border-brandBorder-subtle text-left relative animate-scale-up space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-base text-forest-900">
                  Unassign Doctor from Clinic?
                </h3>
                <p className="text-xs text-brandText-secondary mt-1">
                  Are you sure you want to remove <strong>{itemToDelete.doctorName}</strong> from{' '}
                  <strong>{itemToDelete.clinicName}</strong> ({itemToDelete.chamberNo})? Live appointments and token allocations for this roster will be halted.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setItemToDelete(null)}>
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

export default AdminAssignDoctorsPage;
