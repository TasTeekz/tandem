export const IS_DEV = import.meta.env.DEV
/** Full origin of the backend; the REST prefix is appended by the api client. */
export const API_ORIGIN: string = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:8000'
export const API_BASE = `${API_ORIGIN}/api/v1`
export const POLL_MS = 4000
