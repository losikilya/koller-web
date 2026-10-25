import type { ComponentProps, HTMLAttributes, ReactNode } from 'react'
import styles from './Primitives.module.scss'
export { Dialog } from './Dialog'
export { Tabs } from './Tabs'
export type { DialogProps } from './Dialog'
export type { TabItem, TabsProps } from './Tabs'
export type ButtonOptions = {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'small' | 'medium'
}
export type ButtonProps = ComponentProps<'button'> &
  ButtonOptions & { loading?: boolean }
export function buttonClassName({
  variant = 'primary',
  size = 'medium',
}: ButtonOptions = {}) {
  return [styles.button, styles[variant], styles[size]].join(' ')
}
export function Button({
  type = 'button',
  className = '',
  variant,
  size,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClassName({ variant, size }) + ' ' + className}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  )
}
export function IconButton({
  'aria-label': label,
  className = '',
  children,
  ...props
}: Omit<ButtonProps, 'aria-label'> & { 'aria-label': string }) {
  return (
    <Button
      {...props}
      aria-label={label}
      className={styles.iconButton + ' ' + className}
    >
      <span aria-hidden="true">{children}</span>
    </Button>
  )
}
export type InputProps = Omit<ComponentProps<'input'>, 'id'> & {
  id: string
  label: string
  error?: string
  description?: string
}
export function Input({
  id,
  label,
  error,
  description,
  className = '',
  'aria-describedby': describedBy,
  ...props
}: InputProps) {
  const descriptionId = description ? id + '-description' : undefined
  const errorId = error ? id + '-error' : undefined
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <input
        {...props}
        id={id}
        className={styles.input + ' ' + className}
        aria-invalid={error ? true : props['aria-invalid']}
        aria-describedby={
          [describedBy, descriptionId, errorId].filter(Boolean).join(' ') ||
          undefined
        }
      />
      {description && (
        <p id={descriptionId} className={styles.description}>
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
}
export function Card({
  className = '',
  ...props
}: HTMLAttributes<HTMLElement>) {
  return <article {...props} className={styles.card + ' ' + className} />
}
export function Badge({
  className = '',
  tone = 'accent',
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: 'accent' | 'neutral' | 'danger' | 'success'
}) {
  return (
    <span
      {...props}
      className={[styles.badge, styles[tone], className].join(' ')}
    />
  )
}
export function LoadingIndicator({ label }: { label: string }) {
  return (
    <span role="status" className={styles.loading}>
      <span className={styles.spinner} aria-hidden="true" />
      {label}
    </span>
  )
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <section aria-label={title} className={styles.empty}>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {action}
    </section>
  )
}
export function Container({
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={styles.container + ' ' + className} />
}
