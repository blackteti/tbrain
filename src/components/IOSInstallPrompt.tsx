"use client";

import { useEffect, useState } from 'react';
import { Share, PlusSquare } from 'lucide-react';

export default function IOSInstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    
    // Check if the app is already installed/running as standalone PWA
    const isAppStandalone = ('standalone' in window.navigator) && (window.navigator as any).standalone;

    setIsIOS(isIOSDevice);
    setIsStandalone(isAppStandalone);

    // Show prompt if on iOS and not standalone
    if (isIOSDevice && !isAppStandalone) {
        // Option to delay or check local storage to not annoy user every time
        const hasDismissed = localStorage.getItem('ios-prompt-dismissed');
        if (!hasDismissed) {
          setShowPrompt(true);
        }
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem('ios-prompt-dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 pb-[env(safe-area-inset-bottom)] animate-in slide-in-from-bottom-10 backdrop-blur-sm bg-black/40">
      <div className="glass-panel rounded-3xl p-5 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
        <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-white tracking-tight">Instalar JARVIS</h3>
            <button onClick={dismiss} className="text-zinc-500 hover:text-white transition-colors p-1 bg-white/5 rounded-full hover:bg-white/10">✕</button>
        </div>
        <p className="text-sm text-zinc-400 mb-5 leading-relaxed">
          Para a melhor experiência, uso em tela cheia e ativação de notificações, instale este app de Controle Avançado.
        </p>
        <div className="flex items-center space-x-2 text-[13px] bg-zinc-900/80 p-3.5 rounded-2xl border border-white/5 font-medium text-zinc-300">
           <span>Toque em</span>
           <Share className="w-4 h-4 text-primary mx-0.5" />
           <span>(Compartilhar) e depois em</span>
           <div className="flex items-center bg-white/5 px-2 py-1.5 rounded-lg border border-white/10 text-white">
               <PlusSquare className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
               <span className="text-xs tracking-wide">Adicionar à Tela de Início</span>
           </div>
        </div>
      </div>
    </div>
  );
}
