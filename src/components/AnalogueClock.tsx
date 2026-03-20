"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";

const getOrdinalSuffix = (day: number) => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1:  return "st";
    case 2:  return "nd";
    case 3:  return "rd";
    default: return "th";
  }
};

/**
 * @fileOverview Precision Slender Analogue Clock for MAP261125.
 * Features trigonometric number distribution and extended precision slender hands.
 */
export const AnalogueClock = () => {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return <div className="w-24 h-24 bg-slate-100 animate-pulse rounded-full" />;

  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours();

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;

  const day = time.getDate();
  const dateStr = format(time, "EEEE ") + day + getOrdinalSuffix(day) + format(time, " MMMM yyyy");

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <div className="relative w-24 h-24 rounded-full border-2 border-slate-900 bg-white shadow-lg overflow-hidden">
        {/* Hour Numbers (1-12) - Trigonometric Distribution Protocol */}
        {[...Array(12)].map((_, i) => {
          const num = i + 1;
          const angleDeg = num * 30;
          const angleRad = angleDeg * (Math.PI / 180);
          const radius = 38; // character-accurate radius for digits
          const x = 48 + radius * Math.sin(angleRad);
          const y = 48 - radius * Math.cos(angleRad);
          
          return (
            <div
              key={num}
              className="absolute font-black text-slate-900 text-[10px] leading-none"
              style={{ 
                left: `${x}px`, 
                top: `${y}px`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {num}
            </div>
          );
        })}
        
        <div className="absolute inset-0">
          {/* Hour Hand: Slender 2px width, 25px length (approx 65% reach) */}
          <div
            className="absolute top-1/2 left-1/2 w-0.5 h-[25px] bg-slate-900 rounded-full"
            style={{ 
              transform: `translate(-50%, -100%) rotate(${hourDeg}deg)`,
              transformOrigin: '50% 100%'
            }}
          />
          
          {/* Minute Hand: Slender 1px width, 36px length (approx 95% reach - almost touching numbers) */}
          <div
            className="absolute top-1/2 left-1/2 w-px h-[36px] bg-slate-600 rounded-full"
            style={{ 
              transform: `translate(-50%, -100%) rotate(${minuteDeg}deg)`,
              transformOrigin: '50% 100%'
            }}
          />
          
          {/* Second Hand: Slender 1px width */}
          <div
            className="absolute top-1/2 left-1/2 w-px h-[38px] bg-primary rounded-full"
            style={{ 
              transform: `translate(-50%, -100%) rotate(${secondDeg}deg)`,
              transformOrigin: '50% 100%'
            }}
          />
          
          {/* Central Pin */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-900 border border-white z-10 shadow-sm" />
        </div>
      </div>
      <div className="text-[10px] font-bold text-slate-900 tracking-tight whitespace-nowrap bg-white/50 px-2 py-0.5 rounded-full shadow-sm border border-slate-100">
        {dateStr}
      </div>
    </div>
  );
};
