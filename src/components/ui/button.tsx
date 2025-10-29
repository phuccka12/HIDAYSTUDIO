import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string };

export const Button: React.FC<ButtonProps> = ({ children, className = '', ...rest }) => {
  return (
    <button {...rest} className={`inline-flex items-center gap-2 px-4 py-2 rounded ${className}`}>{children}</button>
  );
};

export default Button;
