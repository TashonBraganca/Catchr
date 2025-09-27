import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  User,
  MessageSquare,
  Mic,
  Database,
  Activity,
  Code
} from 'lucide-react';
import { GlassButton, GlassCard, GlassInput } from '@/components/glass';
import apiClient from '@/services/apiClient';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  endpoint: string;
  method: string;
  response?: any;
  error?: string;
  duration?: number;
}

const ApiTestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [runningTest, setRunningTest] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string>('');

  // Test configurations
  const testConfigs: Omit<TestResult, 'status' | 'response' | 'error' | 'duration'>[] = [
    // Health & Testing
    { id: 'health', name: 'Health Check', endpoint: '/health', method: 'GET' },
    { id: 'api-test', name: 'API Test Endpoint', endpoint: '/api/test', method: 'GET' },

    // Authentication
    { id: 'register', name: 'User Registration', endpoint: '/api/auth/register', method: 'POST' },
    { id: 'login', name: 'User Login', endpoint: '/api/auth/login', method: 'POST' },
    { id: 'refresh', name: 'Refresh Token', endpoint: '/api/auth/refresh', method: 'POST' },
    { id: 'me', name: 'Get Current User', endpoint: '/api/auth/me', method: 'GET' },

    // Capture
    { id: 'create-capture', name: 'Create Capture', endpoint: '/api/capture', method: 'POST' },
    { id: 'get-captures', name: 'Get Captures', endpoint: '/api/capture', method: 'GET' },
    { id: 'queue-status', name: 'Queue Status', endpoint: '/api/capture/queue/status', method: 'GET' },

    // Transcription
    { id: 'transcribe', name: 'Transcribe Audio', endpoint: '/api/capture/transcribe', method: 'POST' },

    // Rooms
    { id: 'get-rooms', name: 'Get Rooms', endpoint: '/api/rooms', method: 'GET' },
    { id: 'create-room', name: 'Create Room', endpoint: '/api/rooms', method: 'POST' },
  ];

  useEffect(() => {
    // Initialize test results
    setTestResults(testConfigs.map(config => ({ ...config, status: 'pending' })));
  }, []);

  const runTest = async (testId: string) => {
    if (runningTest) return;

    setRunningTest(testId);
    const startTime = Date.now();

    setTestResults(prev =>
      prev.map(result =>
        result.id === testId ? { ...result, status: 'running' } : result
      )
    );

    try {
      let response;
      let error;

      // Set auth token if provided
      if (authToken) {
        apiClient.setAuthToken(authToken);
      }

      switch (testId) {
        case 'health':
          response = await apiClient.healthCheck();
          break;
        case 'api-test':
          response = await apiClient.getApiTest();
          break;
        case 'register':
          response = await apiClient.register({
            username: 'testuser',
            email: 'test@example.com',
            password: 'testpassword123'
          });
          break;
        case 'login':
          response = await apiClient.login({
            email: 'test@example.com',
            password: 'testpassword123'
          });
          break;
        case 'refresh':
          response = await apiClient.refreshToken('mock-refresh-token');
          break;
        case 'me':
          response = await apiClient.getCurrentUser();
          break;
        case 'create-capture':
          response = await apiClient.createCapture({
            content: 'This is a test thought for API testing',
            type: 'note',
            tags: ['test', 'api']
          });
          break;
        case 'get-captures':
          response = await apiClient.getCaptures({ limit: 10 });
          break;
        case 'queue-status':
          response = await apiClient.getQueueStatus();
          break;
        case 'transcribe':
          response = await apiClient.transcribeAudio({
            audio_data: 'mock-audio-data-base64',
            content_type: 'audio/webm'
          });
          break;
        case 'get-rooms':
          response = await apiClient.getRooms();
          break;
        case 'create-room':
          response = await apiClient.createRoom({
            name: 'Test Room',
            creatorId: 'test-user-123'
          });
          break;
        default:
          throw new Error('Unknown test');
      }

      const duration = Date.now() - startTime;
      const status = response.error ? 'error' : 'success';

      setTestResults(prev =>
        prev.map(result =>
          result.id === testId
            ? { ...result, status, response, error: response.error, duration }
            : result
        )
      );
    } catch (err) {
      const duration = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      setTestResults(prev =>
        prev.map(result =>
          result.id === testId
            ? { ...result, status: 'error', error: errorMessage, duration }
            : result
        )
      );
    } finally {
      setRunningTest(null);
    }
  };

  const runAllTests = async () => {
    for (const test of testConfigs) {
      await runTest(test.id);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'running':
        return <Clock className="w-5 h-5 text-orange-primary animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-white/40" />;
    }
  };

  const getCategoryIcon = (endpoint: string) => {
    if (endpoint.includes('/auth')) return <User className="w-4 h-4" />;
    if (endpoint.includes('/capture')) return <Database className="w-4 h-4" />;
    if (endpoint.includes('/transcription')) return <Mic className="w-4 h-4" />;
    if (endpoint.includes('/rooms')) return <MessageSquare className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const handleGoBack = () => {
    window.history.back();
  };

  const successCount = testResults.filter(t => t.status === 'success').length;
  const errorCount = testResults.filter(t => t.status === 'error').length;
  const totalCount = testResults.length;

  return (
    <div className="min-h-screen bg-background-primary p-4 sm:p-6 font-primary">
      <div className="max-w-6xl mx-auto">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <GlassButton
            variant="light"
            size="sm"
            onClick={handleGoBack}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </GlassButton>
          <div className="text-right">
            <div className="text-xs text-text-tertiary">
              {successCount} success • {errorCount} errors • {totalCount} total
            </div>
          </div>
        </div>

        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-text-primary mb-4 text-text-orange-glow">
            🔧 API Testing Dashboard
          </h1>
          <p className="text-text-secondary text-lg mb-6">
            Test all Cathcr API endpoints and verify functionality
          </p>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <GlassInput
              placeholder="Auth Token (optional)"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              className="max-w-md"
              variant="primary"
            />
            <div className="flex gap-3">
              <GlassButton
                variant="premium"
                onClick={runAllTests}
                disabled={!!runningTest}
                leftIcon={<Play className="w-4 h-4" />}
              >
                Run All Tests
              </GlassButton>
            </div>
          </div>
        </motion.div>

        {/* API Status Overview */}
        <GlassCard variant="premium" className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-text-primary">API Server Status</h2>
            <div className="flex items-center space-x-2 text-emerald-400">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-sm">Connected to localhost:5002</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-glass-orange-10 rounded-lg">
              <div className="text-2xl font-bold text-emerald-400">{successCount}</div>
              <div className="text-sm text-text-secondary">Successful</div>
            </div>
            <div className="text-center p-4 bg-glass-orange-10 rounded-lg">
              <div className="text-2xl font-bold text-red-400">{errorCount}</div>
              <div className="text-sm text-text-secondary">Failed</div>
            </div>
            <div className="text-center p-4 bg-glass-orange-10 rounded-lg">
              <div className="text-2xl font-bold text-orange-primary">{totalCount}</div>
              <div className="text-sm text-text-secondary">Total Tests</div>
            </div>
          </div>
        </GlassCard>

        {/* Test Results */}
        <div className="grid gap-4">
          {testResults.map((test, index) => (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard variant="medium">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 text-text-orange-bright">
                      {getCategoryIcon(test.endpoint)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">{test.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-text-secondary">
                        <span className="px-2 py-1 bg-glass-orange-20 rounded text-xs font-mono">
                          {test.method}
                        </span>
                        <span className="font-mono">{test.endpoint}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {test.duration && (
                      <span className="text-xs text-text-tertiary">{test.duration}ms</span>
                    )}
                    {getStatusIcon(test.status)}
                    <GlassButton
                      size="sm"
                      variant="minimal"
                      onClick={() => runTest(test.id)}
                      disabled={runningTest === test.id}
                      leftIcon={<Play className="w-3 h-3" />}
                    >
                      {runningTest === test.id ? 'Running...' : 'Test'}
                    </GlassButton>
                  </div>
                </div>

                {/* Response Display */}
                {(test.response || test.error) && (
                  <div className="mt-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Code className="w-4 h-4 text-text-orange-bright" />
                      <span className="text-sm font-semibold text-text-orange-bright">
                        {test.status === 'error' ? 'Error' : 'Response'}
                      </span>
                    </div>
                    <div className="bg-background-secondary rounded-lg p-3 overflow-auto max-h-48">
                      <pre className="text-xs text-text-primary font-mono">
                        {test.error ? test.error : JSON.stringify(test.response, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Instructions */}
        <GlassCard variant="minimal" className="mt-8 border-border-glass-light">
          <h3 className="text-lg font-bold text-text-primary mb-4">📖 How to Use</h3>
          <div className="space-y-2 text-sm text-text-secondary">
            <p>• Click individual "Test" buttons to test specific endpoints</p>
            <p>• Use "Run All Tests" to test all endpoints sequentially</p>
            <p>• Add an auth token in the input field to test authenticated endpoints</p>
            <p>• Green checkmarks indicate successful responses</p>
            <p>• Red X marks indicate errors or failed requests</p>
            <p>• Response data is displayed below each test for inspection</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default ApiTestPage;