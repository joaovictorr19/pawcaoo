import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Truck, CheckCircle, Clock, X } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyOrders() {
  const { language } = useLanguage();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['myOrders', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.ProductOrder.filter(
        { customer_email: user.email },
        '-created_date'
      );
    },
    enabled: !!user?.email,
  });

  const filteredOrders = orders.filter(order => 
    statusFilter === 'all' || order.status === statusFilter
  );

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-blue-100 text-blue-800",
    processing: "bg-indigo-100 text-indigo-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800"
  };

  const statusIcons = {
    pending: Clock,
    paid: CheckCircle,
    processing: Package,
    shipped: Truck,
    delivered: CheckCircle,
    cancelled: X
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
        {language === 'pt' ? 'Minhas Encomendas' : 'My Orders'}
      </h1>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'pending', 'paid', 'processing', 'shipped', 'delivered'].map(status => (
          <Button
            key={status}
            variant={statusFilter === status ? "default" : "outline"}
            onClick={() => setStatusFilter(status)}
            size="sm"
          >
            {status === 'all' ? (language === 'pt' ? 'Todas' : 'All') : status}
          </Button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <Card className="glass-panel">
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">
              {language === 'pt' ? 'Nenhuma encomenda encontrada' : 'No orders found'}
            </h3>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const StatusIcon = statusIcons[order.status];
            return (
              <Card key={order.id} className="glass-panel hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {language === 'pt' ? 'Encomenda' : 'Order'} #{order.order_number}
                      </CardTitle>
                      <p className="text-sm text-gray-500">
                        {format(new Date(order.created_date), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                    <Badge className={statusColors[order.status]}>
                      <StatusIcon className="w-4 h-4 mr-1" />
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        {item.product_image && (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold">{item.product_name}</p>
                          <p className="text-sm text-gray-600">
                            {language === 'pt' ? 'Qtd' : 'Qty'}: {item.quantity} × €{item.unit_price.toFixed(2)}
                          </p>
                        </div>
                        <p className="font-bold">€{item.total_price.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-2xl font-black text-indigo-600">
                        €{order.total_amount.toFixed(2)}
                      </span>
                    </div>
                    {order.discount_amount > 0 && (
                      <p className="text-sm text-green-600 mt-1">
                        {language === 'pt' ? 'Desconto aplicado' : 'Discount applied'}: -€{order.discount_amount.toFixed(2)}
                      </p>
                    )}
                  </div>

                  {order.tracking_number && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-semibold text-blue-900">
                        {language === 'pt' ? 'Rastreamento' : 'Tracking'}: {order.tracking_number}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}