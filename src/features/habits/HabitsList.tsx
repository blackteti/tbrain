"use client";

import React, { useState } from 'react';
import { Flame, Check, Activity, Plus, Trash2, Play } from 'lucide-react';
import { useHabitsStore, Habit, useFocusStore } from '../../store';

export default function HabitsList() {
  const { habits, toggleHabit, addHabit, deleteHabit } = useHabitsStore();
  const { startFocus } = useFocusStore();
  
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitType, setNewHabitType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const [newHabitUrgency, setNewHabitUrgency] = useState<'HIGH' | 'NORMAL'>('NORMAL');
  const [activeTab, setActiveTab] = useState<'DAILY' | 'LONG_TERM'>('DAILY');
  const [newDeadline, setNewDeadline] = useState('');

  const handleToggle = async (id: number | string) => {
      const justCompleted = await toggleHabit(id);
      if (justCompleted) {
          // Lazy loading canvas-confetti to drop heavy dependency from initial load
          const confetti = (await import('canvas-confetti')).default;
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#06b6d4', '#8b5cf6', '#10b981'],
            disableForReducedMotion: true
          });
      }
  };

  const handleAddHabit = () => {
      if (newHabitName.trim()) {
          addHabit(newHabitName.trim(), newHabitType, newHabitUrgency, newDeadline || undefined);
          setNewHabitName('');
          setNewDeadline('');
      }
  };

  // Metrics (Including all for stats, but viewing only uncompleted)
  const dailyHabits = habits.filter(h => h.type === 'DAILY');
  const longTermHabits = habits.filter(h => h.type !== 'DAILY');
  const completedDaily = dailyHabits.filter(h => h.completed).length;
  const progressDaily = dailyHabits.length > 0 ? (completedDaily / dailyHabits.length) * 100 : 0;
  
  const displayedHabits = (activeTab === 'DAILY' ? dailyHabits : longTermHabits).filter(h => !h.completed);

  return (
    <div className="pb-24 animate-in fade-in slide-in-from-bottom-5 duration-700">
      
      {/* Header Overview */}
      <div className="flex justify-between items-end mb-8 relative z-10">
        <div className="flex-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 drop-shadow-sm mb-1">Metas TScript</h2>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Progresso do Dia: {completedDaily}/{dailyHabits.length}</p>
          <div className="h-1.5 w-full max-w-[200px] bg-black/60 rounded-full overflow-hidden mt-3 shadow-inner">
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-1000 shadow-[0_0_15px_rgba(56,189,248,0.6)]" style={{ width: `${progressDaily}%` }} />
          </div>
        </div>
        <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-2 border-emerald-500/30 bg-emerald-950/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
           <Activity className="w-4 h-4 text-emerald-400" />
           <span className="text-sm font-bold text-emerald-50">+{(completedDaily * 10)}xp</span>
        </div>
      </div>

      {/* Add New Goal */}
      <div className="glass-panel rounded-[2rem] p-6 mb-8 relative overflow-hidden flex flex-col gap-4 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none"></div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 relative z-10">Mapear Nova Diretriz</h3>
          <input 
             value={newHabitName}
             onChange={(e) => setNewHabitName(e.target.value)}
             placeholder="Ex: Treinar 1h..."
             className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3.5 text-sm font-medium text-white shadow-inner focus:outline-none focus:border-tscript-accent/50 focus:bg-white/5 transition-all relative z-10"
          />
          <div className="flex gap-3 relative z-10 font-bold">
             <select 
                value={newHabitType}
                onChange={(e) => setNewHabitType(e.target.value as any)}
                className="bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-zinc-300 shadow-inner focus:outline-none appearance-none"
             >
                <option value="DAILY">Diária</option>
                <option value="WEEKLY">Semanal</option>
                <option value="MONTHLY">Mensal</option>
             </select>
             <select 
                value={newHabitUrgency}
                onChange={(e) => setNewHabitUrgency(e.target.value as any)}
                className={`border rounded-xl px-4 py-3 text-sm font-bold shadow-inner focus:outline-none appearance-none transition-colors ${newHabitUrgency === 'HIGH' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'}`}
             >
                <option value="NORMAL" className="bg-black text-emerald-500">Normal</option>
                <option value="HIGH" className="bg-black text-red-500">Urgente</option>
             </select>
             <button onClick={handleAddHabit} className="flex-1 bg-cyan-500/10 text-cyan-400 font-bold tracking-wide border border-cyan-500/30 rounded-xl px-4 py-3 hover:bg-cyan-500/20 active:scale-95 transition-all flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.1)] hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                 <Plus className="w-5 h-5" strokeWidth={3} /> Injetar
             </button>
          </div>
          <input
             type="time"
             value={newDeadline}
             onChange={(e) => setNewDeadline(e.target.value)}
             className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs font-medium text-zinc-400 shadow-inner focus:outline-none focus:border-cyan-500/50 transition-all relative z-10"
             placeholder="Horário limite (opcional)"
          />
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-4 bg-black/40 p-1.5 rounded-2xl border border-white/5 shadow-inner">
          <button 
             onClick={() => setActiveTab('DAILY')}
             className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'DAILY' ? 'bg-white/10 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
             Foco de Hoje
          </button>
          <button 
             onClick={() => setActiveTab('LONG_TERM')}
             className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'LONG_TERM' ? 'bg-white/10 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
             Longo Prazo
          </button>
      </div>
      
      {/* Dynamic List */}
      <div className="space-y-4">
        {displayedHabits.length === 0 && (
            <div className="text-center py-10 bg-white/[0.02] border border-white/5 rounded-[2rem]">
                <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">Nada pendente no escopo.</p>
            </div>
        )}
        
        {displayedHabits.map(habit => (
            <div 
               key={habit.id}
               className={`
                 relative flex items-center justify-between p-5 rounded-2xl cursor-pointer
                 transition-all duration-300 overflow-hidden group hover:-translate-y-1
                 glass-panel hover:bg-white/[0.03]
                 ${habit.urgency === 'HIGH' ? 'border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.05)]' : 'border-white/5'}
               `}
            >
               {habit.urgency === 'HIGH' && (
                   <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[40px] pointer-events-none"></div>
               )}

               <div className="flex items-center gap-4 z-10 w-full" onClick={() => handleToggle(habit.id)}>
                   <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 flex-shrink-0 bg-black/50 border border-white/10 group-hover:border-cyan-500/50 text-transparent shadow-inner">
                       <Check className="w-5 h-5 transition-transform duration-300 scale-50 opacity-0" strokeWidth={3} />
                   </div>
                   
                   <div className="flex flex-col">
                       <span className="text-[17px] font-medium transition-all duration-300 text-zinc-200">
                           {habit.name}
                       </span>
                       <span className={`text-[10px] font-bold tracking-wider uppercase ${habit.urgency === 'HIGH' ? 'text-red-400 animate-pulse' : 'text-zinc-500'}`}>
                           {habit.urgency === 'HIGH' ? 'CRÍTICO • ' : ''}
                           {habit.type === 'DAILY' ? 'Diária' : habit.type === 'WEEKLY' ? 'Semanal' : 'Mensal'}
                       </span>
                   </div>
               </div>
               
               <div className="flex items-center gap-2 z-10">
                   <button onClick={(e) => { e.stopPropagation(); startFocus(habit.id); }} title="Cápsula Neural" className="p-2 bg-cyan-500/10 text-cyan-400 rounded-full hover:bg-cyan-500/20 transition-all border border-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.1)] hover:scale-110">
                       <Play className="w-4 h-4 fill-current ml-0.5" />
                   </button>
                   <div className={`
                     flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors
                     ${habit.urgency === 'HIGH' ? 'bg-red-500/10 border-red-500/30' : habit.streak >= 3 ? 'bg-orange-500/10 border-orange-500/30' : 'bg-white/5 border-white/5'}
                   `}>
                       {habit.urgency === 'HIGH' ? (
                           <><Flame className="w-4 h-4 text-red-500 animate-pulse" /><Flame className="w-4 h-4 -ml-2.5 text-red-400 animate-pulse" /></>
                       ) : (
                           <Flame className={`w-4 h-4 ${habit.streak >= 3 ? 'text-orange-500 animate-pulse' : 'text-zinc-500'}`} />
                       )}
                       <span className={`text-sm font-bold ${habit.urgency === 'HIGH' ? 'text-red-200' : habit.streak >= 3 ? 'text-orange-100' : 'text-zinc-400'}`}>{habit.streak}</span>
                   </div>
                   <button onClick={(e) => { e.stopPropagation(); deleteHabit(habit.id); }} className="p-2 bg-red-500/10 text-red-400 rounded-full hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-all border border-red-500/20">
                       <Trash2 className="w-4 h-4" />
                   </button>
               </div>
            </div>
        ))}
      </div>
    </div>
  );
}
