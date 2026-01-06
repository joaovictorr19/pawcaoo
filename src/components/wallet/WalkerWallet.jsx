import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Wallet, CalendarDays, TrendingUp, DollarSign, Clock, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";

export default function WalkerWallet({ walkerEmail }) {
  // Fetch completed bookings for this walker
  const { data: completedBookings = [], isLoading } = useQuery({
    queryKey: ['walkerEarnings', walkerEmail],
    queryFn: async () => {
      const bookings = await base44.entities.Booking.filter({
        walker_email: walkerEmail,
        status: { $in: ['completed', 'service_completed'] }
      }, '-completed_date', 50);
      return bookings || [];
    },
    enabled: !!walkerEmail,
  });

  // Calculate earnings
  const availableBalance = completedBookings
    .filter(b => b.completed_date)
    .reduce((sum, b) => sum + (b.service_amount || 0) + (b.tip_amount || 0), 0);

  const todayEarnings = completedBookings
    .filter(b => {
      if (!b.completed_date) return false;
      const today = new Date().toDateString();
      return new Date(b.completed_date).toDateString() === today;
    })
    .reduce((sum, b) => sum + (b.service_amount || 0) + (b.tip_amount || 0), 0);

  const weekEarnings = completedBookings
    .filter(b => {
      if (!b.completed_date) return false;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(b.completed_date) >= weekAgo;
    })
    .reduce((sum, b) => sum + (b.service_amount || 0) + (b.tip_amount || 0), 0);

  const formatDate = (dateString) => {
    if (!dateString) return "Data desconhecida";
    const date = new Date(dateString);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (date.toDateString() === today) {
      return `Hoje, ${date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday) {
      return "Ontem";
    }
    return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-6 max-w-md mx-auto pb-24">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-48 bg-gray-200 rounded-2xl"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-gray-200 rounded-xl"></div>
            <div className="h-24 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto pb-24">
      <h1 className="text-2xl font-bold text-gray-900">Minha Carteira</h1>

      {/* MAIN BALANCE CARD */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-0 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Wallet size={120} />
          </div>
          <div className="absolute top-0 left-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl"></div>
          <CardContent className="p-6 relative z-10">
            <p className="text-slate-300 text-sm font-medium mb-1">Saldo Disponível</p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-5xl font-bold">€{availableBalance.toFixed(2)}</span>
            </div>
            
            <Button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold h-12 rounded-xl shadow-lg shadow-green-900/30 transition-all hover:scale-[1.02]">
              <ArrowUpRight className="mr-2 h-5 w-5" /> Levantar Fundos
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-700 mb-1">
              <CalendarDays size={16} />
              <span className="text-xs font-semibold">Hoje</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">€{todayEarnings.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <TrendingUp size={16} />
              <span className="text-xs font-semibold">Esta Semana</span>
            </div>
            <p className="text-2xl font-bold text-green-900">€{weekEarnings.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* TRANSACTION HISTORY */}
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Histórico de Transações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {completedBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Wallet className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum passeio completado ainda</p>
            </div>
          ) : (
            completedBookings.slice(0, 10).map((booking) => {
              const total = (booking.service_amount || 0) + (booking.tip_amount || 0);
              return (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {booking.dog_name || 'Passeio'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(booking.completed_date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">+€{total.toFixed(2)}</p>
                    {booking.tip_amount > 0 && (
                      <p className="text-xs text-gray-500">
                        (Gorjeta: €{booking.tip_amount.toFixed(2)})
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* PENDING BALANCE INFO */}
      {completedBookings.some(b => b.status === 'service_completed') && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 flex items-start gap-3">
            <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900 text-sm">Pagamentos Pendentes</p>
              <p className="text-xs text-yellow-700 mt-1">
                Alguns pagamentos estão a ser processados. Estarão disponíveis em breve.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}