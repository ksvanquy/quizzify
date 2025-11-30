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

// GET /api/questions/:id
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await forwardRequest(`/questions/${id}`, request, { method: 'GET' });
    return NextResponse.json(result.body, { status: result.status });
  } catch (err: any) {
    console.error('Error proxying GET /api/questions/:id', err);
    return NextResponse.json({ message: 'Lỗi server', error: err?.message || String(err) }, { status: 500 });
  }
}

// PUT /api/questions/:id
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.text();
    const opts: RequestInit = {
      method: 'PUT',
      body,
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json'
      }
    };

    const result = await forwardRequest(`/questions/${id}`, request, opts);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err: any) {
    console.error('Error proxying PUT /api/questions/:id', err);
    return NextResponse.json({ message: 'Lỗi server', error: err?.message || String(err) }, { status: 500 });
  }
}

// DELETE /api/questions/:id
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await forwardRequest(`/questions/${id}`, request, { method: 'DELETE' });
    return NextResponse.json(result.body, { status: result.status });
  } catch (err: any) {
    console.error('Error proxying DELETE /api/questions/:id', err);
    return NextResponse.json({ message: 'Lỗi server', error: err?.message || String(err) }, { status: 500 });
  }
}
