// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { randomUUID, createHmac } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { expect, test } from 'vitest'
import {
  registerAccount,
  verifyEmail,
  loginAccount,
  logoutAccount,
  recoverPassword,
  resetPassword,
  bootstrapAccount,
  verifiedIdentity,
} from '@/modules/identity/authService'
import type { Database } from '@/shared/supabase/database'
import { capturedLink } from '../helpers/authMail'

test('real local Auth: confirmation, recovery, verified bootstrap, isolation and session revocation', async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    mailpit = process.env.AUTH_TEST_MAILPIT_URL!,
    adminKey = process.env.AUTH_TEST_ADMIN_KEY!
  expect(['127.0.0.1', 'localhost', '[::1]']).toContain(new URL(url).hostname)
  const fresh = () =>
    createClient<Database>(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  const admin = createClient<Database>(url, adminKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const client = fresh(),
    other = fresh()
  const email = 'phase3b-' + randomUUID() + '@example.test',
    password = 'Dance-' + randomUUID() + '!',
    nextPassword = 'Reset-' + randomUUID() + '!'
  const fixtureIds: string[] = [],
    mailIds: string[] = []
  try {
    expect(
      (
        await registerAccount(
          client,
          { email, password, confirmPassword: password },
          process.env.AUTH_SITE_URL + '/ru/auth/confirm'
        )
      ).status
    ).toBe('pending')
    expect((await client.auth.getSession()).data.session).toBeNull()
    const listing = await admin.auth.admin.listUsers({ perPage: 1000 })
    const user = listing.data.users.find((user) => user.email === email)
    expect(user).toBeTruthy()
    fixtureIds.push(user!.id)
    expect(
      execFileSync(
        'docker',
        [
          'exec',
          'supabase_db_dance-platform',
          'psql',
          '-U',
          'postgres',
          '-d',
          'postgres',
          '-tAc',
          "select count(*) from public.profiles where user_id='" +
            user!.id +
            "'::uuid",
        ],
        { encoding: 'utf8' }
      ).trim()
    ).toBe('0')
    expect((await loginAccount(client, { email, password })).error).toBe(
      'credentials'
    )
    const confirmation = await capturedLink(mailpit, email, 'signup')
    mailIds.push(confirmation.id)
    const confirmUrl = new URL(confirmation.url)
    expect(confirmUrl.pathname).toBe('/ru/auth/confirm')
    const hash = confirmUrl.searchParams.get('token_hash')!
    expect((await verifyEmail(client, hash, 'signup')).bootstrap).toBe('ready')
    expect((await verifyEmail(fresh(), hash, 'signup')).error).toBe(
      'invalidLink'
    )
    expect((await bootstrapAccount(client)).bootstrap).toBe('ready')
    const privacy = await client
      .from('profile_privacy')
      .select('visibility,discoverable')
    expect(privacy.data).toEqual([
      { visibility: 'private', discoverable: false },
    ])
    const second = await admin.auth.admin.createUser({
      email: 'phase3b-' + randomUUID() + '@example.test',
      password,
      email_confirm: true,
    })
    fixtureIds.push(second.data.user!.id)
    expect(
      (await loginAccount(other, { email: second.data.user!.email, password }))
        .status
    ).toBe('success')
    expect(
      (await other.from('profiles').select('user_id').eq('user_id', user!.id))
        .data
    ).toEqual([])
    expect(
      (
        await recoverPassword(
          client,
          { email },
          process.env.AUTH_SITE_URL + '/ru/auth/confirm'
        )
      ).status
    ).toBe('pending')
    const recovery = await capturedLink(mailpit, email, 'recovery')
    mailIds.push(recovery.id)
    const recoveryHash = new URL(recovery.url).searchParams.get('token_hash')!
    const resetClient = fresh()
    expect(
      (await verifyEmail(resetClient, recoveryHash, 'recovery')).status
    ).toBe('success')
    expect((await verifyEmail(fresh(), recoveryHash, 'recovery')).error).toBe(
      'invalidLink'
    )
    expect(
      (
        await resetPassword(resetClient, {
          password: nextPassword,
          confirmPassword: nextPassword,
        })
      ).status
    ).toBe('success')
    expect((await loginAccount(fresh(), { email, password })).error).toBe(
      'credentials'
    )
    const signedIn = fresh()
    expect(
      (await loginAccount(signedIn, { email, password: nextPassword })).status
    ).toBe('success')
    expect((await verifiedIdentity(signedIn))?.id).toBe(user!.id)
    const session = (await signedIn.auth.getSession()).data.session!
    expect((await logoutAccount(signedIn)).status).toBe('success')
    expect(await verifiedIdentity(signedIn)).toBeNull()
    expect(
      (
        await fresh().auth.refreshSession({
          refresh_token: session.refresh_token,
        })
      ).error
    ).toBeTruthy()
    expect(
      (
        await resetPassword(fresh(), {
          password: nextPassword,
          confirmPassword: nextPassword,
        })
      ).error
    ).toBe('invalidLink')
    expect(
      (await verifyEmail(fresh(), 'invalid-expired-token', 'recovery')).error
    ).toBe('invalidLink')
    expect(process.env.AUTH_TEST_JWT_SECRET).toBeTruthy()
    {
      const header = Buffer.from(
        JSON.stringify({ alg: 'HS256', typ: 'JWT' })
      ).toString('base64url')
      const payload = Buffer.from(
        JSON.stringify({
          sub: user!.id,
          role: 'authenticated',
          aud: 'authenticated',
          exp: 1,
        })
      ).toString('base64url')
      const signature = createHmac('sha256', process.env.AUTH_TEST_JWT_SECRET!)
        .update(header + '.' + payload)
        .digest('base64url')
      expect(
        (await fresh().auth.getUser(header + '.' + payload + '.' + signature))
          .error
      ).toBeTruthy()
    }
  } finally {
    for (const id of fixtureIds) {
      const result = await admin.auth.admin.deleteUser(id)
      expect(result.error).toBeNull()
    }
    if (mailIds.length)
      await fetch(mailpit + '/api/v1/messages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ IDs: mailIds }),
      })
  }
}, 30000)

test('real local email confirmation rejects an expired captured token', async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    mailpit = process.env.AUTH_TEST_MAILPIT_URL!
  expect(new URL(url).hostname).toBe('127.0.0.1')
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const admin = createClient<Database>(url, process.env.AUTH_TEST_ADMIN_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const email = 'phase3b-expired-' + randomUUID() + '@example.test',
    password = 'Dance-' + randomUUID() + '!'
  let id = '',
    mailId = ''
  try {
    expect(
      (
        await registerAccount(
          client,
          { email, password, confirmPassword: password },
          process.env.AUTH_SITE_URL + '/en/auth/confirm'
        )
      ).status
    ).toBe('pending')
    const users = await admin.auth.admin.listUsers({ perPage: 1000 })
    id = users.data.users.find((user) => user.email === email)!.id
    const mail = await capturedLink(mailpit, email, 'signup')
    mailId = mail.id
    execFileSync(
      'docker',
      [
        'exec',
        'supabase_db_dance-platform',
        'psql',
        '-U',
        'postgres',
        '-d',
        'postgres',
        '-tAc',
        "update auth.users set confirmation_sent_at=now()-interval '2 hours' where id='" +
          id +
          "'::uuid",
      ],
      { encoding: 'utf8' }
    )
    expect(
      (
        await verifyEmail(
          client,
          new URL(mail.url).searchParams.get('token_hash')!,
          'signup'
        )
      ).error
    ).toBe('invalidLink')
    expect(await verifiedIdentity(client)).toBeNull()
  } finally {
    if (id) await admin.auth.admin.deleteUser(id)
    if (mailId)
      await fetch(mailpit + '/api/v1/messages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ IDs: [mailId] }),
      })
  }
}, 30000)
