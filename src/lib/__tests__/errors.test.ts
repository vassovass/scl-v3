/**
 * Errors Utility Tests
 *
 * Tests for the centralized error handling utilities.
 * Based on testing-patterns skill and PRD 42.
 *
 * Key areas tested:
 * - AppError class
 * - Error normalization
 * - Error code mapping
 * - User-friendly messages
 */

import { describe, it, expect } from 'vitest';
import {
    AppError,
    ErrorCode,
    normalizeError,
    isRecoverable,
} from '../errors';

// ============================================================================
// AppError Class Tests
// ============================================================================

describe('errors - AppError Class', () => {
    describe('Constructor', () => {
        it('creates error with all options', () => {
            const cause = new Error('Original');
            const error = new AppError({
                code: ErrorCode.UPLOAD_FAILED,
                message: 'Upload failed',
                context: { fileSize: 1024 },
                cause,
                recoverable: true,
            });

            expect(error.code).toBe(ErrorCode.UPLOAD_FAILED);
            expect(error.message).toBe('Upload failed');
            expect(error.context).toEqual({ fileSize: 1024 });
            expect(error.cause).toBe(cause);
            expect(error.recoverable).toBe(true);
            expect(error.name).toBe('AppError');
        });

        it('defaults recoverable to true', () => {
            const error = new AppError({
                code: ErrorCode.UNKNOWN_ERROR,
                message: 'Test error',
            });

            expect(error.recoverable).toBe(true);
        });

        it('sets timestamp', () => {
            const before = new Date().toISOString();
            const error = new AppError({
                code: ErrorCode.UNKNOWN_ERROR,
                message: 'Test error',
            });
            const after = new Date().toISOString();

            expect(error.timestamp >= before).toBe(true);
            expect(error.timestamp <= after).toBe(true);
        });

        it('extends Error', () => {
            const error = new AppError({
                code: ErrorCode.UNKNOWN_ERROR,
                message: 'Test',
            });

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(AppError);
        });
    });

    describe('toJSON', () => {
        it('serializes error correctly', () => {
            const cause = new Error('Cause');
            const error = new AppError({
                code: ErrorCode.API_REQUEST_FAILED,
                message: 'Request failed',
                context: { url: '/api/test' },
                cause,
                recoverable: false,
            });

            const json = error.toJSON();

            expect(json.name).toBe('AppError');
            expect(json.code).toBe(ErrorCode.API_REQUEST_FAILED);
            expect(json.message).toBe('Request failed');
            expect(json.context).toEqual({ url: '/api/test' });
            expect(json.recoverable).toBe(false);
            expect(json.timestamp).toBeDefined();
            expect(json.cause).toBe('Cause');
        });

        it('handles missing cause', () => {
            const error = new AppError({
                code: ErrorCode.UNKNOWN_ERROR,
                message: 'Test',
            });

            const json = error.toJSON();
            expect(json.cause).toBeUndefined();
        });
    });

    describe('toUserMessage', () => {
        it('returns friendly message for UPLOAD_TOO_LARGE', () => {
            const error = new AppError({
                code: ErrorCode.UPLOAD_TOO_LARGE,
                message: 'File size: 10MB',
            });

            expect(error.toUserMessage()).toContain('too large');
        });

        it('returns friendly message for UPLOAD_INVALID_TYPE', () => {
            const error = new AppError({
                code: ErrorCode.UPLOAD_INVALID_TYPE,
                message: 'Invalid MIME type',
            });

            expect(error.toUserMessage()).toContain('not supported');
        });

        it('returns friendly message for NETWORK_ERROR', () => {
            const error = new AppError({
                code: ErrorCode.NETWORK_ERROR,
                message: 'fetch failed',
            });

            expect(error.toUserMessage()).toContain('Connection');
        });

        it('returns friendly message for API_UNAUTHORIZED', () => {
            const error = new AppError({
                code: ErrorCode.API_UNAUTHORIZED,
                message: '401',
            });

            expect(error.toUserMessage()).toContain('sign in');
        });

        it('returns friendly message for API_FORBIDDEN', () => {
            const error = new AppError({
                code: ErrorCode.API_FORBIDDEN,
                message: '403',
            });

            expect(error.toUserMessage()).toContain('permission');
        });

        it('returns original message for unknown codes', () => {
            const error = new AppError({
                code: ErrorCode.DB_INSERT_FAILED,
                message: 'Constraint violation',
            });

            expect(error.toUserMessage()).toBe('Constraint violation');
        });
    });
});

// ============================================================================
// ErrorCode Tests
// ============================================================================

describe('errors - ErrorCode Enum', () => {
    it('has upload error codes', () => {
        expect(ErrorCode.UPLOAD_FAILED).toBe('UPLOAD_FAILED');
        expect(ErrorCode.UPLOAD_TOO_LARGE).toBe('UPLOAD_TOO_LARGE');
        expect(ErrorCode.UPLOAD_INVALID_TYPE).toBe('UPLOAD_INVALID_TYPE');
    });

    it('has API error codes', () => {
        expect(ErrorCode.API_REQUEST_FAILED).toBe('API_REQUEST_FAILED');
        expect(ErrorCode.API_UNAUTHORIZED).toBe('API_UNAUTHORIZED');
        expect(ErrorCode.API_FORBIDDEN).toBe('API_FORBIDDEN');
        expect(ErrorCode.API_NOT_FOUND).toBe('API_NOT_FOUND');
    });

    it('has database error codes', () => {
        expect(ErrorCode.DB_INSERT_FAILED).toBe('DB_INSERT_FAILED');
        expect(ErrorCode.DB_UPDATE_FAILED).toBe('DB_UPDATE_FAILED');
        expect(ErrorCode.DB_DELETE_FAILED).toBe('DB_DELETE_FAILED');
        expect(ErrorCode.DB_QUERY_FAILED).toBe('DB_QUERY_FAILED');
    });

    it('has network error codes', () => {
        expect(ErrorCode.NETWORK_ERROR).toBe('NETWORK_ERROR');
        expect(ErrorCode.TIMEOUT_ERROR).toBe('TIMEOUT_ERROR');
        expect(ErrorCode.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('has UNKNOWN_ERROR as fallback', () => {
        expect(ErrorCode.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR');
    });
});

// ============================================================================
// normalizeError Tests
// ============================================================================

describe('errors - normalizeError', () => {
    describe('AppError Input', () => {
        it('returns AppError unchanged', () => {
            const original = new AppError({
                code: ErrorCode.API_REQUEST_FAILED,
                message: 'Test',
            });

            const normalized = normalizeError(original);

            expect(normalized).toBe(original);
        });
    });

    describe('Error Input', () => {
        it('wraps standard Error', () => {
            const original = new Error('Something went wrong');

            const normalized = normalizeError(original);

            expect(normalized).toBeInstanceOf(AppError);
            expect(normalized.message).toBe('Something went wrong');
            expect(normalized.cause).toBe(original);
        });

        it('uses fallback code', () => {
            const original = new Error('Network error');

            const normalized = normalizeError(original, ErrorCode.NETWORK_ERROR);

            expect(normalized.code).toBe(ErrorCode.NETWORK_ERROR);
        });

        it('defaults to UNKNOWN_ERROR code', () => {
            const original = new Error('Test');

            const normalized = normalizeError(original);

            expect(normalized.code).toBe(ErrorCode.UNKNOWN_ERROR);
        });

        it('includes original error name in context', () => {
            const original = new TypeError('Invalid type');

            const normalized = normalizeError(original);

            expect(normalized.context?.originalName).toBe('TypeError');
        });
    });

    describe('String Input', () => {
        it('creates AppError from string', () => {
            const normalized = normalizeError('Something failed');

            expect(normalized).toBeInstanceOf(AppError);
            expect(normalized.message).toBe('Something failed');
        });

        it('uses fallback code for string', () => {
            const normalized = normalizeError('API error', ErrorCode.API_REQUEST_FAILED);

            expect(normalized.code).toBe(ErrorCode.API_REQUEST_FAILED);
        });
    });

    describe('Object with Message', () => {
        it('extracts message from object', () => {
            const obj = { message: 'Error from object', status: 500 };

            const normalized = normalizeError(obj);

            expect(normalized.message).toBe('Error from object');
            expect(normalized.context).toMatchObject({ message: 'Error from object', status: 500 });
        });
    });

    describe('Other Types', () => {
        it('handles null', () => {
            const normalized = normalizeError(null);

            expect(normalized).toBeInstanceOf(AppError);
            expect(normalized.message).toBe('An unknown error occurred');
        });

        it('handles undefined', () => {
            const normalized = normalizeError(undefined);

            expect(normalized).toBeInstanceOf(AppError);
            expect(normalized.message).toBe('An unknown error occurred');
        });

        it('handles number', () => {
            const normalized = normalizeError(404);

            expect(normalized).toBeInstanceOf(AppError);
            expect(normalized.message).toBe('404');
        });

        it('handles boolean false as falsy value', () => {
            const normalized = normalizeError(false);

            expect(normalized).toBeInstanceOf(AppError);
            // false is falsy, so it falls to the 'unknown error' fallback
            expect(normalized.message).toBe('An unknown error occurred');
        });

        it('handles boolean true', () => {
            const normalized = normalizeError(true);

            expect(normalized).toBeInstanceOf(AppError);
            // true is truthy, so it gets stringified
            expect(normalized.message).toBe('true');
        });
    });
});

// ============================================================================
// isRecoverable Tests
// ============================================================================

describe('errors - isRecoverable', () => {
    it('returns recoverable flag from AppError', () => {
        const recoverable = new AppError({
            code: ErrorCode.NETWORK_ERROR,
            message: 'Test',
            recoverable: true,
        });
        const nonRecoverable = new AppError({
            code: ErrorCode.VALIDATION_FAILED,
            message: 'Test',
            recoverable: false,
        });

        expect(isRecoverable(recoverable)).toBe(true);
        expect(isRecoverable(nonRecoverable)).toBe(false);
    });

    it('treats TypeError as recoverable', () => {
        const error = new TypeError('Network error');

        expect(isRecoverable(error)).toBe(true);
    });

    it('defaults to true for unknown errors', () => {
        expect(isRecoverable(new Error('Unknown'))).toBe(true);
        expect(isRecoverable('string error')).toBe(true);
        expect(isRecoverable(null)).toBe(true);
    });
});

// ============================================================================
// Error Code to Message Mapping Tests
// ============================================================================

describe('errors - Error Code Mapping', () => {
    const friendlyCodeMessages: Partial<Record<ErrorCode, string>> = {
        [ErrorCode.UPLOAD_TOO_LARGE]: 'too large',
        [ErrorCode.UPLOAD_INVALID_TYPE]: 'not supported',
        [ErrorCode.NETWORK_ERROR]: 'Connection',
        [ErrorCode.REQUEST_TIMEOUT]: 'timed out',
        [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests',
        [ErrorCode.API_UNAUTHORIZED]: 'sign in',
        [ErrorCode.API_FORBIDDEN]: 'permission',
    };

    Object.entries(friendlyCodeMessages).forEach(([code, expectedSubstring]) => {
        it(`maps ${code} to friendly message containing "${expectedSubstring}"`, () => {
            const error = new AppError({
                code: code as ErrorCode,
                message: 'Technical error',
            });

            expect(error.toUserMessage()).toContain(expectedSubstring);
        });
    });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('errors - Edge Cases', () => {
    it('handles error with very long message', () => {
        const longMessage = 'A'.repeat(10000);
        const error = new AppError({
            code: ErrorCode.UNKNOWN_ERROR,
            message: longMessage,
        });

        expect(error.message).toBe(longMessage);
        expect(error.toJSON().message).toBe(longMessage);
    });

    it('handles error with special characters in message', () => {
        const message = 'Error: <script>alert("xss")</script>';
        const error = new AppError({
            code: ErrorCode.UNKNOWN_ERROR,
            message,
        });

        expect(error.message).toBe(message);
    });

    it('handles error with complex context', () => {
        const context = {
            nested: { deeply: { value: 123 } },
            array: [1, 2, 3],
            null: null,
            undefined: undefined,
        };

        const error = new AppError({
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Test',
            context,
        });

        expect(error.context).toEqual(context);
    });

    it('preserves stack trace', () => {
        const error = new AppError({
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Test',
        });

        expect(error.stack).toContain('AppError');
    });

    it('handles chained causes', () => {
        const root = new Error('Root cause');
        const middle = new AppError({
            code: ErrorCode.DB_QUERY_FAILED,
            message: 'Query failed',
            cause: root,
        });
        const top = new AppError({
            code: ErrorCode.API_REQUEST_FAILED,
            message: 'API failed',
            cause: middle,
        });

        expect(top.cause).toBe(middle);
        expect((top.cause as AppError).cause).toBe(root);
    });
});
