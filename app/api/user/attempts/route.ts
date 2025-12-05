import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface AttemptSummary {
  templateId: number;
  completedCount: number;
  lastAttempt: string | null;
  bestScore: number;
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const accessToken = session.token || session.accessToken || '';

    // Fetch user attempts from NestJS API
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const attemptsRes = await fetch(`${API_URL}/attempts`, {
      headers,
      redirect: 'follow',
    });

    if (!attemptsRes.ok) {
      console.error('Failed to fetch attempts from API:', attemptsRes.status);
      return NextResponse.json(
        { message: 'Failed to fetch attempts' },
        { status: attemptsRes.status }
      );
    }

    const attemptsData = await attemptsRes.json();
    
    // Handle different response structures from NestJS API
    const userAttempts = attemptsData?.data?.attempts || attemptsData?.attempts || attemptsData || [];
    
    // Filter completed attempts
    const completedAttempts = userAttempts.filter(
      (attempt: any) => attempt.status === 'completed'
    );

    // Group by templateId and count
    const attemptsByTemplate: Record<number, AttemptSummary> = completedAttempts.reduce(
      (acc: Record<number, AttemptSummary>, attempt: any) => {
        const templateId = attempt.templateId;
        if (!acc[templateId]) {
          acc[templateId] = {
            templateId,
            completedCount: 0,
            lastAttempt: null,
            bestScore: 0
          };
        }
        acc[templateId].completedCount++;
        
        // Track last attempt
        if (!acc[templateId].lastAttempt || 
            new Date(attempt.endTime) > new Date(acc[templateId].lastAttempt!)) {
          acc[templateId].lastAttempt = attempt.endTime;
        }
        
        // Track best score
        if (attempt.percentage > acc[templateId].bestScore) {
          acc[templateId].bestScore = attempt.percentage;
        }
        
        return acc;
      },
      {}
    );

    return NextResponse.json(Object.values(attemptsByTemplate));

  } catch (error: any) {
    console.error('Error in GET /api/user/attempts:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
