import React, { useState } from 'react';
import { Calendar, Clock, MapPin, CheckCircle2, User, Phone, ShieldCheck, Ticket } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { doctorService } from '../../services/doctorService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';

export const BookingModal = ({ isOpen, onClose, doctor, onBookingSuccess }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { t, isBengali } = useLanguage();

  const [selectedDate, setSelectedDate] = useState('Today');
  const [selectedSlot, setSelectedSlot] = useState(doctor?.availableSlots?.[0] || '05:00 PM');
  const [patientName, setPatientName] = useState(user?.fullName || user?.name || '');
  const [patientPhone, setPatientPhone] = useState(user?.phone || '');
  const [consultationType, setConsultationType] = useState('in-clinic'); // 'in-clinic' | 'telemedicine'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [bookingNotice, setBookingNotice] = useState(null);

  if (!doctor) return null;

  const dates = [
    { key: 'today', label: t('today', 'Today'), sub: t('available', 'Available') },
    { key: 'tomorrow', label: t('tomorrow', 'Tomorrow'), sub: t('slots_open', 'Slots Open') },
    { key: 'wednesday', label: t('wednesday', 'Wednesday'), sub: t('available', 'Available') },
    { key: 'thursday', label: t('thursday', 'Thursday'), sub: t('available', 'Available') },
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
        consultationType,
      });

      setBookingResult(res);
      addToast(isBengali ? `অ্যাপয়েন্টমেন্ট নিশ্চিত হয়েছে! টোকেন #${res.tokenNumber}` : `Appointment booked successfully! Token #${res.tokenNumber}`, 'success');
      if (onBookingSuccess) onBookingSuccess(res);
    } catch (err) {
      setBookingNotice({
        title: t('modal_token_notice', 'Chamber Booking Notice'),
        message:
          err.message ||
          (isBengali
            ? 'লাইভ সিরিয়াল টোকেন বুকিং ফেজ ২ এর জন্য নির্ধারিত। অগ্রিম বুকিং এর জন্য চেম্বার রিসেপশনে সরাসরি যোগাযোগ করুন।'
            : 'Live queue token booking is scheduled for backend Phase 2. To reserve an advance consultation token today, please contact the chamber reception directly.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setBookingResult(null);
    setBookingNotice(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title={bookingNotice ? t('modal_token_notice', 'Chamber Booking Notice') : bookingResult ? t('modal_token_confirmed', 'Appointment Confirmed') : t('modal_book_appointment', 'Book Appointment')}
      subtitle={
        bookingNotice
          ? (isBengali ? 'চেম্বার বুকিং সংক্রান্ত তথ্য' : 'Live chamber booking information')
          : bookingResult
          ? (isBengali ? 'আপনার লাইভ সিরিয়াল টোকেন তৈরি হয়েছে।' : 'Your live queue token has been generated.')
          : (isBengali ? `${doctor.name}-এর সাথে পরামর্শ নিন` : `Consult with ${doctor.name}`)
      }
      maxWidth="max-w-lg"
    >
      {bookingNotice ? (
        <div className="text-center py-2 space-y-4 animate-fade-in">
          <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Ticket className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              {t('modal_token_notice', 'Chamber Token Notice')}
            </span>
            <h3 className="text-lg font-heading font-extrabold text-forest-800 mt-1">
              {doctor.name} — {doctor.clinicName}
            </h3>
            <p className="text-xs text-brandText-secondary mt-1 px-4 leading-relaxed">
              {bookingNotice.message}
            </p>
          </div>

          <div className="bg-surface-warm p-4 rounded-2xl border border-brandBorder-subtle text-left text-xs space-y-2 text-brandText-main">
            <div className="flex justify-between">
              <span className="text-brandText-secondary">{t('chamber_location', 'Chamber Location')}:</span>
              <span className="font-semibold text-forest-800">{doctor.clinicName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brandText-secondary">{t('consultation_fee', 'Consultation Fee')}:</span>
              <span className="font-semibold text-forest-700">₹{doctor.consultationFee} {t('pay_at_clinic', '(Pay at clinic)')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brandText-secondary">{t('reception_phone', 'Reception Phone')}:</span>
              <span className="font-semibold">{doctor.phone || '+91 98301 22334'}</span>
            </div>
          </div>

          <div className="pt-2">
            <Button variant="primary" onClick={resetAndClose} className="w-full">
              {t('close', 'Close')}
            </Button>
          </div>
        </div>
      ) : bookingResult ? (
        <div className="text-center py-2 space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-forest-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              {t('token_confirmed_badge', 'Token Confirmed')}
            </span>
            <div className="my-2 p-4 bg-gradient-to-r from-forest-700 to-forest-900 text-white rounded-2xl shadow-floating flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs text-forest-200">{t('patient_queue_token', 'Patient Queue Token')}</p>
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
              <span className="text-brandText-secondary">{t('doctor_label', 'Doctor')}:</span>
              <span className="font-semibold text-forest-800">{doctor.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brandText-secondary">{t('clinic_label', 'Clinic')}:</span>
              <span className="font-semibold">{doctor.clinicName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brandText-secondary">{t('date_time_label', 'Date & Time')}:</span>
              <span className="font-semibold">{selectedDate} {isBengali ? 'সময়' : 'at'} {selectedSlot}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brandText-secondary">{t('consultation_fee', 'Consultation Fee')}:</span>
              <span className="font-semibold text-forest-700">₹{doctor.consultationFee} {t('pay_at_clinic', '(Pay at clinic)')}</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-2.5 text-xs text-emerald-900 text-left">
            <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
            <span>
              {t('queue_sms_notice', 'You will receive SMS queue reminders. You can track this token live in your Appointments dashboard.')}
            </span>
          </div>

          <Button
            variant="primary"
            onClick={resetAndClose}
            className="w-full"
          >
            {t('done', 'Done')}
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
                {t(doctor.specialization, doctor.specialization)} • {doctor.experience}
              </p>
              <p className="text-[11px] text-brandText-secondary flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-forest-500" />
                {doctor.clinicName}
              </p>
            </div>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-xs font-semibold text-brandText-main mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-forest-600" />
              {t('select_date', 'Select Date')}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {dates.map((d) => (
                <button
                  key={d.key}
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
              {t('available_time_slots', 'Available Time Slots')}
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
                {t('patient_name', 'Patient Name')}
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
                {t('phone_number', 'Phone Number')}
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
            <span className="text-brandText-secondary">{t('consultation_fee', 'Consultation Fee')}</span>
            <span className="font-bold text-forest-800 text-sm">₹{doctor.consultationFee}</span>
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
              {t('cancel', 'Cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="flex-1"
            >
              {t('confirm_appointment', 'Confirm Appointment')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default BookingModal;
