'use client'
import { useEffect, useRef, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Button, Input, Badge } from '@dance/ui'
import {
  ownProfileSchema,
  profileFormPatchSchema,
  profileCompletionSchema,
} from '@dance/contracts'
import { publicProfilePath, localizedPath } from '@/shared/i18n/routes'
import type { OwnProfile } from '@dance/contracts'
import styles from './ProfileEditor.module.scss'
import { AvatarEditor } from './AvatarEditor'
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
  onCompleted,
}: {
  initialProfile: OwnProfile
  initialEtag: string
  onCompleted?: () => void
}) {
  const t = useTranslations('profile')
  const locale = useLocale()
  const [current, setCurrent] = useState({
    profile: initialProfile,
    etag: initialEtag,
  })
  const [draft, setDraft] = useState(() => fields(initialProfile))
  const [state, setState] = useState<State>({ kind: 'idle' })
  const [different, setDifferent] = useState(false)
  const [reloadReason, setReloadReason] = useState<
    'outcome_unknown' | 'revision_conflict' | null
  >(null)
  const needsReload = reloadReason !== null
  const [avatarBusy, setAvatarBusy] = useState(false)
  const locked = useRef(false)
  const controller = useRef<AbortController | null>(null)
  const feedback = useRef<HTMLParagraphElement>(null)
  useEffect(() => () => controller.current?.abort(), [])
  useEffect(() => {
    if (state.kind === 'error' || state.kind === 'success')
      feedback.current?.focus()
  }, [state])
  const busy = state.kind === 'loading' || avatarBusy
  const completing = !current.profile.completed
  async function request(reload = false) {
    if (locked.current || avatarBusy || (!reload && needsReload)) return
    const parsed = (
      completing ? profileCompletionSchema : profileFormPatchSchema
    ).safeParse(draft)
    if (!reload && !parsed.success) {
      setState({
        kind: 'error',
        code: completing ? 'completion_required' : 'validation_failed',
      })
      return
    }
    locked.current = true
    const owned = new AbortController()
    controller.current = owned
    setState({ kind: 'loading' })
    try {
      const response = await fetch(
        reload
          ? '/api/v1/me'
          : completing
          ? '/api/v1/me/profile/complete'
          : '/api/v1/me/profile',
        {
          method: reload ? 'GET' : completing ? 'POST' : 'PATCH',
          credentials: 'same-origin',
          cache: 'no-store',
          signal: owned.signal,
          ...(reload
            ? {}
            : {
                headers: {
                  'Content-Type': 'application/json',
                  'If-Match': current.etag,
                  ...(completing
                    ? {
                        'If-Match-Privacy':
                          '"privacy-' + current.profile.privacy.revision + '"',
                      }
                    : {}),
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
        if (code === 'outcome_unknown') setReloadReason('outcome_unknown')
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
      if (reload) setReloadReason(null)
      setState({ kind: 'success' })
      if (completing && profile.completed) onCompleted?.()
    } catch {
      if (!owned.signal.aborted) {
        if (!reload) setReloadReason('outcome_unknown')
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
    'completion_required',
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
      <Badge>
        {t(completing ? 'incomplete' : current.profile.privacy.visibility)}
      </Badge>
      {completing && <p>{t('completionNotice')}</p>}
      <AvatarEditor
        profile={current.profile}
        etag={current.etag}
        disabled={state.kind === 'loading'}
        needsReload={needsReload}
        onChange={(result) => {
          const previous = fields(current.profile)
          if (
            Object.entries(fields(result.profile)).some(
              ([key, value]) => previous[key as keyof typeof previous] !== value
            )
          ) {
            setReloadReason('revision_conflict')
            setState({ kind: 'error', code: 'revision_conflict' })
          }
          setCurrent(result)
        }}
        onNeedsReload={() => setReloadReason('outcome_unknown')}
        onBusyChange={(value) => {
          setAvatarBusy(value)
          if (value) setState({ kind: 'idle' })
        }}
      />
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
          required
        />
        <Input
          id="profile-display-name"
          label={t('displayName')}
          value={draft.displayName}
          onChange={(event) =>
            setDraft({ ...draft, displayName: event.target.value })
          }
          autoComplete="nickname"
          required
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
            {t(completing ? 'complete' : 'save')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setDraft(fields(current.profile))
              setState(
                reloadReason
                  ? { kind: 'error', code: reloadReason }
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
      {(state.kind === 'loading' || state.kind === 'success') && (
        <p ref={feedback} role="status" tabIndex={-1}>
          {t(
            state.kind === 'loading'
              ? 'loading'
              : different
              ? 'currentChanged'
              : 'saved'
          )}
        </p>
      )}
      {current.profile.completed && current.profile.username && (
        <p>
          <a
            href={localizedPath(
              locale,
              publicProfilePath(current.profile.username)
            )}
          >
            {t('viewPublic')}
          </a>
        </p>
      )}
    </form>
  )
}
