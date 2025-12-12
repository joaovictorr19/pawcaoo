import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Check, CheckCheck, Trash2, AlertCircle, Sparkles, Archive, Filter, MoreVertical, DollarSign, Calendar, MessageCircle, Zap, Megaphone } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/ThemeContext";

export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      // Fetch personal notifications
      const personalNotifications = await base44.entities.Notification.list('-created_date');
      const myNotifications = personalNotifications.filter(n => n.recipient_email === user?.email);

      // Fetch system notifications (broadcasts)
      const systemNotifications = await base44.entities.SystemNotification.filter({ is_active: true });
      
      // Fetch read status for system notifications
      const readStatuses = await base44.entities.SystemNotificationRead.filter({ user_email: user?.email });
      const readIds = new Set(readStatuses.map(r => r.notification_id));

      // Map system notifications to the common notification format
      const formattedSystemNotifications = systemNotifications.map(sn => ({
        id: sn.id,
        title: sn.subject,
        message: sn.content,
        type: 'system',
        created_date: sn.created_date || new Date().toISOString(),
        is_read: readIds.has(sn.id),
        is_system: true,
        priority: sn.priority
      }));

      // Merge and sort by date descending
      return [...myNotifications, ...formattedSystemNotifications].sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      );
    },
    enabled: !!user,
    initialData: [],
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notification) => {
      if (notification.is_system) {
        await base44.entities.SystemNotificationRead.create({
          notification_id: notification.id,
          user_email: user.email
        });
      } else {
        await base44.entities.Notification.update(notification.id, { is_read: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      await Promise.all(
        unreadNotifications.map(n => {
          if (n.is_system) {
            return base44.entities.SystemNotificationRead.create({
              notification_id: n.id,
              user_email: user.email
            });
          } else {
            return base44.entities.Notification.update(n.id, { is_read: true });
          }
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
      setSelectedIds([]);
      toast.success("Todas as notificações marcadas como lidas");
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
      toast.success("Notificação eliminada");
    },
  });

  const deleteSelectedMutation = useMutation({
    mutationFn: async (ids) => {
      const notificationsToDelete = notifications.filter(n => ids.includes(n.id) && !n.is_system);
      await Promise.all(
        notificationsToDelete.map(n => base44.entities.Notification.delete(n.id))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
      setSelectedIds([]);
      toast.success("Notificações selecionadas eliminadas");
    },
  });

  const markSelectedAsReadMutation = useMutation({
    mutationFn: async (ids) => {
      const notificationsToMark = notifications.filter(n => ids.includes(n.id) && !n.is_read);
      await Promise.all(
        notificationsToMark.map(n => {
          if (n.is_system) {
            return base44.entities.SystemNotificationRead.create({
              notification_id: n.id,
              user_email: user.email
            });
          } else {
            return base44.entities.Notification.update(n.id, { is_read: true });
          }
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
      setSelectedIds([]);
      toast.success("Notificações selecionadas marcadas como lidas");
    },
  });

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsReadMutation.mutateAsync(notification);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(nId => nId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map(n => n.id));
    }
  };

  const filteredNotifications = activeTab === "all" 
    ? notifications 
    : activeTab === "unread"
    ? notifications.filter(n => !n.is_read)
    : notifications.filter(n => n.type === activeTab);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case "emergency":
        return <Zap className="w-5 h-5 text-red-500" />;
      case "payment":
        return <DollarSign className="w-5 h-5 text-green-500" />;
      case "booking":
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case "message":
        return <MessageCircle className="w-5 h-5 text-purple-500" />;
      case "system":
        return <Megaphone className="w-5 h-5 text-indigo-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "border-l-4 border-red-500 bg-red-50";
      case "high":
        return "border-l-4 border-orange-500 bg-orange-50";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Modern Header with Gradient */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2 flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${colors?.primary || '#3b82f6'}, ${colors?.primary || '#3b82f6'}dd)` }}
                >
                  <Bell className="w-6 h-6 text-white" />
                </div>
                Notificações
              </h1>
              <p className="text-gray-600">{t('stayUpdated', language)}</p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {selectedIds.length > 0 ? (
              <div className="flex items-center gap-2 flex-wrap w-full">
                <Badge className="bg-blue-100 text-blue-800">
                  {selectedIds.length} selecionadas
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markSelectedAsReadMutation.mutate(selectedIds)}
                  disabled={markSelectedAsReadMutation.isPending}
                  className="h-9"
                >
                  <CheckCheck className="w-4 h-4 mr-2" />
                  Marcar como Lidas
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteSelectedMutation.mutate(selectedIds)}
                  disabled={deleteSelectedMutation.isPending}
                  className="h-9 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedIds([])}
                  className="h-9"
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <>
                {unreadCount > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markAllAsReadMutation.mutate()}
                    disabled={markAllAsReadMutation.isPending}
                    className="h-9"
                  >
                    <CheckCheck className="w-4 h-4 mr-2" />
                    Marcar Todas como Lidas
                  </Button>
                )}
                {filteredNotifications.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={toggleSelectAll}
                    className="h-9"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    {selectedIds.length === filteredNotifications.length ? 'Desmarcar' : 'Selecionar'} Todas
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Modern Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="glass-panel h-auto p-1.5 grid grid-cols-3 md:flex md:inline-flex gap-1">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
              style={{
                background: activeTab === 'all' ? `linear-gradient(135deg, ${colors?.primary || '#3b82f6'}, ${colors?.primary || '#3b82f6'}dd)` : 'transparent'
              }}
            >
              <Bell className="w-4 h-4 mr-2" />
              Todas
              {notifications.length > 0 && (
                <Badge className="ml-2 bg-white/20 text-white">{notifications.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="unread"
              className="data-[state=active]:bg-red-500 data-[state=active]:text-white rounded-xl px-4 py-2.5 text-sm font-semibold"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Não Lidas
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-white/20 text-white">{unreadCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white rounded-xl px-4 py-2.5 text-sm font-semibold">
              <Megaphone className="w-4 h-4 mr-2" />
              Sistema
            </TabsTrigger>
            <TabsTrigger value="booking" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-xl px-4 py-2.5 text-sm font-semibold">
              <Calendar className="w-4 h-4 mr-2" />
              Reservas
            </TabsTrigger>
            <TabsTrigger value="payment" className="data-[state=active]:bg-green-500 data-[state=active]:text-white rounded-xl px-4 py-2.5 text-sm font-semibold">
              <DollarSign className="w-4 h-4 mr-2" />
              Pagamentos
            </TabsTrigger>
            <TabsTrigger value="emergency" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-xl px-4 py-2.5 text-sm font-semibold">
              <Zap className="w-4 h-4 mr-2" />
              Urgentes
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Notifications List */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="glass-panel border-0 shadow-2xl">
                <CardContent className="p-12 text-center">
                  <div 
                    className="w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${colors?.primary || '#3b82f6'}20, ${colors?.primary || '#3b82f6'}10)` }}
                  >
                    <Bell className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('noNotifications', language)}</h3>
                  <p className="text-gray-600">{t('allCaughtUp', language)}</p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification, index) => {
                const isSelected = selectedIds.includes(notification.id);
                
                return (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                  >
                    <Card 
                      className={`group relative overflow-hidden transition-all duration-300 cursor-pointer border-0 ${
                        isSelected 
                          ? 'ring-2 shadow-xl scale-[1.02]' 
                          : notification.is_system
                          ? 'glass-panel ring-1 ring-purple-200 hover:shadow-xl'
                          : !notification.is_read 
                          ? 'glass-panel ring-1 ring-blue-200 hover:shadow-xl' 
                          : 'glass-panel hover:shadow-lg'
                      }`}
                      style={isSelected ? { 
                        '--tw-ring-color': colors?.primary || '#3b82f6' 
                      } : {}}
                      onClick={() => {
                        if (selectedIds.length > 0) {
                          toggleSelect(notification.id);
                        } else {
                          handleNotificationClick(notification);
                        }
                      }}
                    >
                      {/* Priority/Status Bar */}
                      {!notification.is_read && (
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-1.5"
                          style={{ background: `linear-gradient(to bottom, ${colors?.primary || '#3b82f6'}, ${colors?.primary || '#3b82f6'}dd)` }}
                        />
                      )}

                      {notification.priority === 'urgent' && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500" />
                      )}

                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {/* Checkbox for Batch Selection */}
                          <div 
                            className="flex-shrink-0 mt-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelect(notification.id);
                            }}
                          >
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-transparent shadow-md' 
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                            style={isSelected ? {
                              background: `linear-gradient(135deg, ${colors?.primary || '#3b82f6'}, ${colors?.primary || '#3b82f6'}dd)`
                            } : {}}
                            >
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </div>

                          {/* Icon */}
                          <div 
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                              notification.is_system 
                                ? 'bg-gradient-to-br from-indigo-100 to-purple-100' 
                                : !notification.is_read 
                                ? 'bg-gradient-to-br from-blue-100 to-indigo-100' 
                                : 'bg-gray-100'
                            }`}
                          >
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <h3 className={`font-bold text-base leading-tight ${
                                !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </h3>
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {format(new Date(notification.created_date), "HH:mm")}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                              {notification.message}
                            </p>

                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs font-medium ${
                                    notification.type === 'emergency' ? 'bg-red-100 text-red-700' :
                                    notification.type === 'payment' ? 'bg-green-100 text-green-700' :
                                    notification.type === 'booking' ? 'bg-blue-100 text-blue-700' :
                                    notification.type === 'system' ? 'bg-indigo-100 text-indigo-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {notification.type}
                                </Badge>
                                {notification.is_system && (
                                  <Badge className="bg-purple-100 text-purple-700 text-xs">
                                    📢 Broadcast
                                  </Badge>
                                )}
                                <span className="text-xs text-gray-500">
                                  {format(new Date(notification.created_date), "dd MMM")}
                                </span>
                              </div>

                              {/* Quick Actions */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {!notification.is_read && (
                                    <DropdownMenuItem 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markAsReadMutation.mutate(notification);
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <Check className="w-4 h-4 mr-2" />
                                      Marcar como Lida
                                    </DropdownMenuItem>
                                  )}
                                  {!notification.is_system && (
                                    <DropdownMenuItem 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotificationMutation.mutate(notification.id);
                                      }}
                                      className="text-red-600 cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Eliminar
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}