import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Area } from "recharts";
import { TrendingUp, DollarSign, Package, ShoppingBag, Calendar, Star, Eye, ShoppingCart, Award, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function PartnerAnalytics({ bookings = [], products = [], services = [], payments = [], companyId }) {
  // Fetch redemptions (product sales) with caching
  const { data: redemptions = [] } = useQuery({
    queryKey: ['partnerRedemptions', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const all = await base44.entities.Redemption.filter({ partner_id: companyId });
      return all;
    },
    enabled: !!companyId,
    initialData: [],
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });
  // Calculate metrics
  const totalEarnings = payments.reduce((sum, p) => sum + (p.service_amount || 0), 0);
  const totalBookings = bookings.length;
  const activeServices = services.filter(s => s.is_active && s.moderation_status === 'approved').length;
  const activeProducts = products.filter(p => p.is_available && p.moderation_status === 'approved').length;
  
  // Monthly earnings data
  const monthlyData = React.useMemo(() => {
    const months = {};
    payments.forEach(payment => {
      if (!payment.held_date) return;
      const date = new Date(payment.held_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!months[monthKey]) {
        months[monthKey] = { month: monthKey, earnings: 0, bookings: 0 };
      }
      months[monthKey].earnings += payment.service_amount || 0;
    });

    bookings.forEach(booking => {
      const date = new Date(booking.created_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!months[monthKey]) {
        months[monthKey] = { month: monthKey, earnings: 0, bookings: 0 };
      }
      months[monthKey].bookings += 1;
    });

    return Object.values(months)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)
      .map(m => ({
        ...m,
        monthLabel: new Date(m.month + '-01').toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' })
      }));
  }, [payments, bookings]);

  // Product categories distribution
  const categoryData = React.useMemo(() => {
    const categories = {};
    products.forEach(product => {
      const cat = product.category || 'other';
      categories[cat] = (categories[cat] || 0) + 1;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [products]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

  // Top selling products
  const topProducts = React.useMemo(() => {
    const productSales = {};
    redemptions.forEach(r => {
      if (!productSales[r.product_id]) {
        productSales[r.product_id] = {
          product_id: r.product_id,
          product_name: r.product_name,
          units: 0,
          revenue: 0
        };
      }
      productSales[r.product_id].units += 1;
      productSales[r.product_id].revenue += r.euro_value || 0;
    });
    
    return Object.values(productSales)
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);
  }, [redemptions]);

  // Top services
  const topServices = React.useMemo(() => {
    const serviceBookings = {};
    bookings.forEach(b => {
      const serviceName = b.service_type || b.service_name || 'Serviço';
      if (!serviceBookings[serviceName]) {
        serviceBookings[serviceName] = {
          service_name: serviceName,
          count: 0,
          revenue: 0
        };
      }
      serviceBookings[serviceName].count += 1;
      serviceBookings[serviceName].revenue += b.total_amount || 0;
    });
    
    return Object.values(serviceBookings)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [bookings]);

  // Product performance over time
  const productPerformance = React.useMemo(() => {
    const monthlyPerformance = {};
    
    redemptions.forEach(r => {
      const date = new Date(r.created_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyPerformance[monthKey]) {
        monthlyPerformance[monthKey] = { month: monthKey, products_sold: 0, product_revenue: 0 };
      }
      monthlyPerformance[monthKey].products_sold += 1;
      monthlyPerformance[monthKey].product_revenue += r.euro_value || 0;
    });

    bookings.forEach(b => {
      const date = new Date(b.created_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyPerformance[monthKey]) {
        monthlyPerformance[monthKey] = { month: monthKey, products_sold: 0, product_revenue: 0 };
      }
      monthlyPerformance[monthKey].service_bookings = (monthlyPerformance[monthKey].service_bookings || 0) + 1;
    });

    return Object.values(monthlyPerformance)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)
      .map(m => ({
        ...m,
        monthLabel: new Date(m.month + '-01').toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' })
      }));
  }, [redemptions, bookings]);

  // Conversion rate (simulate views as products.length * 10 for demo)
  const conversionRate = React.useMemo(() => {
    const totalSales = redemptions.length;
    const estimatedViews = products.length * 50; // Simulated
    return estimatedViews > 0 ? ((totalSales / estimatedViews) * 100).toFixed(2) : 0;
  }, [redemptions, products]);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-blue-600" />
              <Badge className="bg-blue-600">Total</Badge>
            </div>
            <div className="text-3xl font-bold text-blue-900">€{totalEarnings.toFixed(2)}</div>
            <div className="text-sm text-blue-700 font-medium">Ganhos Totais</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-green-600" />
              <Badge className="bg-green-600">Reservas</Badge>
            </div>
            <div className="text-3xl font-bold text-green-900">{totalBookings}</div>
            <div className="text-sm text-green-700 font-medium">Total de Reservas</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-purple-600" />
              <Badge className="bg-purple-600">Ativos</Badge>
            </div>
            <div className="text-3xl font-bold text-purple-900">{activeServices}</div>
            <div className="text-sm text-purple-700 font-medium">Serviços Ativos</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <ShoppingBag className="w-8 h-8 text-orange-600" />
              <Badge className="bg-orange-600">Loja</Badge>
            </div>
            <div className="text-3xl font-bold text-orange-900">{activeProducts}</div>
            <div className="text-sm text-orange-700 font-medium">Produtos Ativos</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly Earnings Chart */}
        <Card className="glass-panel border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Ganhos Mensais (€)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value) => [`€${value.toFixed(2)}`, 'Ganhos']}
                  />
                  <Line type="monotone" dataKey="earnings" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-400">
                Sem dados ainda
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Bookings Chart */}
        <Card className="glass-panel border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              Reservas Mensais
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value) => [value, 'Reservas']}
                  />
                  <Bar dataKey="bookings" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-400">
                Sem dados ainda
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product Categories Distribution */}
      {categoryData.length > 0 && (
        <Card className="glass-panel border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-purple-600" />
              Distribuição de Produtos por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="flex flex-col gap-2">
                {categoryData.map((cat, idx) => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="text-sm capitalize">{cat.name}: {cat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Performing Products & Services */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-panel border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-600" />
              Top 5 Produtos Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <div className="space-y-3">
                {topProducts.map((product, idx) => (
                  <div key={product.product_id} className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{product.product_name}</p>
                        <p className="text-xs text-gray-600">{product.units} unidades vendidas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-700">€{product.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-8">Nenhuma venda ainda</p>
            )}
          </CardContent>
        </Card>

        <Card className="glass-panel border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              Top 5 Serviços Reservados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topServices.length > 0 ? (
              <div className="space-y-3">
                {topServices.map((service, idx) => (
                  <div key={service.service_name} className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{service.service_name}</p>
                        <p className="text-xs text-gray-600">{service.count} reservas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-700">€{service.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-8">Nenhuma reserva ainda</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversion Rate */}
      <Card className="glass-panel border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-indigo-600" />
            Taxa de Conversão de Produtos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-indigo-50 rounded-xl">
              <Eye className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-indigo-900">{products.length * 50}</div>
              <div className="text-sm text-indigo-700 mt-1">Visualizações Estimadas</div>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-xl">
              <ShoppingCart className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-green-900">{redemptions.length}</div>
              <div className="text-sm text-green-700 mt-1">Produtos Vendidos</div>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-xl">
              <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-purple-900">{conversionRate}%</div>
              <div className="text-sm text-purple-700 mt-1">Taxa de Conversão</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Comparison Over Time */}
      {productPerformance.length > 0 && (
        <Card className="glass-panel border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Performance Mensal: Produtos vs Serviços
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={productPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="product_revenue" 
                  fill="#8b5cf6" 
                  stroke="#8b5cf6" 
                  fillOpacity={0.3}
                  name="Revenue Produtos (€)"
                />
                <Bar 
                  yAxisId="right"
                  dataKey="products_sold" 
                  fill="#3b82f6" 
                  radius={[8, 8, 0, 0]}
                  name="Produtos Vendidos"
                />
                <Bar 
                  yAxisId="right"
                  dataKey="service_bookings" 
                  fill="#10b981" 
                  radius={[8, 8, 0, 0]}
                  name="Serviços Reservados"
                />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-sm text-gray-600">Revenue Produtos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-600">Produtos Vendidos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-600">Serviços Reservados</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card className="glass-panel border-0 shadow-xl">
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{booking.owner_name}</p>
                  <p className="text-sm text-gray-600">{booking.service_type || 'Serviço'}</p>
                </div>
                <div className="text-right">
                  <Badge className={
                    booking.status === 'completed' ? 'bg-green-600' :
                    booking.status === 'confirmed' ? 'bg-blue-600' :
                    'bg-yellow-600'
                  }>
                    {booking.status}
                  </Badge>
                </div>
              </div>
            ))}
            {bookings.length === 0 && (
              <p className="text-center text-gray-400 py-8">Nenhuma reserva ainda</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}