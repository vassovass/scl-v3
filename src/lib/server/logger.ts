/**
 * Server-side structured logging utility for StepLeague.
 *
 * Outputs JSON-structured logs compatible with Vercel Log Drain.
 * SuperAdmins can access recent logs via debug endpoint.
 *
 * @see PRD 65: Structured Logging & Health Check
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: Record<string, unknown>;
    userId?: string;
    requestId?: string;
}

/**
 * JSON log line format for Vercel Log Drain compatibility.
 * All fields are top-level for easy querying in log aggregators.
 */
export interface StructuredLogLine {
    timestamp: string;
    level: LogLevel;
    message: string;
    userId?: string;
    requestId?: string;
    duration_ms?: number;
    code?: string;
    path?: string;
    method?: string;
    status?: number;
    [key: string]: unknown;
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

/**
 * Write a JSON-structured log line to console.
 * Merges context fields into the top-level object for flat querying.
 */
function writeStructuredLog(entry: LogEntry) {
    const line: StructuredLogLine = {
        timestamp: entry.timestamp,
        level: entry.level,
        message: entry.message,
    };

    if (entry.userId) line.userId = entry.userId;
    if (entry.requestId) line.requestId = entry.requestId;

    // Spread context into top-level for flat log querying
    if (entry.context) {
        Object.assign(line, entry.context);
    }

    const json = JSON.stringify(line);

    switch (entry.level) {
        case "debug":
            console.debug(json);
            break;
        case "info":
            console.info(json);
            break;
        case "warn":
            console.warn(json);
            break;
        case "error":
            console.error(json);
            break;
    }
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
    writeStructuredLog(entry);
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
