import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle,
  Search,
  UserCheck,
  Plus,
  X,
  Stethoscope,
  Building2,
  Loader2,
} from 'lucide-react';
import DataTable from '../../components/workspace/DataTable';
import StatusBadge from '../../components/workspace/StatusBadge';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import { clinicApi } from '../../services/api/clinic.api';

export const ReceptionistAppointmentsPage = () => {
  const { user } = useAuth();
  const { generateToken } = useWorkspaceStore();
  const { addToast } = useToast();

  const [clinic, setClinic] = useState({ name: 'Apollo Clinic & Polyclinic', city: 'Kolkata' });
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Appointment Booking Modal
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    patientName: '',
    phone: '',
    age: '',
    gender: 'Male',
    doctorId: '',
    slot: '11:00 AM',
    date: 'Today',
    symptoms: 'Scheduled OPD Consultation',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [profile, docs, apts] = await Promise.all([
        clinicApi.getClinicProfile(user),
        clinicApi.getClinicDoctors(user?.id || 'default'),
        clinicApi.getClinicAppointments(user?.id || 'default'),
      ]);

      setClinic(profile);
      setDoctors(docs);
      setAppointments(apts);

      if (docs.length > 0 && !bookingForm.doctorId) {
        setBookingForm((prev) => ({ ...prev, doctorId: docs[0].id }));
      }
    } catch (e) {
      console.warn('Failed to load clinic appointments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleAptsUpdate = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setAppointments(e.detail);
      } else {
        loadData();
      }
    };

    window.addEventListener('oshud_clinic_appointments_updated', handleAptsUpdate);
    return () => {
      window.removeEventListener('oshud_clinic_appointments_updated', handleAptsUpdate);
    };
  }, [user]);

  const handleCheckIn = async (apt) => {
    // Determine target doctor details
    const targetDoc =
      doctors.find((d) => d.id === apt.doctorId || d.doctorId === apt.doctorId) ||
      doctors.find((d) => apt.doctor && apt.doctor.includes(d.name)) ||
      doctors[0];

    const doctorId = targetDoc?.id || apt.doctorId || 'doc-01';
    const doctorName = targetDoc?.name || apt.doctorName || 'Dr. Priya Sharma';
    const room = targetDoc?.room || apt.room || 'Room 204';

    // 1. Generate live token specifically for this doctor's queue
    const token = generateToken({
      patientName: apt.patientName,
      patientPhone: apt.phone,
      age: apt.age,
      gender: apt.gender,
      symptoms: apt.symptoms || 'Scheduled OPD Consultation',
      type: 'APPOINTMENT',
      doctorId,
      doctorName,
      clinicName: clinic.name,
      room,
      slot: apt.slot,
    });

    // 2. Mark as checked in in the clinic appointments store
    await clinicApi.checkInAppointment(user?.id || 'default', apt.id);

    setAppointments((prev) =>
      prev.map((a) => (a.id === apt.id ? { ...a, checkedIn: true, status: 'CHECKED_IN' } : a))
    );

    addToast(
      `Checked in ${apt.patientName}! Token #${token.tokenNumber} routed to ${doctorName} (${room}).`,
      'success'
    );
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookingForm.patientName || !bookingForm.phone) return;

    const chosenDoc =
      doctors.find((d) => d.id === bookingForm.doctorId || d.doctorId === bookingForm.doctorId) ||
      doctors[0];

    try {
      const created = await clinicApi.createAppointment(user?.id || 'default', {
        ...bookingForm,
        doctorName: chosenDoc?.name || 'Doctor',
        room: chosenDoc?.room || 'Room 204',
        doctor: `${chosenDoc?.name} (${chosenDoc?.room})`,
      });

      addToast(`Appointment ${created.id} booked for ${created.patientName}!`, 'success');
      setShowBookingModal(false);
      setBookingForm({
        patientName: '',
        phone: '',
        age: '',
        gender: 'Male',
        doctorId: doctors[0]?.id || '',
        slot: '11:00 AM',
        date: 'Today',
        symptoms: 'Scheduled OPD Consultation',
      });
      await loadData();
    } catch (err) {
      addToast(err.message || 'Failed to book appointment', 'error');
    }
  };

  const columns = [
    {
      header: 'Appt Ref',
      key: 'id',
      render: (row) => <span className="font-mono font-bold text-xs text-forest-800">{row.id}</span>,
    },
    {
      header: 'Scheduled Slot',
      key: 'slot',
      render: (row) => (
        <div className="flex items-center gap-1.5 font-bold text-xs text-forest-900">
          <Clock className="w-3.5 h-3.5 text-forest-600" />
          <span>{row.slot}</span>
          <span className="text-[10px] text-brandText-muted font-normal">({row.date || 'Today'})</span>
        </div>
      ),
    },
    {
      header: 'Patient Details',
      key: 'patientName',
      render: (row) => (
        <div>
          <p className="font-bold text-xs text-forest-900">{row.patientName}</p>
          <p className="text-[11px] text-brandText-secondary">{row.gender}, {row.age} yrs &bull; {row.phone}</p>
        </div>
      ),
    },
    {
      header: 'Consulting Doctor & Room',
      key: 'doctor',
      render: (row) => (
        <div className="space-y-0.5">
          <p className="text-xs text-forest-900 font-bold">{row.doctorName || row.doctor}</p>
          <p className="text-[10px] text-forest-700 font-medium">{row.room || 'Consultation Room'}</p>
        </div>
      ),
    },
    {
      header: 'Desk Action',
      key: 'action',
      align: 'right',
      render: (row) =>
        row.checkedIn ? (
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            <span>Checked-in to Queue</span>
          </span>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleCheckIn(row)}
            className="text-xs py-1"
          >
            Check-in Patient
          </Button>
        ),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-12 bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card space-y-3">
        <Loader2 className="w-8 h-8 text-forest-700 animate-spin" />
        <p className="text-sm font-bold text-forest-900">Loading Appointments Ledger...</p>
        <p className="text-xs text-brandText-secondary">Fetching pre-booked patient slots and chamber schedules</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-heading font-extrabold text-forest-900">
              Pre-booked Appointment Check-in
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-100 text-forest-800 uppercase">
              {clinic.name}
            </span>
          </div>
          <p className="text-xs text-brandText-secondary mt-0.5">
            Mark patient arrival to generate and push token ticket into active doctor consultation queue.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={Plus}
          onClick={() => setShowBookingModal(true)}
          className="text-xs font-bold shadow-md"
        >
          Book New Appointment
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={appointments}
        searchKey="patientName"
        searchPlaceholder="Search booked patient by name or phone..."
      />

      {/* Book New Appointment Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 bg-forest-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-floating max-w-md w-full p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-brandBorder-subtle pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-base text-forest-900">
                    Book Clinic Appointment
                  </h3>
                  <p className="text-[11px] text-brandText-secondary">
                    Schedule slot for {clinic.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="p-1 rounded-lg text-brandText-muted hover:text-forest-900 hover:bg-surface-warm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-forest-800">Consulting Doctor</label>
                <select
                  required
                  value={bookingForm.doctorId}
                  onChange={(e) => setBookingForm({ ...bookingForm, doctorId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                >
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} — {doc.specialty} ({doc.room})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-forest-800">Patient Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra Sen"
                  value={bookingForm.patientName}
                  onChange={(e) => setBookingForm({ ...bookingForm, patientName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-forest-800">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98300..."
                    value={bookingForm.phone}
                    onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-forest-800">Age</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={120}
                    placeholder="45"
                    value={bookingForm.age}
                    onChange={(e) => setBookingForm({ ...bookingForm, age: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-forest-800">Appointment Slot</label>
                  <select
                    value={bookingForm.slot}
                    onChange={(e) => setBookingForm({ ...bookingForm, slot: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                  >
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="12:30 PM">12:30 PM</option>
                    <option value="01:00 PM">01:00 PM</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-forest-800">Date</label>
                  <select
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                  >
                    <option value="Today">Today</option>
                    <option value="Tomorrow">Tomorrow</option>
                    <option value="Day After">Day After</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-forest-800">Consultation Reason / Symptoms</label>
                <input
                  type="text"
                  placeholder="e.g. Follow-up consultation, ECG review"
                  value={bookingForm.symptoms}
                  onChange={(e) => setBookingForm({ ...bookingForm, symptoms: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBookingModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  leftIcon={Plus}
                  className="text-xs font-bold"
                >
                  Save Booking
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistAppointmentsPage;
