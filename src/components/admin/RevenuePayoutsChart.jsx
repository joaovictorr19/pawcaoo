import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { format, subMonths, eachMonthOfInterval, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

export default function RevenuePayoutsChart({ payments = [], isLoading = false }) {
  const { language } = useLanguage();
  const locale = language === 'pt' ? ptBR : enUS;

  const data = React.useMemo(() => {
    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    });

    return last6Months.map(date => {
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const monthLabel = format(date, 'MMM', { locale });

      const monthPayments = payments.filter(p => {
        const pDate = new Date(p.created_date || p.held_date);
        return isWithinInterval(pDate, { start: monthStart, end: monthEnd });
      });

      const revenue = monthPayments.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
      const payouts = monthPayments.reduce((acc, curr) => acc + (Number(curr.service_amount) || 0), 0);

      return {
        name: monthLabel,
        revenue: parseFloat(revenue.toFixed(2)),
        payouts: parseFloat(payouts.toFixed(2))
      };
    });
  }, [payments, locale]);

  if (isLoading) {
    return (
      <Card className="h-[350px] flex items-center justify-center bg-white border border-slate-200">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </Card>
    );
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow h-full bg-white border border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-800">
          {language === 'pt' ? 'Faturamento vs Repasses (6 Meses)' : 'Revenue vs Payouts (6 Months)'}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
             <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
             <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `€${value}`} />
            <Tooltip 
              formatter={(value) => [`€${value}`, '']}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              cursor={{ fill: '#f3f4f6' }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }}/>
            <Bar dataKey="revenue" name={language === 'pt' ? 'Faturamento Total' : 'Total Revenue'} fill="#64748b" radius={[4, 4, 0, 0]} barSize={30} />
             <Bar dataKey="payouts" name={language === 'pt' ? 'Repasses (Walkers)' : 'Payouts (Walkers)'} fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}