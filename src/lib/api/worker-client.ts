/** Placeholder for Cloudflare Worker (or other) API client wiring. */
export async function workerFetch(path: string, init?: RequestInit): Promise<Response> {
  void path
  void init
  throw new Error('worker-client: not configured')
}
