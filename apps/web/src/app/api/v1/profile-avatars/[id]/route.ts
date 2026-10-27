import type { NextRequest } from 'next/server'
import { handleAvatarImage } from '@/app/_infrastructure/avatar'
export const runtime = 'nodejs'
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAvatarImage(request, (await params).id)
}
