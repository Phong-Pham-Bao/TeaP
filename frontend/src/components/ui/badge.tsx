import React, { HTMLAttributes, forwardRef } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className = '', variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-slate-100 text-slate-700',
      success: 'bg-emerald-100 text-emerald-800',
      warning: 'bg-amber-100 text-amber-800',
      danger: 'bg-rose-100 text-rose-800',
      info: 'bg-sky-100 text-sky-800',
    };
    
    return (
      <div 
        ref={ref} 
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variants[variant]} ${className}`} 
        {...props} 
      />
    );
  }
);
Badge.displayName = 'Badge';
export { Badge };
