import { createBdd } from 'playwright-bdd'
import { expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { expectAccessible } from '../helpers/a11y'
const { Given, When, Then, After } = createBdd()
const status = spawnSync(
  process.execPath,
  [
    createRequire(process.cwd() + '/package.json').resolve(
      'supabase/dist/supabase.js'
    ),
    'status',
    '-o',
    'json',
  ],
  { encoding: 'utf8', timeout: 30000 }
)
if (status.status !== 0)
  throw new Error('Completion browser acceptance requires local Supabase')
const local = JSON.parse(status.stdout)
if (
  !['localhost', '127.0.0.1', '[::1]'].includes(new URL(local.API_URL).hostname)
)
  throw new Error('Loopback fixtures only')
const options = { auth: { persistSession: false, autoRefreshToken: false } }
const admin = createClient(
  local.API_URL,
  local.SECRET_KEY ?? local.SERVICE_ROLE_KEY,
  options
)
const ids: string[] = []
type Fixture = {
  id: string
  email: string
  password: string
  client: ReturnType<typeof createClient>
}
let owner: Fixture, other: Fixture, legacy: Fixture
let username = '',
  claimed = '',
  legacyName = ''
const displayName = 'Owner <script>window.profilePwned=true</script>'
async function fixture(): Promise<Fixture> {
  const email = 'completion-browser-' + randomUUID() + '@example.test',
    password = 'Local-' + randomUUID() + '!'
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  expect(created.error).toBeNull()
  const id = created.data.user!.id
  ids.push(id)
  const client = createClient(
    local.API_URL,
    local.PUBLISHABLE_KEY ?? local.ANON_KEY,
    options
  )
  expect(
    (await client.auth.signInWithPassword({ email, password })).error
  ).toBeNull()
  expect((await client.rpc('ensure_profile')).error).toBeNull()
  return { id, email, password, client }
}
function fixtureSql(id: string, statement: string) {
  expect(id).toMatch(/^[a-f0-9-]{36}$/)
  const result = spawnSync(
    'docker',
    [
      'exec',
      'supabase_db_dance-platform',
      'psql',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-v',
      'ON_ERROR_STOP=1',
      '-c',
      statement,
    ],
    { encoding: 'utf8', timeout: 30000 }
  )
  expect(result.status).toBe(0)
}
After(async () => {
  for (const id of ids.splice(0))
    expect((await admin.auth.admin.deleteUser(id)).error).toBeNull()
})
Given('a new authenticated incomplete account', async ({ page }) => {
  owner = await fixture()
  other = await fixture()
  legacy = await fixture()
  username = 'n' + randomUUID().replaceAll('-', '').slice(0, 18)
  claimed = 'o' + randomUUID().replaceAll('-', '').slice(0, 18)
  legacyName = 'l' + randomUUID().replaceAll('-', '').slice(0, 18)
  expect(
    (
      await other.client.rpc('complete_own_profile', {
        p_patch: { username: claimed, displayName: 'Other' },
        p_expected_profile_revision: '1',
        p_expected_privacy_revision: '1',
      })
    ).error
  ).toBeNull()
  expect(
    (
      await legacy.client.rpc('update_own_profile', {
        p_patch: { username: legacyName, displayName: 'Secret provisional' },
        p_expected_revision: '1',
      })
    ).error
  ).toBeNull()
  await page.goto('/en')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.goto('/en/login?next=%2Fen%2Fplayground')
  await page.getByLabel('Email', { exact: true }).fill(owner.email)
  await page.getByLabel('Password', { exact: true }).fill(owner.password)
  await page.getByRole('button', { name: 'Log in', exact: true }).click()
  await expect(page).toHaveURL(/\/en\/account\/profile$/)
  await expect(
    page.getByRole('button', { name: 'Complete public profile' })
  ).toBeVisible()
  await page.goBack()
  await expect(page).toHaveURL(/\/en\/account\/profile$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/en\/account\/profile$/)
})
When(
  'the account attempts refresh manual and history navigation before completing',
  async ({ page, context }) => {
    await page.reload()
    await expect(page).toHaveURL(/\/en\/account\/profile$/)
    for (const path of [
      '/en/playground',
      '/en/account',
      '/en/u/' + claimed,
      '/ru/playground/practice-timer',
    ]) {
      await page.goto(path)
      await expect(page).toHaveURL(/\/(en|ru)\/account\/profile$/)
    }
    const rsc = await context.request.get('/en/playground', {
      headers: { RSC: '1', 'Next-Router-Prefetch': '1' },
      maxRedirects: 0,
    })
    expect(rsc.status()).toBe(307)
    expect(rsc.headers()['location']).toContain('/en/account/profile')
    expect(rsc.headers()['cache-control']).toContain('no-store')
    expect((await context.request.get('/api/v1/me/completion')).status()).toBe(
      200
    )
    await page.goto('/ru/account?bootstrap=retry')
    await expect(page.getByRole('main').getByRole('alert')).toBeVisible()
    await page
      .getByRole('button', { name: 'Повторить создание профиля' })
      .click()
    await expect(page).toHaveURL(/\/ru\/account\/profile$/)
    await page
      .getByRole('button', { name: 'Завершить публичный профиль' })
      .click()
    await expect(page.getByRole('main').getByRole('alert')).toContainText(
      'имя пользователя'
    )
    await expect(page.getByRole('main').getByRole('alert')).toBeFocused()
    await expectAccessible(page)
  }
)
When('the owner explicitly completes the public profile', async ({ page }) => {
  await page.getByLabel('Имя пользователя', { exact: true }).fill(claimed)
  await page.getByLabel('Отображаемое имя', { exact: true }).fill(displayName)
  await page
    .getByRole('button', { name: 'Завершить публичный профиль' })
    .click()
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'недоступно'
  )
  await expect(
    page.getByLabel('Отображаемое имя', { exact: true })
  ).toHaveValue(displayName)
  await page.getByLabel('Имя пользователя', { exact: true }).fill(username)
  await page
    .getByRole('button', { name: 'Завершить публичный профиль' })
    .focus()
  await page.keyboard.press('Enter')
  await expect(
    page.getByRole('button', { name: 'Сохранить профиль' })
  ).toBeVisible()
  await expect(page.getByRole('status')).toContainText('сохранён')
  await page.getByRole('link', { name: 'Посмотреть публичный профиль' }).click()
  await expect(page).toHaveURL('/ru/u/' + username)
})
Then(
  'public EN and RU profile pages are safe accessible unindexed SSR',
  async ({ page, context, browser }) => {
    await expect(
      page.getByRole('heading', { name: displayName, exact: true })
    ).toBeVisible()
    expect(await page.evaluate(() => 'profilePwned' in window)).toBe(false)
    await expectAccessible(page)
    await page.setViewportSize({ width: 320, height: 800 })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true)
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.getByRole('link', { name: /Язык: English/ }).click()
    await expect(page).toHaveURL('/en/u/' + username)
    const guest = await browser.newContext({ javaScriptEnabled: false })
    try {
      const view = await guest.newPage()
      const response = await view.goto('http://127.0.0.1:4310/ru/u/' + username)
      expect(response?.status()).toBe(200)
      expect(response?.headers()['cache-control']).toContain('no-store')
      expect(response?.headers()['x-robots-tag']).toBe('noindex, nofollow')
      await expect(
        view.getByRole('heading', { name: displayName, exact: true })
      ).toBeVisible()
      expect(
        await view.locator('link[rel="canonical"]').getAttribute('href')
      ).toBe('http://127.0.0.1:4310/ru/u/' + username)
      expect(
        await view.locator('meta[name="robots"]').getAttribute('content')
      ).toMatch(/noindex.*nofollow/)
      expect(
        await view
          .locator('link[rel="alternate"][hreflang="en"]')
          .getAttribute('href')
      ).toContain('/en/u/' + username)
      for (const path of ['/en/u/' + legacyName, '/en/u/not_a_profile']) {
        const missing = await guest.request.get('http://127.0.0.1:4310' + path)
        expect(missing.status()).toBe(404)
        expect(missing.headers()['x-robots-tag']).toBe('noindex, nofollow')
        const body = await missing.text()
        expect(body).not.toContain('Secret provisional')
        expect(body).not.toContain(legacy.email)
      }
      fixtureSql(
        legacy.id,
        `update public.profile_privacy set visibility='public' where user_id='${legacy.id}';`
      )
      expect(
        (
          await guest.request.get('http://127.0.0.1:4310/en/u/' + legacyName)
        ).status()
      ).toBe(404)
      expect(
        (
          await legacy.client.rpc('get_public_profile_by_username', {
            p_username: legacyName,
          })
        ).data
      ).toEqual([])
      fixtureSql(
        other.id,
        `delete from public.profile_privacy where user_id='${other.id}';`
      )
      expect(
        (
          await guest.request.get('http://127.0.0.1:4310/en/u/' + claimed)
        ).status()
      ).toBe(404)
      expect((await other.client.rpc('ensure_profile')).error).toBeNull()
      fixtureSql(
        other.id,
        `update public.profiles set deletion_requested_at=now() where user_id='${other.id}';`
      )
      expect(
        (
          await guest.request.get('http://127.0.0.1:4310/en/u/' + claimed)
        ).status()
      ).toBe(404)
      const body = await response!.text()
      expect(body).not.toContain(owner.email)
      expect(body).not.toMatch(
        /avatar_path|completed_at|deletion_requested_at|user_preferences/
      )
      const rsc = await guest.request.get(
        'http://127.0.0.1:4310/en/u/' + username,
        { headers: { RSC: '1' } }
      )
      expect(rsc.headers()['cache-control']).toContain('no-store')
      expect(await rsc.text()).not.toContain(owner.email)
    } finally {
      await guest.close()
    }
    await page.getByRole('button', { name: 'Log out', exact: true }).click()
    await page.goto('/en/login?next=%2Fen%2Fplayground')
    await page.getByLabel('Email', { exact: true }).fill(owner.email)
    await page.getByLabel('Password', { exact: true }).fill(owner.password)
    await page.getByRole('button', { name: 'Log in', exact: true }).click()
    await expect(page).toHaveURL('/en/playground')
    await page.goto('/en/account/profile')
    await expect(
      page.getByRole('button', { name: 'Save profile' })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Complete public profile' })
    ).toHaveCount(0)
    expect((await context.request.get('/api/v1/me/completion')).status()).toBe(
      200
    )
  }
)
