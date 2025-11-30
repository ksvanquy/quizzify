import { NextResponse } from 'next/server';
import { API_URL } from '@/app/lib/api';

async function forwardRequest(path: string, req: Request, init: RequestInit = {}) {
  // Forward Authorization or Cookie from incoming request when available
  const headers: Record<string, string> = { ...(init.headers as Record<string, string> || {}) };

  const auth = req.headers.get('authorization');
  const cookie = req.headers.get('cookie');

  if (auth) headers['Authorization'] = auth;
  if (cookie) headers['cookie'] = cookie;

  const url = `${API_URL}${path}`;

  const res = await fetch(url, { ...init, headers, redirect: 'follow' });
  const text = await res.text();

  // Try to parse JSON, otherwise return plain text
  let body: any = text;
  try {
    body = JSON.parse(text);
  } catch (e) {
    // leave as text
  }

  return { status: res.status, body };
}

export async function GET(request: Request) {
  try {
    const result = await forwardRequest('/auth/profile', request, { method: 'GET' });
    return NextResponse.json(result.body, { status: result.status });
  } catch (err: any) {
    console.error('Error proxying GET /api/profile -> /auth/profile', err);
    return NextResponse.json({ message: 'Lỗi server', error: err?.message || String(err) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.text();
    const opts: RequestInit = {
      method: 'PUT',
      body,
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json'
      }
    };

    const result = await forwardRequest('/auth/profile', request, opts);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err: any) {
    console.error('Error proxying PUT /api/profile -> /auth/profile', err);
    return NextResponse.json({ message: 'Lỗi server', error: err?.message || String(err) }, { status: 500 });
  }
}
