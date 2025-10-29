import React from 'react';

export const Badge: React.FC<React.PropsWithChildren<{ className?: string; variant?: string }>> = ({ children, className = '' }) => {
  return <span className={`inline-block text-xs px-2 py-1 rounded-full ${className}`}>{children}</span>;
};

export default Badge;
