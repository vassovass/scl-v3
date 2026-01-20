/**
 * Server-side logging utility for StepLeague.
 * Logs are written to console (visible in Vercel logs) with structured format.
 * SuperAdmins can access logs via a debug endpoint or UI.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: Record<string, unknown>;
    userId?: string;
    requestId?: string;
}

// In-memory log buffer for recent logs (for debug endpoint)
const LOG_BUFFER_SIZE = 100;
const logBuffer: LogEntry[] = [];

function addToBuffer(entry: LogEntry) {
    logBuffer.push(entry);
    if (logBuffer.length > LOG_BUFFER_SIZE) {
        logBuffer.shift();
    }
}

function formatLogEntry(entry: LogEntry): string {
    const contextStr = entry.context ? ` | ${JSON.stringify(entry.context)}` : "";
    const userStr = entry.userId ? ` [user:${entry.userId}]` : "";
    const reqStr = entry.requestId ? ` [req:${entry.requestId}]` : "";
    return `[${entry.timestamp}] [${entry.level.toUpperCase()}]${userStr}${reqStr} ${entry.message}${contextStr}`;
}

export function log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    userId?: string,
    requestId?: string
) {
    const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        context,
        userId,
        requestId,
    };

    addToBuffer(entry);

    const formatted = formatLogEntry(entry);

    switch (level) {
        case "debug":
            console.debug(formatted);
            break;
        case "info":
            console.info(formatted);
            break;
        case "warn":
            console.warn(formatted);
            break;
        case "error":
            console.error(formatted);
            break;
    }
}

export function logDebug(message: string, context?: Record<string, unknown>) {
    log("debug", message, context);
}

export function logInfo(message: string, context?: Record<string, unknown>) {
    log("info", message, context);
}

export function logWarn(message: string, context?: Record<string, unknown>) {
    log("warn", message, context);
}

export function logError(message: string, context?: Record<string, unknown>) {
    log("error", message, context);
}

/**
 * Get recent logs (for SuperAdmin debug endpoint).
 */
export function getRecentLogs(limit: number = 50): LogEntry[] {
    return logBuffer.slice(-limit);
}

