/**
 * Centralized Error Handling for StepLeague
 * 
 * Provides typed errors with consistent codes, context, and reporting.
 * 
 * Design: Future-proof for error reporting API (Sentry, custom endpoint, etc.)
 * Currently logs to console via logger.ts, ready to swap in remote reporting.
 * 
 * @example
 * // Throwing a typed error
 * throw new AppError({
 *   code: ErrorCode.UPLOAD_TOO_LARGE,
 *   message: 'File exceeds 5MB limit',
 *   context: { fileSize: file.size, maxSize: MAX_SIZE },
 *   recoverable: true,
 * });
 * 
 * @example
 * // Normalizing any error
 * try {
 *   await upload(file);
 * } catch (err) {
 *   const appError = normalizeError(err, ErrorCode.UPLOAD_FAILED);
 *   reportErrorClient(appError);
 * }
 */

// =============================================================================
// Error Codes - enables programmatic handling and analytics
// =============================================================================

export enum ErrorCode {
    // Upload/Attachment errors
    UPLOAD_FAILED = 'UPLOAD_FAILED',
    UPLOAD_TOO_LARGE = 'UPLOAD_TOO_LARGE',
    UPLOAD_INVALID_TYPE = 'UPLOAD_INVALID_TYPE',
    UPLOAD_INVALID_FORMAT = 'UPLOAD_INVALID_FORMAT',
    UPLOAD_PROCESSING_FAILED = 'UPLOAD_PROCESSING_FAILED',
    UPLOAD_STORAGE_ERROR = 'UPLOAD_STORAGE_ERROR',

    ATTACHMENT_NOT_FOUND = 'ATTACHMENT_NOT_FOUND',
    ATTACHMENT_FETCH_FAILED = 'ATTACHMENT_FETCH_FAILED',
    ATTACHMENT_DELETE_FAILED = 'ATTACHMENT_DELETE_FAILED',

    // API errors
    API_REQUEST_FAILED = 'API_REQUEST_FAILED',
    API_FETCH_FAILED = 'API_FETCH_FAILED',
    API_VALIDATION_ERROR = 'API_VALIDATION_ERROR',
    API_UNAUTHORIZED = 'API_UNAUTHORIZED',
    API_FORBIDDEN = 'API_FORBIDDEN',
    API_NOT_FOUND = 'API_NOT_FOUND',

    // Database errors
    DB_INSERT_FAILED = 'DB_INSERT_FAILED',
    DB_UPDATE_FAILED = 'DB_UPDATE_FAILED',
    DB_DELETE_FAILED = 'DB_DELETE_FAILED',
    DB_QUERY_FAILED = 'DB_QUERY_FAILED',

    // Menu errors
    MENU_NOT_FOUND = 'MENU_NOT_FOUND',
    MENU_CREATE_FAILED = 'MENU_CREATE_FAILED',
    MENU_ITEM_NOT_FOUND = 'MENU_ITEM_NOT_FOUND',
    MENU_ITEM_CREATE_FAILED = 'MENU_ITEM_CREATE_FAILED',
    MENU_ITEM_UPDATE_FAILED = 'MENU_ITEM_UPDATE_FAILED',
    MENU_ITEM_DELETE_FAILED = 'MENU_ITEM_DELETE_FAILED',
    MENU_BATCH_UPDATE_FAILED = 'MENU_BATCH_UPDATE_FAILED',
    MENU_INVALID_HIERARCHY = 'MENU_INVALID_HIERARCHY',

    // Form/Validation errors
    VALIDATION_FAILED = 'VALIDATION_FAILED',
    REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',

    // Network errors
    NETWORK_ERROR = 'NETWORK_ERROR',
    TIMEOUT_ERROR = 'TIMEOUT_ERROR',
    REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

    // Generic fallback
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// =============================================================================
// AppError Class
// =============================================================================

export interface AppErrorOptions {
    /** Error code for programmatic handling */
    code: ErrorCode;
    /** Human-readable error message */
    message: string;
    /** Additional context for debugging */
    context?: Record<string, unknown>;
    /** Original error that caused this one */
    cause?: Error;
    /** Can user retry this operation? */
    recoverable?: boolean;
}

export class AppError extends Error {
    readonly code: ErrorCode;
    readonly context?: Record<string, unknown>;
    readonly cause?: Error;
    readonly recoverable: boolean;
    readonly timestamp: string;

    constructor(options: AppErrorOptions) {
        super(options.message);
        this.name = 'AppError';
        this.code = options.code;
        this.context = options.context;
        this.cause = options.cause;
        this.recoverable = options.recoverable ?? true;
        this.timestamp = new Date().toISOString();

        // Maintain proper stack trace in V8 environments
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AppError);
        }
    }

    /** Serialize for logging/transmission */
    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            context: this.context,
            recoverable: this.recoverable,
            timestamp: this.timestamp,
            stack: this.stack,
            cause: this.cause?.message,
        };
    }

    /** Create user-friendly message */
    toUserMessage(): string {
        // Map technical codes to friendly messages
        const friendlyMessages: Partial<Record<ErrorCode, string>> = {
            [ErrorCode.UPLOAD_TOO_LARGE]: 'The file is too large. Please choose a smaller file.',
            [ErrorCode.UPLOAD_INVALID_TYPE]: 'This file type is not supported. Please use PNG, JPG, or GIF.',
            [ErrorCode.NETWORK_ERROR]: 'Connection lost. Please check your internet and try again.',
            [ErrorCode.REQUEST_TIMEOUT]: 'Request timed out. Please try again.',
            [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait a moment and try again.',
            [ErrorCode.API_UNAUTHORIZED]: 'Please sign in to continue.',
            [ErrorCode.API_FORBIDDEN]: "You don't have permission to do this.",
            [ErrorCode.MENU_NOT_FOUND]: 'Menu not found.',
            [ErrorCode.MENU_CREATE_FAILED]: 'Failed to create menu. Please try again.',
            [ErrorCode.MENU_ITEM_NOT_FOUND]: 'Menu item not found.',
            [ErrorCode.MENU_ITEM_CREATE_FAILED]: 'Failed to create menu item. Please try again.',
            [ErrorCode.MENU_ITEM_UPDATE_FAILED]: 'Failed to update menu item. Please try again.',
            [ErrorCode.MENU_ITEM_DELETE_FAILED]: 'Failed to delete menu item. Please try again.',
            [ErrorCode.MENU_BATCH_UPDATE_FAILED]: 'Failed to reorder menu items. Please try again.',
            [ErrorCode.MENU_INVALID_HIERARCHY]: 'Invalid menu structure. Check parent items.',
        };

        return friendlyMessages[this.code] || this.message;
    }
}

// =============================================================================
// Error Reporting
// =============================================================================

/**
 * Report error to centralized system (server-side).
 * 
 * Currently: Logs via logger.ts (visible in Vercel logs)
 * Future: Can call /api/errors or external service (Sentry, etc.)
 */
export async function reportError(
    error: AppError | Error,
    userId?: string,
    requestId?: string
): Promise<void> {
    const appError = error instanceof AppError
        ? error
        : normalizeError(error);

    // Dynamic import to avoid bundling server code in client
    try {
        const { logError } = await import('@/lib/server/logger');
        logError(appError.message, {
            code: appError.code,
            context: appError.context,
            recoverable: appError.recoverable,
            stack: appError.stack,
            cause: appError.cause?.message,
            userId,
            requestId,
        });
    } catch {
        // Fallback if logger import fails (e.g., client-side)
        console.error('[AppError]', appError.toJSON());
    }

    // Future: Send to error reporting API
    // Example with custom endpoint:
    // await fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ ...appError.toJSON(), userId }),
    // });
    //
    // Example with Sentry:
    // Sentry.captureException(appError, { extra: appError.context, user: { id: userId } });
}

/**
 * Report error from client-side code.
 * 
 * Uses synchronous logging to avoid issues with async in error handlers.
 * Future: Can use navigator.sendBeacon for reliable delivery.
 */
export function reportErrorClient(error: AppError | Error): void {
    const appError = error instanceof AppError
        ? error
        : normalizeError(error);

    console.error('[AppError]', appError.toJSON());

    // Future: Send to error reporting API using beacon (reliable even on page unload)
    // if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    //   navigator.sendBeacon('/api/errors', JSON.stringify(appError.toJSON()));
    // }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Normalize any thrown value into an AppError.
 * 
 * Handles: Error objects, strings, null/undefined, and unknown types.
 */
export function normalizeError(
    error: unknown,
    fallbackCode: ErrorCode = ErrorCode.UNKNOWN_ERROR
): AppError {
    // Already an AppError
    if (error instanceof AppError) {
        return error;
    }

    // Standard Error object
    if (error instanceof Error) {
        return new AppError({
            code: fallbackCode,
            message: error.message,
            cause: error,
            context: { originalName: error.name },
        });
    }

    // String error
    if (typeof error === 'string') {
        return new AppError({
            code: fallbackCode,
            message: error,
        });
    }

    // Object with message property
    if (error && typeof error === 'object' && 'message' in error) {
        return new AppError({
            code: fallbackCode,
            message: String((error as { message: unknown }).message),
            context: error as Record<string, unknown>,
        });
    }

    // Fallback for null, undefined, or other types
    return new AppError({
        code: fallbackCode,
        message: error ? String(error) : 'An unknown error occurred',
        context: { originalValue: error },
    });
}

/**
 * Check if an error is recoverable (user can retry).
 */
export function isRecoverable(error: unknown): boolean {
    if (error instanceof AppError) {
        return error.recoverable;
    }
    // Network errors are typically recoverable
    if (error instanceof Error && error.name === 'TypeError') {
        return true;
    }
    return true; // Default to recoverable
}

/**
 * Create an AppError from an API response.
 */
export async function errorFromResponse(
    response: Response,
    fallbackMessage = 'Request failed'
): Promise<AppError> {
    let message = fallbackMessage;
    let context: Record<string, unknown> = { status: response.status };

    try {
        const data = await response.json();
        if (data.error) {
            message = data.error;
        }
        context = { ...context, ...data };
    } catch {
        // Response body wasn't JSON
    }

    const codeFromStatus: Record<number, ErrorCode> = {
        400: ErrorCode.VALIDATION_FAILED,
        401: ErrorCode.API_UNAUTHORIZED,
        403: ErrorCode.API_FORBIDDEN,
        404: ErrorCode.API_NOT_FOUND,
        500: ErrorCode.API_REQUEST_FAILED,
    };

    return new AppError({
        code: codeFromStatus[response.status] || ErrorCode.API_REQUEST_FAILED,
        message,
        context,
        recoverable: response.status >= 500, // Server errors are typically retryable
    });
}

