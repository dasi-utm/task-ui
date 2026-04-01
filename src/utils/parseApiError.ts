/**
 * Parse API error responses into a human-readable message.
 *
 * The API returns: { error: "Validation failed", details: { field: ["msg1", "msg2"] } }
 * This extracts the detail messages so the user sees what actually went wrong.
 */
export function parseApiError(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { error?: string; details?: Record<string, string[]> } } })
    ?.response?.data;

  if (!data) return fallback;

  if (data.details && typeof data.details === 'object') {
    const messages = Object.values(data.details).flat();
    if (messages.length > 0) return messages.join('. ');
  }

  return data.error || fallback;
}
