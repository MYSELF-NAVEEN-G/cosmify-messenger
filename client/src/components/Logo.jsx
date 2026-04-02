import React from 'react';

const Logo = ({ className = "w-full h-full text-white" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Container Circle */}
    <circle cx="50" cy="50" r="45" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" />

    {/* Outer Triangle */}
    <path 
      d="M50 20 L22 80 H78 Z" 
      stroke="currentColor" 
      strokeWidth="5" 
      strokeLinejoin="round" 
    />
    
    {/* Vertical Axis */}
    <path 
      d="M50 20 L50 80" 
      stroke="currentColor" 
      strokeWidth="3.5" 
      strokeLinecap="round"
    />
    
    {/* 3 Horizontal Tiers */}
    <path 
      d="M36 50 L64 50" 
      stroke="currentColor" 
      strokeWidth="3.5" 
      strokeLinecap="round"
    />
    <path 
      d="M30 65 L70 65" 
      stroke="currentColor" 
      strokeWidth="3.5" 
      strokeLinecap="round"
    />
    <path 
      d="M24 78 L76 78" 
      stroke="currentColor" 
      strokeWidth="3.5" 
      strokeLinecap="round"
    />
    
    {/* Upper Pivot Dot */}
    <circle cx="50" cy="40" r="4" fill="currentColor" />
  </svg>
);

export default Logo;
