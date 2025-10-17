/**
 * CATCHR EXTENSION - AUTH MODULE
 *
 * Handles authentication token management for extension
 * Features:
 * - Token storage in chrome.storage.local
 * - External message listener for web app OAuth
 * - Auth state management
 * - Logout functionality
 */

/**
 * Listen for auth tokens from web app (after OAuth login)
 * Web app URL: https://catchr.vercel.app/install-extension
 */
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  console.log('📨 External message received:', request.type);

  if (request.type === 'AUTH_TOKEN') {
    handleAuthToken(request)
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
 * HANDLE AUTH TOKEN
 * Store token and user info from web app OAuth
 */
async function handleAuthToken(request) {
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

/**
 * CHECK IF USER IS AUTHENTICATED
 * Returns auth state from storage
 */
export async function isAuthenticated() {
  const { authToken, isAuthenticated } = await chrome.storage.local.get([
    'authToken',
    'isAuthenticated'
  ]);

  return !!authToken && !!isAuthenticated;
}

/**
 * GET AUTH TOKEN
 * Returns stored auth token
 */
export async function getAuthToken() {
  const { authToken } = await chrome.storage.local.get('authToken');
  return authToken || null;
}

/**
 * GET USER INFO
 * Returns stored user information
 */
export async function getUserInfo() {
  const { userId, user, authenticatedAt } = await chrome.storage.local.get([
    'userId',
    'user',
    'authenticatedAt'
  ]);

  return {
    userId: userId || null,
    user: user || null,
    authenticatedAt: authenticatedAt || null
  };
}

/**
 * LOGOUT
 * Clear all auth data from storage
 */
export async function logout() {
  await chrome.storage.local.remove([
    'authToken',
    'userId',
    'user',
    'isAuthenticated',
    'authenticatedAt'
  ]);

  // Notify all tabs about auth state change
  const tabs = await chrome.tabs.query({});
  tabs.forEach(tab => {
    chrome.tabs.sendMessage(tab.id, {
      action: 'auth-state-changed',
      isAuthenticated: false
    }).catch(() => {});
  });

  console.log('🚪 User logged out');
}

/**
 * REFRESH AUTH STATE
 * Verify token is still valid by pinging API
 */
export async function refreshAuthState() {
  try {
    const token = await getAuthToken();

    if (!token) {
      await logout();
      return false;
    }

    // Ping API to verify token
    const response = await fetch('https://catchr.vercel.app/api/auth/verify', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      // Token invalid, logout
      await logout();
      return false;
    }

    return true;

  } catch (error) {
    console.error('Failed to refresh auth state:', error);
    return false;
  }
}

/**
 * OPEN LOGIN PAGE
 * Opens web app login page in new tab
 */
export function openLoginPage() {
  chrome.tabs.create({
    url: 'https://catchr.vercel.app/install-extension'
  });
}

console.log('🔐 Auth module loaded');
