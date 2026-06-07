export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 8000,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export function readableFetchError(error: unknown): string {
  if (error instanceof Error) {
    const cause = error.cause as { code?: string } | undefined;
    return cause?.code || error.name || error.message;
  }
  return "network error";
}
