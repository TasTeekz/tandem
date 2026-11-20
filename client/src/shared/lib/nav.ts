/** Only same-origin relative paths are honoured for post-login redirects. */
export const safeNext = (next: string | null) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '/groups')
