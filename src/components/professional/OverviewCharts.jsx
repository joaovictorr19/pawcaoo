import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { Activity, BarChart3, Clock, TrendingUp } from "lucide-react";

export default function OverviewCharts({ chartData, statusData, timeDistribution }) {
  // Calculate earnings trend
  const earningsTrend = chartData.length >= 2 
    ? ((chartData[chartData.length - 1].earnings - chartData[chartData.length - 2].earnings) / (chartData[chartData.length - 2].earnings || 1) * 100).toFixed(1)
    : 0;

  const totalBookings = statusData.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <div className="grid md:grid-cols-2 gap-4">
      {/* Earnings Chart */}
      <Card className="border-0 shadow-md bg-white rounded-2xl overflow-hidden">
        <CardHeader className="py-4 px-5 bg-gradient-to-r from-emerald-50 to-emerald-100 border-b border-emerald-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-800">
              <Activity className="w-5 h-5" />
              Evolução de Ganhos
            </CardTitle>
            {earningsTrend !== 0 && (
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${earningsTrend > 0 ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                <TrendingUp className="w-3 h-3" />
                {earningsTrend > 0 ? '+' : ''}{earningsTrend}%
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-3 pt-4 pb-2">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorEarn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: '#6b7280' }} 
                axisLine={{ stroke: '#d1d5db' }}
                tickLine={{ stroke: '#d1d5db' }}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#6b7280' }} 
                width={45}
                axisLine={{ stroke: '#d1d5db' }}
                tickLine={{ stroke: '#d1d5db' }}
                tickFormatter={(value) => `€${value}`}
              />
              <Tooltip
                contentStyle={{ 
                  fontSize: 12, 
                  borderRadius: 12, 
                  border: '1px solid #d1d5db',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  padding: '8px 12px'
                }}
                formatter={(value) => [`€${value}`, 'Ganhos']}
                labelStyle={{ fontWeight: 'bold', marginBottom: 4 }}
              />
              <Area 
                type="monotone" 
                dataKey="earnings" 
                stroke="#10b981" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorEarn)"
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card className="border-0 shadow-md bg-white overflow-hidden" style={{ borderRadius: 0 }}>
        <CardHeader className="py-4 px-5 bg-gradient-to-r from-blue-50 to-indigo-100 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-800">
              <BarChart3 className="w-5 h-5" />
              Estado das Reservas
            </CardTitle>
            <div className="text-xs font-bold bg-blue-500 text-white px-2 py-1 rounded-full">
              {totalBookings} total
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 pt-4 pb-2">
          <ResponsiveContainer width="100%" height={220}>
            <RechartsPieChart>
              <Pie
                data={statusData.filter(s => s.value > 0)}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [value, name]} 
                contentStyle={{ 
                  fontSize: 12, 
                  borderRadius: 12,
                  border: '1px solid #d1d5db',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  padding: '8px 12px'
                }} 
              />
              <Legend 
                wrapperStyle={{ fontSize: 11 }}
                iconType="circle"
                formatter={(value, entry) => (
                  <span className="font-semibold">{value} ({entry.payload.value})</span>
                )}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Time Distribution Bar Chart */}
      {timeDistribution && timeDistribution.length > 0 && (
        <Card className="border-0 shadow-md bg-white overflow-hidden md:col-span-2" style={{ borderRadius: 0 }}>
          <CardHeader className="py-4 px-5 bg-gradient-to-r from-purple-50 to-pink-100 border-b border-purple-200">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-purple-800">
              <Clock className="w-5 h-5" />
              Distribuição Horária das Reservas
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pt-4 pb-2">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={timeDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={{ stroke: '#d1d5db' }}
                  tickLine={{ stroke: '#d1d5db' }}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={{ stroke: '#d1d5db' }}
                  tickLine={{ stroke: '#d1d5db' }}
                  width={35}
                />
                <Tooltip
                  contentStyle={{ 
                    fontSize: 12, 
                    borderRadius: 12,
                    border: '1px solid #d1d5db',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    padding: '8px 12px'
                  }}
                  formatter={(value) => [value, 'Reservas']}
                  cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                />
                <Bar 
                  dataKey="bookings" 
                  fill="url(#colorBar)" 
                  radius={[8, 8, 0, 0]}
                  maxBarSize={60}
                />
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}