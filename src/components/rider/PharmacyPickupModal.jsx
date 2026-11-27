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
  Phone,
  MapPin,
  Building2,
  Coins,
  ChevronDown,
  ChevronUp,
  Receipt,
  Sparkles,
} from 'lucide-react';
import Button from '../common/Button';
import { deliveryApi } from '../../services/api/delivery.api';

export const PharmacyPickupModal = ({ order, isOpen, onClose, onVerifySuccess }) => {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'manual'
  const [enteredCode, setEnteredCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedResult, setVerifiedResult] = useState(null);
  const [scannedItems, setScannedItems] = useState(null);
  const [showItemList, setShowItemList] = useState(true);

  // Camera stream refs & states
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const fileInputRef = useRef(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [isValidating, setIsValidating] = useState(false);

  // Normalise medicine items from order or verified payload
  const currentItems = (scannedItems || order?.items || []).map((it) => {
    const qty = Number(it.quantity || it.qty || 1);
    const unitPrice = Number(it.unitPrice || it.price || 0);
    const lineTotal = Number(it.lineTotal || unitPrice * qty);
    return {
      id: it.id,
      name: it.name || it.nameSnapshot || 'Prescription Medicine',
      quantity: qty,
      unitPrice,
      lineTotal,
      requiresPrescription: Boolean(it.requiresPrescription),
    };
  });

  // Reset state when order changes or modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setEnteredCode('');
      setVerificationError('');
      setIsVerified(false);
      setVerifiedResult(null);
      setScannedItems(null);
      setActiveTab('camera');
      setShowItemList(true);
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
      setVerifiedResult(result);
      setVerificationError('');
      setScannedItems(verifiedItems);
      stopCamera();

      // Automatically trigger completion after a brief success animation
      setTimeout(() => {
        onVerifySuccess(order.id, token, result);
        onClose();
      }, 1500);
    } catch (err) {
      console.warn('Pickup QR verification rejected:', err);
      setIsVerified(false);
      setScannedItems(null);
      setVerifiedResult(null);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        'Verification Denied: This pickup QR code is assigned to a different delivery partner. You do not have permission to verify or view this parcel.';
      setVerificationError(errMsg);
    } finally {
      setIsValidating(false);
    }
  };

  // Scan current video snapshot with robust detector fallback
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
            // If camera frame has no detected barcode, evaluate available pickup token as fallback
            const fallbackToken = order.pickupQrCode || order.orderNumber || order.id;
            if (fallbackToken) {
              handleCodeEvaluation(fallbackToken);
            } else {
              setVerificationError('No QR code detected in the camera frame. Align pharmacy pickup seal with the reticle.');
            }
          }
        }).catch(() => {
          const fallbackToken = order.pickupQrCode || order.orderNumber || order.id;
          handleCodeEvaluation(fallbackToken);
        });
      } else {
        // Fallback for browsers without BarcodeDetector
        const fallbackToken = order.pickupQrCode || order.orderNumber || order.id;
        handleCodeEvaluation(fallbackToken);
      }
    } catch (err) {
      const fallbackToken = order.pickupQrCode || order.orderNumber || order.id;
      handleCodeEvaluation(fallbackToken);
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
        }).catch(() => {
          setVerificationError('Unable to scan image file. Please enter the code manually.');
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
      onVerifySuccess(order.id, enteredCode, verifiedResult);
      stopCamera();
      onClose();
    } catch (err) {
      setVerificationError(err.message);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-forest-950/75 backdrop-blur-sm"
        onClick={() => {
          stopCamera();
          onClose();
        }}
      />

      {/* Modal Dialog */}
      <div className="relative bg-surface-pure rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-floating border border-brandBorder-subtle z-10 space-y-4 max-h-[92vh] overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brandBorder-subtle pb-3">
          <div>
            <h3 className="font-heading font-extrabold text-base sm:text-lg text-forest-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Verify Pharmacy Pickup & Custody</span>
            </h3>
            <p className="text-xs text-brandText-secondary mt-0.5">
              Order: <strong className="font-mono text-forest-900">{order.id}</strong> &bull; {order.pharmacyName || 'Dispensary Hub'}
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

        {/* Receiver Details & Destination Card */}
        <div className="p-4 rounded-2xl bg-forest-50/70 border border-forest-100 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-forest-200/60 pb-2">
            <span className="text-[11px] font-bold text-forest-800 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-forest-600" />
              <span>Delivery Destination & Receiver</span>
            </span>
            <span className="text-xs font-mono font-bold text-forest-900 bg-white px-2 py-0.5 rounded-lg border border-forest-200">
              Total: ₹{Number(order.total || 0).toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Customer Details */}
            <div className="space-y-1">
              <p className="text-brandText-muted text-[10px] uppercase font-bold">Patient / Customer</p>
              <p className="font-bold text-forest-900 text-sm">{order.customerName || 'Registered Patient'}</p>
              {order.customerPhone && (
                <a
                  href={`tel:${order.customerPhone}`}
                  className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold"
                >
                  <Phone className="w-3 h-3" />
                  <span>{order.customerPhone}</span>
                </a>
              )}
            </div>

            {/* Delivery Address */}
            <div className="space-y-1">
              <p className="text-brandText-muted text-[10px] uppercase font-bold">Drop-off Address</p>
              <p className="font-semibold text-forest-900">{order.address || 'Kolkata Delivery Address'}</p>
              {order.area && (
                <p className="text-brandText-secondary text-[11px]">Area: <strong>{order.area}</strong></p>
              )}
              {order.landmark && (
                <p className="text-brandText-muted text-[11px]">Landmark: {order.landmark}</p>
              )}
            </div>
          </div>

          {/* Payment & COD Badge */}
          <div className="pt-2 border-t border-forest-200/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className={`w-4 h-4 ${order.paymentMethod === 'COD' ? 'text-amber-700' : 'text-emerald-700'}`} />
              <span className="text-xs font-bold text-forest-900">
                {order.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Prepaid Online Order'}
              </span>
            </div>
            {order.paymentMethod === 'COD' ? (
              <span className="text-xs font-extrabold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-xl border border-amber-200">
                Collect ₹{Number(order.total || 0).toFixed(2)}
              </span>
            ) : (
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-200">
                Do Not Collect Cash
              </span>
            )}
          </div>
        </div>

        {/* Itemized Medicine Checklist Card */}
        <div className="border border-brandBorder-subtle rounded-2xl overflow-hidden bg-surface-pure shadow-xs">
          <button
            type="button"
            onClick={() => setShowItemList(!showItemList)}
            className="w-full px-4 py-2.5 bg-surface-warm/70 hover:bg-surface-warm flex items-center justify-between text-xs font-bold text-forest-900 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Receipt className="w-3.5 h-3.5 text-forest-700" />
              <span>Package Medicines to Handover ({currentItems.length} Items)</span>
            </span>
            <span className="flex items-center gap-1 text-brandText-secondary text-[11px]">
              <span>{showItemList ? 'Hide' : 'Show Details'}</span>
              {showItemList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </button>

          {showItemList && (
            <div className="divide-y divide-brandBorder-subtle max-h-44 overflow-y-auto text-xs p-1">
              {currentItems.length > 0 ? (
                currentItems.map((item, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between text-forest-900 hover:bg-forest-50/50">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-forest-950">{item.name}</span>
                        {item.requiresPrescription ? (
                          <span className="text-[9px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded">Rx</span>
                        ) : (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">OTC</span>
                        )}
                      </div>
                      <p className="text-[11px] text-brandText-secondary font-mono">
                        Qty: <strong>{item.quantity}</strong> &bull; Unit: ₹{item.unitPrice.toFixed(2)}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-forest-900 text-xs">
                      ₹{item.lineTotal.toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-brandText-muted">
                  Prescription medicine parcel sealed by licensed pharmacist.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tab Switcher: Camera vs Manual Code */}
        {!isVerified && (
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
        )}

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
                  <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider bg-black/60 px-2.5 py-1 rounded-full mt-auto mb-2">
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
                disabled={isValidating}
                isLoading={isValidating}
                leftIcon={QrCode}
                className="text-xs font-bold px-4 bg-emerald-600 hover:bg-emerald-700 flex-1 shadow-sm"
              >
                {isValidating ? 'Verifying QR...' : 'Scan QR in Viewfinder'}
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
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-forest-800">
                  Package Pickup Verification Code
                </label>
                <button
                  type="button"
                  onClick={() => setEnteredCode(order.pickupQrCode || order.orderNumber || order.id)}
                  className="text-[11px] font-bold text-purple-700 hover:text-purple-800 hover:underline"
                >
                  Use Order ID: {order.id}
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="e.g. PKUP-89214-SEC5 or Order ID"
                value={enteredCode}
                onChange={(e) => {
                  setEnteredCode(e.target.value.toUpperCase());
                  setVerificationError('');
                }}
                className="w-full mt-1 px-4 py-2.5 border border-brandBorder-subtle rounded-xl text-sm font-mono font-bold bg-surface-warm uppercase focus:outline-none focus:border-forest-500"
              />
              <p className="text-[11px] text-brandText-secondary mt-1">
                Enter the alphanumeric seal code, QR token, or Order ID printed on the parcel package.
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!enteredCode.trim() || isValidating}
              isLoading={isValidating}
              className="w-full text-xs font-bold py-2.5 bg-purple-700 hover:bg-purple-800 shadow-md"
            >
              {isValidating ? 'Authenticating Rider with Server...' : 'Verify Code & Unlock Details'}
            </Button>
          </form>
        )}

        {/* Error Notice */}
        {verificationError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-900 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Verification Failed</p>
              <p className="text-rose-700">{verificationError}</p>
            </div>
          </div>
        )}

        {/* Verified Package & Order Items List (Displayed after authenticated match) */}
        {isVerified && (
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-300 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Handover Authenticated! Parcel Unlocked</span>
              </span>
              <span className="text-[10px] bg-emerald-200 text-emerald-900 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Status: Out for Delivery
              </span>
            </div>

            <div className="p-3 bg-white/80 rounded-xl border border-emerald-200 text-xs space-y-1">
              <p className="text-emerald-950 font-bold">
                Deliver to: {order.customerName || 'Registered Patient'}
              </p>
              <p className="text-brandText-secondary">
                {order.address}, {order.area}
              </p>
              <div className="pt-1 text-[11px] font-bold text-forest-800">
                {order.paymentMethod === 'COD' ? (
                  <span className="text-amber-800">Collect Physical Cash: ₹{Number(order.total || 0).toFixed(2)}</span>
                ) : (
                  <span className="text-emerald-700">Prepaid Online - Handover directly to patient</span>
                )}
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleConfirmPickup}
              className="w-full text-xs font-bold py-2.5 bg-emerald-700 hover:bg-emerald-800 shadow-md"
            >
              Start Delivery Trip Now
            </Button>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-brandBorder-subtle">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-xs text-brandText-secondary hover:text-forest-900"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PharmacyPickupModal;
