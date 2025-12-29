import React, { useState, useEffect } from 'react';
import { Language, intentionMap } from '../utils/translations';

interface IntentionControlProps {
  currentIntention: string;
  onIntentionChange: (intention: string) => void;
  lang: Language;
  t: any;
}

const PRESETS_ZH = ["求平安", "求财富", "求工作", "求智慧", "求姻缘", "求健康"];
const PRESETS_EN = ["Peace", "Wealth", "Career", "Wisdom", "Love", "Health"];

export const IntentionControl: React.FC<IntentionControlProps> = ({ 
  currentIntention, 
  onIntentionChange,
  lang,
  t
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  
  const presets = lang === 'en' ? PRESETS_EN : PRESETS_ZH;
  const isPreset = presets.includes(currentIntention);

  // Sync input value with current intention when switching or initializing
  useEffect(() => {
    if (!isPreset) {
      setInputValue(currentIntention);
    }
  }, [currentIntention, isPreset]);

  const handlePresetClick = (preset: string) => {
    setIsEditing(false);
    onIntentionChange(preset);
  };

  const handleCustomClick = () => {
    setIsEditing(true);
    if (!inputValue && !isPreset) {
       setInputValue(currentIntention);
    } else if (isPreset) {
       setInputValue("");
    }
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    if (inputValue.trim()) {
      onIntentionChange(inputValue.trim());
    } else if (isPreset) {
      // If empty and was preset, stay preset (no-op)
    } else {
      onIntentionChange(presets[0]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  };

  return (
    <div className="flex flex-col items-center space-y-3 w-full max-w-md animate-fade-in z-20">
      <div className="text-xs text-stone-500 uppercase tracking-widest mb-1">{t.currentIntention}</div>
      
      <div className="flex flex-wrap justify-center gap-2 px-2">
        {presets.map((preset) => (
          <button
            key={preset}
            onClick={() => handlePresetClick(preset)}
            className={`px-3 py-1.5 rounded-full text-sm transition-all duration-300 ${
              currentIntention === preset
                ? 'bg-amber-600 text-stone-100 shadow-lg shadow-amber-900/40 scale-105'
                : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200'
            }`}
          >
            {preset}
          </button>
        ))}
        
        {isEditing ? (
           <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder={t.customPlaceholder}
            autoFocus
            className="px-3 py-1.5 rounded-full text-sm w-24 text-center bg-stone-800 border border-amber-500/50 text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            maxLength={12}
          />
        ) : (
          <button
            onClick={handleCustomClick}
            className={`px-3 py-1.5 rounded-full text-sm transition-all duration-300 border ${
               !isPreset
                 ? 'bg-amber-600 text-stone-100 shadow-lg shadow-amber-900/40 scale-105 border-transparent'
                 : 'bg-transparent text-stone-500 border-stone-700 hover:text-stone-300'
             }`}
          >
            {!isPreset ? currentIntention : t.customPlaceholder}
          </button>
        )}
      </div>
    </div>
  );
};