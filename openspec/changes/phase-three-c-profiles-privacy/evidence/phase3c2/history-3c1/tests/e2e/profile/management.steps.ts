import { createBdd } from 'playwright-bdd'
import { expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { expectAccessible } from '../helpers/a11y'
const { Given, When, Then, After } = createBdd()
const result = spawnSync(
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
if (result.status !== 0)
  throw new Error('Profile browser fixtures require local Supabase')
const local = JSON.parse(result.stdout)
if (
  !['localhost', '127.0.0.1', '[::1]'].includes(new URL(local.API_URL).hostname)
)
  throw new Error('Only loopback fixtures allowed')
const admin = createClient(
  local.API_URL,
  local.SECRET_KEY ?? local.SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
)
let ownerId = ''
After(async () => {
  if (ownerId) {
    expect((await admin.auth.admin.deleteUser(ownerId)).error).toBeNull()
    ownerId = ''
  }
})
Given('a verified profile owner', async ({ page }) => {
  const email = 'profile-browser-' + randomUUID() + '@example.test'
  const password = 'Local-' + randomUUID() + '!'
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  expect(created.error).toBeNull()
  ownerId = created.data.user!.id
  await page.goto('/en/login')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Log in', exact: true }).click()
  await expect(page).toHaveURL(/\/en\/account$/)
  await page.getByRole('link', { name: 'My Profile', exact: true }).click()
  await expect(page).toHaveURL(/\/en\/account\/profile$/)
})
When('the owner edits their profile and switches locale', async ({ page }) => {
  await page
    .getByLabel('Username', { exact: true })
    .fill('P' + randomUUID().replaceAll('-', '').slice(0, 18))
  await page.getByLabel('Display name', { exact: true }).fill('Танцор')
  await page
    .getByLabel('Bio', { exact: true })
    .fill('Private draft <script>literal</script>')
  const save = page.getByRole('button', { name: 'Save profile', exact: true })
  await save.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('status')).toHaveText(
    'Profile saved. Current server data is displayed.'
  )
  await expect(page.getByRole('status')).toBeFocused()
  await expectAccessible(page)
  await page.getByRole('link', { name: 'Language: Русский' }).click()
  await expect(page).toHaveURL(/\/ru\/account\/profile$/)
})
Then(
  'the localized owner route remains accessible and private',
  async ({ page, context, browser }) => {
    await expect(
      page.getByRole('heading', { name: 'Мой профиль', exact: true })
    ).toBeVisible()
    await expect(page.getByLabel('Отображаемое имя')).toHaveValue('Танцор')
    await expect(
      page.getByText(/старое имя сразу станет доступно/)
    ).toBeVisible()
    expect(
      await page.locator('meta[name="robots"]').getAttribute('content')
    ).toContain('noindex')
    await page.setViewportSize({ width: 320, height: 800 })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true)
    await expectAccessible(page)
    const data = await context.request.get('/api/v1/me')
    expect(data.status()).toBe(200)
    expect(data.headers()['cache-control']).toContain('no-store')
    expect(data.headers()['etag']).toMatch(/^"profile-[1-9][0-9]*"$/)
    const text = await data.text()
    expect(text).not.toMatch(/email|avatar_path|deletion_requested_at/)
    const noScript = await browser.newContext({
      javaScriptEnabled: false,
      storageState: await context.storageState(),
    })
    try {
      const view = await noScript.newPage()
      const response = await view.goto(
        'http://127.0.0.1:4310/ru/account/profile'
      )
      expect(response?.headers()['cache-control']).toContain('no-store')
      await expect(view.getByLabel('Отображаемое имя')).toHaveValue('Танцор')
    } finally {
      await noScript.close()
    }
    const guest = await browser.newContext()
    try {
      const view = await guest.newPage()
      await view.goto('http://127.0.0.1:4310/en/account/profile')
      await expect(view).toHaveURL(/\/en\/login\?next=/)
      expect(
        (await guest.request.get('http://127.0.0.1:4310/api/v1/me')).status()
      ).toBe(401)
    } finally {
      await guest.close()
    }
  }
)
