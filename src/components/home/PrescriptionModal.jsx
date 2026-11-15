import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  X,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Camera,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { prescriptionService } from '../../services/prescriptionService';
import { pharmaciesData } from '../../data/pharmaciesData';
import { useToast } from '../../context/ToastContext';

export const PrescriptionModal = ({ isOpen, onClose }) => {
  const { addToast } = useToast();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileError, setFileError] = useState('');
  const [patientNotes, setPatientNotes] = useState('');
  const [preferredPharmacyId, setPreferredPharmacyId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [uploadedResult, setUploadedResult] = useState(null);

  // Preview manipulations
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotationDegree, setRotationDegree] = useState(0);

  const MAX_FILE_SIZE_MB = 10;
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

  const handleFileSelect = (file) => {
    setFileError('');
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError('Invalid file type. Please upload a JPG, PNG, or PDF document.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setFileError(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit. Please upload a smaller file.`);
      return;
    }

    setSelectedFile(file);
    setZoomLevel(1);
    setRotationDegree(0);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null); // PDF placeholder
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleRemoveFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileError('');
    setZoomLevel(1);
    setRotationDegree(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setFileError('Please select a prescription document to upload.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 25;
      });
    }, 200);

    try {
      const res = await prescriptionService.uploadPrescription({
        file: selectedFile,
        patientNotes,
        preferredPharmacyId
      });

      clearInterval(interval);
      setUploadProgress(100);
      setIsSuccess(true);
      setUploadedResult(res.prescription);
      addToast('Prescription uploaded successfully for pharmacist verification!', 'success');
    } catch (err) {
      clearInterval(interval);
      setFileError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetModal = () => {
    handleRemoveFile();
    setPatientNotes('');
    setPreferredPharmacyId('');
    setIsSuccess(false);
    setUploadedResult(null);
    setUploadProgress(0);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetModal}
      title={isSuccess ? "Prescription Submitted" : "Upload Doctor's Prescription"}
      subtitle={
        isSuccess
          ? "Our registered 'A' grade pharmacist will review and dispense your order."
          : "Verified licensed pharmacists will check dosage, interactions, and validity."
      }
      maxWidth="max-w-xl"
    >
      {isSuccess && uploadedResult ? (
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-forest-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h4 className="font-heading font-bold text-forest-800 text-lg">
              Prescription Queued for Review
            </h4>
            <p className="text-xs text-brandText-secondary mt-1">
              Prescription Reference: <span className="font-bold text-forest-700">{uploadedResult.id}</span>
            </p>
          </div>

          <div className="bg-forest-50 p-4 rounded-2xl border border-forest-100 text-left text-xs space-y-2 text-forest-900">
            <div className="flex justify-between">
              <span className="text-brandText-secondary">Assigned Pharmacy:</span>
              <span className="font-semibold">{uploadedResult.pharmacyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brandText-secondary">Estimated Review Time:</span>
              <span className="font-semibold text-emerald-700">10-15 Minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brandText-secondary">Verification Status:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                Pending Verification
              </span>
            </div>
          </div>

          <div className="p-3 bg-surface-warm border border-brandBorder-subtle rounded-xl flex items-center gap-2.5 text-xs text-brandText-secondary text-left">
            <ShieldCheck className="w-4 h-4 text-forest-600 flex-shrink-0" />
            <span>Our pharmacist will contact you via WhatsApp / SMS once your medicines are prepared.</span>
          </div>

          <div className="pt-2 flex gap-3">
            <Button
              variant="secondary"
              onClick={resetModal}
              className="flex-1"
            >
              Upload Another
            </Button>
            <Button
              variant="primary"
              onClick={resetModal}
              className="flex-1"
            >
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload Zone */}
          {!selectedFile ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-forest-200 hover:border-forest-500 rounded-3xl p-7 text-center bg-forest-50/40 hover:bg-forest-50/80 transition-all cursor-pointer group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />

              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-forest-100 text-forest-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-subtle">
                <Upload className="w-7 h-7" />
              </div>

              <h4 className="font-heading font-bold text-forest-800 text-sm mb-1">
                Drag & drop prescription here or <span className="text-forest-600 underline">Browse</span>
              </h4>
              <p className="text-xs text-brandText-secondary mb-4">
                Supports JPG, PNG, or PDF (up to {MAX_FILE_SIZE_MB}MB)
              </p>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    cameraInputRef.current?.click();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-pure border border-brandBorder-subtle hover:border-forest-500 text-forest-800 shadow-sm transition-all"
                >
                  <Camera className="w-3.5 h-3.5 text-forest-600" />
                  Use Camera
                </button>
              </div>
            </div>
          ) : (
            /* Selected File Preview Canvas */
            <div className="space-y-3">
              <div className="p-3 bg-surface-warm rounded-2xl border border-brandBorder-subtle flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2.5 bg-forest-100 rounded-xl text-forest-700 flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-forest-800 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-brandText-secondary">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type.split('/')[1]?.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 rounded-lg text-forest-700 hover:bg-forest-100 transition-colors"
                    title="Replace file"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Visual Preview Box */}
              {previewUrl ? (
                <div className="relative border border-brandBorder-subtle rounded-2xl overflow-hidden bg-slate-900/5 h-56 flex items-center justify-center">
                  <div
                    className="transition-transform duration-200"
                    style={{
                      transform: `scale(${zoomLevel}) rotate(${rotationDegree}deg)`,
                      maxWidth: '100%',
                      maxHeight: '100%'
                    }}
                  >
                    <img
                      src={previewUrl}
                      alt="Prescription preview"
                      className="max-h-52 object-contain rounded-lg shadow-sm"
                    />
                  </div>

                  {/* Canvas Controls */}
                  <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-surface-pure/90 backdrop-blur-md px-2 py-1 rounded-full shadow-subtle border border-brandBorder-subtle text-xs">
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.5))}
                      className="p-1 text-brandText-secondary hover:text-forest-700"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
                      className="p-1 text-brandText-secondary hover:text-forest-700"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRotationDegree((r) => (r + 90) % 360)}
                      className="p-1 text-brandText-secondary hover:text-forest-700"
                      title="Rotate"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 border border-brandBorder-subtle rounded-2xl bg-surface-warm text-center">
                  <FileText className="w-10 h-10 text-forest-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-forest-800">PDF Document Ready</p>
                  <p className="text-[11px] text-brandText-secondary">
                    Our pharmacist will review all pages during dispensing.
                  </p>
                </div>
              )}
            </div>
          )}

          {fileError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{fileError}</span>
            </div>
          )}

          {/* Preferred Pharmacy Selection */}
          <div>
            <label className="block text-xs font-semibold text-brandText-main mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-forest-600" />
              Choose Preferred Pharmacy (Optional)
            </label>
            <select
              value={preferredPharmacyId}
              onChange={(e) => setPreferredPharmacyId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 text-brandText-main"
            >
              <option value="">Nearest Verified Partner Pharmacy (Recommended)</option>
              {pharmaciesData.map((pharm) => (
                <option key={pharm.id} value={pharm.id}>
                  {pharm.name} — {pharm.distance} ({pharm.address})
                </option>
              ))}
            </select>
          </div>

          {/* Patient Notes */}
          <div>
            <label className="block text-xs font-semibold text-brandText-main mb-1.5">
              Special Instructions / Notes for Pharmacist
            </label>
            <textarea
              rows={2}
              value={patientNotes}
              onChange={(e) => setPatientNotes(e.target.value)}
              placeholder="e.g. Call before dispatch, generic alternatives acceptable, deliver after 6 PM..."
              className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 text-brandText-main"
            />
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-forest-700 font-semibold">
                <span>Encrypting & Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-forest-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-forest-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={resetModal}
              disabled={isUploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isUploading}
              disabled={!selectedFile}
              className="flex-1"
            >
              Submit Prescription
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default PrescriptionModal;
