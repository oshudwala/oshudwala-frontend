import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Drawer = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'max-w-xl',
  footer,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-forest-950/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div
        className={`relative w-full ${width} bg-surface-pure shadow-2xl h-full flex flex-col z-10 border-l border-brandBorder-subtle animate-slide-left`}
      >
        {/* Header */}
        <div className="p-5 border-b border-brandBorder-subtle flex items-center justify-between bg-surface-warm">
          <div>
            <h2 className="font-heading font-extrabold text-base sm:text-lg text-forest-900">
              {title}
            </h2>
            {subtitle && <p className="text-xs text-brandText-secondary mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-brandText-muted hover:text-brandText-main hover:bg-forest-100/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">{children}</div>

        {/* Optional Footer Actions */}
        {footer && (
          <div className="p-4 border-t border-brandBorder-subtle bg-surface-warm/80">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Drawer;
