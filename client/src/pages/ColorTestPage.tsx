import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { GlassButton } from '@/components/glass';
import ColorSystemTest from '@/components/testing/ColorSystemTest';

// Page wrapper for the Color System Test
const ColorTestPage: React.FC = () => {
  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Navigation */}
      <div className="fixed top-4 left-4 z-50">
        <GlassButton
          variant="light"
          size="sm"
          onClick={handleGoBack}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="font-primary"
        >
          Back
        </GlassButton>
      </div>

      {/* Color System Test Component */}
      <ColorSystemTest />

      {/* Footer */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="text-xs text-text-tertiary font-primary">
          🎨 Cathcr Color System Test v1.0
        </div>
      </div>
    </motion.div>
  );
};

export default ColorTestPage;