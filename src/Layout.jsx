
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dog, Home, Calendar, User, PlusCircle, Zap, Heart, MessageCircle, CalendarClock, HomeIcon, Bell, History, Crown, Gift, Store, Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Find Walkers",
    url: createPageUrl("Home"),
    icon: Home,
  },
  {
    title: "Find Trainers",
    url: createPageUrl("Trainers"),
    icon: Award,
  },
  {
    title: "Post Emergency Walk",
    url: createPageUrl("PostEmergency"),
    icon: Zap,
  },
  {
    title: "Dog Sitting Services",
    url: createPageUrl("DogSittingServices"),
    icon: HomeIcon,
  },
  {
    title: "PawCão Partners",
    url: createPageUrl("Partners"),
    icon: Store,
  },
  {
    title: "My Favorites",
    url: createPageUrl("Favorites"),
    icon: Heart,
  },
  {
    title: "My Bookings",
    url: createPageUrl("MyBookings"),
    icon: Calendar,
  },
  {
    title: "Scheduled Walks",
    url: createPageUrl("ScheduledWalks"),
    icon: CalendarClock,
  },
  {
    title: "Walk History",
    url: createPageUrl("WalkHistory"),
    icon: History,
  },
  {
    title: "Messages",
    url: createPageUrl("Messages"),
    icon: MessageCircle,
  },
  {
    title: "Notifications",
    url: createPageUrl("Notifications"),
    icon: Bell,
    hasNotifications: true,
  },
  {
    title: "Loyalty Rewards",
    url: createPageUrl("LoyaltyRewards"),
    icon: Gift,
  },
  {
    title: "Become a Walker",
    url: createPageUrl("BecomeWalker"),
    icon: PlusCircle,
  },
  {
    title: "Become a Trainer",
    url: createPageUrl("BecomeTrainer"),
    icon: Award,
  },
  {
    title: "Walker Subscriptions",
    url: createPageUrl("Subscriptions"),
    icon: Crown,
  },
  {
    title: "My Profile",
    url: createPageUrl("MyProfile"),
    icon: User,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: notifications } = useQuery({
    queryKey: ['unreadNotifications'],
    queryFn: async () => {
      const allNotifications = await base44.entities.Notification.filter({ 
        recipient_email: user?.email,
        is_read: false 
      });
      return allNotifications;
    },
    enabled: !!user,
    initialData: [],
  });

  const unreadCount = notifications?.length || 0;

  return (
    <SidebarProvider>
      <style>{`
        :root {
          --primary: 142 76% 36%;
          --primary-foreground: 0 0% 100%;
          --accent: 142 76% 92%;
          --accent-foreground: 142 76% 20%;
        }
      `}</style>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-green-50 via-blue-50 to-green-50">
        <Sidebar className="border-r border-green-100">
          <SidebarHeader className="border-b border-green-100 p-6">
            <Link to={createPageUrl("Home")} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Dog className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-gray-900">PawCão</h2>
                <p className="text-xs text-gray-500">Premium Dog Care</p>
              </div>
            </Link>
          </SidebarHeader>
          
          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs text-gray-500 px-2">MAIN MENU</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.slice(0, 5).map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-green-100 hover:text-green-700 transition-all duration-200 rounded-xl mb-2 ${
                          location.pathname === item.url ? 'bg-green-100 text-green-700 shadow-sm' : ''
                        } ${item.icon === Zap ? 'border-2 border-orange-200 hover:bg-orange-50 hover:text-orange-700' : ''}`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className={`w-5 h-5 ${item.icon === Zap ? 'text-orange-500' : ''}`} />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-xs text-gray-500 px-2">MY ACTIVITY</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.slice(5, 12).map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-green-100 hover:text-green-700 transition-all duration-200 rounded-xl mb-2 ${
                          location.pathname === item.url ? 'bg-green-100 text-green-700 shadow-sm' : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                          {item.hasNotifications && unreadCount > 0 && (
                            <Badge className="ml-auto bg-red-500 text-white">
                              {unreadCount}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-xs text-gray-500 px-2">PROFESSIONAL SERVICES</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.slice(12, 15).map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-green-100 hover:text-green-700 transition-all duration-200 rounded-xl mb-2 ${
                          location.pathname === item.url ? 'bg-green-100 text-green-700 shadow-sm' : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-xs text-gray-500 px-2">ACCOUNT</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.slice(15).map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-green-100 hover:text-green-700 transition-all duration-200 rounded-xl mb-2 ${
                          location.pathname === item.url ? 'bg-green-100 text-green-700 shadow-sm' : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white/80 backdrop-blur-sm border-b border-green-100 px-6 py-4 md:hidden sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-green-100 p-2 rounded-lg transition-colors duration-200" />
              <div className="flex items-center gap-2">
                <Dog className="w-6 h-6 text-green-600" />
                <h1 className="text-xl font-bold text-gray-900">PawCão</h1>
              </div>
              {unreadCount > 0 && (
                <Link to={createPageUrl("Notifications")} className="ml-auto">
                  <Badge className="bg-red-500 text-white">
                    {unreadCount}
                  </Badge>
                </Link>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="grid md:grid-cols-4 gap-8 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Dog className="w-6 h-6 text-green-600" />
                    <h3 className="font-bold text-lg text-gray-900">PawCão</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    The leading platform for professional dog walking and care services.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Services</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li><Link to={createPageUrl("Home")} className="hover:text-green-600">Find Walkers</Link></li>
                    <li><Link to={createPageUrl("Trainers")} className="hover:text-green-600">Find Trainers</Link></li>
                    <li><Link to={createPageUrl("DogSittingServices")} className="hover:text-green-600">Dog Sitting</Link></li>
                    <li><Link to={createPageUrl("Partners")} className="hover:text-green-600">Partner Stores</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">For Professionals</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li><Link to={createPageUrl("BecomeWalker")} className="hover:text-green-600">Become a Walker</Link></li>
                    <li><Link to={createPageUrl("BecomeTrainer")} className="hover:text-green-600">Become a Trainer</Link></li>
                    <li><Link to={createPageUrl("Subscriptions")} className="hover:text-green-600">Subscription Plans</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Company</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li><a href="#" className="hover:text-green-600">About Us</a></li>
                    <li><a href="#" className="hover:text-green-600">Contact</a></li>
                    <li><a href="#" className="hover:text-green-600">Terms of Service</a></li>
                    <li><a href="#" className="hover:text-green-600">Privacy Policy</a></li>
                    <li><a href="#" className="hover:text-green-600">Cookie Policy</a></li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-600">
                  © 2025 PawCão. All rights reserved.
                </p>
                <div className="flex items-center gap-2 text-sm text-green-700 font-semibold">
                  ✓ Verified & Insured Professionals
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </SidebarProvider>
  );
}
