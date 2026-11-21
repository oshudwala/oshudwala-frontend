import React, { useState, useEffect } from 'react';
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
  Activity,
  FilePlus,
  X,
  Save,
  Droplet,
  Thermometer,
  Scale,
  Sparkles,
} from 'lucide-react';
import StatusBadge from '../../components/workspace/StatusBadge';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import doctorApi from '../../services/api/doctor.api';

export const DoctorQueuePage = () => {
  const { user } = useAuth();
  const { tokens, callNextToken, skipToken, recallToken, completeConsultation } = useWorkspaceStore();
  const { addToast } = useToast();

  const doctorName = user?.fullName || user?.name || 'Dr. Priya Sharma';
  const doctorId = user?.id || 'default';

  const [activeTab, setActiveTab] = useState('ALL');

  // Currently serving / selected token
  const servingToken = tokens.find((t) => t.status === 'SERVING');
  const nextToken = tokens.find((t) => t.status === 'NEXT');

  // Doctor entered clinical vitals for active patient (NOT pre-defined; fully editable)
  const [vitals, setVitals] = useState({
    bp: '',
    pulse: '',
    temp: '',
    weight: '',
    spO2: '',
    bloodGroup: 'O+',
  });

  const [clinicalData, setClinicalData] = useState({
    symptoms: '',
    diagnosis: '',
    chronicConditions: '',
    allergies: '',
  });

  const [rxMedicines, setRxMedicines] = useState([
    { name: '', dosage: '1 tablet twice daily after meals', duration: '5 days' },
  ]);
  const [clinicalAdvice, setClinicalAdvice] = useState('Drink plenty of warm fluids. Avoid cold food.');

  // Sync vitals & patient info whenever serving token changes
  useEffect(() => {
    if (servingToken) {
      setVitals({
        bp: servingToken.vitals?.bp || '',
        pulse: servingToken.vitals?.pulse ? String(servingToken.vitals.pulse).replace(/[^0-9]/g, '') : '',
        temp: servingToken.vitals?.temp ? String(servingToken.vitals.temp).replace(/[^0-9.]/g, '') : '',
        weight: servingToken.vitals?.weight ? String(servingToken.vitals.weight).replace(/[^0-9.]/g, '') : '',
        spO2: servingToken.vitals?.spO2 || '98',
        bloodGroup: servingToken.bloodGroup || 'O+',
      });
      setClinicalData({
        symptoms: servingToken.symptoms || '',
        diagnosis: servingToken.diagnosis || '',
        chronicConditions: servingToken.chronicConditions || '',
        allergies: servingToken.allergies || '',
      });
      if (servingToken.prescription?.medicines?.length > 0) {
        setRxMedicines(servingToken.prescription.medicines);
      } else {
        setRxMedicines([
          { name: '', dosage: '1 tablet twice daily after meals', duration: '5 days' },
        ]);
      }
      if (servingToken.prescription?.advice) {
        setClinicalAdvice(servingToken.prescription.advice);
      }
    }
  }, [servingToken?.tokenNumber]);

  // Modal State for Manual Patient Record Adding
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    name: '',
    phone: '',
    age: '',
    gender: 'Male',
    bloodGroup: 'O+',
    bp: '120/80',
    pulse: '74',
    temp: '98.4',
    weight: '68',
    spO2: '99',
    symptoms: '',
    diagnosis: '',
    chronicConditions: '',
    allergies: '',
    medicines: [{ name: '', dosage: '1 tab twice daily', duration: '5 days' }],
    advice: 'Follow up after 7 days.',
  });

  const filteredTokens = tokens.filter((t) => {
    if (activeTab === 'ALL') return true;
    return t.status === activeTab;
  });

  const handleCallNext = () => {
    callNextToken(doctorId);
    addToast('Summoned next token to chamber!', 'success');
  };

  const handleSkip = () => {
    if (servingToken) {
      skipToken(servingToken.tokenNumber);
      addToast(`Token #${servingToken.tokenNumber} skipped / placed on hold.`, 'warning');
    }
  };

  const handleAddMedicine = () => {
    setRxMedicines([
      ...rxMedicines,
      { name: '', dosage: '1 tablet twice daily after meals', duration: '5 days' },
    ]);
  };

  const handleRemoveMedicine = (idx) => {
    setRxMedicines(rxMedicines.filter((_, i) => i !== idx));
  };

  // Complete Consultation: saves vitals, blood group, diagnosis, and prescription to patient EHR
  const handleCompleteConsult = (e) => {
    e.preventDefault();
    if (!servingToken) return;

    const prescriptionData = {
      medicines: rxMedicines.filter((m) => m.name.trim()),
      advice: clinicalAdvice,
      completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // 1. Save directly into permanent Patient EHR records
    doctorApi.savePatientRecord({
      id: servingToken.patientId,
      name: servingToken.patientName,
      phone: servingToken.patientPhone,
      age: servingToken.age,
      gender: servingToken.gender,
      bloodGroup: vitals.bloodGroup,
      chronicConditions: clinicalData.chronicConditions,
      allergies: clinicalData.allergies,
      vitals: {
        bp: vitals.bp || '120/80',
        pulse: vitals.pulse || '74',
        temp: vitals.temp || '98.4',
        weight: vitals.weight || '68',
        spO2: vitals.spO2 || '99',
      },
      symptoms: clinicalData.symptoms,
      diagnosis: clinicalData.diagnosis,
      doctorName,
      clinicName: servingToken.clinicName || 'Apollo Clinic, Salt Lake Kolkata',
      prescription: prescriptionData,
    });

    // 2. Complete consultation in workspace queue store
    completeConsultation(servingToken.tokenNumber, {
      ...prescriptionData,
      vitals,
      diagnosis: clinicalData.diagnosis,
      bloodGroup: vitals.bloodGroup,
    });

    addToast(
      `Consultation completed! Vitals & records stored in ${servingToken.patientName}'s EHR file.`,
      'success'
    );

    // Call next patient
    callNextToken(doctorId);
  };

  // Handle Manual Patient Record Submission
  const handleSaveManualRecord = (e) => {
    e.preventDefault();
    if (!manualForm.name || !manualForm.phone) {
      addToast('Patient name and phone number are required.', 'error');
      return;
    }

    doctorApi.savePatientRecord({
      name: manualForm.name,
      phone: manualForm.phone,
      age: manualForm.age,
      gender: manualForm.gender,
      bloodGroup: manualForm.bloodGroup,
      chronicConditions: manualForm.chronicConditions,
      allergies: manualForm.allergies,
      vitals: {
        bp: manualForm.bp,
        pulse: manualForm.pulse,
        temp: manualForm.temp,
        weight: manualForm.weight,
        spO2: manualForm.spO2,
      },
      symptoms: manualForm.symptoms,
      diagnosis: manualForm.diagnosis,
      doctorName,
      prescription: {
        medicines: manualForm.medicines.filter((m) => m.name.trim()),
        advice: manualForm.advice,
      },
    });

    addToast(`Patient record for ${manualForm.name} saved to EHR database!`, 'success');
    setShowManualModal(false);
    setManualForm({
      name: '',
      phone: '',
      age: '',
      gender: 'Male',
      bloodGroup: 'O+',
      bp: '120/80',
      pulse: '74',
      temp: '98.4',
      weight: '68',
      spO2: '99',
      symptoms: '',
      diagnosis: '',
      chronicConditions: '',
      allergies: '',
      medicines: [{ name: '', dosage: '1 tab twice daily', duration: '5 days' }],
      advice: 'Follow up after 7 days.',
    });
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
            Record patient vitals, diagnosis, and issue verified e-prescriptions saved directly to patient records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={FilePlus}
            onClick={() => setShowManualModal(true)}
            className="text-xs font-bold border-forest-600 text-forest-800 hover:bg-forest-50"
          >
            Add Patient Record
          </Button>
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
            className="text-xs font-bold shadow-sm"
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
                        {servingToken.type || 'In-Clinic Consult'}
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

              {/* Consultation Vitals & Clinical Data Entry Form */}
              <form onSubmit={handleCompleteConsult} className="space-y-5">
                {/* Section 1: Doctor Input Vitals & Blood Group */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-forest-900 flex items-center gap-1.5">
                      <HeartPulse className="w-4 h-4 text-rose-600" />
                      <span>Record Patient Vitals & Blood Group</span>
                    </label>
                    <span className="text-[10px] font-semibold text-brandText-secondary">
                      Entered by Doctor &bull; Saved to Patient EHR
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 bg-surface-warm p-4 rounded-2xl border border-brandBorder-subtle text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-forest-800">BP (mmHg)</label>
                      <input
                        type="text"
                        value={vitals.bp}
                        onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                        placeholder="120/80"
                        className="w-full mt-1 px-2.5 py-1.5 bg-surface-pure border border-brandBorder-subtle rounded-xl text-xs font-semibold focus:outline-none focus:border-forest-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-forest-800">Pulse (bpm)</label>
                      <input
                        type="text"
                        value={vitals.pulse}
                        onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                        placeholder="72"
                        className="w-full mt-1 px-2.5 py-1.5 bg-surface-pure border border-brandBorder-subtle rounded-xl text-xs font-semibold focus:outline-none focus:border-forest-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-forest-800">Temp (°F)</label>
                      <input
                        type="text"
                        value={vitals.temp}
                        onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                        placeholder="98.6"
                        className="w-full mt-1 px-2.5 py-1.5 bg-surface-pure border border-brandBorder-subtle rounded-xl text-xs font-semibold focus:outline-none focus:border-forest-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-forest-800">Weight (kg)</label>
                      <input
                        type="text"
                        value={vitals.weight}
                        onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                        placeholder="68"
                        className="w-full mt-1 px-2.5 py-1.5 bg-surface-pure border border-brandBorder-subtle rounded-xl text-xs font-semibold focus:outline-none focus:border-forest-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-forest-800">SpO2 (%)</label>
                      <input
                        type="text"
                        value={vitals.spO2}
                        onChange={(e) => setVitals({ ...vitals, spO2: e.target.value })}
                        placeholder="98"
                        className="w-full mt-1 px-2.5 py-1.5 bg-surface-pure border border-brandBorder-subtle rounded-xl text-xs font-semibold focus:outline-none focus:border-forest-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-forest-800">Blood Group</label>
                      <select
                        value={vitals.bloodGroup}
                        onChange={(e) => setVitals({ ...vitals, bloodGroup: e.target.value })}
                        className="w-full mt-1 px-2 py-1.5 bg-surface-pure border border-brandBorder-subtle rounded-xl text-xs font-bold text-rose-700 focus:outline-none focus:border-forest-500"
                      >
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Clinical Assessment & Symptoms */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-forest-800">Chief Complaints & Symptoms</label>
                    <textarea
                      rows={2}
                      value={clinicalData.symptoms}
                      onChange={(e) => setClinicalData({ ...clinicalData, symptoms: e.target.value })}
                      placeholder="e.g. Headache since 3 days, sore throat..."
                      className="w-full mt-1 p-2.5 bg-surface-warm border border-brandBorder-subtle rounded-xl text-xs focus:outline-none focus:border-forest-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-forest-800">Clinical Diagnosis</label>
                    <textarea
                      rows={2}
                      value={clinicalData.diagnosis}
                      onChange={(e) => setClinicalData({ ...clinicalData, diagnosis: e.target.value })}
                      placeholder="e.g. Acute Pharyngitis, Stage 1 HTN..."
                      className="w-full mt-1 p-2.5 bg-surface-warm border border-brandBorder-subtle rounded-xl text-xs focus:outline-none focus:border-forest-500 font-medium"
                    />
                  </div>
                </div>

                {/* Section 3: Digital E-Prescription Form */}
                <div className="space-y-3 pt-3 border-t border-brandBorder-subtle">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-bold text-sm text-forest-900 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-forest-600" />
                      <span>Prescribed Medicines</span>
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

                  <div className="space-y-2.5">
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
                            placeholder="e.g. Augmentin 625 Duo, Pan 40"
                            className="w-full mt-0.5 px-2.5 py-1.5 bg-surface-pure border border-brandBorder-subtle rounded-lg text-xs font-semibold"
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <label className="text-[10px] font-bold text-forest-800">Dosage / Instructions</label>
                          <input
                            type="text"
                            value={med.dosage}
                            onChange={(e) => {
                              const updated = [...rxMedicines];
                              updated[idx].dosage = e.target.value;
                              setRxMedicines(updated);
                            }}
                            placeholder="1 tab twice daily after meals"
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
                            placeholder="5 days"
                            className="w-full mt-0.5 px-2.5 py-1.5 bg-surface-pure border border-brandBorder-subtle rounded-lg text-xs"
                          />
                        </div>
                        <div className="sm:col-span-1 flex justify-end pt-2 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicine(idx)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remove"
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
                      placeholder="Special instructions, dietary restrictions, follow-up..."
                      className="w-full mt-1 p-2.5 bg-surface-warm border border-brandBorder-subtle rounded-xl text-xs focus:outline-none focus:border-forest-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-brandBorder-subtle">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    rightIcon={CheckCircle}
                    className="text-xs font-bold px-6 shadow-md"
                  >
                    Complete Consultation & Store EHR
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
                  Chamber is clear. Click Call Next to summon the waiting patient from the clinic lobby queue.
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
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-base text-forest-900">
                Today's Patient Queue
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-100 text-forest-800">
                {tokens.length} Total
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-surface-warm p-1 rounded-xl border border-brandBorder-subtle text-[11px] overflow-x-auto">
              {['ALL', 'WAITING', 'COMPLETED', 'SKIPPED'].map((tab) => (
                <button
                  key={tab}
                  type="button"
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
              {filteredTokens.length === 0 ? (
                <p className="text-xs text-brandText-secondary py-6 text-center">
                  No tokens in this filter.
                </p>
              ) : (
                filteredTokens.map((token) => (
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
                          type="button"
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
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= MANUAL PATIENT RECORD ADDING MODAL ================= */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-forest-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-floating max-w-2xl w-full p-6 space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-brandBorder-subtle pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-forest-100 text-forest-800">
                  <FilePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-lg text-forest-900">
                    Manual Patient Record Entry
                  </h3>
                  <p className="text-xs text-brandText-secondary">
                    Log walk-in clinical vitals and treatment records directly into EHR.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="p-1 rounded-xl text-brandText-muted hover:text-forest-900 hover:bg-surface-warm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualRecord} className="space-y-4 text-xs">
              {/* Patient Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-bold text-forest-800">Patient Full Name *</label>
                  <input
                    type="text"
                    required
                    value={manualForm.name}
                    onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                    placeholder="e.g. Anirban Sengupta"
                    className="w-full mt-1 px-3 py-2 bg-surface-warm border border-brandBorder-subtle rounded-xl font-medium focus:outline-none focus:border-forest-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-forest-800">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    value={manualForm.phone}
                    onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                    placeholder="+91 98300 00000"
                    className="w-full mt-1 px-3 py-2 bg-surface-warm border border-brandBorder-subtle rounded-xl font-medium focus:outline-none focus:border-forest-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-forest-800">Age</label>
                  <input
                    type="number"
                    value={manualForm.age}
                    onChange={(e) => setManualForm({ ...manualForm, age: e.target.value })}
                    placeholder="42"
                    className="w-full mt-1 px-3 py-2 bg-surface-warm border border-brandBorder-subtle rounded-xl font-medium focus:outline-none focus:border-forest-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-forest-800">Gender</label>
                  <select
                    value={manualForm.gender}
                    onChange={(e) => setManualForm({ ...manualForm, gender: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-surface-warm border border-brandBorder-subtle rounded-xl font-medium focus:outline-none focus:border-forest-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-forest-800">Blood Group</label>
                  <select
                    value={manualForm.bloodGroup}
                    onChange={(e) => setManualForm({ ...manualForm, bloodGroup: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-surface-warm border border-brandBorder-subtle rounded-xl font-bold text-rose-700 focus:outline-none focus:border-forest-500"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              {/* Vitals */}
              <div className="p-3 bg-forest-50/70 rounded-2xl border border-forest-100 space-y-2">
                <p className="font-bold text-forest-900">Recorded Vitals</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-forest-800">BP</label>
                    <input
                      type="text"
                      value={manualForm.bp}
                      onChange={(e) => setManualForm({ ...manualForm, bp: e.target.value })}
                      placeholder="120/80"
                      className="w-full mt-0.5 px-2.5 py-1.5 bg-surface-pure border border-brandBorder-subtle rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-forest-800">Pulse</label>
                    <input
                      type="text"
                      value={manualForm.pulse}
                      onChange={(e) => setManualForm({ ...manualForm, pulse: e.target.value })}
                      placeholder="72"
                      className="w-full mt-0.5 px-2.5 py-1.5 bg-surface-pure border border-brandBorder-subtle rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-forest-800">Temp (°F)</label>
                    <input
                      type="text"
                      value={manualForm.temp}
                      onChange={(e) => setManualForm({ ...manualForm, temp: e.target.value })}
                      placeholder="98.4"
                      className="w-full mt-0.5 px-2.5 py-1.5 bg-surface-pure border border-brandBorder-subtle rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-forest-800">Weight (kg)</label>
                    <input
                      type="text"
                      value={manualForm.weight}
                      onChange={(e) => setManualForm({ ...manualForm, weight: e.target.value })}
                      placeholder="68"
                      className="w-full mt-0.5 px-2.5 py-1.5 bg-surface-pure border border-brandBorder-subtle rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-forest-800">SpO2 (%)</label>
                    <input
                      type="text"
                      value={manualForm.spO2}
                      onChange={(e) => setManualForm({ ...manualForm, spO2: e.target.value })}
                      placeholder="98"
                      className="w-full mt-0.5 px-2.5 py-1.5 bg-surface-pure border border-brandBorder-subtle rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Assessment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-forest-800">Symptoms & Complaints</label>
                  <textarea
                    rows={2}
                    value={manualForm.symptoms}
                    onChange={(e) => setManualForm({ ...manualForm, symptoms: e.target.value })}
                    placeholder="Reported symptoms"
                    className="w-full mt-1 p-2 bg-surface-warm border border-brandBorder-subtle rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-forest-800">Clinical Diagnosis</label>
                  <textarea
                    rows={2}
                    value={manualForm.diagnosis}
                    onChange={(e) => setManualForm({ ...manualForm, diagnosis: e.target.value })}
                    placeholder="Clinical diagnosis"
                    className="w-full mt-1 p-2 bg-surface-warm border border-brandBorder-subtle rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Prescription */}
              <div>
                <label className="font-bold text-forest-800">Prescription Medicines</label>
                <input
                  type="text"
                  value={manualForm.medicines[0]?.name || ''}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      medicines: [{ name: e.target.value, dosage: '1 tab twice daily', duration: '5 days' }],
                    })
                  }
                  placeholder="e.g. Paracetamol 650mg, Azithromycin 500mg"
                  className="w-full mt-1 px-3 py-2 bg-surface-warm border border-brandBorder-subtle rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-forest-800">Doctor's Advice</label>
                <input
                  type="text"
                  value={manualForm.advice}
                  onChange={(e) => setManualForm({ ...manualForm, advice: e.target.value })}
                  placeholder="Clinical advice"
                  className="w-full mt-1 px-3 py-2 bg-surface-warm border border-brandBorder-subtle rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-brandBorder-subtle">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowManualModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  leftIcon={Save}
                  className="font-bold shadow-md"
                >
                  Save Record to EHR
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorQueuePage;
