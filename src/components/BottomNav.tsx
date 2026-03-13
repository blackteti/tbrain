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
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-2xl border-t border-white/5 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto relative px-1">
          <NavItem icon={<Home />} label="Início" active={currentRoute === 'dashboard'} onClick={() => setRoute('dashboard')} />
          <NavItem icon={<PieChart />} label="Finanças" active={currentRoute === 'finance'} onClick={() => setRoute('finance')} />
          <NavItem icon={<Activity />} label="Tracker" active={currentRoute === 'tracker'} onClick={() => setRoute('tracker')} />
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
