import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Path to the built extension
const EXTENSION_PATH = path.resolve(__dirname, '../../../extension/dist');
const EXTENSION_ZIP = path.join(EXTENSION_PATH, 'cathcr-extension-v1.0.0.zip');
/**
 * GET /api/distribution/extension/download
 * Download the CATHCR Chrome Extension directly
 */
router.get('/extension/download', async (req, res) => {
    try {
        // Check if extension file exists
        const stats = await fs.stat(EXTENSION_ZIP);
        if (!stats.isFile()) {
            return res.status(404).json({
                error: 'Extension file not found',
                message: 'The extension package is not available for download'
            });
        }
        // Set headers for file download
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="cathcr-extension-v1.0.0.zip"');
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Cache-Control', 'no-cache');
        // Stream the file
        const fileBuffer = await fs.readFile(EXTENSION_ZIP);
        res.send(fileBuffer);
        console.log(`📦 Extension downloaded: ${req.ip} - ${new Date().toISOString()}`);
    }
    catch (error) {
        console.error('Extension download error:', error);
        res.status(500).json({
            error: 'Download failed',
            message: 'Unable to download extension file'
        });
    }
});
/**
 * GET /api/distribution/extension/version
 * Get current extension version info
 */
router.get('/extension/version', async (req, res) => {
    try {
        const manifestPath = path.join(EXTENSION_PATH, 'manifest.json');
        const manifestContent = await fs.readFile(manifestPath, 'utf8');
        const manifest = JSON.parse(manifestContent);
        res.json({
            version: manifest.version,
            name: manifest.name,
            description: manifest.description,
            downloadUrl: '/api/distribution/extension/download',
            installationGuide: '/api/distribution/extension/install-guide',
            shortcuts: {
                windows: 'Ctrl+Shift+C',
                mac: 'Command+K',
                description: 'Open instant thought capture modal'
            },
            permissions: manifest.permissions,
            lastUpdated: new Date().toISOString(),
            size: (await fs.stat(EXTENSION_ZIP)).size
        });
    }
    catch (error) {
        console.error('Version check error:', error);
        res.status(500).json({
            error: 'Version check failed',
            message: 'Unable to get extension version information'
        });
    }
});
/**
 * GET /api/distribution/extension/install-guide
 * Get detailed installation instructions with setup animations
 */
router.get('/extension/install-guide', (req, res) => {
    const installGuide = {
        title: 'CATHCR Chrome Extension - Installation Guide',
        version: '1.0.0',
        steps: [
            {
                step: 1,
                title: 'Download Extension',
                description: 'Download the CATHCR extension package',
                action: 'Click the download button above to get cathcr-extension-v1.0.0.zip',
                animation: 'download-click',
                icon: '📦'
            },
            {
                step: 2,
                title: 'Open Chrome Extensions',
                description: 'Navigate to Chrome Extensions page',
                action: 'Go to chrome://extensions/ or Menu → More Tools → Extensions',
                animation: 'navigate-extensions',
                icon: '🔧'
            },
            {
                step: 3,
                title: 'Enable Developer Mode',
                description: 'Turn on Developer mode',
                action: 'Toggle the "Developer mode" switch in the top-right corner',
                animation: 'developer-toggle',
                icon: '⚙️'
            },
            {
                step: 4,
                title: 'Load Unpacked Extension',
                description: 'Install the CATHCR extension',
                action: 'Click "Load unpacked" and select the extracted extension folder',
                animation: 'load-unpacked',
                icon: '📂'
            },
            {
                step: 5,
                title: 'Grant Permissions',
                description: 'Allow necessary permissions',
                action: 'Click "Allow" when prompted for storage and microphone permissions',
                animation: 'grant-permissions',
                icon: '✅'
            },
            {
                step: 6,
                title: 'Setup Keyboard Shortcuts',
                description: 'Configure instant capture hotkeys',
                action: 'The shortcuts are pre-configured: Ctrl+Shift+C (Windows) or Command+K (Mac)',
                animation: 'keyboard-demo',
                icon: '⌨️',
                shortcuts: {
                    windows: {
                        key: 'Ctrl+Shift+C',
                        demo: 'ctrl-shift-c-animation'
                    },
                    mac: {
                        key: 'Command+K',
                        demo: 'cmd-k-animation'
                    }
                }
            },
            {
                step: 7,
                title: 'Test Installation',
                description: 'Verify everything works',
                action: 'Press your shortcut key or click the CATHCR icon to test instant capture',
                animation: 'test-capture',
                icon: '🚀'
            }
        ],
        troubleshooting: [
            {
                issue: 'Extension not loading',
                solution: 'Make sure you extracted the ZIP file and selected the folder (not the ZIP file)'
            },
            {
                issue: 'Shortcuts not working',
                solution: 'Go to chrome://extensions/shortcuts and ensure CATHCR shortcuts are assigned'
            },
            {
                issue: 'Microphone not working',
                solution: 'Check site permissions and ensure microphone access is allowed'
            },
            {
                issue: 'Capture modal not appearing',
                solution: 'Refresh the page and try again, or check browser console for errors'
            }
        ],
        features: [
            {
                name: 'Lightning-Fast Capture',
                description: 'Modal appears in <50ms for instant thought recording',
                icon: '⚡'
            },
            {
                name: 'AI-Powered Categorization',
                description: 'GPT-5 Mini automatically organizes your thoughts',
                icon: '🧠'
            },
            {
                name: 'Voice & Text Input',
                description: 'Support for both typing and speech-to-text',
                icon: '🎙️'
            },
            {
                name: 'Smart Organization',
                description: 'Automatic folder creation and tagging',
                icon: '📁'
            },
            {
                name: 'Cross-Device Sync',
                description: 'Access your thoughts from any device',
                icon: '🔄'
            }
        ],
        requirements: {
            browser: 'Google Chrome 88+ or Chromium-based browser',
            permissions: ['Storage', 'Active Tab', 'Scripting', 'Notifications', 'Microphone (optional)'],
            network: 'Internet connection required for AI processing and sync'
        },
        support: {
            documentation: 'https://docs.cathcr.com',
            issues: 'https://github.com/cathcr/extension/issues',
            email: 'support@cathcr.com'
        }
    };
    res.json(installGuide);
});
/**
 * GET /api/distribution/extension/update-check
 * Check for extension updates
 */
router.get('/extension/update-check', async (req, res) => {
    try {
        const { current_version } = req.query;
        const manifestPath = path.join(EXTENSION_PATH, 'manifest.json');
        const manifestContent = await fs.readFile(manifestPath, 'utf8');
        const manifest = JSON.parse(manifestContent);
        const latestVersion = manifest.version;
        const hasUpdate = current_version !== latestVersion;
        res.json({
            hasUpdate,
            currentVersion: current_version || 'unknown',
            latestVersion,
            downloadUrl: hasUpdate ? '/api/distribution/extension/download' : null,
            releaseNotes: hasUpdate ? [
                'Enhanced AI categorization with GPT-5 Mini',
                'Improved capture modal performance (<50ms)',
                'Added voice recognition with auto-trigger',
                'Better error handling and fallback systems',
                'Updated UI with glassmorphism design'
            ] : [],
            updateInstructions: hasUpdate ? [
                'Download the new extension package',
                'Remove the old extension from chrome://extensions/',
                'Install the new version following the installation guide'
            ] : [],
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Update check error:', error);
        res.status(500).json({
            error: 'Update check failed',
            message: 'Unable to check for updates'
        });
    }
});
/**
 * GET /api/distribution/extension/stats
 * Get extension distribution statistics (admin only)
 */
router.get('/extension/stats', async (req, res) => {
    try {
        // This would typically require admin authentication
        // For now, return basic stats
        const stats = await fs.stat(EXTENSION_ZIP);
        res.json({
            version: '1.0.0',
            packageSize: stats.size,
            packageSizeFormatted: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
            lastModified: stats.mtime.toISOString(),
            downloadCount: 0, // Would be tracked in production
            activeInstalls: 0, // Would be tracked via telemetry
            platform: 'Chrome Extension (Manifest V3)',
            directDistribution: true,
            autoUpdates: false, // Direct distribution doesn't support auto-updates
            status: 'active'
        });
    }
    catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            error: 'Stats unavailable',
            message: 'Unable to get distribution statistics'
        });
    }
});
/**
 * POST /api/distribution/extension/feedback
 * Collect installation feedback
 */
router.post('/extension/feedback', express.json(), (req, res) => {
    try {
        const { step, success, error, userAgent, timestamp } = req.body;
        // Log feedback for analysis
        console.log('📊 Installation feedback:', {
            step,
            success,
            error,
            userAgent,
            ip: req.ip,
            timestamp: timestamp || new Date().toISOString()
        });
        // In production, this would be stored in a database
        res.json({
            success: true,
            message: 'Feedback received',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Feedback error:', error);
        res.status(500).json({
            error: 'Feedback submission failed',
            message: 'Unable to process feedback'
        });
    }
});
export default router;
//# sourceMappingURL=distribution.js.map