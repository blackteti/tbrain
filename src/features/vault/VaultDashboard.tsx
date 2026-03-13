"use client";

import React, { useState, useMemo, useRef } from 'react';
import { FileText, Link as LinkIcon, Bell, Trash2, CheckCircle2, Circle, ChevronDown, ChevronUp, ArrowLeft, Plus, Zap, Brain, Sparkles, X, ChevronLeft, ChevronRight, MoveHorizontal } from 'lucide-react';
import { useVaultStore, VaultItem } from '../../store';

type WorldType = 'NOTE' | 'LINK' | 'REMINDER';

const WORLDS = [
    { type: 'NOTE' as WorldType, label: 'Notas', emoji: '📝', color: 'purple', gradient: 'from-purple-500 to-indigo-500', bg: 'purple-500', glow: 'rgba(168,85,247,0.5)', desc: 'Ideias, reflexões e pensamentos' },
    { type: 'LINK' as WorldType, label: 'Links', emoji: '🔗', color: 'blue', gradient: 'from-blue-500 to-cyan-500', bg: 'blue-500', glow: 'rgba(59,130,246,0.5)', desc: 'URLs e recursos salvos' },
    { type: 'REMINDER' as WorldType, label: 'Lembretes', emoji: '🔔', color: 'emerald', gradient: 'from-emerald-500 to-teal-500', bg: 'emerald-500', glow: 'rgba(16,185,129,0.5)', desc: 'Alertas e tarefas pendentes' },
];

const WEEKDAYS = [
    { id: 1, short: 'Seg', full: 'Segunda', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)' },
    { id: 2, short: 'Ter', full: 'Terça', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.3)' },
    { id: 3, short: 'Qua', full: 'Quarta', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' },
    { id: 4, short: 'Qui', full: 'Quinta', color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)' },
    { id: 5, short: 'Sex', full: 'Sexta', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' },
    { id: 6, short: 'Sáb', full: 'Sábado', color: '#ec4899', bg: 'rgba(236,72,153,0.15)', border: 'rgba(236,72,153,0.3)' },
    { id: 0, short: 'Dom', full: 'Domingo', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)', border: 'rgba(6,182,212,0.3)' },
];

export default function VaultDashboard() {
    const { items, addItem, toggleItem, deleteItem, updateItemDay } = useVaultStore();
    const [activeWorld, setActiveWorld] = useState<WorldType | null>(null);
    const [entering, setEntering] = useState(false);
    const [exiting, setExiting] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [selectedDay, setSelectedDay] = useState(new Date().getDay()); // default today's weekday
    const [movingItemId, setMovingItemId] = useState<string | null>(null);
    
    // Swipe handling
    const touchStartX = useRef(0);
    const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
    const handleTouchEnd = (e: React.TouchEvent) => {
        const diff = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(diff) > 50) {
            const dayOrder = WEEKDAYS.map(d => d.id);
            const currIdx = dayOrder.indexOf(selectedDay);
            if (diff < 0 && currIdx < dayOrder.length - 1) setSelectedDay(dayOrder[currIdx + 1]);
            if (diff > 0 && currIdx > 0) setSelectedDay(dayOrder[currIdx - 1]);
        }
    };
    
    // Add form state
    const [showAdd, setShowAdd] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');

    const worldItems = useMemo(() => {
        if (!activeWorld) return [];
        return items.filter(i => i.type === activeWorld);
    }, [items, activeWorld]);

    const enterWorld = (type: WorldType) => {
        setEntering(true);
        setTimeout(() => {
            setActiveWorld(type);
            setEntering(false);
        }, 600);
    };

    const exitWorld = () => {
        setExiting(true);
        setTimeout(() => {
            setActiveWorld(null);
            setExiting(false);
            setShowAdd(false);
            setExpandedId(null);
        }, 400);
    };

    const handleAdd = () => {
        if (newTitle.trim() || newContent.trim()) {
            if (activeWorld === 'REMINDER') {
                addItem(newContent.trim(), 'REMINDER', newTitle.trim() || 'Sem título', selectedDay);
            } else {
                addItem(newContent.trim(), activeWorld!, newTitle.trim() || 'Sem título');
            }
            setNewTitle('');
            setNewContent('');
            setShowAdd(false);
        }
    };

    const getWorldData = (type: WorldType) => WORLDS.find(w => w.type === type)!;
    const countByType = (type: WorldType) => items.filter(i => i.type === type).length;

    // ======== NEURAL MAP VIEW ========
    if (!activeWorld) {
        const noteCount = countByType('NOTE');
        const linkCount = countByType('LINK');
        const reminderCount = countByType('REMINDER');

        // Generate orbit particles for a given count & color
        const orbitParticles = (count: number, color: string, radius: number) => {
            const particles = Math.min(count, 12); // cap at 12
            return [...Array(particles)].map((_, i) => {
                const angle = (360 / particles) * i;
                return (
                    <div key={i} className="absolute w-full h-full" style={{
                        animation: `spin ${8 + (i % 3) * 2}s linear infinite`,
                        animationDelay: `${(i * 0.3)}s`,
                        transform: `rotate(${angle}deg)`
                    }}>
                        <div className="absolute rounded-full" style={{
                            width: `${4 + (i % 2) * 2}px`,
                            height: `${4 + (i % 2) * 2}px`,
                            top: `-${radius}px`,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: color,
                            boxShadow: `0 0 ${6 + i * 2}px ${color}`,
                            opacity: 0.6 + (i % 3) * 0.15
                        }} />
                    </div>
                );
            });
        };

        return (
            <div className={`pb-24 relative min-h-[80vh] transition-all duration-500 ${entering ? 'scale-110 opacity-0 blur-sm' : 'scale-100 opacity-100'}`}>
                {/* Inline keyframes for orbit spin */}
                <style jsx>{`
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    @keyframes spinReverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
                    @keyframes globeRotate { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
                    @keyframes floatY { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
                    @keyframes pulse3d { 0%,100% { box-shadow: 0 0 25px var(--glow), inset -8px -4px 15px rgba(0,0,0,0.4), inset 4px 2px 10px rgba(255,255,255,0.08); } 50% { box-shadow: 0 0 45px var(--glow), inset -8px -4px 15px rgba(0,0,0,0.4), inset 4px 2px 10px rgba(255,255,255,0.12); } }
                `}</style>

                {/* Header */}
                <div className="px-6 pt-6 mb-2 relative z-10">
                    <div className="flex items-center gap-3 mb-1">
                        <img src="/tbrain-logo.png" alt="TBrain" className="w-9 h-9 rounded-xl shadow-[0_0_12px_rgba(56,189,248,0.2)]" />
                        <div className="bg-purple-500/10 p-2.5 rounded-2xl border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                            <Brain className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-white">Cofre Neural</h1>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Toque em um mundo para explorar</p>
                        </div>
                    </div>
                </div>

                {/* Neural Graph Area */}
                <div className="relative z-10 px-6 mt-2">
                    <div className="relative w-full max-w-xs mx-auto" style={{ height: '380px' }}>

                        {/* Connection Lines SVG */}
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 380" xmlns="http://www.w3.org/2000/svg" style={{ zIndex: 0 }}>
                            {/* Notas → Links */}
                            <line x1="150" y1="95" x2="70" y2="270" stroke="url(#lg1)" strokeWidth="1" opacity="0.2" />
                            {/* Notas → Lembretes */}
                            <line x1="150" y1="95" x2="230" y2="270" stroke="url(#lg2)" strokeWidth="1" opacity="0.2" />
                            {/* Links → Lembretes */}
                            <line x1="70" y1="270" x2="230" y2="270" stroke="url(#lg3)" strokeWidth="1" opacity="0.2" />

                            {/* Traveling pulses */}
                            <circle r="3" fill="#a855f7" opacity="0.8" filter="url(#glowSvg)">
                                <animateMotion dur="2.5s" repeatCount="indefinite" path="M150,95 L70,270" />
                            </circle>
                            <circle r="3" fill="#3b82f6" opacity="0.8" filter="url(#glowSvg)">
                                <animateMotion dur="3s" repeatCount="indefinite" path="M150,95 L230,270" />
                            </circle>
                            <circle r="3" fill="#10b981" opacity="0.8" filter="url(#glowSvg)">
                                <animateMotion dur="3.2s" repeatCount="indefinite" path="M70,270 L230,270" />
                            </circle>
                            <circle r="2" fill="#c084fc" opacity="0.5" filter="url(#glowSvg)">
                                <animateMotion dur="4s" repeatCount="indefinite" path="M70,270 L150,95" />
                            </circle>
                            <circle r="2" fill="#6ee7b7" opacity="0.5" filter="url(#glowSvg)">
                                <animateMotion dur="4.5s" repeatCount="indefinite" path="M230,270 L150,95" />
                            </circle>

                            <defs>
                                <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#a855f7"/><stop offset="100%" stopColor="#3b82f6"/></linearGradient>
                                <linearGradient id="lg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#a855f7"/><stop offset="100%" stopColor="#10b981"/></linearGradient>
                                <linearGradient id="lg3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3b82f6"/><stop offset="100%" stopColor="#10b981"/></linearGradient>
                                <filter id="glowSvg"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                            </defs>
                        </svg>

                        {/* ===== NOTAS WORLD — Purple Nebula Planet ===== */}
                        <button onClick={() => enterWorld('NOTE')} className="absolute group" style={{ top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}>
                            <div style={{ animation: 'floatY 4s ease-in-out infinite' }}>
                                <div className="absolute inset-0 flex items-center justify-center" style={{ width: '115px', height: '115px', left: '-7.5px', top: '-7.5px' }}>
                                    {orbitParticles(noteCount, '#a855f7', 58)}
                                </div>
                                {/* Atmosphere glow */}
                                <div className="absolute -inset-3 rounded-full opacity-30 group-hover:opacity-50 transition-opacity" style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.4), transparent 70%)' }} />
                                {/* Planet body */}
                                <div className="w-[100px] h-[100px] rounded-full relative overflow-hidden cursor-pointer transition-transform duration-300 group-hover:scale-110 group-active:scale-95"
                                    style={{
                                        background: 'radial-gradient(circle at 30% 30%, #d8b4fe, #a855f7 35%, #7c3aed 55%, #581c87 75%, #1e0533)',
                                        boxShadow: '0 0 30px rgba(168,85,247,0.4), inset -12px -8px 20px rgba(0,0,0,0.5), inset 6px 4px 15px rgba(255,255,255,0.15)',
                                    }}
                                >
                                    {/* Surface texture — swirling clouds */}
                                    <div className="absolute inset-0 rounded-full overflow-hidden opacity-40"
                                        style={{ backgroundImage: `radial-gradient(ellipse at 60% 40%, rgba(192,132,252,0.5) 0%, transparent 50%), radial-gradient(ellipse at 25% 70%, rgba(139,92,246,0.4) 0%, transparent 40%), radial-gradient(ellipse at 80% 20%, rgba(216,180,254,0.3) 0%, transparent 35%)`, backgroundSize: '200% 100%', animation: 'globeRotate 10s linear infinite' }}
                                    />
                                    {/* Continent patches */}
                                    <div className="absolute inset-0 rounded-full overflow-hidden opacity-25"
                                        style={{ backgroundImage: `radial-gradient(ellipse at 45% 50%, rgba(192,132,252,0.8) 0%, transparent 30%), radial-gradient(ellipse at 70% 30%, rgba(168,85,247,0.6) 0%, transparent 25%), radial-gradient(ellipse at 20% 65%, rgba(147,51,234,0.5) 0%, transparent 20%)`, backgroundSize: '200% 100%', animation: 'globeRotate 15s linear infinite' }}
                                    />
                                    {/* Specular highlight */}
                                    <div className="absolute top-2 left-5 w-8 h-5 rounded-full bg-white/20 blur-sm" />
                                </div>
                            </div>
                            {/* Label below */}
                            <div className="text-center mt-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-purple-300 block">Notas</span>
                                <span className="text-[9px] font-bold text-purple-400/60">{noteCount}</span>
                            </div>
                        </button>

                        {/* ===== LINKS WORLD — Ocean Blue Planet ===== */}
                        <button onClick={() => enterWorld('LINK')} className="absolute group" style={{ top: '200px', left: '8%', zIndex: 2 }}>
                            <div style={{ animation: 'floatY 5s ease-in-out infinite', animationDelay: '1s' }}>
                                <div className="absolute inset-0 flex items-center justify-center" style={{ width: '100px', height: '100px', left: '-5px', top: '-5px' }}>
                                    {orbitParticles(linkCount, '#3b82f6', 50)}
                                </div>
                                <div className="absolute -inset-3 rounded-full opacity-30 group-hover:opacity-50 transition-opacity" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.4), transparent 70%)' }} />
                                <div className="w-[90px] h-[90px] rounded-full relative overflow-hidden cursor-pointer transition-transform duration-300 group-hover:scale-110 group-active:scale-95"
                                    style={{
                                        background: 'radial-gradient(circle at 30% 30%, #93c5fd, #3b82f6 35%, #2563eb 55%, #1d4ed8 75%, #0a1628)',
                                        boxShadow: '0 0 25px rgba(59,130,246,0.4), inset -10px -6px 18px rgba(0,0,0,0.5), inset 5px 3px 12px rgba(255,255,255,0.15)',
                                    }}
                                >
                                    {/* Ocean surface */}
                                    <div className="absolute inset-0 rounded-full overflow-hidden opacity-35"
                                        style={{ backgroundImage: `radial-gradient(ellipse at 55% 35%, rgba(96,165,250,0.6) 0%, transparent 45%), radial-gradient(ellipse at 30% 60%, rgba(59,130,246,0.5) 0%, transparent 35%)`, backgroundSize: '200% 100%', animation: 'globeRotate 12s linear infinite reverse' }}
                                    />
                                    {/* Land masses */}
                                    <div className="absolute inset-0 rounded-full overflow-hidden opacity-30"
                                        style={{ backgroundImage: `radial-gradient(ellipse at 40% 45%, rgba(34,211,238,0.6) 0%, transparent 20%), radial-gradient(ellipse at 65% 55%, rgba(14,165,233,0.5) 0%, transparent 18%), radial-gradient(ellipse at 25% 30%, rgba(56,189,248,0.4) 0%, transparent 15%)`, backgroundSize: '200% 100%', animation: 'globeRotate 18s linear infinite reverse' }}
                                    />
                                    <div className="absolute top-2 left-4 w-6 h-4 rounded-full bg-white/20 blur-sm" />
                                </div>
                            </div>
                            <div className="text-center mt-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-300 block">Links</span>
                                <span className="text-[9px] font-bold text-blue-400/60">{linkCount}</span>
                            </div>
                        </button>

                        {/* ===== LEMBRETES WORLD — Verdant Green Planet ===== */}
                        <button onClick={() => enterWorld('REMINDER')} className="absolute group" style={{ top: '200px', right: '8%', zIndex: 2 }}>
                            <div style={{ animation: 'floatY 4.5s ease-in-out infinite', animationDelay: '2s' }}>
                                <div className="absolute inset-0 flex items-center justify-center" style={{ width: '100px', height: '100px', left: '-5px', top: '-5px' }}>
                                    {orbitParticles(reminderCount, '#10b981', 50)}
                                </div>
                                <div className="absolute -inset-3 rounded-full opacity-30 group-hover:opacity-50 transition-opacity" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.4), transparent 70%)' }} />
                                <div className="w-[90px] h-[90px] rounded-full relative overflow-hidden cursor-pointer transition-transform duration-300 group-hover:scale-110 group-active:scale-95"
                                    style={{
                                        background: 'radial-gradient(circle at 30% 30%, #6ee7b7, #10b981 35%, #059669 55%, #047857 75%, #022c22)',
                                        boxShadow: '0 0 25px rgba(16,185,129,0.4), inset -10px -6px 18px rgba(0,0,0,0.5), inset 5px 3px 12px rgba(255,255,255,0.15)',
                                    }}
                                >
                                    {/* Forest surface */}
                                    <div className="absolute inset-0 rounded-full overflow-hidden opacity-35"
                                        style={{ backgroundImage: `radial-gradient(ellipse at 50% 40%, rgba(52,211,153,0.5) 0%, transparent 40%), radial-gradient(ellipse at 35% 65%, rgba(16,185,129,0.4) 0%, transparent 30%)`, backgroundSize: '200% 100%', animation: 'globeRotate 11s linear infinite' }}
                                    />
                                    {/* Land features */}
                                    <div className="absolute inset-0 rounded-full overflow-hidden opacity-25"
                                        style={{ backgroundImage: `radial-gradient(ellipse at 55% 50%, rgba(110,231,183,0.6) 0%, transparent 22%), radial-gradient(ellipse at 30% 35%, rgba(52,211,153,0.5) 0%, transparent 16%)`, backgroundSize: '200% 100%', animation: 'globeRotate 16s linear infinite' }}
                                    />
                                    <div className="absolute top-2 left-4 w-6 h-4 rounded-full bg-white/20 blur-sm" />
                                </div>
                            </div>
                            <div className="text-center mt-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 block">Lembretes</span>
                                <span className="text-[9px] font-bold text-emerald-400/60">{reminderCount}</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-2 relative z-10 px-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{items.length} sinapses totais armazenadas</span>
                </div>
            </div>
        );
    }
    // ======== REMINDERS — Day of Week View ========
    if (activeWorld === 'REMINDER') {
        const todayDow = new Date().getDay();
        const dayInfo = WEEKDAYS.find(d => d.id === selectedDay)!;
        const dayReminders = worldItems.filter(item => {
            const wd = item.weekday !== undefined ? item.weekday : todayDow;
            return wd === selectedDay;
        });

        return (
            <div 
                className={`pb-24 px-6 pt-6 transition-all duration-500 ${exiting ? 'scale-95 opacity-0 blur-sm' : 'animate-in fade-in zoom-in-95 duration-500'}`}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* Back button */}
                <div className="flex items-center justify-between mb-5">
                    <button onClick={exitWorld} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-bold uppercase tracking-widest">Mapa Neural</span>
                    </button>
                    <button onClick={() => setShowAdd(!showAdd)} className="p-2 rounded-xl border transition-all" style={{ backgroundColor: dayInfo.bg, borderColor: dayInfo.border, color: dayInfo.color }}>
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Day Selector Pills */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                    {WEEKDAYS.map(day => {
                        const isActive = selectedDay === day.id;
                        const isToday = todayDow === day.id;
                        const dayCount = worldItems.filter(i => (i.weekday ?? todayDow) === day.id).length;
                        return (
                            <button
                                key={day.id}
                                onClick={() => setSelectedDay(day.id)}
                                className="flex flex-col items-center gap-1 rounded-2xl px-3 py-3 transition-all duration-300 min-w-[48px] relative"
                                style={{
                                    backgroundColor: isActive ? day.bg : 'transparent',
                                    border: `1.5px solid ${isActive ? day.border : 'rgba(255,255,255,0.05)'}`,
                                    boxShadow: isActive ? `0 0 20px ${day.bg}` : 'none',
                                    transform: isActive ? 'scale(1.05)' : 'scale(1)',
                                }}
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: isActive ? day.color : '#71717a' }}>
                                    {day.short}
                                </span>
                                {dayCount > 0 && (
                                    <span className="text-[9px] font-bold" style={{ color: isActive ? day.color : '#52525b' }}>
                                        {dayCount}
                                    </span>
                                )}
                                {isToday && (
                                    <div className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: day.color }} />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Day Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex w-14 h-14 rounded-full items-center justify-center mb-2" style={{ backgroundColor: dayInfo.bg, border: `1.5px solid ${dayInfo.border}`, boxShadow: `0 0 30px ${dayInfo.bg}` }}>
                        <Bell className="w-6 h-6" style={{ color: dayInfo.color }} />
                    </div>
                    <h2 className="text-xl font-black text-white">{dayInfo.full}</h2>
                    <p className="text-xs text-zinc-500 mt-1">{dayReminders.length} {dayReminders.length === 1 ? 'lembrete' : 'lembretes'}</p>
                </div>

                {/* Add Form */}
                {showAdd && (
                    <div className="glass-panel rounded-2xl p-5 mb-6 animate-in fade-in slide-in-from-top-3 duration-300" style={{ backgroundColor: dayInfo.bg, borderColor: dayInfo.border, border: `1px solid ${dayInfo.border}` }}>
                        <input 
                            type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} 
                            placeholder="Título do lembrete..." 
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-white/30 mb-2 placeholder:text-zinc-600"
                        />
                        <input 
                            type="text" value={newContent} onChange={e => setNewContent(e.target.value)} 
                            placeholder="Detalhe (opcional)..." 
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 mb-3 placeholder:text-zinc-600"
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-zinc-400 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all">Cancelar</button>
                            <button onClick={handleAdd} className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all" style={{ backgroundColor: dayInfo.bg, borderColor: dayInfo.border, border: `1px solid ${dayInfo.border}`, color: dayInfo.color }}>
                                <Zap className="w-3.5 h-3.5" /> Adicionar
                            </button>
                        </div>
                    </div>
                )}

                {/* Swipe hint */}
                <div className="flex items-center justify-center gap-2 mb-4">
                    <ChevronLeft className="w-3 h-3 text-zinc-700" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-700">Deslize para trocar dia</span>
                    <ChevronRight className="w-3 h-3 text-zinc-700" />
                </div>

                {/* Reminders List */}
                <div className="space-y-3">
                    {dayReminders.map(item => (
                        <div key={item.id} className="glass-panel rounded-2xl overflow-hidden group transition-all" style={{ border: `1px solid ${item.completed ? 'rgba(255,255,255,0.03)' : dayInfo.border}`, opacity: item.completed ? 0.4 : 1 }}>
                            <div className="p-4 flex items-start gap-3 relative z-10">
                                <button onClick={() => toggleItem(item.id)} className="flex-shrink-0 mt-0.5">
                                    {item.completed ? <CheckCircle2 className="w-5 h-5" style={{ color: dayInfo.color }} /> : <Circle className="w-5 h-5 text-zinc-500 hover:text-emerald-400 transition-colors" />}
                                </button>

                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-bold ${item.completed ? 'line-through text-zinc-500' : 'text-zinc-100'}`}>
                                        {item.title || 'Lembrete'}
                                    </p>
                                    {item.content && (
                                        <p className={`text-xs mt-1 leading-relaxed ${item.completed ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                            {item.content}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </span>
                                        
                                        {/* Move to day button */}
                                        {movingItemId === item.id ? (
                                            <div className="flex gap-1 animate-in fade-in duration-200">
                                                {WEEKDAYS.map(d => (
                                                    <button 
                                                        key={d.id} 
                                                        onClick={() => { updateItemDay(item.id, d.id); setMovingItemId(null); }}
                                                        className="w-6 h-6 rounded-lg text-[8px] font-black uppercase flex items-center justify-center transition-all hover:scale-110"
                                                        style={{ 
                                                            backgroundColor: d.id === selectedDay ? d.bg : 'rgba(255,255,255,0.03)',
                                                            border: `1px solid ${d.id === selectedDay ? d.border : 'rgba(255,255,255,0.08)'}`,
                                                            color: d.id === selectedDay ? d.color : '#71717a' 
                                                        }}
                                                    >
                                                        {d.short[0]}
                                                    </button>
                                                ))}
                                                <button onClick={() => setMovingItemId(null)} className="ml-1 text-zinc-600 hover:text-zinc-400">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setMovingItemId(item.id)} className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: dayInfo.color }}>
                                                <MoveHorizontal className="w-3 h-3" /> Mover
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <button onClick={() => deleteItem(item.id)} className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {dayReminders.length === 0 && (
                        <div className="text-center py-12 rounded-[2rem] relative overflow-hidden" style={{ border: `1px dashed ${dayInfo.border}`, backgroundColor: dayInfo.bg }}>
                            <div className="text-4xl mb-3">🔔</div>
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Nenhum lembrete para {dayInfo.full}.</p>
                            <p className="text-[10px] text-zinc-600 mt-1">Toque no + acima para criar.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }


    const world = getWorldData(activeWorld);
    const colorMap: Record<string, { border: string; bg: string; text: string; glow: string; ring: string }> = {
        purple: { border: 'border-purple-500/30', bg: 'bg-purple-500/10', text: 'text-purple-400', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.2)]', ring: 'ring-purple-500/30' },
        blue:   { border: 'border-blue-500/30',   bg: 'bg-blue-500/10',   text: 'text-blue-400',   glow: 'shadow-[0_0_20px_rgba(59,130,246,0.2)]',  ring: 'ring-blue-500/30' },
        emerald:{ border: 'border-emerald-500/30', bg: 'bg-emerald-500/10',text: 'text-emerald-400',glow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]', ring: 'ring-emerald-500/30' },
    };
    const c = colorMap[world.color];

    return (
        <div className={`pb-24 px-6 pt-6 transition-all duration-500 ${exiting ? 'scale-95 opacity-0 blur-sm' : 'animate-in fade-in zoom-in-95 duration-500'}`}>
            
            {/* World Header */}
            <div className="flex items-center justify-between mb-6">
                <button onClick={exitWorld} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group">
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-widest">Mapa Neural</span>
                </button>
                <button onClick={() => setShowAdd(!showAdd)} className={`${c.bg} ${c.text} p-2 rounded-xl border ${c.border} hover:opacity-80 transition-all`}>
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {/* World Title */}
            <div className="text-center mb-8">
                <div className={`inline-flex w-20 h-20 rounded-full bg-gradient-to-br ${world.gradient} items-center justify-center mb-3 ${c.glow}`} style={{boxShadow: `0 0 40px ${world.glow}`}}>
                    <span className="text-3xl">{world.emoji}</span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">{world.label}</h2>
                <p className="text-xs text-zinc-500 font-medium mt-1">{world.desc}</p>
                <span className={`inline-block mt-2 text-[10px] font-bold uppercase tracking-widest ${c.text} ${c.bg} px-3 py-1 rounded-full border ${c.border}`}>
                    {worldItems.length} {worldItems.length === 1 ? 'item' : 'itens'}
                </span>
            </div>

            {/* Add Form */}
            {showAdd && (
                <div className={`glass-panel rounded-2xl p-5 mb-6 border ${c.border} ${c.bg} animate-in fade-in slide-in-from-top-3 duration-300`}>
                    <input 
                        type="text" 
                        value={newTitle} 
                        onChange={e => setNewTitle(e.target.value)} 
                        placeholder={activeWorld === 'NOTE' ? 'Título da nota...' : activeWorld === 'LINK' ? 'Nome do link...' : 'Título do lembrete...'} 
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-white/30 mb-2 placeholder:text-zinc-600"
                    />
                    {activeWorld === 'NOTE' ? (
                        <textarea
                            value={newContent}
                            onChange={e => setNewContent(e.target.value)}
                            placeholder="Escreva o conteúdo da nota..."
                            rows={4}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 resize-none mb-3 placeholder:text-zinc-600"
                        />
                    ) : (
                        <input 
                            type="text" 
                            value={newContent} 
                            onChange={e => setNewContent(e.target.value)} 
                            placeholder={activeWorld === 'LINK' ? 'Cole a URL aqui...' : 'Detalhe do lembrete...'}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 mb-3 placeholder:text-zinc-600"
                        />
                    )}
                    <div className="flex gap-2">
                        <button onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-zinc-400 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all">Cancelar</button>
                        <button onClick={handleAdd} className={`flex-1 py-3 rounded-xl border ${c.border} ${c.bg} ${c.text} text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-all flex items-center justify-center gap-2`}>
                            <Zap className="w-3.5 h-3.5" /> Disparar
                        </button>
                    </div>
                </div>
            )}

            {/* Items List */}
            <div className="space-y-3">
                {worldItems.map(item => {
                    const isExpanded = expandedId === item.id;
                    const isNote = item.type === 'NOTE';

                    return (
                        <div key={item.id} className={`glass-panel rounded-2xl border transition-all group overflow-hidden ${item.completed ? 'opacity-40 border-white/5' : `${c.border} hover:bg-white/[0.02]`}`}>
                            <div className={`absolute top-0 left-0 w-full h-16 bg-gradient-to-b ${c.bg.replace('bg-', 'from-').replace('/10', '/5')} to-transparent pointer-events-none`} />

                            <button
                                onClick={() => isNote ? setExpandedId(isExpanded ? null : item.id) : undefined}
                                className="w-full p-4 flex items-start gap-3 text-left relative z-10"
                            >
                                {item.type === 'REMINDER' ? (
                                    <button onClick={(e) => { e.stopPropagation(); toggleItem(item.id); }} className="flex-shrink-0 mt-0.5">
                                        {item.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-zinc-500 hover:text-emerald-400 transition-colors" />}
                                    </button>
                                ) : (
                                    <div className={`flex-shrink-0 mt-1 w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center`}>
                                        {item.type === 'LINK' ? <LinkIcon className="w-4 h-4 text-blue-400" /> : <FileText className="w-4 h-4 text-purple-400" />}
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-bold ${item.completed ? 'line-through text-zinc-500' : 'text-zinc-100'}`}>
                                        {item.title || (item.type === 'LINK' ? 'Link' : item.type === 'REMINDER' ? 'Lembrete' : 'Nota')}
                                    </p>
                                    
                                    {!isExpanded && item.content && (
                                        <p className={`text-xs mt-1 leading-relaxed ${item.completed ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                            {item.type === 'LINK' ? (
                                                <a href={item.content} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline" onClick={e => e.stopPropagation()}>{item.content}</a>
                                            ) : item.content.length > 80 ? item.content.substring(0, 80) + '…' : item.content}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                                            {new Date(item.createdAt).toLocaleDateString()} · {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                        {isNote && item.content && (
                                            <span className={`text-[9px] font-bold uppercase tracking-widest ${c.text} flex items-center gap-1 opacity-60`}>
                                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                {isExpanded ? 'Recolher' : 'Ler'}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <button onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }} className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </button>

                            {isExpanded && isNote && (
                                <div className="px-5 pb-5 pt-0 animate-in fade-in slide-in-from-top-2 duration-300 relative z-10">
                                    <div className={`bg-black/30 rounded-xl p-4 border ${c.border} shadow-inner`}>
                                        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap font-medium">
                                            {item.content || 'Nota sem conteúdo.'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {worldItems.length === 0 && (
                    <div className={`text-center py-12 border border-dashed ${c.border} rounded-[2rem] ${c.bg} relative overflow-hidden`}>
                        <div className="text-4xl mb-3">{world.emoji}</div>
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Nenhum item neste mundo.</p>
                        <p className="text-[10px] text-zinc-600 mt-1">Toque no + acima para criar.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
