import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

const COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b']; // Blue, Green, Red, Amber

export default function WalkStatusDonutChart({ bookings = [], isLoading = false }) {
  const { language } = useLanguage();

  const data = React.useMemo(() => {
    const statusCounts = {
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      in_progress: 0
    };

    bookings.forEach(b => {
      const status = b.status?.toLowerCase() || 'pending';
      if (['pending', 'confirmed', 'scheduled'].includes(status)) statusCounts.scheduled++;
      else if (['completed', 'service_completed', 'finalizada'].includes(status)) statusCounts.completed++;
      else if (['cancelled', 'rejected'].includes(status)) statusCounts.cancelled++;
      else if (['in_progress', 'started'].includes(status)) statusCounts.in_progress++;
    });

    return [
      { name: language === 'pt' ? 'Agendados' : 'Scheduled', value: statusCounts.scheduled },
      { name: language === 'pt' ? 'Concluídos' : 'Completed', value: statusCounts.completed },
      { name: language === 'pt' ? 'Cancelados' : 'Cancelled', value: statusCounts.cancelled },
      { name: language === 'pt' ? 'Em Andamento' : 'In Progress', value: statusCounts.in_progress }
    ].filter(item => item.value > 0);
  }, [bookings, language]);

  if (isLoading) {
    return (
      <Card className="h-[350px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="border-b border-slate-100 px-5 py-4">
        <CardTitle className="text-lg font-extrabold text-slate-900">
          {language === 'pt' ? 'Status dos Passeios' : 'Walk Status'}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[280px] p-4 md:h-[300px] md:p-6">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            {language === 'pt' ? 'Sem dados para exibir' : 'No data to display'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}