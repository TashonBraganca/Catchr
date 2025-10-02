import React, { useState, Suspense } from 'react';
import HomePage from './pages/HomePage';
import { Button } from './components/ui/button';
import { Palette, Home, Code, Shield } from 'lucide-react';

// Lazy load test pages for better performance
const ColorTestPage = React.lazy(() => import('./pages/ColorTestPage'));
const ApiTestPage = React.lazy(() => import('./pages/ApiTestPage'));
const WCAGComplianceTest = React.lazy(() => import('./components/testing/WCAGComplianceTest'));
const ProgressiveDisclosureDemo = React.lazy(() => import('./components/demo/ProgressiveDisclosureDemo'));

function App(): React.ReactElement {
  const [currentPage, setCurrentPage] = useState<'home' | 'colortest' | 'apitest' | 'wcagtest' | 'progressive'>('home');

  // Simple loading component for lazy-loaded pages
  const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-screen bg-[#fbfbfd]">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-8 h-8 border-2 border-[#007aff] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#8e8e93]">Loading...</p>
      </div>
    </div>
  );

  // Simple page switching for testing with lazy loading
  if (currentPage === 'colortest') {
    return (
      <div>
        <div className="fixed top-4 left-4 z-50">
          <Button
            variant="glass"
            size="sm"
            onClick={() => setCurrentPage('home')}
            leftIcon={<Home className="w-4 h-4" />}
          >
            Back to Home
          </Button>
        </div>
        <Suspense fallback={<LoadingFallback />}>
          <ColorTestPage />
        </Suspense>
      </div>
    );
  }

  if (currentPage === 'apitest') {
    return (
      <div>
        <div className="fixed top-4 left-4 z-50">
          <Button
            variant="glass"
            size="sm"
            onClick={() => setCurrentPage('home')}
            leftIcon={<Home className="w-4 h-4" />}
          >
            Back to Home
          </Button>
        </div>
        <Suspense fallback={<LoadingFallback />}>
          <ApiTestPage />
        </Suspense>
      </div>
    );
  }

  if (currentPage === 'wcagtest') {
    return (
      <div>
        <div className="fixed top-4 left-4 z-50">
          <Button
            variant="glass"
            size="sm"
            onClick={() => setCurrentPage('home')}
            leftIcon={<Home className="w-4 h-4" />}
          >
            Back to Home
          </Button>
        </div>
        <Suspense fallback={<LoadingFallback />}>
          <WCAGComplianceTest />
        </Suspense>
      </div>
    );
  }

  if (currentPage === 'progressive') {
    return (
      <div className="h-screen">
        <div className="fixed top-4 left-4 z-50">
          <Button
            variant="glass"
            size="sm"
            onClick={() => setCurrentPage('home')}
            leftIcon={<Home className="w-4 h-4" />}
          >
            Back to Home
          </Button>
        </div>
        <Suspense fallback={<LoadingFallback />}>
          <ProgressiveDisclosureDemo className="pt-16" />
        </Suspense>
      </div>
    );
  }


  return <HomePage />;
}

export default App;