import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Stethoscope,
  Building2,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  X,
  Plus,
  Activity,
  Check,
  ChevronRight,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import DataTable from '../../components/workspace/DataTable';
import StatusBadge from '../../components/workspace/StatusBadge';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import adminApi from '../../services/api/admin.api';
import { clinicApi } from '../../services/api/clinic.api';

export const AdminAppointmentsPage = () => {
  const { addToast } = useToast();

  // State
  const [clinics, setClinics] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedClinicId, setSelectedClinicId] = useState('ALL');
  const [selectedDoctorId, setSelectedDoctorId] = useState('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected appointment for details drawer
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Load Clinics, Doctors and Appointments
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [clinicsRes, doctorsRes] = await Promise.all([
        adminApi.getClinics(),
        adminApi.getDoctors(),
      ]);

      const loadedClinics = clinicsRes.clinics || [];
      const loadedDoctors = doctorsRes.doctors || [];
      setClinics(loadedClinics);
      setDoctors(loadedDoctors);

      // Collect appointments from all clinics
      let allApts = [];
      try {
        const defaultApts = await clinicApi.getClinicAppointments('default');
        allApts = [...defaultApts];
      } catch {}

      // If clinics have their own storage keys
      for (const cl of loadedClinics) {
        try {
          const clApts = await clinicApi.getClinicAppointments(cl.id);
          clApts.forEach((a) => {
            if (!allApts.some((item) => item.id === a.id)) {
              allApts.push({ ...a, clinicName: cl.name, clinicId: cl.id });
            }
          });
        } catch {}
      }

      setAppointments(allApts);
    } catch (err) {
      console.error('Error loading clinic appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Appointments
  const filteredAppointments = appointments.filter((apt) => {
    // 1. Clinic filter
    if (selectedClinicId !== 'ALL' && apt.clinicId !== selectedClinicId && apt.clinicName !== selectedClinicId) {
      return false;
    }
    // 2. Doctor filter
    if (selectedDoctorId !== 'ALL' && apt.doctorId !== selectedDoctorId && !apt.doctor?.includes(selectedDoctorId)) {
      return false;
    }
    // 3. Date filter
    if (selectedDateFilter === 'TODAY' && apt.date !== 'Today') return false;
    if (selectedDateFilter === 'TOMORROW' && apt.date !== 'Tomorrow') return false;
    // 4. Status filter
    if (selectedStatusFilter !== 'ALL' && apt.status !== selectedStatusFilter) return false;
    // 5. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPatient = apt.patientName?.toLowerCase().includes(q) || apt.phone?.includes(q);
      const matchDoc = apt.doctorName?.toLowerCase().includes(q) || apt.doctor?.toLowerCase().includes(q);
      const matchClinic = apt.clinicName?.toLowerCase().includes(q);
      const matchId = apt.id?.toLowerCase().includes(q) || apt.tokenNumber?.toLowerCase().includes(q);
      return matchPatient || matchDoc || matchClinic || matchId;
    }
    return true;
  });

  // Calculate Metrics
  const totalBookings = filteredAppointments.length;
  const inChamberCount = filteredAppointments.filter((a) => a.status === 'IN_CHAMBER').length;
  const waitingCount = filteredAppointments.filter((a) => a.status === 'CHECKED_IN').length;
  const completedCount = filteredAppointments.filter((a) => a.status === 'COMPLETED').length;
  const totalRevenue = filteredAppointments.reduce((sum, a) => sum + (Number(a.consultationFee) || 500), 0);

  // Status transitions
  const handleUpdateStatus = (appointmentId, newStatus) => {
    const updated = appointments.map((a) =>
      a.id === appointmentId ? { ...a, status: newStatus } : a
    );
    setAppointments(updated);
    if (selectedAppointment && selectedAppointment.id === appointmentId) {
      setSelectedAppointment({ ...selectedAppointment, status: newStatus });
    }
    addToast(`Appointment status updated to ${newStatus}`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-forest-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Activity className="w-3.5 h-3.5" />
            <span>Operations Tab &bull; Real-time Clinic Desks</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-forest-900 tracking-tight">
            Clinic-wise Appointment Tracking
          </h1>
          <p className="text-xs sm:text-sm text-brandText-secondary mt-1">
            Monitor real-time patient appointments, chamber queues, live token progress, and doctor consultations clinic-by-clinic.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            isLoading={isLoading}
            leftIcon={RefreshCw}
            className="text-xs"
          >
            Refresh Desk
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle p-4 shadow-card">
          <p className="text-[11px] font-bold text-brandText-secondary uppercase tracking-wider">Total Bookings</p>
          <p className="text-2xl font-extrabold font-heading text-forest-900 mt-1">{totalBookings}</p>
          <span className="text-[10px] text-forest-700 font-medium">Selected scope</span>
        </div>

        <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle p-4 shadow-card">
          <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">In Waiting Lounge</p>
          <p className="text-2xl font-extrabold font-heading text-amber-800 mt-1">{waitingCount}</p>
          <span className="text-[10px] text-amber-600 font-medium">Token checked-in</span>
        </div>

        <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle p-4 shadow-card">
          <p className="text-[11px] font-bold text-forest-700 uppercase tracking-wider">In Chamber</p>
          <p className="text-2xl font-extrabold font-heading text-forest-900 mt-1">{inChamberCount}</p>
          <span className="text-[10px] text-forest-700 font-medium">Under consultation</span>
        </div>

        <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle p-4 shadow-card">
          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Completed</p>
          <p className="text-2xl font-extrabold font-heading text-emerald-800 mt-1">{completedCount}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Consulted</span>
        </div>

        <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle p-4 shadow-card col-span-2 sm:col-span-1">
          <p className="text-[11px] font-bold text-forest-700 uppercase tracking-wider">Fee Volume</p>
          <p className="text-2xl font-extrabold font-heading text-forest-900 mt-1">₹{totalRevenue.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-forest-700 font-medium">Total consultation fees</span>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle p-4 shadow-card space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Clinic Selector */}
          <div>
            <label className="block text-xs font-bold text-forest-900 mb-1">
              Select Clinic:
            </label>
            <select
              value={selectedClinicId}
              onChange={(e) => setSelectedClinicId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl font-bold text-forest-800 focus:outline-none focus:border-forest-500"
            >
              <option value="ALL">All Partner Clinics ({clinics.length})</option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Doctor Selector */}
          <div>
            <label className="block text-xs font-bold text-forest-900 mb-1">
              Select Doctor:
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl font-bold text-forest-800 focus:outline-none focus:border-forest-500"
            >
              <option value="ALL">All Consulting Doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName} ({d.specialization})
                </option>
              ))}
            </select>
          </div>

          {/* Date Selector */}
          <div>
            <label className="block text-xs font-bold text-forest-900 mb-1">
              Date Filter:
            </label>
            <select
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl font-bold text-forest-800 focus:outline-none focus:border-forest-500"
            >
              <option value="ALL">All Dates</option>
              <option value="TODAY">Today Only</option>
              <option value="TOMORROW">Tomorrow</option>
            </select>
          </div>

          {/* Status Selector */}
          <div>
            <label className="block text-xs font-bold text-forest-900 mb-1">
              Live Queue Status:
            </label>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl font-bold text-forest-800 focus:outline-none focus:border-forest-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="CHECKED_IN">Checked In / Waiting Lounge</option>
              <option value="IN_CHAMBER">In Doctor Chamber</option>
              <option value="COMPLETED">Completed Consultation</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-brandText-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search appointment by patient name, phone, doctor name or appointment ID..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-brandBorder-subtle bg-surface-warm/50 text-[11px] font-bold text-brandText-secondary uppercase tracking-wider">
                <th className="py-3 px-4">Token & Time</th>
                <th className="py-3 px-4">Patient Details</th>
                <th className="py-3 px-4">Doctor & Chamber</th>
                <th className="py-3 px-4">Clinic Facility</th>
                <th className="py-3 px-4">Fee & Mode</th>
                <th className="py-3 px-4">Live Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brandBorder-subtle text-xs">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-brandText-muted">
                    No appointments matching the selected clinic and filters.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-forest-50/40 transition-colors">
                    {/* Token & Time */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-forest-800 text-white font-extrabold flex items-center justify-center text-xs">
                          {apt.tokenNumber || '#01'}
                        </span>
                        <div>
                          <p className="font-bold text-forest-900">{apt.slot || '10:00 AM'}</p>
                          <p className="text-[10px] text-brandText-muted">{apt.date || 'Today'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Patient */}
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-forest-900">{apt.patientName}</p>
                      <p className="text-[11px] text-brandText-secondary font-mono">+91 {apt.phone}</p>
                      <span className="text-[10px] text-brandText-muted">
                        {apt.gender || 'Patient'}, {apt.age ? `${apt.age} yrs` : ''}
                      </span>
                    </td>

                    {/* Doctor & Chamber */}
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-forest-900">{apt.doctorName || apt.doctor}</p>
                      <p className="text-[11px] text-forest-700 font-medium">{apt.specialization || 'Consultant'}</p>
                      <span className="inline-block mt-0.5 text-[10px] font-bold text-forest-800 bg-forest-50 px-1.5 py-0.5 rounded">
                        {apt.room || 'Chamber 1'}
                      </span>
                    </td>

                    {/* Clinic Facility */}
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-forest-900">{apt.clinicName || 'Apollo Clinic'}</p>
                      <p className="text-[10px] text-brandText-muted">{apt.id}</p>
                    </td>

                    {/* Fee & Mode */}
                    <td className="py-3.5 px-4">
                      <p className="font-extrabold text-forest-900">₹{apt.consultationFee || 500}</p>
                      <span className={`inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        apt.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {apt.paymentStatus === 'PAID' ? 'Paid Online' : 'Pay at Desk'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <StatusBadge status={apt.status || 'SCHEDULED'} />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAppointment(apt)}
                          className="text-[11px] py-1 px-2.5 text-forest-800"
                        >
                          View Details
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* DRAWER / MODAL: APPOINTMENT DETAILS & QUICK ACTIONS            */}
      {/* ============================================================== */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm"
            onClick={() => setSelectedAppointment(null)}
          />
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-surface-pure rounded-3xl p-6 shadow-floating border border-brandBorder-subtle text-left relative animate-scale-up">
              <div className="flex items-center justify-between pb-3 border-b border-brandBorder-subtle">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-2xl bg-forest-800 text-white font-extrabold flex items-center justify-center text-sm">
                    {selectedAppointment.tokenNumber}
                  </span>
                  <div>
                    <h3 className="font-heading font-extrabold text-base text-forest-900">
                      Appointment #{selectedAppointment.id}
                    </h3>
                    <p className="text-[11px] text-brandText-secondary">
                      {selectedAppointment.slot} &bull; {selectedAppointment.date}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="p-1.5 text-brandText-muted hover:text-forest-700 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Details Content */}
              <div className="mt-4 space-y-4">
                {/* Patient Information */}
                <div className="p-3.5 bg-surface-warm rounded-2xl border border-brandBorder-subtle">
                  <p className="text-[11px] font-bold text-brandText-muted uppercase">Patient Information</p>
                  <p className="text-sm font-extrabold text-forest-900 mt-0.5">{selectedAppointment.patientName}</p>
                  <p className="text-xs text-brandText-secondary font-mono mt-0.5">+91 {selectedAppointment.phone}</p>
                  <p className="text-[11px] text-brandText-muted mt-0.5">
                    Age: {selectedAppointment.age || 35} yrs &bull; Gender: {selectedAppointment.gender || 'Patient'}
                  </p>
                  {selectedAppointment.symptoms && (
                    <p className="text-xs text-forest-800 mt-2 p-2 bg-surface-pure rounded-xl border border-brandBorder-subtle">
                      <strong>Reason for Visit:</strong> {selectedAppointment.symptoms}
                    </p>
                  )}
                </div>

                {/* Doctor & Facility */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-forest-50/60 rounded-2xl border border-forest-100">
                    <p className="text-[10px] font-bold text-forest-700 uppercase">Consulting Doctor</p>
                    <p className="text-xs font-bold text-forest-900 mt-1">{selectedAppointment.doctorName || selectedAppointment.doctor}</p>
                    <p className="text-[10px] text-brandText-muted">{selectedAppointment.specialization}</p>
                  </div>

                  <div className="p-3 bg-forest-50/60 rounded-2xl border border-forest-100">
                    <p className="text-[10px] font-bold text-forest-700 uppercase">Clinic & Chamber</p>
                    <p className="text-xs font-bold text-forest-900 mt-1">{selectedAppointment.clinicName}</p>
                    <p className="text-[10px] text-forest-700 font-bold">{selectedAppointment.room || 'Chamber 1'}</p>
                  </div>
                </div>

                {/* Billing Summary */}
                <div className="p-3.5 bg-surface-warm rounded-2xl border border-brandBorder-subtle flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-brandText-muted uppercase">Consultation Fee</p>
                    <p className="text-base font-extrabold text-forest-900">₹{selectedAppointment.consultationFee || 500}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={selectedAppointment.status} />
                    <p className="text-[10px] text-brandText-muted mt-1">
                      Payment: {selectedAppointment.paymentStatus === 'PAID' ? 'Online Pre-paid' : 'Pay at Desk'}
                    </p>
                  </div>
                </div>

                {/* Quick Status Transition Actions */}
                <div className="pt-2 border-t border-brandBorder-subtle">
                  <p className="text-xs font-bold text-forest-900 mb-2">Change Live Queue State:</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'IN_CHAMBER')}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-forest-800 text-white hover:bg-forest-900 transition-colors"
                    >
                      Call into Chamber
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'COMPLETED')}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                    >
                      Mark Completed
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'CANCELLED')}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                    >
                      Cancel Slot
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAppointmentsPage;