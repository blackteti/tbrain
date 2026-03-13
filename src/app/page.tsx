"use client";

import dynamic from 'next/dynamic';
import React, { useEffect } from 'react';
import BottomNav from "@/components/BottomNav";
import { useAgentStore, useHabitsStore, useVaultStore, useFinanceStore } from "@/store";
import { createClient } from '@/utils/supabase/client';

const Dashboard = dynamic(() => import('@/features/dashboard/Dashboard'), { 
    ssr: false, 
    loading: () => <div className="h-[70vh] w-full animate-pulse bg-white/5 rounded-3xl" /> 
});
const FinanceReport = dynamic(() => import('@/features/finance/FinanceReport'), { 
    ssr: false,
    loading: () => <div className="h-[70vh] w-full animate-pulse bg-white/5 rounded-3xl" />
});
const HabitsList = dynamic(() => import('@/features/habits/HabitsList'), { 
    ssr: false,
    loading: () => <div className="h-[70vh] w-full animate-pulse bg-white/5 rounded-3xl" />
});
const ProfileDashboard = dynamic(() => import('@/features/profile/ProfileDashboard'), { 
    ssr: false,
    loading: () => <div className="h-[70vh] w-full animate-pulse bg-white/5 rounded-3xl" />
});
const VaultDashboard = dynamic(() => import('@/features/vault/VaultDashboard'), { 
    ssr: false,
    loading: () => <div className="h-[70vh] w-full animate-pulse bg-white/5 rounded-3xl" />
});
const FocusCapsule = dynamic(() => import('@/features/productivity/FocusCapsule'), { 
    ssr: false
});
const HabitTracker = dynamic(() => import('@/features/tracker/HabitTracker'), { 
    ssr: false,
    loading: () => <div className="h-[70vh] w-full animate-pulse bg-white/5 rounded-3xl" />
});

export default function Home() {
  const { currentRoute } = useAgentStore();
  const { fetchHabits } = useHabitsStore();
  const { fetchItems } = useVaultStore();
  const { fetchFinance } = useFinanceStore();

  useEffect(() => {
    // Sincronizar dados do Supabase ao iniciar
    const syncData = async () => {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            console.log('Sincronizando dados para o usuário:', session.user.email);
            fetchHabits();
            fetchItems();
            fetchFinance();
        }
    };

    syncData();
  }, [fetchHabits, fetchItems, fetchFinance]);

  return (
    <>
      <div className="animate-in fade-in duration-500">
        {currentRoute === 'dashboard' && <Dashboard />}
        {currentRoute === 'finance' && <FinanceReport />}
        {currentRoute === 'tracker' && <HabitTracker />}
        {currentRoute === 'habits' && <HabitsList />}
        {currentRoute === 'vault' && <VaultDashboard />}
        {currentRoute === 'profile' && <ProfileDashboard />}
      </div>
      
      <BottomNav />
      <FocusCapsule />
    </>
  );
}
