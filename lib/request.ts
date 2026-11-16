/** JSON fetch that throws the server's own error message, so toasts say what went wrong. */
export async function request<T = unknown>(url: string, init: RequestInit | undefined, fallback: string): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || fallback);
  return json as T;
}

export const errorText = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);
