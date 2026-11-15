import React from 'react';
import { Search, UploadCloud, ShoppingCart, Truck, ArrowRight } from 'lucide-react';

export const HowItWorks = () => {
  const steps = [
    {
      step: 1,
      icon: Search,
      title: "Choose your medicine or healthcare service",
    },
    {
      step: 2,
      icon: UploadCloud,
      title: "Upload prescription or select a service",
    },
    {
      step: 3,
      icon: ShoppingCart,
      title: "Confirm your order or appointment",
    },
    {
      step: 4,
      icon: Truck,
      title: "Track your order or appointment",
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Centered Heading */}
      <div className="text-center mb-10">
        <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-forest-800 tracking-tight">
          How It Works
        </h2>
      </div>

      {/* 4 Steps Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
        {steps.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={item.step} className="flex flex-col items-center text-center relative group">
              {/* Green Number Badge */}
              <div className="w-6 h-6 rounded-full bg-forest-600 text-white text-xs font-bold flex items-center justify-center mb-3 shadow-sm">
                {item.step}
              </div>

              {/* Icon Container with subtle mint glow */}
              <div className="w-16 h-16 rounded-full bg-forest-100/90 text-forest-700 flex items-center justify-center mb-3 group-hover:scale-105 group-hover:bg-forest-200 transition-all border border-forest-200/60 shadow-subtle">
                <Icon className="w-7 h-7" />
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm font-semibold text-brandText-main max-w-[200px] leading-snug">
                {item.title}
              </p>

              {/* Connecting Arrow for desktop (between steps) */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 -right-4 text-emerald-300">
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default HowItWorks;
