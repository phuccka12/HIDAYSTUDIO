import React from 'react';

export const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = '' }) => {
  return <div className={`bg-white rounded-lg shadow ${className}`}>{children}</div>;
};

export const CardHeader: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = '' }) => (
  <div className={`px-4 py-3 border-b ${className}`}>{children}</div>
);

export const CardTitle: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = '' }) => (
  <h3 className={`text-sm font-medium ${className}`}>{children}</h3>
);

export const CardContent: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = '' }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

export default Card;
