import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface SubmitRequest {
  attemptId: string;
  answers: Record<string, any>;
}

interface SubmitResponse {
  message: string;
  attemptId?: string;
  score?: number;
  percentage?: number;
  passed?: boolean;
}

export async function POST(request: Request): Promise<NextResponse<SubmitResponse>> {
  try {
    const { attemptId, answers } = (await request.json()) as SubmitRequest;

    if (!attemptId || !answers) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check authentication
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json(
        { message: 'Bạn cần đăng nhập để nộp bài.' },
        { status: 401 }
      );
    }

    const session = JSON.parse(sessionCookie.value);
    const accessToken = session.token || session.accessToken || '';

    // Sử dụng NestJS Attempts API để submit
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
    
    try {
      // Gọi submit request đến NestJS API
      const submitRes = await fetch(`${API_URL}/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userAnswers: answers }),
      });
      
      if (!submitRes.ok) {
        const errorData = await submitRes.json();
        return NextResponse.json(
          { message: errorData.message || 'Failed to submit attempt' },
          { status: submitRes.status }
        );
      }
      
      const result = await submitRes.json();
      
      if (!result.success) {
        return NextResponse.json(
          { message: result.message || 'Failed to submit attempt' },
          { status: 400 }
        );
      }
      
      const submittedAttempt = result.data.attempt;
      
      return NextResponse.json({
        message: 'Bài thi đã được nộp thành công!',
        attemptId: submittedAttempt.id,
        score: submittedAttempt.totalScore,
        percentage: submittedAttempt.percentage,
        passed: submittedAttempt.passed,
      });
      
    } catch (error) {
      console.error('Error submitting to API:', error);
      return NextResponse.json(
        { message: 'Lỗi khi nộp bài thi' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Error in POST /api/quiz/submit:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
