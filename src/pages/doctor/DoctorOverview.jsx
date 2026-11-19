import React, { useState } from 'react';
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
} from 'lucide-react';
import MetricCard from '../../components/workspace/MetricCard';
import StatusBadge from '../../components/workspace/StatusBadge';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';

export const DoctorOverview = () => {
  const { user } = useAuth();
  const { tokens, callNextToken } = useWorkspaceStore();
  const { addToast } = useToast();
  const [dutyStatus, setDutyStatus] = useState('AVAILABLE'); // AVAILABLE | IN_CONSULTATION | ON_BREAK

  // Real-time token breakdown
  const servingToken = tokens.find((t) => t.status === 'SERVING');
  const nextToken = tokens.find((t) => t.status === 'NEXT');
  const waitingTokens = tokens.filter((t) => t.status === 'WAITING');
  const completedTokens = tokens.filter((t) => t.status === 'COMPLETED');

  const handleCallNext = () => {
    callNextToken();
    addToast('Called next patient to chamber!', 'success');
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
            alt={user?.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-forest-600 shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-forest-900">
                {user?.name || 'Dr. Priya Sharma'}
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                On Duty
              </span>
            </div>
            <p className="text-xs text-forest-700 font-semibold mt-0.5">
              MBBS, MD &bull; General Medicine &bull; Reg: WBMC-68421
            </p>
            <p className="text-[11px] text-brandText-secondary mt-0.5">
              Apollo Clinic, Salt Lake Kolkata &bull; Chamber 204
            </p>
          </div>
        </div>

        {/* Duty Status Selector */}
        <div className="flex items-center gap-2 bg-surface-warm p-1.5 rounded-2xl border border-brandBorder-subtle">
          <button
            onClick={() => {
              setDutyStatus('AVAILABLE');
              addToast('Duty status set to Available', 'info');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              dutyStatus === 'AVAILABLE'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-brandText-secondary hover:text-emerald-700'
            }`}
          >
            Available
          </button>
          <button
            onClick={() => {
              setDutyStatus('IN_CONSULTATION');
              addToast('Status set to In Consultation', 'info');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              dutyStatus === 'IN_CONSULTATION'
                ? 'bg-forest-800 text-white shadow-sm'
                : 'text-brandText-secondary hover:text-forest-800'
            }`}
          >
            In Consultation
          </button>
          <button
            onClick={() => {
              setDutyStatus('ON_BREAK');
              addToast('Status set to On Break', 'info');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              dutyStatus === 'ON_BREAK'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-brandText-secondary hover:text-amber-700'
            }`}
          >
            On Break
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Current Serving Token"
          value={servingToken ? `#${servingToken.tokenNumber}` : 'None'}
          change={servingToken?.patientName || 'Chamber Free'}
          trend="neutral"
          caption="in chamber"
          icon={HeartPulse}
          colorScheme="emerald"
        />
        <MetricCard
          title="Patients in Lobby"
          value={waitingTokens.length}
          change={nextToken ? `Next: Token #${nextToken.tokenNumber}` : 'No queue'}
          trend="up"
          caption="awaiting consult"
          icon={Clock}
          colorScheme="amber"
        />
        <MetricCard
          title="Consultations Today"
          value={completedTokens.length}
          change="+100% on-track"
          trend="up"
          caption="today's progress"
          icon={CheckCircle}
          colorScheme="forest"
        />
        <MetricCard
          title="Average Consult Duration"
          value="14 mins"
          change="Standard Pace"
          trend="neutral"
          caption="per patient"
          icon={Activity}
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
                    {servingToken.vitals.bp} mmHg
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-forest-800">Pulse / Heart Rate</p>
                  <p className="font-bold text-sm text-forest-900 mt-0.5">
                    {servingToken.vitals.pulse}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-forest-800">Body Temp</p>
                  <p className="font-bold text-sm text-forest-900 mt-0.5">
                    {servingToken.vitals.temp}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-forest-800">Weight</p>
                  <p className="font-bold text-sm text-forest-900 mt-0.5">
                    {servingToken.vitals.weight}
                  </p>
                </div>
              </div>

              {/* Symptoms */}
              <div className="p-4 rounded-xl bg-surface-warm border border-brandBorder-subtle text-xs space-y-1">
                <p className="font-bold text-forest-900">Reported Symptoms & Chief Complaints:</p>
                <p className="text-brandText-main">{servingToken.symptoms}</p>
              </div>

              {/* Quick Call Next Action */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-brandText-secondary">
                  Arrived at: <strong>{servingToken.arrivedAt}</strong> &bull; Slot: {servingToken.slot}
                </span>
                <Button
                  variant="primary"
                  size="md"
                  rightIcon={ArrowRight}
                  onClick={handleCallNext}
                  className="text-xs font-bold px-5"
                >
                  Complete & Call Next Patient
                </Button>
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
                  Ready to consult the next patient in line. Click Call Next to summon the next token ticket.
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
              <span className="text-[11px] text-amber-800 font-bold bg-amber-50 px-2 py-1 rounded">
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
                <span>Today's Live Queue</span>
              </h3>
              <Link
                to="/doctor/queue"
                className="text-xs font-bold text-forest-700 hover:underline"
              >
                Full Desk
              </Link>
            </div>

            <div className="divide-y divide-brandBorder-subtle max-h-72 overflow-y-auto">
              {tokens.map((token) => (
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
              ))}
            </div>
          </div>

          {/* Chamber Timings */}
          <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-5 space-y-3">
            <h3 className="font-heading font-bold text-sm text-forest-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-forest-600" />
              <span>Chamber Shift Today</span>
            </h3>
            <div className="p-3 bg-surface-warm rounded-xl border border-brandBorder-subtle space-y-1 text-xs">
              <p className="font-bold text-forest-900">Apollo Clinic Salt Lake</p>
              <p className="text-brandText-secondary">Morning Session: 09:30 AM – 01:30 PM</p>
              <p className="text-brandText-secondary">Evening Session: 05:00 PM – 08:30 PM</p>
              <p className="text-[11px] text-emerald-700 font-semibold pt-1">
                Receptionist Desk: Ananya Roy (Ext: 204)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorOverview;
