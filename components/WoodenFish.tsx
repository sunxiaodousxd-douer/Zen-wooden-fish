import React, { useState, useCallback, useRef } from 'react';

interface WoodenFishProps {
  onKnock: (event: React.PointerEvent | React.MouseEvent | React.TouchEvent) => void;
}

interface Ripple {
  id: number;
}

export const WoodenFish: React.FC<WoodenFishProps> = ({ onKnock }) => {
  const [animating, setAnimating] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleIdCounter = useRef(0);
  
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Prevent default behavior to stop browser from firing subsequent compatibility mouse events
    // and to prevent scrolling/zooming gestures on the fish itself.
    e.preventDefault();

    // Reset animation to allow rapid clicking
    setAnimating(false);
    // Force reflow
    setTimeout(() => setAnimating(true), 0);

    // Add ripple
    const newRipple = { id: rippleIdCounter.current++ };
    setRipples(prev => [...prev, newRipple]);

    // Cleanup ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 800);

    onKnock(e);
  }, [onKnock]);

  return (
    <div 
      className="relative w-80 h-64 md:w-96 md:h-80 flex items-center justify-center select-none cursor-pointer touch-none"
      onPointerDown={handlePointerDown}
      role="button"
      tabIndex={0}
      aria-label="Knock wooden fish"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* Ripple Effects Layer (Behind fish) */}
      {ripples.map(r => (
         <div 
           key={r.id}
           className="absolute top-1/2 left-1/2 w-64 h-64 -ml-32 -mt-32 rounded-full border-2 border-amber-200/40 animate-ripple pointer-events-none"
         />
      ))}

      {/* Wooden Fish Container - Animates on hit */}
      <div className={`relative w-full h-full flex items-center justify-center transition-transform duration-75 ${animating ? 'animate-scale-hit' : ''}`}>
        <svg
          viewBox="0 0 300 300"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-2xl"
          style={{ filter: 'drop-shadow(0 30px 30px rgba(0,0,0,0.3))' }}
        >
          <defs>
            {/* 3D Gradient - Huanghuali (Yellow Rosewood) Style: Golden, Translucent, Warm */}
            <radialGradient id="fishBodyGrad" cx="50%" cy="35%" r="80%" fx="50%" fy="30%">
              <stop offset="0%" stopColor="#fff7ed" /> {/* Orange 50 - Creamy highlight for translucency */}
              <stop offset="40%" stopColor="#fbbf24" /> {/* Amber 400 - Golden Heart */}
              <stop offset="100%" stopColor="#c2410c" /> {/* Orange 700 - Warm reddish brown edge */}
            </radialGradient>
            
            {/* Darker recess for the mouth - warmer tone */}
            <linearGradient id="mouthGrad" x1="0%" y1="0%" x2="0%" y2="100%">
               <stop offset="0%" stopColor="#7c2d12" /> {/* Orange 900 */}
               <stop offset="100%" stopColor="#451a03" /> {/* Amber 950 */}
            </linearGradient>

            <filter id="woodGrain">
               <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" result="noise" />
               <feColorMatrix type="saturate" values="0.1" /> {/* Desaturated noise */}
               <feComposite operator="in" in2="SourceGraphic" result="texturedNoise"/>
               {/* Lower opacity for smoother, polished look */}
               <feBlend mode="multiply" in="texturedNoise" in2="SourceGraphic" opacity="0.15" /> 
            </filter>
          </defs>
          
          {/* Main Body - Classic Rounded Shape (No Eyes) */}
          <g filter="url(#woodGrain)">
            <path
              d="M 150 40
                 C 230 40, 280 90, 280 160
                 C 280 230, 230 270, 150 270
                 C 70 270, 20 230, 20 160
                 C 20 90, 70 40, 150 40 Z"
              fill="url(#fishBodyGrad)"
              stroke="#9a3412"
              strokeWidth="1.5"
            />
          </g>

          {/* The Resonance Mouth (The slit) - Curved and deep */}
          <path
            d="M 40 160 
               Q 150 210 260 160
               Q 150 250 40 160 Z"
            fill="url(#mouthGrad)"
            stroke="#7c2d12"
            strokeWidth="1"
            opacity="0.95"
          />

          {/* Specular Highlight (The "shiny" part on top) - Stronger for glossiness */}
          <ellipse cx="150" cy="80" rx="80" ry="40" fill="white" opacity="0.15" filter="blur(6px)" />
        </svg>
      </div>

      {/* The Mallet - Lighter wood to match, Longer Handle */}
      <div 
        className={`absolute top-[-25%] right-[-25%] w-[80%] h-[80%] pointer-events-none
        ${animating ? 'animate-hammer-strike' : ''}`}
        style={{ transformOrigin: '80% 80%' }}
      >
        <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-xl">
           <defs>
             <linearGradient id="stickGrad" x1="0%" y1="0%" x2="100%" y2="100%">
               <stop offset="0%" stopColor="#fef3c7" /> {/* Amber 100 */}
               <stop offset="100%" stopColor="#d97706" /> {/* Amber 600 */}
             </linearGradient>
           </defs>
           
           {/* Handle - significantly longer (M 70 70 L 230 230) */}
           <path 
             d="M 70 70 L 230 230" 
             stroke="url(#stickGrad)" 
             strokeWidth="12" 
             strokeLinecap="round"
           />
           
           {/* Mallet Head */}
           <ellipse 
             cx="70" cy="70" rx="28" ry="32"
             fill="#b45309"
             stroke="#78350f"
             strokeWidth="1"
             transform="rotate(-45 70 70)"
           />
           
           <ellipse 
             cx="65" cy="65" rx="8" ry="12" 
             fill="white" opacity="0.2" 
             transform="rotate(-45 65 65)"
            />
        </svg>
      </div>

    </div>
  );
};