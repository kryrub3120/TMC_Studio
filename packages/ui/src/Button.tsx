/**
 * Basic button component
 */

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  active?: boolean;
}

/** Reusable button component */
export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon,
  active = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-colors duration-150 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
    disabled:opacity-50 disabled:cursor-not-allowed
  `.trim();

  const sizeStyles = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-2 text-sm gap-2',
    lg: 'px-4 py-2.5 text-base gap-2',
  };

  const variantStyles = {
    primary: `
      bg-blue-600 text-white hover:bg-blue-700
      focus:ring-blue-500
      ${active ? 'bg-blue-700' : ''}
    `,
    secondary: `
      bg-gray-700 text-gray-200 hover:bg-gray-600
      focus:ring-gray-500
      ${active ? 'bg-gray-600' : ''}
    `,
    ghost: `
      bg-transparent text-gray-300 hover:bg-gray-700 hover:text-white
      focus:ring-gray-500
      ${active ? 'bg-gray-700 text-white' : ''}
    `,
    danger: `
      bg-red-600 text-white hover:bg-red-700
      focus:ring-red-500
      ${active ? 'bg-red-700' : ''}
    `,
  };

  const combinedClassName = `
    ${baseStyles}
    ${sizeStyles[size]}
    ${variantStyles[variant]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      className={combinedClassName}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
