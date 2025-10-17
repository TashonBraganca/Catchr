/**
 * CATCHR EXTENSION - POPUP SCRIPT
 *
 * Quick actions popup interface with auth state management
 */

const WEB_APP_URL = 'https://catchr.vercel.app';

// Initialize popup on load
document.addEventListener('DOMContentLoaded', () => {
  initializePopup();
  setupEventListeners();
});

/**
 * INITIALIZE POPUP
 * Load auth state and stats
 */
async function initializePopup() {
  // Get auth state
  chrome.runtime.sendMessage({ action: 'get-auth-state' }, (response) => {
    const authStatus = document.getElementById('auth-status');

    if (!authStatus) {
      console.warn('Auth status element not found');
      return;
    }

    if (response && response.isAuthenticated) {
      authStatus.classList.remove('auth-required');
      authStatus.querySelector('.status-text').textContent = 'Connected';

      // Hide login button, show logout button
      const loginBtn = document.getElementById('login-btn');
      const logoutBtn = document.getElementById('logout-btn');

      if (loginBtn) loginBtn.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'block';

    } else {
      authStatus.classList.add('auth-required');
      authStatus.querySelector('.status-text').textContent = 'Not Connected - Click to Sign In';
      authStatus.style.cursor = 'pointer';
      authStatus.onclick = () => {
        openLoginPage();
      };

      // Show login button, hide logout button
      const loginBtn = document.getElementById('login-btn');
      const logoutBtn = document.getElementById('logout-btn');

      if (loginBtn) loginBtn.style.display = 'block';
      if (logoutBtn) logoutBtn.style.display = 'none';
    }
  });

  // Get stats
  chrome.storage.local.get('extensionState', (data) => {
    const statCaptures = document.getElementById('stat-captures');
    if (statCaptures && data.extensionState) {
      statCaptures.textContent = data.extensionState.totalCaptures || 0;
    }
  });
}

/**
 * SETUP EVENT LISTENERS
 */
function setupEventListeners() {
  // Quick capture button
  const quickCaptureBtn = document.getElementById('quick-capture-btn');
  if (quickCaptureBtn) {
    quickCaptureBtn.addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tab.id, {
        action: 'show-capture-modal',
        context: {
          url: tab.url,
          title: tab.title,
          timestamp: Date.now()
        }
      }).catch(() => {
        // Content script not ready, show error
        alert('Please refresh this page before capturing thoughts.');
      });
      window.close();
    });
  }

  // Login button
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      openLoginPage();
      window.close();
    });
  }

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      handleLogout();
    });
  }

  // Open Catchr button
  const openCatchrBtn = document.getElementById('open-catchr-btn');
  if (openCatchrBtn) {
    openCatchrBtn.addEventListener('click', () => {
      window.open(WEB_APP_URL, '_blank');
    });
  }

  // Settings button
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      window.open(`${WEB_APP_URL}/settings`, '_blank');
    });
  }
}

/**
 * OPEN LOGIN PAGE
 * Opens web app installation page for OAuth
 */
function openLoginPage() {
  chrome.tabs.create({
    url: `${WEB_APP_URL}/install-extension`
  });
}

/**
 * HANDLE LOGOUT
 * Clear auth data and update UI
 */
function handleLogout() {
  const confirmed = confirm('Are you sure you want to logout?');

  if (!confirmed) return;

  chrome.runtime.sendMessage({ action: 'logout' }, (response) => {
    if (response && response.success) {
      // Reinitialize popup to show logged out state
      initializePopup();
      alert('Successfully logged out');
    }
  });
}

/**
 * LISTEN FOR AUTH STATE CHANGES
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'auth-state-changed') {
    // Reinitialize popup when auth state changes
    initializePopup();
  }
});
