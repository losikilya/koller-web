import type { NextRequest } from 'next/server'
import { handleProfileRequest } from '@/app/_infrastructure/profile'
export function POST(request: NextRequest) {
  return handleProfileRequest(request, 'complete')
}
