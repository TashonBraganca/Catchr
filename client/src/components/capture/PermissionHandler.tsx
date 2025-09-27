import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  AlertTriangle, 
  CheckCircle, 
  Settings, 
  HelpCircle,
  RefreshCw,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type PermissionState = 
  | 'unknown'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'blocked'
  | 'not-supported';

interface PermissionHandlerProps {
  onPermissionChange?: (state: PermissionState) => void;
  showInline?: boolean;
  className?: string;
}

export const PermissionHandler: React.FC<PermissionHandlerProps> = ({
  onPermissionChange,
  showInline = false,
  className
}) => {
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');
  const [showHelp, setShowHelp] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Check initial permission state
  useEffect(() => {
    checkPermissionState();
  }, []);

  const checkPermissionState = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionState('not-supported');
      onPermissionChange?.('not-supported');
      return;
    }

    try {
      // Check if we can query permissions
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        
        switch (permission.state) {
          case 'granted':
            setPermissionState('granted');
            onPermissionChange?.('granted');
            break;
          case 'denied':
            setPermissionState('denied');
            onPermissionChange?.('denied');
            break;
          case 'prompt':
            setPermissionState('unknown');
            onPermissionChange?.('unknown');
            break;
        }

        // Listen for permission changes
        permission.addEventListener('change', () => {
          checkPermissionState();
        });
      } else {
        // Fallback for browsers that don't support permissions API
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          setPermissionState('granted');
          onPermissionChange?.('granted');
        } catch (error) {
          setPermissionState('unknown');
          onPermissionChange?.('unknown');
        }
      }
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      setPermissionState('unknown');
      onPermissionChange?.('unknown');
    }
  };

  const requestPermission = async () => {
    setIsChecking(true);
    setPermissionState('requesting');
    onPermissionChange?.('requesting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });
      
      // Permission granted - stop the stream
      stream.getTracks().forEach(track => track.stop());
      setPermissionState('granted');
      onPermissionChange?.('granted');
      
    } catch (error: any) {
      console.error('Permission request failed:', error);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermissionState('denied');
        onPermissionChange?.('denied');
      } else if (error.name === 'NotFoundError') {
        setPermissionState('not-supported');
        onPermissionChange?.('not-supported');
      } else {
        setPermissionState('blocked');
        onPermissionChange?.('blocked');
      }
    } finally {
      setIsChecking(false);
    }
  };

  const openBrowserSettings = () => {
    // This will just show instructions since we can't directly open browser settings
    setShowHelp(true);
  };

  const getPermissionIcon = () => {
    switch (permissionState) {
      case 'granted':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'denied':
      case 'blocked':
        return <MicOff className="w-5 h-5 text-red-400" />;
      case 'not-supported':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'requesting':
        return <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />;
      default:
        return <Mic className="w-5 h-5 text-white/60" />;
    }
  };

  const getPermissionMessage = () => {
    switch (permissionState) {
      case 'granted':
        return {
          title: 'Microphone Access Granted',
          message: 'You can now use voice recording to capture your thoughts.',
          action: null,
        };
      case 'denied':
        return {
          title: 'Microphone Access Denied',
          message: 'Voice recording is not available. You can still capture thoughts by typing.',
          action: 'Allow microphone access in your browser settings to use voice features.',
        };
      case 'blocked':
        return {
          title: 'Microphone Blocked',
          message: 'Microphone access has been blocked. Please update your browser settings.',
          action: 'Check your browser\'s microphone settings and refresh the page.',
        };
      case 'not-supported':
        return {
          title: 'Voice Recording Not Supported',
          message: 'Your browser doesn\'t support voice recording. Please use a modern browser like Chrome, Edge, or Safari.',
          action: null,
        };
      case 'requesting':
        return {
          title: 'Requesting Microphone Access',
          message: 'Please allow microphone access to use voice recording features.',
          action: null,
        };
      default:
        return {
          title: 'Enable Voice Recording',
          message: 'Allow microphone access to capture thoughts with your voice.',
          action: 'Click below to enable microphone access.',
        };
    }
  };

  const permissionInfo = getPermissionMessage();

  if (showInline) {
    return (
      <div className={cn("flex items-center space-x-2 text-sm", className)}>
        {getPermissionIcon()}
        <span className={cn(
          "text-white/80",
          permissionState === 'granted' && "text-green-400",
          permissionState === 'denied' && "text-red-400",
          permissionState === 'not-supported' && "text-yellow-400"
        )}>
          {permissionInfo.title}
        </span>
        {(permissionState === 'denied' || permissionState === 'blocked') && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={openBrowserSettings}
            className="text-white/60 hover:text-white/80"
          >
            <Settings className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        className={cn("space-y-4", className)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card variant="glass" className="p-6 space-y-4">
          <div className="flex items-center space-x-3">
            {getPermissionIcon()}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">
                {permissionInfo.title}
              </h3>
              <p className="text-white/70 text-sm mt-1">
                {permissionInfo.message}
              </p>
            </div>
          </div>

          {permissionInfo.action && (
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-white/60 text-sm">
                {permissionInfo.action}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHelp(!showHelp)}
              leftIcon={<HelpCircle className="w-4 h-4" />}
              className="text-white/60 hover:text-white/80"
            >
              Help
            </Button>

            <div className="flex space-x-2">
              {permissionState === 'unknown' && (
                <Button
                  variant="orange"
                  size="sm"
                  onClick={requestPermission}
                  disabled={isChecking}
                  leftIcon={<Mic className="w-4 h-4" />}
                >
                  {isChecking ? 'Requesting...' : 'Allow Microphone'}
                </Button>
              )}

              {(permissionState === 'denied' || permissionState === 'blocked') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkPermissionState}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  Check Again
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Help Section */}
        <AnimatePresence>
          {showHelp && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card variant="glass-strong" className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-white">Microphone Permission Help</h4>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowHelp(false)}
                    className="text-white/60 hover:text-white/80"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>

                <div className="space-y-2 text-xs text-white/70">
                  <div>
                    <strong className="text-white/90">Chrome/Edge:</strong>
                    <p>Click the camera/microphone icon in the address bar, then select "Allow"</p>
                  </div>
                  
                  <div>
                    <strong className="text-white/90">Firefox:</strong>
                    <p>Click the shield icon, then "Allow" for microphone access</p>
                  </div>
                  
                  <div>
                    <strong className="text-white/90">Safari:</strong>
                    <p>Check Safari → Preferences → Websites → Microphone</p>
                  </div>

                  <div className="pt-2 border-t border-white/10">
                    <p className="text-white/60">
                      You may need to refresh the page after changing permission settings.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default PermissionHandler;