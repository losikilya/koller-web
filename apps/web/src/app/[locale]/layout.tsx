import type { ReactNode } from 'react'
import Script from 'next/script'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/shared/i18n/routing'
import { getSupabaseConfig } from '@/shared/supabase/config'
import { CompletionNavigationGuard } from '@/app/_infrastructure/CompletionNavigationGuard'
import '../globals.scss'
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}
export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)
  return (
    <html lang={locale}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>
        <Script
          id="completion-history-revalidation"
          strategy="beforeInteractive"
        >
          {
            "window.addEventListener('pageshow', function(event) { var entry = performance.getEntriesByType('navigation')[0]; if (event.persisted || (entry && entry.type === 'back_forward')) window.location.reload(); });"
          }
        </Script>
        <NextIntlClientProvider>
          <CompletionNavigationGuard enabled={Boolean(getSupabaseConfig())}>
            {children}
          </CompletionNavigationGuard>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
