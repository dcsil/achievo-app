import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false, 
  className = '' 
}) => {
  const baseStyles = 'font-medium transition-colors rounded-lg';
  
  const variantStyles = {
    primary: 'px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed',
    secondary: 'px-6 py-3 text-gray-600 hover:text-gray-800',
    ghost: 'px-6 py-3 text-gray-600 hover:text-gray-800'
  };

  // Merge base styles with variant styles, allowing className to override
  const finalClassName = `${baseStyles} ${variantStyles[variant]} ${className}`;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={finalClassName}
    >
      {children}
    </button>
  );
};

export default Button;
