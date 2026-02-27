// API response helpers for route handlers

export function json<T>(data: T, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status: init.status ?? 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...init.headers,
    },
  });
}

export function jsonError(
  status: number,
  message: string,
  extra?: Record<string, unknown>
): Response {
  return json({ error: message, ...extra }, { status });
}

export function badRequest(message = "Bad Request"): Response {
  return jsonError(400, message);
}

export function unauthorized(message = "Unauthorized"): Response {
  return jsonError(401, message);
}

export function forbidden(message = "Forbidden"): Response {
  return jsonError(403, message);
}

export function notFound(message = "Not Found"): Response {
  return jsonError(404, message);
}

export function serverError(message = "Internal Server Error"): Response {
  return jsonError(500, message);
}

export function tooManyRequests(
  retryAfterMs: number,
  remaining: number = 0,
  limit: number = 0,
  message = "Too many requests. Please wait a moment and try again."
): Response {
  const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
  return new Response(JSON.stringify({ error: message }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Retry-After": String(retryAfterSeconds),
      "X-RateLimit-Limit": String(limit),
      "X-RateLimit-Remaining": String(remaining),
    },
  });
}

