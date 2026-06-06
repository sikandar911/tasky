import React from 'react';
import Spinner from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
}

const variantStyles = {
  primary: 'bg-accent-cyan text-bg-primary hover:bg-accent-cyan/90 border border-accent-cyan/50',
  secondary: 'bg-bg-tertiary text-text-primary hover:bg-bg-border border border-bg-border',
  danger: 'bg-accent-red/10 text-accent-red hover:bg-accent-red/20 border border-accent-red/30',
  ghost: 'bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-text-primary border border-transparent',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : leftIcon}
      {children}
    </button>
  );
}
