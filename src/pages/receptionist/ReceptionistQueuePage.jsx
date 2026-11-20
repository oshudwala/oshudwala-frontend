import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  SkipForward,
  RotateCcw,
  Volume2,
  Tv,
  Plus,
  Maximize2,
  Minimize2,
  Printer,
  User,
  Stethoscope,
  Building2,
  X,
  Phone,
  Sparkles,
  Loader2,
} from 'lucide-react';
import StatusBadge from '../../components/workspace/StatusBadge';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import { clinicApi } from '../../services/api/clinic.api';

export const ReceptionistQueuePage = () => {
  const { user } = useAuth();
  const { tokens, callNextToken, skipToken, recallToken, generateToken } = useWorkspaceStore();
  const { addToast } = useToast();

  const [clinic, setClinic] = useState({ name: 'Apollo Clinic & Polyclinic', city: 'Kolkata' });
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctorId, setSelectedDoctorId] = useState('ALL');
  const [filter, setFilter] = useState('ALL');
  const [isTvMode, setIsTvMode] = useState(false);
  const [tvViewType, setTvViewType] = useState('GRID'); // 'GRID' or 'STAGE'

  // Quick Issue Token Modal
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [quickForm, setQuickForm] = useState({
    patientName: '',
    patientPhone: '',
    age: '',
    gender: 'Male',
    doctorId: '',
    symptoms: '',
  });

  // Load clinic and doctors from backend
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
        console.warn('Failed to load clinic queue data:', err);
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

  // Selected doctor object if a specific doctor is picked
  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId || d.doctorId === selectedDoctorId);

  // Helper to filter tokens for a given doctor
  const getDoctorTokens = (docId) => {
    const doc = doctors.find((d) => d.id === docId || d.doctorId === docId);
    return tokens.filter(
      (t) =>
        t.doctorId === docId ||
        (doc && t.doctorName && t.doctorName.toLowerCase().includes(doc.name.toLowerCase())) ||
        (doc && doc.name && t.doctorName && doc.name.toLowerCase().includes(t.doctorName.toLowerCase()))
    );
  };

  // Active tokens for currently selected doctor view
  const activeTokens = selectedDoctorId === 'ALL' ? tokens : getDoctorTokens(selectedDoctorId);

  const servingToken = activeTokens.find((t) => t.status === 'SERVING');
  const nextToken = activeTokens.find((t) => t.status === 'NEXT');
  const waitingTokens = activeTokens.filter((t) => t.status === 'WAITING');

  const filteredTokens = activeTokens.filter((t) => {
    if (filter === 'ALL') return true;
    return t.status === filter;
  });

  // Advance queue for a specific doctor
  const handleCallNext = (targetDocId = null) => {
    const docIdToCall = targetDocId || (selectedDoctorId !== 'ALL' ? selectedDoctorId : null);
    const docObj = doctors.find((d) => d.id === docIdToCall || d.doctorId === docIdToCall);

    callNextToken(docIdToCall);
    addToast(
      docObj
        ? `Summoned next token for ${docObj.name} (${docObj.room || 'Chamber'})!`
        : 'Summoned next token to consultation room!',
      'success'
    );
  };

  // Announce token audible voice chime
  const handleAnnounceToken = (tokenNum, patientName, room, doctorName) => {
    const targetRoom = room || selectedDoctor?.room || 'Consultation Room';
    const targetDoctor = doctorName || selectedDoctor?.name || 'Doctor';

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = `Token Number ${tokenNum}, ${patientName || 'Patient'}, please proceed to ${targetRoom}, ${targetDoctor}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
    addToast(`Audible lobby broadcast for Token #${tokenNum} to ${targetRoom}`, 'info');
  };

  // Quick Token Generation
  const handleOpenQuickModal = (preselectedDocId = null) => {
    const defaultDoc = preselectedDocId || (selectedDoctorId !== 'ALL' ? selectedDoctorId : doctors[0]?.id || '');
    setQuickForm({
      patientName: '',
      patientPhone: '',
      age: '',
      gender: 'Male',
      doctorId: defaultDoc,
      symptoms: '',
    });
    setShowQuickModal(true);
  };

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!quickForm.patientName || !quickForm.patientPhone) return;

    const chosenDoc = doctors.find((d) => d.id === quickForm.doctorId || d.doctorId === quickForm.doctorId) || doctors[0];

    const newToken = generateToken({
      patientName: quickForm.patientName.trim(),
      patientPhone: quickForm.patientPhone.trim(),
      age: quickForm.age,
      gender: quickForm.gender,
      symptoms: quickForm.symptoms || 'Walk-in Consultation',
      type: 'WALK_IN',
      doctorId: chosenDoc?.id || 'doc-01',
      doctorName: chosenDoc?.name || 'Dr. Priya Sharma',
      clinicName: clinic.name,
      room: chosenDoc?.room || 'Room 204',
    });

    addToast(`Token #${newToken.tokenNumber} generated for ${chosenDoc?.name}!`, 'success');
    setShowQuickModal(false);
  };

  // ================= FULLSCREEN TV MODE =================
  if (isTvMode) {
    return (
      <div className="fixed inset-0 z-50 bg-forest-950 text-white p-6 sm:p-10 flex flex-col justify-between overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-forest-800 pb-5">
          <div className="flex items-center gap-4">
            <img src="/logo-light.png" alt="Oshud Wala Logo" className="h-11 w-auto" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-white">
                {clinic.name}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-300 font-bold uppercase tracking-wider flex items-center gap-2">
                <span>Multi-Chamber OPD Patient Queue &bull; {clinic.city}</span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-forest-900 border border-forest-700 rounded-xl p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTvViewType('GRID')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  tvViewType === 'GRID' ? 'bg-emerald-600 text-white' : 'text-forest-300 hover:text-white'
                }`}
              >
                All Chambers Grid
              </button>
              <button
                type="button"
                onClick={() => setTvViewType('STAGE')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  tvViewType === 'STAGE' ? 'bg-emerald-600 text-white' : 'text-forest-300 hover:text-white'
                }`}
              >
                Stage Focus
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsTvMode(false)}
              className="px-4 py-2 bg-forest-800 hover:bg-forest-700 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-colors border border-forest-700"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Exit TV Mode</span>
            </button>
          </div>
        </div>

        {/* TV Mode Content: Either Polyclinic Grid or Single Doctor Stage */}
        {tvViewType === 'GRID' ? (
          <div className="my-auto py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doc) => {
              const docTokens = getDoctorTokens(doc.id);
              const serving = docTokens.find((t) => t.status === 'SERVING');
              const next = docTokens.find((t) => t.status === 'NEXT');
              const waiting = docTokens.filter((t) => t.status === 'WAITING');

              return (
                <div
                  key={doc.id}
                  className="bg-forest-900/90 rounded-3xl border-2 border-forest-700/80 p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden"
                >
                  <div className="flex items-start justify-between border-b border-forest-800/80 pb-4">
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/40">
                        {doc.room}
                      </span>
                      <h2 className="text-xl font-heading font-extrabold text-white mt-2">
                        {doc.name}
                      </h2>
                      <p className="text-xs text-forest-300 font-medium">{doc.specialty}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-300 bg-forest-800 px-2 py-1 rounded-md">
                      {waiting.length} in Line
                    </span>
                  </div>

                  {/* Serving Display */}
                  <div className="py-6 text-center my-auto">
                    <p className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-widest">
                      Now Serving
                    </p>
                    <div className="py-1">
                      <span className="font-mono font-black text-6xl text-white tracking-tighter">
                        {serving ? `#${serving.tokenNumber}` : 'FREE'}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-forest-100 truncate px-2">
                      {serving?.patientName || 'Chamber Available'}
                    </p>
                  </div>

                  {/* Next Patient Strip */}
                  <div className="p-3 bg-forest-950/80 rounded-2xl border border-forest-800 flex items-center justify-between text-xs">
                    <span className="text-forest-400 font-semibold">Up Next:</span>
                    <span className="font-mono font-bold text-amber-300">
                      {next ? `#${next.tokenNumber} • ${next.patientName}` : 'Queue Clear'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto py-6">
            <div className="lg:col-span-8 bg-forest-900/90 rounded-3xl border-2 border-emerald-500/80 p-8 sm:p-12 text-center space-y-6 shadow-2xl">
              <p className="text-sm sm:text-base font-extrabold text-emerald-400 tracking-widest uppercase animate-pulse">
                ● NOW SERVING &bull; {selectedDoctor ? `${selectedDoctor.room} (${selectedDoctor.name})` : 'CONSULTATION CHAMBER'}
              </p>

              <div className="py-2">
                <span className="font-mono font-black text-7xl sm:text-9xl text-white tracking-tighter drop-shadow-lg">
                  {servingToken ? `#${servingToken.tokenNumber}` : '---'}
                </span>
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl sm:text-4xl font-heading font-extrabold text-white">
                  {servingToken?.patientName || 'Chamber is preparing'}
                </h2>
                <p className="text-base text-forest-200">
                  {servingToken?.doctorName || selectedDoctor?.name || 'Doctor Consultation'}
                </p>
              </div>
            </div>

            <div className="lg:col-span-4 bg-forest-900/50 rounded-3xl border border-forest-800 p-6 space-y-4">
              <h3 className="text-sm font-extrabold text-emerald-300 uppercase tracking-wider border-b border-forest-800 pb-3">
                Up Next In Line
              </h3>
              <div className="space-y-3">
                {nextToken && (
                  <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xl font-black text-emerald-300">
                        Token #{nextToken.tokenNumber}
                      </span>
                      <p className="text-sm font-bold text-white mt-0.5">{nextToken.patientName}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-forest-950 text-xs font-black uppercase">
                      Get Ready
                    </span>
                  </div>
                )}

                {waitingTokens.slice(0, 4).map((t) => (
                  <div
                    key={t.tokenNumber}
                    className="p-3 bg-forest-800/40 rounded-xl flex items-center justify-between text-xs"
                  >
                    <span className="font-mono font-bold text-forest-200">Token #{t.tokenNumber}</span>
                    <span className="font-semibold text-white">{t.patientName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-forest-800 pt-4 flex items-center justify-between text-xs text-forest-300">
          <span>Please watch the monitor and listen for your token announcement.</span>
          <span>Emergency Assistance: Press 0 at Reception Desk</span>
        </div>
      </div>
    );
  }

  // ================= MAIN RECEPTIONIST QUEUE VIEW =================
  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-12 bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card space-y-3">
        <Loader2 className="w-8 h-8 text-forest-700 animate-spin" />
        <p className="text-sm font-bold text-forest-900">Loading Live Doctor Queues...</p>
        <p className="text-xs text-brandText-secondary">Synchronizing doctor chambers and patient manifests</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-forest-900">
            Clinic Token Desk & Lobby Queue
          </h1>
          <p className="text-xs text-brandText-secondary mt-0.5">
            Doctor-wise OPD queue management, live chamber summon, and digital lobby TV displays.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            leftIcon={Plus}
            onClick={() => handleOpenQuickModal()}
            className="text-xs font-bold"
          >
            Issue Walk-in Token
          </Button>

          <button
            type="button"
            onClick={() => setIsTvMode(true)}
            className="px-3.5 py-2 rounded-xl bg-forest-100 hover:bg-forest-200 text-forest-900 font-bold text-xs flex items-center gap-1.5 transition-colors border border-forest-200"
          >
            <Tv className="w-4 h-4 text-forest-700" />
            <span>Launch Lobby TV Display</span>
          </button>

          {selectedDoctorId !== 'ALL' && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={Play}
              onClick={() => handleCallNext(selectedDoctorId)}
              className="text-xs font-bold"
            >
              Call Next ({selectedDoctor?.room?.split(' ')[0] || 'Room'})
            </Button>
          )}
        </div>
      </div>

      {/* Doctor-Wise Queue Filter Navigation Tabs */}
      <div className="bg-surface-pure rounded-2xl border border-brandBorder-subtle p-2 shadow-sm flex items-center gap-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setSelectedDoctorId('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
            selectedDoctorId === 'ALL'
              ? 'bg-forest-800 text-white shadow-sm'
              : 'bg-surface-warm text-brandText-secondary hover:text-forest-900 hover:bg-forest-50'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>All Doctor Chambers ({doctors.length})</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
            {tokens.filter((t) => t.status === 'WAITING').length}
          </span>
        </button>

        {doctors.map((doc) => {
          const docTokens = getDoctorTokens(doc.id);
          const waitingCount = docTokens.filter((t) => t.status === 'WAITING').length;
          const isSelected = selectedDoctorId === doc.id || selectedDoctorId === doc.doctorId;

          return (
            <button
              key={doc.id}
              onClick={() => setSelectedDoctorId(doc.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                isSelected
                  ? 'bg-forest-800 text-white border-forest-800 shadow-sm'
                  : 'bg-surface-pure text-brandText-secondary border-brandBorder-subtle hover:text-forest-900 hover:bg-surface-warm'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-emerald-500" />
              <span>{doc.name}</span>
              <span className={`text-[10px] font-normal opacity-80`}>({doc.room?.split(' ')[0] || 'Chamber'})</span>
              {waitingCount > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isSelected ? 'bg-amber-400 text-forest-950' : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {waitingCount} wait
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ================= IF "ALL DOCTORS" SELECTED: MULTI-CHAMBER CARDS ================= */}
      {selectedDoctorId === 'ALL' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {doctors.map((doc) => {
              const docTokens = getDoctorTokens(doc.id);
              const serving = docTokens.find((t) => t.status === 'SERVING');
              const next = docTokens.find((t) => t.status === 'NEXT');
              const waiting = docTokens.filter((t) => t.status === 'WAITING');

              return (
                <div
                  key={doc.id}
                  className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-5 space-y-4 hover:border-forest-400 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Chamber Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-forest-800 bg-forest-50 px-2 py-0.5 rounded-lg border border-forest-200">
                          {doc.room}
                        </span>
                        <h3 className="font-heading font-extrabold text-base text-forest-900 mt-1.5">
                          {doc.name}
                        </h3>
                        <p className="text-[11px] text-forest-700 font-semibold">{doc.specialty}</p>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          serving
                            ? 'bg-emerald-100 text-emerald-800'
                            : waiting.length > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-surface-warm text-brandText-secondary'
                        }`}
                      >
                        {serving ? 'In Chamber' : waiting.length > 0 ? 'Queue Active' : 'Chamber Free'}
                      </span>
                    </div>

                    {/* Active Serving Token Indicator */}
                    <div className="mt-4 p-3 bg-surface-warm rounded-2xl border border-brandBorder-subtle flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-brandText-muted uppercase">Now In Chamber</p>
                        <p className="font-mono font-extrabold text-xl text-forest-900 mt-0.5">
                          {serving ? `#${serving.tokenNumber}` : '--'}
                        </p>
                        <p className="text-xs font-bold text-forest-800 truncate max-w-[140px]">
                          {serving?.patientName || 'No patient inside'}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] font-bold text-brandText-muted uppercase">Next In Line</p>
                        <p className="font-mono font-extrabold text-xl text-amber-700 mt-0.5">
                          {next ? `#${next.tokenNumber}` : '--'}
                        </p>
                        <p className="text-xs font-semibold text-brandText-secondary truncate max-w-[120px]">
                          {next?.patientName || 'None'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Chamber Actions */}
                  <div className="pt-2 border-t border-brandBorder-subtle flex items-center justify-between gap-2">
                    <span className="text-xs text-brandText-secondary font-medium">
                      <strong>{waiting.length}</strong> waiting
                    </span>

                    <div className="flex items-center gap-1.5">
                      {serving && (
                        <button
                          type="button"
                          onClick={() => handleAnnounceToken(serving.tokenNumber, serving.patientName, doc.room, doc.name)}
                          className="p-1.5 text-forest-700 hover:bg-forest-50 rounded-lg text-xs"
                          title="Broadcast Chime"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedDoctorId(doc.id)}
                        className="px-2.5 py-1.5 bg-surface-warm hover:bg-forest-50 text-forest-900 font-bold text-xs rounded-xl border border-brandBorder-subtle transition-colors"
                      >
                        Manage
                      </button>

                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={Play}
                        onClick={() => handleCallNext(doc.id)}
                        className="text-xs py-1"
                      >
                        Call Next
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ================= IF A SPECIFIC DOCTOR IS PICKED ================= */
        <div className="space-y-6">
          {/* Highlight Cards for Selected Doctor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Currently Serving in Selected Doctor's Room */}
            <div className="bg-surface-pure rounded-3xl border-2 border-forest-600 shadow-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-forest-700 bg-forest-50 px-2.5 py-1 rounded-full border border-forest-100">
                    In Consultation &bull; {selectedDoctor?.room}
                  </span>
                  <span className="text-xs font-bold text-forest-900">{selectedDoctor?.name}</span>
                </div>

                {servingToken && (
                  <button
                    type="button"
                    onClick={() =>
                      handleAnnounceToken(
                        servingToken.tokenNumber,
                        servingToken.patientName,
                        selectedDoctor?.room,
                        selectedDoctor?.name
                      )
                    }
                    className="p-1.5 text-forest-700 hover:bg-forest-50 rounded-lg flex items-center gap-1 text-xs font-bold"
                    title="Audible Call Announcement"
                  >
                    <Volume2 className="w-4 h-4 text-forest-600" />
                    <span>Broadcast Chime</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                <span className="w-16 h-16 rounded-2xl bg-forest-800 text-white font-mono font-extrabold text-2xl flex items-center justify-center shadow-md">
                  {servingToken ? `#${servingToken.tokenNumber}` : '--'}
                </span>
                <div>
                  <h3 className="font-heading font-extrabold text-lg text-forest-900">
                    {servingToken?.patientName || 'No patient currently in chamber'}
                  </h3>
                  <p className="text-xs text-brandText-secondary mt-0.5">
                    {servingToken
                      ? `${servingToken.gender}, ${servingToken.age} yrs • ${servingToken.patientPhone}`
                      : 'Chamber is available. Click Call Next to summon.'}
                  </p>
                  {servingToken?.symptoms && (
                    <p className="text-[11px] text-forest-700 font-medium mt-1">
                      Symptoms: {servingToken.symptoms}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Up Next for Selected Doctor */}
            <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  Next in Lobby &bull; {selectedDoctor?.name}
                </span>
                <span className="text-xs text-brandText-secondary font-medium">
                  {waitingTokens.length} waiting in line
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-900 font-mono font-extrabold text-2xl flex items-center justify-center">
                  {nextToken ? `#${nextToken.tokenNumber}` : '--'}
                </span>
                <div>
                  <h3 className="font-heading font-extrabold text-lg text-forest-900">
                    {nextToken?.patientName || 'Queue is clear'}
                  </h3>
                  <p className="text-xs text-brandText-secondary mt-0.5">
                    {nextToken
                      ? `${nextToken.gender}, ${nextToken.age} yrs • Arrived ${nextToken.arrivedAt}`
                      : 'No upcoming scheduled or walk-in patients waiting'}
                  </p>
                  {nextToken && (
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 mt-1 uppercase">
                      Next to enter chamber
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Doctor-Filtered Token Manifest Table */}
      <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brandBorder-subtle pb-4">
          <div>
            <h3 className="font-heading font-bold text-base text-forest-900">
              {selectedDoctorId === 'ALL'
                ? 'Complete Clinic Token Manifest'
                : `Active Queue Manifest — ${selectedDoctor?.name}`}
            </h3>
            <p className="text-xs text-brandText-secondary">
              Real-time patient intake order, vitals transmission, and chamber status
            </p>
          </div>

          <div className="flex items-center gap-1 bg-surface-warm p-1 rounded-xl border border-brandBorder-subtle text-xs">
            {['ALL', 'SERVING', 'NEXT', 'WAITING', 'COMPLETED', 'SKIPPED'].map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                  filter === t
                    ? 'bg-forest-800 text-white shadow-sm'
                    : 'text-brandText-secondary hover:text-forest-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-brandBorder-subtle">
          {filteredTokens.length === 0 ? (
            <div className="py-10 text-center text-xs text-brandText-secondary">
              No patient tokens match current selection.
            </div>
          ) : (
            filteredTokens.map((token) => (
              <div
                key={token.tokenNumber}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-xs text-forest-800 bg-surface-warm px-2.5 py-1 rounded-xl border border-brandBorder-subtle">
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
                      {token.gender}, {token.age} yrs &bull; {token.patientPhone} &bull; Arrived:{' '}
                      {token.arrivedAt} &bull; {token.slot || 'Walk-in'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <StatusBadge status={token.status} />

                  <button
                    onClick={() =>
                      handleAnnounceToken(
                        token.tokenNumber,
                        token.patientName,
                        token.room,
                        token.doctorName
                      )
                    }
                    className="p-1.5 rounded-lg text-brandText-muted hover:text-forest-800 hover:bg-forest-50 transition-colors"
                    title="Broadcast Voice Call"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  {token.status === 'WAITING' && (
                    <button
                      onClick={() => skipToken(token.tokenNumber)}
                      className="p-1.5 rounded-lg text-brandText-muted hover:text-amber-800 hover:bg-amber-50 transition-colors"
                      title="Skip / Hold Token"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>
                  )}

                  {token.status === 'SKIPPED' && (
                    <button
                      onClick={() => recallToken(token.tokenNumber)}
                      className="p-1.5 rounded-lg text-brandText-muted hover:text-forest-800 hover:bg-forest-50 transition-colors"
                      title="Recall Token to Queue"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Issue Walk-in Token Modal */}
      {showQuickModal && (
        <div className="fixed inset-0 z-50 bg-forest-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-floating max-w-md w-full p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-brandBorder-subtle pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-base text-forest-900">
                    Quick Walk-in Token
                  </h3>
                  <p className="text-[11px] text-brandText-secondary">
                    Immediate queue slip generation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickModal(false)}
                className="p-1 rounded-lg text-brandText-muted hover:text-forest-900 hover:bg-surface-warm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-forest-800">Select Doctor Chamber</label>
                <select
                  required
                  value={quickForm.doctorId}
                  onChange={(e) => setQuickForm({ ...quickForm, doctorId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                >
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} — {doc.specialty} ({doc.room})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-forest-800">Patient Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra Sen"
                  value={quickForm.patientName}
                  onChange={(e) => setQuickForm({ ...quickForm, patientName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-forest-800">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98300..."
                    value={quickForm.patientPhone}
                    onChange={(e) => setQuickForm({ ...quickForm, patientPhone: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-forest-800">Age</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={120}
                    placeholder="45"
                    value={quickForm.age}
                    onChange={(e) => setQuickForm({ ...quickForm, age: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-forest-800">Chief Symptoms</label>
                <input
                  type="text"
                  placeholder="e.g. Mild fever, dry cough"
                  value={quickForm.symptoms}
                  onChange={(e) => setQuickForm({ ...quickForm, symptoms: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQuickModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  leftIcon={Plus}
                  className="text-xs font-bold"
                >
                  Generate Ticket
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistQueuePage;
