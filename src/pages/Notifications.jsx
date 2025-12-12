import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Check, CheckCheck, Trash2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";

export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState("all");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const allNotifications = await base44.entities.Notification.list('-created_date');
      return allNotifications.filter(n => n.recipient_email === user?.email);
    },
    enabled: !!user,
    initialData: [],
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      await Promise.all(
        unreadNotifications.map(n => 
          base44.entities.Notification.update(n.id, { is_read: true })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsReadMutation.mutateAsync(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
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
        return <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-500" />;
      case "payment":
        return <Bell className="w-4 h-4 md:w-5 md:h-5 text-green-500" />;
      case "booking":
        return <Bell className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />;
      case "message":
        return <Bell className="w-4 h-4 md:w-5 md:h-5 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />;
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
    <div className="min-h-screen p-3 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header - Mobile Optimized */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 mb-4 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-1 md:mb-2 flex items-center gap-2 md:gap-3">
              <Bell className="w-6 h-6 md:w-10 md:h-10 text-blue-600" />
              {t('notifications', language)}
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white text-xs md:text-sm px-2 py-0.5">
                  {unreadCount} {t('newNotification', language)}
                </Badge>
              )}
            </h1>
            <p className="text-gray-600 text-sm md:text-lg">{t('stayUpdated', language)}</p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              size="sm"
              className="w-full md:w-auto text-xs md:text-sm h-8 md:h-10"
            >
              <CheckCheck className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              {t('markAllAsRead', language)}
            </Button>
          )}
        </div>

        {/* Tabs - Scrollable on Mobile */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4 md:mb-6">
          <div className="overflow-x-auto pb-2">
            <TabsList className="bg-white shadow-sm inline-flex w-auto min-w-full h-auto p-1">
              <TabsTrigger value="all" className="text-xs md:text-sm px-3 md:px-4 py-2 md:py-2.5 whitespace-nowrap">
                {t('allNotifications', language)}
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-xs md:text-sm px-3 md:px-4 py-2 md:py-2.5 whitespace-nowrap">
                {t('unreadNotifications', language)} {unreadCount > 0 && `(${unreadCount})`}
              </TabsTrigger>
              <TabsTrigger value="booking" className="text-xs md:text-sm px-3 md:px-4 py-2 md:py-2.5 whitespace-nowrap">
                {t('bookingNotifications', language)}
              </TabsTrigger>
              <TabsTrigger value="payment" className="text-xs md:text-sm px-3 md:px-4 py-2 md:py-2.5 whitespace-nowrap">
                {t('paymentNotifications', language)}
              </TabsTrigger>
              <TabsTrigger value="message" className="text-xs md:text-sm px-3 md:px-4 py-2 md:py-2.5 whitespace-nowrap">
                {t('messageNotifications', language)}
              </TabsTrigger>
              <TabsTrigger value="emergency" className="text-xs md:text-sm px-3 md:px-4 py-2 md:py-2.5 whitespace-nowrap">
                {t('emergencyNotifications', language)}
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        {/* Notifications List */}
        {isLoading ? (
          <div className="space-y-2 md:space-y-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-20 md:h-24 rounded-xl" />
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card className="glass-panel border-0 shadow-xl">
            <CardContent className="p-8 md:p-12 text-center">
              <Bell className="w-12 h-12 md:w-20 md:h-20 text-gray-300 mx-auto mb-3 md:mb-4" />
              <h3 className="text-lg md:text-2xl font-semibold text-gray-900 mb-1 md:mb-2">{t('noNotifications', language)}</h3>
              <p className="text-sm md:text-base text-gray-600">{t('allCaughtUp', language)}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
              >
                <Card 
                  className={`cursor-pointer hover:shadow-lg transition-all duration-200 ${
                    !notification.is_read ? 'bg-blue-50 border-blue-200' : ''
                  } ${getPriorityColor(notification.priority)}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-start gap-2 md:gap-4">
                      {/* Icon */}
                      <div className="mt-0.5 md:mt-1 flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-semibold text-sm md:text-base line-clamp-1 ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </h3>
                            <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            
                            {/* Meta Info */}
                            <div className="flex items-center gap-2 md:gap-4 mt-1 md:mt-2 flex-wrap">
                              <span className="text-[10px] md:text-xs text-gray-500">
                                {format(new Date(notification.created_date), "MMM d, yyyy 'às' HH:mm")}
                              </span>
                              <Badge variant="outline" className="text-[10px] md:text-xs px-1.5 py-0">
                                {notification.type}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Action Buttons - Stacked on Mobile */}
                          <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2 flex-shrink-0">
                            {!notification.is_read && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 md:h-8 md:w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsReadMutation.mutate(notification.id);
                                }}
                              >
                                <Check className="w-3 h-3 md:w-4 md:h-4" />
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-red-600 hover:bg-red-50 h-7 w-7 md:h-8 md:w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotificationMutation.mutate(notification.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}