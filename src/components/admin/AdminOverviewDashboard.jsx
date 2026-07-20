import React from 'react';
import KpiCards from './KpiCards';
import WalkStatusDonutChart from './WalkStatusDonutChart';
import RevenuePayoutsChart from './RevenuePayoutsChart';
import { useLanguage } from "@/components/LanguageContext";

export default function AdminOverviewDashboard({ 
  bookings = [], 
  users = [], 
  walkers = [],
  trainers = [],
  payments = [],
  isLoading = false 
}) {
  const { language } = useLanguage();

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Resumo operacional</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950 md:text-3xl">Visão Geral</h2>
        <p className="mt-1 text-sm text-slate-600">Indicadores essenciais da atividade da plataforma.</p>
      </div>

      {/* 1. KPIs Section */}
      <KpiCards 
        bookings={bookings} 
        users={users} 
        walkers={walkers} 
        isLoading={isLoading} 
      />



      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        
        {/* Donut Chart - 1/3 width on large screens */}
        <div className="lg:col-span-1">
          <WalkStatusDonutChart 
            bookings={bookings} 
            isLoading={isLoading} 
          />
        </div>

        {/* Revenue Chart - 2/3 width on large screens */}
        <div className="lg:col-span-2">
          <RevenuePayoutsChart 
            payments={payments} 
            isLoading={isLoading} 
          />
        </div>
      </div>
    </div>
  );
}