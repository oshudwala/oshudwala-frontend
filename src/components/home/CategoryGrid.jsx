import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { categoriesData } from '../../data/categoriesData';

export const CategoryGrid = () => {
  const navigate = useNavigate();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-forest-800 tracking-tight">
            Categories
          </h2>
          <p className="text-xs sm:text-sm text-brandText-secondary mt-1">
            Browse medicines and healthcare products
          </p>
        </div>

        <Link
          to="/shop"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-forest-700 hover:text-forest-800 group transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* 6 Category Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {categoriesData.slice(0, 6).map((category) => (
          <div
            key={category.id}
            onClick={() => navigate(`/shop?category=${category.slug}`)}
            className="group bg-[#EAF5EE] hover:bg-[#DDF0E3] rounded-3xl p-3.5 sm:p-4 text-center cursor-pointer transition-all duration-300 border border-emerald-100/60 hover:shadow-card hover:-translate-y-1 flex flex-col items-center justify-between min-h-[160px]"
          >
            {/* Category Image in soft rounded container */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden flex items-center justify-center p-1.5 transition-transform duration-300 group-hover:scale-105">
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover rounded-xl"
                loading="lazy"
              />
            </div>

            {/* Title */}
            <h3 className="font-heading font-bold text-xs sm:text-sm text-forest-900 group-hover:text-forest-700 mt-2 transition-colors leading-tight">
              {category.name}
            </h3>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CategoryGrid;
