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

// GET /api/bookmarks - Lấy tất cả bookmarks của user
export async function GET(request: Request) {
  try {
    // Require Authorization Bearer token
    const auth = request.headers.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid Authorization header. Use: Authorization: Bearer <token>' },
        { status: 401 }
      );
    }

    const result = await forwardRequest('/bookmarks', request, { method: 'GET' });
    return NextResponse.json(result.body, { status: result.status });
  } catch (err: any) {
    console.error('Error proxying GET /api/bookmarks -> /bookmarks', err);
    return NextResponse.json({ message: 'Lỗi server', error: err?.message || String(err) }, { status: 500 });
  }
}

// POST /api/bookmarks - Thêm bookmark mới
export async function POST(request: Request) {
  try {
    // Require Authorization Bearer token
    const auth = request.headers.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid Authorization header. Use: Authorization: Bearer <token>' },
        { status: 401 }
      );
    }

    const body = await request.text();
    const opts: RequestInit = {
      method: 'POST',
      body,
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json'
      }
    };

    const result = await forwardRequest('/bookmarks', request, opts);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err: any) {
    console.error('Error proxying POST /api/bookmarks -> /bookmarks', err);
    return NextResponse.json({ message: 'Lỗi server', error: err?.message || String(err) }, { status: 500 });
  }
}

// DELETE /api/bookmarks?quizId=... - Xóa bookmark theo quizId
export async function DELETE(request: Request) {
  try {
    // Require Authorization Bearer token
    const auth = request.headers.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid Authorization header. Use: Authorization: Bearer <token>' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get('quizId');

    if (!quizId) {
      return NextResponse.json({ message: 'Quiz ID không hợp lệ' }, { status: 400 });
    }

    // Forward to /bookmarks/:quizId
    const result = await forwardRequest(`/bookmarks/${quizId}`, request, { method: 'DELETE' });
    return NextResponse.json(result.body, { status: result.status });
  } catch (err: any) {
    console.error('Error proxying DELETE /api/bookmarks -> /bookmarks/:quizId', err);
    return NextResponse.json({ message: 'Lỗi server', error: err?.message || String(err) }, { status: 500 });
  }
}
