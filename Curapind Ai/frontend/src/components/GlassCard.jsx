import React from 'react';

const GlassCard = ({ children, className = '' }) => {
  return (
    <div className={`glass-panel p-6 sm:p-8 ${className}`}>
      {children}
    </div>
  );
};

export default GlassCard;
