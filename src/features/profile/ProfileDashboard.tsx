"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { User, Shield, Settings, LogOut, ChevronRight, Briefcase, Target, Activity, Key, Brain, Sun, Moon } from 'lucide-react';
import { useProfileStore, useThemeStore, useAuthStore } from '../../store';
import { createClient } from '../../utils/supabase/client';

const PerformanceReport = dynamic(() => import('./PerformanceReport'), { ssr: false });

export default function ProfileDashboard() {
  const { traits, updateTraits } = useProfileStore();
  const { user, login } = useAuthStore();
  const supabase = createClient();

  const [activeSegment, setActiveSegment] = useState<'menu' | 'traits'>('menu');
  const [localTraits, setLocalTraits] = useState(traits);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || user?.email?.split('@')[0] || '');

  const handleSaveTraits = async () => {
      // Update local store traits
      updateTraits(localTraits);

      // Update Supabase metadata for full_name
      const { data, error } = await supabase.auth.updateUser({
          data: { full_name: fullName }
      });

      if (!error && data.user) {
          // Re-sync local auth state if necessary, though useAuthStore usually handles it on session change or re-login
          // For now, let's just update the local name if we want immediate feedback
      }

      setActiveSegment('menu');
  };

  if (activeSegment === 'traits') {
      return (
          <div className="pb-24 animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="flex justify-between items-center mb-8 relative z-10">
                <button onClick={() => { setLocalTraits(traits); setActiveSegment('menu'); }} className="text-zinc-400 font-bold text-sm tracking-widest hover:text-white transition-colors uppercase">
                    ← Voltar
                </button>
                <h2 className="text-xl font-bold text-white tracking-tight">Biometria TBrain</h2>
             </div>

             <div className="space-y-4">
                  <div className="glass-panel p-5 rounded-3xl bg-black/40 border border-white/5 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none"></div>
                      <label className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2 mb-3 relative z-10"><User className="w-4 h-4"/> Identidade Neural (Nome)</label>
                      <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Como o TBrain deve te chamar?" className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 shadow-inner relative z-10" />
                  </div>

                  <div className="glass-panel p-5 rounded-3xl bg-black/40 border border-white/5 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none"></div>
                      <label className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2 mb-3 relative z-10"><Briefcase className="w-4 h-4"/> Atuação Profissional</label>
                      <input value={localTraits.profession} onChange={e => setLocalTraits({...localTraits, profession: e.target.value})} className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 shadow-inner relative z-10" />
                  </div>

                 <div className="glass-panel p-5 rounded-3xl bg-black/40 border border-white/5 relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none"></div>
                     <label className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2 mb-3 relative z-10"><Target className="w-4 h-4"/> Foco Principal Diretivo</label>
                     <input value={localTraits.primaryFocus} onChange={e => setLocalTraits({...localTraits, primaryFocus: e.target.value})} className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 shadow-inner relative z-10" />
                 </div>

                 <div className="glass-panel p-5 rounded-3xl bg-black/40 border border-white/5 relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none"></div>
                     <label className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2 mb-3 relative z-10"><Activity className="w-4 h-4"/> Perfil Financeiro</label>
                     <input value={localTraits.financialProfile} onChange={e => setLocalTraits({...localTraits, financialProfile: e.target.value})} className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 shadow-inner relative z-10" />
                 </div>

                 <div className="glass-panel p-5 rounded-3xl bg-black/40 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)] mt-8 relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none"></div>
                     <label className="text-[11px] font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2 mb-3 relative z-10"><Key className="w-4 h-4 drop-shadow-sm"/> Gemini API Key (Voice Neural)</label>
                     <input type="password" placeholder="AIzaSy..." value={localTraits.geminiKey} onChange={e => setLocalTraits({...localTraits, geminiKey: e.target.value})} className="w-full bg-zinc-950/50 border border-purple-500/20 rounded-xl px-4 py-3 text-sm font-mono text-purple-100 focus:outline-none focus:border-purple-500/80 shadow-inner relative z-10" />
                     <p className="text-[10px] text-zinc-500 mt-3 font-medium leading-relaxed relative z-10">Esta chave permanece exclusivamente no seu dispositivo (LocalStorage) para autenticar os WebSockets do captador de áudio com a infraestrutura de modelo Realtime Gemini. Sem ela, a ponte verbal do menu central não abrirá.</p>
                 </div>

                 <button onClick={handleSaveTraits} className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-zinc-50 font-black tracking-widest uppercase py-4 rounded-2xl shadow-[0_0_25px_rgba(34,211,238,0.4)] hover:shadow-[0_0_35px_rgba(34,211,238,0.6)] active:scale-[0.98] transition-all">
                     Sincronizar Biometria
                 </button>
             </div>
          </div>
      );
  }
  return (
    <div className="pb-24 animate-in fade-in slide-in-from-bottom-5 duration-700">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-8 relative z-10">
        <div className="flex-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 drop-shadow-sm mb-1">Perfil TBrain</h2>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Configurações & Segurança</p>
        </div>
      </div>

      {/* User Card */}
      <div className="glass-panel rounded-[2rem] p-6 mb-8 relative overflow-hidden shadow-lg bg-black/20 flex items-center gap-5">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent pointer-events-none"></div>
          
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 p-[2px] relative z-10 shadow-[0_0_20px_rgba(56,189,248,0.4)]">
             <div className="w-full h-full bg-zinc-950 rounded-full flex items-center justify-center">
                 <User className="w-8 h-8 text-cyan-400" />
             </div>
          </div>
          
          <div className="flex flex-col relative z-10">
              <span className="text-xl font-bold text-white tracking-tight">{fullName || 'Doador'}</span>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1 mt-1">
                 <Shield className="w-3 h-3" /> Administrador Nível 1
              </span>
          </div>
      </div>

      {/* Performance Report */}
      <PerformanceReport />

      {/* Settings List */}
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-4 px-2">Opções do Sistema</h3>
      
      <div className="space-y-3">
          {/* Account Settings / Traits */}
          <div onClick={() => setActiveSegment('traits')} className="glass-panel hover:bg-white/[0.03] transition-colors p-4 rounded-2xl flex items-center justify-between cursor-pointer group border border-white/5">
              <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center shadow-inner group-hover:border-cyan-500/50 transition-colors">
                      <Brain className="w-5 h-5 text-zinc-300 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <div className="flex flex-col">
                      <span className="text-sm font-bold text-zinc-200">Biometria Comportamental</span>
                      <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mt-0.5">Identidade & Chaves de IA</span>
                  </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-cyan-400 transition-colors" />
          </div>

          {/* Sync & Backup */}
          <div className="glass-panel hover:bg-white/[0.03] transition-colors p-4 rounded-2xl flex items-center justify-between cursor-pointer group border border-white/5">
              <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center shadow-inner group-hover:border-blue-500/50 transition-colors">
                      <Shield className="w-5 h-5 text-zinc-300 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <span className="text-sm font-bold text-zinc-200">Sincronização Nuvem (Em Breve)</span>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-blue-400 transition-colors" />
          </div>

          {/* Logout prep */}
          <div className="glass-panel hover:bg-red-500/5 transition-colors p-4 rounded-2xl flex items-center justify-between cursor-pointer group border border-white/5 hover:border-red-500/30">
              <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-black/50 border border-red-500/10 flex items-center justify-center shadow-inner group-hover:border-red-500/50 transition-colors">
                      <LogOut className="w-5 h-5 text-red-400 group-hover:text-red-500 transition-colors" />
                  </div>
                  <span className="text-sm font-bold text-red-400">Desconectar Neural Link</span>
              </div>
          </div>
      </div>

      {/* Theme Toggle */}
      <div className="mt-4 space-y-3">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2 px-2">Aparência</h3>
          <button onClick={() => useThemeStore.getState().toggleTheme()} className="w-full glass-panel p-4 rounded-2xl flex items-center justify-between cursor-pointer group border border-white/5 hover:bg-white/[0.03] transition-colors">
              <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center shadow-inner group-hover:border-amber-500/50 transition-colors">
                      <Sun className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex flex-col text-left">
                      <span className="text-sm font-bold text-zinc-200">Modo Visual</span>
                      <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mt-0.5">Toque para alternar Escuro ↔ Claro</span>
                  </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-amber-400 transition-colors" />
          </button>
      </div>
      
    </div>
  );
}
