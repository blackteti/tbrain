import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '../utils/supabase/client';

const supabase = createClient();

interface AgentState {
    isConnected: boolean;
    isThinking: boolean;
    currentRoute: string;
    setConnection: (status: boolean) => void;
    setThinking: (status: boolean) => void;
    setRoute: (route: string) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
    isConnected: false,
    isThinking: false,
    currentRoute: 'dashboard',
    setConnection: (status) => set({ isConnected: status }),
    setThinking: (status) => set({ isThinking: status }),
    setRoute: (route) => set({ currentRoute: route }),
}));

export interface FixedCost {
    id: string;
    name: string;
    totalAmount: number;
    installmentAmount: number;
    totalInstallments: number;
    paidInstallments: number;
    dueDate: number; // Day of the month
}

export interface Transaction {
    id: string;
    amount: number;
    type: 'income' | 'expense';
    createdAt: number;
}

interface FinanceState {
    dailyLimit: number;
    spentToday: number;
    monthlyIncome: number;
    monthlySpent: number;
    currency: string;
    fixedCosts: FixedCost[];
    transactions: Transaction[];
    fetchFinance: () => Promise<void>;
    updateSpending: (amount: number) => void;
    addTransaction: (amount: number, type: 'income' | 'expense') => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    setMonthlyIncome: (amount: number) => void;
    addFixedCost: (cost: Omit<FixedCost, 'id'>) => void;
    deleteFixedCost: (id: string) => void;
    payInstallment: (id: string) => void;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
        dailyLimit: 150,
        spentToday: 0,
        monthlyIncome: 0,
        monthlySpent: 0,
        currency: 'BRL',
        fixedCosts: [
            { id: 'mock1', name: 'Notebook Pro', totalAmount: 5000, installmentAmount: 500, totalInstallments: 10, paidInstallments: 3, dueDate: 5 },
            { id: 'mock2', name: 'Assinatura TBrain', totalAmount: 120, installmentAmount: 120, totalInstallments: 1, paidInstallments: 0, dueDate: 10 }
        ],
        transactions: [],
        fetchFinance: async () => {
            const { data } = await supabase.from('transacoes').select('*').order('criado_em', { ascending: false });
            if (data) {
                const txs: Transaction[] = data.map(d => ({
                    id: d.id,
                    amount: Number(d.valor),
                    type: (d.tipo === 'INCOME' ? 'income' : 'expense') as 'income' | 'expense',
                    createdAt: new Date(d.criado_em).getTime()
                }));
                // Calculate today's spend
                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);
                const todaySpend = txs
                    .filter(t => t.type === 'expense' && t.createdAt >= startOfDay.getTime())
                    .reduce((acc, t) => acc + t.amount, 0);

                set({ transactions: txs, spentToday: todaySpend });
            }
        },
        updateSpending: (amount) => set((state) => ({ 
            spentToday: state.spentToday + amount,
            monthlySpent: state.monthlySpent + amount
        })),
        addTransaction: async (amount, type) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase.from('transacoes').insert({
                user_id: user.id,
                valor: amount,
                tipo: type === 'income' ? 'INCOME' : 'EXPENSE'
            }).select().single();

            if (error) console.error('Erro ao salvar transação:', error);

            if (data) {
                set((state) => {
                    const newTransaction: Transaction = {
                        id: data.id,
                        amount: Number(data.valor),
                        type: data.tipo === 'INCOME' ? 'income' : 'expense',
                        createdAt: new Date(data.criado_em).getTime()
                    };
                    
                    if (type === 'income') {
                        return { 
                            monthlyIncome: state.monthlyIncome + amount,
                            transactions: [newTransaction, ...state.transactions]
                        };
                    } else {
                        return { 
                            spentToday: state.spentToday + amount, 
                            monthlySpent: state.monthlySpent + amount,
                            transactions: [newTransaction, ...state.transactions]
                        };
                    }
                });
            }
        },
        deleteTransaction: async (id) => {
            const { error } = await supabase.from('transacoes').delete().eq('id', id);
            if (error) {
                console.error('Erro ao deletar transação:', error);
                return;
            }

            set((state) => {
                const transaction = state.transactions.find(t => t.id === id);
                if (!transaction) return state;

                const isIncome = transaction.type === 'income';
                return {
                    transactions: state.transactions.filter(t => t.id !== id),
                    monthlyIncome: isIncome ? state.monthlyIncome - transaction.amount : state.monthlyIncome,
                    spentToday: !isIncome ? state.spentToday - transaction.amount : state.spentToday,
                    monthlySpent: !isIncome ? state.monthlySpent - transaction.amount : state.monthlySpent
                };
            });
        },
        setMonthlyIncome: (amount) => set({ monthlyIncome: amount }),
        addFixedCost: (cost) => set((state) => ({
            fixedCosts: [...state.fixedCosts, { ...cost, id: Math.random().toString(36).substring(7) }]
        })),
        deleteFixedCost: (id) => set((state) => ({
            fixedCosts: state.fixedCosts.filter(c => c.id !== id)
        })),
        payInstallment: (id) => set((state) => ({
            fixedCosts: state.fixedCosts.map(c => 
                c.id === id ? { ...c, paidInstallments: Math.min(c.paidInstallments + 1, c.totalInstallments) } : c
            )
        }))
    }),
    {
      name: 'tscript-finance-storage', // unique name
    }
  )
);

export interface Habit {
    id: number;
    name: string;
    streak: number;
    completed: boolean;
    type: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    urgency: 'HIGH' | 'NORMAL';
    deadline?: string; // ISO time string e.g. '14:30' or full date
}

interface HabitState {
    habits: Habit[];
    fetchHabits: () => Promise<void>;
    addHabit: (name: string, type: 'DAILY' | 'WEEKLY' | 'MONTHLY', urgency: 'HIGH' | 'NORMAL', deadline?: string) => Promise<void>;
    deleteHabit: (id: number | string) => Promise<void>;
    toggleHabit: (id: number | string) => Promise<boolean>;
}

export const useHabitsStore = create<HabitState>()(
  persist(
    (set, get) => ({
        habits: [],
        fetchHabits: async () => {
            const { data } = await supabase.from('habitos').select('*');
            if (data) {
                set({ habits: data.map(d => ({
                    id: d.id,
                    name: d.nome,
                    type: d.frequencia as any,
                    urgency: d.urgencia as any,
                    completed: d.concluido_hoje,
                    streak: 0 // TODO: logic for streaks
                })) });
            }
        },
        addHabit: async (name, type, urgency, deadline) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase.from('habitos').insert({
                user_id: user.id,
                nome: name,
                frequencia: type,
                urgencia: urgency
            }).select().single();

            if (data) {
                set((state) => ({
                    habits: [...state.habits, { id: data.id, name, type, urgency, deadline, streak: 0, completed: false }]
                }));
            }
        },
        deleteHabit: async (id) => {
            await supabase.from('habitos').delete().eq('id', id);
            set((state) => ({
                habits: state.habits.filter(h => h.id !== id)
            }));
        },
        toggleHabit: async (id) => {
            const habit = get().habits.find(h => h.id === id);
            if (!habit) return false;

            const newStatus = !habit.completed;
            const { error } = await supabase.from('habitos').update({ concluido_hoje: newStatus }).eq('id', id);
            
            if (error) return false;

            let justCompleted = false;
            set((state) => ({
                habits: state.habits.map(habit => {
                    if (habit.id === id) {
                        const isNowCompleted = newStatus;
                        if (isNowCompleted) justCompleted = true;
                        return {
                            ...habit,
                            completed: isNowCompleted,
                            streak: isNowCompleted ? habit.streak + 1 : Math.max(0, habit.streak - 1)
                        };
                    }
                    return habit;
                })
            }));
            return justCompleted;
        }
    }),
    {
      name: 'tscript-habits-storage',
    }
  )
);

interface AuthState {
    token: string | null;
    user: any | null;
    login: (token: string, user: any) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    user: null,
    login: (token, user) => set({ token, user }),
    logout: () => set({ token: null, user: null }),
}));

export interface ProfileTraits {
    profession: string;
    primaryFocus: string;
    financialProfile: string;
    geminiKey: string;
}

interface ProfileState {
    traits: ProfileTraits;
    updateTraits: (traits: Partial<ProfileTraits>) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
        traits: {
            profession: 'Engenheiro de Software',
            primaryFocus: 'Operações e Escalabilidade',
            financialProfile: 'Conservador / Acúmulo',
            geminiKey: ''
        },
        updateTraits: (newTraits) => set((state) => ({
            traits: { ...state.traits, ...newTraits }
        }))
    }),
    {
      name: 'tscript-profile-storage'
    }
  )
);

export interface FocusState {
    isFocusMode: boolean;
    activeHabitId: number | null;
    startFocus: (habitId: number) => void;
    stopFocus: () => void;
}

export const useFocusStore = create<FocusState>((set) => ({
    isFocusMode: false,
    activeHabitId: null,
    startFocus: (habitId) => set({ isFocusMode: true, activeHabitId: habitId }),
    stopFocus: () => set({ isFocusMode: false, activeHabitId: null })
}));

export interface VaultItem {
    id: string;
    title: string;
    content: string;
    type: 'NOTE' | 'LINK' | 'REMINDER';
    createdAt: number;
    completed: boolean;
    weekday?: number; // 0=Dom, 1=Seg, ..., 6=Sáb — only for REMINDER
}

interface VaultState {
    items: VaultItem[];
    fetchItems: () => Promise<void>;
    addItem: (content: string, type: 'NOTE' | 'LINK' | 'REMINDER', title?: string, weekday?: number) => Promise<void>;
    toggleItem: (id: string) => Promise<void>;
    deleteItem: (id: string) => Promise<void>;
    updateItemDay: (id: string, weekday: number) => Promise<void>;
}

export const useVaultStore = create<VaultState>()(
  persist(
    (set, get) => ({
        items: [],
        fetchItems: async () => {
            const { data } = await supabase.from('cofre_neural').select('*').order('criado_em', { ascending: false });
            if (data) {
                set({ items: data.map(d => ({
                    id: d.id,
                    title: d.titulo,
                    content: d.conteudo,
                    type: d.tipo as any,
                    createdAt: new Date(d.criado_em).getTime(),
                    completed: d.concluido,
                    weekday: d.dia_semana
                })) });
            }
        },
        addItem: async (content, type, title, weekday) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase.from('cofre_neural').insert({
                user_id: user.id,
                tipo: type,
                titulo: title,
                conteudo: content,
                dia_semana: weekday
            }).select().single();

            if (data) {
                set((state) => ({
                    items: [{
                        id: data.id,
                        title: data.titulo || '',
                        content: data.conteudo,
                        type: data.tipo as any,
                        createdAt: new Date(data.criado_em).getTime(),
                        completed: data.concluido,
                        weekday: data.dia_semana !== null ? data.dia_semana : undefined
                    }, ...state.items]
                }));
            }
        },
        toggleItem: async (id) => {
            const item = get().items.find(i => i.id === id);
            if (!item) return;

            const newStatus = !item.completed;
            await supabase.from('cofre_neural').update({ concluido: newStatus }).eq('id', id);

            set((state) => ({
                items: state.items.map(item => item.id === id ? { ...item, completed: newStatus } : item)
            }));
        },
        deleteItem: async (id) => {
            await supabase.from('cofre_neural').delete().eq('id', id);
            set((state) => ({
                items: state.items.filter(item => item.id !== id)
            }));
        },
        updateItemDay: async (id, weekday) => {
            await supabase.from('cofre_neural').update({ dia_semana: weekday }).eq('id', id);
            set((state) => ({
                items: state.items.map(item => item.id === id ? { ...item, weekday } : item)
            }));
        }
    }),
    { name: 'tscript-vault-storage' }
  )
);

// ============ SAVINGS GOALS (Dream Vaults) ============
export interface SavingGoal {
    id: string;
    name: string;
    emoji: string;
    targetAmount: number;
    currentAmount: number;
}

interface SavingsState {
    goals: SavingGoal[];
    addGoal: (name: string, emoji: string, targetAmount: number) => void;
    depositToGoal: (id: string, amount: number) => void;
    deleteGoal: (id: string) => void;
}

export const useSavingsStore = create<SavingsState>()(
  persist(
    (set) => ({
        goals: [],
        addGoal: (name, emoji, targetAmount) => set((state) => ({
            goals: [...state.goals, { id: Math.random().toString(36).substring(7), name, emoji, targetAmount, currentAmount: 0 }]
        })),
        depositToGoal: (id, amount) => set((state) => ({
            goals: state.goals.map(g => g.id === id ? { ...g, currentAmount: Math.min(g.currentAmount + amount, g.targetAmount) } : g)
        })),
        deleteGoal: (id) => set((state) => ({
            goals: state.goals.filter(g => g.id !== id)
        }))
    }),
    { name: 'tbrain-savings-storage' }
  )
);

// ============ THEME ============
interface ThemeState {
    theme: 'dark' | 'light';
    toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
        theme: 'dark',
        toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' }))
    }),
    { name: 'tbrain-theme-storage' }
  )
);
