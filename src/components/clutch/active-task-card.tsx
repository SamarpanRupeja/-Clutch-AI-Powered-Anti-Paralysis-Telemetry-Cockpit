/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ShieldAlert, Zap, Terminal, Maximize2, CheckCircle2, Trash2 } from "lucide-react";
import { Task } from "../../types/database.types";

interface ActiveTaskCardProps {
  task: Task;
  onOpenWorkspace?: (taskId: string) => void;
  onToggleStatus?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  isHero?: boolean;
}

export const ActiveTaskCard: React.FC<ActiveTaskCardProps> = ({
  task,
  onOpenWorkspace,
  onToggleStatus,
  onDeleteTask,
  isHero = false,
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: string;
    minutes: string;
    seconds: string;
    totalMs: number;
    isOverdue: boolean;
  }>({ hours: "00", minutes: "00", seconds: "00", totalMs: 0, isOverdue: false });

  useEffect(() => {
    if (task.status === "completed") return;
    const interval = setInterval(() => {
      const diff = new Date(task.deadline).getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeLeft({ hours: "00", minutes: "00", seconds: "00", totalMs: 0, isOverdue: true });
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({
          hours: hours.toString().padStart(2, "0"),
          minutes: minutes.toString().padStart(2, "0"),
          seconds: seconds.toString().padStart(2, "0"),
          totalMs: diff,
          isOverdue: false,
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [task.deadline, task.status]);

  const priorityScore = task.priority_score;
  const isCritical = priorityScore >= 80;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-xl border bg-terminal-zinc backdrop-blur-md p-6 ${
        task.collision_warning 
          ? "border-warning-amber/40 shadow-[0_0_20px_rgba(255,159,10,0.1)]" 
          : isCritical && task.status !== "completed" 
            ? "border-glitch-red/50 shadow-[0_0_30px_rgba(255,59,48,0.1)]" 
            : "border-panel-border"
      } ${isHero ? "ring-1 ring-[#ff9f0a]/20 bg-terminal-zinc/80" : ""}`}
    >
      {/* Decorative top pulse if critical */}
      {isCritical && task.status !== "completed" && !task.collision_warning && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-glitch-red to-transparent animate-pulse" />
      )}
      
      {/* Decorative top pulse for collision warning */}
      {task.collision_warning && task.status !== "completed" && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-warning-amber to-transparent animate-pulse" />
      )}

      <div className="flex flex-col sm:flex-row justify-between gap-6">
        {/* Left Side: Title & Status */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            {task.status === "completed" ? (
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-tactical-emerald bg-tactical-emerald/10 border border-tactical-emerald/30 px-2 py-0.5 rounded">
                COMPLETED
              </span>
            ) : task.collision_warning ? (
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-warning-amber bg-warning-amber/10 border border-warning-amber/30 px-2 py-0.5 rounded flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" /> SCHEDULE CONFLICT
              </span>
            ) : isCritical ? (
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-glitch-red bg-glitch-red/10 border border-glitch-red/30 px-2 py-0.5 rounded flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" /> TRIAGE {priorityScore}%
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-warning-amber bg-warning-amber/10 border border-warning-amber/30 px-2 py-0.5 rounded flex items-center gap-1">
                <Zap className="h-3 w-3" /> ACTIVE {priorityScore}%
              </span>
            )}
          </div>
          
          <h3 className={`text-xl font-semibold tracking-tight text-fg-primary ${task.status === "completed" ? "line-through opacity-50" : ""}`}>
            {task.title}
          </h3>
          
          {task.shadow_artifacts?.context_summary && (
            <p className="mt-2 text-sm text-fg-secondary leading-relaxed line-clamp-2">
              {task.shadow_artifacts.context_summary}
            </p>
          )}

          {task.collision_warning && task.status !== "completed" && (
            <div className="mt-4 p-3 bg-warning-amber/10 border border-warning-amber/20 rounded-lg flex gap-3 text-warning-amber items-start">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-xs font-mono leading-relaxed">{task.collision_warning}</p>
            </div>
          )}

          {/* Progress Bar */}
          {(() => {
            const checklist = task.shadow_artifacts?.checklist || [];
            if (checklist.length === 0) return null;
            const completedCount = checklist.filter(c => c.completed).length;
            const percent = Math.round((completedCount / checklist.length) * 100);
            
            return (
              <div className="mt-5">
                <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">
                  <span>Progress</span>
                  <span className={percent === 100 ? "text-tactical-emerald" : ""}>{percent}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={`h-full rounded-full ${percent === 100 ? 'bg-tactical-emerald' : isCritical ? 'bg-warning-amber' : 'bg-[#00ffd2]'}`}
                  />
                </div>
              </div>
            );
          })()}
        </div>

        {/* Right Side: Clock & Actions */}
        <div className="flex flex-col items-end justify-between min-w-[220px] sm:border-l border-panel-border/50 sm:pl-6">
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-widest block mb-1">Countdown</span>
            {task.status === "completed" ? (
              <div className="font-mono text-2xl text-tactical-emerald">--:--:--</div>
            ) : (
              <div className={`font-mono text-3xl font-bold tracking-tight ${
                timeLeft.isOverdue ? "text-glitch-red animate-pulse" : isCritical ? "text-warning-amber" : "text-[#00ffd2]"
              }`}>
                {timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-5 w-full justify-end">
            {onToggleStatus && (
              <button
                onClick={() => onToggleStatus(task.id)}
                className={`p-2.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                  task.status === "completed"
                    ? "bg-tactical-emerald/10 border-tactical-emerald text-tactical-emerald"
                    : "bg-zinc-950 border-panel-border text-zinc-400 hover:text-tactical-emerald hover:border-tactical-emerald/50"
                }`}
                title="Toggle Status"
              >
                <CheckCircle2 className="h-4 w-4" />
              </button>
            )}

            {onDeleteTask && (
              <button
                onClick={() => onDeleteTask(task.id)}
                className="p-2.5 rounded-lg border bg-zinc-950 border-panel-border text-zinc-400 hover:text-glitch-red hover:border-glitch-red/50 transition-all duration-200 cursor-pointer"
                title="Delete Objective"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            
            {onOpenWorkspace && (
              <button
                onClick={() => onOpenWorkspace(task.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#ffffff] text-[#030303] hover:bg-[#e4e4e7] transition-colors font-mono font-bold text-[10px] uppercase tracking-widest cursor-pointer"
              >
                <Terminal className="h-3.5 w-3.5" />
                WORKSPACE
                <Maximize2 className="h-3 w-3 opacity-50 ml-1" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
