import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, User, CheckCircle, AlertCircle, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function CompanyNotificationFeed({ companyId, companyEmail }) {
  const { data: recentUpdates = [], isLoading } = useQuery({
    queryKey: ['companyNotificationFeed', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      // Fetch recent status updates
      const statusUpdates = await base44.entities.BookingStatusUpdate.filter(
        { company_id: companyId },
        '-created_date',
        20
      );

      // Fetch recent messages
      const messages = await base44.entities.CompanyMessage.filter(
        { company_email: companyEmail },
        '-created_date',
        10
      );

      // Combine and sort by date
      const combined = [
        ...statusUpdates.map(u => ({ ...u, type: 'status_update' })),
        ...messages.map(m => ({ ...m, type: 'message' }))
      ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

      return combined.slice(0, 15);
    },
    enabled: !!companyId && !!companyEmail,
    refetchInterval: 10000, // Refresh every 10s
  });

  if (isLoading) {
    return (
      <Card className="glass-panel border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-orange-600" />
            Feed de Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getNotificationIcon = (item) => {
    if (item.type === 'status_update') {
      const statusIcons = {
        acknowledged: CheckCircle,
        on_the_way: MapPin,
        arrived: MapPin,
        in_progress: User,
        completed: CheckCircle,
        issue: AlertCircle
      };
      return statusIcons[item.status] || Bell;
    }
    return Bell;
  };

  const getNotificationColor = (item) => {
    if (item.type === 'status_update') {
      const colors = {
        acknowledged: 'bg-blue-500',
        on_the_way: 'bg-yellow-500',
        arrived: 'bg-purple-500',
        in_progress: 'bg-indigo-500',
        completed: 'bg-green-600',
        issue: 'bg-red-500'
      };
      return colors[item.status] || 'bg-gray-500';
    }
    return item.priority === 'urgent' ? 'bg-red-500' : 'bg-blue-500';
  };

  return (
    <Card className="glass-panel border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-6 h-6 text-orange-600" />
          Feed de Notificações
          {recentUpdates.length > 0 && (
            <Badge className="bg-orange-600 ml-auto">{recentUpdates.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentUpdates.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Sem notificações recentes</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {recentUpdates.map((item, idx) => {
              const Icon = getNotificationIcon(item);
              const bgColor = getNotificationColor(item);

              return (
                <Card key={`${item.type}-${item.id}-${idx}`} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {item.type === 'status_update' ? (
                          <>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-sm">Atualização de Pedido</h4>
                              <Badge className={bgColor}>
                                {item.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700">
                              <strong>{item.employee_name}</strong> atualizou o status
                            </p>
                            {item.update_message && (
                              <p className="text-sm text-gray-600 mt-1">"{item.update_message}"</p>
                            )}
                          </>
                        ) : (
                          <>
                            <h4 className="font-bold text-sm mb-1">{item.subject || 'Nova Mensagem'}</h4>
                            <p className="text-sm text-gray-700">
                              De: <strong>{item.sender_name}</strong>
                            </p>
                            <p className="text-sm text-gray-600 line-clamp-2">{item.message}</p>
                          </>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {format(new Date(item.created_date), "dd/MM/yyyy 'às' HH:mm")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}