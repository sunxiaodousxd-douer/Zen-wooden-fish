import React, { useEffect, useState } from 'react';

interface FloatingTextProps {
  id: number;
  x: number;
  y: number;
  text: string;
  onComplete: (id: number) => void;
}

export const FloatingText: React.FC<FloatingTextProps> = ({ id, x, y, text, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete(id);
    }, 1000); // Matches CSS animation duration
    return () => clearTimeout(timer);
  }, [id, onComplete]);

  return (
    <div
      className="fixed pointer-events-none text-amber-400 font-bold text-xl animate-float-up z-50 select-none"
      style={{ left: x, top: y }}
    >
      {text}
    </div>
  );
};