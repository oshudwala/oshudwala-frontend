import React, { useState } from 'react';
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
} from 'lucide-react';
import StatusBadge from '../../components/workspace/StatusBadge';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';

export const ReceptionistQueuePage = () => {
  const { tokens, callNextToken, skipToken, recallToken } = useWorkspaceStore();
  const { addToast } = useToast();

  const [isTvMode, setIsTvMode] = useState(false);
  const [filter, setFilter] = useState('ALL');

  const servingToken = tokens.find((t) => t.status === 'SERVING');
  const nextToken = tokens.find((t) => t.status === 'NEXT');
  const waitingTokens = tokens.filter((t) => t.status === 'WAITING');

  const filteredTokens = tokens.filter((t) => {
    if (filter === 'ALL') return true;
    return t.status === filter;
  });

  const handleCallNext = () => {
    callNextToken();
    addToast('Summoned next token to consultation room!', 'success');
  };

  const handleAnnounceToken = (tokenNum, patientName) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        `Token Number ${tokenNum}, ${patientName || ''}, please proceed to Room 204`
      );
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
    addToast(`Audible lobby broadcast for Token #${tokenNum}`, 'info');
  };

  // TV Display Fullscreen View for Lobby
  if (isTvMode) {
    return (
      <div className="fixed inset-0 z-50 bg-forest-950 text-white p-6 sm:p-10 flex flex-col justify-between">
        {/* Top Header of TV Display */}
        <div className="flex items-center justify-between border-b border-forest-800 pb-6">
          <div className="flex items-center gap-4">
            <img src="/logo-light.png" alt="Oshud Wala Logo" className="h-12 w-auto" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-white">
                Apollo Clinic, Salt Lake Kolkata
              </h1>
              <p className="text-xs sm:text-sm text-emerald-300 font-bold uppercase tracking-wider">
                Patient Token Calling System &bull; Live Queue
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsTvMode(false)}
            className="px-4 py-2 bg-forest-800 hover:bg-forest-700 rounded-2xl text-xs font-bold text-white flex items-center gap-2 transition-colors border border-forest-700"
          >
            <Minimize2 className="w-4 h-4" />
            <span>Exit Fullscreen TV Mode</span>
          </button>
        </div>

        {/* Giant Serving Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto">
          {/* Main Stage: Now Serving */}
          <div className="lg:col-span-8 bg-forest-900/90 rounded-3xl border-2 border-emerald-500/80 p-8 sm:p-12 text-center space-y-6 shadow-2xl">
            <p className="text-sm sm:text-base font-extrabold text-emerald-400 tracking-widest uppercase animate-pulse">
              ● NOW SERVING IN CONSULTATION ROOM 204
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
                Dr. Priya Sharma &bull; MBBS, MD (General Medicine)
              </p>
            </div>
          </div>

          {/* Up Next List */}
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

        {/* Footer Announcement */}
        <div className="border-t border-forest-800 pt-4 flex items-center justify-between text-xs text-forest-300">
          <span>Please watch the screen and listen for your token announcement.</span>
          <span>Emergency Assistance: Press 0 at Reception</span>
        </div>
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
            Synchronized with Doctor consulting room 204 and lobby display monitors.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsTvMode(true)}
            className="px-3.5 py-2 rounded-xl bg-forest-100 hover:bg-forest-200 text-forest-900 font-bold text-xs flex items-center gap-1.5 transition-colors border border-forest-200"
          >
            <Tv className="w-4 h-4 text-forest-700" />
            <span>Launch Lobby TV Display</span>
          </button>
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
      </div>

      {/* Serving Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Currently Serving Card */}
        <div className="bg-surface-pure rounded-3xl border-2 border-forest-600 shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-forest-700 bg-forest-50 px-2.5 py-1 rounded-full border border-forest-100">
              In Consultation Chamber
            </span>
            {servingToken && (
              <button
                type="button"
                onClick={() =>
                  handleAnnounceToken(servingToken.tokenNumber, servingToken.patientName)
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
                  : 'Call next token when ready'}
              </p>
            </div>
          </div>
        </div>

        {/* Up Next Card */}
        <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              Next in Lobby
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
                  : 'No patients waiting'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Complete Token Ledger */}
      <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brandBorder-subtle pb-4">
          <h3 className="font-heading font-bold text-base text-forest-900">
            Clinic Token Manifest
          </h3>

          <div className="flex items-center gap-1 bg-surface-warm p-1 rounded-xl border border-brandBorder-subtle text-xs">
            {['ALL', 'WAITING', 'COMPLETED', 'SKIPPED'].map((t) => (
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
          {filteredTokens.map((token) => (
            <div
              key={token.tokenNumber}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-xs text-forest-800 bg-surface-warm px-2.5 py-1 rounded-xl border border-brandBorder-subtle">
                  #{token.tokenNumber}
                </span>
                <div>
                  <p className="font-bold text-xs text-forest-900">{token.patientName}</p>
                  <p className="text-[11px] text-brandText-secondary">
                    {token.gender}, {token.age} yrs &bull; {token.patientPhone} &bull; Arrived:{' '}
                    {token.arrivedAt}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <StatusBadge status={token.status} />
                <button
                  onClick={() => handleAnnounceToken(token.tokenNumber, token.patientName)}
                  className="p-1.5 rounded-lg text-brandText-muted hover:text-forest-800 hover:bg-forest-50"
                  title="Broadcast Voice Call"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReceptionistQueuePage;
