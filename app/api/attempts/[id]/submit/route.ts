import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface RouteParams {
  id: string;
}

/**
 * Forward submit attempt request to NestJS backend
 * POST /api/attempts/[id]/submit
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id } = await params;
    
    console.log(`\n📤 POST /api/attempts/${id}/submit`);
    
    if (!id) {
      return NextResponse.json(
        { message: 'Attempt ID is required' },
        { status: 400 }
      );
    }

    // Get authorization header
    const auth = request.headers.get('authorization');
    const cookie = request.headers.get('cookie');

    if (!auth && !cookie) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse body
    const body = await request.json();
    
    console.log(`   Attempt ID: ${id}`);
    console.log(`   User Answers: ${Object.keys(body.userAnswers || {}).length} answers`);
    console.log(`   Time Spent: ${body.timeSpentSeconds}s`);

    // Forward request to NestJS backend
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authorization
    if (auth) {
      headers['Authorization'] = auth;
    } else if (cookie) {
      // Parse cookies to extract accessToken
      const cookies: Record<string, string> = {};
      cookie.split(';').forEach(c => {
        const [name, ...valueParts] = c.trim().split('=');
        cookies[name] = valueParts.join('=');
      });
      
      if (cookies['accessToken']) {
        headers['Authorization'] = `Bearer ${cookies['accessToken']}`;
      }
    }

    const response = await fetch(
      `${API_URL}/attempts/${id}/submit`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error(`   ❌ Error: ${response.status}`, result.message);
      return NextResponse.json(result, { status: response.status });
    }

    console.log(`   ✅ Submitted successfully`);
    console.log(`   Score: ${result.data?.attempt?.totalScore || 'N/A'}%`);
    console.log(`   Passed: ${result.data?.attempt?.passed ? 'YES' : 'NO'}`);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`❌ Error in POST /api/attempts/[id]/submit:`, error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
