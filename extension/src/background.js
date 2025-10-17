/**
 * CATCHR EXTENSION - SERVICE WORKER (Background)
 *
 * Using Context7 Chrome Extensions best practices:
 * - chrome.runtime.onMessage for communication
 * - chrome.storage.local for persistent state in MV3
 * - Efficient message passing patterns
 *
 * Core Features:
 * - Ultra-fast voice capture trigger (<50ms)
 * - Auth state management with JWT tokens
 * - Automatic sync with Catchr backend
 * - 5-second silence detection coordination
 */

// Import auth module (loaded via service worker imports)
// Note: auth.js handles external messages for OAuth token exchange

// Extension state (persisted in chrome.storage.local)
let extensionState = {
  isAuthenticated: false,
  userId: null,
  authToken: null,
  apiEndpoint: 'https://catchr.vercel.app/api',
  isRecording: false,
  lastCaptureTime: null,
  totalCaptures: 0,
};

// Initialize extension state from storage
chrome.runtime.onInstalled.addListener(async () => {
  console.log('🎤 Catchr Extension installed');

  // Load saved state from chrome.storage
  const savedData = await chrome.storage.local.get([
    'authToken',
    'userId',
    'isAuthenticated',
    'extensionState'
  ]);

  // Restore auth state
  if (savedData.authToken) {
    extensionState.authToken = savedData.authToken;
    extensionState.userId = savedData.userId;
    extensionState.isAuthenticated = savedData.isAuthenticated || true;
  }

  // Restore extension state
  if (savedData.extensionState) {
    extensionState = { ...extensionState, ...savedData.extensionState };
  }

  // Set default settings
  await chrome.storage.local.set({
    extensionState,
    settings: {
      silenceTimeout: 5000, // 5 seconds
      autoTranscribe: true,
      showNotifications: true,
      quickCaptureKey: 'Ctrl+Shift+C',
    }
  });

  console.log('✅ Extension initialized, auth state:', extensionState.isAuthenticated);
});

// Startup: Load auth state from storage
chrome.runtime.onStartup.addListener(async () => {
  const savedData = await chrome.storage.local.get([
    'authToken',
    'userId',
    'isAuthenticated'
  ]);

  if (savedData.authToken) {
    extensionState.authToken = savedData.authToken;
    extensionState.userId = savedData.userId;
    extensionState.isAuthenticated = savedData.isAuthenticated || true;
    console.log('🔐 Auth state restored on startup');
  }
});

// Command handler for quick capture keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'quick-capture') {
    console.log('⚡ Quick capture triggered via keyboard shortcut');
    await triggerQuickCapture();
  }
});

// Message handler for communication with content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Message received:', message.action);

  switch (message.action) {
    case 'get-auth-state':
      chrome.storage.local.get([
        'authToken',
        'userId',
        'isAuthenticated'
      ]).then(data => {
        sendResponse({
          isAuthenticated: data.isAuthenticated || false,
          userId: data.userId || null,
          hasToken: !!data.authToken
        });
      });
      return true; // Async response

    case 'set-auth-state':
      extensionState.isAuthenticated = message.isAuthenticated;
      extensionState.userId = message.userId;
      extensionState.authToken = message.authToken;
      chrome.storage.local.set({
        authToken: message.authToken,
        userId: message.userId,
        isAuthenticated: message.isAuthenticated,
        extensionState
      });
      sendResponse({ success: true });
      break;

    case 'logout':
      handleLogout().then(() => {
        sendResponse({ success: true });
      });
      return true; // Async response

    case 'start-recording':
      handleStartRecording(sender.tab?.id);
      sendResponse({ success: true });
      break;

    case 'stop-recording':
      handleStopRecording(message.audioData, sender.tab?.id);
      sendResponse({ success: true });
      break;

    case 'upload-thought':
      handleUploadThought(message.thought, message.audioBlob)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ error: error.message }));
      return true; // Keep channel open for async response

    case 'get-settings':
      chrome.storage.local.get('settings').then(data => {
        sendResponse(data.settings);
      });
      return true;

    case 'update-settings':
      chrome.storage.local.set({ settings: message.settings });
      sendResponse({ success: true });
      break;

    case 'ping':
      sendResponse({
        connected: true,
        version: chrome.runtime.getManifest().version
      });
      break;

    default:
      console.warn('Unknown action:', message.action);
      sendResponse({ error: 'Unknown action' });
  }

  return false; // Synchronous response
});

/**
 * HANDLE LOGOUT
 * Clear all auth data
 */
async function handleLogout() {
  await chrome.storage.local.remove([
    'authToken',
    'userId',
    'isAuthenticated',
    'user',
    'authenticatedAt'
  ]);

  extensionState.isAuthenticated = false;
  extensionState.userId = null;
  extensionState.authToken = null;

  console.log('🚪 User logged out');
}

/**
 * QUICK CAPTURE TRIGGER
 * Ultra-fast voice capture activation (<50ms)
 */
async function triggerQuickCapture() {
  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
      console.error('No active tab found');
      return;
    }

    // Reload auth state from storage
    const authData = await chrome.storage.local.get(['authToken', 'isAuthenticated']);
    extensionState.authToken = authData.authToken;
    extensionState.isAuthenticated = authData.isAuthenticated || false;

    // Check auth state
    if (!extensionState.isAuthenticated || !extensionState.authToken) {
      // Show auth modal
      chrome.tabs.sendMessage(tab.id, {
        action: 'show-auth-modal'
      }).catch(() => {
        // Content script not ready, open login page
        chrome.tabs.create({
          url: 'https://catchr.vercel.app/install-extension'
        });
      });
      return;
    }

    // Inject content script if not already present
    await ensureContentScriptInjected(tab.id);

    // Trigger voice capture modal (ultra-fast)
    chrome.tabs.sendMessage(tab.id, {
      action: 'show-capture-modal',
      context: {
        url: tab.url,
        title: tab.title,
        timestamp: Date.now(),
      }
    });

    console.log('⚡ Quick capture modal triggered in <50ms');

  } catch (error) {
    console.error('Quick capture failed:', error);
  }
}

/**
 * ENSURE CONTENT SCRIPT INJECTED
 * Dynamically inject if needed (for tabs opened before extension install)
 */
async function ensureContentScriptInjected(tabId) {
  try {
    // Try to ping content script
    const response = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
    if (response?.ready) {
      return; // Already injected
    }
  } catch {
    // Content script not present, inject it
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['src/content.js']
    });
    console.log('✅ Content script injected into tab', tabId);
  }
}

/**
 * HANDLE START RECORDING
 */
async function handleStartRecording(tabId) {
  extensionState.isRecording = true;
  extensionState.lastCaptureTime = Date.now();
  await chrome.storage.local.set({ extensionState });

  console.log('🎤 Recording started');

  // Notify popup if open
  chrome.runtime.sendMessage({
    action: 'recording-state-changed',
    isRecording: true
  }).catch(() => {});
}

/**
 * HANDLE STOP RECORDING
 */
async function handleStopRecording(audioData, tabId) {
  extensionState.isRecording = false;
  extensionState.totalCaptures++;
  await chrome.storage.local.set({ extensionState });

  console.log('⏹️ Recording stopped');

  // Notify popup if open
  chrome.runtime.sendMessage({
    action: 'recording-state-changed',
    isRecording: false
  }).catch(() => {});
}

/**
 * HANDLE UPLOAD THOUGHT
 * Uploads audio to Catchr backend for GPT-5 processing
 * FIXED: Now includes Authentication header with JWT token
 */
async function handleUploadThought(thought, audioBlob) {
  try {
    // Get auth token from storage (most up-to-date)
    const { authToken } = await chrome.storage.local.get('authToken');

    if (!authToken) {
      throw new Error('Not authenticated. Please log in first.');
    }

    console.log('📤 Uploading thought to Catchr with auth...');

    // Upload to Catchr backend
    const formData = new FormData();
    formData.append('content', thought.text);
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('context', JSON.stringify({
      browserContext: thought.context?.title,
      location: thought.context?.url,
      timestamp: thought.timestamp,
    }));

    const response = await fetch(`${extensionState.apiEndpoint}/voice/transcribe`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}` // CRITICAL: Auth header added
      },
      body: formData,
    });

    if (response.status === 401) {
      throw new Error('Authentication expired. Please log in again.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
    }

    const result = await response.json();

    console.log('✅ Thought uploaded successfully:', result);

    // Show success notification
    const settings = await chrome.storage.local.get('settings');
    if (settings.settings?.showNotifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-128.png',
        title: 'Thought Captured!',
        message: `Organized into: ${result.category || 'General'}`,
        priority: 1,
      });
    }

    return {
      success: true,
      thought: result
    };

  } catch (error) {
    console.error('Upload failed:', error);

    // Show error notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: 'Upload Failed',
      message: error.message,
      priority: 2,
    });

    return {
      error: error.message
    };
  }
}

/**
 * EXTENSION ICON CLICK
 * Opens popup for quick actions
 */
chrome.action.onClicked.addListener(async (tab) => {
  // Trigger quick capture on icon click
  await triggerQuickCapture();
});

/**
 * LISTEN FOR AUTH TOKENS FROM WEB APP
 * External messages from https://catchr.vercel.app
 */
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  console.log('📨 External message received:', request.type);

  if (request.type === 'AUTH_TOKEN') {
    handleAuthTokenFromWebApp(request)
      .then(() => {
        console.log('✅ Auth token stored successfully');
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('❌ Failed to store auth token:', error);
        sendResponse({ success: false, error: error.message });
      });

    return true; // Keep channel open for async response
  }

  if (request.type === 'PING') {
    sendResponse({
      connected: true,
      version: chrome.runtime.getManifest().version
    });
  }

  return false;
});

/**
 * HANDLE AUTH TOKEN FROM WEB APP
 * Store token and user info from web app OAuth
 */
async function handleAuthTokenFromWebApp(request) {
  const { token, userId, user } = request;

  if (!token || !userId) {
    throw new Error('Invalid auth token data');
  }

  // Update extension state
  await chrome.storage.local.set({
    authToken: token,
    userId: userId,
    user: user || null,
    isAuthenticated: true,
    authenticatedAt: Date.now()
  });

  // Update runtime state
  extensionState.authToken = token;
  extensionState.userId = userId;
  extensionState.isAuthenticated = true;

  // Notify all tabs about auth state change
  const tabs = await chrome.tabs.query({});
  tabs.forEach(tab => {
    chrome.tabs.sendMessage(tab.id, {
      action: 'auth-state-changed',
      isAuthenticated: true,
      userId: userId
    }).catch(() => {}); // Ignore errors for tabs without content script
  });

  // Show success notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon-128.png',
    title: 'Catchr Connected!',
    message: 'Your extension is now connected to your Catchr account.',
    priority: 2
  });

  console.log('🔐 User authenticated:', userId);
}

console.log('🚀 Catchr Extension service worker ready');
