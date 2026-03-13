"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Mail, Lock, BrainCircuit } from "lucide-react";
import { useAgentStore } from "@/store";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const setConnection = useAgentStore((state) => state.setConnection);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let result;
      if (isSignUp) {
        result = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${location.origin}/auth/callback`,
          },
        });
        if (result.error) throw result.error;
        alert("Enviamos um email de confirmação. Por favor verifique sua caixa de entrada.");
      } else {
        result = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (result.error) throw result.error;
        // On success, go to home and ensure agent connection logic
        setConnection(false); // Make sure AI overlay is off upon entry
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro na autenticação.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-6 relative overflow-hidden">
      
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Main Container */}
      <div className="w-full max-w-[400px] z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        {/* Header Title */}
        <div className="flex flex-col items-center justify-center mb-10">
           <img src="/tbrain-logo.png" alt="TBrain" className="w-20 h-20 rounded-3xl shadow-[0_0_30px_rgba(56,189,248,0.4)] mb-6 animate-float" />
           <h1 className="text-3xl font-black tracking-tight text-white mb-2">
             {isSignUp ? "Criar Link Neural" : "Conexão Neural"}
           </h1>
           <p className="text-sm font-bold uppercase tracking-widest text-cyan-400">TBrain Secure Core</p>
        </div>

        {/* Panel */}
        <div className="glass-panel p-8 rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-semibold uppercase tracking-wider mb-6 text-center animate-in zoom-in-95">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            <div className="relative group">
               <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                 <Mail className="w-5 h-5 text-zinc-500 group-focus-within:text-cyan-400 transition-colors" />
               </div>
               <input
                 type="email"
                 required
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 placeholder="Identificação de Email"
                 className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm font-medium placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.05] transition-all"
               />
            </div>

            <div className="relative group">
               <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                 <Lock className="w-5 h-5 text-zinc-500 group-focus-within:text-cyan-400 transition-colors" />
               </div>
               <input
                 type="password"
                 required
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 placeholder="Chave Criptográfica"
                 className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm font-medium placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.05] transition-all"
               />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:shadow-[0_0_30px_rgba(56,189,248,0.6)] flex justify-center items-center mt-4 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95"
            >
              {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                 <span className="flex items-center gap-2">
                    {isSignUp ? "Inicializar Biometria" : "Autorizar Acesso"} <BrainCircuit className="w-4 h-4 group-hover:animate-pulse" />
                 </span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center flex flex-col items-center gap-3">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
              {isSignUp ? "Já possui acesso?" : "Novo usuário do sistema?"}
            </p>
            <button 
               onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
               className="text-cyan-400 text-xs font-black uppercase tracking-widest hover:text-cyan-300 transition-colors drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]"
            >
              {isSignUp ? "Ir para Login" : "Requisitar Acesso"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
