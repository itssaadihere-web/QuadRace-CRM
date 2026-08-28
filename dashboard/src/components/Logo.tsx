import React from 'react';

export function QuadraceLogo({ 
  className = '', 
  size = 42,
  subtitle = 'AI Omnichannel Platform'
}: { 
  className?: string; 
  size?: number;
  subtitle?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 shrink-0 ${className}`}>
      {/* Official Quadrace CRM Crisp Image Logo */}
      <img
        src="/logo.png"
        alt="Quadrace CRM Logo"
        width={size}
        height={size}
        className="object-contain shrink-0 transform hover:scale-105 transition-transform"
        style={{ 
          width: `${size}px`, 
          height: `${size}px`, 
          minWidth: `${size}px`, 
          minHeight: `${size}px`,
          maxWidth: `${size}px`,
          maxHeight: `${size}px`
        }}
      />

      {/* Brand Text Header with No Clipping */}
      <div className="flex flex-col justify-center shrink-0 min-w-0">
        <div className="flex items-baseline gap-1 leading-none">
          <span className="font-black text-lg tracking-tight text-[#0F2B1D] whitespace-nowrap">QUADRACE</span>
          <span className="font-black text-lg tracking-tight text-[#C59B27] whitespace-nowrap">CRM</span>
        </div>
        <span className="text-[8.5px] font-extrabold text-slate-500 tracking-wider uppercase mt-1 whitespace-nowrap">
          {subtitle}
        </span>
      </div>
    </div>
  );
}
