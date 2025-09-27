import { defineManifest } from '@crxjs/vite-plugin';
import packageJson from '../package.json';

const { version, description } = packageJson;

// Split version into major.minor.patch and take first 4 parts
const [major, minor, patch] = version
  .replace(/[^\d.-]+/g, '')
  .split(/[.-]/)
  .map((v) => parseInt(v, 10));

export default defineManifest(async (env) => ({
  manifest_version: 3,
  name: env.mode === 'development' ? `[DEV] CATHCR` : 'CATHCR - Instant Thought Capture',
  description: description,
  version: `${major || 1}.${minor || 0}.${patch || 0}`,
  version_name: version,

  // Permissions
  permissions: [
    'storage',
    'activeTab',
    'scripting',
    'notifications',
  ],

  optional_permissions: [
    'microphone',
  ],

  host_permissions: [
    'http://localhost:3001/*',
    'http://localhost:5003/*',
    'http://localhost:5004/*',
    'https://api.cathcr.com/*',
    ...(env.mode === 'development' ? ['http://localhost:*/*'] : []),
  ],

  // Background script
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },

  // Content scripts
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/index.ts'],
      css: ['src/content/styles.css'],
      run_at: 'document_idle',
    },
  ],

  // Popup
  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'Capture Thought',
    default_icon: {
      16: 'icons/icon-16.png',
      48: 'icons/icon-48.png',
    },
  },

  // Options page
  options_page: 'src/options/index.html',

  // Icons
  icons: {
    16: 'icons/icon-16.png',
    48: 'icons/icon-48.png',
    128: 'icons/icon-128.png',
  },

  // Global keyboard shortcuts
  commands: {
    'capture-thought': {
      suggested_key: {
        default: 'Ctrl+Shift+C',
        mac: 'Command+K',
      },
      description: 'Open instant thought capture modal',
    },
  },

  // Web accessible resources
  web_accessible_resources: [
    {
      resources: ['icons/*.png', 'src/content/styles.css'],
      matches: ['<all_urls>'],
    },
  ],

  // Content Security Policy
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'; style-src 'self' 'unsafe-inline';",
  },
}));