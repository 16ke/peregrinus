// src/app/api/auth/middleware.ts (or separate file)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function authMiddleware(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');

  // Public API routes (login, register)
  if (request.nextUrl.pathname === '/api/auth/login' || 
      request.nextUrl.pathname === '/api/auth/register') {
    return NextResponse.next();
  }

  // Protected API routes require token
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.next();
}