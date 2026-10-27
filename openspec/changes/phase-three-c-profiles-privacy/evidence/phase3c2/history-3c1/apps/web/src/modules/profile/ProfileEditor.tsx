'use client'
import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button, Input, Badge } from '@dance/ui'
import { ownProfileSchema, profileFormPatchSchema } from '@dance/contracts'
import type { OwnProfile } from '@dance/contracts'
import styles from './ProfileEditor.module.scss'
const fields = (profile: OwnProfile) => ({
  username: profile.username ?? '',
  displayName: profile.displayName,
  bio: profile.bio,
})
type State =
  | { kind: 'idle' | 'loading' | 'success' }
  | { kind: 'error'; code: string }
export function ProfileEditor({
  initialProfile,
  initialEtag,
}: {
  initialProfile: OwnProfile
  initialEtag: string
}) {
  const t = useTranslations('profile')
  const [current, setCurrent] = useState({
    profile: initialProfile,
    etag: initialEtag,
  })
  const [draft, setDraft] = useState(() => fields(initialProfile))
  const [state, setState] = useState<State>({ kind: 'idle' })
  const [different, setDifferent] = useState(false)
  const [needsReload, setNeedsReload] = useState(false)
  const locked = useRef(false)
  const controller = useRef<AbortController | null>(null)
  const feedback = useRef<HTMLParagraphElement>(null)
  useEffect(() => () => controller.current?.abort(), [])
  useEffect(() => {
    if (state.kind === 'error' || state.kind === 'success')
      feedback.current?.focus()
  }, [state])
  const busy = state.kind === 'loading'
  async function request(reload = false) {
    if (locked.current || (!reload && needsReload)) return
    const parsed = profileFormPatchSchema.safeParse(draft)
    if (!reload && !parsed.success) {
      setState({ kind: 'error', code: 'validation_failed' })
      return
    }
    locked.current = true
    const owned = new AbortController()
    controller.current = owned
    setState({ kind: 'loading' })
    try {
      const response = await fetch(
        reload ? '/api/v1/me' : '/api/v1/me/profile',
        {
          method: reload ? 'GET' : 'PATCH',
          credentials: 'same-origin',
          cache: 'no-store',
          signal: owned.signal,
          ...(reload
            ? {}
            : {
                headers: {
                  'Content-Type': 'application/json',
                  'If-Match': current.etag,
                },
                body: JSON.stringify(draft),
              }),
        }
      )
      const body: unknown = await response.json()
      if (owned.signal.aborted) return
      if (!response.ok) {
        const code =
          typeof body === 'object' &&
          body !== null &&
          'error' in body &&
          typeof body.error === 'object' &&
          body.error !== null &&
          'code' in body.error &&
          typeof body.error.code === 'string'
            ? body.error.code
            : 'service_unavailable'
        if (code === 'outcome_unknown') setNeedsReload(true)
        setState({ kind: 'error', code })
        return
      }
      const value =
        typeof body === 'object' && body !== null && 'profile' in body
          ? body.profile
          : undefined
      const profile = ownProfileSchema.parse(value)
      const etag = response.headers.get('etag')
      if (etag !== '"profile-' + profile.revision + '"')
        throw new Error('Invalid profile response')
      setDifferent(
        !reload &&
          parsed.success &&
          Object.entries(parsed.data).some(
            ([key, value]) =>
              profile[key as 'username' | 'displayName' | 'bio'] !== value
          )
      )
      setCurrent({ profile, etag })
      setDraft(fields(profile))
      if (reload) setNeedsReload(false)
      setState({ kind: 'success' })
    } catch {
      if (!owned.signal.aborted) {
        if (!reload) setNeedsReload(true)
        setState({
          kind: 'error',
          code: reload ? 'service_unavailable' : 'outcome_unknown',
        })
      }
    } finally {
      locked.current = false
    }
  }
  const code = state.kind === 'error' ? state.code : ''
  const knownErrors = [
    'validation_failed',
    'revision_conflict',
    'username_unavailable',
    'outcome_unknown',
    'unauthenticated',
    'account_unavailable',
    'bootstrap_incomplete',
  ]
  const error =
    state.kind === 'error'
      ? t(knownErrors.includes(code) ? code : 'service_unavailable')
      : undefined
  return (
    <form
      className={styles.form}
      aria-busy={busy}
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        void request()
      }}
    >
      <Badge>{t(current.profile.privacy.visibility)}</Badge>
      <p id="profile-warning">{t('renameWarning')}</p>
      <fieldset disabled={busy} className={styles.fields}>
        <legend>{t('edit')}</legend>
        <Input
          id="profile-username"
          label={t('username')}
          value={draft.username}
          onChange={(event) =>
            setDraft({ ...draft, username: event.target.value })
          }
          description={t('usernameHint')}
          aria-describedby={
            error ? 'profile-warning profile-error' : 'profile-warning'
          }
          aria-invalid={
            code === 'validation_failed' ||
            code === 'username_unavailable' ||
            undefined
          }
          autoComplete="username"
        />
        <Input
          id="profile-display-name"
          label={t('displayName')}
          value={draft.displayName}
          onChange={(event) =>
            setDraft({ ...draft, displayName: event.target.value })
          }
          autoComplete="nickname"
          aria-describedby={error ? 'profile-error' : undefined}
          aria-invalid={code === 'validation_failed' || undefined}
        />
        <label htmlFor="profile-bio">{t('bio')}</label>
        <textarea
          id="profile-bio"
          rows={6}
          value={draft.bio}
          onChange={(event) => setDraft({ ...draft, bio: event.target.value })}
          aria-describedby={
            error ? 'profile-bio-hint profile-error' : 'profile-bio-hint'
          }
          aria-invalid={code === 'validation_failed' || undefined}
        />
        <p id="profile-bio-hint">{t('bioHint')}</p>
        <div className={styles.actions}>
          <Button type="submit" loading={busy} disabled={needsReload}>
            {t('save')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setDraft(fields(current.profile))
              setState(
                needsReload
                  ? { kind: 'error', code: 'outcome_unknown' }
                  : { kind: 'idle' }
              )
            }}
          >
            {t('cancel')}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              void request(true)
            }}
          >
            {t('reload')}
          </Button>
        </div>
      </fieldset>
      {state.kind === 'error' && (
        <p id="profile-error" ref={feedback} role="alert" tabIndex={-1}>
          {error}
        </p>
      )}
      {(busy || state.kind === 'success') && (
        <p ref={feedback} role="status" tabIndex={-1}>
          {t(busy ? 'loading' : different ? 'currentChanged' : 'saved')}
        </p>
      )}
    </form>
  )
}
