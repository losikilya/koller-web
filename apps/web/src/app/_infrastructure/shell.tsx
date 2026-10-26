import type { ReactNode } from 'react'
import { Shell as ApplicationShell } from '@/shell/Shell'
import type { SupportedPath } from '@/shared/i18n/routes'
import { getSupabaseConfig } from '@/shared/supabase/config'
import { verifiedIdentity } from '@/modules/identity'
import { createSupabaseServerClient } from './supabase'
export async function Shell({
  path,
  children,
}: {
  path: SupportedPath
  children: ReactNode
}) {
  const identity = getSupabaseConfig()
    ? await verifiedIdentity(await createSupabaseServerClient()).catch(
        () => null
      )
    : null
  return (
    <ApplicationShell path={path} authenticated={Boolean(identity)}>
      {children}
    </ApplicationShell>
  )
}
