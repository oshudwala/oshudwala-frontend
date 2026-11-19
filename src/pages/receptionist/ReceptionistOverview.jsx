import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Clock,
  UserCheck,
  Stethoscope,
  Plus,
  Play,
  ArrowRight,
  Tv,
  CheckCircle,
} from 'lucide-react';
import MetricCard from '../../components/workspace/MetricCard';
import StatusBadge from '../../components/workspace/StatusBadge';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';

export const ReceptionistOverview = () => {
  const { user } = useAuth();
  const { tokens, callNextToken } = useWorkspaceStore();
  const { addToast } = useToast();

  const servingToken = tokens.find((t) => t.status === 'SERVING');
  const nextToken = tokens.find((t) => t.status === 'NEXT');
  const waitingTokens = tokens.filter((t) => t.status === 'WAITING');
  const completedTokens = tokens.filter((t) => t.status === 'COMPLETED');

  const handleCallNext = () => {
    callNextToken();
    addToast('Called next patient to Room 204!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Front Desk Header Strip */}
      <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 flex-shrink-0 shadow-sm">
            <UserCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-forest-900">
                Apollo Clinic Front Desk
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                Active Queue
              </span>
            </div>
            <p className="text-xs text-forest-700 font-semibold mt-0.5">
              Sector 1, Salt Lake City, Kolkata &bull; Front Reception
            </p>
            <p className="text-[11px] text-brandText-secondary mt-0.5">
              Coordinator: <strong>{user?.name || 'Ananya Roy (Reception Lead)'}</strong>
            </p>
          </div>
        </div>

        {/* Quick Registration & Queue Display Links */}
        <div className="flex items-center gap-2.5">
          <Link
            to="/receptionist/registration"
            className="px-4 py-2 bg-forest-800 hover:bg-forest-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-emerald-300" />
            <span>Register Walk-in Patient</span>
          </Link>
          <Link
            to="/receptionist/queue"
            className="px-3.5 py-2 bg-surface-warm hover:bg-forest-50 text-forest-800 border border-brandBorder-subtle text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
          >
            <Tv className="w-4 h-4 text-forest-600" />
            <span>Lobby TV View</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Currently in Consultation"
          value={servingToken ? `Token #${servingToken.tokenNumber}` : 'Chamber Free'}
          change={servingToken?.patientName || 'Room 204'}
          trend="neutral"
          caption="Dr. Priya Sharma"
          icon={Stethoscope}
          colorScheme="forest"
        />
        <MetricCard
          title="Patients in Waiting Lobby"
          value={waitingTokens.length}
          change={nextToken ? `Next: #${nextToken.tokenNumber}` : 'Queue Clear'}
          trend="up"
          caption="in waiting room"
          icon={Clock}
          colorScheme="amber"
        />
        <MetricCard
          title="Consultations Completed"
          value={completedTokens.length}
          change="Today's Total"
          trend="up"
          caption="consulted & discharged"
          icon={CheckCircle}
          colorScheme="emerald"
        />
        <MetricCard
          title="Doctors On Duty"
          value="4 Doctors"
          change="All Chambers Full"
          trend="neutral"
          caption="Apollo Polyclinic"
          icon={Users}
          colorScheme="blue"
        />
      </div>

      {/* 2-Column Front Desk Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Queue Deck */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading font-extrabold text-base text-forest-900">
                  Live Token Queue Monitor
                </h2>
                <p className="text-xs text-brandText-secondary">
                  Synchronized with Doctor consultation chamber in real-time
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={Play}
                onClick={handleCallNext}
                className="text-xs font-bold"
              >
                Call Next Token
              </Button>
            </div>

            <div className="divide-y divide-brandBorder-subtle">
              {tokens.map((token) => (
                <div
                  key={token.tokenNumber}
                  className={`py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    token.status === 'SERVING' ? 'bg-forest-50/50 p-3 rounded-2xl' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-extrabold text-sm text-forest-900 bg-surface-warm px-2.5 py-1 rounded-xl border border-brandBorder-subtle">
                      #{token.tokenNumber}
                    </span>
                    <div>
                      <p className="font-bold text-xs text-forest-900">{token.patientName}</p>
                      <p className="text-[11px] text-brandText-secondary">
                        {token.gender}, {token.age} yrs &bull; {token.patientPhone}
                      </p>
                      <p className="text-[10px] text-brandText-muted">Slot: {token.slot}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={token.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Clinic Doctors Status */}
        <div className="space-y-6">
          <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-5 space-y-4">
            <h3 className="font-heading font-bold text-sm text-forest-900 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-forest-600" />
              <span>Chamber Occupancy</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-surface-warm rounded-2xl border border-brandBorder-subtle space-y-1">
                <div className="flex justify-between font-bold text-forest-900">
                  <span>Room 204: Dr. Priya Sharma</span>
                  <span className="text-emerald-700">Consulting</span>
                </div>
                <p className="text-[11px] text-brandText-secondary">General Medicine &bull; Serving Token #{servingToken?.tokenNumber || '--'}</p>
              </div>

              <div className="p-3 bg-surface-warm rounded-2xl border border-brandBorder-subtle space-y-1">
                <div className="flex justify-between font-bold text-forest-900">
                  <span>Room 206: Dr. Rohit Mehta</span>
                  <span className="text-emerald-700">Consulting</span>
                </div>
                <p className="text-[11px] text-brandText-secondary">Cardiology &bull; Next slot: 11:15 AM</p>
              </div>

              <div className="p-3 bg-surface-warm rounded-2xl border border-brandBorder-subtle space-y-1">
                <div className="flex justify-between font-bold text-forest-900">
                  <span>Room 208: Dr. Sneha Das</span>
                  <span className="text-amber-700">Tea Break</span>
                </div>
                <p className="text-[11px] text-brandText-secondary">Dermatology &bull; Resumes 11:30 AM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistOverview;
