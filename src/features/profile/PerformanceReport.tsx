"use client";

import React from 'react';
import { useFinanceStore, useHabitsStore, useVaultStore } from '../../store';
import { TrendingUp, TrendingDown, Activity, Award, AlertTriangle, Shield } from 'lucide-react';

export default function PerformanceReport() {
  const { monthlyIncome, monthlySpent, fixedCosts } = useFinanceStore();
  const { habits } = useHabitsStore();
  const { items } = useVaultStore();

  // Metrics
  const totalHabits = habits.length;
  const completedHabits = habits.filter(h => h.completed).length;
  const urgentPending = habits.filter(h => h.urgency === 'HIGH' && !h.completed).length;
  const habitScore = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

  const totalFixedMonthly = fixedCosts.reduce((sum, c) => sum + c.installmentAmount, 0);
  const availableAfterFixed = monthlyIncome - totalFixedMonthly;
  const savingsRate = monthlyIncome > 0 ? Math.max(0, Math.round(((monthlyIncome - monthlySpent - totalFixedMonthly) / monthlyIncome) * 100)) : 0;
  const financeScore = savingsRate > 20 ? 100 : Math.round(savingsRate * 5);

  const vaultItems = items.length;
  const pendingReminders = items.filter(i => i.type === 'REMINDER' && !i.completed).length;

  // TBrain Score (weighted)
  const tbrainScore = Math.round(habitScore * 0.5 + financeScore * 0.4 + Math.min(vaultItems * 5, 10) * 1);
  const scoreColor = tbrainScore >= 80 ? 'text-emerald-400' : tbrainScore >= 50 ? 'text-amber-400' : 'text-red-400';
  const scoreGlow = tbrainScore >= 80 ? 'shadow-[0_0_30px_rgba(16,185,129,0.4)]' : tbrainScore >= 50 ? 'shadow-[0_0_30px_rgba(245,158,11,0.4)]' : 'shadow-[0_0_30px_rgba(239,68,68,0.4)]';
  const scoreLabel = tbrainScore >= 80 ? 'Excelente' : tbrainScore >= 60 ? 'Bom' : tbrainScore >= 40 ? 'Precisa Melhorar' : 'Crítico';

  return (
    <div className="mt-8">
      {/* Score Hero Card */}
      <div className="glass-panel rounded-[2rem] p-8 mb-6 relative overflow-hidden text-center border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-60 h-40 bg-indigo-500/10 blur-[60px] rounded-full pointer-events-none"></div>
        
        <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500 mb-4 relative z-10">Nota TBrain do Mês</h3>
        
        <div className={`text-7xl font-black ${scoreColor} relative z-10 mb-2 drop-shadow-lg`}>
          {tbrainScore}
        </div>
        <div className={`inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border ${scoreGlow} relative z-10 ${tbrainScore >= 80 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : tbrainScore >= 50 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
          {scoreLabel}
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <MetricCard 
          icon={<Activity className="w-4 h-4 text-cyan-400" />}
          label="Metas"
          value={`${completedHabits}/${totalHabits}`}
          sub={`${habitScore}% concluídas`}
          accent="cyan"
        />
        <MetricCard 
          icon={<Shield className="w-4 h-4 text-blue-400" />}
          label="Taxa Poupança"
          value={`${savingsRate}%`}
          sub={savingsRate > 20 ? 'Patrimônio seguro' : 'Risco alto'}
          accent="blue"
        />
        <MetricCard 
          icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
          label="Receita"
          value={`R$ ${monthlyIncome.toFixed(0)}`}
          sub="Este mês"
          accent="emerald"
        />
        <MetricCard 
          icon={<TrendingDown className="w-4 h-4 text-rose-400" />}
          label="Gastos"
          value={`R$ ${(monthlySpent + totalFixedMonthly).toFixed(0)}`}
          sub={`Fixos: R$ ${totalFixedMonthly.toFixed(0)}`}
          accent="rose"
        />
      </div>

      {/* Alerts */}
      {urgentPending > 0 && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-3">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-xs font-semibold text-red-200">{urgentPending} meta{urgentPending > 1 ? 's' : ''} urgente{urgentPending > 1 ? 's' : ''} não concluída{urgentPending > 1 ? 's' : ''}. Custos de oportunidade acumulando.</span>
        </div>
      )}
      {pendingReminders > 0 && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
          <Award className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-amber-200">{pendingReminders} lembrete{pendingReminders > 1 ? 's' : ''} pendente{pendingReminders > 1 ? 's' : ''} no Cofre Neural.</span>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, sub, accent }: { icon: React.ReactNode, label: string, value: string, sub: string, accent: string }) {
  return (
    <div className="glass-panel p-4 rounded-2xl border border-white/5 hover:bg-white/[0.03] transition-all">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</span>
      </div>
      <div className="text-lg font-black text-white">{value}</div>
      <span className="text-[10px] text-zinc-500 font-medium">{sub}</span>
    </div>
  );
}
