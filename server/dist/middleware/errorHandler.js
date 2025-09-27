export const errorHandler = (err, req, res, next) => {
    // Set default values
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    // Log error
    console.error('Error:', err);
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    const response = {
        status: err.status,
        message: err.message,
        ...(isDevelopment && {
            error: err,
            stack: err.stack,
        }),
    };
    res.status(err.statusCode).json(response);
};
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
export const createError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};
//# sourceMappingURL=errorHandler.js.map