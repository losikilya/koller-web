import type { NextRequest } from 'next/server'
import { handleProfileRequest } from '@/app/_infrastructure/profile'
export function GET(request: NextRequest) {
  return handleProfileRequest(request, 'completion-state')
}
