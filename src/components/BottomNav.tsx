"use client";

import { Home, PieChart, User, Mic, Database, Activity } from 'lucide-react';
import { useAgentStore } from '../store';
import { useGeminiVoice } from '../hooks/useGeminiVoice';

export default function BottomNav() {
  const { isConnected, isThinking, currentRoute, setRoute } = useAgentStore();
  const { startSession, stopSession } = useGeminiVoice();

  const handleFabClick = async () => {
    if (isConnected) {
        stopSession();
        useAgentStore.getState().setConnection(false);
    } else {
        await startSession();
        useAgentStore.getState().setConnection(true);
    }
  };

  return (
    <>
      {/* Overlay backdrop when AI is active */}
      {isConnected && (
        <div className="fixed inset-0 z-40 bg-zinc-950/80 backdrop-blur-xl animate-in fade-in transition-all duration-300">
           <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent"></div>
           <div className="flex flex-col items-center justify-center h-full text-zinc-300 relative z-10">
               {isThinking ? (
                   <div className="text-2xl font-light tracking-widest animate-pulse text-cyan-300 glow-text">Analisando</div>
               ) : (
                   <div className="text-2xl font-light tracking-widest animate-bounce text-zinc-300">Ouvindo</div>
               )}
           </div>
        </div>
      )}

      {/* FAB - Brain/Microphone Button */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50">
        <button 
           onClick={handleFabClick}
           className={`
             relative flex items-center justify-center w-[68px] h-[68px] rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all duration-500
             ${isConnected ? 'bg-red-500/90 scale-110 shadow-[0_0_30px_rgba(239,68,68,0.5)] border border-red-400' 
             : 'bg-glass-base backdrop-blur-xl border border-white/10 hover:border-blue-500/50 hover:bg-white/10'}
           `}
        >
          {isConnected && (
            <span className="absolute inset-0 rounded-full animate-ping bg-red-400/40"></span>
          )}
          <Mic className={`w-7 h-7 ${isConnected ? 'text-white' : 'text-zinc-300'} ${isThinking ? 'animate-pulse' : ''}`} />
        </button>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-2xl border-t border-white/5 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto relative px-1">
          <NavItem icon={<Home />} label="Início" active={currentRoute === 'dashboard'} onClick={() => setRoute('dashboard')} />
          <NavItem icon={<PieChart />} label="Finanças" active={currentRoute === 'finance'} onClick={() => setRoute('finance')} />
          <NavItem icon={<Activity />} label="Tracker" active={currentRoute === 'tracker'} onClick={() => setRoute('tracker')} />
          
          <div className="w-[68px]"></div> {/* Spacer for FAB */}
          
          <NavItem icon={<Database />} label="Cofre" active={currentRoute === 'vault'} onClick={() => setRoute('vault')} />
          <NavItem icon={<User />} label="Perfil" active={currentRoute === 'profile'} onClick={() => setRoute('profile')} />
        </div>
      </nav>
    </>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center w-16 h-full space-y-1.5 transition-all duration-300 group">
      <div className={`transition-colors duration-300 ${active ? 'text-primary scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
         {icon}
      </div>
      <span className={`text-[10px] font-semibold tracking-wide transition-colors ${active ? 'text-zinc-100' : 'text-zinc-500'}`}>{label}</span>
    </button>
  );
}
