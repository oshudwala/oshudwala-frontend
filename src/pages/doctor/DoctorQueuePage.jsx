import React, { useState } from 'react';
import {
  Clock,
  Play,
  SkipForward,
  RotateCcw,
  Plus,
  Trash2,
  FileCheck,
  CheckCircle,
  AlertCircle,
  Volume2,
  User,
  HeartPulse,
} from 'lucide-react';
import StatusBadge from '../../components/workspace/StatusBadge';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';

export const DoctorQueuePage = () => {
  const { tokens, callNextToken, skipToken, recallToken, completeConsultation } = useWorkspaceStore();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('ALL');
  const [rxMedicines, setRxMedicines] = useState([
    { name: 'Augmentin 625 Duo Tablet', dosage: '1 tablet twice daily after meals', duration: '5 days' },
    { name: 'Pan 40 Tablet', dosage: '1 tablet once daily before breakfast', duration: '7 days' },
  ]);
  const [clinicalAdvice, setClinicalAdvice] = useState('Drink plenty of warm fluids. Avoid cold food.');

  const servingToken = tokens.find((t) => t.status === 'SERVING');
  const nextToken = tokens.find((t) => t.status === 'NEXT');

  const filteredTokens = tokens.filter((t) => {
    if (activeTab === 'ALL') return true;
    return t.status === activeTab;
  });

  const handleCallNext = () => {
    callNextToken();
    addToast('Summoned next token to chamber!', 'success');
  };

  const handleSkip = () => {
    if (servingToken) {
      skipToken(servingToken.tokenNumber);
      addToast(`Token #${servingToken.tokenNumber} skipped / held.`, 'warning');
    }
  };

  const handleAddMedicine = () => {
    setRxMedicines([
      ...rxMedicines,
      { name: '', dosage: '1 tablet twice daily', duration: '5 days' },
    ]);
  };

  const handleRemoveMedicine = (idx) => {
    setRxMedicines(rxMedicines.filter((_, i) => i !== idx));
  };

  const handleCompleteConsult = (e) => {
    e.preventDefault();
    if (!servingToken) return;

    const prescriptionData = {
      medicines: rxMedicines.filter((m) => m.name.trim()),
      advice: clinicalAdvice,
      completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    completeConsultation(servingToken.tokenNumber, prescriptionData);
    addToast(`Consultation completed for Token #${servingToken.tokenNumber}!`, 'success');
    // Prompt next
    callNextToken();
  };

  const handleAnnounceToken = (tokenNum) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(`Token Number ${tokenNum}, please enter Room 204`);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
    addToast(`Audible chime broadcast for Token #${tokenNum}`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Page Header with Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-forest-900">
            Live Consultation Queue Desk
          </h1>
          <p className="text-xs text-brandText-secondary mt-0.5">
            Synchronized with Receptionist & patient lobby display screens at Apollo Clinic Salt Lake.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {servingToken && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={Volume2}
              onClick={() => handleAnnounceToken(servingToken.tokenNumber)}
              className="text-xs font-bold"
            >
              Announce Token
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            leftIcon={Play}
            onClick={handleCallNext}
            className="text-xs font-bold"
          >
            Call Next Patient
          </Button>
        </div>
      </div>

      {/* Main 2-Column Working Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Consultation Deck */}
        <div className="lg:col-span-2 space-y-6">
          {servingToken ? (
            <div className="bg-surface-pure rounded-3xl border-2 border-forest-600 shadow-card p-6 space-y-6">
              {/* Serving Token Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-forest-900 text-white rounded-2xl">
                <div className="flex items-center gap-3">
                  <span className="w-14 h-14 rounded-xl bg-forest-700 text-emerald-300 font-mono font-extrabold text-2xl flex items-center justify-center border border-forest-600">
                    #{servingToken.tokenNumber}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        In Chamber Now
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-forest-800 text-white font-semibold">
                        {servingToken.type}
                      </span>
                    </div>
                    <h2 className="text-xl font-heading font-bold mt-0.5">{servingToken.patientName}</h2>
                    <p className="text-xs text-forest-200">
                      {servingToken.gender}, {servingToken.age} yrs &bull; {servingToken.patientPhone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="px-3 py-1.5 rounded-xl bg-rose-900/60 hover:bg-rose-900 text-rose-200 hover:text-white border border-rose-800 text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    <span>Hold / Skip</span>
                  </button>
                </div>
              </div>

              {/* Vitals Readings */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-warm p-3.5 rounded-2xl border border-brandBorder-subtle text-xs">
                <div>
                  <p className="text-[10px] uppercase font-bold text-brandText-secondary">
                    Blood Pressure
                  </p>
                  <p className="font-bold text-sm text-forest-900 mt-0.5">
                    {servingToken.vitals.bp} mmHg
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-brandText-secondary">Pulse</p>
                  <p className="font-bold text-sm text-forest-900 mt-0.5">
                    {servingToken.vitals.pulse}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-brandText-secondary">
                    Temperature
                  </p>
                  <p className="font-bold text-sm text-forest-900 mt-0.5">
                    {servingToken.vitals.temp}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-brandText-secondary">Weight</p>
                  <p className="font-bold text-sm text-forest-900 mt-0.5">
                    {servingToken.vitals.weight}
                  </p>
                </div>
              </div>

              {/* Patient Complaint */}
              <div className="p-3.5 rounded-xl bg-forest-50/60 border border-forest-100 text-xs">
                <p className="font-bold text-forest-900">Chief Complaints:</p>
                <p className="text-brandText-main mt-0.5">{servingToken.symptoms}</p>
              </div>

              {/* Digital E-Prescription Form */}
              <form onSubmit={handleCompleteConsult} className="space-y-4 pt-2 border-t border-brandBorder-subtle">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-sm text-forest-900 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-forest-600" />
                    <span>Prescription & Treatment Plan</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddMedicine}
                    className="text-xs font-bold text-forest-700 hover:text-forest-900 flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Medicine</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {rxMedicines.map((med, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-brandBorder-subtle bg-surface-warm grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs"
                    >
                      <div className="sm:col-span-5">
                        <label className="text-[10px] font-bold text-forest-800">Medicine Name</label>
                        <input
                          type="text"
                          required
                          value={med.name}
                          onChange={(e) => {
                            const updated = [...rxMedicines];
                            updated[idx].name = e.target.value;
                            setRxMedicines(updated);
                          }}
                          placeholder="e.g. Dolo 650 Tablet"
                          className="w-full mt-0.5 px-2.5 py-1.5 bg-surface-pure border border-brandBorder-subtle rounded-lg text-xs"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="text-[10px] font-bold text-forest-800">Dosage / Frequency</label>
                        <input
                          type="text"
                          value={med.dosage}
                          onChange={(e) => {
                            const updated = [...rxMedicines];
                            updated[idx].dosage = e.target.value;
                            setRxMedicines(updated);
                          }}
                          className="w-full mt-0.5 px-2.5 py-1.5 bg-surface-pure border border-brandBorder-subtle rounded-lg text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-forest-800">Duration</label>
                        <input
                          type="text"
                          value={med.duration}
                          onChange={(e) => {
                            const updated = [...rxMedicines];
                            updated[idx].duration = e.target.value;
                            setRxMedicines(updated);
                          }}
                          className="w-full mt-0.5 px-2.5 py-1.5 bg-surface-pure border border-brandBorder-subtle rounded-lg text-xs"
                        />
                      </div>
                      <div className="sm:col-span-1 flex justify-end pt-3 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicine(idx)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-bold text-forest-800">Doctor's Clinical Advice</label>
                  <textarea
                    rows={2}
                    value={clinicalAdvice}
                    onChange={(e) => setClinicalAdvice(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-surface-warm border border-brandBorder-subtle rounded-xl text-xs focus:outline-none focus:border-forest-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    rightIcon={CheckCircle}
                    className="text-xs font-bold px-6 shadow-md"
                  >
                    Complete Consultation & Issue Rx
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle p-12 text-center space-y-4 shadow-card">
              <div className="w-16 h-16 rounded-full bg-forest-50 text-forest-700 flex items-center justify-center mx-auto">
                <HeartPulse className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-xl text-forest-900">
                  Ready for Next Patient
                </h3>
                <p className="text-xs text-brandText-secondary max-w-md mx-auto mt-1">
                  Chamber 204 is clear. Click Call Next to summon the waiting patient from Apollo Clinic lobby.
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
        </div>

        {/* Right 1 Col: Complete Queue List with Tab Filters */}
        <div className="space-y-4">
          <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-5 space-y-4">
            <h3 className="font-heading font-bold text-base text-forest-900">
              Today's Patient Queue
            </h3>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-surface-warm p-1 rounded-xl border border-brandBorder-subtle text-[11px] overflow-x-auto">
              {['ALL', 'WAITING', 'COMPLETED', 'SKIPPED'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors whitespace-nowrap ${
                    activeTab === tab
                      ? 'bg-forest-800 text-white shadow-sm'
                      : 'text-brandText-secondary hover:text-forest-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tokens Roster */}
            <div className="divide-y divide-brandBorder-subtle max-h-[500px] overflow-y-auto space-y-1">
              {filteredTokens.map((token) => (
                <div
                  key={token.tokenNumber}
                  className={`p-3 rounded-xl transition-all ${
                    token.status === 'SERVING'
                      ? 'bg-forest-50/80 border border-forest-200'
                      : 'hover:bg-forest-50/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <span className="font-mono font-extrabold text-xs text-forest-800 bg-surface-warm px-2 py-1 rounded-lg border border-brandBorder-subtle">
                        #{token.tokenNumber}
                      </span>
                      <div>
                        <p className="font-bold text-xs text-forest-900">{token.patientName}</p>
                        <p className="text-[11px] text-brandText-secondary">
                          {token.gender}, {token.age} yrs &bull; {token.slot}
                        </p>
                        <p className="text-[10px] text-brandText-muted mt-0.5 line-clamp-1">
                          {token.symptoms}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={token.status} />
                  </div>

                  {token.status === 'SKIPPED' && (
                    <div className="mt-2 pt-2 border-t border-brandBorder-subtle flex justify-end">
                      <button
                        onClick={() => {
                          recallToken(token.tokenNumber);
                          addToast(`Token #${token.tokenNumber} recalled to waiting queue!`, 'info');
                        }}
                        className="text-[10px] font-bold text-forest-700 hover:underline flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Recall to Queue</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorQueuePage;
