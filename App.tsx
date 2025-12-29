import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WoodenFish } from './components/WoodenFish';
import { FloatingText } from './components/FloatingText';
import { IntentionControl } from './components/IntentionControl';
import { StatsModal } from './components/StatsModal';
import { UserModal } from './components/UserModal';
import { playWoodblockSound, initAudio } from './utils/sound';
import { fetchZenWisdom, getRandomFallbackQuote } from './services/geminiService';
import { translations, Language, intentionMap } from './utils/translations';

interface FloatingItem {
  id: number;
  x: number;
  y: number;
  text: string;
}

interface User {
  phone: string;
  nickname: string;
}

// Data structures for history
interface DailyRecord {
  total: number;
  intentions: Record<string, number>;
}
type HistoryRecord = Record<string, DailyRecord>;

interface UserData {
  merit: number;
  history: HistoryRecord;
}

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to determine theme properties including background image
// Supports both Chinese and English intention keywords
const getIntentionTheme = (intention: string) => {
  const i = intention.toLowerCase();
  
  if (i.includes("财") || i.includes("wealth") || i.includes("rich")) {
    // Wealth: "Pile of Gold Coins" - Literal wealth representation, dark cinematic lighting
    return {
      bg: 'bg-amber-950', 
      bgImage: 'url("https://images.unsplash.com/photo-1605792657660-596af9009e82?q=80&w=1920&auto=format&fit=crop")', 
      blob1: 'bg-amber-500',
      blob2: 'bg-yellow-400'
    };
  }
  if (i.includes("缘") || i.includes("爱") || i.includes("love") || i.includes("heart")) {
    // Love: "Red Hearts Bokeh" - Dark background with red heart shapes
    return {
      bg: 'bg-rose-950',
      bgImage: 'url("https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=1920&auto=format&fit=crop")',
      blob1: 'bg-rose-600',
      blob2: 'bg-red-700'
    };
  }
  if (i.includes("康") || i.includes("健") || i.includes("health")) {
    // Health: "Sunset Yoga Silhouette" - Silhouette against a warm dark sunset
    return {
      bg: 'bg-emerald-950',
      bgImage: 'url("https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1920&auto=format&fit=crop")',
      blob1: 'bg-orange-600',
      blob2: 'bg-amber-700'
    };
  }
  if (i.includes("智") || i.includes("学") || i.includes("wisdom") || i.includes("study")) {
    // Wisdom: "Galaxy" - Deep space stars
    return {
      bg: 'bg-slate-950',
      bgImage: 'url("https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=1920&auto=format&fit=crop")',
      blob1: 'bg-cyan-700',
      blob2: 'bg-indigo-600'
    };
  }
  if (i.includes("工") || i.includes("职") || i.includes("career") || i.includes("job")) {
    // Career: "Modern Architecture" - Looking up at dark blue skyscrapers, abstract
    return {
      bg: 'bg-blue-950',
      bgImage: 'url("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1920&auto=format&fit=crop")',
      blob1: 'bg-blue-600',
      blob2: 'bg-sky-700'
    };
  }
  
  // Default / Peace: "Zen Stones" - Dark, balanced stones in water/mist
  return {
      bg: 'bg-stone-950',
      bgImage: 'url("https://images.unsplash.com/photo-1528722828814-77b9b83aafb2?q=80&w=1920&auto=format&fit=crop")',
      blob1: 'bg-stone-600',
      blob2: 'bg-stone-800' 
  };
};

const App: React.FC = () => {
  // Localization State
  const [lang, setLang] = useState<Language>('zh');
  const t = translations[lang];

  // User State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Global cumulative stats
  const [totalMerit, setTotalMerit] = useState<number>(0);
  
  // Daily stats
  const [todayCount, setTodayCount] = useState<number>(0);
  
  // History Data
  const [history, setHistory] = useState<HistoryRecord>({});

  // UI State
  const [quote, setQuote] = useState<string>("敲击木鱼，静心凝神");
  const [floatingItems, setFloatingItems] = useState<FloatingItem[]>([]);
  const [currentIntention, setCurrentIntention] = useState<string>("求平安");
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  
  // Ambient Theme
  const [theme, setTheme] = useState(getIntentionTheme("求平安"));

  // Use a ref for continuous IDs
  const floatingIdCounter = useRef(0);
  // Ref to debounce API calls slightly if user spams click
  const lastApiCallCount = useRef(0);

  // Load User Info on Mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('zen_current_user');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      } else {
        setIsUserModalOpen(true);
      }
    } catch (e) {
      console.error("Error loading user", e);
      setIsUserModalOpen(true);
    }
    
    // Audio unlock
    const unlockAudio = () => {
      initAudio();
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    }
  }, []);

  // Load Data specific to the User (or Guest)
  useEffect(() => {
    const storageKey = currentUser ? `zen_data_${currentUser.phone}` : 'zen_data_guest';
    const savedDataStr = localStorage.getItem(storageKey);
    
    if (savedDataStr) {
      try {
        const data: UserData = JSON.parse(savedDataStr);
        setTotalMerit(data.merit || 0);
        setHistory(data.history || {});
        
        const today = getTodayDateString();
        if (data.history && data.history[today]) {
          setTodayCount(data.history[today].total);
        } else {
          setTodayCount(0);
        }
      } catch (e) {
        console.error("Failed to parse user data", e);
        setTotalMerit(0);
        setHistory({});
        setTodayCount(0);
      }
    } else {
      setTotalMerit(0);
      setHistory({});
      setTodayCount(0);
    }
  }, [currentUser]);

  // Persist Data whenever it changes
  useEffect(() => {
    const storageKey = currentUser ? `zen_data_${currentUser.phone}` : 'zen_data_guest';
    const dataToSave: UserData = {
      merit: totalMerit,
      history: history
    };
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
  }, [totalMerit, history, currentUser]);

  // Immediately update quote AND THEME when intention changes
  useEffect(() => {
    setQuote(getRandomFallbackQuote(currentIntention, lang));
    setTheme(getIntentionTheme(currentIntention));
  }, [currentIntention, lang]);

  // Handle Logic for updating quote based on milestones
  useEffect(() => {
    if (todayCount > 0 && todayCount !== lastApiCallCount.current) {
      if (todayCount % 10 === 0) {
        setQuote(getRandomFallbackQuote(currentIntention, lang));

        if (todayCount % 30 === 0 && process.env.API_KEY) {
          lastApiCallCount.current = todayCount;
          fetchZenWisdom(todayCount, currentIntention, lang)
            .then(newQuote => {
               setQuote(newQuote);
            })
            .catch(() => {});
        }
      }
    }
  }, [todayCount, currentIntention, lang]);

  const toggleLanguage = () => {
    const newLang = lang === 'zh' ? 'en' : 'zh';
    setLang(newLang);
    // Attempt to map the current intention to the new language
    const mappedIntention = intentionMap[currentIntention];
    if (mappedIntention) {
      setCurrentIntention(mappedIntention);
    }
  };

  const handleKnock = useCallback((event: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    playWoodblockSound();
    setTotalMerit(prev => prev + 1);
    
    const todayStr = getTodayDateString();
    
    setHistory(prev => {
      const todayRecord = prev[todayStr] || { total: 0, intentions: {} };
      const newTotal = todayRecord.total + 1;
      const newIntentions = { ...todayRecord.intentions };
      newIntentions[currentIntention] = (newIntentions[currentIntention] || 0) + 1;

      return {
        ...prev,
        [todayStr]: {
          total: newTotal,
          intentions: newIntentions
        }
      };
    });

    setTodayCount(prev => prev + 1);

    let clientX, clientY;
    if ('touches' in event && (event as React.TouchEvent).touches.length > 0) {
        clientX = (event as React.TouchEvent).touches[0].clientX;
        clientY = (event as React.TouchEvent).touches[0].clientY;
    } else if ((event as React.MouseEvent).clientX) {
        clientX = (event as React.MouseEvent).clientX;
        clientY = (event as React.MouseEvent).clientY;
    } else {
        // Fallback for center if coordinates missing
        clientX = window.innerWidth / 2;
        clientY = window.innerHeight / 2;
    }
    
    const newItem: FloatingItem = {
      id: floatingIdCounter.current++,
      x: clientX,
      y: clientY - 50,
      text: t.floatingMerit
    };

    setFloatingItems(prev => [...prev, newItem]);
  }, [currentIntention, t]);

  const handleFloatingComplete = useCallback((id: number) => {
    setFloatingItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleUserConfirm = (user: User) => {
    const targetKey = `zen_data_${user.phone}`;
    const storedDataStr = localStorage.getItem(targetKey);
    
    let finalMerit = 0;
    let finalHistory: HistoryRecord = {};
    
    if (!currentUser) {
       const guestMerit = totalMerit;
       const guestHistory = history;

       if (storedDataStr) {
         try {
           const targetData: UserData = JSON.parse(storedDataStr);
           finalMerit = (targetData.merit || 0) + guestMerit;
           
           finalHistory = { ...(targetData.history || {}) };
           Object.keys(guestHistory).forEach(date => {
             if (finalHistory[date]) {
               finalHistory[date].total += guestHistory[date].total;
               Object.keys(guestHistory[date].intentions).forEach(intent => {
                 finalHistory[date].intentions[intent] = 
                   (finalHistory[date].intentions[intent] || 0) + guestHistory[date].intentions[intent];
               });
             } else {
               finalHistory[date] = guestHistory[date];
             }
           });
         } catch(e) {
           console.error("Merge error", e);
           finalMerit = guestMerit;
           finalHistory = guestHistory;
         }
       } else {
         finalMerit = guestMerit;
         finalHistory = guestHistory;
       }
    } else {
       if (user.phone === currentUser.phone) {
         finalMerit = totalMerit;
         finalHistory = history;
       } else {
         if (storedDataStr) {
            const d = JSON.parse(storedDataStr);
            finalMerit = d.merit || 0;
            finalHistory = d.history || {};
         } else {
            finalMerit = 0;
            finalHistory = {};
         }
       }
    }

    const newUserData: UserData = { merit: finalMerit, history: finalHistory };
    localStorage.setItem(targetKey, JSON.stringify(newUserData));
    localStorage.setItem('zen_current_user', JSON.stringify(user));
    setCurrentUser(user);
    setIsUserModalOpen(false);
  };

  const handleUserCancel = () => {
    setIsUserModalOpen(false);
  };

  return (
    // Changed: Use h-[100dvh] instead of min-h-screen to fit viewport exactly on mobile
    <div className={`h-[100dvh] flex flex-col items-center py-2 px-4 relative text-stone-200 overflow-hidden`}>
      
      {/* Background Layer: Color Fallback + Image */}
      <div 
        className={`absolute inset-0 z-0 bg-cover bg-center transition-all duration-1000 ${theme.bg}`}
        style={{ 
          backgroundImage: theme.bgImage,
        }}
      />
      
      {/* Dark Overlay for readability */}
      <div className="absolute inset-0 z-0 bg-black/50 transition-colors duration-1000" />

      {/* Ambient Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-30 z-0 mix-blend-overlay">
          <div className={`absolute top-[-10%] left-[-10%] w-96 h-96 ${theme.blob1} rounded-full blur-[100px] animate-blob-breathe transition-colors duration-[2000ms]`} />
          <div className={`absolute bottom-[-10%] right-[-10%] w-96 h-96 ${theme.blob2} rounded-full blur-[100px] animate-blob-breathe transition-colors duration-[2000ms]`} style={{ animationDelay: '2s' }} />
      </div>

      {/* Header - Made more compact */}
      <div className="z-10 w-full max-w-md flex-none mt-2 relative">
        <div className="flex justify-between items-start px-2">
             <div className="flex flex-col items-start">
                <h1 className="text-xl font-light tracking-[0.2em] text-white/90 drop-shadow-md text-shadow-sm">{t.appTitle}</h1>
                {/* Language Toggle */}
                <button 
                  onClick={toggleLanguage}
                  className="mt-1 text-[10px] bg-white/10 hover:bg-white/20 border border-white/20 rounded px-2 py-0.5 text-white/80 transition-colors"
                >
                  {lang === 'zh' ? 'Switch to EN' : '切换中文'}
                </button>
             </div>
             <div className="text-right">
                <span className="text-[10px] text-white/70 tracking-widest block drop-shadow-md text-shadow-sm">{t.totalMerit}</span>
                <span className="text-lg font-mono font-bold text-white drop-shadow-lg text-shadow-sm">{totalMerit}</span>
             </div>
        </div>
        
        <div className="flex justify-center mt-2">
            <div className="flex flex-col items-center">
                <span className="text-[10px] text-white/70 tracking-widest mb-0.5 drop-shadow-md text-shadow-sm">{t.todayMerit}</span>
                <span className="text-5xl font-mono font-bold text-amber-400 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] text-shadow-lg">{todayCount}</span>
            </div>
        </div>
      </div>

      {/* Main Content - Flex-1 to take available space evenly */}
      <div className="z-10 flex-1 flex flex-col items-center justify-evenly w-full max-w-md w-full">
        <IntentionControl 
           currentIntention={currentIntention} 
           onIntentionChange={setCurrentIntention} 
           lang={lang}
           t={t}
        />

        {/* Quote */}
        <div className="w-full flex items-center justify-center px-4 transition-all duration-500 min-h-[40px]">
             <p className="text-sm md:text-base text-center text-white font-serif tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-shadow-md">
               {quote}
             </p>
        </div>

        {/* Wooden Fish Wrapper - Compact padding */}
        <div className="flex items-center justify-center">
             <WoodenFish onKnock={handleKnock} />
        </div>
      </div>

      {/* Footer Controls - Fixed at bottom */}
      <div className="z-10 w-full max-w-md flex-none flex justify-between items-end mb-4 px-4">
         <button 
            onClick={() => setIsStatsOpen(true)}
            className="flex items-center space-x-2 bg-black/30 hover:bg-black/50 px-4 py-2 rounded-full border border-white/10 transition-all hover:border-amber-400/50 group backdrop-blur-md active:scale-95 shadow-lg"
         >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white/80 group-hover:text-amber-400 transition-colors">
               <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <span className="text-xs text-white/80 group-hover:text-white">{t.meritBook}</span>
         </button>

         <button 
            onClick={() => setIsUserModalOpen(true)}
            className="flex items-center space-x-2 bg-black/30 hover:bg-black/50 px-4 py-2 rounded-full border border-white/10 transition-all hover:border-amber-400/50 group backdrop-blur-md active:scale-95 shadow-lg"
         >
             <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-amber-600/80 transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
               </svg>
             </div>
            <span className="text-xs text-white/80 group-hover:text-white max-w-[80px] truncate">
              {currentUser ? currentUser.nickname : t.guest}
            </span>
         </button>
      </div>

      <StatsModal 
        isOpen={isStatsOpen} 
        onClose={() => setIsStatsOpen(false)} 
        history={history}
        t={t}
      />
      
      <UserModal 
        isOpen={isUserModalOpen}
        onClose={handleUserCancel}
        onConfirm={handleUserConfirm}
        initialUser={currentUser}
        t={t}
      />

      {floatingItems.map(item => (
        <FloatingText
          key={item.id}
          id={item.id}
          x={item.x}
          y={item.y}
          text={item.text}
          onComplete={handleFloatingComplete}
        />
      ))}
    </div>
  );
};

export default App;