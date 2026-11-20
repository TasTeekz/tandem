import { i18next } from '@/shared/i18n'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

/** Translated, user-facing text for any thrown value; unknown codes fall back to the server message. */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return i18next.t(`errors.${err.code}`, { defaultValue: err.message || i18next.t('errors.internal_error') })
  return i18next.t('errors.network')
}
