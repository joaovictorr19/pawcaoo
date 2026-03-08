import React from 'react';
import KpiCards from './KpiCards';
import WalkStatusDonutChart from './WalkStatusDonutChart';
import RevenuePayoutsChart from './RevenuePayoutsChart';
import { useLanguage } from "@/components/LanguageContext";

export default function AdminOverviewDashboard({ 
  bookings = [], 
  users = [], 
  walkers = [],
  payments = [],
  isLoading = false 
}) {
  const { language } = useLanguage();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* 1. KPIs Section */}
      <KpiCards 
        bookings={bookings} 
        users={users} 
        walkers={walkers} 
        isLoading={isLoading} 
      />

      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
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