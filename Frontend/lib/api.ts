const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    let msg = errorBody?.detail
    if (typeof msg === 'object' && msg !== null) {
      msg = msg.message || JSON.stringify(msg)
    }
    const err = new Error(msg ?? "Request failed") as any
    err.detail = errorBody?.detail
    throw err
  }

  return response.json() as Promise<T>
}
