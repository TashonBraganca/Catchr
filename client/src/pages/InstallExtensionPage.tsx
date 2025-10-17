import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Check, Chrome, AlertCircle, ExternalLink, KeyRound, Package, FileArchive, CheckCircle2, Terminal } from 'lucide-react';
import { Glass, GlassCard } from '@/components/glass';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/**
 * EXTENSION INSTALLATION PAGE
 *
 * Direct download system (No Chrome Web Store payment required)
 * Features:
 * - Animated step-by-step guide
 * - One-click .zip download
 * - Account connection flow with auth token transfer
 * - Troubleshooting section
 * - Packaging instructions
 * - Testing checklist
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

// Extension ID will be dynamic - any unpacked extension can receive messages
// via externally_connectable in manifest.json
const EXTENSION_PING_TIMEOUT = 3000; // 3 seconds
const EXTENSION_VERSION = '1.0.0';
const EXTENSION_SIZE = '~488KB';

export const InstallExtensionPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [extensionConnected, setExtensionConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showPackagingGuide, setShowPackagingGuide] = useState(false);
  const [showTestingChecklist, setShowTestingChecklist] = useState(false);

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  };

  const handleDownload = () => {
    // Trigger download of latest extension .zip
    const link = document.createElement('a');
    link.href = `/catchr-extension-v${EXTENSION_VERSION}.zip`;
    link.download = `catchr-extension-v${EXTENSION_VERSION}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadStarted(true);
    setCurrentStep(1);
    toast.success('Extension downloaded! Follow the installation steps below.');
  };

  /**
   * CONNECT EXTENSION TO ACCOUNT
   * Sends auth token to extension via external messaging
   */
  const connectExtension = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in first to connect your extension');
      window.location.href = '/login';
      return;
    }

    setIsConnecting(true);

    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('No active session. Please log in again.');
      }

      const { access_token, user } = session;

      if (!access_token) {
        throw new Error('No access token found');
      }

      console.log('Attempting to connect extension...');

      // Since we don't know the extension ID, we use window.postMessage
      // The extension's content script will listen for this message

      // Try to ping extension first
      const pingResult = await pingExtension();

      if (!pingResult) {
        toast.error('Extension not detected. Please make sure it is installed and enabled.');
        setIsConnecting(false);
        return;
      }

      // Send auth token via postMessage (content script will relay to background)
      window.postMessage({
        type: 'CATCHR_AUTH_TOKEN',
        token: access_token,
        userId: user.id,
        user: {
          email: user.email,
          name: user.user_metadata?.full_name || user.email
        }
      }, '*');

      // Wait a bit for extension to process
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify connection
      const connected = await verifyExtensionAuth();

      if (connected) {
        setExtensionConnected(true);
        toast.success('Extension connected successfully!');
      } else {
        toast.warning('Extension may be connected. Please check the extension popup.');
      }

    } catch (error: any) {
      console.error('Failed to connect extension:', error);
      toast.error(error.message || 'Failed to connect extension');
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * PING EXTENSION
   * Check if extension is installed
   */
  const pingExtension = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      // Send ping via postMessage
      window.postMessage({ type: 'CATCHR_PING' }, '*');

      // Listen for pong
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'CATCHR_PONG') {
          window.removeEventListener('message', handleMessage);
          resolve(true);
        }
      };

      window.addEventListener('message', handleMessage);

      // Timeout after 3 seconds
      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        resolve(false);
      }, EXTENSION_PING_TIMEOUT);
    });
  };

  /**
   * VERIFY EXTENSION AUTH
   * Check if extension received and stored auth token
   */
  const verifyExtensionAuth = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      // Send verify request via postMessage
      window.postMessage({ type: 'CATCHR_VERIFY_AUTH' }, '*');

      // Listen for response
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'CATCHR_AUTH_STATUS') {
          window.removeEventListener('message', handleMessage);
          resolve(event.data.isAuthenticated || false);
        }
      };

      window.addEventListener('message', handleMessage);

      // Timeout after 3 seconds
      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        resolve(false);
      }, EXTENSION_PING_TIMEOUT);
    });
  };

  const installSteps: InstallStep[] = [
    {
      number: 1,
      title: 'Download Extension',
      description: `Click the button below to download the Catchr extension v${EXTENSION_VERSION} (.zip file, ${EXTENSION_SIZE})`,
      action: handleDownload,
      actionLabel: downloadStarted ? 'Downloaded!' : 'Download Extension',
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
        setCurrentStep(3);
      },
      actionLabel: 'Next',
      completed: currentStep >= 3
    },
    {
      number: 4,
      title: 'Enable Developer Mode',
      description: 'Toggle the "Developer mode" switch in the top-right corner of the extensions page',
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
      description: isAuthenticated
        ? 'Click below to securely connect your Catchr account to the extension'
        : 'Please log in to your Catchr account first, then come back to connect',
      action: isAuthenticated ? connectExtension : undefined,
      actionLabel: extensionConnected
        ? 'Connected!'
        : isConnecting
          ? 'Connecting...'
          : isAuthenticated
            ? 'Connect Extension'
            : 'Log In First',
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
        <div className="flex items-center gap-4 mt-4">
          <span className="text-sm text-gray-500">Version {EXTENSION_VERSION}</span>
          <span className="text-sm text-gray-500">•</span>
          <span className="text-sm text-gray-500">{EXTENSION_SIZE}</span>
          <span className="text-sm text-gray-500">•</span>
          <span className="text-sm text-gray-500">56 files</span>
        </div>
      </motion.div>

      {/* Auth Warning */}
      {!isAuthenticated && (
        <motion.div
          className="max-w-4xl mx-auto mb-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard variant="orange" className="p-6">
            <div className="flex items-start space-x-4">
              <AlertCircle className="w-6 h-6 text-orange-primary flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">Login Required</h3>
                <p className="text-gray-300 mb-4">
                  You need to be logged in to connect your extension to your Catchr account.
                </p>
                <Button
                  variant="primary"
                  onClick={() => window.location.href = '/login'}
                  className="flex items-center space-x-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Log In Now</span>
                </Button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

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
                <p className="text-sm text-gray-500 mt-1">Version {EXTENSION_VERSION} | {EXTENSION_SIZE}</p>
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
                      disabled={(step.completed && step.number !== 6) || isConnecting}
                      className="flex items-center space-x-2"
                    >
                      {isConnecting && step.number === 6 ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <>
                          <span>{step.actionLabel}</span>
                          {step.number === 3 && <ExternalLink className="w-4 h-4" />}
                        </>
                      )}
                    </Button>
                  )}

                  {/* Show login button for step 6 if not authenticated */}
                  {step.number === 6 && !isAuthenticated && !step.action && (
                    <Button
                      variant="primary"
                      onClick={() => window.location.href = '/login'}
                      className="flex items-center space-x-2"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Log In to Connect</span>
                    </Button>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Developer Resources */}
      <motion.div
        className="max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-2 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        {/* Packaging Guide */}
        <GlassCard variant="glass" className="p-6">
          <div className="flex items-start space-x-4">
            <Package className="w-6 h-6 text-orange-primary flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">Packaging Guide</h3>
              <p className="text-gray-400 mb-4">
                Instructions for developers to package the extension
              </p>
              <Button
                variant="secondary"
                onClick={() => setShowPackagingGuide(!showPackagingGuide)}
                className="flex items-center space-x-2"
              >
                <Terminal className="w-4 h-4" />
                <span>{showPackagingGuide ? 'Hide' : 'Show'} Guide</span>
              </Button>
            </div>
          </div>
        </GlassCard>

        {/* Testing Checklist */}
        <GlassCard variant="glass" className="p-6">
          <div className="flex items-start space-x-4">
            <CheckCircle2 className="w-6 h-6 text-orange-primary flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">Testing Checklist</h3>
              <p className="text-gray-400 mb-4">
                Comprehensive testing checklist for QA
              </p>
              <Button
                variant="secondary"
                onClick={() => setShowTestingChecklist(!showTestingChecklist)}
                className="flex items-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>{showTestingChecklist ? 'Hide' : 'Show'} Checklist</span>
              </Button>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Packaging Guide Expanded */}
      <AnimatePresence>
        {showPackagingGuide && (
          <motion.div
            className="max-w-4xl mx-auto mt-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard variant="orange" className="p-8">
              <h2 className="text-2xl font-semibold mb-6">Extension Packaging Instructions</h2>

              <div className="space-y-6">
                {/* PowerShell Command */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-orange-primary" />
                    PowerShell Command (Windows)
                  </h3>
                  <div className="bg-black/50 rounded-lg p-4 font-mono text-sm">
                    <code className="text-green-400">
                      cd D:\Projects\Cathcr<br />
                      Compress-Archive -Path extension\* -DestinationPath client\public\catchr-extension-v1.0.0.zip -Force
                    </code>
                  </div>
                </div>

                {/* Unix/Mac Command */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-orange-primary" />
                    Terminal Command (Mac/Linux)
                  </h3>
                  <div className="bg-black/50 rounded-lg p-4 font-mono text-sm">
                    <code className="text-green-400">
                      cd ~/Projects/Cathcr<br />
                      cd extension && zip -r ../client/public/catchr-extension-v1.0.0.zip . -x "*.DS_Store" && cd ..
                    </code>
                  </div>
                </div>

                {/* Files to Include */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FileArchive className="w-5 h-5 text-orange-primary" />
                    Files to Include
                  </h3>
                  <div className="bg-black/50 rounded-lg p-4">
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><code className="text-orange-300">manifest.json</code> - Extension configuration</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><code className="text-orange-300">src/*.js</code> - Background, content, popup scripts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><code className="text-orange-300">public/*.html</code> - Popup HTML</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><code className="text-orange-300">icons/*.png</code> - Extension icons (16, 32, 48, 128)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><code className="text-orange-300">src/auth.js</code> - Authentication logic</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Files to Exclude */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    Files to Exclude
                  </h3>
                  <div className="bg-black/50 rounded-lg p-4">
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">✗</span>
                        <span><code className="text-red-300">.DS_Store</code> - Mac system files</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">✗</span>
                        <span><code className="text-red-300">node_modules/</code> - Dependencies (if any)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">✗</span>
                        <span><code className="text-red-300">.git/</code> - Git files</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">✗</span>
                        <span><code className="text-red-300">*.md</code> - Documentation files</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Hosting Instructions */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <ExternalLink className="w-5 h-5 text-orange-primary" />
                    Hosting Instructions
                  </h3>
                  <div className="bg-black/50 rounded-lg p-4">
                    <ol className="space-y-3 text-sm text-gray-300">
                      <li className="flex items-start gap-3">
                        <span className="text-orange-primary font-bold">1.</span>
                        <span>Copy ZIP to <code className="text-orange-300">client/public/</code> directory</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-orange-primary font-bold">2.</span>
                        <span>Commit: <code className="text-green-400">git add client/public/*.zip && git commit -m "Add extension v1.0.0"</code></span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-orange-primary font-bold">3.</span>
                        <span>Push to Vercel: <code className="text-green-400">git push origin main</code></span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-orange-primary font-bold">4.</span>
                        <span>Wait for Vercel deployment (automatic)</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-orange-primary font-bold">5.</span>
                        <span>Test download: <code className="text-blue-400">https://catchr.vercel.app/catchr-extension-v1.0.0.zip</code></span>
                      </li>
                    </ol>
                  </div>
                </div>

                {/* Naming Convention */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Naming Convention</h3>
                  <div className="bg-black/50 rounded-lg p-4">
                    <p className="text-sm text-gray-300 mb-2">
                      Format: <code className="text-orange-300">catchr-extension-v[MAJOR].[MINOR].[PATCH].zip</code>
                    </p>
                    <p className="text-sm text-gray-300">
                      Examples:
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-gray-400">
                      <li>• <code className="text-green-400">catchr-extension-v1.0.0.zip</code> - Initial release</li>
                      <li>• <code className="text-green-400">catchr-extension-v1.0.1.zip</code> - Bug fix</li>
                      <li>• <code className="text-green-400">catchr-extension-v1.1.0.zip</code> - New feature</li>
                      <li>• <code className="text-green-400">catchr-extension-v2.0.0.zip</code> - Major update</li>
                    </ul>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Testing Checklist Expanded */}
      <AnimatePresence>
        {showTestingChecklist && (
          <motion.div
            className="max-w-4xl mx-auto mt-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard variant="orange" className="p-8">
              <h2 className="text-2xl font-semibold mb-6">Complete Testing Checklist</h2>

              <div className="space-y-6">
                {/* Installation Tests */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Chrome className="w-5 h-5 text-orange-primary" />
                    Installation Tests
                  </h3>
                  <div className="bg-black/50 rounded-lg p-4">
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Extension downloads successfully from install page</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>ZIP file extracts without errors</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Extension loads in Chrome without manifest errors</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>All icons display correctly (16, 32, 48, 128px)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Extension appears in Chrome toolbar</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Popup Tests */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <ExternalLink className="w-5 h-5 text-orange-primary" />
                    Popup UI Tests
                  </h3>
                  <div className="bg-black/50 rounded-lg p-4">
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Popup opens when clicking extension icon</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Login state shows correctly (logged out initially)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>"Connect Account" button visible when not authenticated</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Popup styling matches Catchr brand (orange theme)</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Authentication Tests */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-orange-primary" />
                    Authentication Tests
                  </h3>
                  <div className="bg-black/50 rounded-lg p-4">
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>"Connect Extension" button on install page works</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Auth token transfers successfully via postMessage</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Token persists after browser restart</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Popup shows logged-in state with user email</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Logout button clears token and resets UI</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Voice Capture Tests */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Download className="w-5 h-5 text-orange-primary" />
                    Voice Capture Tests
                  </h3>
                  <div className="bg-black/50 rounded-lg p-4">
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Keyboard shortcut (Cmd/Ctrl+Shift+C) triggers capture modal</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Microphone permission requested on first use</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Recording starts within 50ms</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>5-second silence detection works</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Manual stop button works</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Audio visualizer shows recording activity</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* API Integration Tests */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Check className="w-5 h-5 text-orange-primary" />
                    API Integration Tests
                  </h3>
                  <div className="bg-black/50 rounded-lg p-4">
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Voice upload includes Authorization header with token</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Whisper transcription completes in under 2s</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>GPT-5-nano categorization completes in under 3s</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Note saves to correct user account (check user_id)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Note appears in main app immediately</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Database Tests */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-orange-primary" />
                    Database Persistence Tests
                  </h3>
                  <div className="bg-black/50 rounded-lg p-4">
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Notes save to Supabase `thoughts` table</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>RLS policies enforce user_id isolation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Folder assignment persists correctly</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Tags array saves correctly</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Created_at timestamp is accurate</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Performance Tests */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-primary" />
                    Performance Tests
                  </h3>
                  <div className="bg-black/50 rounded-lg p-4">
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Extension loads in under 100ms</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>No console errors or warnings</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Memory usage stays under 50MB</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>No network errors or failed requests</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>End-to-end flow (capture to save) under 8 seconds</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Cross-Browser Tests */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Chrome className="w-5 h-5 text-orange-primary" />
                    Browser Compatibility
                  </h3>
                  <div className="bg-black/50 rounded-lg p-4">
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Works in Chrome 100+</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Works in Edge 100+ (Chromium-based)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Works in Brave browser</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Manifest v3 compliant</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* User Experience Tests */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Check className="w-5 h-5 text-orange-primary" />
                    User Experience Tests
                  </h3>
                  <div className="bg-black/50 rounded-lg p-4">
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Success notifications appear after note save</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Error messages are clear and actionable</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Loading states show during processing</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Modal closes automatically after successful save</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Keyboard shortcuts documented in popup</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-400">
                  <strong>Success Criteria:</strong> All checkboxes must be checked before releasing extension to users.
                </p>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Tutorial */}
      <motion.div
        className="max-w-4xl mx-auto mt-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.9 }}
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
                  <h3 className="text-white font-semibold mb-2">Can't connect extension?</h3>
                  <p>Make sure you're logged into your Catchr account and the extension is installed and enabled</p>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">Connection not working?</h3>
                  <p>Try refreshing this page and clicking "Connect Extension" again. You can also click the extension icon and manually log in.</p>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">Voice capture not working?</h3>
                  <p>Check microphone permissions in Chrome settings (chrome://settings/content/microphone)</p>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">Notes not saving?</h3>
                  <p>Verify you're logged in and the extension has network access. Check browser console for errors.</p>
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
                  Your Catchr extension is now ready to use. Press{' '}
                  <kbd className="px-2 py-1 bg-orange-primary text-black rounded">Cmd+Shift+C</kbd>{' '}
                  anywhere to start capturing thoughts.
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
