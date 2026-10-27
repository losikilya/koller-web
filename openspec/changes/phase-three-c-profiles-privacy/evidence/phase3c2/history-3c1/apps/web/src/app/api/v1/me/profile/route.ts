import type { NextRequest } from 'next/server'
import { handleProfileRequest } from '@/app/_infrastructure/profile'
export function PATCH(request: NextRequest) {
  return handleProfileRequest(request, 'write')
}
