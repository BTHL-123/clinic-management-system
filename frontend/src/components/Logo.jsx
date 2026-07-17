import React from 'react';

export function MedicalCross({ size = 40, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      <mask id="crossMask">
        {/* A simple cross shape with slightly rounded corners */}
        <path d="M32 15 h36 v22 h22 v26 h-22 v22 h-36 v-22 h-22 v-26 h22 z" fill="white" stroke="white" strokeWidth="4" strokeLinejoin="round" />
      </mask>
      <g mask="url(#crossMask)">
        {/* The bottom and right parts are cyan */}
        <rect x="0" y="0" width="100" height="100" fill="#12c3d6" />
        {/* The top and left parts are dark blue, split by a curve */}
        <path d="M0 0 H100 V20 C45 35, 30 55, 20 100 H0 Z" fill="#064e8a" />
        {/* The white separator curve */}
        <path d="M20 100 C30 55, 45 35, 100 20" stroke="white" strokeWidth="6" fill="none" />
      </g>
    </svg>
  );
}

export default function Logo({ size = 40, showText = true, textColor = "#022144" }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
      <MedicalCross size={size} />
      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, color: textColor, fontWeight: 900, fontFamily: 'sans-serif' }}>
          <span style={{ fontSize: size * 0.45 }}>Medical</span>
          <span style={{ fontSize: size * 0.45 }}>Clinic</span>
        </div>
      )}
    </div>
  );
}
