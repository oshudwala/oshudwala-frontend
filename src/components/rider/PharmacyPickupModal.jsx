import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  QrCode,
  KeyRound,
  ShieldCheck,
  X,
  Package,
  AlertCircle,
  RefreshCw,
  Upload,
  CheckCircle2,
  VideoOff,
  Loader2,
} from 'lucide-react';
import Button from '../common/Button';
import { deliveryApi } from '../../services/api/delivery.api';

export const PharmacyPickupModal = ({ order, isOpen, onClose, onVerifySuccess }) => {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'manual'
  const [enteredCode, setEnteredCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [scannedItems, setScannedItems] = useState(null);

  // Camera stream refs & states
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const fileInputRef = useRef(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'

  // Reset state when order changes or modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setEnteredCode('');
      setVerificationError('');
      setIsVerified(false);
      setScannedItems(null);
      setActiveTab('camera');
      startCamera('environment');
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, order]);

  // Start Camera Stream
  const startCamera = async (mode = 'environment') => {
    stopCamera();
    setCameraError('');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera API is not supported on this browser or platform. Please use manual code entry.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setIsCameraActive(true);

      // Start BarcodeDetector loop if supported
      startFrameScanner();
    } catch (err) {
      console.warn('Camera access warning:', err);
      setIsCameraActive(false);
      setCameraError(
        'Unable to access camera (device busy, permission denied, or not connected). You can enter the code manually or upload a picture.'
      );
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Frame Scanner using native BarcodeDetector if available
  const startFrameScanner = () => {
    if (!('BarcodeDetector' in window)) return;

    try {
      const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'data_matrix'] });
      scanIntervalRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2 || isVerified) return;
        try {
          const barcodes = await barcodeDetector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const detectedValue = barcodes[0].rawValue;
            if (detectedValue) {
              handleCodeEvaluation(detectedValue);
            }
          }
        } catch (e) {
          // ignore frame read errors
        }
      }, 500);
    } catch (e) {
      console.warn('BarcodeDetector initialization:', e);
    }
  };

  // Switch between front/back cameras
  const handleToggleCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const [isValidating, setIsValidating] = useState(false);

  // Evaluate the code with Backend Authentication
  const handleCodeEvaluation = async (rawCode) => {
    if (!rawCode || !order || isValidating) return;
    let token = String(rawCode).trim();
    try {
      const parsed = JSON.parse(rawCode);
      if (parsed.qrToken) token = String(parsed.qrToken).trim();
      else if (parsed.token) token = String(parsed.token).trim();
    } catch (e) {}

    setEnteredCode(token);
    setIsValidating(true);
    setVerificationError('');

    try {
      // Authenticate with backend: strictly verifies rider identity & order assignment
      const result = await deliveryApi.scanPickupQr(token);

      const verifiedOrders = result?.orders || [];
      const verifiedItems = verifiedOrders[0]?.items || order.items || [];

      setIsVerified(true);
      setVerificationError('');
      setScannedItems(verifiedItems);
      stopCamera();

      // Automatically complete verification
      setTimeout(() => {
        onVerifySuccess(order.id, token, result);
      }, 1000);
    } catch (err) {
      console.warn('Pickup QR verification rejected:', err);
      setIsVerified(false);
      setScannedItems(null);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        'Verification Denied: This pickup QR code is assigned to a different delivery partner. You do not have permission to verify or view this parcel.';
      setVerificationError(errMsg);
    } finally {
      setIsValidating(false);
    }
  };

  // Scan current video snapshot
  const handleCaptureFrame = () => {
    if (!videoRef.current || isValidating) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      if ('BarcodeDetector' in window) {
        const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
        barcodeDetector.detect(canvas).then((barcodes) => {
          if (barcodes.length > 0) {
            handleCodeEvaluation(barcodes[0].rawValue);
          } else {
            setVerificationError('No QR code detected in the camera frame. Align pharmacy pickup seal with the reticle.');
          }
        });
      } else {
        setVerificationError('Automatic camera barcode reader is not available in this browser. Please enter the pickup code in the Manual Code Entry tab.');
      }
    } catch (err) {
      setVerificationError('Unable to capture camera frame. Please enter the pickup code manually.');
    }
  };

  // Handle image upload from file or camera roll
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || isValidating) return;

    if ('BarcodeDetector' in window) {
      const img = new Image();
      img.onload = () => {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        detector.detect(img).then((barcodes) => {
          if (barcodes.length > 0) {
            handleCodeEvaluation(barcodes[0].rawValue);
          } else {
            setVerificationError('No QR code recognized in the uploaded photo. Please try a clearer picture.');
          }
        });
      };
      img.src = URL.createObjectURL(file);
    } else {
      setVerificationError('Image scanner is not supported on this device. Please use manual code entry.');
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!enteredCode.trim() || isValidating) {
      setVerificationError('Please enter the pickup code from the pharmacy package seal.');
      return;
    }
    handleCodeEvaluation(enteredCode);
  };

  const handleConfirmPickup = () => {
    if (!isVerified || !enteredCode) return;
    try {
      onVerifySuccess(order.id, enteredCode);
      stopCamera();
      onClose();
    } catch (err) {
      setVerificationError(err.message);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-forest-950/70 backdrop-blur-sm"
        onClick={() => {
          stopCamera();
          onClose();
        }}
      />

      {/* Modal Dialog */}
      <div className="relative bg-surface-pure rounded-3xl max-w-lg w-full p-6 shadow-floating border border-brandBorder-subtle z-10 space-y-4 max-h-[92vh] overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brandBorder-subtle pb-3">
          <div>
            <h3 className="font-heading font-bold text-base text-forest-900 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-purple-700" />
              <span>Verify Pharmacy Pickup</span>
            </h3>
            <p className="text-xs text-brandText-secondary mt-0.5">
              Order ID: <strong className="font-mono text-forest-900">{order.id}</strong> &bull; {order.pharmacyName}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-xl hover:bg-forest-50 text-brandText-muted hover:text-forest-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Camera vs Manual Code */}
        <div className="grid grid-cols-2 gap-1 bg-surface-warm p-1 rounded-2xl border border-brandBorder-subtle text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('camera');
              setVerificationError('');
              startCamera(facingMode);
            }}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'camera'
                ? 'bg-surface-pure text-forest-900 shadow-xs'
                : 'text-brandText-secondary hover:text-forest-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera QR Scanner</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('manual');
              setVerificationError('');
              stopCamera();
            }}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'manual'
                ? 'bg-surface-pure text-forest-900 shadow-xs'
                : 'text-brandText-secondary hover:text-forest-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Manual Code Entry</span>
          </button>
        </div>

        {/* Tab 1: Real Camera Viewfinder */}
        {activeTab === 'camera' && !isVerified && (
          <div className="space-y-3">
            <div className="relative bg-black rounded-2xl overflow-hidden aspect-[4/3] flex items-center justify-center border-2 border-forest-800/40 shadow-inner">
              {/* Video Element for live camera feed */}
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
              />

              {/* Viewfinder Reticle & Laser */}
              {isCameraActive && (
                <div className="absolute inset-6 border-2 border-emerald-400/80 rounded-2xl pointer-events-none flex flex-col items-center justify-center shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                  <div className="w-full h-0.5 bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]" />
                  <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider bg-black/60 px-2 py-0.5 rounded-full mt-auto mb-2">
                    Align Pharmacy Seal QR
                  </span>
                </div>
              )}

              {/* Camera Offline / Permission fallback message */}
              {!isCameraActive && (
                <div className="p-6 text-center text-white space-y-2">
                  <VideoOff className="w-10 h-10 mx-auto text-gray-400" />
                  <p className="text-xs font-semibold text-gray-200">
                    {cameraError || 'Camera inactive.'}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => startCamera(facingMode)}
                    className="text-xs text-white border-white/30 hover:bg-white/10"
                  >
                    Retry Camera Access
                  </Button>
                </div>
              )}

              {/* Camera Control overlay buttons */}
              {isCameraActive && (
                <button
                  type="button"
                  onClick={handleToggleCamera}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 text-xs flex items-center gap-1 z-10"
                  title="Switch Camera (Front/Rear)"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Camera Actions */}
            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleCaptureFrame}
                disabled={!isCameraActive}
                leftIcon={QrCode}
                className="text-xs font-bold px-4 bg-emerald-600 hover:bg-emerald-700 flex-1"
              >
                Scan QR Code in Viewfinder
              </Button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 border border-brandBorder-subtle rounded-xl text-xs font-bold text-forest-800 hover:bg-forest-50 flex items-center gap-1.5"
                title="Upload Photo of QR"
              >
                <Upload className="w-3.5 h-3.5 text-forest-700" />
                <span>Upload QR</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* Tab 2: Manual Code Entry */}
        {activeTab === 'manual' && !isVerified && (
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-forest-800">
                Package Pickup Verification Code
              </label>
              <input
                type="text"
                required
                placeholder="e.g. PKUP-89214-SEC5"
                value={enteredCode}
                onChange={(e) => {
                  setEnteredCode(e.target.value.toUpperCase());
                  setVerificationError('');
                }}
                className="w-full mt-1 px-4 py-2.5 border border-brandBorder-subtle rounded-xl text-sm font-mono font-bold bg-surface-warm uppercase focus:outline-none focus:border-forest-500"
              />
              <p className="text-[11px] text-brandText-secondary mt-1">
                Enter the alphanumeric code printed beneath the QR code on the tamper-evident pouch.
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!enteredCode.trim() || isValidating}
              isLoading={isValidating}
              className="w-full text-xs font-bold py-2.5 bg-purple-700 hover:bg-purple-800"
            >
              {isValidating ? 'Authenticating Rider with Server...' : 'Verify Code'}
            </Button>
          </form>
        )}

        {/* Error Notice (Does NOT reveal correct code) */}
        {verificationError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-900 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Verification Failed</p>
              <p className="text-rose-700">{verificationError}</p>
            </div>
          </div>
        )}

        {/* Verified Package & Order Items List (Displayed only after verified match) */}
        {isVerified && scannedItems && (
          <div className="bg-purple-50/90 rounded-2xl p-4 border border-purple-200 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Package Verified & Sealed ({scannedItems.length} Items)</span>
              </span>
              <span className="text-[10px] bg-purple-200 text-purple-900 font-bold px-2 py-0.5 rounded-full">
                Code Matched
              </span>
            </div>

            <div className="divide-y divide-purple-200/60 text-xs max-h-48 overflow-y-auto">
              {scannedItems.map((item, idx) => (
                <div key={idx} className="py-2 flex items-center justify-between text-forest-900">
                  <div>
                    <span className="font-semibold">{item.name}</span>
                    <span className="text-[11px] text-brandText-secondary ml-2 font-mono">
                      x{item.quantity} {item.unit || 'unit'}
                    </span>
                  </div>
                  <span className="font-mono font-bold">
                    ₹{(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-purple-200 flex items-center justify-between text-xs font-bold text-purple-950">
              <span>Total Package Value:</span>
              <span className="font-mono text-sm">₹{Number(order.total || 0).toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-brandBorder-subtle">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-xs"
          >
            Cancel
          </Button>

          {isVerified && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleConfirmPickup}
              className="text-xs font-bold px-5 bg-purple-700 hover:bg-purple-800 shadow-md"
            >
              Confirm Pickup & Start Delivery Trip
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PharmacyPickupModal;
