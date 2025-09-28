import { Request, Response, NextFunction } from 'express';
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
/**
 * Authentication middleware for protecting routes
 * Verifies JWT tokens and adds user information to request
 */
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Optional authentication middleware
 * Adds user information if token is present but doesn't block request if missing
 */
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to verify user has specific permissions
 */
export declare const requirePermission: (permission: string) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Rate limiting by user ID
 */
export declare const userRateLimit: (maxRequests: number, windowMs: number) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
declare const _default: {
    authenticateToken: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    optionalAuth: (req: Request, res: Response, next: NextFunction) => void;
    requirePermission: (permission: string) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    userRateLimit: (maxRequests: number, windowMs: number) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
};
export default _default;
//# sourceMappingURL=auth.d.ts.map