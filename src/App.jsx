import './App.css'
import React, { Suspense, lazy } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { AnimatePresence, motion } from 'framer-motion'
const ProfessionalHubV2 = lazy(() => import('./pages/ProfessionalHubV2').catch(e => {
  console.error('Error loading ProfessionalHubV2:', e);
  return { default: () => <div>Erro ao carregar página</div> };
}));

const ProfessionalSetup = lazy(() => import('./pages/ProfessionalSetup').catch(e => {
  console.error('Error loading ProfessionalSetup:', e);
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

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey && Pages[mainPageKey] ? Pages[mainPageKey] : () => <div>Página principal não encontrada</div>;

setupIframeMessaging();

const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center" role="status" aria-live="polite">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" aria-hidden="true"></div>
    <span className="sr-only">Loading page...</span>
  </div>
);

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
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<MainPage />} />
            {Object.entries(Pages).map(([path, Page]) => {
              try {
                return <Route key={path} path={`/${path}`} element={<Page />} />;
              } catch (e) {
                console.error(`Error rendering page ${path}:`, e);
                return null;
              }
            })}
            <Route path="/ProfessionalHubV2" element={<Suspense fallback={<PageLoader />}><ProfessionalHubV2 /></Suspense>} />
            <Route path="/Dashboard" element={<Suspense fallback={<PageLoader />}><PawGoMaintenance /></Suspense>} />

            <Route path="/ProfessionalSetup" element={<Suspense fallback={<PageLoader />}><ProfessionalSetup /></Suspense>} />
            <Route path="/DebugWalkTest" element={<Suspense fallback={<PageLoader />}><DebugWalkTest /></Suspense>} />

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