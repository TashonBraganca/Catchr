/**
 * CATHCR Extension API Routes
 * Handles authentication and synchronization for Chrome extension
 */
import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { supabaseAdmin } from '../config/supabase.js';
const router = Router();
// Rate limiting for extension endpoints
const extensionRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each extension to 100 requests per windowMs
    message: 'Too many requests from this extension, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `extension:${ipKeyGenerator(req)}:${req.headers['user-agent']}`,
});
// Apply rate limiting to all extension routes
router.use(extensionRateLimit);
/**
 * Extension Authentication
 * POST /api/extension/auth
 */
router.post('/auth', [
    body('extensionId').isString().notEmpty().withMessage('Extension ID is required'),
    body('version').isString().notEmpty().withMessage('Extension version is required'),
    body('userId').optional().isString(),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: errors.array(),
            });
        }
        const { extensionId, version, userId } = req.body;
        // Generate extension token
        const extensionToken = jwt.sign({
            extensionId,
            version,
            userId: userId || null,
            type: 'extension',
            iat: Date.now(),
        }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '30d' });
        // Log extension connection
        console.log(`🔗 Extension authenticated: ${extensionId} v${version}`);
        // Store or update extension registration
        const { error: upsertError } = await supabaseAdmin
            .from('extension_connections')
            .upsert({
            extension_id: extensionId,
            version,
            user_id: userId,
            token: extensionToken,
            last_connected: new Date().toISOString(),
            is_active: true,
        }, {
            onConflict: 'extension_id'
        });
        if (upsertError) {
            console.error('Failed to store extension connection:', upsertError);
            return res.status(500).json({
                success: false,
                error: 'Failed to register extension',
            });
        }
        res.json({
            success: true,
            token: extensionToken,
            message: 'Extension authenticated successfully',
        });
    }
    catch (error) {
        console.error('Extension auth error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication failed',
        });
    }
});
/**
 * Sync Captures from Extension
 * POST /api/extension/sync
 */
router.post('/sync', [
    body('captures').isArray().withMessage('Captures must be an array'),
    body('captures.*.id').isString().notEmpty(),
    body('captures.*.text').isString().notEmpty(),
    body('captures.*.timestamp').isNumeric(),
    body('captures.*.source').equals('extension'),
    body('extensionId').optional().isString(),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: errors.array(),
            });
        }
        const { captures, extensionId } = req.body;
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Authorization token required',
            });
        }
        // Verify extension token
        const token = authHeader.slice(7);
        let decodedToken;
        try {
            decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
        }
        catch (error) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token',
            });
        }
        if (decodedToken.type !== 'extension') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token type',
            });
        }
        // Process captures using Supabase function
        const { data: syncResults, error: syncError } = await supabaseAdmin
            .rpc('sync_extension_captures', {
            p_extension_id: decodedToken.extensionId,
            p_user_id: decodedToken.userId,
            p_captures: captures
        });
        if (syncError) {
            console.error('Failed to sync captures:', syncError);
            return res.status(500).json({
                success: false,
                error: 'Failed to sync captures',
            });
        }
        // Update extension last sync time
        const { error: updateError } = await supabaseAdmin
            .from('extension_connections')
            .update({ last_sync: new Date().toISOString() })
            .eq('extension_id', decodedToken.extensionId);
        if (updateError) {
            console.warn('Failed to update last sync time:', updateError);
        }
        console.log(`📤 Extension sync completed: ${syncResults.successful.length} successful, ${syncResults.failed.length} failed, ${syncResults.duplicates.length} duplicates`);
        res.json({
            success: true,
            synced: syncResults.successful.length,
            results: syncResults,
            message: `Successfully synced ${syncResults.successful.length} captures`,
        });
    }
    catch (error) {
        console.error('Extension sync error:', error);
        res.status(500).json({
            success: false,
            error: 'Sync failed',
        });
    }
});
/**
 * Get User Captures for Extension
 * GET /api/extension/captures
 */
router.get('/captures', [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    query('since').optional().isISO8601(),
], async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Authorization token required',
            });
        }
        const token = authHeader.slice(7);
        let decodedToken;
        try {
            decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
        }
        catch (error) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token',
            });
        }
        if (!decodedToken.userId) {
            return res.status(401).json({
                success: false,
                error: 'User authentication required',
            });
        }
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const since = req.query.since ? new Date(req.query.since) : undefined;
        const { data: captures, error: capturesError } = await supabaseAdmin
            .rpc('get_extension_captures', {
            p_extension_id: null, // Get all captures for user
            p_user_id: decodedToken.userId,
            p_limit: limit,
            p_offset: offset,
            p_since: since?.toISOString() || null
        });
        if (capturesError) {
            console.error('Failed to fetch captures:', capturesError);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch captures',
            });
        }
        // Transform for response
        const transformedCaptures = (captures || []).map((capture) => ({
            ...capture,
            timestamp: new Date(capture.created_at).getTime(),
        }));
        res.json({
            success: true,
            captures: transformedCaptures,
            pagination: {
                limit,
                offset,
                total: transformedCaptures.length,
                hasMore: transformedCaptures.length === limit,
            },
        });
    }
    catch (error) {
        console.error('Extension captures fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch captures',
        });
    }
});
/**
 * Extension Health Check
 * GET /api/extension/health
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
    });
});
/**
 * Connect Extension to User Account
 * POST /api/extension/connect
 */
router.post('/connect', [
    body('extensionId').isString().notEmpty(),
    body('userId').isString().notEmpty(),
    body('connectionCode').isString().notEmpty(),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: errors.array(),
            });
        }
        const { extensionId, userId, connectionCode } = req.body;
        // Verify connection code (this would be generated in the web app)
        const { data: connectionRequest, error: requestError } = await supabaseAdmin
            .from('extension_connection_requests')
            .select('*')
            .eq('code', connectionCode)
            .eq('user_id', userId)
            .gte('expires_at', new Date().toISOString())
            .eq('used', false)
            .single();
        if (requestError || !connectionRequest) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired connection code',
            });
        }
        // Update extension connection with user ID
        const { error: updateError } = await supabaseAdmin
            .from('extension_connections')
            .update({
            user_id: userId,
            connected_at: new Date().toISOString(),
            is_connected: true,
        })
            .eq('extension_id', extensionId);
        if (updateError) {
            console.error('Failed to update extension connection:', updateError);
            return res.status(500).json({
                success: false,
                error: 'Failed to connect extension',
            });
        }
        // Mark connection request as used
        const { error: markUsedError } = await supabaseAdmin
            .from('extension_connection_requests')
            .update({
            used: true,
            used_at: new Date().toISOString(),
        })
            .eq('id', connectionRequest.id);
        if (markUsedError) {
            console.warn('Failed to mark connection request as used:', markUsedError);
        }
        console.log(`🔗 Extension connected to user: ${extensionId} -> ${userId}`);
        res.json({
            success: true,
            message: 'Extension successfully connected to user account',
        });
    }
    catch (error) {
        console.error('Extension connection error:', error);
        res.status(500).json({
            success: false,
            error: 'Connection failed',
        });
    }
});
/**
 * Disconnect Extension from User Account
 * POST /api/extension/disconnect
 */
router.post('/disconnect', [
    body('extensionId').isString().notEmpty(),
], async (req, res) => {
    try {
        const { extensionId } = req.body;
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Authorization token required',
            });
        }
        const token = authHeader.slice(7);
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
        const { error: disconnectError } = await supabaseAdmin
            .from('extension_connections')
            .update({
            user_id: null,
            is_connected: false,
            disconnected_at: new Date().toISOString(),
        })
            .eq('extension_id', extensionId);
        if (disconnectError) {
            console.error('Failed to disconnect extension:', disconnectError);
            return res.status(500).json({
                success: false,
                error: 'Failed to disconnect extension',
            });
        }
        res.json({
            success: true,
            message: 'Extension disconnected successfully',
        });
    }
    catch (error) {
        console.error('Extension disconnection error:', error);
        res.status(500).json({
            success: false,
            error: 'Disconnection failed',
        });
    }
});
// Helper function to trigger webhooks
async function triggerCaptureWebhooks(capture) {
    try {
        // This would integrate with webhook system if implemented
        // For now, just log the event
        console.log(`📡 Capture webhook triggered for: ${capture.id}`);
    }
    catch (error) {
        console.error('Webhook trigger failed:', error);
    }
}
export default router;
//# sourceMappingURL=extension.js.map