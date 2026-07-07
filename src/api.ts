export function buildBaseUrl(host: string, port: number): string {
	const normalizedHost = String(host || '').trim()
	return `http://${normalizedHost}:${port}`
}

export async function fetchJson<T>(url: string, init?: RequestInit, timeoutMs = 8_000): Promise<T> {
	const controller = new AbortController()
	const abortSignal = init?.signal
	const onAbort = (): void => controller.abort()

	if (abortSignal) {
		if (abortSignal.aborted) controller.abort()
		else abortSignal.addEventListener('abort', onAbort, { once: true })
	}

	const timer = setTimeout(() => controller.abort(), timeoutMs)

	try {
		const response = await fetch(url, { ...init, signal: controller.signal })
		const text = await response.text()
		if (!response.ok) {
			throw new Error(`HTTP ${response.status} ${response.statusText}${text ? `: ${text}` : ''}`)
		}
		return (text ? JSON.parse(text) : {}) as T
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError' && !abortSignal?.aborted) {
			throw new Error(`Request timed out after ${timeoutMs}ms`)
		}
		throw error
	} finally {
		clearTimeout(timer)
		abortSignal?.removeEventListener('abort', onAbort)
	}
}

// QMapper commands are POST (optionally with a JSON body). Reads are GET.
export async function postCommand(baseUrl: string, path: string, body?: unknown): Promise<unknown> {
	const init: RequestInit = { method: 'POST' }
	if (body !== undefined) {
		init.body = JSON.stringify(body)
		init.headers = { 'Content-Type': 'application/json' }
	}
	return fetchJson<unknown>(`${baseUrl}${path}`, init)
}
