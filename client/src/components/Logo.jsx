import React from 'react';

const Logo = ({ className = "w-full h-full text-white" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Outer Pyramid */}
    <path 
      d="M50 15 L15 85 H85 Z" 
      stroke="currentColor" 
      strokeWidth="6" 
      strokeLinejoin="miter" 
    />
    
    {/* Inner Depth Lines */}
    <path 
      d="M50 15 L50 85" 
      stroke="currentColor" 
      strokeWidth="4" 
    />
    
    {/* Base structure horizontals */}
    <path 
      d="M30 55 L70 55" 
      stroke="currentColor" 
      strokeWidth="4" 
    />
    <path 
      d="M22 70 L78 70" 
      stroke="currentColor" 
      strokeWidth="4" 
    />
    
    {/* Central floating mechanism/gem */}
    <circle cx="50" cy="40" r="5" fill="currentColor" />
  </svg>
);

export default Logo;
