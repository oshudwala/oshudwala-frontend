import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import Button from '../common/Button';

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this operation?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'primary' | 'success'
  isLoading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm transition-opacity"
        onClick={() => !isLoading && onClose()}
      />

      {/* Modal Dialog */}
      <div className="relative bg-surface-pure rounded-3xl max-w-md w-full p-6 shadow-floating border border-brandBorder-subtle z-10 space-y-5 animate-scale-up">
        <div className="flex items-start gap-4">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              variant === 'danger'
                ? 'bg-rose-50 text-rose-600 border border-rose-100'
                : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
            }`}
          >
            {variant === 'danger' ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <CheckCircle className="w-6 h-6" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-heading font-bold text-lg text-forest-900">{title}</h3>
            <p className="text-xs text-brandText-secondary leading-relaxed mt-1">{message}</p>
          </div>
          <button
            onClick={() => !isLoading && onClose()}
            className="p-1 rounded-lg text-brandText-muted hover:text-brandText-main hover:bg-forest-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="text-xs font-bold"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
            disabled={isLoading}
            className="text-xs font-bold px-5"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
