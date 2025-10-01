import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Check, Chrome, AlertCircle, ExternalLink } from 'lucide-react';
import { Glass, GlassCard } from '@/components/glass';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * EXTENSION INSTALLATION PAGE
 *
 * Direct download system (No Chrome Web Store payment required)
 * Features:
 * - Animated step-by-step guide
 * - One-click .zip download
 * - Account connection flow
 * - Troubleshooting section
 */

interface InstallStep {
  number: number;
  title: string;
  description: string;
  image?: string;
  action?: () => void;
  actionLabel?: string;
  completed?: boolean;
}

export const InstallExtensionPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [extensionConnected, setExtensionConnected] = useState(false);

  const handleDownload = () => {
    // Trigger download of latest extension .zip
    const link = document.createElement('a');
    link.href = '/downloads/catchr-extension-latest.zip';
    link.download = 'catchr-extension.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadStarted(true);
    setCurrentStep(1);
  };

  const testExtension = () => {
    // Check if extension is installed and connected
    // Send message to extension to verify connection
    if (window.chrome && window.chrome.runtime) {
      try {
        window.chrome.runtime.sendMessage(
          'catchr-extension-id', // Replace with actual extension ID
          { action: 'ping' },
          (response: any) => {
            if (response && response.connected) {
              setExtensionConnected(true);
            }
          }
        );
      } catch (error) {
        console.error('Extension test failed:', error);
      }
    }
  };

  const installSteps: InstallStep[] = [
    {
      number: 1,
      title: 'Download Extension',
      description: 'Click the button below to download the Catchr extension .zip file',
      action: handleDownload,
      actionLabel: downloadStarted ? 'Downloaded! ✓' : 'Download Extension',
      completed: downloadStarted
    },
    {
      number: 2,
      title: 'Unzip the File',
      description: 'Extract the downloaded .zip file to a folder on your computer (e.g., Documents/Catchr)',
      completed: currentStep >= 2
    },
    {
      number: 3,
      title: 'Open Chrome Extensions',
      description: 'In Chrome, go to chrome://extensions or click Menu → Extensions → Manage Extensions',
      action: () => {
        window.open('chrome://extensions', '_blank');
        setCurrentStep(3);
      },
      actionLabel: 'Open Extensions Page',
      completed: currentStep >= 3
    },
    {
      number: 4,
      title: 'Enable Developer Mode',
      description: 'Toggle the "Developer mode" switch in the top-right corner',
      completed: currentStep >= 4
    },
    {
      number: 5,
      title: 'Load Unpacked Extension',
      description: 'Click "Load unpacked" and select the unzipped Catchr folder',
      completed: currentStep >= 5
    },
    {
      number: 6,
      title: 'Connect Your Account',
      description: 'Click the Catchr extension icon and log in with your Catchr account',
      action: testExtension,
      actionLabel: extensionConnected ? 'Connected! ✓' : 'Test Connection',
      completed: extensionConnected
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <motion.div
        className="max-w-4xl mx-auto mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-orange-primary to-orange-bright bg-clip-text text-transparent">
          Install Catchr Extension
        </h1>
        <p className="text-lg text-gray-400">
          Capture thoughts from anywhere in your browser with one click
        </p>
      </motion.div>

      {/* Quick Start Button */}
      <motion.div
        className="max-w-4xl mx-auto mb-12"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <GlassCard variant="orange" className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-primary flex items-center justify-center">
                <Chrome className="w-8 h-8 text-black" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-2">Ready to Start?</h2>
                <p className="text-gray-300">Download and install in less than 2 minutes</p>
              </div>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={handleDownload}
              disabled={downloadStarted}
              className="flex items-center space-x-2"
            >
              {downloadStarted ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Downloaded</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Download Now</span>
                </>
              )}
            </Button>
          </div>
        </GlassCard>
      </motion.div>

      {/* Installation Steps */}
      <div className="max-w-4xl mx-auto space-y-6">
        {installSteps.map((step, index) => (
          <motion.div
            key={step.number}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <GlassCard
              variant={step.completed ? "orange" : "glass"}
              className={cn(
                "p-6 transition-all duration-300",
                currentStep === index && "ring-2 ring-orange-primary"
              )}
            >
              <div className="flex items-start space-x-4">
                {/* Step Number */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300",
                    step.completed
                      ? "bg-orange-primary text-black"
                      : "bg-glass-orange-10 text-orange-primary border border-orange-light"
                  )}
                >
                  {step.completed ? <Check className="w-5 h-5" /> : step.number}
                </div>

                {/* Step Content */}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-400 mb-4">{step.description}</p>

                  {/* Step Action */}
                  {step.action && (
                    <Button
                      variant={step.completed ? "secondary" : "primary"}
                      onClick={() => {
                        step.action!();
                        if (!step.completed) {
                          setCurrentStep(index + 1);
                        }
                      }}
                      disabled={step.completed && step.number !== 6}
                      className="flex items-center space-x-2"
                    >
                      <span>{step.actionLabel}</span>
                      {step.number === 3 && <ExternalLink className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Video Tutorial */}
      <motion.div
        className="max-w-4xl mx-auto mt-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <GlassCard variant="glass" className="p-8">
          <h2 className="text-2xl font-semibold mb-4">Video Tutorial</h2>
          <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
            <p className="text-gray-500">Installation video tutorial coming soon</p>
          </div>
        </GlassCard>
      </motion.div>

      {/* Troubleshooting */}
      <motion.div
        className="max-w-4xl mx-auto mt-12 mb-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        <GlassCard variant="glass" className="p-8">
          <div className="flex items-start space-x-4">
            <AlertCircle className="w-6 h-6 text-orange-primary flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-semibold mb-4">Troubleshooting</h2>
              <div className="space-y-4 text-gray-400">
                <div>
                  <h3 className="text-white font-semibold mb-2">Extension not showing up?</h3>
                  <p>Make sure you selected the correct folder (the one containing manifest.json)</p>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">Developer mode toggle missing?</h3>
                  <p>Look for a toggle switch in the top-right corner of chrome://extensions page</p>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">Can't log in to extension?</h3>
                  <p>Make sure you're logged into your Catchr account in the main website first</p>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">Still having issues?</h3>
                  <p>Contact us at support@catchr.com or check our FAQ page</p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Success State */}
      <AnimatePresence>
        {extensionConnected && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExtensionConnected(false)}
          >
            <motion.div
              className="max-w-md"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <GlassCard variant="premium" className="p-8 text-center">
                <motion.div
                  className="w-20 h-20 mx-auto mb-6 bg-orange-primary rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: 360 }}
                  transition={{ type: "spring", delay: 0.2 }}
                >
                  <Check className="w-10 h-10 text-black" />
                </motion.div>
                <h2 className="text-3xl font-bold mb-4">Extension Connected!</h2>
                <p className="text-gray-400 mb-6">
                  Your Catchr extension is now ready to use. Press <kbd className="px-2 py-1 bg-orange-primary text-black rounded">Cmd+K</kbd> anywhere to start capturing thoughts.
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => window.location.href = '/'}
                  className="w-full"
                >
                  Start Capturing Thoughts
                </Button>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InstallExtensionPage;
