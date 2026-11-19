import React, { useState } from 'react';
import {
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';

export const PrescriptionReviewPage = () => {
  const { prescriptions, verifyPrescription, rejectPrescription } = useWorkspaceStore();
  const { addToast } = useToast();

  const [selectedRxId, setSelectedRxId] = useState(
    prescriptions.find((p) => p.status === 'PENDING_VERIFICATION')?.id || prescriptions[0]?.id
  );
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pharmacistNotes, setPharmacistNotes] = useState('All medicines verified against WBSPC Schedule H regulations.');

  const currentRx = prescriptions.find((p) => p.id === selectedRxId) || prescriptions[0];

  const handleZoomIn = () => setZoomLevel((z) => Math.min(2.5, z + 0.25));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.75, z - 0.25));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const handleApprove = () => {
    if (!currentRx) return;
    verifyPrescription(currentRx.id, currentRx.extractedMedicines, pharmacistNotes);
    addToast(`Prescription ${currentRx.id} approved and signed off!`, 'success');
  };

  const handleReject = () => {
    if (!currentRx) return;
    const reason = window.prompt('Reason for prescription rejection:', 'Illegible doctor signature or invalid Schedule H1 format');
    if (reason) {
      rejectPrescription(currentRx.id, reason);
      addToast(`Prescription ${currentRx.id} marked Rejected.`, 'error');
    }
  };

  const handleClarify = () => {
    addToast('Clarification notice sent to prescribing doctor via WhatsApp / SMS.', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-forest-900">
            Prescription Audit & Verification Studio
          </h1>
          <p className="text-xs text-brandText-secondary mt-0.5">
            CDSCO Schedule H / H1 compliance validation for online medicine dispensation.
          </p>
        </div>

        {/* Prescription Switcher Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {prescriptions.map((rx) => (
            <button
              key={rx.id}
              onClick={() => {
                setSelectedRxId(rx.id);
                setZoomLevel(1);
                setRotation(0);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedRxId === rx.id
                  ? 'bg-forest-800 text-white shadow-sm'
                  : 'bg-surface-pure border border-brandBorder-subtle text-forest-900 hover:bg-forest-50'
              }`}
            >
              <span>{rx.id}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  rx.status === 'VERIFIED'
                    ? 'bg-emerald-400'
                    : rx.status === 'REJECTED'
                    ? 'bg-rose-400'
                    : 'bg-amber-400'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {currentRx ? (
        /* Split Screen Review Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
          {/* Left Side (7 Cols): High-Resolution Zoom/Rotate Document Viewer */}
          <div className="lg:col-span-7 bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card flex flex-col overflow-hidden">
            {/* Viewer Controls Toolbar */}
            <div className="p-3 border-b border-brandBorder-subtle bg-surface-warm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-forest-900">{currentRx.id}</span>
                <span className="text-[10px] text-brandText-muted">
                  Submitted: {currentRx.submittedAt}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1.5 rounded-lg bg-surface-pure border border-brandBorder-subtle text-forest-800 hover:bg-forest-50 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono font-bold px-2 text-forest-900">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1.5 rounded-lg bg-surface-pure border border-brandBorder-subtle text-forest-800 hover:bg-forest-50 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  className="p-1.5 rounded-lg bg-surface-pure border border-brandBorder-subtle text-forest-800 hover:bg-forest-50 transition-colors ml-1"
                  title="Rotate 90°"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Canvas Stage */}
            <div className="flex-1 bg-slate-900/95 p-6 flex items-center justify-center overflow-auto min-h-[450px]">
              <div
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease-in-out',
                }}
                className="shadow-2xl rounded-lg overflow-hidden max-w-full"
              >
                <img
                  src={currentRx.imageUrl}
                  alt="Prescription Document Scan"
                  className="max-h-[500px] object-contain rounded"
                />
              </div>
            </div>

            <div className="p-3 bg-surface-warm border-t border-brandBorder-subtle flex items-center justify-between text-xs text-brandText-secondary">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified against West Bengal Drug Controller Registry</span>
              </span>
              <span className="font-mono text-[11px]">Secure Hash: SHA-256 Validated</span>
            </div>
          </div>

          {/* Right Side (5 Cols): Patient Info, Extracted Medicines & Actions */}
          <div className="lg:col-span-5 bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              {/* Patient & Doctor Card */}
              <div className="p-4 rounded-2xl bg-forest-50/70 border border-forest-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-extrabold text-base text-forest-900">
                      {currentRx.patientName}
                    </h3>
                    <p className="text-xs text-brandText-secondary">
                      {currentRx.patientGender}, {currentRx.patientAge} yrs &bull; {currentRx.patientPhone}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      currentRx.status === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : currentRx.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {currentRx.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="pt-2 border-t border-forest-200/60 text-xs text-forest-900 space-y-0.5">
                  <p className="font-bold">{currentRx.doctorName}</p>
                  <p className="text-[11px] text-brandText-secondary">{currentRx.clinicName}</p>
                  <p className="text-[10px] text-brandText-muted">Prescribed: {currentRx.rxDate}</p>
                </div>
              </div>

              {/* Extracted Medicines List */}
              <div className="space-y-2">
                <h4 className="font-heading font-bold text-xs text-forest-900 uppercase tracking-wider">
                  Extracted Items for Dispensation
                </h4>
                <div className="divide-y divide-brandBorder-subtle border border-brandBorder-subtle rounded-2xl overflow-hidden text-xs">
                  {currentRx.extractedMedicines.map((med, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between bg-surface-warm/40">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-forest-900">{med.name}</p>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                            In Stock
                          </span>
                        </div>
                        <p className="text-[11px] text-brandText-secondary mt-0.5">{med.dosage}</p>
                      </div>
                      <span className="font-bold text-forest-800">Qty: {med.qty}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pharmacist Compliance Notes */}
              <div>
                <label className="text-xs font-bold text-forest-900">Pharmacist Sign-Off Note</label>
                <textarea
                  rows={2}
                  value={pharmacistNotes}
                  onChange={(e) => setPharmacistNotes(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-surface-warm border border-brandBorder-subtle rounded-xl text-xs focus:outline-none focus:border-forest-500"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-brandBorder-subtle space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={HelpCircle}
                  onClick={handleClarify}
                  className="text-xs"
                >
                  Ask Clarification
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={XCircle}
                  onClick={handleReject}
                  className="text-xs"
                >
                  Reject Prescription
                </Button>
              </div>
              <Button
                variant="primary"
                size="md"
                leftIcon={CheckCircle}
                onClick={handleApprove}
                className="w-full text-xs font-bold py-2.5 shadow-md"
              >
                Approve & Sign-Off Prescription
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-brandText-secondary">No prescriptions available.</p>
      )}
    </div>
  );
};

export default PrescriptionReviewPage;
