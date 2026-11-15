import React from 'react';

export const Badge = ({
  children,
  variant = 'default', // 'prescription', 'otc', 'available', 'discount', 'info', 'warning'
  size = 'sm',
  className = ''
}) => {
  const baseStyles = "inline-flex items-center font-medium rounded-full tracking-wide";
  
  const sizeStyles = {
    xs: "px-2 py-0.5 text-[11px]",
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1 text-xs",
  };

  const variantStyles = {
    default: "bg-forest-100 text-forest-700",
    prescription: "bg-amber-100/90 text-amber-800 border border-amber-200",
    otc: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    available: "bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/60",
    discount: "bg-rose-100 text-rose-700 font-bold",
    info: "bg-blue-100 text-blue-800",
    neutral: "bg-slate-100 text-slate-700",
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
