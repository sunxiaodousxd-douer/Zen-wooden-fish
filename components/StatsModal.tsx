import React, { useMemo } from 'react';

interface DailyRecord {
  total: number;
  intentions: Record<string, number>;
}

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: Record<string, DailyRecord>;
  t: any;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, history, t }) => {
  if (!isOpen) return null;

  // Process data for the last 30 days
  const { chartData, intentionStats, totalKnocks30Days, activeDays } = useMemo(() => {
    const today = new Date();
    const dates = [];
    let totalKnocks = 0;
    let active = 0;
    const iStats: Record<string, number> = {};

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
      const record = history[dateStr];
      
      const count = record ? record.total : 0;
      dates.push({ date: dateStr, count, day: d.getDate() });
      
      if (count > 0) active++;
      totalKnocks += count;

      if (record?.intentions) {
        Object.entries(record.intentions).forEach(([intent, val]) => {
          iStats[intent] = (iStats[intent] || 0) + (val as number);
        });
      }
    }

    // Sort intentions by count
    const sortedIntentions = Object.entries(iStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5); // Top 5

    return { chartData: dates, intentionStats: sortedIntentions, totalKnocks30Days: totalKnocks, activeDays: active };
  }, [history]);

  const maxCount = Math.max(...chartData.map(d => d.count), 10); // Scale logic

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl p-6 animate-slide-up flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl text-stone-200 font-serif tracking-widest">{t.statsTitle}</h2>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-300 text-2xl leading-none">&times;</button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-stone-800 p-4 rounded-xl text-center">
            <div className="text-3xl text-amber-500 font-mono font-bold">{totalKnocks30Days}</div>
            <div className="text-xs text-stone-500 mt-1">{t.total30Days}</div>
          </div>
          <div className="bg-stone-800 p-4 rounded-xl text-center">
            <div className="text-3xl text-stone-300 font-mono font-bold">{activeDays}</div>
            <div className="text-xs text-stone-500 mt-1">{t.activeDays}</div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="mb-2 text-xs text-stone-500 uppercase tracking-widest">{t.dailyTrend}</div>
        <div className="flex items-end space-x-1 h-32 mb-8 pt-4 border-b border-stone-800 pb-2 overflow-x-auto">
          {chartData.map((d, i) => (
            <div key={d.date} className="flex-1 min-w-[8px] flex flex-col justify-end items-center group relative">
              <div 
                className="w-full bg-stone-700 hover:bg-amber-600 transition-colors rounded-t-sm"
                style={{ height: `${(d.count / maxCount) * 100}%` }}
              />
              {/* Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-stone-800 text-xs px-2 py-1 rounded border border-stone-700 whitespace-nowrap z-10 pointer-events-none transition-opacity">
                {d.date}: {d.count}
              </div>
            </div>
          ))}
        </div>

        {/* Intention Stats */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="mb-2 text-xs text-stone-500 uppercase tracking-widest">{t.intentionDist}</div>
          <div className="flex-1 overflow-y-auto stats-scroll space-y-3">
             {intentionStats.length === 0 ? (
               <div className="text-stone-600 text-center py-4 italic">{t.noRecords}</div>
             ) : (
               intentionStats.map(([intent, val]) => (
                 <div key={intent} className="flex items-center justify-between text-sm">
                   <div className="flex items-center space-x-2">
                     <span className="w-2 h-2 rounded-full bg-amber-600/70"></span>
                     <span className="text-stone-300">{intent}</span>
                   </div>
                   <div className="flex items-center space-x-4">
                      {/* Simple bar */}
                      <div className="w-24 h-1.5 bg-stone-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-600/50" 
                          style={{ width: `${(val / totalKnocks30Days) * 100}%` }}
                        />
                      </div>
                      <span className="text-stone-500 font-mono w-8 text-right">{val}</span>
                   </div>
                 </div>
               ))
             )}
          </div>
        </div>

      </div>
    </div>
  );
};