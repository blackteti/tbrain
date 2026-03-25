"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, CheckCircle2, History, Loader2, Play } from 'lucide-react';

export default function ExerciseLogger({ exercise }: { exercise: any }): React.ReactElement {
    const [sets, setSets] = useState(3);
    const [reps, setReps] = useState(10);
    const [weight, setWeight] = useState(20);
    
    const [loading, setLoading] = useState(false);
    const [aiFeedback, setAiFeedback] = useState<string | null>(null);
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        fetch(`/api/workouts/logs?exercise_name=${encodeURIComponent(exercise.name)}`)
            .then(res => res.json())
            .then(data => setHistory(data))
            .catch(console.error);
    }, [exercise.name]);

    const handleLogWorkout = async () => {
        setLoading(true);
        setAiFeedback(null);

        try {
            // First we ask AI for feedback based on history
            const aiRes = await fetch('/api/workouts/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    exercise_name: exercise.name,
                    reps,
                    weight,
                    history,
                    userProfile: { age: 25, height: 175, weight: 75 } // Mocked profile for now, should come from useContext/state
                })
            });
            const aiData = await aiRes.json();
            const feedbackResult = aiData.feedback || 'Bom treino!';
            
            setAiFeedback(feedbackResult);

            // Register Log
            await fetch('/api/workouts/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    exercise_name: exercise.name,
                    sets,
                    reps,
                    weight,
                    ai_feedback: feedbackResult
                })
            });

            // Refresh History
            const histRes = await fetch(`/api/workouts/logs?exercise_name=${encodeURIComponent(exercise.name)}`);
            const histData = await histRes.json();
            setHistory(histData);

        } catch (error) {
            console.error('Failed to log exercise', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md overflow-hidden relative"
        >
            {aiFeedback && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-rose-500" />
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* Exercise Info */}
                <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-1">{exercise.name}</h3>
                    {history.length > 0 ? (
                        <div className="flex items-center text-sm text-gray-400 font-medium">
                            <History size={14} className="mr-1.5 opacity-70" /> 
                            Última carga: {history[0].weight}kg | {history[0].reps} reps
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500">Sem histórico para este exercício.</div>
                    )}
                </div>

                {/* Input Controls */}
                <div className="flex items-center gap-3 bg-black/40 p-3 rounded-2xl border border-white/5 w-full md:w-auto">
                    <div className="flex flex-col items-center px-4 border-r border-white/10">
                        <span className="text-[10px] uppercase text-gray-500 font-bold mb-1 tracking-wider">Séries</span>
                        <input 
                            type="number" 
                            className="bg-transparent text-white text-xl font-bold w-12 text-center focus:outline-none appearance-none" 
                            value={sets} 
                            onChange={e => setSets(Number(e.target.value))} 
                        />
                    </div>
                    <div className="flex flex-col items-center px-4 border-r border-white/10">
                        <span className="text-[10px] uppercase text-gray-500 font-bold mb-1 tracking-wider">Reps</span>
                        <input 
                            type="number" 
                            className="bg-transparent text-white text-xl font-bold w-12 text-center focus:outline-none appearance-none" 
                            value={reps} 
                            onChange={e => setReps(Number(e.target.value))} 
                        />
                    </div>
                    <div className="flex flex-col items-center px-4">
                        <span className="text-[10px] uppercase text-gray-500 font-bold mb-1 tracking-wider">Kg</span>
                        <input 
                            type="number" 
                            className="bg-transparent text-orange-400 text-xl font-bold w-16 text-center focus:outline-none appearance-none" 
                            value={weight} 
                            onChange={e => setWeight(Number(e.target.value))} 
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <button 
                    onClick={handleLogWorkout}
                    disabled={loading}
                    className="h-16 px-8 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-95 transition-all outline-none flex items-center justify-center font-bold text-white shadow-lg shadow-orange-500/20 disabled:opacity-50 w-full md:w-auto shrink-0 group"
                >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                        <div className="flex items-center gap-2">
                           Salvar <Play className="w-4 h-4 text-orange-200 fill-orange-200 group-hover:translate-x-1 transition-transform" />
                        </div>
                    )}
                </button>
            </div>

            {/* AI Feedback Panel */}
            <AnimatePresence>
                {aiFeedback && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gradient-to-r from-orange-500/10 to-transparent border-l-4 border-orange-500 p-4 rounded-r-2xl"
                    >
                        <div className="flex gap-3">
                            <BrainCircuit className="text-orange-400 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-orange-400 mb-1">Análise Neural Jarvis</h4>
                                <p className="text-gray-300 text-sm leading-relaxed">{aiFeedback}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
