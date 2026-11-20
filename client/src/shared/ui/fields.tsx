import { useId } from 'react'
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/shared/lib'
import { Icon } from './icons'

type FieldProps = { label: string; hint?: string; error?: string }

function Field({ id, label, hint, error, children }: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className="t-field">
      <label htmlFor={id} className="t-field__label">{label}</label>
      {children}
      {error ? (
        <p id={`${id}-msg`} className="t-field__msg t-field__msg--error" role="alert">{error}</p>
      ) : (
        hint && <p id={`${id}-msg`} className="t-field__msg">{hint}</p>
      )}
    </div>
  )
}

const aria = (id: string, p: FieldProps) => ({
  'aria-invalid': p.error ? true : undefined,
  'aria-describedby': p.error || p.hint ? `${id}-msg` : undefined,
})

type InputProps = FieldProps & InputHTMLAttributes<HTMLInputElement> & { leading?: ReactNode }
export function Input({ label, hint, error, leading, className, id: idProp, ...rest }: InputProps) {
  const gen = useId()
  const id = idProp ?? gen
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <span className={cn('t-control', error && 't-control--error', className)}>
        {leading && <span className="t-control__lead">{leading}</span>}
        <input id={id} className="t-control__el" {...aria(id, { label, hint, error })} {...rest} />
      </span>
    </Field>
  )
}

type TextareaProps = FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>
export function Textarea({ label, hint, error, className, id: idProp, rows = 4, ...rest }: TextareaProps) {
  const gen = useId()
  const id = idProp ?? gen
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <span className={cn('t-control', error && 't-control--error', className)}>
        <textarea id={id} rows={rows} className="t-control__el t-control__el--area" {...aria(id, { label, hint, error })} {...rest} />
      </span>
    </Field>
  )
}

type SelectProps = FieldProps & SelectHTMLAttributes<HTMLSelectElement>
export function Select({ label, hint, error, className, id: idProp, children, ...rest }: SelectProps) {
  const gen = useId()
  const id = idProp ?? gen
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <span className={cn('t-control', error && 't-control--error', className)}>
        <select id={id} className="t-control__el t-control__el--select" {...aria(id, { label, hint, error })} {...rest}>{children}</select>
        <span className="t-control__chev"><Icon name="chevronDown" size={18} /></span>
      </span>
    </Field>
  )
}

type ToggleProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & { label: string }
export function Checkbox({ label, className, ...rest }: ToggleProps) {
  return (
    <label className={cn('t-check', className)}>
      <input type="checkbox" className="t-check__input" {...rest} />
      <span className="t-check__box"><Icon name="check" size={14} strokeWidth={3} /></span>
      <span>{label}</span>
    </label>
  )
}

export function Switch({ label, className, ...rest }: ToggleProps) {
  return (
    <label className={cn('t-switch', className)}>
      <input type="checkbox" role="switch" className="t-check__input" {...rest} />
      <span className="t-switch__track"><span className="t-switch__thumb" /></span>
      <span>{label}</span>
    </label>
  )
}
