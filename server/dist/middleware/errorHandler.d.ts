import { Request, Response, NextFunction } from 'express';
interface CustomError extends Error {
    statusCode?: number;
    status?: string;
    isOperational?: boolean;
}
export declare const errorHandler: (err: CustomError, req: Request, res: Response, next: NextFunction) => void;
export declare const asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => void;
export declare const createError: (message: string, statusCode: number) => CustomError;
export {};
//# sourceMappingURL=errorHandler.d.ts.map