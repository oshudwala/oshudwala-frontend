import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Mic, X, AlertCircle } from 'lucide-react';

const TEXT = {
  en: {
    listening: 'Listening…',
    speakNow: 'Speak now — ask for medicine, doctor, or symptom',
    tapToStop: 'Tap the mic when you’re done',
    tapToRetry: 'Tap the mic to try again',
    nospeech: 'Didn’t catch that. Please speak again.',
    denied: 'Microphone access is blocked. Allow it in your browser settings.',
    nomic: 'No microphone found on this device.',
    network: 'Network error. Check your connection and try again.',
    unsupported: 'Voice search isn’t supported in this browser. Try Chrome or Edge.',
    close: 'Close',
  },
  bn: {
    listening: 'শুনছি…',
    speakNow: 'এখন বলুন — ওষুধ, ডাক্তার বা লক্ষণ বলুন',
    tapToStop: 'বলা শেষ হলে মাইকে ট্যাপ করুন',
    tapToRetry: 'আবার চেষ্টা করতে মাইকে ট্যাপ করুন',
    nospeech: 'কিছু শুনতে পাইনি। অনুগ্রহ করে আবার বলুন।',
    denied: 'মাইক্রোফোনের অনুমতি বন্ধ আছে। ব্রাউজার সেটিংসে অনুমতি দিন।',
    nomic: 'এই ডিভাইসে কোনো মাইক্রোফোন পাওয়া যায়নি।',
    network: 'নেটওয়ার্ক সমস্যা। ইন্টারনেট চেক করে আবার চেষ্টা করুন।',
    unsupported: 'এই ব্রাউজারে ভয়েস সার্চ চলে না। Chrome ব্যবহার করুন।',
    close: 'বন্ধ করুন',
  },
  hi: {
    listening: 'सुन रहा हूँ…',
    speakNow: 'अब बोलिए — दवा या डॉक्टर का नाम बताइए',
    tapToStop: 'बोलना खत्म होने पर माइक दबाएँ',
    tapToRetry: 'दोबारा कोशिश के लिए माइक दबाएँ',
    nospeech: 'कुछ सुनाई नहीं दिया। फिर से बोलिए।',
    denied: 'माइक्रोफ़ोन की अनुमति बंद है। ब्राउज़र सेटिंग में अनुमति दें।',
    nomic: 'इस डिवाइस में माइक्रोफ़ोन नहीं मिला।',
    network: 'नेटवर्क त्रुटि। कनेक्शन जाँचकर फिर कोशिश करें।',
    unsupported: 'इस ब्राउज़र में वॉइस सर्च नहीं चलता। Chrome इस्तेमाल करें।',
    close: 'बंद करें',
  },
};

const LANG_CODE = {
  en: 'en-IN',
  bn: 'bn-IN',
  hi: 'hi-IN',
};

// Oshud Wala Brand Colors
const BRAND_PRIMARY = '#075C40';
const BRAND_EMERALD = '#10B981';
const BRAND_MINT = '#34D399';
const BAR_COLORS = [BRAND_PRIMARY, BRAND_EMERALD, BRAND_MINT, BRAND_EMERALD, BRAND_PRIMARY];

export default function VoiceSearchOverlay({ open, onClose, onResult, locale = 'en' }) {
  const loc = locale === 'bn' || locale === 'hi' ? locale : 'en';
  const t = TEXT[loc] || TEXT.en;

  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'listening' | 'done' | 'nospeech' | 'denied' | 'nomic' | 'network' | 'unsupported'
  const [transcript, setTranscript] = useState('');

  const recRef = useRef(null);
  const sessionRef = useRef(0);
  const lastTextRef = useRef('');
  const errorRef = useRef('');
  const timerRef = useRef(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => setMounted(true), []);

  const stopRecognition = useCallback(() => {
    sessionRef.current += 1;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    try {
      recRef.current?.abort();
    } catch {}
    recRef.current = null;
  }, []);

  const start = useCallback(() => {
    if (typeof window === 'undefined') return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SR) {
      setStatus('unsupported');
      return;
    }

    stopRecognition();
    const session = sessionRef.current;

    lastTextRef.current = '';
    errorRef.current = '';
    setTranscript('');
    setStatus('listening');

    const rec = new SR();
    rec.lang = LANG_CODE[loc] || 'en-IN';
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      if (session !== sessionRef.current) return;
      let finalText = '';
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      const full = `${finalText} ${interim}`.trim();
      lastTextRef.current = full;
      setTranscript(full);
    };

    rec.onerror = (event) => {
      if (session !== sessionRef.current) return;
      errorRef.current = event?.error || '';
    };

    rec.onend = () => {
      if (session !== sessionRef.current) return;
      recRef.current = null;

      const text = lastTextRef.current.trim();
      const err = errorRef.current;

      if (err === 'not-allowed' || err === 'service-not-allowed') {
        setStatus('denied');
      } else if (err === 'audio-capture') {
        setStatus('nomic');
      } else if (err === 'network') {
        setStatus('network');
      } else if (text) {
        setStatus('done');
        timerRef.current = setTimeout(() => {
          if (session === sessionRef.current) {
            onResultRef.current(text);
          }
        }, 450);
      } else {
        setStatus('nospeech');
      }
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch {
      setStatus('nospeech');
    }
  }, [loc, stopRecognition]);

  // Start when opened, clean up when closed
  useEffect(() => {
    if (open) {
      start();
    } else {
      stopRecognition();
      setStatus('idle');
      setTranscript('');
    }
    return () => stopRecognition();
  }, [open, start, stopRecognition]);

  // Esc key to close + scroll lock
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const onMicClick = () => {
    if (status === 'listening') {
      try {
        recRef.current?.stop();
      } catch {}
    } else if (status !== 'done') {
      start();
    }
  };

  if (!open || !mounted) return null;

  const isListening = status === 'listening';
  const isError =
    status === 'nospeech' ||
    status === 'denied' ||
    status === 'nomic' ||
    status === 'network' ||
    status === 'unsupported';

  const heading = isListening
    ? transcript
      ? ''
      : t.listening
    : status === 'done'
    ? ''
    : t[status] ?? '';

  const hint = isListening
    ? transcript
      ? t.tapToStop
      : t.speakNow
    : isError && status !== 'unsupported'
    ? t.tapToRetry
    : '';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Voice search"
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4"
    >
      <style>{`
        @keyframes vs-bounce {
          0%, 100% { height: 8px; }
          50% { height: 32px; }
        }
        @keyframes vs-ring {
          0% { transform: scale(1); opacity: .6; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        @keyframes vs-sheet {
          from { transform: translateY(32px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .vs-anim { animation: none !important; }
        }
      `}</style>

      {/* Dim backdrop */}
      <button
        type="button"
        aria-label={t.close}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-forest-950/60 backdrop-blur-sm transition-opacity"
      />

      {/* Card */}
      <div
        className="vs-anim relative w-full overflow-hidden rounded-t-3xl border border-brandBorder-subtle bg-surface-pure shadow-floating sm:max-w-md sm:rounded-3xl"
        style={{ animation: 'vs-sheet .28s ease-out' }}
      >
        {/* Brand accent gradient line */}
        <div
          className="h-1.5 w-full"
          style={{ background: `linear-gradient(90deg, ${BRAND_PRIMARY}, ${BRAND_EMERALD}, ${BRAND_MINT})` }}
        />

        {/* Header: Logo + Close */}
        <div className="flex items-center justify-between px-5 pt-4">
          <div className="flex items-center gap-2">
            <img
              src="/logo-light.png"
              alt="Oshud Wala"
              className="h-7 w-auto object-contain"
            />
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 tracking-wider">
              Voice Search
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="flex h-9 w-9 items-center justify-center rounded-full text-brandText-secondary transition hover:bg-forest-50 hover:text-forest-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col items-center px-6 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-4 text-center">
          {/* Logo / Mic with pulsing wave rings */}
          <div className="relative flex h-24 w-24 items-center justify-center">
            {isListening && (
              <>
                <span
                  className="vs-anim absolute inset-0 rounded-full"
                  style={{ backgroundColor: BRAND_PRIMARY, animation: 'vs-ring 1.8s ease-out infinite' }}
                />
                <span
                  className="vs-anim absolute inset-0 rounded-full"
                  style={{ backgroundColor: BRAND_EMERALD, animation: 'vs-ring 1.8s ease-out .9s infinite' }}
                />
              </>
            )}
            <div className="relative z-10 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-forest-200 bg-white p-3 shadow-lg">
              <img
                src="/emblem.png"
                alt="Oshud Wala"
                className="h-full w-full object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/logo-light.png';
                }}
              />
            </div>
          </div>

          {/* Status / Live Transcript */}
          <div className="mt-5 flex min-h-[64px] max-h-32 w-full items-center justify-center overflow-y-auto px-2" aria-live="polite">
            {transcript ? (
              <p className="text-xl font-heading font-extrabold leading-snug text-forest-900 sm:text-2xl">
                &ldquo;{transcript}&rdquo;
              </p>
            ) : (
              <p
                className={`text-base font-bold sm:text-lg ${
                  isError ? 'text-rose-700' : 'text-forest-700'
                }`}
              >
                {heading}
              </p>
            )}
          </div>

          {/* Brand frequency audio bars */}
          <div className="mt-2 flex h-9 items-center justify-center gap-1.5" aria-hidden="true">
            {BAR_COLORS.map((color, i) => (
              <span
                key={i}
                className="vs-anim w-1.5 rounded-full"
                style={{
                  backgroundColor: color,
                  height: 8,
                  animation: isListening
                    ? `vs-bounce 1s ease-in-out ${i * 0.14}s infinite`
                    : 'none',
                }}
              />
            ))}
          </div>

          {/* Mic Button */}
          <button
            type="button"
            onClick={onMicClick}
            disabled={status === 'done'}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
            className="mt-4 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-card transition-all active:scale-95 disabled:opacity-60 hover:scale-105"
            style={{ backgroundColor: isListening ? BRAND_EMERALD : BRAND_PRIMARY }}
          >
            <Mic className="h-6 w-6" />
          </button>

          <p className="mt-2.5 min-h-[20px] text-xs font-semibold text-brandText-secondary">
            {hint}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
