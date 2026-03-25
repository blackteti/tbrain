"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Plus, LogOut, ChevronRight, Activity, Zap } from 'lucide-react';
import ExerciseLogger from '../../features/workout/ExerciseLogger';

// This is the dashboard
export default function WorkoutDashboard() {
  const [routines, setRoutines] = useState<any[]>([]);
  const [activeRoutine, setActiveRoutine] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch routines
  useEffect(() => {
    fetch('/api/workouts?user_id=default_user')
      .then(res => res.json())
      .then(data => {
          if (data && data.length > 0) {
              setRoutines(data);
          } else {
              // Creating default A, B, C for the first time
              createDefaultRoutines();
          }
          setLoading(false);
      })
      .catch(console.error);
  }, []);

  const createDefaultRoutines = async () => {
      setLoading(true);
      const defaultDivisions = [
          { name: 'A', description: 'Peito, Ombro e Tríceps', exercises: [{ name: 'Supino Reto' }, { name: 'Desenvolvimento' }, { name: 'Tríceps Polia' }] },
          { name: 'B', description: 'Costas e Bíceps', exercises: [{ name: 'Puxada Alta' }, { name: 'Remada Curvada' }, { name: 'Rosca Direta' }] },
          { name: 'C', description: 'Pernas Completas', exercises: [{ name: 'Agachamento Livre' }, { name: 'Leg Press' }, { name: 'Cadeira Extensora' }] }
      ];

      for (const div of defaultDivisions) {
          await fetch('/api/workouts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: 'default_user', name: div.name, description: div.description, exercises: div.exercises })
          });
      }
      
      const res = await fetch('/api/workouts?user_id=default_user');
      const data = await res.json();
      setRoutines(data);
      setLoading(false);
  };

  if (activeRoutine) {
      return (
          <div className="min-h-screen bg-[#09090b] text-white p-6 md:p-12 font-sans relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute top-[20%] left-[10%] w-[30rem] h-[30rem] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
              <div className="absolute bottom-[10%] right-[10%] w-[25rem] h-[25rem] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
              
              <div className="max-w-4xl mx-auto relative z-10">
                  <header className="flex justify-between items-center mb-10">
                      <div>
                          <button onClick={() => setActiveRoutine(null)} className="text-gray-400 hover:text-white mb-2 text-sm flex items-center transition-colors">
                              <ChevronRight className="w-4 h-4 rotate-180 mr-1" /> Voltar às divisões
                          </button>
                          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-orange-400 to-rose-500 text-transparent bg-clip-text">
                              Treino {activeRoutine.name}
                          </h1>
                          <p className="text-gray-400 mt-1">{activeRoutine.description}</p>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md">
                          <Activity className="text-orange-400" />
                      </div>
                  </header>

                  <div className="space-y-6">
                      {activeRoutine.exercises?.map((ex: any, idx: number) => (
                          <ExerciseLogger key={ex.id || idx} exercise={ex} />
                      ))}
                      
                      <div className="mt-8 p-6 rounded-3xl border border-dashed border-white/20 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-white/5 hover:border-orange-500/50 transition-all group">
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:bg-orange-500/20 group-hover:text-orange-400">
                              <Plus className="w-5 h-5" />
                          </div>
                          <p>Adicionar exercício solto</p>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-6 md:p-12 font-sans relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-[10%] left-[50%] -translate-x-1/2 w-[40rem] h-[40rem] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto relative z-10">
            <header className="mb-12 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
                        <Dumbbell className="text-orange-500" size={36} /> Jarvis Gym
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">Selecione sua divisão de treino diária.</p>
                </div>
            </header>

            {loading ? (
                <div className="flex space-x-4">
                    {[1,2,3].map(i => (
                        <div key={i} className="flex-1 h-64 rounded-3xl bg-white/5 animate-pulse border border-white/10" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {routines.map((routine, idx) => (
                            <motion.div
                                key={routine.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                onClick={() => setActiveRoutine(routine)}
                                className="group relative p-8 rounded-[2rem] bg-gradient-to-b from-white/10 to-white/5 border border-white/10 hover:border-orange-500/50 cursor-pointer overflow-hidden backdrop-blur-xl transition-all hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(249,115,22,0.2)]"
                            >
                                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Zap size={80} className="text-orange-400 -rotate-12" />
                                </div>
                                <h3 className="text-5xl font-black mb-2 text-white/90 group-hover:text-white">{routine.name}</h3>
                                <p className="text-gray-400 group-hover:text-gray-300 relative z-10 font-medium">{routine.description}</p>
                                <div className="mt-8 flex items-center text-sm font-semibold text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                                    INICIAR TREINO <ChevronRight className="ml-1 w-4 h-4" />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    </div>
  );
}
