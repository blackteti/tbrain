"use client";

import React, { useEffect, useState } from 'react';
import { useFinanceStore } from '../../store';
import { useAgentStore, useVaultStore, useHabitsStore, useAuthStore } from '../../store';
import { Bell, CreditCard, Layers, Zap, Globe2, MapPin, Clock, AlertTriangle, Activity } from 'lucide-react';
import axios from 'axios';

interface NewsItem {
    title: string;
    summary: string;
    source: string;
    url: string;
}

export default function Dashboard() {
    const { spentToday, dailyLimit, monthlyIncome } = useFinanceStore();
    const { isConnected } = useAgentStore();
    const vaultItems = useVaultStore(s => s.items);
    const habits = useHabitsStore(s => s.habits);
    const [greeting, setGreeting] = useState('');
    const [newsData, setNewsData] = useState<NewsItem[]>([]);
    const [isLoadingNews, setIsLoadingNews] = useState(true);
    const [showNotifications, setShowNotifications] = useState(false);
    const [lastNewsUpdate, setLastNewsUpdate] = useState<Date | null>(null);
    const { user } = useAuthStore();
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0];

    const fetchLatestNews = () => {
        axios.get(`/api/news?t=${Date.now()}`).then(res => {
            if (res.data?.global) setNewsData(res.data.global);
            setLastNewsUpdate(new Date());
            setIsLoadingNews(false);
        }).catch(() => setIsLoadingNews(false));
    };

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Bom dia');
        else if (hour < 18) setGreeting('Boa tarde');
        else setGreeting('Boa noite');

        fetchLatestNews();
        const interval = setInterval(fetchLatestNews, 12 * 60 * 60 * 1000); // 12h
        return () => clearInterval(interval);
    }, []);

    const spentPercentage = dailyLimit > 0 ? Math.min((spentToday / dailyLimit) * 100, 100) : 0;
    const isOverLimit = spentToday >= dailyLimit;
    const pendingDaily = habits.filter(h => h.type === 'DAILY' && !h.completed).length;
    const totalDaily = habits.filter(h => h.type === 'DAILY').length;
    const activeReminders = vaultItems.filter(i => i.type === 'REMINDER' && !i.completed);
    const totalNotes = vaultItems.filter(i => i.type === 'NOTE').length;
    const totalLinks = vaultItems.filter(i => i.type === 'LINK').length;
    const totalReminders = vaultItems.filter(i => i.type === 'REMINDER').length;
    const notificationCount = activeReminders.length;

    return (
        <div className="flex flex-col gap-5 pb-24 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Header / Greeting */}
            <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-3">
                    <img src="/tbrain-logo.png" alt="TBrain" className="w-10 h-10 rounded-xl shadow-[0_0_15px_rgba(56,189,248,0.3)]" />
                    <div>
                       <h1 className="text-2xl font-bold text-white tracking-tight">
                           {greeting}{userName ? `, ${userName}` : ''}
                       </h1>
                       <p className="text-zinc-500 text-sm font-medium mt-0.5 text-cyan-400/80">Central de Inteligência TBrain</p>
                    </div>
                </div>
                <div className="relative">
                    <button onClick={() => setShowNotifications(!showNotifications)} className="glass-panel p-2.5 rounded-full hover:bg-white/10 transition-colors group cursor-pointer relative">
                       <Bell className="w-5 h-5 text-zinc-300 group-hover:text-white transition-colors" />
                       {notificationCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-black text-white flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.6)]">{notificationCount}</span>}
                    </button>
                    {showNotifications && (
                        <div className="absolute right-0 top-12 w-72 glass-panel rounded-2xl p-4 border border-white/10 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Central de Alertas</h4>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {activeReminders.map(r => (
                                    <div key={r.id} className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                                        <Clock className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                        <span className="text-xs font-semibold text-emerald-200 truncate">{r.title || r.content}</span>
                                    </div>
                                ))}
                                {notificationCount === 0 && <p className="text-xs text-zinc-500 text-center py-2">Tudo limpo. Sem pendências.</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>


            {/* Daily Briefing / Resumo Inteligente */}
            <div className="glass-panel rounded-[2rem] p-6 mb-2 border-t border-white/5 relative overflow-hidden flex flex-col gap-3 shadow-lg bg-black/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[30px] rounded-full pointer-events-none"></div>
                
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 relative z-10">Resumo Inteligente</h3>
                
                <div className="flex flex-col gap-3 relative z-10">
                   <div className="grid grid-cols-3 gap-2">
                      <div className="bg-purple-500/5 border border-purple-500/10 p-3 rounded-2xl shadow-inner">
                         <span className="text-[9px] font-bold uppercase tracking-widest text-purple-400/60 block mb-1">📝 Notas</span>
                         <span className="text-lg font-black text-white">{totalNotes}</span>
                      </div>
                      <div className="bg-blue-500/5 border border-blue-500/10 p-3 rounded-2xl shadow-inner">
                         <span className="text-[9px] font-bold uppercase tracking-widest text-blue-400/60 block mb-1">🔗 Links</span>
                         <span className="text-lg font-black text-white">{totalLinks}</span>
                      </div>
                      <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-2xl shadow-inner">
                         <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400/60 block mb-1">🔔 Alertas</span>
                         <span className="text-lg font-black text-white">{activeReminders.length}</span>
                      </div>
                   </div>
                   <div className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl shadow-inner">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1">Gasto Hoje</span>
                      <span className={`text-lg font-black ${isOverLimit ? 'text-red-400' : 'text-white'}`}>R$ {spentToday.toFixed(0)}</span>
                   </div>
                   {activeReminders.length > 0 && (
                       <div className="space-y-2">
                           {activeReminders.slice(0, 3).map(r => (
                               <div key={r.id} className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                                   <span className="text-xs font-semibold text-emerald-200">{r.title || r.content}</span>
                               </div>
                           ))}
                       </div>
                   )}
                </div>
            </div>

            {/* Finance Spatial Card */}
            <div className="glass-panel rounded-[2rem] p-7 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-500 mb-6 w-full">
                 {/* Internal glowing light source */}
                 <div className="absolute -top-10 -right-10 w-60 h-60 bg-blue-500/15 blur-[60px] rounded-full group-hover:bg-cyan-500/20 transition-colors duration-700 pointer-events-none"></div>
                 
                 <div className="flex items-center justify-between mb-6 relative z-10">
                     <div className="flex items-center gap-3">
                         <div className="bg-white/[0.03] border border-white/5 p-2.5 rounded-2xl shadow-inner backdrop-blur-xl">
                             <CreditCard className="w-6 h-6 text-blue-400" />
                         </div>
                         <h3 className="text-sm font-bold tracking-wider uppercase text-zinc-400">Fluxo Diário</h3>
                     </div>
                     {monthlyIncome === 0 && (
                         <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md shadow-[0_0_15px_rgba(16,185,129,0.15)]">Renda Ausente</span>
                     )}
                 </div>
                 
                 <div className="flex justify-between items-end mb-4 relative z-10">
                     <div className="flex flex-col">
                         <span className="text-[42px] leading-none font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500 tracking-tighter drop-shadow-sm">
                             R$ {spentToday.toFixed(2)}
                         </span>
                         <span className="text-sm font-bold text-zinc-600 mt-1">LMT: R$ {dailyLimit}</span>
                     </div>
                 </div>
                 
                 {/* Spatial Progress Bar */}
                 <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden mt-6 relative z-10 shadow-inner">
                     <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none" />
                     <div 
                        className={`h-full transition-all duration-1000 ease-out rounded-full relative ${isOverLimit ? 'bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_20px_rgba(239,68,68,0.8)]' : 'bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_20px_rgba(56,189,248,0.6)]'}`}
                        style={{ width: `${spentPercentage}%` }}
                     >
                        <div className="absolute top-0 right-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent to-white/30 rounded-full" />
                     </div>
                 </div>
                 {isOverLimit && <p className="text-[11px] text-red-400 mt-3 font-bold uppercase tracking-widest flex items-center gap-2 animate-pulse"><span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)]"></span> Alerta de Fluxo Estourado</p>}
            </div>

            {/* Quick Access Grid (2 Columns) */}
            <div className="grid grid-cols-2 gap-4 mb-6">
               {/* TTracker Hoje */}
               <button onClick={() => useAgentStore.getState().setRoute('tracker')} className="glass-panel p-5 rounded-[2rem] group cursor-pointer border-t border-white/5 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 text-left">
                   <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none"></div>
                   <div className="flex items-center justify-between mb-3 relative z-10">
                       <div className="bg-emerald-950/40 w-fit p-2.5 rounded-2xl border border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.15)]">
                           <Activity className="w-5 h-5 text-emerald-400" />
                       </div>
                       <div className="relative w-12 h-12">
                           <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                               <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                               <circle cx="18" cy="18" r="15" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray={`${Math.round((habits.filter(h => h.completed).length / Math.max(habits.length, 1)) * 94)} 94`} strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 4px rgba(16,185,129,0.6))' }} />
                           </svg>
                           <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-emerald-400">
                               {habits.length > 0 ? Math.round((habits.filter(h => h.completed).length / habits.length) * 100) : 0}%
                           </span>
                       </div>
                   </div>
                   <h4 className="text-white font-bold flex flex-col gap-0.5 z-10 relative">
                       <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Tracker Hoje</span>
                       <span className="text-sm">{habits.filter(h => h.completed).length}/{habits.length} hábitos</span>
                   </h4>
               </button>

               {/* Cofre Neural */}
               <button onClick={() => useAgentStore.getState().setRoute('vault')} className="glass-panel p-5 rounded-[2rem] group cursor-pointer border-t border-white/5 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 text-left">
                   <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none"></div>
                   <div className="flex items-center justify-between mb-3 relative z-10">
                       <div className="bg-purple-950/40 w-fit p-2.5 rounded-2xl border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                           <Layers className="w-5 h-5 text-purple-400" />
                       </div>
                       <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20 flex items-center justify-center" style={{ boxShadow: '0 0 20px rgba(168,85,247,0.2)' }}>
                           <span className="text-lg font-black text-purple-300">{vaultItems.length}</span>
                       </div>
                   </div>
                   <h4 className="text-white font-bold flex flex-col gap-0.5 z-10 relative">
                       <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Cofre Neural</span>
                       <span className="text-sm">{vaultItems.length} sinapses</span>
                   </h4>
               </button>
            </div>

            {/* Cenário Global Unificado */}
            <div className="mt-2 flex flex-col gap-3">
                 <div className="flex items-center justify-between px-1">
                     <h3 className="font-semibold text-zinc-300 text-sm tracking-wide uppercase flex items-center gap-2"><Globe2 className="w-4 h-4 text-blue-400" /> Cenário Global</h3>
                     <div className="flex items-center gap-3">
                         {lastNewsUpdate && <span className="text-[9px] text-zinc-600 tracking-wide font-medium">{lastNewsUpdate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} • a cada 12h</span>}
                         <span className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest">{newsData.length} manchetes</span>
                     </div>
                 </div>
                 
                 <div className="space-y-3">
                     {isLoadingNews ? (
                        <div className="text-center p-4 text-xs font-medium text-zinc-500 animate-pulse">Consultando oráculos globais...</div>
                     ) : (
                         newsData.map((news, idx) => (
                             <a key={idx} href={news.url} target="_blank" rel="noopener noreferrer" className="glass-panel p-4 rounded-2xl flex flex-col gap-1.5 items-start border-l-2 border-blue-500/40 hover:bg-white/[0.03] hover:border-cyan-400/60 transition-all">
                                 <p className="text-[13px] text-zinc-200 leading-snug font-semibold hover:text-cyan-400 transition-colors">{news.title}</p>
                                 {news.summary && <p className="text-[11px] text-zinc-500 leading-relaxed">{news.summary}</p>}
                                 <span className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold mt-1">{news.source}</span>
                             </a>
                         ))
                     )}
                 </div>
            </div>
            
        </div>
    );
}
