import React, { Suspense, lazy } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { AnimatePresence, motion } from 'framer-motion'
import Home from './pages/Home.jsx'
import UserProfile from './pages/UserProfile.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import OAuthConsent from './pages/OAuthConsent.jsx'
import ShortProfile from './pages/ShortProfile.jsx'
import QRProfileTest from './pages/QRProfileTest.jsx'
import CountryLandingPage from './pages/CountryLandingPage.jsx'
const ProfessionalHubV2 = lazy(() => import('./pages/ProfessionalHubV2').catch(e => {
  console.error('Error loading ProfessionalHubV2:', e);
  return { default: () => <div>Erro ao carregar página</div> };
}));

const ProfessionalSetup = lazy(() => import('./pages/ProfessionalSetup').catch(e => {
  console.error('Error loading ProfessionalSetup:', e);
  return { default: () => <div>Erro ao carregar página</div> };
}));
const ClientSetup = lazy(() => import('./pages/ClientSetup').catch(e => {
  console.error('Error loading ClientSetup:', e);
  return { default: () => <div>Erro ao carregar página</div> };
}));
const DebugWalkTest = lazy(() => import('./pages/DebugWalkTest').catch(e => {
  console.error('Error loading DebugWalkTest:', e);
  return { default: () => <div>Erro ao carregar página</div> };
}));
const PawGoMaintenance = lazy(() => import('./pages/PawGoMaintenance').catch(e => {
  console.error('Error loading PawGoMaintenance:', e);
  return { default: () => <div>Erro ao carregar página</div> };
}));
const ProfessionalCalendar = lazy(() => import('./pages/ProfessionalCalendar').catch(e => {
  console.error('Error loading ProfessionalCalendar:', e);
  return { default: () => <div>Erro ao carregar página</div> };
}));
const HotelDashboard = lazy(() => import('./pages/HotelDashboard').catch(e => {
  console.error('Error loading HotelDashboard:', e);
  return { default: () => <div>Erro ao carregar página</div> };
}));

const PartnerHotelPanel = lazy(() => import('./pages/PartnerHotelPanel').catch(e => {
  console.error('Error loading PartnerHotelPanel:', e);
  return { default: () => <div>Erro ao carregar página</div> };
}));

const ProfessionalTypeSelect = lazy(() => import('./pages/ProfessionalTypeSelect').catch(e => {
  console.error('Error loading ProfessionalTypeSelect:', e);
  return { default: () => <div>Erro ao carregar página</div> };
}));

const HotelOnboarding = lazy(() => import('./pages/HotelOnboarding').catch(e => {
  console.error('Error loading HotelOnboarding:', e);
  return { default: () => <div>Erro ao carregar página</div> };
}));

const WalkerOnboarding = lazy(() => import('./pages/WalkerOnboarding').catch(e => {
  console.error('Error loading WalkerOnboarding:', e);
  return { default: () => <div>Erro ao carregar página</div> };
}));

const ActiveWalkDashboard = lazy(() => import('./pages/ActiveWalkDashboard').catch(e => {
  console.error('Error loading ActiveWalkDashboard:', e);
  return { default: () => <div>Erro ao carregar página</div> };
}));

const WalkerRecommenderChat = lazy(() => import('./pages/WalkerRecommenderChat').catch(e => {
  console.error('Error loading WalkerRecommenderChat:', e);
  return { default: () => <div>Erro ao carregar página</div> };
}));

const PriceProposals = lazy(() => import('./pages/PriceProposals').catch(e => {
  console.error('Error loading PriceProposals:', e);
  return { default: () => <div>Erro ao carregar página</div> };
}));
const Shop = lazy(() => import('./pages/Shop').catch(e => {
  console.error('Error loading Shop:', e);
  return { default: () => <div>Erro ao carregar página</div> };
}));
const ShopProfile = lazy(() => import('./pages/ShopProfile').catch(e => {
  console.error('Error loading ShopProfile:', e);
  return { default: () => <div>Erro ao carregar página</div> };
}));
const ShopOnboarding = lazy(() => import('./pages/ShopOnboarding').catch(e => {
  console.error('Error loading ShopOnboarding:', e);
  return { default: () => <div>Erro ao carregar página</div> };
}));
const StoreDashboard = lazy(() => import('./pages/StoreDashboard').catch(e => {
  console.error('Error loading StoreDashboard:', e);
  return { default: () => <div>Erro ao carregar página</div> };
}));

import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import ScrollToTop from '@/components/ui/ScrollToTop'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { setupIframeMessaging } from './lib/iframe-messaging';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import PageLoader from '@/components/ui/PageLoader';
import TabKeepAlive, { findActiveTab } from "@/components/layout/TabKeepAlive";

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey && Pages[mainPageKey] ? Pages[mainPageKey] : () => <div>Página principal não encontrada</div>;

setupIframeMessaging();

// Suppress benign ResizeObserver loop warning (browser quirk, not an app bug)
// Root cause is patched in main.jsx (rAF-deferred observe); this is a backup filter.
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    if (e?.message === 'ResizeObserver loop completed with undelivered notifications.' ||
        e?.message === 'ResizeObserver loop limit exceeded') {
      e.stopImmediatePropagation();
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);
}

const ErrorBoundaryWrapper = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);
  
  React.useEffect(() => {
    const handleError = (e) => {
      if (e?.message?.includes('ResizeObserver loop')) return;
      setHasError(true);
      setTimeout(() => setHasError(false), 100);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  if (hasError) {
    return <PageLoader />;
  }
  
  return children;
};

const LayoutWrapper = ({ children, currentPageName }) => {
  try {
    return Layout ? <Layout currentPageName={currentPageName}>{children}</Layout> : <>{children}</>;
  } catch (e) {
    console.error('Error in Layout:', e);
    return <>{children}</>;
  }
};

const AuthenticatedApp = () => {
  const location = useLocation();
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Direção da navegação (avançar vs voltar) — alimenta as transições de página
  const historyKeysRef = React.useRef([]);
  const [isBackNav, setIsBackNav] = React.useState(false);
  React.useEffect(() => {
    const stack = historyKeysRef.current;
    const idx = stack.indexOf(location.key);
    if (idx === -1) {
      stack.push(location.key);
      setIsBackNav(false);
    } else {
      stack.length = idx + 1;
      setIsBackNav(true);
    }
  }, [location.key]);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <PageLoader />;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  // Transições: fade curto com um leve deslize vertical, igual em mobile e desktop.
  // Sem deslocamentos horizontais — eram a causa da sensação de página "quebrada".
  const onTabPage = !!findActiveTab(location.pathname);
  const reduceMotion =
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const variants = reduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0 },
      };
  const pageTransition = {
    duration: reduceMotion ? 0 : isBackNav ? 0.12 : 0.2,
    ease: [0.22, 1, 0.36, 1],
  };

  return (
    <LayoutWrapper currentPageName={mainPageKey}>
      {/* Abas principais mantêm o DOM montado entre trocas (preserva estado) */}
      <TabKeepAlive />
      <AnimatePresence mode="wait" initial={false}>
      {!onTabPage && (
      <motion.div
        key={location.pathname}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        transition={pageTransition}
      >
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/Home" element={<Home />} />
            <Route path="/UserProfile" element={<UserProfile />} />
            <Route path="/AdminDashboard" element={<AdminDashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* Consentimento MCP — fora de qualquer guarda de autenticação */}
            <Route path="/oauth/consent" element={<OAuthConsent />} />
            {Object.entries(Pages).map(([path, Page]) => {
              try {
                return <Route key={path} path={`/${path}`} element={<Page />} />;
              } catch (e) {
                console.error(`Error rendering page ${path}:`, e);
                return null;
              }
            })}
            <Route path="/ProfessionalSetup" element={<Suspense fallback={<PageLoader />}><ProfessionalSetup /></Suspense>} />
            <Route path="/ProfessionalHubV2" element={<Suspense fallback={<PageLoader />}><ProfessionalHubV2 /></Suspense>} />
            <Route path="/Dashboard" element={<Suspense fallback={<PageLoader />}><PawGoMaintenance /></Suspense>} />

            <Route path="/ProfessionalCalendar" element={<Suspense fallback={<PageLoader />}><ProfessionalCalendar /></Suspense>} />
            <Route path="/DebugWalkTest" element={<Suspense fallback={<PageLoader />}><DebugWalkTest /></Suspense>} />
            <Route path="/ClientSetup" element={<Suspense fallback={<PageLoader />}><ClientSetup /></Suspense>} />
            <Route path="/HotelDashboard" element={<Suspense fallback={<PageLoader />}><HotelDashboard /></Suspense>} />
            <Route path="/PartnerHotelPanel" element={<Suspense fallback={<PageLoader />}><PartnerHotelPanel /></Suspense>} />
            <Route path="/ProfessionalTypeSelect" element={<Suspense fallback={<PageLoader />}><ProfessionalTypeSelect /></Suspense>} />
            <Route path="/HotelOnboarding" element={<Suspense fallback={<PageLoader />}><HotelOnboarding /></Suspense>} />
            <Route path="/WalkerOnboarding" element={<Suspense fallback={<PageLoader />}><WalkerOnboarding /></Suspense>} />
            <Route path="/ActiveWalkDashboard" element={<Suspense fallback={<PageLoader />}><ActiveWalkDashboard /></Suspense>} />
            <Route path="/WalkerRecommenderChat" element={<Suspense fallback={<PageLoader />}><WalkerRecommenderChat /></Suspense>} />
            <Route path="/PriceProposals" element={<Suspense fallback={<PageLoader />}><PriceProposals /></Suspense>} />
            <Route path="/Shop" element={<Suspense fallback={<PageLoader />}><Shop /></Suspense>} />
            <Route path="/ShopOnboarding" element={<Suspense fallback={<PageLoader />}><ShopOnboarding /></Suspense>} />
            <Route path="/StoreDashboard" element={<Suspense fallback={<PageLoader />}><StoreDashboard /></Suspense>} />
            <Route path="/loja/:profileId" element={<Suspense fallback={<PageLoader />}><ShopProfile /></Suspense>} />

            <Route path="/QRProfileTest" element={<QRProfileTest />} />
            <Route path="/portugal" element={<CountryLandingPage country="portugal" />} />
            <Route path="/espanha" element={<CountryLandingPage country="espanha" />} />
            <Route path="/franca" element={<CountryLandingPage country="franca" />} />
            <Route path="/:slug" element={<ShortProfile />} />
            <Route path="*" element={<PageNotFound />} />
            </Routes>
        </Suspense>
      </motion.div>
      )}
      </AnimatePresence>
    </LayoutWrapper>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <SonnerToaster position="top-center" />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App