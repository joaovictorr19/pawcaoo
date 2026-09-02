import React, { Suspense, lazy, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import PageLoader from "@/components/ui/PageLoader";
import Home from "@/pages/Home.jsx";
import UserProfile from "@/pages/UserProfile.jsx";

const ClientDashboard = lazy(() => import("@/pages/ClientDashboard"));
const ProfessionalHubV2 = lazy(() => import("@/pages/ProfessionalHubV2"));
const HotelDashboard = lazy(() => import("@/pages/HotelDashboard"));
const StoreDashboard = lazy(() => import("@/pages/StoreDashboard"));
const ProfessionalCalendar = lazy(() => import("@/pages/ProfessionalCalendar"));
const MyBookings = lazy(() => import("@/pages/MyBookings"));
const PartnerHotelPanel = lazy(() => import("@/pages/PartnerHotelPanel"));

const withLoader = (Comp) => (
  <Suspense fallback={<PageLoader />}>
    <Comp />
  </Suspense>
);

// Abas/painéis raiz cujo DOM deve persistir ao trocar de aba
// (preserva scroll, filtros e estado interno — estilo app nativo).
const TAB_PAGES = [
  { id: "home", paths: ["/", "/Home"], element: <Home /> },
  { id: "clientDashboard", paths: ["/ClientDashboard"], element: withLoader(ClientDashboard) },
  { id: "professionalHub", paths: ["/ProfessionalHubV2"], element: withLoader(ProfessionalHubV2) },
  { id: "hotelDashboard", paths: ["/HotelDashboard"], element: withLoader(HotelDashboard) },
  { id: "storeDashboard", paths: ["/StoreDashboard"], element: withLoader(StoreDashboard) },
  { id: "professionalCalendar", paths: ["/ProfessionalCalendar"], element: withLoader(ProfessionalCalendar) },
  { id: "myBookings", paths: ["/MyBookings"], element: withLoader(MyBookings) },
  { id: "partnerHotelPanel", paths: ["/PartnerHotelPanel"], element: withLoader(PartnerHotelPanel) },
  { id: "userProfile", paths: ["/UserProfile"], element: <UserProfile /> },
];

export const findActiveTab = (pathname) =>
  TAB_PAGES.find((t) => t.paths.includes(pathname)) || null;

export default function TabKeepAlive() {
  const location = useLocation();
  const activeTab = findActiveTab(location.pathname);

  // Monta cada aba apenas na primeira visita; depois mantém o DOM vivo
  const [mountedIds, setMountedIds] = useState(() => (activeTab ? [activeTab.id] : []));

  useEffect(() => {
    if (!activeTab) return;
    setMountedIds((prev) => (prev.includes(activeTab.id) ? prev : [...prev, activeTab.id]));
  }, [activeTab?.id]);

  return (
    <>
      {TAB_PAGES.filter((t) => mountedIds.includes(t.id)).map((tab) => {
        const active = activeTab?.id === tab.id;
        return (
          <div key={tab.id} style={{ display: active ? "block" : "none" }} aria-hidden={!active}>
            {tab.element}
          </div>
        );
      })}
    </>
  );
}