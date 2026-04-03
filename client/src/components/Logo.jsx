import React from 'react';

const Logo = ({ className = "w-full h-full", bgColor = "transparent", iconColor = "currentColor" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Background Circle with customizable color */}
    <circle 
      cx="50" 
      cy="50" 
      r="48" 
      fill={bgColor === "transparent" ? "currentColor" : bgColor} 
      fillOpacity={bgColor === "transparent" ? "0.05" : "1"} 
    />

    {/* Outer Triangle */}
    <path 
      d="M50 20 L22 80 H78 Z" 
      stroke={iconColor} 
      strokeWidth="6" 
      strokeLinejoin="round" 
    />
    
    {/* Vertical Axis */}
    <path 
      d="M50 20 L50 80" 
      stroke={iconColor} 
      strokeWidth="4" 
      strokeLinecap="round"
    />
    
    {/* 3 Horizontal Tiers */}
    <path 
      d="M36 50 L64 50" 
      stroke={iconColor} 
      strokeWidth="4" 
      strokeLinecap="round"
    />
    <path 
      d="M30 65 L70 65" 
      stroke={iconColor} 
      strokeWidth="4" 
      strokeLinecap="round"
    />
    <path 
      d="M24 78 L76 78" 
      stroke={iconColor} 
      strokeWidth="4" 
      strokeLinecap="round"
    />
    
    {/* Upper Pivot Dot */}
    <circle cx="50" cy="40" r="5" fill={iconColor} />
  </svg>
);

export default Logo;
