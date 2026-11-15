import React from 'react';
import { Link } from 'react-router-dom';

export const Logo = ({ variant = 'dark', className = '', imgClassName = 'h-10 sm:h-11 w-auto' }) => {
  const isLight = variant === 'light';

  return (
    <Link to="/" className={`inline-flex items-center group select-none ${className}`}>
      <img
        src={isLight ? "/logo-light.png" : "/logo-dark.png"}
        alt="Oshud Wala — Medicines. Care. Closer to You."
        className={`${imgClassName} object-contain transition-transform duration-200 group-hover:scale-[1.02]`}
      />
    </Link>
  );
};

export default Logo;
