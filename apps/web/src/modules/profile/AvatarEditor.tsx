'use client'
import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@dance/ui'
import { AVATAR_MAX_FILE_BYTES, ownProfileSchema } from '@dance/contracts'
import type { OwnProfile } from '@dance/contracts'
import type { AvatarResult } from './avatarService'
import styles from './ProfileEditor.module.scss'
export type AvatarEditorProps = {
  profile: OwnProfile
  etag: string
  disabled?: boolean
  needsReload?: boolean
  onChange(result: AvatarResult): void
  onNeedsReload(): void
  onBusyChange?(busy: boolean): void
}
type State =
  | { kind: 'idle' }
  | { kind: 'saved'; operation: 'upload' | 'remove' }
  | { kind: 'busy'; operation: 'upload' | 'remove' }
  | { kind: 'error'; code: string }
export function AvatarEditor({
  profile,
  etag,
  disabled,
  needsReload,
  onChange,
  onNeedsReload,
  onBusyChange,
}: AvatarEditorProps) {
  const t = useTranslations('profile'),
    [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState<string | null>(null),
    [state, setState] = useState<State>({ kind: 'idle' })
  const input = useRef<HTMLInputElement>(null),
    feedback = useRef<HTMLParagraphElement>(null),
    controller = useRef<AbortController | null>(null),
    locked = useRef(false),
    previous = useRef(profile)
  const busy = state.kind === 'busy',
    mustReload =
      needsReload ||
      (state.kind === 'error' && state.code === 'outcome_unknown')
  useEffect(() => () => controller.current?.abort(), [])
  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }
    const owned = URL.createObjectURL(file)
    setPreview(owned)
    return () => URL.revokeObjectURL(owned)
  }, [file])
  useEffect(() => {
    if (previous.current !== profile) {
      previous.current = profile
      setFile(null)
      if (input.current) input.current.value = ''
      setState((value) =>
        value.kind === 'saved' || value.kind === 'busy'
          ? value
          : { kind: 'idle' }
      )
    }
  }, [profile])
  useEffect(() => {
    if (state.kind === 'error' || state.kind === 'saved')
      feedback.current?.focus()
  }, [state])
  function cancelSelection() {
    setFile(null)
    if (input.current) input.current.value = ''
    setState((value) =>
      value.kind === 'error' && value.code === 'outcome_unknown'
        ? value
        : { kind: 'idle' }
    )
  }
  function select(value: File | null) {
    if (value && value.size > AVATAR_MAX_FILE_BYTES) {
      setFile(null)
      if (input.current) input.current.value = ''
      setState({
        kind: 'error',
        code: mustReload ? 'outcome_unknown' : 'payload_too_large',
      })
      return
    }
    setFile(value)
    setState((current) =>
      current.kind === 'error' && current.code === 'outcome_unknown'
        ? current
        : { kind: 'idle' }
    )
  }
  async function send(operation: 'upload' | 'remove') {
    if (
      locked.current ||
      disabled ||
      mustReload ||
      (operation === 'upload' && !file)
    )
      return
    if (file && file.size > AVATAR_MAX_FILE_BYTES) {
      setState({ kind: 'error', code: 'payload_too_large' })
      return
    }
    locked.current = true
    const owned = new AbortController()
    controller.current = owned
    setState({ kind: 'busy', operation })
    onBusyChange?.(true)
    try {
      const body = new FormData()
      if (file) body.set('file', file)
      const response = await fetch('/api/v1/me/avatar', {
        method: operation === 'upload' ? 'POST' : 'DELETE',
        credentials: 'same-origin',
        cache: 'no-store',
        signal: owned.signal,
        headers: {
          'If-Match': etag,
          'X-Avatar-Operation': crypto.randomUUID(),
        },
        ...(operation === 'upload' ? { body } : {}),
      })
      const json: unknown = await response.json()
      if (owned.signal.aborted) return
      if (!response.ok) {
        const code =
          typeof json === 'object' &&
          json !== null &&
          'error' in json &&
          typeof json.error === 'object' &&
          json.error !== null &&
          'code' in json.error &&
          typeof json.error.code === 'string'
            ? json.error.code
            : 'service_unavailable'
        if (code === 'outcome_unknown') onNeedsReload()
        setState({ kind: 'error', code })
        return
      }
      const value =
        typeof json === 'object' && json !== null && 'profile' in json
          ? json.profile
          : undefined
      const current = ownProfileSchema.parse(value),
        tag = response.headers.get('etag')
      if (tag !== '"profile-' + current.revision + '"')
        throw new Error('Invalid avatar response')
      onChange({ profile: current, etag: tag })
      setFile(null)
      if (input.current) input.current.value = ''
      setState({ kind: 'saved', operation })
    } catch {
      if (!owned.signal.aborted) {
        onNeedsReload()
        setState({ kind: 'error', code: 'outcome_unknown' })
      }
    } finally {
      locked.current = false
      onBusyChange?.(false)
    }
  }
  const labels: Record<string, string> = {
    payload_too_large: 'avatarTooLarge',
    invalid_image: 'avatarInvalid',
    revision_conflict: 'avatarConflict',
    outcome_unknown: 'avatarOutcomeUnknown',
    rate_limited: 'avatarRateLimited',
  }
  const error =
    state.kind === 'error' ? t(labels[state.code] ?? 'avatarUnavailable') : null
  return (
    <fieldset
      className={styles.fields}
      disabled={disabled || busy}
      aria-busy={busy}
    >
      <legend>{t('avatarLabel')}</legend>
      {profile.avatarUrl && (
        <img
          className={styles.avatarPhoto}
          src={profile.avatarUrl}
          alt={t('avatarCurrent')}
          width={96}
          height={96}
        />
      )}
      <label htmlFor="profile-avatar-file">{t('avatarLabel')}</label>
      <input
        ref={input}
        id="profile-avatar-file"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-describedby={error ? 'avatar-hint avatar-error' : 'avatar-hint'}
        aria-invalid={
          (state.kind === 'error' &&
            ['payload_too_large', 'invalid_image'].includes(state.code)) ||
          undefined
        }
        onChange={(event) => select(event.currentTarget.files?.[0] ?? null)}
      />
      <p id="avatar-hint">{t('avatarHint')}</p>
      {preview && (
        <img
          className={styles.avatarPhoto}
          src={preview}
          alt={t('avatarPreview')}
          width={96}
          height={96}
        />
      )}
      <div className={styles.actions}>
        <Button
          onClick={() => {
            void send('upload')
          }}
          disabled={!file || mustReload}
          loading={busy && state.operation === 'upload'}
        >
          {t('avatarUpload')}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            void send('remove')
          }}
          disabled={!profile.avatarUrl || mustReload}
          loading={busy && state.operation === 'remove'}
        >
          {t('avatarRemove')}
        </Button>
        <Button variant="ghost" onClick={cancelSelection}>
          {t('avatarCancel')}
        </Button>
      </div>
      {error && (
        <p id="avatar-error" role="alert" ref={feedback} tabIndex={-1}>
          {error}
        </p>
      )}
      {(busy || state.kind === 'saved') && (
        <p role="status" ref={feedback} tabIndex={-1}>
          {t(
            busy
              ? 'avatarLoading'
              : state.kind === 'saved' && state.operation === 'remove'
              ? 'avatarRemoved'
              : 'avatarSaved'
          )}
        </p>
      )}
    </fieldset>
  )
}
