import React from 'react';
import { Star, Calendar, ArrowRight } from 'lucide-react';
import Button from '../common/Button';

export const DoctorCard = ({ doctor, onBook, onSelect }) => {
  return (
    <div
      onClick={() => onSelect && onSelect(doctor)}
      className="group bg-surface-pure rounded-3xl p-4 sm:p-5 border border-brandBorder-subtle hover:border-forest-300 shadow-subtle hover:shadow-card transition-all duration-300 flex flex-col justify-between cursor-pointer text-center relative"
    >
      {/* Doctor Photo in clean rounded box */}
      <div className="relative mb-4 mx-auto w-full max-w-[200px] aspect-square rounded-2xl overflow-hidden bg-forest-50/60 flex items-center justify-center border border-forest-100">
        <img
          src={doctor.image}
          alt={doctor.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Info */}
      <div className="space-y-1 mb-3">
        <h3 className="font-heading font-bold text-base text-forest-800 group-hover:text-forest-600 transition-colors">
          {doctor.name}
        </h3>
        <p className="text-xs text-brandText-secondary font-medium">
          {doctor.specialization}
        </p>

        {/* Rating */}
        <div className="flex items-center justify-center gap-1.5 pt-1 text-xs">
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span className="font-bold text-brandText-main">{doctor.rating}</span>
          <span className="text-brandText-secondary">({doctor.reviewCount})</span>
        </div>

        {/* Availability Badge */}
        <div className="pt-2">
          {doctor.availableToday ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Available Today
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              Next Available Tomorrow
            </span>
          )}
        </div>
      </div>

      {/* Action Button: Book Appointment */}
      <div className="pt-2">
        <Button
          variant="primary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onBook && onBook(doctor);
          }}
          className="w-full text-xs py-2.5 font-bold shadow-sm group-hover:shadow"
        >
          Book Appointment
        </Button>
      </div>
    </div>
  );
};

export default DoctorCard;
