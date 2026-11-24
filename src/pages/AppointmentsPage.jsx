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
  ArrowRight,
  Building2,
} from 'lucide-react';
import { doctorService } from '../services/doctorService';
import DoctorCard from '../components/doctors/DoctorCard';
import BookingModal from '../components/doctors/BookingModal';
import ClinicCard from '../components/clinics/ClinicCard';
import ClinicDoctorsModal from '../components/clinics/ClinicDoctorsModal';
import { pharmacyService } from '../services/pharmacyService';
import Button from '../components/common/Button';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

export const AppointmentsPage = () => {
  const [searchParams] = useSearchParams();
  const highlightedDoctorId = searchParams.get('doctor');
  const urlTab = searchParams.get('tab');
  const { addToast } = useToast();
  const { t, isBengali } = useLanguage();

  const [activeTab, setActiveTab] = useState(() => {
    if (urlTab === 'clinics') return 'clinics';
    if (urlTab === 'my-appointments') return 'my-appointments';
    return 'find';
  });

  const [doctors, setDoctors] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [clinicSearchQuery, setClinicSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState(null);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [userAppointments, setUserAppointments] = useState([]);

  // Respond to URL tab changes
  useEffect(() => {
    if (urlTab === 'clinics') {
      setActiveTab('clinics');
    } else if (urlTab === 'my-appointments') {
      setActiveTab('my-appointments');
    } else if (urlTab === 'doctors' || urlTab === 'find') {
      setActiveTab('find');
    }
  }, [urlTab]);

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
      setDoctors(res?.doctors || []);
    };
    fetchDocs();

    const fetchClinics = async () => {
      try {
        const res = await pharmacyService.getPharmacies();
        const allPharmacies = Array.isArray(res?.pharmacies) ? res.pharmacies : [];
        // Single Entity rule: Only pharmacies offering clinic doctor chamber services
        const clinicEntities = allPharmacies.filter(
          (p) => p.hasClinicService || (p.doctorsCount && p.doctorsCount > 0)
        );
        const formatted = clinicEntities.map((c) => ({
          id: c.id,
          name: c.name,
          address: c.address || `${c.city || 'Durgapur'}, ${c.state || 'WB'}`,
          city: c.city,
          pincode: c.pincode,
          isPrimary: Boolean(c.isPrimary),
          chamberCount: `${c.doctorsCount > 0 ? c.doctorsCount : 2} Chambers`,
          image: c.image || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=350',
          rating: c.rating || 4.8,
          reviewCount: c.reviewsCount || 85,
          distance: 'Express Hub',
          timing: '09:00 AM - 09:00 PM',
          receptionistName: c.receptionistName,
          doctorNames: c.doctorNames || [],
          doctors: c.raw?.doctors?.map((d) => ({
            id: d.doctor?.id || d.id,
            name: d.doctor?.fullName || 'Assigned Specialist',
            fullName: d.doctor?.fullName || 'Assigned Specialist',
            specialty: 'Chamber Specialist',
            degree: d.doctor?.qualifications || 'MBBS',
            fee: `₹${((d.consultationFeePaise || 50000) / 100).toFixed(0)}`,
            image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
            rating: 4.9,
          })) || [],
        }));
        setClinics(formatted);
      } catch (e) {
        setClinics([]);
      }
    };
    fetchClinics();

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

  const filteredClinics = clinics.filter((c) => {
    const q = clinicSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.address?.toLowerCase().includes(q) ||
      c.receptionistName?.toLowerCase().includes(q) ||
      c.doctorNames?.some((n) => n.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-forest-800">
            {isBengali ? 'চিকিৎসক পরামর্শ ও অ্যাপয়েন্টমেন্ট' : 'Doctor Consultations & Appointments'}
          </h1>
          <p className="text-xs sm:text-sm text-brandText-secondary mt-1">
            {isBengali
              ? 'বিশ্বস্ত ডাক্তার বুক করুন, ক্লিনিকের লাইভ টোকেন ট্র্যাক করুন এবং দীর্ঘ লাইনের ঝামেলা এড়ান'
              : 'Book trusted doctors, track live clinic queue tokens, and skip waiting rooms'}
          </p>
        </div>

        {/* 3-Tab Switcher */}
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
            {isBengali ? 'ডাক্তারগণ' : 'Find Doctors'} ({doctors.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('clinics')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'clinics'
                ? 'bg-forest-600 text-white shadow-sm'
                : 'text-brandText-secondary hover:text-forest-700'
            }`}
          >
            {isBengali ? 'ক্লিনিক ও চেম্বার' : 'Explore Clinics'} ({clinics.length})
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
            {isBengali ? 'আমার অ্যাপয়েন্টমেন্ট' : 'My Appointments'} ({userAppointments.length})
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
                placeholder={isBengali ? "ডাক্তারের নাম, বিশেষজ্ঞতা বা চেম্বার খুঁজুন..." : "Search doctors by name, specialty, or clinic name..."}
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
                  {spec === 'All' ? (isBengali ? 'সব' : 'All') : t(spec, spec)}
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
      ) : activeTab === 'clinics' ? (
        /* Explore Clinics View */
        <div className="space-y-6">
          {/* Clinic Search Bar */}
          <div className="bg-surface-pure p-4 sm:p-5 rounded-2xl border border-brandBorder-subtle shadow-subtle">
            <div className="relative">
              <Search className="w-4 h-4 text-brandText-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={isBengali ? "ক্লিনিক বা চেম্বারের নাম, এলাকা বা ঠিকানা খুঁজুন..." : "Search partner clinics by name, locality, or address..."}
                value={clinicSearchQuery}
                onChange={(e) => setClinicSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 text-brandText-main"
              />
            </div>
          </div>

          {/* Clinics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredClinics.map((clinic) => (
              <ClinicCard
                key={clinic.id}
                clinic={clinic}
                onSelect={(cln) => setSelectedClinic(cln)}
              />
            ))}
          </div>

          {/* Clinic Doctors Modal */}
          <ClinicDoctorsModal
            clinic={selectedClinic}
            isOpen={Boolean(selectedClinic)}
            onClose={() => setSelectedClinic(null)}
            onBookDoctor={(doc) => {
              setSelectedClinic(null);
              setSelectedDoctorForBooking(doc);
            }}
          />
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
                      <span className="font-bold text-forest-800">₹{apt.fee} (Pay at clinic counter)</span>
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
