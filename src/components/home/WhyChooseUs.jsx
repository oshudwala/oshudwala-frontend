import React from 'react';
import { ShieldCheck, FileText, CalendarCheck, Truck, Lock, TrendingUp } from 'lucide-react';

export const WhyChooseUs = () => {
  const benefits = [
    {
      icon: ShieldCheck,
      title: "Trusted\nPharmacies",
    },
    {
      icon: FileText,
      title: "Easy Prescription\nUploads",
    },
    {
      icon: CalendarCheck,
      title: "Doctor Appointment\nBooking",
    },
    {
      icon: Truck,
      title: "Convenient\nDelivery",
    },
    {
      icon: Lock,
      title: "Secure Payment\nOptions",
    },
    {
      icon: TrendingUp,
      title: "Order\nTracking",
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-surface-pure rounded-3xl p-6 sm:p-8 border border-brandBorder-subtle shadow-subtle flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Left: Heading & Subtitle */}
        <div className="lg:w-1/4 text-center lg:text-left">
          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-forest-800 tracking-tight leading-tight">
            Why Choose Oshud Wala?
          </h2>
          <p className="text-xs sm:text-sm text-brandText-secondary mt-1">
            Your trusted partner for better healthcare
          </p>
        </div>

        {/* Right: 6 Benefits in horizontal layout */}
        <div className="lg:w-3/4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 w-full">
          {benefits.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex flex-col items-center text-center p-2 rounded-2xl hover:bg-forest-50/60 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center mb-2.5">
                  <Icon className="w-5 h-5 text-forest-600" />
                </div>
                <p className="text-xs font-bold text-forest-800 leading-tight whitespace-pre-line">
                  {item.title}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
