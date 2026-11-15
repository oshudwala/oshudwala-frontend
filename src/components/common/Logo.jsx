import React from 'react';
import { Link } from 'react-router-dom';

export const Logo = ({ variant = 'dark', className = '' }) => {
  const isLight = variant === 'light';

  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      {/* Emblem SVG matching Oshud Wala medical cross brand */}
      <div className="relative flex-shrink-0">
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-10 h-10 group-hover:scale-105 transition-transform"
        >
          {/* Rounded octagon / soft medical emblem container */}
          <rect
            width="48"
            height="48"
            rx="14"
            fill={isLight ? '#E7F4EB' : '#075C40'}
          />
          {/* Medical Cross */}
          <path
            d="M24 13V35M13 24H35"
            stroke={isLight ? '#06432F' : '#FFFFFF'}
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Subtle leaf / care accent */}
          <circle
            cx="32"
            cy="16"
            r="3.5"
            fill={isLight ? '#16875B' : '#8BC9A5'}
          />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center">
          <span
            className={`font-heading font-extrabold text-xl tracking-tight leading-none ${
              isLight ? 'text-white' : 'text-forest-800'
            }`}
          >
            Oshud<span className={isLight ? 'text-emerald-300' : 'text-forest-600'}>Wala</span>
          </span>
        </div>
        <span
          className={`text-[9.5px] font-medium tracking-wide mt-0.5 leading-none ${
            isLight ? 'text-forest-200' : 'text-brandText-secondary'
          }`}
        >
          Medicines. Care. Closer to You.
        </span>
      </div>
    </Link>
  );
};

export default Logo;
