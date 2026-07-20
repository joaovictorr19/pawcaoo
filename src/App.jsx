import './App.css'
import React, { Suspense, lazy } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { AnimatePresence, motion } from 'framer-motion'
import Home from './pages/Home.jsx'
import UserProfile from './pages/UserProfile.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
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

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey && Pages[mainPageKey] ? Pages[mainPageKey] : () => <div>Página principal não encontrada</div>;

setupIframeMessaging();

// Suppress benign ResizeObserver loop warning (browser quirk, not an app bug)
if (typeof window !== 'undefined') {
  const _resizeObserverHandler = (e) => {
    if (e.message === 'ResizeObserver loop completed with undelivered notifications.' ||
        e.message === 'ResizeObserver loop limit exceeded') {
      e.stopImmediatePropagation();
      e.stopPropagation();
      e.preventDefault();
    }
  };
  window.addEventListener('error', _resizeObserverHandler);
  window.addEventListener('unhandledrejection', (e) => {
    const msg = e?.reason?.message || String(e?.reason || '');
    if (msg.includes('ResizeObserver loop')) {
      e.preventDefault();
      e.stopPropagation();
    }
  });
}

const ErrorBoundaryWrapper = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);
  
  React.useEffect(() => {
    const handleError = () => {
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

  return (
    <LayoutWrapper currentPageName={mainPageKey}>
      <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
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

            <Route path="/QRProfileTest" element={<QRProfileTest />} />
            <Route path="/portugal" element={<CountryLandingPage country="portugal" />} />
            <Route path="/espanha" element={<CountryLandingPage country="espanha" />} />
            <Route path="/franca" element={<CountryLandingPage country="franca" />} />
            <Route path="/p/:slug" element={<ShortProfile />} />
            <Route path="*" element={<PageNotFound />} />
            </Routes>
        </Suspense>
      </motion.div>
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
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App