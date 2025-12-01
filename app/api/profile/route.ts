import { NextResponse } from 'next/server';
import { API_URL } from '@/app/lib/api';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'app', 'data');

function loadData(filename: string) {
  try {
    const filePath = path.join(dataDir, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return [];
  }
}

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
    // Require Authorization Bearer token
    const auth = request.headers.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid Authorization header. Use: Authorization: Bearer <token>' },
        { status: 401 }
      );
    }

    const result = await forwardRequest('/auth/profile', request, { method: 'GET' });
    
    if (result.status === 200) {
      // Enrich user data with bookmarked and watchlisted quizzes
      const userData = result.body?.data?.user || result.body?.user || result.body;
      
      // Fetch bookmarks and watchlist from NestJS - use Bearer token only
      const headers: Record<string, string> = {
        'Authorization': auth
      };
      
      const [bookmarksRes, watchlistRes] = await Promise.all([
        fetch(`${API_URL}/bookmarks`, { headers }),
        fetch(`${API_URL}/watchlists`, { headers })
      ]);
      
      const bookmarksData = bookmarksRes.ok ? await bookmarksRes.json() : { data: { bookmarks: [] } };
      const watchlistData = watchlistRes.ok ? await watchlistRes.json() : { data: { watchlist: [] } };
      
      const bookmarks = bookmarksData?.data?.bookmarks || bookmarksData?.bookmarks || [];
      const watchlist = watchlistData?.data?.watchlist || watchlistData?.watchlist || [];
      
      // Fetch quiz templates from NestJS API (with fallback to local JSON)
      let quizTemplates: any[] = [];
      try {
        const quizzesRes = await fetch(`${API_URL}/quizzes?status=active`, { headers });
        if (quizzesRes.ok) {
          const quizzesData = await quizzesRes.json();
          quizTemplates = quizzesData?.data?.quizzes || quizzesData?.data || quizzesData || [];
        } else {
          // Fallback to local JSON if API fails
          quizTemplates = loadData('quizTemplates.json');
        }
      } catch (err) {
        console.warn('Failed to fetch quiz templates from API, using local JSON:', err);
        quizTemplates = loadData('quizTemplates.json');
      }
      
      // Match quizzes with bookmark/watchlist IDs
      const bookmarkQuizIds = bookmarks.map((b: any) => String(b.quizId));
      const watchlistQuizIds = watchlist.map((w: any) => String(w.quizId));
      
      const bookmarkedQuizzes = bookmarkQuizIds
        .map((id: string) => quizTemplates.find((q: any) => String(q.id) === id && q.status === 'active'))
        .filter(Boolean);
        
      const watchlistedQuizzes = watchlistQuizIds
        .map((id: string) => quizTemplates.find((q: any) => String(q.id) === id && q.status === 'active'))
        .filter(Boolean);
      
      return NextResponse.json({
        ...result.body,
        data: {
          user: {
            ...userData,
            bookmarkedQuizzes,
            watchlistedQuizzes
          }
        }
      }, { status: result.status });
    }
    
    return NextResponse.json(result.body, { status: result.status });
  } catch (err: any) {
    console.error('Error proxying GET /api/profile -> /auth/profile', err);
    return NextResponse.json({ message: 'Lỗi server', error: err?.message || String(err) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
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
