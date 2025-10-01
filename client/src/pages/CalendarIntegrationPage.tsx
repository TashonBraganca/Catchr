/**
 * GOOGLE CALENDAR INTEGRATION PAGE
 *
 * Connect Google Calendar for automatic event creation
 * "Meeting with Sarah tomorrow at 3pm" → Calendar event created
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Check, ExternalLink, Zap, AlertCircle } from 'lucide-react';
import { GlassCard } from '@/components/glass';
import { Button } from '@/components/ui/button';

export const CalendarIntegrationPage: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authUrl, setAuthUrl] = useState<string | null>(null);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/calendar/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      const data = await response.json();
      setIsConnected(data.connected);
    } catch (error) {
      console.error('Failed to check calendar status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const response = await fetch('/api/calendar/auth-url', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      const data = await response.json();
      setAuthUrl(data.authUrl);

      // Open OAuth consent in new window
      window.open(data.authUrl, '_blank', 'width=600,height=700');

      // Poll for connection status
      const pollInterval = setInterval(async () => {
        const statusResponse = await fetch('/api/calendar/status', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        const statusData = await statusResponse.json();
        if (statusData.connected) {
          setIsConnected(true);
          clearInterval(pollInterval);
        }
      }, 2000);

      // Stop polling after 2 minutes
      setTimeout(() => clearInterval(pollInterval), 120000);

    } catch (error) {
      console.error('Failed to initiate calendar connection:', error);
    }
  };

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Natural Language Events',
      description: 'Say "Meeting with Sarah tomorrow at 3pm" and it\'s on your calendar',
    },
    {
      icon: <Check className="w-6 h-6" />,
      title: 'Automatic Creation',
      description: 'GPT-5 detects events in your thoughts and creates them instantly',
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: 'Bi-Directional Sync',
      description: 'Changes in Catchr update your calendar, and vice versa',
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-orange-primary">Loading...</div>
      </div>
    );
  }

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
          📅 Google Calendar
        </h1>
        <p className="text-lg text-gray-400">
          Automatically create calendar events from your thoughts
        </p>
      </motion.div>

      {/* Connection Status */}
      <motion.div
        className="max-w-4xl mx-auto mb-12"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <GlassCard variant={isConnected ? "orange" : "glass"} className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                isConnected ? 'bg-green-500' : 'bg-orange-primary'
              }`}>
                {isConnected ? (
                  <Check className="w-8 h-8 text-white" />
                ) : (
                  <Calendar className="w-8 h-8 text-black" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-2">
                  {isConnected ? 'Connected!' : 'Not Connected'}
                </h2>
                <p className="text-gray-300">
                  {isConnected
                    ? 'Your Google Calendar is synced with Catchr'
                    : 'Connect your Google Calendar to enable automatic event creation'
                  }
                </p>
              </div>
            </div>
            {!isConnected && (
              <Button
                variant="primary"
                size="lg"
                onClick={handleConnect}
                className="flex items-center space-x-2"
              >
                <ExternalLink className="w-5 h-5" />
                <span>Connect Calendar</span>
              </Button>
            )}
          </div>
        </GlassCard>
      </motion.div>

      {/* Features */}
      <div className="max-w-4xl mx-auto mb-12">
        <h3 className="text-2xl font-semibold mb-6">What You Can Do</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
            >
              <GlassCard variant="glass" className="p-6 h-full">
                <div className="text-orange-primary mb-4">{feature.icon}</div>
                <h4 className="text-lg font-semibold mb-2">{feature.title}</h4>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Examples */}
      <motion.div
        className="max-w-4xl mx-auto mb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <GlassCard variant="glass" className="p-8">
          <h3 className="text-2xl font-semibold mb-6">Example Thoughts</h3>
          <div className="space-y-4">
            {[
              {
                thought: '"Remind me to call Sarah tomorrow at 3pm about the project"',
                result: 'Creates: "Call Sarah about the project" on tomorrow at 3pm',
              },
              {
                thought: '"Team standup every Monday at 10am starting next week"',
                result: 'Creates: Recurring "Team standup" every Monday at 10am',
              },
              {
                thought: '"Dentist appointment next Friday at 2pm"',
                result: 'Creates: "Dentist appointment" next Friday at 2pm with reminder',
              },
            ].map((example, index) => (
              <div
                key={index}
                className="p-4 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="font-mono text-sm text-orange-primary mb-2">
                  {example.thought}
                </div>
                <div className="text-sm text-gray-400 flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>{example.result}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* Privacy Note */}
      <motion.div
        className="max-w-4xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        <GlassCard variant="glass" className="p-6">
          <div className="flex items-start space-x-4">
            <AlertCircle className="w-6 h-6 text-orange-primary flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-lg font-semibold mb-2">Privacy & Security</h4>
              <div className="text-gray-400 text-sm space-y-2">
                <p>
                  • Your calendar data is never stored on our servers
                </p>
                <p>
                  • All communication is encrypted end-to-end
                </p>
                <p>
                  • You can revoke access anytime from Google Account settings
                </p>
                <p>
                  • We only request minimal permissions needed for event creation
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default CalendarIntegrationPage;
