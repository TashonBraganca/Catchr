import React, { useState } from 'react';
import HomePage from './pages/HomePage';
import ColorTestPage from './pages/ColorTestPage';
import ApiTestPage from './pages/ApiTestPage';
import WCAGComplianceTest from './components/testing/WCAGComplianceTest';
import { Button } from './components/ui/button';
import { Palette, Home, Code, Shield } from 'lucide-react';

function App(): React.ReactElement {
  const [currentPage, setCurrentPage] = useState<'home' | 'colortest' | 'apitest' | 'wcagtest'>('home');

  // Simple page switching for testing
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
        <ColorTestPage />
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
        <ApiTestPage />
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
        <WCAGComplianceTest />
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