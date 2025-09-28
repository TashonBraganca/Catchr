import React, { useState, Suspense } from 'react';
import HomePage from './pages/HomePage';
import { Button } from './components/ui/button';
import { Palette, Home, Code, Shield } from 'lucide-react';

// Lazy load test pages for better performance
const ColorTestPage = React.lazy(() => import('./pages/ColorTestPage'));
const ApiTestPage = React.lazy(() => import('./pages/ApiTestPage'));
const WCAGComplianceTest = React.lazy(() => import('./components/testing/WCAGComplianceTest'));

function App(): React.ReactElement {
  const [currentPage, setCurrentPage] = useState<'home' | 'colortest' | 'apitest' | 'wcagtest'>('home');

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


  return (
    <div>
      {/* Test Access Buttons */}
      <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2">
        <Button
          variant="neon"
          size="sm"
          onClick={() => setCurrentPage('colortest')}
          leftIcon={<Palette className="w-4 h-4" />}
          className="animate-orange-glow"
        >
          🎨 Test Colors
        </Button>
        <Button
          variant="premium"
          size="sm"
          onClick={() => setCurrentPage('apitest')}
          leftIcon={<Code className="w-4 h-4" />}
        >
          🔧 Test APIs
        </Button>
        <Button
          variant="glass"
          size="sm"
          onClick={() => setCurrentPage('wcagtest')}
          leftIcon={<Shield className="w-4 h-4" />}
          className="border-green-400/30 text-green-400"
        >
          ✅ WCAG Test
        </Button>
      </div>
      <HomePage />
    </div>
  );
}

export default App;