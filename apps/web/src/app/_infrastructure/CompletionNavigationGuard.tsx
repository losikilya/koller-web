'use client'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { completionRedirect } from './completionPolicy'
export function CompletionNavigationGuard({
  enabled,
  children,
}: {
  enabled: boolean
  children: ReactNode
}) {
  const pathname = usePathname()
  const t = useTranslations('profile')
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (!enabled || !completionRedirect(pathname, false)) {
      setFailed(false)
      return
    }
    let current: AbortController | undefined
    async function check() {
      const recovery =
        new URLSearchParams(window.location.search).get('bootstrap') === 'retry'
      if (!completionRedirect(pathname, false, recovery)) {
        setFailed(false)
        return
      }
      current?.abort()
      const owned = new AbortController()
      current = owned

      try {
        const response = await fetch('/api/v1/me/completion', {
          cache: 'no-store',
          credentials: 'same-origin',
          signal: owned.signal,
        })
        if (owned.signal.aborted) return
        if (response.status === 401) {
          setFailed(false)
          return
        }
        const body: unknown = await response.json()
        if (owned.signal.aborted) return
        if (
          response.ok &&
          typeof body === 'object' &&
          body !== null &&
          'authenticated' in body &&
          body.authenticated === false
        ) {
          setFailed(false)
          return
        }
        if (
          !response.ok ||
          typeof body !== 'object' ||
          body === null ||
          !('completed' in body) ||
          typeof body.completed !== 'boolean'
        )
          throw new Error('Completion unavailable')
        const target = completionRedirect(pathname, body.completed, recovery)
        if (target) {
          window.location.replace(target)
          return
        }
        setFailed(false)
      } catch {
        if (!owned.signal.aborted) setFailed(true)
      }
    }
    void check()
    const revisit = () => {
      void check()
    }
    window.addEventListener('pageshow', revisit)
    window.addEventListener('popstate', revisit)
    return () => {
      current?.abort()
      window.removeEventListener('pageshow', revisit)
      window.removeEventListener('popstate', revisit)
    }
  }, [enabled, pathname])
  if (failed) return <p role="alert">{t('publicServiceUnavailable')}</p>
  return children
}
