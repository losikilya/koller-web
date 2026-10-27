import { randomUUID } from 'node:crypto'
import { createBdd } from 'playwright-bdd'
import { expect } from '@playwright/test'
import type { BrowserContext, Page } from '@playwright/test'
import { ownProfileSchema } from '@dance/contracts'
import {
  avatarImage,
  avatarTestAdmin,
  avatarTestClient,
  localAvatarCleanup,
} from '../helpers/avatar'
import { expectAccessible } from '../helpers/a11y'

const { Given, When, Then, After } = createBdd()
const origin = 'http://127.0.0.1:4310'
const labels = {
  en: {
    username: 'Username',
    name: 'Display name',
    bio: 'Bio',
    complete: 'Complete public profile',
    save: 'Save profile',
    reload: 'Reload current profile',
    photo: 'Profile photo',
    upload: 'Upload photo',
    current: 'Current profile photo',
    photoSaved: 'Photo saved',
    saved: 'Profile saved. Current server data is displayed.',
    conflict:
      'Your profile changed elsewhere. Your draft is kept. Reload current profile before editing again.',
  },
  ru: {
    username: 'Имя пользователя',
    name: 'Отображаемое имя',
    bio: 'О себе',
    complete: 'Завершить публичный профиль',
    save: 'Сохранить профиль',
    reload: 'Загрузить текущий профиль',
    photo: 'Фото профиля',
    upload: 'Загрузить фото',
    current: 'Текущее фото профиля',
    photoSaved: 'Фото сохранено',
    saved: 'Профиль сохранён. Показаны актуальные данные сервера.',
    conflict:
      'Профиль изменён в другом окне. Черновик сохранён. Загрузите текущий профиль перед дальнейшим редактированием.',
  },
}
type Locale = keyof typeof labels
type Fixture = {
  id: string
  email: string
  password: string
  client: ReturnType<typeof avatarTestClient>
}
let owner: Fixture,
  other: Fixture,
  locale: Locale = 'en',
  username = '',
  renamed = '',
  imageUrl = '',
  secondEditor: Page | undefined
const ids: string[] = [],
  pageErrors: string[] = []
async function fixture(): Promise<Fixture> {
  const email = 'integration-' + randomUUID() + '@example.test',
    password = 'Local-' + randomUUID() + '!'
  const created = await avatarTestAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  expect(created.error).toBeNull()
  const id = created.data.user!.id
  ids.push(id)
  const client = avatarTestClient()
  expect(
    (await client.auth.signInWithPassword({ email, password })).error
  ).toBeNull()
  expect((await client.rpc('ensure_profile')).error).toBeNull()
  return { id, email, password, client }
}
async function login(page: Page) {
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.goto('/en/login?next=/en/account/profile')
  await page.getByLabel('Email', { exact: true }).fill(owner.email)
  await page.getByLabel('Password', { exact: true }).fill(owner.password)
  await page.getByRole('button', { name: 'Log in', exact: true }).click()
  await expect(page).toHaveURL('/en/account/profile')
  if (locale === 'ru') await page.goto('/ru/account/profile')
}
async function own(context: BrowserContext) {
  const response = await context.request.get('/api/v1/me')
  expect(response.status()).toBe(200)
  expect(response.headers()['cache-control']).toContain('no-store')
  const body = (await response.json()) as { profile: unknown }
  return {
    profile: ownProfileSchema.parse(body.profile),
    etag: response.headers().etag,
  }
}
async function upload(page: Page) {
  const t = labels[locale]
  await page.getByLabel(t.photo, { exact: true }).setInputFiles({
    name: 'joined.png',
    mimeType: 'image/png',
    buffer: await avatarImage(8, 8),
  })
  await page.getByRole('button', { name: t.upload, exact: true }).focus()
  await page.keyboard.press('Enter')
  const saved = page.getByRole('status').filter({ hasText: t.photoSaved })
  await expect(saved).toBeVisible()
  await expect(saved).toBeFocused()
  imageUrl =
    (await page
      .getByRole('img', { name: t.current, exact: true })
      .getAttribute('src')) ?? ''
  expect(imageUrl).toMatch(/^\/api\/v1\/profile-avatars\/[a-f0-9-]{36}$/)
}
After(async () => {
  await secondEditor?.close()
  secondEditor = undefined
  const ownedIds = ids.splice(0)
  for (const id of ownedIds)
    expect((await avatarTestAdmin.auth.admin.deleteUser(id)).error).toBeNull()
  if (ownedIds.length) localAvatarCleanup()
})
Given(
  'an incomplete integration owner opens the {word} profile',
  async ({ page }, language: string) => {
    expect(['en', 'ru']).toContain(language)
    locale = language as Locale
    pageErrors.length = 0
    owner = await fixture()
    other = await fixture()
    username = 'i' + randomUUID().replaceAll('-', '').slice(0, 18)
    renamed = 'j' + randomUUID().replaceAll('-', '').slice(0, 18)
    await login(page)
    await expect(
      page.getByRole('button', { name: labels[locale].complete, exact: true })
    ).toBeVisible()
  }
)
When(
  'the owner uploads an optional avatar before completing the profile',
  async ({ page, context, browser }) => {
    const t = labels[locale]
    await page.getByLabel(t.username, { exact: true }).fill(username)
    await page.getByLabel(t.name, { exact: true }).fill('Joined owner')
    await page
      .getByLabel(t.bio, { exact: true })
      .fill('Integrated <script>window.integrationPwned=true</script>')
    await upload(page)
    for (const [label, value] of [
      [t.username, username],
      [t.name, 'Joined owner'],
      [t.bio, 'Integrated <script>window.integrationPwned=true</script>'],
    ])
      await expect(page.getByLabel(label, { exact: true })).toHaveValue(value)
    const current = await own(context)
    expect(current.profile.userId).toBe(owner.id)
    expect(current.profile.completed).toBe(false)
    expect(current.profile.avatarUrl).toBe(imageUrl)
    expect((await context.request.get(imageUrl)).status()).toBe(200)
    const guest = await browser.newContext({ baseURL: origin })
    try {
      expect((await guest.request.get(imageUrl)).status()).toBe(404)
      expect(
        (await guest.request.get('/' + locale + '/u/' + username)).status()
      ).toBe(404)
    } finally {
      await guest.close()
    }
    await expectAccessible(page)
  }
)
When(
  'the owner completes and renames the profile while another owner reuses the old name',
  async ({ page, context, browser }) => {
    const t = labels[locale],
      before = await own(context)
    const completion = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === '/api/v1/me/profile/complete' &&
        response.request().method() === 'POST'
    )
    await page.getByRole('button', { name: t.complete, exact: true }).focus()
    await page.keyboard.press('Enter')
    const completed = await completion
    expect(completed.status()).toBe(200)
    expect(completed.request().headers()['if-match']).toBe(before.etag)
    await expect(
      page.getByRole('button', { name: t.save, exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole('status').filter({ hasText: t.saved })
    ).toBeFocused()
    const current = await own(context)
    expect(current.profile.completed).toBe(true)
    expect(current.profile.privacy.visibility).toBe('public')
    expect(current.profile.avatarUrl).toBe(imageUrl)
    const guest = await browser.newContext({ baseURL: origin })
    try {
      expect((await guest.request.get(imageUrl)).status()).toBe(200)
      await page.getByLabel(t.username, { exact: true }).fill(renamed)
      const renamedResponse = page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname === '/api/v1/me/profile' &&
          response.request().method() === 'PATCH'
      )
      await page.getByRole('button', { name: t.save, exact: true }).focus()
      await page.keyboard.press('Enter')
      expect((await renamedResponse).status()).toBe(200)
      await expect(
        page.getByRole('status').filter({ hasText: t.saved })
      ).toBeFocused()
      const missing = await guest.request.get('/' + locale + '/u/' + username, {
        maxRedirects: 0,
      })
      expect(missing.status()).toBe(404)
      expect(missing.headers().location).toBeUndefined()
      expect(
        (
          await other.client.rpc('complete_own_profile', {
            p_patch: { username, displayName: 'New handle owner' },
            p_expected_profile_revision: '1',
            p_expected_privacy_revision: '1',
          })
        ).error
      ).toBeNull()
      const same = await own(context)
      expect(same.profile.userId).toBe(owner.id)
      expect(same.profile.avatarUrl).toBe(imageUrl)
      expect(same.profile.username).toBe(renamed)
    } finally {
      await guest.close()
    }
  }
)
Then(
  'public localized pages preserve identity avatar privacy and safe presentation',
  async ({ page, browser }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth
      )
    ).toBe(true)
    await expectAccessible(page)
    const guest = await browser.newContext({
        baseURL: origin,
        javaScriptEnabled: false,
      }),
      view = await guest.newPage()
    try {
      for (const language of ['en', 'ru']) {
        const path = '/' + language + '/u/' + renamed,
          response = await view.goto(path)
        expect(response?.status()).toBe(200)
        expect(response?.headers()['cache-control']).toContain('no-store')
        expect(response?.headers()['x-robots-tag']).toBe('noindex, nofollow')
        await expect(
          view.getByRole('heading', {
            level: 1,
            name: 'Joined owner',
            exact: true,
          })
        ).toBeVisible()
        await expect(view.locator('main img')).toHaveAttribute('src', imageUrl)
        await expect(view.locator('link[rel="canonical"]')).toHaveAttribute(
          'href',
          origin + path
        )
        await expect(view.locator('meta[name="robots"]')).toHaveAttribute(
          'content',
          /noindex.*nofollow/
        )
        const html = await response!.text()
        for (const forbidden of [
          owner.email,
          other.email,
          'avatar_path',
          'storage/v1',
          'LOCAL_AVATAR_SERVICE_KEY',
          'deletion_requested_at',
          'completed_at',
        ])
          expect(html).not.toContain(forbidden)
        expect((await guest.request.get(imageUrl)).status()).toBe(200)
        const rsc = await guest.request.get(path, {
          headers: { RSC: '1', 'Next-Router-Prefetch': '1' },
        })
        expect(rsc.status()).toBe(200)
        expect(rsc.headers()['content-type']).toContain('text/x-component')
        expect(rsc.headers()['cache-control']).toContain('no-store')
        const data = await rsc.text()
        expect(data).not.toContain(owner.email)
        expect(data).not.toContain('storage/v1')
        const reassigned = await view.goto('/' + language + '/u/' + username)
        expect(reassigned?.status()).toBe(200)
        await expect(
          view.getByRole('heading', {
            level: 1,
            name: 'New handle owner',
            exact: true,
          })
        ).toBeVisible()
        await expect(view.locator('main img')).toHaveCount(0)
        expect(await reassigned!.text()).not.toContain(imageUrl)
      }
    } finally {
      await guest.close()
    }
    expect(pageErrors).toEqual([])
  }
)
Given(
  'two integration editors share one completed owner revision',
  async ({ page, context }) => {
    locale = 'en'
    pageErrors.length = 0
    owner = await fixture()
    username = 'k' + randomUUID().replaceAll('-', '').slice(0, 18)
    expect(
      (
        await owner.client.rpc('complete_own_profile', {
          p_patch: { username, displayName: 'Two editors' },
          p_expected_profile_revision: '1',
          p_expected_privacy_revision: '1',
        })
      ).error
    ).toBeNull()
    await login(page)
    await page.getByLabel('Bio', { exact: true }).fill('Keep stale draft')
    secondEditor = await context.newPage()
    secondEditor.on('pageerror', (error) => pageErrors.push(error.message))
    await secondEditor.goto('/en/account/profile')
    await expect(secondEditor.getByLabel('Bio', { exact: true })).toHaveValue(
      ''
    )
  }
)
When(
  'one editor uploads a photo and the other saves a stale text draft',
  async ({ page, context }) => {
    expect(secondEditor).toBeDefined()
    await upload(secondEditor!)
    const conflict = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === '/api/v1/me/profile' &&
        response.request().method() === 'PATCH'
    )
    await page
      .getByRole('button', { name: 'Save profile', exact: true })
      .focus()
    await page.keyboard.press('Enter')
    expect((await conflict).status()).toBe(412)
    const alert = page.getByRole('main').getByRole('alert')
    await expect(alert).toHaveText(labels.en.conflict)
    await expect(alert).toBeFocused()
    await expect(page.getByLabel('Bio', { exact: true })).toHaveValue(
      'Keep stale draft'
    )
    const server = await own(context)
    expect(server.profile.bio).toBe('')
    expect(server.profile.avatarUrl).toBe(imageUrl)
    expect((await context.request.get(imageUrl)).status()).toBe(200)
  }
)
Then(
  'the draft survives the conflict and explicit reload permits a current save',
  async ({ page, context }) => {
    await page
      .getByRole('button', { name: 'Reload current profile', exact: true })
      .focus()
    await page.keyboard.press('Enter')
    await expect(page.getByLabel('Bio', { exact: true })).toHaveValue('')
    await expect(
      page.getByRole('img', { name: 'Current profile photo', exact: true })
    ).toHaveAttribute('src', imageUrl)
    await page.getByLabel('Bio', { exact: true }).fill('Saved after reload')
    const saved = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === '/api/v1/me/profile' &&
        response.request().method() === 'PATCH'
    )
    const before = await own(context)
    await page
      .getByRole('button', { name: 'Save profile', exact: true })
      .focus()
    await page.keyboard.press('Enter')
    const result = await saved
    expect(result.status()).toBe(200)
    expect(result.request().headers()['if-match']).toBe(before.etag)
    await expect(
      page.getByRole('status').filter({ hasText: labels.en.saved })
    ).toBeFocused()
    const current = await own(context)
    expect(current.profile.bio).toBe('Saved after reload')
    expect(current.profile.avatarUrl).toBe(imageUrl)
    await expectAccessible(page)
    expect(pageErrors).toEqual([])
  }
)
