import React from 'react';

const Logo = ({ className = "w-full h-full object-contain" }) => (
  <img 
    src="/logo.png" 
    alt="Cosmify Logo" 
    className={className} 
    onError={(e) => {
      e.target.style.display = 'none';
      // Fallback or placeholder can go here if needed
    }}
  />
);

export default Logo;
