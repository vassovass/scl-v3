/**
 * API Utilities
 * 
 * Re-exports all API utilities for clean imports:
 * import { withApiHandler, json, badRequest } from '@/lib/api';
 */

// Handler wrapper
export { withApiHandler } from './handler';
export type { HandlerConfig, HandlerContext } from './handler';

// Response helpers (from existing api.ts)
export { json, jsonError, badRequest, unauthorized, forbidden, notFound, serverError, tooManyRequests } from '../api';

// Rate limiting
export { checkRateLimit, getRateLimitKey } from './rateLimit';
export type { RateLimitConfig, RateLimitResult } from './rateLimit';

