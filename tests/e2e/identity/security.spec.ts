import { test, expect } from '@playwright/test'
for (const locale of ['en', 'ru'])
  test(
    locale + ' callbacks reject invalid links, denial and unsafe destinations',
    async ({ page, request }) => {
      for (const suffix of [
        '/auth/callback?error=access_denied&next=https://evil.test',
        '/auth/callback?code=invalid&next=//evil.test',
        '/auth/confirm?token_hash=invalid&type=recovery',
        '/auth/confirm?type=signup',
      ]) {
        await page.goto('/' + locale + suffix)
        expect(new URL(page.url()).pathname).toBe('/' + locale + '/login')
        await expect(page.getByRole('main').getByRole('alert')).toBeVisible()
        expect(page.url()).not.toContain('token_hash')
      }
      await page.goto('/' + locale + '/login')
      await page
        .getByRole('button', {
          name:
            locale === 'ru' ? 'Продолжить с Google' : 'Continue with Google',
        })
        .click()
      await expect(page.getByRole('main').getByRole('alert')).toContainText(
        locale === 'ru' ? 'временно недоступен' : 'temporarily unavailable'
      )
      expect(new URL(page.url()).pathname).toBe('/' + locale + '/login')
      const response = await request.post('/api/auth/logout', {
        headers: { Origin: 'https://evil.test' },
        data: { locale },
      })
      expect(response.status()).toBe(403)
      expect(response.headers()['cache-control']).toContain('no-store')
      const get = await request.get('/api/auth/logout')
      expect(get.status()).toBe(405)
      await page.goto('/' + locale + '/account')
      await expect(page).toHaveURL(new RegExp('/' + locale + '/login\\?next='))
    }
  )
