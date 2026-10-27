import { createBdd } from 'playwright-bdd'
import { expect } from '@playwright/test'

import { randomUUID } from 'node:crypto'
import { AVATAR_MAX_FILE_BYTES } from '@dance/contracts'

import {
  avatarImage,
  paddedAvatar,
  imageMetadata,
  avatarTestAdmin,
  avatarTestClient,
  localAvatarCleanup,
} from '../helpers/avatar'
import { expectAccessible } from '../helpers/a11y'
const { Given, When, Then, After } = createBdd()
const origin = 'http://127.0.0.1:4310'
const admin = avatarTestAdmin
let ownerId = '',
  username = '',
  firstUrl = '',
  currentUrl = ''
const runtimeErrors: string[] = []
After(async () => {
  if (ownerId) {
    expect((await admin.auth.admin.deleteUser(ownerId)).error).toBeNull()
    ownerId = ''
    localAvatarCleanup()
  }
})
Given('a completed owner without an avatar', async ({ page }) => {
  const email = 'avatar-browser-' + randomUUID() + '@example.test',
    password = 'Local-' + randomUUID() + '!'
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  expect(created.error).toBeNull()
  ownerId = created.data.user!.id
  const client = avatarTestClient()
  expect(
    (await client.auth.signInWithPassword({ email, password })).error
  ).toBeNull()
  expect((await client.rpc('ensure_profile')).error).toBeNull()
  username = 'v' + randomUUID().replaceAll('-', '').slice(0, 18)
  expect(
    (
      await client.rpc('complete_own_profile', {
        p_patch: { username, displayName: 'Avatar owner' },
        p_expected_profile_revision: '1',
        p_expected_privacy_revision: '1',
      })
    ).error
  ).toBeNull()
  runtimeErrors.length = 0
  page.on('pageerror', (error) => runtimeErrors.push(error.message))
  await page.goto('/en/login?next=/en/account/profile')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Log in', exact: true }).click()
  await expect(page).toHaveURL('/en/account/profile')
  await expect(
    page.getByText('Maximum photo size: 2 MB', { exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole('img', { name: 'Current profile photo' })
  ).toHaveCount(0)
})
When(
  'the owner rejects oversized photos and replaces an uploaded avatar',
  async ({ page, context }) => {
    let uploads = 0
    page.on('request', (request) => {
      if (
        new URL(request.url()).pathname === '/api/v1/me/avatar' &&
        request.method() === 'POST'
      )
        uploads++
    })
    const file = page.getByLabel('Profile photo', { exact: true }),
      bio = page.getByLabel('Bio', { exact: true })
    await bio.fill('Unsaved avatar draft')
    const png = await avatarImage(8, 8, 'png', true)
    await file.setInputFiles({
      name: 'large.png',
      mimeType: 'image/png',
      buffer: paddedAvatar(png, AVATAR_MAX_FILE_BYTES + 1),
    })
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(
      'Photo too large. Maximum size: 2 MB.'
    )
    await expect(page.getByRole('main').getByRole('alert')).toBeFocused()
    expect(uploads).toBe(0)
    await expect(bio).toHaveValue('Unsaved avatar draft')
    await expect(
      page.getByRole('button', { name: 'Upload photo', exact: true })
    ).toBeDisabled()
    // Client-side size checks do not replace the independent server limit.
    const own = await context.request.get('/api/v1/me'),
      etag = own.headers().etag
    const bypass = await context.request.post('/api/v1/me/avatar', {
      headers: {
        Origin: origin,
        'If-Match': etag,
        'X-Avatar-Operation': randomUUID(),
      },
      multipart: {
        file: {
          name: 'bypass.png',
          mimeType: 'image/png',
          buffer: paddedAvatar(png, AVATAR_MAX_FILE_BYTES + 1),
        },
      },
    })
    expect(bypass.status()).toBe(413)
    expect(bypass.headers()['cache-control']).toContain('no-store')
    const invalid = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === '/api/v1/me/avatar' &&
        response.request().method() === 'POST'
    )
    await file.setInputFiles({
      name: 'invalid.png',
      mimeType: 'image/png',
      buffer: Buffer.from('<svg/>'),
    })
    await page
      .getByRole('button', { name: 'Upload photo', exact: true })
      .click()
    expect((await invalid).status()).toBe(422)
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(
      'Invalid photo'
    )
    await expect(bio).toHaveValue('Unsaved avatar draft')
    const uploaded = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === '/api/v1/me/avatar' &&
        response.request().method() === 'POST' &&
        response.status() === 200
    )
    await file.setInputFiles({
      name: 'exact.png',
      mimeType: 'image/png',
      buffer: paddedAvatar(png, AVATAR_MAX_FILE_BYTES),
    })
    await file.focus()
    await page.keyboard.press('Tab')
    await expect(
      page.getByRole('button', { name: 'Upload photo', exact: true })
    ).toBeFocused()
    await page.keyboard.press('Enter')
    const result = await (await uploaded).json()
    firstUrl = result.profile.avatarUrl
    expect(firstUrl).toMatch(/^\/api\/v1\/profile-avatars\/[a-f0-9-]{36}$/)
    expect(JSON.stringify(result)).not.toContain('avatar_path')
    await expect(page.getByRole('status')).toHaveText('Photo saved')
    await expect(page.getByRole('status')).toBeFocused()
    await expect(bio).toHaveValue('Unsaved avatar draft')
    const replaced = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === '/api/v1/me/avatar' &&
        response.request().method() === 'POST' &&
        response.status() === 200
    )
    await file.setInputFiles({
      name: 'replacement.jpg',
      mimeType: 'image/jpeg',
      buffer: await avatarImage(1000, 750, 'jpeg', true),
    })
    await page
      .getByRole('button', { name: 'Upload photo', exact: true })
      .focus()
    await page.keyboard.press('Enter')
    currentUrl = (await (await replaced).json()).profile.avatarUrl
    expect(currentUrl).not.toBe(firstUrl)
    await expect(
      page.getByRole('img', { name: 'Current profile photo' })
    ).toHaveAttribute('src', currentUrl)
    expect((await context.request.get(firstUrl)).status()).toBe(404)
    const delivered = await context.request.get(currentUrl)
    expect(delivered.status()).toBe(200)
    expect(delivered.headers()['content-type']).toBe('image/webp')
    expect(delivered.headers()['x-robots-tag']).toBe('noindex, nofollow')
    const meta = await imageMetadata(await delivered.body())
    expect(meta.width).toBeLessThanOrEqual(512)
    expect(meta.height).toBeLessThanOrEqual(512)
    expect(meta.exif).toBeUndefined()
    expect(meta.icc).toBeUndefined()
    await expect(bio).toHaveValue('Unsaved avatar draft')
    await page.route('**/api/v1/me/avatar', (route) => route.abort('failed'))
    await file.setInputFiles({
      name: 'lost.png',
      mimeType: 'image/png',
      buffer: png,
    })
    await page
      .getByRole('button', { name: 'Upload photo', exact: true })
      .click()
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(
      'Reload current profile before another change.'
    )
    await expect(
      page.getByRole('button', { name: 'Save profile', exact: true })
    ).toBeDisabled()
    await expect(bio).toHaveValue('Unsaved avatar draft')
    await page
      .getByRole('button', { name: 'Cancel photo selection', exact: true })
      .click()
    await expect(
      page.getByRole('button', { name: 'Save profile', exact: true })
    ).toBeDisabled()
    await page.unroute('**/api/v1/me/avatar')
    await page
      .getByRole('button', { name: 'Reload current profile', exact: true })
      .click()
    await expect(
      page.getByRole('button', { name: 'Save profile', exact: true })
    ).toBeEnabled()
    await expect(
      page.getByRole('img', { name: 'Current profile photo' })
    ).toHaveAttribute('src', currentUrl)
    await expectAccessible(page)
    await page.setViewportSize({ width: 320, height: 900 })
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth
      )
    ).toBe(true)
  }
)
Then(
  'current EN and RU public images are safe and old avatar URLs are unavailable',
  async ({ page, browser, context }) => {
    const guest = await browser.newContext({
        baseURL: origin,
        javaScriptEnabled: false,
      }),
      publicPage = await guest.newPage()
    try {
      for (const locale of ['en', 'ru']) {
        const response = await publicPage.goto('/' + locale + '/u/' + username)
        expect(response?.status()).toBe(200)
        expect(response?.headers()['cache-control']).toContain('no-store')
        expect(response?.headers()['x-robots-tag']).toBe('noindex, nofollow')
        const html = await response!.text()
        expect(html).toContain(currentUrl)
        for (const privateValue of [
          'avatar_path',
          'storage/v1',
          'LOCAL_AVATAR_SERVICE_KEY',
        ])
          expect(html).not.toContain(privateValue)
        await expect(publicPage.locator('main img')).toHaveAttribute(
          'src',
          currentUrl
        )
        expect((await guest.request.get(currentUrl)).status()).toBe(200)
      }
      await page.setViewportSize({ width: 1280, height: 900 })
      await page.getByRole('link', { name: 'Language: Русский' }).click()
      await expect(page).toHaveURL('/ru/account/profile')
      await expect(
        page.getByText('Максимальный размер фото: 2 МБ', { exact: true })
      ).toBeVisible()
      await page.getByLabel('Фото профиля', { exact: true }).setInputFiles({
        name: 'large.png',
        mimeType: 'image/png',
        buffer: paddedAvatar(await avatarImage(), AVATAR_MAX_FILE_BYTES + 1),
      })
      await expect(page.getByRole('main').getByRole('alert')).toHaveText(
        'Фото слишком большое. Максимальный размер: 2 МБ.'
      )
      await page
        .getByRole('button', { name: 'Отменить выбор фото', exact: true })
        .click()
      const removed = page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname === '/api/v1/me/avatar' &&
          response.request().method() === 'DELETE'
      )
      await page
        .getByRole('button', { name: 'Удалить фото', exact: true })
        .focus()
      await page.keyboard.press('Enter')
      expect((await removed).status()).toBe(200)
      await expect(page.getByRole('status')).toHaveText('Фото удалено')
      await expect(
        page.getByRole('img', { name: 'Текущее фото профиля' })
      ).toHaveCount(0)
      expect((await context.request.get(currentUrl)).status()).toBe(404)
      await publicPage.reload()
      await expect(publicPage.locator('main img')).toHaveCount(0)
      await expectAccessible(page)
      expect(runtimeErrors).toEqual([])
    } finally {
      await guest.close()
    }
  }
)
