// app/api/results/[attemptId]/route.js
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const dataDir = path.join(process.cwd(), 'app', 'data');

function loadData(filename) {
  try {
    const filePath = path.join(dataDir, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return [];
  }
}

export async function GET(request, { params }) {
  try {
    const { attemptId: attemptIdParam } = await params;
    const attemptId = attemptIdParam; // Keep as string for MongoDB ObjectId

    // Get attempt from NestJS API
    const headers = {};
    const auth = request.headers.get('authorization');
    const cookie = request.headers.get('cookie');
    if (auth) headers['Authorization'] = auth;
    if (cookie) headers['cookie'] = cookie;
    
    let attempt;
    
    try {
      const attemptRes = await fetch(`${API_URL}/attempts/${attemptId}`, { headers });
      if (!attemptRes.ok) {
        return NextResponse.json({ message: 'Attempt not found' }, { status: 404 });
      }
      
      const attemptData = await attemptRes.json();
      if (!attemptData.success || !attemptData.data || !attemptData.data.attempt) {
        return NextResponse.json({ message: 'Attempt not found' }, { status: 404 });
      }
      
      attempt = attemptData.data.attempt;
      
    } catch (error) {
      console.error('Error fetching attempt:', error);
      return NextResponse.json({ message: 'Failed to load attempt' }, { status: 500 });
    }

    if (attempt.status !== 'completed') {
      return NextResponse.json({ message: 'This attempt is not completed yet' }, { status: 400 });
    }

    // NestJS API already returns all necessary data in attempt object
    // Including questions with user answers, scores, etc.
    
    // Calculate duration if needed
    const startTime = new Date(attempt.startedAt);
    const endTime = new Date(attempt.submittedAt);
    const durationMinutes = Math.round((endTime - startTime) / 1000 / 60);

    return NextResponse.json({
      attemptId: attempt.id,
      quizTitle: attempt.templateId, // May need to fetch template name if needed
      score: attempt.totalScore,
      maxScore: attempt.questions?.length || 0,
      correctCount: attempt.questions?.filter(q => q.isCorrect).length || 0,
      totalQuestions: attempt.questions?.length || 0,
      percentage: attempt.percentage,
      passingScore: 0, // Need to fetch template if needed
      passed: attempt.passed,
      durationMinutes: attempt.timeSpentSeconds ? Math.round(attempt.timeSpentSeconds / 60) : durationMinutes,
      startTime: attempt.startedAt,
      endTime: attempt.submittedAt,
      questions: attempt.questions || [], // NestJS API includes all question details
      userAnswers: attempt.userAnswers || {}
    });

  } catch (error) {
    console.error('Error in GET /api/results/[attemptId]:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
