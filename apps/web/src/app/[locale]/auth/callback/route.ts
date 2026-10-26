import type { NextRequest } from 'next/server'
import { handleAuthCallback } from '@/app/_infrastructure/auth'
export const dynamic = 'force-dynamic'
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  return handleAuthCallback(request, (await params).locale, 'callback')
}
