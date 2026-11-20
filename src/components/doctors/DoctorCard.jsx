import React from 'react';
import { Star, Calendar, ArrowRight } from 'lucide-react';
import Button from '../common/Button';

export const DoctorCard = ({ doctor, onBook, onSelect }) => {
  return (
    <div
      onClick={() => onSelect && onSelect(doctor)}
      className="group bg-surface-pure rounded-2xl sm:rounded-3xl p-3 xs:p-3.5 sm:p-5 border border-brandBorder-subtle hover:border-forest-300 shadow-subtle hover:shadow-card transition-all duration-300 flex flex-col justify-between cursor-pointer text-center relative h-full select-none"
    >
      <div>
        {/* Doctor Photo in clean rounded box */}
        <div className="relative mb-2.5 sm:mb-4 mx-auto w-full max-w-[130px] xs:max-w-[150px] sm:max-w-[200px] aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-forest-50/60 flex items-center justify-center border border-forest-100">
          <img
            src={doctor.image}
            alt={doctor.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>

        {/* Info */}
        <div className="space-y-0.5 sm:space-y-1 mb-2 sm:mb-3">
          <h3 className="font-heading font-bold text-xs xs:text-sm sm:text-base text-forest-800 group-hover:text-forest-600 transition-colors line-clamp-1">
            {doctor.name}
          </h3>
          <p className="text-[10px] xs:text-[11px] sm:text-xs text-brandText-secondary font-medium truncate">
            {doctor.specialization}
          </p>

          {/* Rating */}
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 pt-0.5 sm:pt-1 text-[10px] sm:text-xs">
            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 fill-amber-500" />
            <span className="font-bold text-brandText-main">{doctor.rating}</span>
            <span className="text-brandText-secondary">({doctor.reviewCount})</span>
          </div>

          {/* Availability Badge */}
          <div className="pt-1.5 sm:pt-2">
            {doctor.availableToday ? (
              <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] xs:text-[10px] sm:text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Available Today
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] xs:text-[10px] sm:text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                Tomorrow
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Button: Book Appointment */}
      <div className="pt-1.5 sm:pt-2">
        <Button
          variant="primary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onBook && onBook(doctor);
          }}
          className="w-full text-[10px] xs:text-[11px] sm:text-xs py-1.5 xs:py-2 sm:py-2.5 font-bold shadow-xs group-hover:shadow rounded-xl sm:rounded-2xl"
        >
          Book Appointment
        </Button>
      </div>
    </div>
  );
};

export default DoctorCard;