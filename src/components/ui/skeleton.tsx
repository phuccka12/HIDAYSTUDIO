import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div aria-hidden className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

export default Skeleton;
