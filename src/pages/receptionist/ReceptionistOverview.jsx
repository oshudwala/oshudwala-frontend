import React, { useState, useEffect } from 'react';
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
  Building2,
  CalendarCheck,
  Loader2,
} from 'lucide-react';
import MetricCard from '../../components/workspace/MetricCard';
import StatusBadge from '../../components/workspace/StatusBadge';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import { clinicApi } from '../../services/api/clinic.api';

export const ReceptionistOverview = () => {
  const { user } = useAuth();
  const { tokens, callNextToken } = useWorkspaceStore();
  const { addToast } = useToast();

  const [clinic, setClinic] = useState({
    name: 'Oshud Wala Primary Clinic',
    address: 'City Centre, Durgapur',
    city: 'Durgapur',
    coordinatorName: 'Reception Lead',
  });
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [profile, docs] = await Promise.all([
          clinicApi.getClinicProfile(user),
          clinicApi.getClinicDoctors(user?.id || 'default'),
        ]);
        if (isMounted) {
          setClinic(profile);
          setDoctors(docs);
        }
      } catch (err) {
        console.warn('Failed to load clinic overview:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    const handleRosterUpdate = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setDoctors(e.detail);
      } else {
        loadData();
      }
    };

    window.addEventListener('oshud_clinic_doctors_updated', handleRosterUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('oshud_clinic_doctors_updated', handleRosterUpdate);
    };
  }, [user]);

  // Aggregate metrics
  const servingTokens = tokens.filter((t) => t.status === 'SERVING');
  const waitingTokens = tokens.filter((t) => t.status === 'WAITING');
  const completedTokens = tokens.filter((t) => t.status === 'COMPLETED');
  const nextToken = tokens.find((t) => t.status === 'NEXT');

  const handleCallNext = (docId = null) => {
    callNextToken(docId);
    addToast('Called next patient into chamber queue!', 'success');
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-12 bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card space-y-3">
        <Loader2 className="w-8 h-8 text-forest-700 animate-spin" />
        <p className="text-sm font-bold text-forest-900">Loading Clinic Front Desk...</p>
        <p className="text-xs text-brandText-secondary">Fetching real-time chamber queues and doctor availability</p>
      </div>
    );
  }

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
                {clinic.name} Front Desk
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                Active Queue
              </span>
            </div>
            <p className="text-xs text-forest-700 font-semibold mt-0.5">
              {clinic.address} &bull; Front Reception Desk
            </p>
            <p className="text-[11px] text-brandText-secondary mt-0.5">
              Coordinator:{' '}
              <strong>{user?.fullName || user?.name || clinic.coordinatorName}</strong>
            </p>
          </div>
        </div>

        {/* Quick Registration & Queue Display Links */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/clinic/registration"
            className="px-4 py-2 bg-forest-800 hover:bg-forest-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-emerald-300" />
            <span>Register Walk-in Patient</span>
          </Link>
          <Link
            to="/clinic/appointments"
            className="px-3.5 py-2 bg-surface-warm hover:bg-forest-50 text-forest-800 border border-brandBorder-subtle text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
          >
            <CalendarCheck className="w-4 h-4 text-forest-600" />
            <span>Check-in Appointments</span>
          </Link>
          <Link
            to="/clinic/queue"
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
          title="Active in Consultation"
          value={servingTokens.length > 0 ? `${servingTokens.length} Patients` : 'Chambers Free'}
          change={servingTokens[0] ? `Latest: #${servingTokens[0].tokenNumber}` : 'All Ready'}
          trend="neutral"
          caption="in chamber right now"
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
          value={`${doctors.length} Doctors`}
          change={`${clinic.chamberCount || 'Active Chambers'}`}
          trend="neutral"
          caption={clinic.name}
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
                  Doctor-wise OPD consultation tokens synchronized in real-time
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/clinic/queue"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-forest-800 bg-surface-warm hover:bg-forest-50 border border-brandBorder-subtle transition-colors flex items-center gap-1"
                >
                  <span>Chamber Deck</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={Play}
                  onClick={() => handleCallNext()}
                  className="text-xs font-bold"
                >
                  Call Next Token
                </Button>
              </div>
            </div>

            <div className="divide-y divide-brandBorder-subtle">
              {tokens.slice(0, 8).map((token) => (
                <div
                  key={token.tokenNumber}
                  className={`py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    token.status === 'SERVING' ? 'bg-forest-50/60 p-3 rounded-2xl' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-extrabold text-sm text-forest-900 bg-surface-warm px-2.5 py-1 rounded-xl border border-brandBorder-subtle">
                      #{token.tokenNumber}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-xs text-forest-900">{token.patientName}</p>
                        <span className="text-[10px] text-forest-700 font-semibold bg-forest-50 px-2 py-0.5 rounded-full border border-forest-100">
                          {token.doctorName} &bull; {token.room}
                        </span>
                      </div>
                      <p className="text-[11px] text-brandText-secondary mt-0.5">
                        {token.gender}, {token.age} yrs &bull; {token.patientPhone} &bull; Slot: {token.slot}
                      </p>
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
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm text-forest-900 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-forest-600" />
                <span>Chamber Occupancy</span>
              </h3>
              <Link
                to="/clinic/doctors"
                className="text-xs font-bold text-forest-700 hover:text-forest-900 flex items-center gap-0.5"
              >
                <span>Roster</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2.5 text-xs">
              {doctors.map((doc) => {
                const docTokens = tokens.filter(
                  (t) =>
                    t.doctorId === doc.id ||
                    t.doctorId === doc.doctorId ||
                    (t.doctorName && doc.name && t.doctorName.toLowerCase().includes(doc.name.toLowerCase()))
                );
                const serving = docTokens.find((t) => t.status === 'SERVING');
                const waiting = docTokens.filter((t) => t.status === 'WAITING');

                return (
                  <div
                    key={doc.id}
                    className="p-3 bg-surface-warm rounded-2xl border border-brandBorder-subtle space-y-1.5"
                  >
                    <div className="flex justify-between items-start font-bold text-forest-900">
                      <div>
                        <span>{doc.name}</span>
                        <p className="text-[10px] text-forest-700 font-medium">
                          {doc.room} &bull; {doc.specialty}
                        </p>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                          serving
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-surface-pure text-brandText-secondary border border-brandBorder-subtle'
                        }`}
                      >
                        {serving ? 'Consulting' : 'Free'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-brandBorder-subtle/60 text-brandText-secondary">
                      <span>
                        Serving: <strong className="text-forest-900">{serving ? `#${serving.tokenNumber}` : '—'}</strong>
                      </span>
                      <span>
                        Waiting: <strong className="text-forest-900">{waiting.length}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistOverview;
