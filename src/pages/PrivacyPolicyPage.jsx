import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  FileText,
  UserCheck,
  Server,
  Eye,
  Mail,
  MapPin,
  Phone,
  ArrowLeft,
  Printer,
  ChevronRight,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import Button from '../components/common/Button';

export const PrivacyPolicyPage = () => {
  const [activeSection, setActiveSection] = useState('intro');

  const scrollTo = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const sections = [
    { id: 'intro', title: '1. Introduction & Overview' },
    { id: 'collection', title: '2. Information We Collect' },
    { id: 'usage', title: '3. How We Use Healthcare Data' },
    { id: 'prescriptions', title: '4. Prescription Confidentiality' },
    { id: 'location', title: '5. Location & Delivery Security' },
    { id: 'sharing', title: '6. Authorized Data Sharing' },
    { id: 'storage', title: '7. Data Security & Storage' },
    { id: 'rights', title: '8. Patient Rights & Control' },
    { id: 'cookies', title: '9. Cookies & Tracking' },
    { id: 'grievance', title: '10. Grievance Redressal' },
  ];

  return (
    <div className="min-h-screen bg-surface-canvas py-10 sm:py-14 animate-fade-in">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb & Back button */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-brandText-secondary">
            <Link to="/" className="hover:text-forest-700 flex items-center gap-1 font-semibold">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-forest-900 font-bold">Privacy Policy</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-brandText-muted flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-forest-600" />
              <span>Last Updated: November 2026</span>
            </span>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl border border-brandBorder-subtle bg-surface-pure hover:bg-forest-50 text-forest-800 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-forest-600" />
              <span>Print Policy</span>
            </button>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-forest-900 via-forest-800 to-forest-900 text-white rounded-3xl p-8 sm:p-10 shadow-card relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
              <ShieldCheck className="w-4 h-4" />
              <span>Healthcare Data Protection Standards</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-heading font-extrabold tracking-tight">
              Oshud Wala Privacy Policy
            </h1>
            <p className="text-xs sm:text-sm text-forest-100/90 leading-relaxed">
              We hold patient health records, diagnostic prescriptions, and personal consultations to the highest standards of medical confidentiality and regulatory compliance.
            </p>
          </div>

          {/* Decorative medical cross backdrop */}
          <div className="absolute right-6 -bottom-10 opacity-10 pointer-events-none hidden md:block">
            <svg width="220" height="220" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z"/>
            </svg>
          </div>
        </div>

        {/* Main Content Grid: Sticky Sidebar + Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Sticky Table of Contents */}
          <div className="lg:col-span-4 sticky top-6 hidden lg:block">
            <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-card space-y-3">
              <h2 className="font-heading font-bold text-sm text-forest-900 uppercase tracking-wider">
                Contents Navigation
              </h2>
              <nav className="space-y-1">
                {sections.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollTo(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                      activeSection === item.id
                        ? 'bg-forest-50 text-forest-900 border-l-4 border-forest-600 font-bold'
                        : 'text-brandText-secondary hover:text-forest-900 hover:bg-surface-warm'
                    }`}
                  >
                    <span>{item.title}</span>
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                  </button>
                ))}
              </nav>

              <div className="pt-4 border-t border-brandBorder-subtle text-xs text-brandText-muted">
                <p>Need legal or privacy clarification?</p>
                <a
                  href="mailto:privacy@oshudwala.in"
                  className="text-forest-700 font-bold hover:underline block mt-0.5"
                >
                  privacy@oshudwala.in
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Full Legal Sections */}
          <div className="lg:col-span-8 bg-surface-pure rounded-3xl p-6 sm:p-10 border border-brandBorder-subtle shadow-card space-y-8 text-forest-950 text-xs sm:text-sm leading-relaxed">
            {/* Section 1 */}
            <section id="intro" className="space-y-3 border-b border-brandBorder-subtle pb-6 scroll-mt-20">
              <h2 className="font-heading font-bold text-lg text-forest-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-forest-700" />
                <span>1. Introduction & Overview</span>
              </h2>
              <p>
                Welcome to <strong>Oshud Wala</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), operated by <strong>Oshud Wala Health Technologies Pvt. Ltd.</strong>, headquartered in Kolkata, West Bengal, India. Oshud Wala operates an express healthcare marketplace and queue management platform connecting patients with licensed retail pharmacies, registered medical practitioners, diagnostic services, and verified couriers.
              </p>
              <p>
                This Privacy Policy describes how we collect, store, process, and safeguard your Personal Identification Information (PII) and Sensitive Personal Data or Information (SPDI) in compliance with the <strong>Digital Personal Data Protection Act, 2023 (DPDPA)</strong>, the <strong>Information Technology Act, 2000</strong>, the <strong>Drugs and Cosmetics Act, 1940</strong>, and applicable Telemedicine Practice Guidelines.
              </p>
            </section>

            {/* Section 2 */}
            <section id="collection" className="space-y-3 border-b border-brandBorder-subtle pb-6 scroll-mt-20">
              <h2 className="font-heading font-bold text-lg text-forest-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-forest-700" />
                <span>2. Information We Collect</span>
              </h2>
              <p>To provide safe, accurate, and prompt healthcare delivery, we collect the following categories of data:</p>
              <ul className="list-disc pl-5 space-y-2 text-brandText-secondary">
                <li>
                  <strong className="text-forest-900">Personal Identity & Contact:</strong> Full name, verified mobile phone number (for OTP verification and delivery SMS), email address, gender, date of birth, and complete residential delivery address including landmark and pincode.
                </li>
                <li>
                  <strong className="text-forest-900">Health & Prescription Records:</strong> Scanned images or digital copies of registered medical prescriptions uploaded for dispensing, doctor names, prescribed medications, dosage schedules, and health notes entered by consulting doctors during appointments.
                </li>
                <li>
                  <strong className="text-forest-900">Doctor & Clinic Consultation Details:</strong> Appointment booking history, selected consultation slots, symptoms recorded for triage, clinic queue tokens, and digital vital records (e.g. Blood Pressure, Pulse, Blood Group) entered directly by healthcare practitioners.
                </li>
                <li>
                  <strong className="text-forest-900">Logistics & Transactional Data:</strong> Real-time geolocation coordinates for routing express medicine couriers, order IDs, delivery time logs, payment transaction identifiers, and Cash on Delivery (COD) collection status.
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="usage" className="space-y-3 border-b border-brandBorder-subtle pb-6 scroll-mt-20">
              <h2 className="font-heading font-bold text-lg text-forest-900 flex items-center gap-2">
                <Server className="w-5 h-5 text-forest-700" />
                <span>3. How We Process Healthcare Data</span>
              </h2>
              <p>Your data is processed strictly for legitimate healthcare and order fulfillment purposes, specifically:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-surface-warm rounded-2xl border border-brandBorder-subtle">
                  <h4 className="font-bold text-forest-900 mb-1">Prescription Verification</h4>
                  <p className="text-xs text-brandText-secondary">Transmitting prescriptions securely to registered licensed pharmacists to verify Schedule H/H1 drugs before dispensing.</p>
                </div>
                <div className="p-3 bg-surface-warm rounded-2xl border border-brandBorder-subtle">
                  <h4 className="font-bold text-forest-900 mb-1">Clinic Queue Tracking</h4>
                  <p className="text-xs text-brandText-secondary">Generating live clinic queue tokens so patients can monitor doctor wait-times without physical overcrowding.</p>
                </div>
                <div className="p-3 bg-surface-warm rounded-2xl border border-brandBorder-subtle">
                  <h4 className="font-bold text-forest-900 mb-1">Tamper-Proof Delivery</h4>
                  <p className="text-xs text-brandText-secondary">Routing medicine packages via couriers using encrypted sealed bag QR verification and 4-digit patient OTP verification.</p>
                </div>
                <div className="p-3 bg-surface-warm rounded-2xl border border-brandBorder-subtle">
                  <h4 className="font-bold text-forest-900 mb-1">Refills & Reminders</h4>
                  <p className="text-xs text-brandText-secondary">Providing opt-in notifications for chronic medication refills and scheduled consultation updates.</p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="prescriptions" className="space-y-3 border-b border-brandBorder-subtle pb-6 scroll-mt-20">
              <h2 className="font-heading font-bold text-lg text-forest-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-forest-700" />
                <span>4. Prescription Confidentiality & Zero Data-Selling Policy</span>
              </h2>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                <p className="font-bold text-emerald-950 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Strict Non-Commercialization Guarantee</span>
                </p>
                <p className="text-xs text-emerald-900">
                  Oshud Wala strictly prohibits the sale, rental, monetization, or commercial sharing of patient prescriptions, diagnoses, or medication lists with third-party pharmaceutical marketers, advertisers, or data brokers under any circumstances.
                </p>
              </div>
              <p>
                Prescription files are viewable only by:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-brandText-secondary">
                <li>The patient who uploaded the document.</li>
                <li>The Registered Pharmacist assigned to dispense the order.</li>
                <li>The Registered Medical Practitioner conducting an authorized consultation.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="location" className="space-y-3 border-b border-brandBorder-subtle pb-6 scroll-mt-20">
              <h2 className="font-heading font-bold text-lg text-forest-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-forest-700" />
                <span>5. Location & Delivery Security</span>
              </h2>
              <p>
                When you place a medicine order or request express courier delivery, we collect location data to calculate optimal delivery routes and accurately dispatch our fleet.
              </p>
              <p>
                To protect your privacy during handover:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-brandText-secondary">
                <li>Riders are provided with your destination address and landmark only during an active delivery trip.</li>
                <li>Riders do not have access to your diagnostic history or clinical consultation details.</li>
                <li>Medicine packages are delivered in tamper-evident sealed pouches verified by a <strong>4-digit secret OTP</strong> provided only to the patient.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section id="sharing" className="space-y-3 border-b border-brandBorder-subtle pb-6 scroll-mt-20">
              <h2 className="font-heading font-bold text-lg text-forest-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-forest-700" />
                <span>6. Authorized Data Sharing</span>
              </h2>
              <p>We do not share your health information except as strictly necessary to execute your requests:</p>
              <ul className="list-disc pl-5 space-y-2 text-brandText-secondary">
                <li>
                  <strong className="text-forest-900">Licensed Partner Pharmacies:</strong> Name, delivery address, and prescription items to enable legally compliant medication dispensing and GST invoicing.
                </li>
                <li>
                  <strong className="text-forest-900">Registered Doctors & Clinics:</strong> Patient name, age, gender, and consultation records when you book an appointment.
                </li>
                <li>
                  <strong className="text-forest-900">Payment Gateways:</strong> Encrypted transaction values transferred via PCI-DSS compliant payment gateways (UPI, Credit/Debit cards). We do not store raw CVV or banking passwords.
                </li>
                <li>
                  <strong className="text-forest-900">Legal & Regulatory Mandates:</strong> Disclosure to government or regulatory bodies (such as Drug Control authorities or law enforcement) only when legally required by judicial court order.
                </li>
              </ul>
            </section>

            {/* Section 7 */}
            <section id="storage" className="space-y-3 border-b border-brandBorder-subtle pb-6 scroll-mt-20">
              <h2 className="font-heading font-bold text-lg text-forest-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-forest-700" />
                <span>7. Data Security & Storage Architecture</span>
              </h2>
              <p>
                We implement industry-grade technical and organizational safeguards to ensure data integrity:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 bg-surface-warm rounded-xl border border-brandBorder-subtle text-center">
                  <p className="font-bold text-forest-900">TLS 1.3 Encryption</p>
                  <p className="text-[11px] text-brandText-muted mt-0.5">All data in transit encrypted over HTTPS</p>
                </div>
                <div className="p-3 bg-surface-warm rounded-xl border border-brandBorder-subtle text-center">
                  <p className="font-bold text-forest-900">AES-256 Storage</p>
                  <p className="text-[11px] text-brandText-muted mt-0.5">Prescriptions encrypted at rest</p>
                </div>
                <div className="p-3 bg-surface-warm rounded-xl border border-brandBorder-subtle text-center">
                  <p className="font-bold text-forest-900">Role-Based Access</p>
                  <p className="text-[11px] text-brandText-muted mt-0.5">Strict role separation for pharmacists & riders</p>
                </div>
              </div>
            </section>

            {/* Section 8 */}
            <section id="rights" className="space-y-3 border-b border-brandBorder-subtle pb-6 scroll-mt-20">
              <h2 className="font-heading font-bold text-lg text-forest-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-forest-700" />
                <span>8. Patient Rights & Data Control</span>
              </h2>
              <p>Under the DPDPA and Indian healthcare regulations, you retain full ownership of your data:</p>
              <ul className="list-disc pl-5 space-y-1 text-brandText-secondary">
                <li><strong>Right to Access:</strong> View all current prescriptions, orders, appointments, and personal details anytime via your profile.</li>
                <li><strong>Right to Correction:</strong> Update outdated addresses, phone numbers, or demographic information directly.</li>
                <li><strong>Right to Erasure:</strong> Request permanent deletion of non-statutory medical records and profile termination by emailing our grievance desk.</li>
                <li><strong>Right to Grievance Redressal:</strong> Dedicated officer response within 48 business hours.</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section id="cookies" className="space-y-3 border-b border-brandBorder-subtle pb-6 scroll-mt-20">
              <h2 className="font-heading font-bold text-lg text-forest-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-forest-700" />
                <span>9. Cookies & Telemetry</span>
              </h2>
              <p>
                We use secure, session-based cookies and localStorage keys strictly for essential functionality: preserving your login session, remembering selected delivery pin-codes, and maintaining your shopping cart. We do not deploy invasive cross-site advertising trackers.
              </p>
            </section>

            {/* Section 10 */}
            <section id="grievance" className="space-y-4 scroll-mt-20">
              <h2 className="font-heading font-bold text-lg text-forest-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-forest-700" />
                <span>10. Grievance Redressal & Contact</span>
              </h2>
              <p>
                In accordance with the Information Technology Act, 2000, and the Digital Personal Data Protection Act, 2023, the details of our designated Grievance Officer are provided below:
              </p>

              <div className="p-5 bg-forest-50/70 border border-forest-200 rounded-2xl space-y-2 text-xs">
                <p className="font-bold text-forest-900 text-sm">Grievance & Privacy Officer</p>
                <p className="text-forest-800">
                  <strong>Name:</strong> S. Sen (Head of Legal & Compliance)
                </p>
                <p className="text-forest-800">
                  <strong>Company:</strong> Oshud Wala Health Technologies Pvt. Ltd.
                </p>
                <p className="text-forest-800">
                  <strong>Address:</strong> Sector V, Salt Lake City, Kolkata, West Bengal - 700091, India
                </p>
                <p className="text-forest-800">
                  <strong>Email:</strong>{' '}
                  <a href="mailto:grievance@oshudwala.in" className="text-emerald-700 font-bold hover:underline">
                    grievance@oshudwala.in
                  </a>
                </p>
                <p className="text-forest-800">
                  <strong>Helpline:</strong> +91 33 2357 8900 (Mon–Fri, 10:00 AM – 06:00 PM IST)
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-card flex flex-wrap items-center justify-around gap-4 text-center">
          <div className="flex items-center gap-2 text-forest-900 font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>100% Genuine Medicines</span>
          </div>
          <div className="flex items-center gap-2 text-forest-900 font-bold text-xs">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>256-bit Encrypted Health Data</span>
          </div>
          <div className="flex items-center gap-2 text-forest-900 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>DPDPA & HIPAA Aligned</span>
          </div>
          <div className="flex items-center gap-2 text-forest-900 font-bold text-xs">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>Pharmacist Verification Required</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
