import React, { useState } from 'react';
import { Plus, Minus, ArrowRight } from 'lucide-react';
import { faqsData } from '../../data/faqsData';
import Button from '../common/Button';
import { useLanguage } from '../../context/LanguageContext';

export const FaqSection = () => {
  const { t, isBengali } = useLanguage();
  const [openFaqId, setOpenFaqId] = useState('faq-1');
  const [showAll, setShowAll] = useState(false);

  const toggleFaq = (id) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  const displayedFaqs = showAll ? faqsData : faqsData.slice(0, 5);

  return (
    <section id="faq" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left: Illustration, Heading, CTA */}
        <div className="lg:col-span-5 relative space-y-4">
          {/* Subtle decorative leaf background svg */}
          <div className="absolute -left-10 -top-10 w-44 h-44 opacity-20 pointer-events-none">
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M40 180C20 120 40 40 160 40C160 160 80 180 40 180Z"
                fill="#16875B"
              />
              <path
                d="M40 180C70 140 110 90 160 40"
                stroke="#075C40"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="relative z-10 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-forest-800 tracking-tight leading-tight">
              {t('faqs_title', 'Frequently Asked Questions')}
            </h2>
            <p className="text-xs sm:text-sm text-brandText-secondary leading-relaxed">
              {t('faqs_subtitle', 'Find answers to common queries regarding medicine ordering, prescription reviews, and doctor appointments.')}
            </p>

            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                rightIcon={ArrowRight}
                onClick={() => setShowAll((prev) => !prev)}
                className="py-2.5 px-5 shadow-sm text-xs font-bold"
              >
                {showAll ? t('show_less', 'Show Fewer FAQs') : t('view_all_questions', 'View All FAQs')}
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Accordion Items */}
        <div className="lg:col-span-7 space-y-3">
          {displayedFaqs.map((faq) => {
            const isOpen = openFaqId === faq.id;
            return (
              <div
                key={faq.id}
                className="bg-surface-pure rounded-2xl border border-brandBorder-subtle overflow-hidden transition-all duration-200 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-heading font-bold text-sm text-forest-800 hover:text-forest-600 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="leading-snug">{isBengali && faq.questionBn ? faq.questionBn : faq.question}</span>
                  <div className="w-7 h-7 rounded-full bg-forest-50 text-forest-700 flex items-center justify-center flex-shrink-0">
                    {isOpen ? (
                      <Minus className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 pt-0 text-xs sm:text-sm text-brandText-secondary leading-relaxed border-t border-brandBorder-light/50 mt-1 animate-fade-in">
                    {isBengali && faq.answerBn ? faq.answerBn : faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
