import { createBdd } from 'playwright-bdd'
import { expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { createClient } from '@supabase/supabase-js'
import { capturedLink } from '../../helpers/authMail'
import { expectAccessible } from '../helpers/a11y'
const { Given, When, Then, After } = createBdd()
const statusResult = spawnSync(
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
if (statusResult.status !== 0)
  throw new Error('Browser authentication requires local Supabase')
const local = JSON.parse(statusResult.stdout)
for (const url of [local.API_URL, local.MAILPIT_URL ?? local.INBUCKET_URL])
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(url).hostname))
    throw new Error('Browser fixtures require loopback services')
const admin = createClient(
  local.API_URL,
  local.SECRET_KEY ?? local.SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
)
const publicClient = () =>
  createClient(local.API_URL, local.PUBLISHABLE_KEY ?? local.ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
const mailpit = local.MAILPIT_URL ?? local.INBUCKET_URL
let locale = 'en',
  email = '',
  password = '',
  userId = ''
let mailIds: string[] = []
const labels = () =>
  locale === 'ru'
    ? {
        email: 'Электронная почта',
        password: 'Пароль',
        confirm: 'Подтвердите пароль',
        register: 'Создать аккаунт',
        account: 'Ваш аккаунт',
        logout: 'Выйти',
        login: 'Войти',
        recover: 'Отправить письмо',
        reset: 'Обновить пароль',
      }
    : {
        email: 'Email',
        password: 'Password',
        confirm: 'Confirm password',
        register: 'Create account',
        account: 'Your account',
        logout: 'Log out',
        login: 'Log in',
        recover: 'Send recovery email',
        reset: 'Update password',
      }
After(async () => {
  if (!userId && email) {
    const result = await admin.auth.admin.listUsers({ perPage: 1000 })
    userId = result.data.users.find((user) => user.email === email)?.id ?? ''
  }
  if (userId) {
    const result = await admin.auth.admin.deleteUser(userId)
    expect(result.error).toBeNull()
  }
  if (email) {
    const inbox = (await fetch(mailpit + '/api/v1/messages').then((response) =>
      response.json()
    )) as { messages: { ID: string; To: { Address: string }[] }[] }
    mailIds = [
      ...new Set([
        ...mailIds,
        ...inbox.messages
          .filter((mail) => mail.To.some((to) => to.Address === email))
          .map((mail) => mail.ID),
      ]),
    ]
  }
  if (mailIds.length) {
    const response = await fetch(mailpit + '/api/v1/messages', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ IDs: mailIds }),
    })
    expect(response.ok).toBe(true)
  }
  userId = ''
  email = ''
  mailIds = []
})
Given(
  'a guest opens the {word} registration form',
  async ({ page }, value: string) => {
    locale = value
    email = 'phase3b-browser-' + randomUUID() + '@example.test'
    password = 'Dance-' + randomUUID() + '!'
    await page.goto('/' + locale + '/register')
    await expectAccessible(page)
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('main')).toBeFocused()
  }
)
When(
  'they register and verify their email through local Mailpit',
  async ({ page }) => {
    const l = labels()
    await page.getByLabel(l.email, { exact: true }).fill(email)
    await page.getByLabel(l.password, { exact: true }).fill(password)
    await page.getByLabel(l.confirm, { exact: true }).fill(password)
    await page.getByRole('button', { name: l.register, exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('status')).toContainText(
      locale === 'ru' ? 'письмо' : 'email'
    )
    await expect(
      page.getByRole('button', { name: l.register, exact: true })
    ).toBeDisabled()
    expect(new URL(page.url()).pathname).toBe('/' + locale + '/register')
    const mail = await capturedLink(mailpit, email, 'signup')
    mailIds.push(mail.id)
    expect(new URL(mail.url).pathname).toBe('/' + locale + '/auth/confirm')
    const response = await page.goto(mail.url)
    expect(response?.headers()['cache-control']).toContain('no-store')
    await expect(page).toHaveURL(new RegExp('/' + locale + '/account$'))
    const listing = await admin.auth.admin.listUsers({ perPage: 1000 })
    userId = listing.data.users.find((user) => user.email === email)?.id ?? ''
    // Reused links must fail even in an already authenticated browser.
    await page.goto(mail.url)
    await expect(page).toHaveURL(
      new RegExp('/' + locale + '/login\\?error=invalidLink$')
    )
    await expect(page.getByRole('main').getByRole('alert')).toContainText(
      locale === 'ru' ? 'Ссылка' : 'link'
    )
    await page.goto('/' + locale + '/account')
  }
)
Then(
  'their account and header reflect a verified session after refresh',
  async ({ page }) => {
    await page.reload()
    await expect(
      page.getByRole('heading', { name: labels().account, exact: true })
    ).toBeVisible()
    await expect(page.getByText(email, { exact: false })).toBeVisible()
    await expect(
      page.getByRole('button', { name: labels().logout, exact: true })
    ).toBeVisible()
    await expectAccessible(page)
    await page.setViewportSize({ width: 320, height: 800 })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true)
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/' + locale + '/account?bootstrap=retry')
    await expect(page.getByRole('main').getByRole('alert')).toBeVisible()
    await page
      .getByRole('button', {
        name:
          locale === 'ru'
            ? 'Повторить создание профиля'
            : 'Retry initialization',
      })
      .click()
    await expect(page.getByRole('status')).toContainText(
      locale === 'ru' ? 'готов' : 'ready'
    )
    await page.goto('/' + locale + '/login')
    await expect(page).toHaveURL(new RegExp('/' + locale + '/account$'))
  }
)
When(
  'they log out and log back in to their protected account',
  async ({ page }) => {
    const l = labels()
    await page.getByRole('button', { name: l.logout, exact: true }).click()
    await page.goto('/' + locale + '/account')
    await expect(page).toHaveURL(new RegExp('/' + locale + '/login\\?next='))
    await expect(
      page.getByRole('button', { name: l.logout, exact: true })
    ).toHaveCount(0)
    await page.getByLabel(l.email, { exact: true }).fill(email)
    await page.getByLabel(l.password, { exact: true }).fill(password)
    await page.getByRole('button', { name: l.login, exact: true }).click()
    await expect(page).toHaveURL(new RegExp('/' + locale + '/account$'))
  }
)
Then(
  'they can recover their password through local Mailpit',
  async ({ page }) => {
    const l = labels()
    await page.getByRole('button', { name: l.logout, exact: true }).click()
    await page.goto('/' + locale + '/forgot-password')
    await page.getByLabel(l.email, { exact: true }).fill(email)
    await page.getByRole('button', { name: l.recover, exact: true }).click()
    await expect(page.getByRole('status')).toContainText(
      locale === 'ru' ? 'письмо' : 'email'
    )
    const mail = await capturedLink(mailpit, email, 'recovery')
    mailIds.push(mail.id)
    await page.goto(mail.url)
    await expect(page).toHaveURL(new RegExp('/' + locale + '/reset-password$'))
    await expectAccessible(page)
    const updated = 'Reset-' + randomUUID() + '!'
    await page.getByLabel(l.password, { exact: true }).fill(updated)
    await page.getByLabel(l.confirm, { exact: true }).fill(updated)
    await page.getByRole('button', { name: l.reset, exact: true }).click()
    await expect(page.getByRole('status')).toContainText(
      locale === 'ru' ? 'Пароль обновлён' : 'password has been updated'
    )
    expect(
      (await publicClient().auth.signInWithPassword({ email, password })).error
    ).toBeTruthy()
    const signedIn = publicClient()
    expect(
      (await signedIn.auth.signInWithPassword({ email, password: updated }))
        .error
    ).toBeNull()
    await signedIn.auth.signOut({ scope: 'local' })
    await page.goto(mail.url)
    await expect(page.getByRole('main').getByRole('alert')).toBeVisible()
  }
)
