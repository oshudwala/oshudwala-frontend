import React, { useState } from 'react';
import { Calendar, Clock, MapPin, CheckCircle2, User, Phone, ShieldCheck, Ticket } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { doctorService } from '../../services/doctorService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const BookingModal = ({ isOpen, onClose, doctor, onBookingSuccess }) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [selectedDate, setSelectedDate] = useState('Today');
  const [selectedSlot, setSelectedSlot] = useState(doctor?.availableSlots?.[0] || '05:00 PM');
  const [patientName, setPatientName] = useState(user?.name || 'Ayon Paul');
  const [patientPhone, setPatientPhone] = useState(user?.phone || '+880 1712-345678');
  const [consultationType, setConsultationType] = useState('in-clinic'); // 'in-clinic' | 'telemedicine'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  if (!doctor) return null;

  const dates = [
    { label: 'Today', sub: 'Available' },
    { label: 'Tomorrow', sub: 'Slots Open' },
    { label: 'Wednesday', sub: 'Available' },
    { label: 'Thursday', sub: 'Available' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await doctorService.bookAppointment({
        doctorId: doctor.id,
        clinicId: doctor.clinicName,
        date: selectedDate,
        slotTime: selectedSlot,
        patientName,
        patientPhone,
        consultationType
      });

      setBookingResult(res);
      addToast(`Appointment booked successfully! Token #${res.tokenNumber}`, 'success');
      if (onBookingSuccess) onBookingSuccess(res);
    } catch {
      addToast('Failed to book appointment. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setBookingResult(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title={bookingResult ? "Appointment Confirmed" : `Book Appointment`}
      subtitle={bookingResult ? "Your live queue token has been generated." : `Consult with ${doctor.name}`}
      maxWidth="max-w-lg"
    >
      {bookingResult ? (
        <div className="text-center py-2 space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-forest-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Token Confirmed
            </span>
            <div className="my-2 p-4 bg-gradient-to-r from-forest-700 to-forest-900 text-white rounded-2xl shadow-floating flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs text-forest-200">Patient Queue Token</p>
                <p className="text-3xl font-extrabold tracking-tight mt-0.5">{bookingResult.tokenNumber}</p>
                <p className="text-xs text-forest-200 mt-1">{doctor.name} • {selectedSlot}</p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl text-forest-100">
                <Ticket className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="bg-surface-warm p-4 rounded-2xl border border-brandBorder-subtle text-left text-xs space-y-2 text-brandText-main">
            <div className="flex justify-between">
              <span className="text-brandText-secondary">Doctor:</span>
              <span className="font-semibold text-forest-800">{doctor.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brandText-secondary">Clinic:</span>
              <span className="font-semibold">{doctor.clinicName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brandText-secondary">Date & Time:</span>
              <span className="font-semibold">{selectedDate} at {selectedSlot}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brandText-secondary">Consultation Fee:</span>
              <span className="font-semibold text-forest-700">৳{doctor.consultationFee} (Pay at clinic)</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-2.5 text-xs text-emerald-900 text-left">
            <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
            <span>
              You will receive SMS queue reminders. You can track this token live in your <b>Appointments</b> dashboard.
            </span>
          </div>

          <Button
            variant="primary"
            onClick={resetAndClose}
            className="w-full"
          >
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Doctor Brief Header */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-forest-50 border border-forest-100">
            <img
              src={doctor.image}
              alt={doctor.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
            />
            <div>
              <h4 className="font-heading font-bold text-forest-800 text-sm">
                {doctor.name}
              </h4>
              <p className="text-xs text-forest-600 font-medium">
                {doctor.specialization} • {doctor.experience}
              </p>
              <p className="text-[11px] text-brandText-secondary flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-forest-500" />
                {doctor.clinicName}
              </p>
            </div>
          </div>

          {/* Consultation Type Toggle */}
          <div>
            <label className="block text-xs font-semibold text-brandText-main mb-1.5">
              Consultation Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConsultationType('in-clinic')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  consultationType === 'in-clinic'
                    ? 'border-forest-600 bg-forest-100 text-forest-800'
                    : 'border-brandBorder-subtle bg-surface-pure text-brandText-secondary'
                }`}
              >
                In-Clinic Visit
              </button>
              <button
                type="button"
                onClick={() => setConsultationType('telemedicine')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  consultationType === 'telemedicine'
                    ? 'border-forest-600 bg-forest-100 text-forest-800'
                    : 'border-brandBorder-subtle bg-surface-pure text-brandText-secondary'
                }`}
              >
                Video Teleconsultation
              </button>
            </div>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-xs font-semibold text-brandText-main mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-forest-600" />
              Select Date
            </label>
            <div className="grid grid-cols-4 gap-2">
              {dates.map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => setSelectedDate(d.label)}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    selectedDate === d.label
                      ? 'border-forest-600 bg-forest-600 text-white shadow-subtle'
                      : 'border-brandBorder-subtle bg-surface-warm text-brandText-main hover:border-forest-300'
                  }`}
                >
                  <p className="text-xs font-bold">{d.label}</p>
                  <p className={`text-[10px] ${selectedDate === d.label ? 'text-forest-100' : 'text-brandText-secondary'}`}>
                    {d.sub}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Time Slot Selection */}
          <div>
            <label className="block text-xs font-semibold text-brandText-main mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-forest-600" />
              Available Time Slots
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(doctor.availableSlots || ['04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM']).map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    selectedSlot === slot
                      ? 'border-forest-600 bg-forest-100 text-forest-800 font-bold'
                      : 'border-brandBorder-subtle bg-surface-pure text-brandText-secondary hover:border-forest-300'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-brandText-main mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-forest-600" />
                Patient Name
              </label>
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 text-brandText-main"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brandText-main mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-forest-600" />
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 text-brandText-main"
              />
            </div>
          </div>

          {/* Consultation Fee Note */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-warm border border-brandBorder-subtle text-xs">
            <span className="text-brandText-secondary">Consultation Fee</span>
            <span className="font-bold text-forest-800 text-sm">৳{doctor.consultationFee}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="flex-1"
            >
              Confirm Appointment
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default BookingModal;
