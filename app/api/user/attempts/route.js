// app/api/user/attempts/route.js

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

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

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const userId = session.userId;

    // Load user attempts
    const userAttempts = loadData('userAttempts.json');
    
    // Filter completed attempts for this user
    const completedAttempts = userAttempts.filter(
      attempt => attempt.userId === userId && attempt.status === 'completed'
    );

    // Group by templateId and count
    const attemptsByTemplate = completedAttempts.reduce((acc, attempt) => {
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
          new Date(attempt.endTime) > new Date(acc[templateId].lastAttempt)) {
        acc[templateId].lastAttempt = attempt.endTime;
      }
      
      // Track best score
      if (attempt.percentage > acc[templateId].bestScore) {
        acc[templateId].bestScore = attempt.percentage;
      }
      
      return acc;
    }, {});

    return NextResponse.json(Object.values(attemptsByTemplate));

  } catch (error) {
    console.error('Error in GET /api/user/attempts:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
