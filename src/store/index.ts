import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
    updateSpending: (amount: number) => void;
    addTransaction: (amount: number, type: 'income' | 'expense') => void;
    deleteTransaction: (id: string) => void;
    setMonthlyIncome: (amount: number) => void;
    addFixedCost: (cost: Omit<FixedCost, 'id'>) => void;
    deleteFixedCost: (id: string) => void;
    payInstallment: (id: string) => void;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
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
        updateSpending: (amount) => set((state) => ({ 
            spentToday: state.spentToday + amount,
            monthlySpent: state.monthlySpent + amount
        })),
        addTransaction: (amount, type) => set((state) => {
            const newTransaction: Transaction = {
                id: Math.random().toString(36).substring(7),
                amount,
                type,
                createdAt: Date.now()
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
        }),
        deleteTransaction: (id) => set((state) => {
            const transaction = state.transactions.find(t => t.id === id);
            if (!transaction) return state;

            const isIncome = transaction.type === 'income';
            return {
                transactions: state.transactions.filter(t => t.id !== id),
                monthlyIncome: isIncome ? state.monthlyIncome - transaction.amount : state.monthlyIncome,
                spentToday: !isIncome ? state.spentToday - transaction.amount : state.spentToday,
                monthlySpent: !isIncome ? state.monthlySpent - transaction.amount : state.monthlySpent
            };
        }),
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
    addHabit: (name: string, type: 'DAILY' | 'WEEKLY' | 'MONTHLY', urgency: 'HIGH' | 'NORMAL', deadline?: string) => void;
    deleteHabit: (id: number) => void;
    toggleHabit: (id: number) => boolean;
}

export const useHabitsStore = create<HabitState>()(
  persist(
    (set, get) => ({
        habits: [
            { id: 1, name: 'Meditação 10 Minutos', streak: 4, completed: false, type: 'DAILY', urgency: 'NORMAL' },
            { id: 2, name: 'Ler 20 páginas', streak: 12, completed: true, type: 'DAILY', urgency: 'NORMAL' },
            { id: 3, name: 'Revisar TScript Logs', streak: 0, completed: false, type: 'WEEKLY', urgency: 'HIGH' },
        ],
        addHabit: (name, type, urgency, deadline) => set((state) => ({
            habits: [...state.habits, { id: Date.now(), name, type, urgency, deadline, streak: 0, completed: false }]
        })),
        deleteHabit: (id) => set((state) => ({
            habits: state.habits.filter(h => h.id !== id)
        })),
        toggleHabit: (id) => {
            let justCompleted = false;
            set((state) => ({
                habits: state.habits.map(habit => {
                    if (habit.id === id) {
                        const isNowCompleted = !habit.completed;
                        if (isNowCompleted) justCompleted = true;
                        return {
                            ...habit,
                            completed: isNowCompleted,
                            streak: isNowCompleted ? habit.streak + 1 : habit.streak - 1
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
    addItem: (content: string, type: 'NOTE' | 'LINK' | 'REMINDER', title?: string, weekday?: number) => void;
    toggleItem: (id: string) => void;
    deleteItem: (id: string) => void;
    updateItemDay: (id: string, weekday: number) => void;
}

export const useVaultStore = create<VaultState>()(
  persist(
    (set) => ({
        items: [],
        addItem: (content, type, title, weekday) => set((state) => ({
            items: [{
                id: Math.random().toString(36).substring(7),
                title: title || '',
                content,
                type,
                createdAt: Date.now(),
                completed: false,
                weekday: weekday !== undefined ? weekday : undefined
            }, ...state.items]
        })),
        toggleItem: (id) => set((state) => ({
            items: state.items.map(item => item.id === id ? { ...item, completed: !item.completed } : item)
        })),
        deleteItem: (id) => set((state) => ({
            items: state.items.filter(item => item.id !== id)
        })),
        updateItemDay: (id, weekday) => set((state) => ({
            items: state.items.map(item => item.id === id ? { ...item, weekday } : item)
        }))
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
