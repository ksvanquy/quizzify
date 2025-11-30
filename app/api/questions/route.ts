import { NextResponse } from 'next/server';
import { API_URL } from '@/app/lib/api';

async function forwardRequest(path: string, req: Request, init: RequestInit = {}) {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string> || {}) };

  const auth = req.headers.get('authorization');
  const cookie = req.headers.get('cookie');

  if (auth) headers['Authorization'] = auth;
  if (cookie) headers['cookie'] = cookie;

  const url = `${API_URL}${path}`;

  const res = await fetch(url, { ...init, headers, redirect: 'follow' });
  const text = await res.text();

  let body: any = text;
  try {
    body = JSON.parse(text);
  } catch (e) {
    // leave as text
  }

  return { status: res.status, body };
}

// GET /api/questions?topic=...&difficulty=...&type=...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const path = queryString ? `/questions?${queryString}` : '/questions';
    
    const result = await forwardRequest(path, request, { method: 'GET' });
    return NextResponse.json(result.body, { status: result.status });
  } catch (err: any) {
    console.error('Error proxying GET /api/questions', err);
    return NextResponse.json({ message: 'Lỗi server', error: err?.message || String(err) }, { status: 500 });
  }
}

// POST /api/questions
export async function POST(request: Request) {
  try {
    const body = await request.text();
    const opts: RequestInit = {
      method: 'POST',
      body,
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json'
      }
    };

    const result = await forwardRequest('/questions', request, opts);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err: any) {
    console.error('Error proxying POST /api/questions', err);
    return NextResponse.json({ message: 'Lỗi server', error: err?.message || String(err) }, { status: 500 });
  }
}
