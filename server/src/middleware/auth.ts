import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        [key: string]: any;
      };
    }
  }
}

interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Authentication middleware for protecting routes
 * Verifies JWT tokens and adds user information to request
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Please provide a valid authentication token'
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development';

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({
          error: 'Invalid token',
          message: 'The provided token is invalid or expired'
        });
      }

      const payload = decoded as JWTPayload;
      req.user = {
        id: payload.userId,
        email: payload.email
      };

      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      message: 'Internal server error during authentication'
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user information if token is present but doesn't block request if missing
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No token provided, continue without user
      return next();
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development';

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (!err && decoded) {
        const payload = decoded as JWTPayload;
        req.user = {
          id: payload.userId,
          email: payload.email
        };
      }
      // Continue regardless of token validity
      next();
    });
  } catch (error) {
    // Log error but don't block the request
    console.error('Optional auth error:', error);
    next();
  }
};

/**
 * Middleware to verify user has specific permissions
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated to access this resource'
      });
    }

    // For now, all authenticated users have all permissions
    // In a production app, you'd check user roles/permissions here
    next();
  };
};

/**
 * Rate limiting by user ID
 */
export const userRateLimit = (maxRequests: number, windowMs: number) => {
  const userRequestCounts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated for rate limiting'
      });
    }

    const userId = req.user.id;
    const now = Date.now();
    const userInfo = userRequestCounts.get(userId);

    if (!userInfo || now > userInfo.resetTime) {
      // First request or window has reset
      userRequestCounts.set(userId, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    if (userInfo.count >= maxRequests) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Maximum ${maxRequests} requests per ${Math.round(windowMs / 1000)} seconds`,
        retryAfter: Math.ceil((userInfo.resetTime - now) / 1000)
      });
    }

    // Increment count
    userInfo.count++;
    next();
  };
};

export default {
  authenticateToken,
  optionalAuth,
  requirePermission,
  userRateLimit
};