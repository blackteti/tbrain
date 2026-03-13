"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
const SavingsVault = dynamic(() => import('./SavingsVault'), { ssr: false });
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { useFinanceStore } from '../../store';
import { ArrowUpRight, ArrowDownRight, Activity, Wallet, Target, Plus, Minus, Layers, Trash2 } from 'lucide-react';

const mockDailyData = [
  { name: 'Seg', amount: 45 },
  { name: 'Ter', amount: 120 },
  { name: 'Qua', amount: 35 },
  { name: 'Qui', amount: 80 },
  { name: 'Sex', amount: 210 },
  { name: 'Sáb', amount: 15 },
  { name: 'Dom', amount: 60 },
];

export default function FinanceReport() {
  const { spentToday, dailyLimit, monthlyIncome, monthlySpent, addTransaction, deleteTransaction, setMonthlyIncome, cycleStartDay, setCycleStartDay, fixedCosts, addFixedCost, deleteFixedCost, transactions } = useFinanceStore();
  const [activeTab, setActiveTab] = useState('overview');
  
  const [amountInput, setAmountInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [tempIncome, setTempIncome] = useState(monthlyIncome.toString());
  const [tempCycle, setTempCycle] = useState(cycleStartDay.toString());

  // Form states for Fixed Costs
  const [showFixedCostForm, setShowFixedCostForm] = useState(false);
  const [fixedName, setFixedName] = useState('');
  const [fixedAmount, setFixedAmount] = useState('');
  const [fixedInstallments, setFixedInstallments] = useState('1');
  const [fixedDueDate, setFixedDueDate] = useState('5');

  const totalFixed = fixedCosts.reduce((acc, c) => acc + c.installmentAmount, 0);
  const availableMonthly = monthlyIncome - totalFixed;
  const budgetHealth = dailyLimit > 0 ? ((dailyLimit - spentToday) / dailyLimit) * 100 : 0;
  const isHealthy = budgetHealth > 20;

  // Calculate days left
  const now = new Date();
  const currentDay = now.getDate();
  let nextCycleDate = new Date(now.getFullYear(), now.getMonth(), cycleStartDay);
  if (currentDay >= cycleStartDay) {
      nextCycleDate = new Date(now.getFullYear(), now.getMonth() + 1, cycleStartDay);
  }
  const diffTime = nextCycleDate.getTime() - now.getTime();
  const daysLeft = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const handleAddTransaction = (type: 'income' | 'expense') => {
      const val = parseFloat(amountInput);
      if (!isNaN(val) && val > 0) {
          addTransaction(val, type);
          setAmountInput('');
      }
  };

  const handleAddFixedCost = () => {
      const val = parseFloat(fixedAmount);
      const inst = parseInt(fixedInstallments);
      const due = parseInt(fixedDueDate);
      if (fixedName.trim() && !isNaN(val) && val > 0 && !isNaN(inst) && inst > 0 && !isNaN(due)) {
          addFixedCost({
              name: fixedName,
              totalAmount: val,
              installmentAmount: val / inst,
              totalInstallments: inst,
              paidInstallments: 0,
              dueDate: due
          });
          setShowFixedCostForm(false);
          setFixedName(''); setFixedAmount(''); setFixedInstallments('1'); setFixedDueDate('5');
      }
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-5 duration-700">
      
      {/* Header Overview */}
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-3">
          <img src="/tbrain-logo.png" alt="TBrain" className="w-10 h-10 rounded-xl shadow-[0_0_12px_rgba(56,189,248,0.2)]" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Finanças</h1>
            <p className="text-sm text-zinc-400">Fluxo: Mês {new Date().getMonth() + 1}</p>
          </div>
        </div>
        <button 
           onClick={() => { setTempIncome(monthlyIncome.toString()); setTempCycle(cycleStartDay.toString()); setShowSettings(!showSettings); }}
           className="glass-panel p-2.5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors"
        >
            <Activity className="w-5 h-5 text-zinc-400" />
        </button>
      </div>

      {/* Monthly Budget Setup & Settings */}
      {(monthlyIncome === 0 || showSettings) && (
          <div className="glass-panel rounded-[2rem] p-6 border border-emerald-500/30 bg-emerald-950/10 shadow-lg animate-in fade-in zoom-in-95 duration-300">
              <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2">
                 <Target className="w-4 h-4"/> Configuração de Ciclo
              </h3>
              <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider pl-1">Renda Mensal (R$)</label>
                      <input 
                         type="number" 
                         value={tempIncome}
                         onChange={(e) => setTempIncome(e.target.value)}
                         placeholder="Ex: 5000" 
                         className="bg-zinc-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 shadow-inner"
                      />
                  </div>
                  <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider pl-1">Dia Início Ciclo</label>
                      <input 
                         type="number" 
                         min="1" max="31"
                         value={tempCycle}
                         onChange={(e) => setTempCycle(e.target.value)}
                         className="bg-zinc-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 shadow-inner text-center"
                      />
                  </div>
              </div>
              <button 
                 disabled={isSyncing}
                 onClick={async () => {
                     const incomeVal = parseFloat(tempIncome);
                     const cycleVal = parseInt(tempCycle);
                     
                     if (isNaN(incomeVal) || isNaN(cycleVal)) {
                         alert('Por favor, insira valores válidos.');
                         return;
                     }

                     setIsSyncing(true);
                     try {
                         await setMonthlyIncome(incomeVal);
                         await setCycleStartDay(cycleVal);
                         setShowSettings(false);
                         alert('Dados sincronizados com sucesso! ✨');
                     } catch (err) {
                         console.error(err);
                         alert('Erro ao sincronizar. Verifique se as tabelas do Supabase foram criadas.');
                     } finally {
                         setIsSyncing(false);
                     }
                 }}
                 className={`w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] ${isSyncing ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'}`}
              >
                  {isSyncing ? (
                      <>
                          <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                          Sincronizando...
                      </>
                  ) : 'Sincronizar Protocolo Financeiro'}
              </button>
          </div>
      )}

      {/* Primary Hero Card - Monthly Overview */}
      <div className="glass-panel rounded-[2rem] p-7 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-500 w-full shadow-lg">
         {/* Deep Spatial Glow */}
         <div className="absolute -top-24 -right-24 w-60 h-60 bg-primary/10 blur-[60px] rounded-full group-hover:bg-primary/20 transition-colors duration-700 pointer-events-none"></div>
         
         <div className="flex justify-between items-start mb-8 relative z-10">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center shadow-inner backdrop-blur-xl">
                   <Wallet className="w-6 h-6 text-zinc-300" />
               </div>
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Disponibilidade Real do Mês</h3>
                  <div className="flex items-baseline gap-2">
                     <span className={`text-[42px] font-extrabold tracking-tighter leading-none ${availableMonthly >= 0 ? 'text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-400 drop-shadow-sm' : 'text-transparent bg-clip-text bg-gradient-to-br from-red-400 to-red-600 drop-shadow-sm'}`}>
                         R$ {availableMonthly.toFixed(2)}
                     </span>
                  </div>
                </div>
            </div>
         </div>

         <div className="flex gap-4 relative z-10">
             <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-4 shadow-inner backdrop-blur-md">
                 <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2"><ArrowUpRight className="w-4 h-4 text-emerald-400"/> Receita</div>
                 <div className="font-bold text-lg text-emerald-50 text-shadow-sm">R$ {monthlyIncome.toFixed(2)}</div>
             </div>
              <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-4 shadow-inner backdrop-blur-md">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2"><ArrowDownRight className="w-4 h-4 text-rose-400"/> Obrigações</div>
                  <div className="font-bold text-lg text-rose-50 text-shadow-sm">R$ {totalFixed.toFixed(2)}</div>
              </div>
         </div>
      </div>

      {/* Daily Control & Actions */}
      <div className="grid grid-cols-1 gap-4">
          <div className="glass-panel rounded-[2rem] p-6 shadow-md border-t border-white/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none"></div>
              
              <div className="flex justify-between items-center mb-6 relative z-10">
                  <h3 className="font-bold text-white text-base flex items-center gap-2.5">
                     <div className="bg-blue-500/10 p-1.5 rounded-lg border border-blue-500/20"><Target className="w-4 h-4 text-blue-400"/></div>
                     Cota Diária Inteligente
                  </h3>
                  <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">LMT R$ {dailyLimit.toFixed(2)}</span>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter mt-0.5">{daysLeft} dias rest. • R${availableMonthly.toFixed(0)} total</span>
                  </div>
              </div>
              
              <div className="flex items-end justify-between mb-4 relative z-10">
                  <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-400 tracking-tight">R$ {spentToday.toFixed(2)}</span>
                  <span className="text-xs font-bold text-zinc-400 bg-black/40 px-2 py-1 rounded-md">{Math.min((spentToday/dailyLimit)*100, 100).toFixed(0)}% Usado</span>
              </div>
              
              {/* Spatial Progress */}
              <div className="h-3 w-full bg-black/80 rounded-full overflow-hidden mb-6 relative z-10 shadow-inner">
                 <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none" />
                 <div 
                    className={`h-full transition-all duration-1000 ease-out rounded-full relative ${!isHealthy ? 'bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_15px_rgba(239,68,68,0.7)]' : 'bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_15px_rgba(56,189,248,0.5)]'}`}
                    style={{ width: `${Math.min((spentToday / dailyLimit) * 100, 100)}%` }}
                 >
                    <div className="absolute top-0 right-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent to-white/30 rounded-full" />
                 </div>
              </div>

              {/* Transactions Input */}
              <div className="flex gap-2.5 relative z-10">
                 <input 
                    type="number" 
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="R$ 0.00" 
                    className="flex-1 bg-black/40 border border-white/5 shadow-inner rounded-2xl px-5 py-3 text-sm font-bold tracking-wide text-white focus:outline-none focus:border-tscript-accent/50 focus:bg-white/5 transition-all"
                 />
                 <button onClick={() => handleAddTransaction('expense')} className="bg-red-500/10 text-red-500 border border-red-500/30 p-3 rounded-2xl hover:bg-red-500/20 active:scale-95 transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                     <Minus className="w-5 h-5" strokeWidth={3} />
                 </button>
                 <button onClick={() => handleAddTransaction('income')} className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 p-3 rounded-2xl hover:bg-emerald-500/20 active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                     <Plus className="w-5 h-5" strokeWidth={3} />
                 </button>
              </div>
          </div>
      </div>

      {/* Fixed Costs & Installments */}
      <div className="grid grid-cols-1 gap-4">
          <div className="glass-panel rounded-[2rem] p-6 shadow-md border-t border-white/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none"></div>
              
              <div className="flex justify-between items-center mb-6 relative z-10">
                 <h3 className="font-bold text-white text-base flex items-center gap-2.5">
                    <div className="bg-purple-500/10 p-1.5 rounded-lg border border-purple-500/20"><Layers className="w-4 h-4 text-purple-400"/></div>
                    Obrigações e Faturas
                 </h3>
                 <button onClick={() => setShowFixedCostForm(!showFixedCostForm)} className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 border border-white/10 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-1">
                     <Plus className="w-3 h-3" /> Injetar
                 </button>
              </div>

              {showFixedCostForm && (
                  <div className="bg-black/40 border border-white/5 rounded-2xl p-5 mb-6 relative z-10 space-y-3 shadow-inner">
                      <input type="text" placeholder="Nome (Ex: Fatura Cartão)" value={fixedName} onChange={e => setFixedName(e.target.value)} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50" />
                      <div className="flex gap-2">
                         <input type="number" placeholder="Valor Total (R$)" value={fixedAmount} onChange={e => setFixedAmount(e.target.value)} className="flex-1 bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50" />
                         <input type="number" placeholder="1x" value={fixedInstallments} onChange={e => setFixedInstallments(e.target.value)} className="w-20 bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-center text-white focus:outline-none focus:border-purple-500/50" />
                      </div>
                      <div className="flex gap-3 items-center pt-1">
                         <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Vence Dia:</span>
                         <input type="number" min="1" max="31" value={fixedDueDate} onChange={e => setFixedDueDate(e.target.value)} className="w-16 bg-white/[0.02] border border-white/10 rounded-xl px-2 py-1.5 text-sm text-center font-bold text-white focus:outline-none focus:border-purple-500/50" />
                         <div className="flex-1"></div>
                         <button onClick={handleAddFixedCost} className="bg-purple-500/20 text-purple-400 font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-xl border border-purple-500/30 hover:bg-purple-500/30 transition-colors shadow-[0_0_15px_rgba(168,85,247,0.2)]">Salvar</button>
                      </div>
                  </div>
              )}

              <div className="space-y-3 relative z-10">
                  {fixedCosts.map(cost => (
                      <div key={cost.id} className="glass-panel p-4 rounded-xl border border-white/5 hover:bg-white/[0.03] transition-colors flex items-center justify-between group">
                         <div className="flex flex-col">
                             <span className="text-[15px] font-bold text-zinc-200">{cost.name}</span>
                             <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                                 Vence Dia {cost.dueDate} • {cost.totalInstallments > 1 ? `Em ${cost.totalInstallments} parcelas` : 'Recorrente'}
                             </span>
                         </div>
                         <div className="flex flex-col items-end">
                             <span className="text-sm font-black text-rose-400 drop-shadow-sm">R$ {cost.installmentAmount.toFixed(2)} /mês</span>
                             {cost.totalInstallments > 1 && (
                                 <div className="flex items-center gap-1.5 mt-1.5 bg-black/50 px-2 py-0.5 rounded border border-white/5">
                                     <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                                         <div className="h-full bg-purple-400" style={{ width: `${(cost.paidInstallments / cost.totalInstallments) * 100}%` }}></div>
                                     </div>
                                     <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                                         {cost.paidInstallments}/{cost.totalInstallments} Pg
                                     </span>
                                 </div>
                             )}
                             <button onClick={() => deleteFixedCost(cost.id)} className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all ml-2">
                                 <Trash2 className="w-3.5 h-3.5" />
                             </button>
                         </div>
                      </div>
                  ))}
                  {fixedCosts.length === 0 && (
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-center">
                          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Nenhuma conta fixa registrada.</p>
                      </div>
                  )}
              </div>
          </div>

          {/* Transactions List */}
          <div className="glass-panel rounded-[2rem] p-6 shadow-md border-t border-white/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none"></div>
              
              <div className="flex justify-between items-center mb-6 relative z-10">
                 <h3 className="font-bold text-white text-base flex items-center gap-2.5">
                    <div className="bg-blue-500/10 p-1.5 rounded-lg border border-blue-500/20"><Activity className="w-4 h-4 text-blue-400"/></div>
                    Histórico de Lançamentos
                 </h3>
              </div>

              <div className="space-y-3 relative z-10">
                  {transactions.slice(0, 15).map(t => (
                      <div key={t.id} className="glass-panel p-4 rounded-xl border border-white/5 hover:bg-white/[0.03] transition-colors flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                  {t.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                              </div>
                              <div className="flex flex-col">
                                  <span className="text-sm font-bold text-zinc-200">{t.type === 'income' ? 'Receita Extra' : 'Despesa Variável'}</span>
                                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(t.createdAt).toLocaleDateString()}</span>
                              </div>
                          </div>
                          <div className="flex items-center gap-3">
                              <span className={`text-sm font-black ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                              </span>
                              <button onClick={() => deleteTransaction(t.id)} className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                                  <Trash2 className="w-4 h-4" />
                              </button>
                          </div>
                      </div>
                  ))}
                  {transactions.length === 0 && (
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-center">
                          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Nenhum lançamento hoje.</p>
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* AI Insights (Proactive Agent) */}
      <div className="relative overflow-hidden rounded-[2rem] border-t border-tscript-accent/20 bg-gradient-to-br from-[#0a192f] to-[#020617] p-6 shadow-lg">
         <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Activity className="w-32 h-32 text-cyan-500" />
         </div>
         <div className="absolute inset-0 bg-blue-500/5 blur-[50px] rounded-full pointer-events-none"></div>
         
         <div className="relative z-10">
             <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-black/40 text-cyan-400 text-[10px] font-bold uppercase tracking-widest mb-4 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]"></span> TBrain Neural Core
             </div>
             <p className="text-[13px] text-zinc-300 leading-relaxed font-medium">
                Sua projeção de obrigações fixas acumula R$ {totalFixed.toFixed(2)} por mês. Com {daysLeft} dias para o fim do ciclo, sua cota diária de R$ {dailyLimit.toFixed(0)} mantém sua disponibilidade real de R$ {availableMonthly.toFixed(0)} protegida.
             </p>
         </div>
      </div>

      <SavingsVault />
    </div>
  );
}
