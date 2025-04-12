import { ActionFunctionArgs, data } from "@remix-run/node";
import { logError } from "~/models/server/error.model.server";
import { connectToDatabase } from "~/utils/server/db.server";

const errorCache = new Map();
const ERROR_CACHE_TTL = 5000;

function isDuplicateError(errorObj: any) {
  const key = `${errorObj.type}:${errorObj.message}`;
  const now = Date.now();

  // Check if we've seen this error recently
  if (errorCache.has(key)) {
    const lastTime = errorCache.get(key);
    if (now - lastTime < ERROR_CACHE_TTL) {
      return true;
    }
  }

  errorCache.set(key, now);

  // Clean old entries periodically
  if (errorCache.size > 100) {
    for (const [k, time] of errorCache.entries()) {
      if (now - time > ERROR_CACHE_TTL) {
        errorCache.delete(k);
      }
    }
  }

  return false;
}

// Handle POST requests to log errors from client-side
export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return Response.json(
      { success: false, message: "Method not allowed" },
      { status: 405 }
    );
  }

  try {
    // Connect to database
    await connectToDatabase();

    // Parse the request body
    const payload = await request.json();

    // Create an error object from the payload
    const error = new Error(payload.message || "Unknown client-side error");
    error.stack = payload.stack;
    error.name = payload.type || "Error";

    // Log the error
    await logError(error, request);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to log client-side error:", error);
    return Response.json(
      { success: false, message: "Failed to log error" },
      { status: 500 }
    );
  }
};

// Handle GET requests
export const loader = async () => {
  return Response.json({ message: "POST route only" }, { status: 405 });
};

export function getErrorType(error: any) {
  // If the error already has a name property, use that
  if (error.name && error.name !== "Error") {
    return error.name;
  }

  // Try to get the constructor name
  if (
    error.constructor &&
    error.constructor.name &&
    error.constructor.name !== "Error"
  ) {
    return error.constructor.name;
  }

  // For React Router errors
  if (error.status === 404) {
    return "NotFoundError";
  }

  if (error.status >= 400 && error.status < 500) {
    return "ClientError";
  }

  if (error.status >= 500) {
    return "ServerError";
  }

  // Try to infer type from the message
  const message = error.message || "";
  if (message.includes("fetch") || message.includes("network")) {
    return "NetworkError";
  }

  if (message.includes("timeout") || message.includes("timed out")) {
    return "TimeoutError";
  }

  if (message.includes("permission") || message.includes("access")) {
    return "PermissionError";
  }

  // Check for common syntax error patterns
  if (message.includes("syntax") || message.includes("unexpected token")) {
    return "SyntaxError";
  }

  // Default to general Error
  return "ApplicationError";
}
