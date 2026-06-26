import React from 'react';
import { UserProfile, HabitData } from '../types/database.types';
import { motion } from 'motion/react';
import { Activity, Target, Zap } from 'lucide-react';

interface HabitTelemetryProps {
  userProfile: UserProfile | null;
  saveUserProfile: (profile: UserProfile) => void;
}

const HABITS_CONFIG = [
  { id: 'algorithms', label: 'Algorithms Practiced' },
  { id: 'docs', label: 'Docs Synced' },
  { id: 'commits', label: 'Code Committed' },
];

export const HabitTelemetry: React.FC<HabitTelemetryProps> = ({ userProfile, saveUserProfile }) => {
  if (!userProfile) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const numDays = 28; // 7x4 grid
  const daysArray = Array.from({ length: numDays }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (numDays - 1 - i));
    return d.toISOString().split('T')[0];
  });

  // Analytics Calculation
  let last7DaysLogs = 0;
  let totalPossible7Days = 7 * 3; // 21
  let currentStreak = 0;
  let maxStreak = 0;

  // Streak logic (looks at all days up to numDays or until streak breaks? Let's check from today backwards)
  let countingCurrentStreak = true;

  for (let i = numDays - 1; i >= 0; i--) {
    const day = daysArray[i];
    let dayLogCount = 0;
    HABITS_CONFIG.forEach(h => {
      const data = userProfile.habits[h.id as keyof typeof userProfile.habits] as HabitData;
      if (data?.timestamps?.some(ts => ts.startsWith(day))) {
        dayLogCount++;
        // Count for last 7 days (index 21 to 27)
        if (i >= numDays - 7) {
          last7DaysLogs++;
        }
      }
    });

    if (dayLogCount > 0) {
      if (countingCurrentStreak) currentStreak++;
    } else {
      if (countingCurrentStreak && day !== todayStr) {
         // Break streak only if not today (maybe user hasn't logged today yet)
         countingCurrentStreak = false;
      } else if (countingCurrentStreak && day === todayStr) {
         // If it's today and 0 logs, we don't break the streak yet, but we don't increment it.
      }
    }
  }

  // Calculate max streak by iterating forward
  let tempStreak = 0;
  for (let i = 0; i < numDays; i++) {
    const day = daysArray[i];
    let dayLogCount = 0;
    HABITS_CONFIG.forEach(h => {
      const data = userProfile.habits[h.id as keyof typeof userProfile.habits] as HabitData;
      if (data?.timestamps?.some(ts => ts.startsWith(day))) {
        dayLogCount++;
      }
    });
    
    if (dayLogCount > 0) {
      tempStreak++;
      if (tempStreak > maxStreak) maxStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  // Update max streak if needed
  const efficiency = Math.round((last7DaysLogs / totalPossible7Days) * 100) || 0;

  const toggleHabit = (habitId: string) => {
    const data = userProfile.habits[habitId as keyof typeof userProfile.habits] as HabitData;
    const timestamps = [...(data?.timestamps || [])];
    const todayIndex = timestamps.findIndex(ts => ts.startsWith(todayStr));
    
    if (todayIndex >= 0) {
      timestamps.splice(todayIndex, 1);
    } else {
      timestamps.push(new Date().toISOString());
    }

    saveUserProfile({
      ...userProfile,
      habits: {
        ...userProfile.habits,
        [habitId]: {
          ...data,
          timestamps,
        }
      }
    });
  };

  return (
    <div className="w-full flex flex-col gap-6 bg-cyber-black border border-zinc-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800/50 pb-6 relative z-10">
        <div>
          <h2 className="text-lg font-mono font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            TELEMETRY ENGINE
          </h2>
          <p className="text-xs font-mono text-zinc-500 mt-1 uppercase tracking-widest">System Habit Tracking</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Efficiency</span>
              <div className="text-2xl font-mono font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                {efficiency}%
              </div>
            </div>
            <div className="w-px h-10 bg-zinc-800" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Uptime</span>
              <div className="text-2xl font-mono font-bold text-white relative">
                {currentStreak} <span className="text-sm text-zinc-600">D</span>
              </div>
            </div>
            <div className="w-px h-10 bg-zinc-800" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Max Run</span>
              <div className="text-2xl font-mono font-bold text-white">
                {maxStreak} <span className="text-sm text-zinc-600">D</span>
              </div>
            </div>
          </div>

          {(currentStreak >= 7) && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: -5 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-sm border ${
                currentStreak >= 30 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]' 
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
              }`}
            >
              <Zap className="w-3 h-3 animate-pulse" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest">
                {currentStreak >= 30 ? '30-Day Vanguard' : '7-Day Streak'}
              </span>
            </motion.div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6 relative z-10">
        {HABITS_CONFIG.map(habit => {
          const data = userProfile.habits[habit.id as keyof typeof userProfile.habits] as HabitData;
          const timestamps = data?.timestamps || [];
          const isTodayDone = timestamps.some(ts => ts.startsWith(todayStr));

          return (
            <div key={habit.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-lg bg-zinc-900/30 border border-zinc-800/50 hover:border-zinc-700 transition-colors">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <button
                  onClick={() => toggleHabit(habit.id)}
                  className={`w-6 h-6 rounded flex items-center justify-center transition-all duration-300 border ${
                    isTodayDone 
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]' 
                      : 'bg-zinc-800/50 border-zinc-700 text-transparent hover:border-zinc-500'
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                </button>
                <div className="flex flex-col">
                  <span className="text-sm font-mono text-zinc-200">{habit.label}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2 md:mt-0 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                <div className="grid grid-flow-col grid-rows-4 gap-1.5 auto-cols-max">
                  {daysArray.map((day, idx) => {
                    const isDone = timestamps.some(ts => ts.startsWith(day));
                    return (
                      <div
                        key={day}
                        title={day}
                        className={`w-3.5 h-3.5 rounded-[2px] transition-all duration-300 ${
                          isDone
                            ? 'bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                            : 'bg-zinc-800/40'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
