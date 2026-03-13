"use client";

import dynamic from 'next/dynamic';
import BottomNav from "@/components/BottomNav";
import { useAgentStore } from "@/store";

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
