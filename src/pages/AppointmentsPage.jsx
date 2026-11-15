import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Search,
  Filter,
  Clock,
  MapPin,
  Ticket,
  User,
  CheckCircle2,
  AlertCircle,
  Phone,
  XCircle,
  ArrowRight
} from 'lucide-react';
import { doctorService } from '../services/doctorService';
import DoctorCard from '../components/doctors/DoctorCard';
import BookingModal from '../components/doctors/BookingModal';
import Button from '../components/common/Button';
import { useToast } from '../context/ToastContext';

export const AppointmentsPage = () => {
  const [searchParams] = useSearchParams();
  const highlightedDoctorId = searchParams.get('doctor');
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('find'); // 'find' | 'my-appointments'
  const [doctors, setDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState(null);
  const [userAppointments, setUserAppointments] = useState([]);

  const specialties = [
    'All',
    'General Physician',
    'Cardiologist',
    'Dermatologist',
    'Pediatrician',
    'Gynecologist',
    'Orthopedic'
  ];

  useEffect(() => {
    const fetchDocs = async () => {
      const res = await doctorService.getDoctors({
        specialization: selectedSpecialty === 'All' ? '' : selectedSpecialty,
        search: searchQuery
      });
      setDoctors(res.doctors);
    };
    fetchDocs();

    setUserAppointments(doctorService.getUserAppointments());
  }, [selectedSpecialty, searchQuery]);

  useEffect(() => {
    if (highlightedDoctorId && doctors.length > 0) {
      const doc = doctors.find((d) => d.id === highlightedDoctorId);
      if (doc) setSelectedDoctorForBooking(doc);
    }
  }, [highlightedDoctorId, doctors]);

  const handleBookingSuccess = () => {
    setUserAppointments(doctorService.getUserAppointments());
    setActiveTab('my-appointments');
  };

  const handleCancelAppointment = (id) => {
    const updated = userAppointments.filter((a) => a.id !== id);
    setUserAppointments(updated);
    localStorage.setItem('oshud_appointments', JSON.stringify(updated));
    addToast('Appointment cancelled successfully.', 'info');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-forest-800">
            Doctor Consultations & Appointments
          </h1>
          <p className="text-xs sm:text-sm text-brandText-secondary mt-1">
            Book trusted doctors, track live clinic queue tokens, and skip waiting rooms
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-2xl p-1 bg-surface-pure border border-brandBorder-subtle shadow-subtle self-start sm:self-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('find')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'find'
                ? 'bg-forest-600 text-white shadow-sm'
                : 'text-brandText-secondary hover:text-forest-700'
            }`}
          >
            Find Doctors ({doctors.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('my-appointments')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'my-appointments'
                ? 'bg-forest-600 text-white shadow-sm'
                : 'text-brandText-secondary hover:text-forest-700'
            }`}
          >
            My Appointments ({userAppointments.length})
          </button>
        </div>
      </div>

      {activeTab === 'find' ? (
        /* Find Doctors View */
        <div className="space-y-6">
          {/* Search & Specialty Filters Bar */}
          <div className="bg-surface-pure p-4 sm:p-5 rounded-2xl border border-brandBorder-subtle shadow-subtle space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-brandText-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search doctors by name, specialty, or clinic name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 text-brandText-main"
              />
            </div>

            {/* Specialty Pills */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pt-1 border-t border-brandBorder-light">
              {specialties.map((spec) => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => setSelectedSpecialty(spec)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedSpecialty === spec
                      ? 'bg-forest-700 text-white shadow-subtle font-bold'
                      : 'bg-forest-50 text-forest-800 hover:bg-forest-100'
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>

          {/* Doctors Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {doctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                onBook={(doc) => setSelectedDoctorForBooking(doc)}
                onSelect={(doc) => setSelectedDoctorForBooking(doc)}
              />
            ))}
          </div>
        </div>
      ) : (
        /* My Appointments & Live Queue Tokens View */
        <div className="space-y-6">
          {userAppointments.length === 0 ? (
            <div className="bg-surface-pure rounded-3xl p-12 text-center border border-brandBorder-subtle max-w-md mx-auto space-y-3">
              <div className="w-16 h-16 rounded-full bg-forest-50 text-forest-600 mx-auto flex items-center justify-center">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="font-heading font-bold text-lg text-forest-800">
                No active appointments
              </h3>
              <p className="text-xs text-brandText-secondary">
                You do not have any upcoming doctor appointments scheduled.
              </p>
              <div className="pt-2">
                <Button variant="primary" size="sm" onClick={() => setActiveTab('find')}>
                  Find a Doctor
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {userAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 space-y-5"
                >
                  {/* Doctor Info */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={apt.doctorImage}
                        alt={apt.doctorName}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-sm flex-shrink-0"
                      />
                      <div>
                        <h3 className="font-heading font-bold text-base text-forest-800">
                          {apt.doctorName}
                        </h3>
                        <p className="text-xs text-forest-600 font-semibold">
                          {apt.doctorSpecialization}
                        </p>
                        <p className="text-xs text-brandText-secondary flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-forest-500" />
                          {apt.clinicName}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                      Confirmed
                    </span>
                  </div>

                  {/* Live Queue Token Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-forest-800 to-forest-950 text-white shadow-card space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <p className="text-[11px] text-forest-200 uppercase tracking-wider font-semibold">
                          Your Queue Token
                        </p>
                        <p className="text-3xl font-extrabold tracking-tight mt-0.5">
                          {apt.tokenNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-forest-200 uppercase tracking-wider font-semibold">
                          Now Serving
                        </p>
                        <p className="text-2xl font-extrabold text-emerald-300 mt-0.5">
                          {apt.currentServingToken || 'GP-11'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-forest-200 pt-1">
                      <span>Scheduled: {apt.date} at {apt.slotTime}</span>
                      <span className="font-semibold text-emerald-300">
                        Estimated Wait: {apt.estimatedWait || '15 mins'}
                      </span>
                    </div>
                  </div>

                  {/* Patient & Clinic Details */}
                  <div className="bg-surface-warm p-4 rounded-2xl border border-brandBorder-subtle space-y-2 text-xs text-brandText-main">
                    <div className="flex justify-between">
                      <span className="text-brandText-secondary">Patient Name:</span>
                      <span className="font-bold">{apt.patientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-brandText-secondary">Consultation Fee:</span>
                      <span className="font-bold text-forest-800">৳{apt.fee} (Pay at clinic counter)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-brandText-secondary">Booking Reference:</span>
                      <span className="font-mono text-brandText-secondary">{apt.id}</span>
                    </div>
                  </div>

                  {/* Cancel Action */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => handleCancelAppointment(apt.id)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel Appointment</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={Boolean(selectedDoctorForBooking)}
        doctor={selectedDoctorForBooking}
        onClose={() => setSelectedDoctorForBooking(null)}
        onBookingSuccess={handleBookingSuccess}
      />
    </div>
  );
};

export default AppointmentsPage;
