import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, CheckCheck, Trash2, AlertCircle, X, ChevronRight, Megaphone } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationArea({ isOpen, onClose }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState("all");

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") handleCloseAll();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    enabled: isOpen, // Only fetch when open to save resources
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
        created_date: sn.created_date || new Date().toISOString(), // Fallback if created_date missing
        is_read: readIds.has(sn.id),
        is_system: true,
        priority: sn.priority
      }));

      // Merge and sort by date descending
      const all = [...myNotifications, ...formattedSystemNotifications].sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      );
      
      return all;
    },
    enabled: !!user && isOpen,
    initialData: [],
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notification) => {
      if (notification.is_system) {
        // Create a read record for system notification
        await base44.entities.SystemNotificationRead.create({
          notification_id: notification.id,
          user_email: user.email
        });
      } else {
        // Update regular notification
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
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
    },
  });

  // STRICT STATE MANAGEMENT: Close panel BEFORE navigation
  const handleCloseAll = () => {
    onClose();
  };

  const handleNavigation = (url) => {
    if (!url) return;
    handleCloseAll();
    // Small delay to allow animation/state cleanup if needed, 
    // but technically state update to false removes it from DOM via AnimatePresence
    setTimeout(() => {
        navigate(url);
    }, 150); 
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification);
    }
    if (notification.action_url) {
      handleNavigation(notification.action_url);
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
      case "emergency": return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "payment": return <CheckCheck className="w-5 h-5 text-green-500" />;
      case "booking": return <Bell className="w-5 h-5 text-blue-500" />;
      case "system": return <Megaphone className="w-5 h-5 text-purple-600" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* BACKDROP: High Z-Index (z-40), handles close on click */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseAll}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          />

          {/* PANEL: Higher Z-Index (z-50) */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full md:w-[450px] bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-lg">{t('notifications', language)}</h2>
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white text-xs px-2 rounded-full">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => markAllAsReadMutation.mutate()}
                    disabled={markAllAsReadMutation.isPending}
                    className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    {t('markAllAsRead', language)}
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={handleCloseAll}>
                  <X className="w-5 h-5 text-gray-500" />
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-4 pt-2 pb-0 border-b overflow-x-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-transparent p-0 h-auto flex gap-4">
                  {["all", "unread", "booking", "payment", "emergency"].map(tab => (
                    <TabsTrigger 
                      key={tab} 
                      value={tab}
                      className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none px-1 py-3 bg-transparent font-medium text-gray-500 hover:text-gray-800 transition-all text-sm"
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1 bg-gray-50 p-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center text-gray-500">
                  <Bell className="w-12 h-12 mb-3 opacity-20" />
                  <p>{t('noNotifications', language)}</p>
                </div>
              ) : (
                <div className="space-y-3 pb-20">
                  {filteredNotifications.map((notification) => (
                    <motion.div
                      layout
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <Card 
                        className={`relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all group ${
                          notification.is_system ? 'bg-purple-50/50 ring-1 ring-purple-100' : 
                          !notification.is_read ? 'bg-white ring-1 ring-blue-100' : 'bg-white/60'
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                        onMouseEnter={() => !notification.is_read && markAsReadMutation.mutate(notification)}
                      >
                        {!notification.is_read && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                        )}
                        <div className="p-4 flex gap-3">
                          <div className={`mt-1 p-2 rounded-full flex-shrink-0 ${
                            !notification.is_read ? 'bg-blue-50' : 'bg-gray-100'
                          }`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className={`text-sm font-semibold leading-tight ${
                                !notification.is_read ? 'text-gray-900' : 'text-gray-600'
                              }`}>
                                {notification.title}
                              </h4>
                              <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                {format(new Date(notification.created_date), "MMM d, HH:mm")}
                              </span>
                            </div>
                            
                            <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                              {notification.message}
                            </p>

                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" className="text-[10px] px-1.5 h-5 font-normal bg-gray-100 text-gray-500">
                                {notification.type}
                              </Badge>
                              
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!notification.is_read && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 text-blue-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsReadMutation.mutate(notification);
                                    }}
                                  >
                                    <Check className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotificationMutation.mutate(notification.id);
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}