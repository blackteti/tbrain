"use client";

import React, { useState } from 'react';
import { useSavingsStore } from '../../store';
import { Target, Plus, Trash2, ArrowUpRight, Sparkles } from 'lucide-react';

export default function SavingsVault() {
  const { goals, addGoal, depositToGoal, deleteGoal } = useSavingsStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [target, setTarget] = useState('');
  const [depositAmounts, setDepositAmounts] = useState<Record<string, string>>({});

  const handleAdd = () => {
    if (name.trim() && Number(target) > 0) {
      addGoal(name.trim(), emoji, Number(target));
      setName(''); setEmoji('🎯'); setTarget('');
      setShowForm(false);
    }
  };

  const handleDeposit = (id: string) => {
    const amount = Number(depositAmounts[id] || 0);
    if (amount > 0) {
      depositToGoal(id, amount);
      setDepositAmounts(prev => ({ ...prev, [id]: '' }));
    }
  };

  const emojiOptions = ['🎯', '✈️', '🏠', '🚗', '📱', '💻', '🎓', '💍', '🏖️', '🎸'];

  return (
    <div className="mt-8 relative">
      <div className="absolute -top-4 -left-4 w-40 h-40 bg-amber-500/5 blur-[40px] rounded-full pointer-events-none"></div>
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/10 p-2.5 rounded-2xl border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="text-sm font-bold tracking-wider uppercase text-zinc-400">Cofres de Sonhos</h3>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 border border-white/10 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-1">
          <Plus className="w-3 h-3" /> Novo Sonho
        </button>
      </div>

      {showForm && (
        <div className="glass-panel rounded-2xl p-5 mb-6 space-y-3 border border-amber-500/20 bg-amber-500/5">
          <div className="flex gap-2 flex-wrap">
            {emojiOptions.map(e => (
              <button key={e} onClick={() => setEmoji(e)} className={`text-xl p-1 rounded-lg transition-all ${emoji === e ? 'bg-amber-500/30 scale-125' : 'bg-white/5 hover:bg-white/10'}`}>{e}</button>
            ))}
          </div>
          <input type="text" placeholder="Nome do sonho (Ex: Viagem Europa)" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50" />
          <div className="flex gap-2">
            <input type="number" placeholder="Meta total (R$)" value={target} onChange={e => setTarget(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50" />
            <button onClick={handleAdd} className="bg-amber-500/20 text-amber-400 font-bold text-xs uppercase tracking-widest px-5 py-2.5 rounded-xl border border-amber-500/30 hover:bg-amber-500/30 transition-colors">Criar</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {goals.map(goal => {
          const pct = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
          const isComplete = pct >= 100;
          return (
            <div key={goal.id} className={`glass-panel rounded-2xl p-5 border transition-all group ${isComplete ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5 hover:border-amber-500/20'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{goal.emoji}</span>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-200">{goal.name}</h4>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      R$ {goal.currentAmount.toFixed(0)} / R$ {goal.targetAmount.toFixed(0)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-black ${isComplete ? 'text-emerald-400' : 'text-amber-400'}`}>{pct.toFixed(0)}%</span>
                  <button onClick={() => deleteGoal(goal.id)} className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              {/* Progress Cylinder */}
              <div className="h-3 w-full bg-black/60 rounded-full overflow-hidden shadow-inner mb-3">
                <div 
                  className={`h-full transition-all duration-1000 ease-out rounded-full relative ${isComplete ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.6)]' : 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]'}`}
                  style={{ width: `${pct}%` }}
                >
                  <div className="absolute top-0 right-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent to-white/30 rounded-full" />
                </div>
              </div>

              {!isComplete && (
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    placeholder="+ R$" 
                    value={depositAmounts[goal.id] || ''} 
                    onChange={e => setDepositAmounts(prev => ({ ...prev, [goal.id]: e.target.value }))}
                    className="flex-1 bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                  />
                  <button onClick={() => handleDeposit(goal.id)} className="bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-xl border border-amber-500/20 hover:bg-amber-500/20 transition-colors flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" /> Depositar
                  </button>
                </div>
              )}
              {isComplete && (
                <div className="text-center text-xs font-bold text-emerald-400 uppercase tracking-widest animate-pulse">🎉 Sonho Conquistado!</div>
              )}
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
            <Sparkles className="w-7 h-7 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Sem sonhos cadastrados. Clique "Novo Sonho" acima.</p>
          </div>
        )}
      </div>
    </div>
  );
}
