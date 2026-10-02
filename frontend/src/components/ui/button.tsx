import React, { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', type = 'button', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teap-light focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    
    const variants = {
      primary: 'bg-teap text-white hover:bg-teap-dark',
      secondary: 'bg-teap-cream text-teap-dark hover:bg-teap-sand',
      outline: 'border border-teap-sand bg-white text-teap-dark hover:border-teap hover:bg-teap-cream',
      danger: 'bg-rose-700 text-white hover:bg-rose-800',
      ghost: 'hover:bg-teap-cream text-teap-dark',
    };
    
    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 py-2 text-sm',
      lg: 'h-12 px-8 text-base',
    };
    
    const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;
    
    return (
      <button ref={ref} type={type} className={classes} {...props} />
    );
  }
);

Button.displayName = 'Button';
export { Button };
