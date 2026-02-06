import { useEffect, Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';

// Lazy load heavy pages for better code splitting
const DashboardRouter = lazy(() => import('./pages/DashboardRouter'));
const InfluencerListing = lazy(() => import('./pages/InfluencerListing'));
const InfluencerDetail = lazy(() => import('./pages/InfluencerDetail'));
const OrderSystem = lazy(() => import('./pages/OrderSystem'));
const About = lazy(() => import('./pages/About'));
const AIRecommendations = lazy(() => import('./pages/AIRecommendations'));
const Terms = lazy(() => import('./pages/Terms'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));

import { runAuthTests } from './utils/AuthDiagnostics';

// Simple Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

function App() {
  useEffect(() => {
    // Expose diagnostic tool to console
    window.runAuthTests = runAuthTests;
    console.log('🛠️ Auth Debugger Loaded: Type "runAuthTests()" in console to check system health.');
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<About />} />
            <Route path="/influencers" element={<InfluencerListing />} />
            <Route path="/influencer/:username" element={<InfluencerDetail />} />
            <Route path="/dashboard" element={<ProtectedRoute element={<DashboardRouter />} />} />
            <Route path="/order/:influencerId" element={<ProtectedRoute element={<OrderSystem />} requiredRole="sme" />} />
            <Route path="/ai-recommendations" element={<AIRecommendations />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/payment" element={<ProtectedRoute element={<PaymentPage />} requiredRole="sme" />} />
            <Route path="/payment/success" element={<ProtectedRoute element={<PaymentSuccess />} requiredRole="sme" />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export default App;
