import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Clock,
  Brain,
  Star,
  X,
  Settings,
  Volume2,
  VolumeX,
  Smartphone,
  Mail,
  MessageSquare,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Pause,
  Play,
  Filter,
  Trash2,
  Eye,
  EyeOff,
  Zap,
  Target
} from 'lucide-react';

import { GlassCard, GlassButton } from '@/components/glass';
import { cn } from '@/lib/utils';

// SMART NOTIFICATIONS Component
// Context-aware intelligent reminder and notification system

interface SmartNotification {
  id: string;
  type: 'reminder' | 'suggestion' | 'insight' | 'pattern' | 'urgent';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  createdAt: Date;
  scheduledFor?: Date;
  deliveredAt?: Date;
  context: {
    triggerEvent: string;
    userState: 'focused' | 'available' | 'busy' | 'creative' | 'break';
    location?: 'home' | 'office' | 'mobile' | 'other';
    timeOptimization: boolean;
    emotionalContext?: 'productive' | 'stressed' | 'inspired' | 'tired';
  };
  delivery: {
    method: 'push' | 'email' | 'sms' | 'in_app' | 'all';
    sound: boolean;
    vibration?: boolean;
    persistent: boolean;
  };
  actions?: Array<{
    label: string;
    action: string;
    primary?: boolean;
  }>;
  metadata?: {
    relatedThoughtId?: string;
    suggestionId?: string;
    confidence?: number;
    smartDelay?: number; // AI-calculated optimal delay in minutes
  };
}

interface NotificationSettings {
  enabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  delivery: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  contextAware: boolean;
  smartTiming: boolean;
  priorityFilter: 'all' | 'medium' | 'high' | 'urgent';
  categories: {
    reminders: boolean;
    suggestions: boolean;
    insights: boolean;
    patterns: boolean;
    urgent: boolean;
  };
}

interface SmartNotificationsProps {
  className?: string;
  userId?: string;
  maxNotifications?: number;
  showSettings?: boolean;
}

export const SmartNotifications: React.FC<SmartNotificationsProps> = ({
  className,
  userId,
  maxNotifications = 50,
  showSettings = true
}) => {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '08:00'
    },
    delivery: {
      push: true,
      email: false,
      sms: false
    },
    contextAware: true,
    smartTiming: true,
    priorityFilter: 'medium',
    categories: {
      reminders: true,
      suggestions: true,
      insights: true,
      patterns: false,
      urgent: true
    }
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'scheduled'>('all');
  const [isPaused, setIsPaused] = useState(false);

  // Enhanced mock notifications with smart context
  const generateMockNotifications = (): SmartNotification[] => [
    {
      id: '1',
      type: 'reminder',
      priority: 'high',
      title: 'Peak Creative Window Starting',
      message: 'Your optimal creative period (9:15 AM) is beginning. Perfect time for breakthrough thinking on your AI-UX convergence ideas.',
      createdAt: new Date(Date.now() - 300000), // 5 minutes ago
      scheduledFor: new Date(Date.now() + 900000), // 15 minutes from now
      context: {
        triggerEvent: 'Time-based pattern optimization',
        userState: 'focused',
        location: 'office',
        timeOptimization: true,
        emotionalContext: 'productive'
      },
      delivery: {
        method: 'in_app',
        sound: true,
        persistent: true
      },
      actions: [
        { label: 'Start Session', action: 'start_creative_session', primary: true },
        { label: 'Snooze 15m', action: 'snooze_15' },
        { label: 'Dismiss', action: 'dismiss' }
      ],
      metadata: {
        confidence: 0.94,
        smartDelay: 0 // Immediate delivery optimized
      }
    },
    {
      id: '2',
      type: 'suggestion',
      priority: 'medium',
      title: 'Follow-up Opportunity Detected',
      message: 'The design team responded to your glass component discussion. 87% confidence this needs your attention today.',
      createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
      context: {
        triggerEvent: 'Team interaction pattern + pending task',
        userState: 'available',
        location: 'office',
        timeOptimization: true
      },
      delivery: {
        method: 'push',
        sound: false,
        persistent: false
      },
      actions: [
        { label: 'View Discussion', action: 'open_discussion', primary: true },
        { label: 'Schedule Review', action: 'schedule_review' },
        { label: 'Mark Done', action: 'mark_complete' }
      ],
      metadata: {
        relatedThoughtId: 'thought-design-system',
        confidence: 0.87,
        smartDelay: 15 // Delayed for optimal attention
      }
    },
    {
      id: '3',
      type: 'insight',
      priority: 'medium',
      title: 'Pattern Convergence Alert',
      message: 'Your AI and UX thoughts are showing 89% similarity. This convergence pattern historically leads to breakthrough innovations.',
      createdAt: new Date(Date.now() - 3600000), // 1 hour ago
      deliveredAt: new Date(Date.now() - 3000000), // 50 minutes ago
      context: {
        triggerEvent: 'Semantic analysis threshold exceeded',
        userState: 'creative',
        timeOptimization: false,
        emotionalContext: 'inspired'
      },
      delivery: {
        method: 'in_app',
        sound: true,
        persistent: true
      },
      actions: [
        { label: 'Explore Pattern', action: 'view_pattern', primary: true },
        { label: 'Create Connection', action: 'create_connection' }
      ],
      metadata: {
        confidence: 0.89,
        smartDelay: 10
      }
    },
    {
      id: '4',
      type: 'urgent',
      priority: 'urgent',
      title: 'Energy Dip Prevention',
      message: 'Your afternoon productivity typically drops in 20 minutes. Consider a 5-minute break now to maintain peak performance.',
      createdAt: new Date(Date.now() - 120000), // 2 minutes ago
      context: {
        triggerEvent: 'Predictive energy management',
        userState: 'focused',
        timeOptimization: true,
        emotionalContext: 'productive'
      },
      delivery: {
        method: 'all',
        sound: true,
        vibration: true,
        persistent: true
      },
      actions: [
        { label: 'Take Break', action: 'start_break', primary: true },
        { label: 'Power Through', action: 'continue_work' },
        { label: 'Reschedule', action: 'reschedule_work' }
      ],
      metadata: {
        confidence: 0.91,
        smartDelay: 0 // Immediate for health optimization
      }
    },
    {
      id: '5',
      type: 'pattern',
      priority: 'low',
      title: 'Weekend Innovation Window',
      message: 'Saturday morning sessions have produced 78% of your highest-rated ideas. Consider blocking time this weekend.',
      createdAt: new Date(Date.now() - 7200000), // 2 hours ago
      scheduledFor: new Date(Date.now() + 172800000), // 2 days from now (Friday)
      context: {
        triggerEvent: 'Weekly pattern optimization',
        userState: 'available',
        timeOptimization: true
      },
      delivery: {
        method: 'email',
        sound: false,
        persistent: false
      },
      actions: [
        { label: 'Block Calendar', action: 'block_weekend_time', primary: true },
        { label: 'View Pattern', action: 'view_weekend_pattern' }
      ],
      metadata: {
        confidence: 0.78,
        smartDelay: 60 // Delayed for non-urgent planning
      }
    }
  ];

  useEffect(() => {
    loadNotifications();

    // Simulate real-time notifications
    const interval = setInterval(() => {
      if (!isPaused && settings.enabled) {
        maybeGenerateNotification();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isPaused, settings.enabled]);

  const loadNotifications = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/cognitive/notifications?userId=${userId}&limit=${maxNotifications}`);

      const mockNotifications = generateMockNotifications();
      setNotifications(mockNotifications.slice(0, maxNotifications));
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const maybeGenerateNotification = () => {
    // Simulate smart notification generation based on context
    if (Math.random() < 0.1) { // 10% chance every 30 seconds
      const newNotification: SmartNotification = {
        id: Date.now().toString(),
        type: 'suggestion',
        priority: 'medium',
        title: 'Real-time Context Suggestion',
        message: 'Based on your current activity, consider exploring this related concept.',
        createdAt: new Date(),
        context: {
          triggerEvent: 'Real-time activity analysis',
          userState: 'focused',
          timeOptimization: true
        },
        delivery: {
          method: 'in_app',
          sound: false,
          persistent: false
        },
        metadata: {
          confidence: 0.75,
          smartDelay: 0
        }
      };

      setNotifications(prev => [newNotification, ...prev.slice(0, maxNotifications - 1)]);
    }
  };

  const handleNotificationAction = async (notificationId: string, action: string) => {
    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/cognitive/notifications/${notificationId}/action`, {
      //   method: 'POST',
      //   body: JSON.stringify({ action })
      // });

      // Handle different actions
      switch (action) {
        case 'dismiss':
        case 'mark_complete':
          setNotifications(prev => prev.filter(n => n.id !== notificationId));
          break;
        case 'snooze_15':
          setNotifications(prev => prev.map(n =>
            n.id === notificationId
              ? { ...n, scheduledFor: new Date(Date.now() + 900000) }
              : n
          ));
          break;
        default:
          console.log(`Action ${action} for notification ${notificationId}`);
      }
    } catch (error) {
      console.error('Failed to handle notification action:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      // TODO: Replace with actual API call
      // await fetch('/api/cognitive/notifications/settings', {
      //   method: 'PUT',
      //   body: JSON.stringify(newSettings)
      // });

      setSettings(prev => ({ ...prev, ...newSettings }));
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-400/20 border-red-400/30';
      case 'high': return 'text-orange-400 bg-orange-400/20 border-orange-400/30';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
      case 'low': return 'text-emerald-400 bg-emerald-400/20 border-emerald-400/30';
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reminder': return <Clock className="h-5 w-5" />;
      case 'suggestion': return <Brain className="h-5 w-5" />;
      case 'insight': return <Star className="h-5 w-5" />;
      case 'pattern': return <Target className="h-5 w-5" />;
      case 'urgent': return <AlertCircle className="h-5 w-5" />;
      default: return <Bell className="h-5 w-5" />;
    }
  };

  const getDeliveryIcon = (method: string) => {
    switch (method) {
      case 'push': return <Smartphone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'in_app': return <Bell className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread' && notification.deliveredAt) return false;
    if (filter === 'scheduled' && !notification.scheduledFor) return false;
    return true;
  });

  const SettingsModal = () => (
    <AnimatePresence>
      {showSettingsModal && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowSettingsModal(false)}
        >
          <motion.div
            className="bg-black/90 border border-white/20 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Notification Settings</h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-white/50 hover:text-white/80"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Master Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                <div>
                  <h3 className="text-white font-medium">Enable Smart Notifications</h3>
                  <p className="text-white/60 text-sm">AI-powered context-aware notifications</p>
                </div>
                <button
                  onClick={() => updateSettings({ enabled: !settings.enabled })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors",
                    settings.enabled ? "bg-orange-500" : "bg-white/20"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full bg-white transition-transform",
                    settings.enabled ? "translate-x-7" : "translate-x-0.5"
                  )} />
                </button>
              </div>

              {/* Delivery Methods */}
              <div>
                <h3 className="text-white font-medium mb-3">Delivery Methods</h3>
                <div className="space-y-3">
                  {Object.entries(settings.delivery).map(([method, enabled]) => (
                    <div key={method} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getDeliveryIcon(method)}
                        <span className="text-white/80 capitalize">{method.replace('_', ' ')}</span>
                      </div>
                      <button
                        onClick={() => updateSettings({
                          delivery: { ...settings.delivery, [method]: !enabled }
                        })}
                        className={cn(
                          "w-10 h-5 rounded-full transition-colors",
                          enabled ? "bg-orange-500" : "bg-white/20"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded-full bg-white transition-transform",
                          enabled ? "translate-x-5" : "translate-x-0.5"
                        )} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-white font-medium mb-3">Notification Categories</h3>
                <div className="space-y-3">
                  {Object.entries(settings.categories).map(([category, enabled]) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getTypeIcon(category)}
                        <span className="text-white/80 capitalize">{category}</span>
                      </div>
                      <button
                        onClick={() => updateSettings({
                          categories: { ...settings.categories, [category]: !enabled }
                        })}
                        className={cn(
                          "w-10 h-5 rounded-full transition-colors",
                          enabled ? "bg-orange-500" : "bg-white/20"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded-full bg-white transition-transform",
                          enabled ? "translate-x-5" : "translate-x-0.5"
                        )} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advanced Settings */}
              <div>
                <h3 className="text-white font-medium mb-3">Advanced Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-white/80">Context-Aware Timing</span>
                      <p className="text-white/50 text-xs">AI optimizes delivery timing</p>
                    </div>
                    <button
                      onClick={() => updateSettings({ contextAware: !settings.contextAware })}
                      className={cn(
                        "w-10 h-5 rounded-full transition-colors",
                        settings.contextAware ? "bg-orange-500" : "bg-white/20"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full bg-white transition-transform",
                        settings.contextAware ? "translate-x-5" : "translate-x-0.5"
                      )} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-white/80">Smart Timing</span>
                      <p className="text-white/50 text-xs">Delay notifications for optimal attention</p>
                    </div>
                    <button
                      onClick={() => updateSettings({ smartTiming: !settings.smartTiming })}
                      className={cn(
                        "w-10 h-5 rounded-full transition-colors",
                        settings.smartTiming ? "bg-orange-500" : "bg-white/20"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full bg-white transition-transform",
                        settings.smartTiming ? "translate-x-5" : "translate-x-0.5"
                      )} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">Smart Notifications</h3>
          <p className="text-white/60 text-sm">
            Context-aware reminders • {filteredNotifications.length} active notifications
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <GlassButton
            variant="subtle"
            size="sm"
            leftIcon={isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </GlassButton>
          {showSettings && (
            <GlassButton
              variant="subtle"
              size="sm"
              leftIcon={<Settings className="h-4 w-4" />}
              onClick={() => setShowSettingsModal(true)}
            >
              Settings
            </GlassButton>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-4 border-b border-white/10">
        {[
          { id: 'all', label: 'All', count: notifications.length },
          { id: 'unread', label: 'Unread', count: notifications.filter(n => !n.deliveredAt).length },
          { id: 'scheduled', label: 'Scheduled', count: notifications.filter(n => n.scheduledFor).length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={cn(
              'flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors border-b-2',
              filter === tab.id
                ? 'text-orange-400 border-orange-400'
                : 'text-white/60 border-transparent hover:text-white/80'
            )}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className="bg-orange-400/20 text-orange-300 text-xs px-2 py-1 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredNotifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -300, scale: 0.95 }}
              transition={{
                duration: 0.3,
                delay: index * 0.05,
                exit: { duration: 0.2 }
              }}
              layout
            >
              <GlassCard
                variant="orange"
                className={cn(
                  "p-6 hover:bg-orange-500/5 transition-colors",
                  !notification.deliveredAt && "border-orange-400/50"
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", getPriorityColor(notification.priority))}>
                      {getTypeIcon(notification.type)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs px-2 py-1 bg-orange-400/20 text-orange-300 rounded-lg uppercase font-medium">
                          {notification.type}
                        </span>
                        <span className={cn("text-xs px-2 py-1 rounded-lg uppercase font-medium border", getPriorityColor(notification.priority))}>
                          {notification.priority}
                        </span>
                        {!notification.deliveredAt && (
                          <span className="text-xs px-2 py-1 bg-blue-400/20 text-blue-300 rounded-lg border border-blue-400/30">
                            Unread
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-white/50">
                        <span>Created: {notification.createdAt.toLocaleTimeString()}</span>
                        {notification.scheduledFor && (
                          <span>Scheduled: {notification.scheduledFor.toLocaleTimeString()}</span>
                        )}
                        {notification.metadata?.confidence && (
                          <span>Confidence: <span className="text-emerald-400">{Math.round(notification.metadata.confidence * 100)}%</span></span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getDeliveryIcon(notification.delivery.method)}
                    {notification.delivery.sound ? (
                      <Volume2 className="h-4 w-4 text-orange-400" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-white/40" />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-white mb-2">{notification.title}</h4>
                  <p className="text-white/70 text-sm leading-relaxed">{notification.message}</p>
                </div>

                {/* Context */}
                <div className="bg-white/5 rounded-lg p-3 mb-4">
                  <div className="text-xs text-orange-400 font-medium mb-2 uppercase tracking-wide">Smart Context</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-white/70">
                      <span className="text-orange-300">Trigger:</span> {notification.context.triggerEvent}
                    </div>
                    <div className="text-white/70">
                      <span className="text-blue-300">State:</span> {notification.context.userState}
                    </div>
                    {notification.context.location && (
                      <div className="text-white/70">
                        <span className="text-purple-300">Location:</span> {notification.context.location}
                      </div>
                    )}
                    {notification.context.emotionalContext && (
                      <div className="text-white/70">
                        <span className="text-emerald-300">Mood:</span> {notification.context.emotionalContext}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {notification.actions && (
                  <div className="flex items-center space-x-3">
                    {notification.actions.map((action, idx) => (
                      <GlassButton
                        key={idx}
                        variant={action.primary ? "orange" : "subtle"}
                        size="sm"
                        onClick={() => handleNotificationAction(notification.id, action.action)}
                      >
                        {action.label}
                      </GlassButton>
                    ))}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {filteredNotifications.length === 0 && (
          <div className="text-center py-16">
            <Bell className="h-16 w-16 text-orange-400/30 mx-auto mb-6" />
            <h3 className="text-lg font-medium text-white/70 mb-3">
              {filter === 'all' ? 'No Notifications' :
               filter === 'unread' ? 'All Caught Up!' :
               'No Scheduled Notifications'}
            </h3>
            <p className="text-white/50 text-sm max-w-md mx-auto">
              {filter === 'all' ?
                'Smart notifications will appear here based on your thinking patterns and context.' :
                filter === 'unread' ?
                'You\'ve read all your notifications. Smart suggestions will appear as you work.' :
                'No notifications are currently scheduled for future delivery.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal />
    </div>
  );
};

export default SmartNotifications;