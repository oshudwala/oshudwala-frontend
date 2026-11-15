import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Construction,
  Stethoscope,
  Building2,
  UserCheck,
  LogOut,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Logo from '../components/common/Logo';

export const UnderProgressPage = () => {
  const navigate = useNavigate();
  const { user, logout, switchRole } = useAuth();

  const isDoctor = user?.role === 'doctor';
  const isPharmacist = user?.role === 'pharmacist';

  const roleTitle = isDoctor
    ? 'Doctor Clinical Workspace'
    : isPharmacist
    ? 'Pharmacist Operations Workspace'
    : 'Partner Workspace';

  const upcomingFeatures = isDoctor
    ? [
        {
          title: 'Live Clinic Queue Controller',
          desc: 'Real-time patient serving controls (Next, Call, Skip, Recall) directly synced with clinic display.'
        },
        {
          title: 'Digital Prescription Generator',
          desc: 'Prescription authoring with built-in drug interaction alerts and direct pharmacy routing.'
        },
        {
          title: 'Appointment Capacity & Slot Management',
          desc: 'Configure morning/evening consultation hours across Kolkata & West Bengal clinics.'
        }
      ]
    : [
        {
          title: 'Prescription Review & Dispensing Queue',
          desc: 'High-resolution pan, zoom, and digital verification of patient prescriptions with WBSPC compliance.'
        },
        {
          title: 'Inventory & Batch Expiry Tracking',
          desc: 'Live inventory sync with local distributor catalogs and automatic low-stock alerts.'
        },
        {
          title: 'Rider Handover QR Verification',
          desc: 'Tamper-proof package sealing and instant OTP/QR code verification during rider dispatch.'
        }
      ];

  const handleSwitchToPatient = () => {
    switchRole('patient');
    navigate('/');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl bg-surface-pure rounded-3xl p-6 sm:p-10 border border-brandBorder-subtle shadow-floating space-y-8 animate-fade-in text-center">
        {/* Status Badge & Logo */}
        <div className="flex flex-col items-center space-y-3">
          <Logo className="mb-2" />
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold tracking-wide">
            <Clock className="w-4 h-4 text-amber-600 animate-spin" />
            <span>PORTAL UNDER DEVELOPMENT</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold text-forest-800 tracking-tight">
            {roleTitle} is Still Under Progress
          </h1>

          <p className="text-xs sm:text-sm text-brandText-secondary max-w-xl leading-relaxed">
            The Oshud Wala healthcare ecosystem connects patients, doctors, and pharmacies. The current live website is exclusively configured for the <span className="font-bold text-forest-800">Patient Portal</span>. Clinical and pharmacy workspaces are undergoing active engineering and compliance audits.
          </p>
        </div>

        {/* Current Logged In Profile Card */}
        <div className="bg-forest-50/70 p-5 rounded-2xl border border-forest-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatar || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200"}
              alt={user?.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-forest-600 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-base text-forest-800">
                  {user?.name || (isDoctor ? 'Dr. Priya Sharma' : 'MedPlus Pharmacist')}
                </h3>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-forest-600 text-white">
                  {user?.role}
                </span>
              </div>
              <p className="text-xs text-brandText-secondary mt-0.5">{user?.email}</p>
              {user?.licenseNumber && (
                <p className="text-[11px] text-forest-700 font-semibold mt-0.5">
                  Reg: {user.licenseNumber}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              leftIcon={LogOut}
              onClick={handleLogout}
              className="w-full sm:w-auto text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              Sign Out
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={UserCheck}
              onClick={handleSwitchToPatient}
              className="w-full sm:w-auto text-xs font-bold"
            >
              Switch to Patient
            </Button>
          </div>
        </div>

        {/* Upcoming Features Roadmap */}
        <div className="space-y-4 text-left">
          <div className="flex items-center gap-2 text-forest-800 font-heading font-bold text-sm">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Upcoming Capabilities for {roleTitle}:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {upcomingFeatures.map((feat, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-surface-warm border border-brandBorder-subtle space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <h4 className="font-heading font-bold text-xs text-forest-800 leading-snug">
                    {feat.title}
                  </h4>
                </div>
                <p className="text-[11px] text-brandText-secondary leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Info Banner */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-forest-600 flex-shrink-0" />
          <span>
            To test or explore medicine ordering, doctor bookings, and cart checkout, click <b>"Switch to Patient"</b>.
          </span>
        </div>
      </div>
    </div>
  );
};

export default UnderProgressPage;
