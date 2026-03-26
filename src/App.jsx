import './App.css'
import { Suspense, lazy } from 'react'
import { Toaster } from "@/components/ui/toaster"
const MyWalletPro = lazy(() => import('./pages/MyWalletPro'))
const ProfessionalHubV2 = lazy(() => import('./pages/ProfessionalHubV2'))
const PawGoWaiting = lazy(() => import('./pages/PawGoWaiting'))
const ProfessionalSetup = lazy(() => import('./pages/ProfessionalSetup'))
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { setupIframeMessaging } from './lib/iframe-messaging';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : () => null;

setupIframeMessaging();

const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center" role="status" aria-live="polite">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" aria-hidden="true"></div>
    <span className="sr-only">Loading page...</span>
  </div>
);

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
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
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<MainPage />} />
          {Object.entries(Pages).map(([path, Page]) => (
            <Route key={path} path={`/${path}`} element={<Page />} />
          ))}
          <Route path="/MyWalletPro" element={<Suspense fallback={<PageLoader />}><MyWalletPro /></Suspense>} />
          <Route path="/ProfessionalHubV2" element={<Suspense fallback={<PageLoader />}><ProfessionalHubV2 /></Suspense>} />
          <Route path="/PawGoWaiting" element={<Suspense fallback={<PageLoader />}><PawGoWaiting /></Suspense>} />
          <Route path="/ProfessionalSetup" element={<Suspense fallback={<PageLoader />}><ProfessionalSetup /></Suspense>} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Suspense>
    </LayoutWrapper>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App