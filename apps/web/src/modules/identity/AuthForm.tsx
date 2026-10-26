'use client'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { Button, Input } from '@dance/ui'
import {
  registrationSchema,
  loginSchema,
  recoverySchema,
  resetPasswordSchema,
} from '@dance/contracts'
import type { Locale } from '@/shared/i18n/routes'
import { localizedPath } from '@/shared/i18n/routes'
import type { AuthResult } from './authService'
import styles from './AuthForm.module.scss'
export type AuthFormProps = {
  kind: 'login' | 'register' | 'forgot-password' | 'reset-password'
  locale: Locale
  next?: string
}
export function AuthForm({ kind, locale, next }: AuthFormProps) {
  const t = useTranslations('identity')
  const [state, setState] = useState<
    'idle' | 'loading' | 'pending' | 'success' | 'error'
  >('idle')
  const [error, setError] = useState('')
  const locked = useRef(false)
  const requestController = useRef<AbortController | null>(null)
  useEffect(() => () => requestController.current?.abort(), [])
  const feedback = useRef<HTMLParagraphElement>(null)
  const isPassword = kind !== 'forgot-password'
  const isConfirm = kind === 'register' || kind === 'reset-password'
  const action =
    kind === 'forgot-password'
      ? 'recover'
      : kind === 'reset-password'
      ? 'reset'
      : kind
  async function submit(form: HTMLFormElement, google = false) {
    if (locked.current) return
    const data = Object.fromEntries(new FormData(form))
    const schema =
      kind === 'register'
        ? registrationSchema
        : kind === 'login'
        ? loginSchema
        : kind === 'forgot-password'
        ? recoverySchema
        : resetPasswordSchema
    if (!google && !schema.safeParse(data).success) {
      setError('validation')
      setState('error')
      queueMicrotask(() => feedback.current?.focus())
      return
    }
    locked.current = true
    setState('loading')
    setError('')
    const controller = new AbortController()
    requestController.current = controller
    try {
      const response = await fetch(
        '/api/auth/' + (google ? 'google' : action),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...(google ? {} : data), locale, next }),
          signal: controller.signal,
          credentials: 'same-origin',
        }
      )
      const result: AuthResult = await response.json()
      if (result.status === 'error') {
        setError(result.error ?? 'unavailable')
        setState('error')
        locked.current = false
      } else if (result.url) {
        window.location.assign(result.url)
      } else {
        form.reset()
        setState(result.status === 'pending' ? 'pending' : 'success')
      }
    } catch {
      if (controller.signal.aborted) return
      setError('unavailable')
      setState('error')
      locked.current = false
    }
    queueMicrotask(() => feedback.current?.focus())
  }
  const busy = state === 'loading'
  const completed = state === 'pending' || state === 'success'
  return (
    <form
      className={styles.form}
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        void submit(event.currentTarget)
      }}
      aria-busy={busy}
    >
      <fieldset disabled={busy || completed} className={styles.fields}>
        {kind !== 'reset-password' && (
          <Input
            id="auth-email"
            name="email"
            type="email"
            autoComplete="email"
            label={t('email')}
            required
            maxLength={254}
          />
        )}
        {isPassword && (
          <Input
            id="auth-password"
            name="password"
            type="password"
            autoComplete={
              kind === 'login' ? 'current-password' : 'new-password'
            }
            label={t('password')}
            description={kind === 'login' ? undefined : t('passwordHint')}
            required
            minLength={kind === 'login' ? 1 : 8}
            maxLength={128}
          />
        )}
        {isConfirm && (
          <Input
            id="auth-confirm"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            label={t('confirmPassword')}
            required
            maxLength={128}
          />
        )}
        <Button type="submit" loading={busy}>
          {t(action)}
        </Button>
        {(kind === 'login' || kind === 'register') && (
          <Button
            type="submit"
            formNoValidate
            variant="secondary"
            onClick={(event) => {
              const form = event.currentTarget.form
              if (form) {
                event.preventDefault()
                void submit(form, true)
              }
            }}
          >
            {t('google')}
          </Button>
        )}
      </fieldset>
      {state === 'error' && (
        <p ref={feedback} tabIndex={-1} role="alert">
          {t(
            [
              'validation',
              'credentials',
              'invalidLink',
              'rateLimit',
              'passwordPolicy',
            ].includes(error)
              ? error
              : 'unavailable'
          )}
        </p>
      )}
      {(busy || completed) && (
        <p ref={feedback} tabIndex={-1} role="status">
          {t(
            busy
              ? 'loading'
              : kind === 'register'
              ? 'confirmationPending'
              : kind === 'forgot-password'
              ? 'recoveryPending'
              : 'resetSuccess'
          )}
        </p>
      )}
      <div className={styles.links}>
        {kind === 'login' && (
          <>
            <a href={localizedPath(locale, '/forgot-password')}>
              {t('forgot')}
            </a>
            <a href={localizedPath(locale, '/register')}>{t('register')}</a>
          </>
        )}
        {kind !== 'login' && (
          <a href={localizedPath(locale, '/login')}>{t('backLogin')}</a>
        )}
        {state === 'success' && (
          <a href={localizedPath(locale, '/account')}>{t('account')}</a>
        )}
      </div>
    </form>
  )
}
