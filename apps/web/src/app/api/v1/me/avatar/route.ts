import type { NextRequest } from 'next/server'
import { handleAvatarRequest } from '@/app/_infrastructure/avatar'
export const runtime = 'nodejs'
export function POST(request: NextRequest) {
  return handleAvatarRequest(request, 'upload')
}
export function DELETE(request: NextRequest) {
  return handleAvatarRequest(request, 'remove')
}
