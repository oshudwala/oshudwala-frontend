import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const MetricCard = ({
  title,
  value,
  change,
  trend = 'up', // 'up', 'down', 'neutral'
  caption = 'vs previous period',
  icon: Icon,
  colorScheme = 'forest', // 'forest', 'emerald', 'blue', 'amber', 'rose', 'purple'
  className = '',
  onClick,
}) => {
  const colorMaps = {
    forest: {
      bg: 'bg-forest-50/50',
      iconBg: 'bg-forest-100',
      iconText: 'text-forest-700',
      border: 'border-forest-100',
    },
    emerald: {
      bg: 'bg-emerald-50/50',
      iconBg: 'bg-emerald-100',
      iconText: 'text-emerald-700',
      border: 'border-emerald-100',
    },
    blue: {
      bg: 'bg-blue-50/50',
      iconBg: 'bg-blue-100',
      iconText: 'text-blue-700',
      border: 'border-blue-100',
    },
    amber: {
      bg: 'bg-amber-50/50',
      iconBg: 'bg-amber-100',
      iconText: 'text-amber-700',
      border: 'border-amber-100',
    },
    rose: {
      bg: 'bg-rose-50/50',
      iconBg: 'bg-rose-100',
      iconText: 'text-rose-700',
      border: 'border-rose-100',
    },
    purple: {
      bg: 'bg-purple-50/50',
      iconBg: 'bg-purple-100',
      iconText: 'text-purple-700',
      border: 'border-purple-100',
    },
  };

  const scheme = colorMaps[colorScheme] || colorMaps.forest;

  return (
    <div
      onClick={onClick}
      className={`bg-surface-pure rounded-2xl p-5 border border-brandBorder-subtle shadow-card hover:border-forest-300 transition-all ${
        onClick ? 'cursor-pointer hover:shadow-floating' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-brandText-secondary uppercase tracking-wider">
            {title}
          </p>
          <h3 className="text-2xl font-heading font-extrabold text-forest-900 tracking-tight">
            {value}
          </h3>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${scheme.iconBg} ${scheme.iconText}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {change !== undefined && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-brandBorder-subtle/50 text-xs">
          <span
            className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded ${
              trend === 'up'
                ? 'text-emerald-700 bg-emerald-50'
                : trend === 'down'
                ? 'text-rose-700 bg-rose-50'
                : 'text-slate-600 bg-slate-50'
            }`}
          >
            {trend === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3" />}
            {trend === 'neutral' && <Minus className="w-3 h-3" />}
            <span>{change}</span>
          </span>
          <span className="text-[11px] text-brandText-muted">{caption}</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
