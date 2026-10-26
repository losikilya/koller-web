import type { NextRequest } from 'next/server'
import { handleAuthPost } from '@/app/_infrastructure/auth'
export const dynamic = 'force-dynamic'
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  return handleAuthPost(request, (await params).action)
}
