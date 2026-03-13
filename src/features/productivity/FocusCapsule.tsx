"use client";

import React, { useEffect, useState } from 'react';
import { Play, Pause, X, BrainCircuit, CheckSquare } from 'lucide-react';
import { useFocusStore, useHabitsStore } from '../../store';
import confetti from 'canvas-confetti';

export default function FocusCapsule() {
  const { isFocusMode, activeHabitId, stopFocus } = useFocusStore();
  const { habits, toggleHabit } = useHabitsStore();
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes default
  const [isActive, setIsActive] = useState(true);

  const activeHabit = habits.find(h => h.id === activeHabitId);

  // Auto-start and reset when focus springs up
  useEffect(() => {
     if (isFocusMode) {
         setTimeLeft(25 * 60);
         setIsActive(true);
     }
  }, [isFocusMode, activeHabitId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
        setIsActive(false);
        // Play notification sound
        if (activeHabit && !activeHabit.completed) {
            toggleHabit(activeHabit.id);
            confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 },
                colors: ['#06b6d4', '#8b5cf6', '#3b82f6'] // Cyan, Purple, Blue
            });
        }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, activeHabit, toggleHabit]);

  if (!isFocusMode || !activeHabit) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((25 * 60 - timeLeft) / (25 * 60)) * 100;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center animate-in fade-in duration-700">
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900/20 via-transparent to-purple-900/20 pointer-events-none" />
        
        {/* Header */}
        <button onClick={stopFocus} className="absolute top-8 left-8 text-zinc-500 hover:text-white transition-colors flex items-center gap-2">
            <X className="w-6 h-6" /> <span className="font-bold text-xs uppercase tracking-widest">Abortar Neural</span>
        </button>

        <div className="flex flex-col items-center relative z-10 w-full max-w-sm px-6">
            <BrainCircuit className="w-12 h-12 text-cyan-400 mb-6 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] animate-pulse" />
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Cápsula de Imersão</h2>
            <p className="text-xl font-black text-white text-center mb-12">{activeHabit.name}</p>

            {/* Glowing Ring Timer */}
            <div className="relative w-64 h-64 mb-12 flex items-center justify-center">
                {/* SVG Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="128" cy="128" r="120" stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="none" />
                    <circle cx="128" cy="128" r="120" stroke="url(#cyan-glow)" strokeWidth="6" fill="none" 
                            strokeDasharray="753" strokeDashoffset={753 - (753 * progress) / 100} 
                            className="transition-all duration-1000 ease-linear shadow-[0_0_20px_#06b6d4]" />
                    <defs>
                        <linearGradient id="cyan-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#06b6d4" />
                            <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                    </defs>
                </svg>
                
                {/* Time Display */}
                <div className="text-center font-mono">
                    <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-cyan-100 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                       {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                    </span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-6 w-full">
                <button onClick={() => setIsActive(!isActive)} className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md hover:bg-white/20 hover:scale-110 active:scale-95 transition-all shadow-lg">
                    {isActive ? <Pause className="w-8 h-8 text-white fill-current" /> : <Play className="w-8 h-8 text-white fill-current ml-1" />}
                </button>
                {timeLeft === 0 && (
                   <button onClick={() => { stopFocus(); }} className="w-16 h-16 rounded-full bg-cyan-500 border border-cyan-400 flex items-center justify-center backdrop-blur-md hover:bg-cyan-400 hover:scale-110 active:scale-95 transition-all shadow-[0_0_25px_rgba(34,211,238,0.5)]">
                       <CheckSquare className="w-8 h-8 text-black" />
                   </button>
                )}
            </div>
            
            <p className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest mt-12 text-center w-full">Bloqueio de sistema ativo.<br/>Mantenha seu foco apenas na Tarefa.</p>
        </div>
    </div>
  );
}
