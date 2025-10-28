import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  variant?: 'default' | 'minimal';
  showAIBadge?: boolean;
}

export function Logo360({ 
  size = 48, 
  className = '', 
  variant = 'default',
  showAIBadge = true 
}: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id={`bgGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#E31E24', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#C32324', stopOpacity: 1 }} />
        </linearGradient>
        {variant === 'default' && (
          <linearGradient id={`glassGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.4 }} />
            <stop offset="50%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
            <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
          </linearGradient>
        )}
      </defs>

      {/* Background */}
      <rect
        x="10"
        y="10"
        width="180"
        height="180"
        rx="50"
        fill={`url(#bgGradient-${size})`}
      />

      {/* Glass effect */}
      {variant === 'default' && (
        <rect
          x="10"
          y="10"
          width="180"
          height="180"
          rx="50"
          fill={`url(#glassGradient-${size})`}
          opacity="0.6"
        />
      )}

      {/* 360° text */}
      <text
        x="100"
        y="125"
        fontFamily="Arial, sans-serif"
        fontSize="72"
        fontWeight="bold"
        fill="white"
        textAnchor="middle"
      >
        360°
      </text>

      {/* AI badge */}
      {showAIBadge && (
        <g transform="translate(145, 45)">
          <circle cx="0" cy="0" r="20" fill="white" opacity="0.2" />
          <text
            x="0"
            y="7"
            fontFamily="Arial, sans-serif"
            fontSize="14"
            fontWeight="bold"
            fill="white"
            textAnchor="middle"
          >
            AI
          </text>
        </g>
      )}
    </svg>
  );
}

export default Logo360;

