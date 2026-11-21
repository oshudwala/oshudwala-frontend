import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Users,
  CheckCircle,
  Calendar,
  ArrowRight,
  Phone,
  FileText,
  Activity,
  HeartPulse,
  Play,
  RotateCcw,
  Building2,
  Stethoscope,
  Sparkles,
} from 'lucide-react';
import MetricCard from '../../components/workspace/MetricCard';
import StatusBadge from '../../components/workspace/StatusBadge';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import doctorApi from '../../services/api/doctor.api';

export const DoctorOverview = () => {
  const { user } = useAuth();
  const { tokens, callNextToken } = useWorkspaceStore();
  const { addToast } = useToast();

  const doctorId = user?.id || 'default';
  const doctorName = user?.fullName || user?.name || 'Dr. Priya Sharma';
  const doctorSpecialty = user?.specialization || 'MBBS, MD • General Medicine';
  const doctorRegNo = user?.registrationNumber || 'WBMC-68421';

  // Real-time persistent duty status
  const [dutyStatus, setDutyStatus] = useState(() => doctorApi.getDutyStatus(doctorId));
  const [associatedClinics, setAssociatedClinics] = useState(() => doctorApi.getAssociatedClinics(doctorId));
  const [patientRecords, setPatientRecords] = useState(() => doctorApi.getPatientRecords());

  // Listen to status updates or clinic changes
  useEffect(() => {
    const handleStatusChanged = (e) => {
      if (e.detail?.status) {
        setDutyStatus(e.detail.status);
      }
    };
    const handleRecordsChanged = () => {
      setPatientRecords(doctorApi.getPatientRecords());
    };
    const handleClinicsChanged = (e) => {
      if (e.detail) {
        setAssociatedClinics(e.detail);
      }
    };

    window.addEventListener('oshud_doctor_status_changed', handleStatusChanged);
    window.addEventListener('oshud_patient_records_updated', handleRecordsChanged);
    window.addEventListener('oshud_doctor_clinics_updated', handleClinicsChanged);

    return () => {
      window.removeEventListener('oshud_doctor_status_changed', handleStatusChanged);
      window.removeEventListener('oshud_patient_records_updated', handleRecordsChanged);
      window.removeEventListener('oshud_doctor_clinics_updated', handleClinicsChanged);
    };
  }, [doctorId]);

  // Primary chamber
  const primaryClinic = associatedClinics.find((c) => c.status === 'PRIMARY_CHAMBER') || associatedClinics[0] || {
    name: 'Apollo Clinic, Salt Lake Kolkata',
    chamber: 'Room 204 (2nd Floor)',
    phoneExt: 'Ext 204',
    deskStaff: 'Ananya Roy (Reception Desk)',
  };

  // Filter tokens relevant to this doctor
  const doctorTokens = tokens.filter(
    (t) =>
      !t.doctorId ||
      t.doctorId === doctorId ||
      t.doctorId === 'doc-01' ||
      (t.doctorName && doctorName && t.doctorName.toLowerCase().includes(doctorName.toLowerCase())) ||
      (doctorName && t.doctorName && doctorName.toLowerCase().includes(t.doctorName.toLowerCase()))
  );

  const servingToken = doctorTokens.find((t) => t.status === 'SERVING') || tokens.find((t) => t.status === 'SERVING');
  const nextToken = doctorTokens.find((t) => t.status === 'NEXT') || tokens.find((t) => t.status === 'NEXT');
  const waitingTokens = doctorTokens.filter((t) => t.status === 'WAITING');
  const completedTokens = doctorTokens.filter((t) => t.status === 'COMPLETED');

  // Duty status change handler that writes to persistent storage & broadcasts
  const handleStatusChange = (newStatus) => {
    setDutyStatus(newStatus);
    doctorApi.updateDutyStatus(newStatus, doctorId, doctorName);
    const label = newStatus.replace('_', ' ');
    addToast(`Duty status updated to ${label}. Visible on clinic roster and patient portals.`, 'success');
  };

  const handleCallNext = () => {
    callNextToken(doctorId);
    addToast('Summoned next patient to chamber!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Doctor Profile Info & Duty Status Toggle */}
      <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <img
            src={
              user?.avatar ||
              'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200'
            }
            alt={doctorName}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-forest-600 shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-forest-900">
                {doctorName}
              </h1>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                  dutyStatus === 'AVAILABLE'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : dutyStatus === 'IN_CONSULTATION'
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : dutyStatus === 'ON_BREAK'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {dutyStatus.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-forest-700 font-semibold mt-0.5">
              {doctorSpecialty} &bull; Reg: {doctorRegNo}
            </p>
            <p className="text-[11px] text-brandText-secondary mt-0.5">
              {primaryClinic.name} &bull; {primaryClinic.chamber}
            </p>
          </div>
        </div>

        {/* Duty Status Selector with Persistent Sync */}
        <div className="flex flex-col items-end gap-1.5 self-stretch sm:self-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brandText-muted">
            Live Duty Status
          </span>
          <div className="flex items-center gap-1.5 bg-surface-warm p-1.5 rounded-2xl border border-brandBorder-subtle w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={() => handleStatusChange('AVAILABLE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                dutyStatus === 'AVAILABLE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-brandText-secondary hover:text-emerald-700'
              }`}
            >
              Available
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange('IN_CONSULTATION')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                dutyStatus === 'IN_CONSULTATION'
                  ? 'bg-forest-800 text-white shadow-sm'
                  : 'text-brandText-secondary hover:text-forest-800'
              }`}
            >
              In Consultation
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange('ON_BREAK')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                dutyStatus === 'ON_BREAK'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-brandText-secondary hover:text-amber-700'
              }`}
            >
              On Break
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange('OFFLINE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                dutyStatus === 'OFFLINE'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-brandText-secondary hover:text-slate-800'
              }`}
            >
              Offline
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Current Serving Token"
          value={servingToken ? `#${servingToken.tokenNumber}` : 'Chamber Free'}
          change={servingToken?.patientName || 'Awaiting Next'}
          trend="neutral"
          caption="in chamber"
          icon={HeartPulse}
          colorScheme="emerald"
        />
        <MetricCard
          title="Patients in Lobby Queue"
          value={waitingTokens.length}
          change={nextToken ? `Next: Token #${nextToken.tokenNumber}` : 'Queue Clear'}
          trend="up"
          caption="awaiting consult"
          icon={Clock}
          colorScheme="amber"
        />
        <MetricCard
          title="Consultations Done Today"
          value={completedTokens.length}
          change="+100% on-track"
          trend="up"
          caption="completed tickets"
          icon={CheckCircle}
          colorScheme="forest"
        />
        <MetricCard
          title="Patient EHR Records"
          value={patientRecords.length}
          change="Real-time EHR"
          trend="up"
          caption="chronic & visit profiles"
          icon={Users}
          colorScheme="blue"
        />
      </div>

      {/* 2-Column Clinical Working Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Currently Serving Patient Spotlight & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {servingToken ? (
            <div className="bg-surface-pure rounded-3xl border-2 border-forest-500/50 shadow-card p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-brandBorder-subtle pb-4">
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-2xl bg-forest-800 text-white font-mono font-extrabold text-lg flex items-center justify-center shadow-md">
                    #{servingToken.tokenNumber}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-heading font-extrabold text-forest-900">
                        {servingToken.patientName}
                      </h2>
                      <StatusBadge status={servingToken.status} />
                    </div>
                    <p className="text-xs text-brandText-secondary mt-0.5">
                      {servingToken.gender}, {servingToken.age} yrs &bull; {servingToken.patientPhone}
                    </p>
                  </div>
                </div>

                <Link
                  to="/doctor/queue"
                  className="px-4 py-2 bg-forest-800 hover:bg-forest-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-emerald-300" />
                  <span>Open Full Queue Console</span>
                </Link>
              </div>

              {/* Vitals Summary Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-forest-50/70 p-4 rounded-2xl border border-forest-100 text-xs">
                <div>
                  <p className="text-[10px] uppercase font-bold text-forest-800">Blood Pressure</p>
                  <p className="font-bold text-sm text-forest-900 mt-0.5">
                    {servingToken.vitals?.bp || '120/80'} mmHg
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-forest-800">Pulse Rate</p>
                  <p className="font-bold text-sm text-forest-900 mt-0.5">
                    {servingToken.vitals?.pulse || '74'} bpm
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-forest-800">Body Temp</p>
                  <p className="font-bold text-sm text-forest-900 mt-0.5">
                    {servingToken.vitals?.temp || '98.4'} °F
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-forest-800">Weight</p>
                  <p className="font-bold text-sm text-forest-900 mt-0.5">
                    {servingToken.vitals?.weight || '68'} kg
                  </p>
                </div>
              </div>

              {/* Symptoms */}
              <div className="p-4 rounded-xl bg-surface-warm border border-brandBorder-subtle text-xs space-y-1">
                <p className="font-bold text-forest-900">Reported Symptoms & Chief Complaints:</p>
                <p className="text-brandText-main">{servingToken.symptoms || 'Routine follow-up consultation'}</p>
              </div>

              {/* Quick Actions */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs text-brandText-secondary">
                  Arrived at: <strong>{servingToken.arrivedAt || '10:15 AM'}</strong> &bull; Slot:{' '}
                  {servingToken.slot || 'Booked Slot'}
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    to="/doctor/queue"
                    className="px-4 py-2 border border-forest-700 text-forest-800 hover:bg-forest-50 text-xs font-bold rounded-xl transition-all"
                  >
                    Enter Vitals & E-Rx
                  </Link>
                  <Button
                    variant="primary"
                    size="md"
                    rightIcon={ArrowRight}
                    onClick={handleCallNext}
                    className="text-xs font-bold px-5"
                  >
                    Call Next Token
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle p-8 text-center space-y-4 shadow-card">
              <div className="w-14 h-14 rounded-full bg-forest-50 text-forest-700 flex items-center justify-center mx-auto">
                <HeartPulse className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-forest-900">Chamber Is Free</h3>
                <p className="text-xs text-brandText-secondary max-w-sm mx-auto mt-1">
                  Ready to consult the next patient in line. Click Call Next to summon the next patient ticket.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                leftIcon={Play}
                onClick={handleCallNext}
                className="text-xs font-bold px-6"
              >
                Call Next Token
              </Button>
            </div>
          )}

          {/* Up Next in Line */}
          {nextToken && (
            <div className="bg-surface-pure rounded-2xl border border-brandBorder-subtle p-4 shadow-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 font-mono font-bold text-sm flex items-center justify-center">
                  #{nextToken.tokenNumber}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-xs text-forest-900">{nextToken.patientName}</p>
                    <StatusBadge status={nextToken.status} />
                  </div>
                  <p className="text-[11px] text-brandText-secondary">
                    {nextToken.symptoms} &bull; {nextToken.slot}
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-amber-800 font-bold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                Standing By Outside Chamber
              </span>
            </div>
          )}
        </div>

        {/* Right 1 Col: Queue List & Chamber Schedule */}
        <div className="space-y-6">
          <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm text-forest-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-forest-600" />
                <span>Today's Live Queue ({doctorTokens.length})</span>
              </h3>
              <Link
                to="/doctor/queue"
                className="text-xs font-bold text-forest-700 hover:underline"
              >
                Full Desk
              </Link>
            </div>

            <div className="divide-y divide-brandBorder-subtle max-h-72 overflow-y-auto">
              {doctorTokens.length === 0 ? (
                <p className="text-xs text-brandText-secondary py-4 text-center">
                  No active tokens in queue right now.
                </p>
              ) : (
                doctorTokens.map((token) => (
                  <div
                    key={token.tokenNumber}
                    className="py-2.5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-forest-800 w-8">
                        #{token.tokenNumber}
                      </span>
                      <div>
                        <p className="font-bold text-forest-900 truncate max-w-[130px]">
                          {token.patientName}
                        </p>
                        <p className="text-[10px] text-brandText-muted">{token.type}</p>
                      </div>
                    </div>
                    <StatusBadge status={token.status} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Associated Chamber Today */}
          <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm text-forest-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-forest-600" />
                <span>Associated Clinic Chamber</span>
              </h3>
              <Link to="/doctor/clinics" className="text-xs font-bold text-forest-700 hover:underline">
                Manage
              </Link>
            </div>
            <div className="p-3.5 bg-surface-warm rounded-2xl border border-brandBorder-subtle space-y-1.5 text-xs">
              <p className="font-bold text-forest-900">{primaryClinic.name}</p>
              <p className="text-[11px] text-forest-700 font-semibold">{primaryClinic.chamber}</p>
              <p className="text-brandText-secondary">Morning Session: 09:30 AM – 01:30 PM</p>
              <p className="text-brandText-secondary">Evening Session: 05:00 PM – 08:30 PM</p>
              <p className="text-[11px] text-emerald-800 font-semibold pt-1">
                {primaryClinic.deskStaff} &bull; {primaryClinic.phoneExt}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorOverview;
