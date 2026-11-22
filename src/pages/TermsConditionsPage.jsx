import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  Scale,
  Clock,
  Printer,
  ChevronRight,
  ArrowLeft,
  Truck,
  Building2,
  Stethoscope,
  CheckCircle2,
  CreditCard,
  Ban,
  HelpCircle,
} from 'lucide-react';
import Button from '../components/common/Button';

export const TermsConditionsPage = () => {
  const [activeSection, setActiveSection] = useState('acceptance');

  const scrollTo = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const sections = [
    { id: 'acceptance', title: '1. Acceptance & Eligibility' },
    { id: 'platform-role', title: '2. Platform Role & Disclaimer' },
    { id: 'prescriptions', title: '3. Prescription Dispensation' },
    { id: 'consultations', title: '4. Doctor Consultations & Tokens' },
    { id: 'orders', title: '5. Pricing, Payments & Invoices' },
    { id: 'delivery', title: '6. Express Delivery & OTP Protocol' },
    { id: 'returns', title: '7. Returns & Replacement Policy' },
    { id: 'conduct', title: '8. User Obligations & Conduct' },
    { id: 'liability', title: '9. Limitation of Liability' },
    { id: 'governing-law', title: '10. Governing Law & Jurisdiction' },
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
            <span className="text-forest-900 font-bold">Terms &amp; Conditions</span>
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
              <span>Print Terms</span>
            </button>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-forest-900 via-forest-800 to-forest-900 text-white rounded-3xl p-8 sm:p-10 shadow-card relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
              <Scale className="w-4 h-4" />
              <span>Legal Terms of Service &amp; Healthcare User Agreement</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-heading font-extrabold tracking-tight">
              Terms &amp; Conditions of Service
            </h1>
            <p className="text-xs sm:text-sm text-forest-100/90 leading-relaxed">
              Please review these terms carefully before booking doctor consultations, purchasing pharmaceutical products, or requesting express courier deliveries on Oshud Wala.
            </p>
          </div>

          {/* Decorative balance scale / legal backdrop */}
          <div className="absolute right-6 -bottom-10 opacity-10 pointer-events-none hidden md:block">
            <svg width="220" height="220" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5zm4 4h-2v-2h2v2zm0-4h-2V7h2v5z" />
            </svg>
          </div>
        </div>

        {/* Main Content Grid: Sticky Sidebar + Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Sticky Table of Contents */}
          <div className="lg:col-span-4 sticky top-6 hidden lg:block">
            <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-card space-y-3">
              <h2 className="font-heading font-bold text-sm text-forest-900 uppercase tracking-wider">
                Terms Navigation
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
                <p>Questions regarding our terms?</p>
                <a
                  href="mailto:oshudwala@gmail.com"
                  className="text-forest-700 font-bold hover:underline block mt-0.5"
                >
                  oshudwala@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Full Legal Sections */}
          <div className="lg:col-span-8 bg-surface-pure rounded-3xl p-6 sm:p-10 border border-brandBorder-subtle shadow-card space-y-8 text-forest-950 text-xs sm:text-sm leading-relaxed">
            {/* Section 1 */}
            <section id="acceptance" className="space-y-3 border-b border-brandBorder-subtle pb-6 scroll-mt-20">
              <h2 className="font-heading font-bold text-lg text-forest-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-forest-700" />
                <span>1. Acceptance of Terms &amp; Eligibility</span>
              </h2>
              <p>
                These Terms and Conditions (&ldquo;Terms&rdquo;) constitute a legally binding electronic agreement between you (&ldquo;User&rdquo;, &ldquo;Patient&rdquo;) and <strong>Oshud Wala Health Technologies Pvt. Ltd.</strong> (&ldquo;Oshud Wala&rdquo;, &ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), governing your access to and use of the website <strong>https://www.oshudwala.in</strong>, mobile web portals, and associated fleet applications.
              </p>
              <p>
                By accessing, browsing, registering an account, or placing orders on Oshud Wala, you acknowledge that you are at least 18 years of age and legally competent to enter into contracts under the Indian Contract Act, 1872. If accessing on behalf of a minor or family member, you represent that you hold valid legal authority to do so.
              </p>
            </section>

            {/* Section 2 */}
            <section id="platform-role" className="space-y-3 border-b border-brandBorder-subtle pb-6 scroll-mt-20">
              <h2 className="font-heading font-bold text-lg text-forest-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-forest-700" />
                <span>2. Platform Nature &amp; Medical Disclaimer</span>
              </h2>
              <p>
                Oshud Wala operates as a digital technology intermediary and healthcare facilitator platform connecting consumers with independently licensed third-party service providers, including:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-brandText-secondary">
                <li>Licensed Retail Pharmacies holding valid retail drug licenses under the Drugs and Cosmetics Act, 1940.</li>
                <li>Registered Medical Practitioners (Doctors) licensed under the National Medical Commission (NMC) Act.</li>
                <li>Registered Outpatient Diagnostic &amp; Multi-Speciality Partner Clinics.</li>
                <li>Independent Fleet Couriers for last-mile tamper-evident package delivery.</li>
              </ul>
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-1.5 text-amber-950">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>Non-Emergency Medical Service Notice</span>
                </p>
                <p className="text-xs text-amber-900 leading-relaxed">
                  Oshud Wala is NOT an emergency response service. If you or someone you are assisting is experiencing severe trauma, chest pain, acute respiratory distress, or other life-threatening medical emergencies, immediately contact state emergency services (102 / 108) or visit the nearest hospital emergency room.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section id="prescriptions" className="space-y-3 border-b border-brandBorder-subtle pb-6 scroll-mt-20">
              <h2 className="font-heading font-bold text-lg text-forest-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-forest-700" />
                <span>3. Prescription Dispensation &amp; Pharmacy Regulations</span>
              </h2>
              <p>
                Under the Drugs and Cosmetics Rules, 1945, and applicable pharmacy directives in West Bengal:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-brandText-secondary">
                <li>
                  <strong className="text-forest-900">Mandatory Valid Prescriptions:</strong> Medications categorized as Schedule H, Schedule H1, or Schedule X cannot and will not be dispensed without a valid, legible prescription issued by a Registered Medical Practitioner within its authorized validity period.
                </li>
                <li>
                  <strong className="text-forest-900">Pharmacist Review &amp; Call Clarification:</strong> Every uploaded prescription is reviewed by a qualified Registered Pharmacist. The pharmacist reserves the right to initiate a phone consultation with the patient or refuse fulfillment if the prescription is expired, unclear, suspicious, or lacks doctor credentials.
                </li>
                <li>
                  <strong className="text-forest-900">Cold Chain &amp; Controlled Substances:</strong> Strict cold chain storage guidelines are maintained for temperature-sensitive drugs (such as insulin). Controlled psychotropic substances requiring physical in-person register entries are fulfilled strictly per statutory guidelines.
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="consultations" className="space-y-3 border-b border-brandBorder-subtle pb-6 scroll-mt-20">
              <h2 className="font-heading font-bold text-lg text-forest-900 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-forest-700" />
                <span>4. Doctor Consultations &amp; Clinic Queue Tokens</span>
              </h2>
              <p>
                Oshud Wala provides appointment booking and digital clinic token management for outpatient chambers:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-brandText-secondary">
                <li>
                  <strong className="text-forest-900">Queue Token Estimates:</strong> Real-time tokens and queue positions displayed on the platform are operational estimates calculated from live doctor consultation paces. Actual waiting times may fluctuate based on emergency patient care.
                </li>
                <li>
                  <strong className="text-forest-900">Doctor Delays &amp; Rescheduling:</strong> In the event a consulting doctor is called away for hospital emergency procedures, the clinic reception desk will notify the patient with an option to reschedule or obtain a full refund of any online booking fee.
                </li>
                <li>
                  <strong className="text-forest-900">Independent Clinical Judgment:</strong> All diagnoses, prescriptions, and medical advices are the independent professional judgment of the consulting medical practitioner. Oshud Wala does not interfere with clinical decisions.
                </li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="orders" className="space-y-3 border-b border-brandBorder-subtle pb-6 scroll-mt-20">
              <h2 className="font-heading font-bold text-lg text-forest-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-forest-700" />
                <span>5. Pricing, Payments &amp; Invoices</span>
              </h2>
              <p>
                All prices displayed on Oshud Wala represent the Maximum Retail Price (MRP) inclusive of applicable Goods and Services Tax (GST), less any platform discounts or partner pharmacy subsidies.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-surface-warm rounded-2xl border border-brandBorder-subtle">
                  <h4 className="font-bold text-forest-900 mb-1">Prepaid Digital Payments</h4>
                  <p className="text-xs text-brandText-secondary">Processed securely via authorized UPI, debit/credit cards, and net banking with instant digital receipt generation.</p>
                </div>
                <div className="p-3 bg-surface-warm rounded-2xl border border-brandBorder-subtle">
                  <h4 className="font-bold text-forest-900 mb-1">Cash on Delivery (COD)</h4>
                  <p className="text-xs text-brandText-secondary">Patients must remit exact cash to the courier upon parcel delivery. Riders remit collected amounts daily to the Central Hub.</p>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section id="delivery" className="space-y-3 border-b border-brandBorder-subtle pb-6 scroll-mt-20">
              <h2 className="font-heading font-bold text-lg text-forest-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-forest-700" />
                <span>6. Express Delivery &amp; 4-Digit OTP Handover Protocol</span>
              </h2>
              <p>
                To eliminate delivery errors and safeguard patient confidentiality, all Oshud Wala deliveries adhere to our <strong>Secure Handover Protocol</strong>:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-brandText-secondary">
                <li>
                  <strong className="text-forest-900">Tamper-Evident Bag Seal:</strong> Medicines are packed in serialized, tamper-evident security pouches scanned by the courier at pharmacy pickup via Camera QR code.
                </li>
                <li>
                  <strong className="text-forest-900">Mandatory Customer OTP:</strong> The delivery rider CANNOT mark an order delivered without the unique 4-digit SMS OTP provided exclusively to the patient. Riders are strictly instructed not to leave medicine unattended without OTP verification.
                </li>
                <li>
                  <strong className="text-forest-900">Delivery Timelines:</strong> Express delivery targets within Kolkata, Salt Lake, and suburban zones are subject to prevailing weather and traffic conditions.
                </li>
              </ul>
            </section>

            {/* Section 7 */}
            <section id="returns" className="space-y-3 border-b border-brandBorder-subtle pb-6 scroll-mt-20">
              <h2 className="font-heading font-bold text-lg text-forest-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-forest-700" />
                <span>7. Returns, Replacements &amp; Refund Policy</span>
              </h2>
              <p>
                Due to strict pharmaceutical hygiene, cold chain requirements, and drug safety regulations:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-brandText-secondary">
                <li>
                  <strong>Eligible for Return/Replacement:</strong> Medicines delivered in a damaged condition, items past expiry date, or products differing from the verified prescription. Claims must be raised within <strong>48 hours</strong> of receipt with package photographs.
                </li>
                <li>
                  <strong>Non-Returnable Items:</strong> Refrigerated items (insulin, vaccines), opened medicine strips, personal hygiene consumables, and injectable vials once the tamper seal is broken.
                </li>
                <li>
                  <strong>Refund Processing:</strong> Approved refunds are credited to the original payment source or patient wallet within 3 to 5 business days.
                </li>
              </ul>
            </section>

            {/* Section 8 */}
            <section id="conduct" className="space-y-3 border-b border-brandBorder-subtle pb-6 scroll-mt-20">
              <h2 className="font-heading font-bold text-lg text-forest-900 flex items-center gap-2">
                <Ban className="w-5 h-5 text-forest-700" />
                <span>8. User Obligations &amp; Prohibited Conduct</span>
              </h2>
              <p>When using Oshud Wala, you agree NOT to:</p>
              <ul className="list-disc pl-5 space-y-1 text-brandText-secondary">
                <li>Upload fabricated, forged, altered, or stolen medical prescriptions.</li>
                <li>Impersonate healthcare providers, registered pharmacists, or another patient.</li>
                <li>Misuse COD payment facilities or refuse legitimate orders upon delivery.</li>
                <li>Subject delivery fleet riders, clinic receptionists, or customer care staff to abusive, threatening, or harassing behavior.</li>
                <li>Engage in automated scraping, reverse-engineering, or unauthorized penetration testing of platform systems.</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section id="liability" className="space-y-3 border-b border-brandBorder-subtle pb-6 scroll-mt-20">
              <h2 className="font-heading font-bold text-lg text-forest-900 flex items-center gap-2">
                <Scale className="w-5 h-5 text-forest-700" />
                <span>9. Limitation of Liability</span>
              </h2>
              <p>
                Oshud Wala shall not be liable for any indirect, incidental, special, consequential, or exemplary damages arising from:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-brandText-secondary">
                <li>Adverse medical reactions, allergies, or therapeutic failures of medications manufactured by third-party pharmaceutical companies and prescribed by registered doctors.</li>
                <li>Delays caused by natural calamities, severe Kolkata monsoon waterlogging, political strikes, or courier vehicle breakdowns.</li>
                <li>Inaccuracies in patient-provided delivery addresses, contact numbers, or medication histories.</li>
              </ul>
            </section>

            {/* Section 10 */}
            <section id="governing-law" className="space-y-3 scroll-mt-20">
              <h2 className="font-heading font-bold text-lg text-forest-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-forest-700" />
                <span>10. Governing Law &amp; Jurisdiction</span>
              </h2>
              <p>
                These Terms shall be governed by, construed, and enforced in accordance with the substantive laws of the Republic of India. Any dispute, controversy, or claim arising out of or relating to these Terms or the breach thereof shall be subject to the exclusive jurisdiction of the competent civil courts in <strong>Kolkata, West Bengal, India</strong>.
              </p>
              <p className="text-xs text-brandText-secondary pt-2">
                For legal notices or service inquiries: <strong>Oshud Wala Health Technologies Pvt. Ltd., Sector V, Salt Lake, Kolkata, WB - 700091</strong> &bull; Email: <a href="mailto:oshudwala@gmail.com" className="text-forest-700 font-bold hover:underline">oshudwala@gmail.com</a>
              </p>
            </section>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-card flex flex-wrap items-center justify-around gap-4 text-center">
          <div className="flex items-center gap-2 text-forest-900 font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Licensed Retail Partners</span>
          </div>
          <div className="flex items-center gap-2 text-forest-900 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Drugs &amp; Cosmetics Act Compliant</span>
          </div>
          <div className="flex items-center gap-2 text-forest-900 font-bold text-xs">
            <Truck className="w-4 h-4 text-emerald-600" />
            <span>Tamper-Proof OTP Handover</span>
          </div>
          <div className="flex items-center gap-2 text-forest-900 font-bold text-xs">
            <Scale className="w-4 h-4 text-emerald-600" />
            <span>Kolkata Civil Jurisdiction</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsConditionsPage;
