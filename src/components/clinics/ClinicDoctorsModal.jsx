import React from 'react';
import { X, Building2, MapPin, Clock, Phone, Star, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import Button from '../common/Button';

export const ClinicDoctorsModal = ({ clinic, isOpen, onClose, onBookDoctor }) => {
  if (!isOpen || !clinic) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-4 text-center">
        <div className="w-full max-w-2xl bg-surface-pure rounded-3xl p-5 sm:p-7 shadow-floating border border-brandBorder-subtle text-left relative overflow-hidden animate-scale-up my-8">
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-forest-50 text-brandText-secondary hover:text-forest-700 transition-colors z-10"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Clinic Header */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 pb-5 border-b border-brandBorder-subtle">
            <div className="w-full sm:w-36 h-28 sm:h-28 rounded-2xl overflow-hidden bg-forest-50 border border-forest-100 flex-shrink-0">
              <img
                src={clinic.image}
                alt={clinic.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-forest-800 bg-forest-100 px-2 py-0.5 rounded-full border border-forest-200">
                  <Building2 className="w-3 h-3 text-forest-600" />
                  {clinic.chamberCount}
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {clinic.distance}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-heading font-extrabold text-forest-800">
                {clinic.name}
              </h2>

              <p className="text-xs text-brandText-secondary flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-forest-600 flex-shrink-0" />
                <span>{clinic.address}</span>
              </p>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-xs text-brandText-secondary">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-forest-600" />
                  <span>{clinic.timing}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span className="font-bold text-brandText-main">{clinic.rating}</span>
                  <span>({clinic.reviewCount} reviews)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Section: Available Doctors */}
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-base text-forest-800">
                  Consultation Doctors at this Clinic
                </h3>
                <p className="text-xs text-brandText-secondary mt-0.5">
                  Select a doctor to book your chamber appointment or queue token
                </p>
              </div>
              <span className="text-xs font-bold text-forest-700 bg-forest-50 px-2.5 py-1 rounded-full border border-forest-200/60">
                {clinic.doctors.length} {clinic.doctors.length === 1 ? 'Doctor' : 'Doctors'}
              </span>
            </div>

            {/* Doctors List */}
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {clinic.doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-surface-warm/60 border border-brandBorder-subtle hover:border-forest-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <img
                      src={doctor.image}
                      alt={doctor.name}
                      className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-forest-500 shadow-sm flex-shrink-0"
                    />

                    <div>
                      <h4 className="font-heading font-bold text-sm sm:text-base text-forest-800">
                        {doctor.name}
                      </h4>
                      <p className="text-xs font-semibold text-forest-600">
                        {doctor.specialization}
                      </p>
                      <p className="text-[11px] text-brandText-secondary mt-0.5">
                        {doctor.degrees} • {doctor.experience}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs">
                        <span className="font-bold text-forest-800">
                          Fee: ₹{doctor.consultationFee}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Available Today
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 self-end sm:self-center">
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={Calendar}
                      onClick={() => {
                        onClose();
                        onBookDoctor(doctor);
                      }}
                      className="text-xs py-2 px-4 shadow-sm font-bold"
                    >
                      Book Appointment
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Assistance */}
          <div className="mt-5 pt-3.5 border-t border-brandBorder-subtle flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-brandText-secondary">
            <span className="flex items-center gap-1.5 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-forest-600" />
              <span>Verified chamber consultation under Oshud Wala Quality Protocol</span>
            </span>
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs py-1.5 px-4 w-full sm:w-auto">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicDoctorsModal;