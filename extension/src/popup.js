/**
 * CATCHR EXTENSION - POPUP SCRIPT
 *
 * Quick actions popup interface
 */

// Get auth state on load
chrome.runtime.sendMessage({ action: 'get-auth-state' }, (response) => {
  const authStatus = document.getElementById('auth-status');

  if (response.isAuthenticated) {
    authStatus.classList.remove('auth-required');
    authStatus.querySelector('.status-text').textContent = 'Connected';
  } else {
    authStatus.classList.add('auth-required');
    authStatus.querySelector('.status-text').textContent = 'Not Connected - Click to Sign In';
    authStatus.style.cursor = 'pointer';
    authStatus.onclick = () => {
      window.open('https://catchr.vercel.app', '_blank');
    };
  }
});

// Get stats
chrome.storage.local.get('extensionState', (data) => {
  if (data.extensionState) {
    document.getElementById('stat-captures').textContent = data.extensionState.totalCaptures || 0;
  }
});

// Quick capture button
document.getElementById('quick-capture-btn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, {
    action: 'show-capture-modal',
    context: {
      url: tab.url,
      title: tab.title,
      timestamp: Date.now()
    }
  });
  window.close();
});

// Open Catchr button
document.getElementById('open-catchr-btn').addEventListener('click', () => {
  window.open('https://catchr.vercel.app', '_blank');
});

// Settings button
document.getElementById('settings-btn').addEventListener('click', () => {
  window.open('https://catchr.vercel.app/settings', '_blank');
});
