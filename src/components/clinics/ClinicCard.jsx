import React from 'react';
import { Star, MapPin, Clock, Building2, User, ArrowRight, Stethoscope } from 'lucide-react';

export const ClinicCard = ({ clinic, onSelect }) => {
  return (
    <div
      onClick={() => onSelect && onSelect(clinic)}
      className="group bg-surface-pure rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-brandBorder-subtle hover:border-forest-300 shadow-subtle hover:shadow-card transition-all duration-300 flex flex-col justify-between h-full select-none text-left cursor-pointer"
    >
      <div>
        {/* Clinic Image & Badges */}
        <div className="relative mb-3 sm:mb-4 w-full aspect-[16/10] rounded-xl sm:rounded-2xl overflow-hidden bg-forest-50 border border-forest-100">
          <img
            src={clinic.image}
            alt={clinic.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute top-2 left-2 bg-surface-pure/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-forest-800 shadow-sm flex items-center gap-1">
            <Building2 className="w-3 h-3 text-forest-600" />
            <span>{clinic.chamberCount}</span>
          </div>
          <div className="absolute top-2 right-2 bg-surface-pure/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-forest-800 shadow-sm">
            {clinic.distance}
          </div>
        </div>

        {/* Clinic Name & Location */}
        <h3 className="font-heading font-bold text-sm sm:text-base text-forest-800 group-hover:text-forest-600 transition-colors line-clamp-1">
          {clinic.name}
        </h3>

        <p className="text-[11px] sm:text-xs text-brandText-secondary flex items-center gap-1 mt-1 truncate">
          <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-forest-500 flex-shrink-0" />
          <span className="truncate">{clinic.address}</span>
        </p>

        {/* Rating & Hours */}
        <div className="flex items-center justify-between text-[11px] sm:text-xs pt-1.5 pb-2 border-b border-brandBorder-light">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 fill-amber-500" />
            <span className="font-bold text-brandText-main">{clinic.rating}</span>
            <span className="text-brandText-secondary">({clinic.reviewCount})</span>
          </div>
          <span className="text-emerald-700 font-semibold text-[10px] sm:text-xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Open Today
          </span>
        </div>

        {/* Available Doctors Summary Indicator (No doctor names on card face) */}
        <div className="mt-3 p-2.5 rounded-xl bg-forest-50/70 border border-forest-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-forest-100 text-forest-700 flex items-center justify-center flex-shrink-0">
              <Stethoscope className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-bold text-forest-800 text-[11px] sm:text-xs">
                {clinic.doctors.length} {clinic.doctors.length === 1 ? 'Doctor' : 'Doctors'} Available
              </p>
              <p className="text-[10px] text-brandText-secondary">
                In-person chamber consultations
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
            Tokens Open
          </span>
        </div>
      </div>

      {/* Button: View Doctors for Appointment */}
      <div className="pt-3 sm:pt-4 mt-2 border-t border-brandBorder-light">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect && onSelect(clinic);
          }}
          className="w-full py-2 px-3.5 rounded-xl sm:rounded-2xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all group-hover:scale-[1.01]"
        >
          <span>View Doctors & Book</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default ClinicCard;