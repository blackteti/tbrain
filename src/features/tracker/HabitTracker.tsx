"use client";

import React, { useState, useMemo } from 'react';
import { useHabitsStore } from '../../store';
import { Activity, Flame, Calendar, TrendingUp, Award, Target, Zap, BarChart3, Plus, Trash2 } from 'lucide-react';

function getLastNDays(n: number): string[] {
    const days: string[] = [];
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
    }
    return days;
}

// Generate days centered around today: pastDays before + today + futureDays after
function getCenteredDays(pastDays: number, futureDays: number): string[] {
    const days: string[] = [];
    for (let i = -pastDays; i <= futureDays; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        days.push(d.toISOString().split('T')[0]);
    }
    return days;
}

function getWeekday(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00');
    return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()];
}

function getDayNum(dateStr: string): number {
    return new Date(dateStr + 'T12:00:00').getDate();
}

function getMonthLabel(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00');
    return ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][d.getMonth()];
}

function formatToday(): string {
    const d = new Date();
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return `${weekdays[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]}`;
}

export default function HabitTracker() {
    const { habits, addHabit, deleteHabit } = useHabitsStore();
    const [selectedHabitId, setSelectedHabitId] = useState<number | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
    const [newUrgency, setNewUrgency] = useState<'HIGH' | 'NORMAL'>('NORMAL');
    
    const [trackerData, setTrackerData] = useState<Record<string, Record<number, boolean>>>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('tbrain-tracker-data');
            return saved ? JSON.parse(saved) : {};
        }
        return {};
    });

    const saveTracker = (data: Record<string, Record<number, boolean>>) => {
        setTrackerData(data);
        localStorage.setItem('tbrain-tracker-data', JSON.stringify(data));
    };

    const toggleDay = (dateStr: string, habitId: number) => {
        const newData = { ...trackerData };
        if (!newData[dateStr]) newData[dateStr] = {};
        newData[dateStr][habitId] = !newData[dateStr][habitId];
        saveTracker(newData);
    };

    const last90Days = useMemo(() => getLastNDays(90), []);
    const gridDays = useMemo(() => getCenteredDays(45, 45), []); // centered grid
    const last30Days = useMemo(() => getLastNDays(30), []);
    const last7Days = useMemo(() => getLastNDays(7), []);
    const today = new Date().toISOString().split('T')[0];

    // Total hits (only within tracked 90 days)
    const totalChecks = last90Days.reduce((sum, day) => {
        const dayData = trackerData[day] || {};
        return sum + Object.values(dayData).filter(Boolean).length;
    }, 0);

    const todayChecks = Object.values(trackerData[today] || {}).filter(Boolean).length;
    const todayTotal = habits.length;
    const todayRate = todayTotal > 0 ? Math.round((todayChecks / todayTotal) * 100) : 0;

    // Completion rate last 30 days
    const last30Rate = (() => {
        if (habits.length === 0) return 0;
        let checks = 0;
        let possible = 0;
        last30Days.forEach(day => {
            const dayData = trackerData[day] || {};
            checks += Object.values(dayData).filter(Boolean).length;
            possible += habits.length;
        });
        return possible > 0 ? Math.round((checks / possible) * 100) : 0;
    })();

    // Current streak: count consecutive days from today going backward where at least 1 habit was done
    const currentStreak = useMemo(() => {
        let streak = 0;
        for (let i = last90Days.length - 1; i >= 0; i--) {
            const dayData = trackerData[last90Days[i]] || {};
            const hasDone = Object.values(dayData).some(Boolean);
            if (hasDone) {
                streak++;
            } else {
                break; // streak broken
            }
        }
        return streak;
    }, [trackerData, last90Days]);

    // Best streak: find the longest consecutive run within the 90 days
    const bestStreak = useMemo(() => {
        let best = 0;
        let run = 0;
        for (let i = 0; i < last90Days.length; i++) {
            const dayData = trackerData[last90Days[i]] || {};
            const hasDone = Object.values(dayData).some(Boolean);
            if (hasDone) {
                run++;
                if (run > best) best = run;
            } else {
                run = 0;
            }
        }
        return best;
    }, [trackerData, last90Days]);

    // Motivation message
    const motivationMsg = todayRate >= 100 
        ? '🏆 Dia perfeito! Todos os hábitos concluídos.' 
        : todayRate >= 50 
            ? '⚡ Bom ritmo! Continue assim, faltam poucos.' 
            : todayChecks > 0 
                ? '🔥 Já começou! Não pare agora.'
                : '⏰ Nenhum hábito feito ainda hoje. Bora?';

    // Grid weeks with month labels
    const weeks: string[][] = [];
    for (let i = 0; i < last90Days.length; i += 7) {
        weeks.push(last90Days.slice(i, i + 7));
    }

    // Month labels for the grid
    const monthLabels: { label: string; col: number }[] = [];
    let lastMonth = '';
    weeks.forEach((week, wi) => {
        const firstDay = week[0];
        const month = getMonthLabel(firstDay);
        if (month !== lastMonth) {
            monthLabels.push({ label: month, col: wi });
            lastMonth = month;
        }
    });

    const getHeatLevel = (dateStr: string): number => {
        const dayData = trackerData[dateStr] || {};
        if (selectedHabitId !== null) {
            return dayData[selectedHabitId] ? 4 : 0;
        }
        const count = Object.values(dayData).filter(Boolean).length;
        if (count === 0) return 0;
        const maxCount = Math.max(habits.length, 1);
        const ratio = count / maxCount;
        if (ratio <= 0.25) return 1;
        if (ratio <= 0.5) return 2;
        if (ratio <= 0.75) return 3;
        return 4;
    };

    const heatColors = [
        'bg-zinc-800/50',
        'bg-emerald-900/60',
        'bg-emerald-700/70',
        'bg-emerald-500/80',
        'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]'
    ];

    return (
        <div className="p-6 pb-32">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-1">
                    <img src="/tbrain-logo.png" alt="TBrain" className="w-9 h-9 rounded-xl shadow-[0_0_12px_rgba(56,189,248,0.2)]" />
                    <div className="bg-emerald-500/10 p-2.5 rounded-2xl border border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.15)]">
                        <Activity className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-white">TTracker</h1>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{formatToday()}</p>
                    </div>
                </div>
            </div>

            {/* Motivation Banner */}
            <div className={`rounded-2xl p-4 mb-6 border flex items-center gap-3 ${
                todayRate >= 100 ? 'bg-emerald-500/10 border-emerald-500/20' :
                todayRate >= 50 ? 'bg-cyan-500/10 border-cyan-500/20' :
                todayChecks > 0 ? 'bg-orange-500/10 border-orange-500/20' :
                'bg-zinc-800/50 border-white/5'
            }`}>
                <div className={`text-3xl font-black ${todayRate >= 100 ? 'text-emerald-400' : todayRate >= 50 ? 'text-cyan-400' : 'text-zinc-400'}`}>
                    {todayRate}%
                </div>
                <div>
                    <span className={`text-xs font-bold ${todayRate >= 100 ? 'text-emerald-300' : todayRate >= 50 ? 'text-cyan-300' : 'text-zinc-300'}`}>
                        {motivationMsg}
                    </span>
                    <span className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mt-0.5">
                        {todayChecks}/{todayTotal} hábitos hoje
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-2 mb-6">
                <div className="glass-panel rounded-xl p-3 text-center border border-white/5">
                    <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                    <span className="text-lg font-black text-white block">{currentStreak}</span>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500">Streak</span>
                </div>
                <div className="glass-panel rounded-xl p-3 text-center border border-white/5">
                    <Award className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                    <span className="text-lg font-black text-white block">{bestStreak}</span>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500">Recorde</span>
                </div>
                <div className="glass-panel rounded-xl p-3 text-center border border-white/5">
                    <TrendingUp className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                    <span className="text-lg font-black text-white block">{totalChecks}</span>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500">Hits</span>
                </div>
                <div className="glass-panel rounded-xl p-3 text-center border border-white/5">
                    <BarChart3 className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                    <span className="text-lg font-black text-white block">{last30Rate}%</span>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500">30 Dias</span>
                </div>
            </div>

            {/* Habit Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-hide">
                <button 
                    onClick={() => setSelectedHabitId(null)}
                    className={`px-4 py-2 rounded-full text-[11px] font-bold tracking-wider uppercase whitespace-nowrap border transition-all ${
                        selectedHabitId === null 
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.2)]' 
                          : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                    }`}
                >
                    Todos
                </button>
                {habits.map(h => (
                    <button
                        key={h.id}
                        onClick={() => setSelectedHabitId(h.id)}
                        className={`px-4 py-2 rounded-full text-[11px] font-bold tracking-wider uppercase whitespace-nowrap border transition-all ${
                            selectedHabitId === h.id 
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.2)]' 
                              : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                        }`}
                    >
                        {h.urgency === 'HIGH' ? '🔥 ' : ''}{h.name.length > 12 ? h.name.substring(0, 12) + '…' : h.name}
                    </button>
                ))}
            </div>

            {/* Contribution Grid — Centered on Today */}
            <div className="glass-panel rounded-2xl p-5 mb-6 border border-white/5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" /> Linha do Tempo
                    </h3>
                    <div className="flex items-center gap-1.5 text-[9px] text-zinc-600">
                        <span>Menos</span>
                        {heatColors.map((c, i) => (
                            <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
                        ))}
                        <span>Mais</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {(() => {
                        // Build proper grid using centered days (45 past + today + 45 future)
                        const firstDay = new Date(gridDays[0] + 'T12:00:00');
                        const firstDayOfWeek = firstDay.getDay();
                        
                        const totalSlots = firstDayOfWeek + gridDays.length;
                        const totalWeeks = Math.ceil(totalSlots / 7);
                        
                        const grid: (string | null)[][] = Array.from({ length: 7 }, () => Array(totalWeeks).fill(null));
                        
                        gridDays.forEach((day, idx) => {
                            const d = new Date(day + 'T12:00:00');
                            const weekday = d.getDay();
                            const col = Math.floor((idx + firstDayOfWeek) / 7);
                            grid[weekday][col] = day;
                        });

                        // Month labels
                        const monthHeaders: (string | null)[] = Array(totalWeeks).fill(null);
                        let prevMonth = '';
                        for (let col = 0; col < totalWeeks; col++) {
                            for (let row = 0; row < 7; row++) {
                                const day = grid[row][col];
                                if (day) {
                                    const month = getMonthLabel(day);
                                    if (month !== prevMonth) {
                                        monthHeaders[col] = month;
                                        prevMonth = month;
                                    }
                                    break;
                                }
                            }
                        }

                        const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

                        return (
                            <div>
                                {/* Month labels row */}
                                <div className="flex mb-1" style={{ paddingLeft: '28px' }}>
                                    {monthHeaders.map((label, col) => (
                                        <div key={col} style={{ width: '17px', flexShrink: 0 }}>
                                            {label && <span className="text-[8px] font-bold text-zinc-500 uppercase">{label}</span>}
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Grid rows */}
                                {grid.map((row, rowIdx) => (
                                    <div key={rowIdx} className="flex items-center gap-0">
                                        <div style={{ width: '24px', flexShrink: 0 }}>
                                            {(rowIdx === 1 || rowIdx === 3 || rowIdx === 5) && (
                                                <span className="text-[8px] font-bold text-zinc-600 uppercase">{dayLabels[rowIdx]}</span>
                                            )}
                                        </div>
                                        <div className="flex gap-[3px]">
                                            {row.map((day, colIdx) => {
                                                const isFuture = day ? day > today : false;
                                                const isToday = day === today;
                                                return (
                                                    <div key={colIdx} style={{ width: '14px', height: '14px' }}>
                                                        {day ? (
                                                            <button
                                                                onClick={() => { if (selectedHabitId !== null) toggleDay(day, selectedHabitId); }}
                                                                title={`${day} — ${getWeekday(day)} — ${Object.values(trackerData[day] || {}).filter(Boolean).length} hits`}
                                                                className={`w-full h-full rounded-[3px] transition-all duration-200 hover:scale-[1.4] hover:ring-1 hover:ring-white/30 ${
                                                                    isToday ? 'ring-[2px] ring-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : ''
                                                                } ${isFuture && getHeatLevel(day) === 0 ? 'bg-zinc-800/20 border border-zinc-700/30' : heatColors[getHeatLevel(day)]}`}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full" />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* Today's Check-in */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Check-in de Hoje</h3>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">{todayChecks}/{todayTotal}</span>
                        <button onClick={() => setShowAddForm(!showAddForm)} className="bg-emerald-500/10 text-emerald-400 p-1.5 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {showAddForm && (
                    <div className="glass-panel rounded-xl p-4 mb-4 border border-emerald-500/20 bg-emerald-500/5 space-y-3">
                        <input type="text" placeholder="Nome do hábito" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 placeholder:text-zinc-500" />
                        <div className="flex gap-2">
                            {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map(t => (
                                <button key={t} onClick={() => setNewType(t)} className={`flex-1 text-[10px] font-bold uppercase tracking-widest py-2 rounded-lg border transition-all ${newType === t ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/10 text-zinc-400'}`}>
                                    {t === 'DAILY' ? 'Diário' : t === 'WEEKLY' ? 'Semanal' : 'Mensal'}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setNewUrgency('NORMAL')} className={`flex-1 text-[10px] font-bold uppercase tracking-widest py-2 rounded-lg border transition-all ${newUrgency === 'NORMAL' ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' : 'bg-white/5 border-white/10 text-zinc-400'}`}>🔥 Normal</button>
                            <button onClick={() => setNewUrgency('HIGH')} className={`flex-1 text-[10px] font-bold uppercase tracking-widest py-2 rounded-lg border transition-all ${newUrgency === 'HIGH' ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-white/5 border-white/10 text-zinc-400'}`}>🔥🔥 Urgente</button>
                        </div>
                        <button onClick={() => { if (newName.trim()) { addHabit(newName.trim(), newType, newUrgency); setNewName(''); setShowAddForm(false); } }} className="w-full bg-emerald-500/20 text-emerald-400 font-bold text-xs uppercase tracking-widest py-3 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/30 transition-all">+ Adicionar Hábito</button>
                    </div>
                )}
                
                {/* Progress bar */}
                <div className="h-1.5 w-full bg-zinc-800/50 rounded-full overflow-hidden mb-4">
                    <div 
                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${todayRate}%` }}
                    />
                </div>
                
                <div className="space-y-2">
                    {habits.map(habit => {
                        const isChecked = trackerData[today]?.[habit.id] || false;
                        return (
                            <button
                                key={habit.id}
                                onClick={() => toggleDay(today, habit.id)}
                                className={`w-full glass-panel rounded-xl p-4 flex items-center justify-between transition-all group border ${
                                    isChecked 
                                      ? 'border-emerald-500/30 bg-emerald-500/10' 
                                      : 'border-white/5 hover:border-white/10'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${
                                        isChecked 
                                          ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.3)]' 
                                          : 'border-zinc-600 group-hover:border-zinc-400'
                                    }`}>
                                        {isChecked && <span className="text-emerald-400 text-sm font-bold">✓</span>}
                                    </div>
                                    <div className="text-left">
                                        <span className={`text-sm font-bold ${isChecked ? 'text-emerald-300 line-through opacity-70' : 'text-zinc-200'}`}>
                                            {habit.name}
                                        </span>
                                        <span className="block text-[9px] font-bold uppercase tracking-widest text-zinc-600 mt-0.5">
                                            {habit.type} · {habit.urgency === 'HIGH' ? '🔥🔥 Urgente' : '🔥 Normal'} · Streak: {habit.streak}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                        isChecked ? 'bg-emerald-500/20' : 'bg-white/5 group-hover:bg-white/10'
                                    }`}>
                                        {isChecked ? (
                                            <Zap className="w-4 h-4 text-emerald-400" />
                                        ) : (
                                            <Target className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
                                        )}
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); deleteHabit(habit.id); }} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-all">
                                        <Trash2 className="w-3.5 h-3.5 text-zinc-500 hover:text-red-400" />
                                    </button>
                                </div>
                            </button>
                        );
                    })}

                    {habits.length === 0 && (
                        <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                            <Activity className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Sem hábitos. Vá em Metas para criar.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Weekly View */}
            <div className="glass-panel rounded-2xl p-5 border border-white/5">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Esta Semana</h3>
                <div className="grid grid-cols-7 gap-2">
                    {last7Days.map(day => {
                        const dayData = trackerData[day] || {};
                        const count = Object.values(dayData).filter(Boolean).length;
                        const isToday = day === today;
                        return (
                            <div key={day} className="text-center">
                                <span className={`text-[8px] font-bold uppercase tracking-wider block ${isToday ? 'text-emerald-400' : 'text-zinc-600'}`}>
                                    {getWeekday(day)}
                                </span>
                                <span className={`text-[9px] font-medium block mb-1 ${isToday ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                    {getDayNum(day)}
                                </span>
                                <div className={`w-full aspect-square rounded-xl flex items-center justify-center text-sm font-black transition-all ${
                                    count >= habits.length && habits.length > 0 ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 shadow-[0_0_8px_rgba(52,211,153,0.2)]' :
                                    count >= 1 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                    'bg-white/5 text-zinc-600 border border-white/5'
                                } ${isToday ? 'ring-2 ring-emerald-400/40' : ''}`}>
                                    {count}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
