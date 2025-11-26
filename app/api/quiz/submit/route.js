// app/api/quiz/submit/route.js

import { NextResponse } from 'next/server';
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

function saveData(filename, data) {
  try {
    const filePath = path.join(dataDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error saving ${filename}:`, error);
    return false;
  }
}

export async function POST(request) {
  try {
    const { attemptId, answers } = await request.json();

    if (!attemptId || !answers) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Load data
    const userAttempts = loadData('userAttempts.json');
    const questionBank = loadData('questionBank.json');
    const templates = loadData('quizTemplates.json');

    // Find the attempt
    const attemptIndex = userAttempts.findIndex(a => a.id === attemptId);
    
    if (attemptIndex === -1) {
      return NextResponse.json({ message: 'Attempt not found' }, { status: 404 });
    }

    const attempt = userAttempts[attemptIndex];
    
    if (attempt.status !== 'in_progress') {
      return NextResponse.json({ message: 'This attempt is already completed' }, { status: 400 });
    }

    // Find the template
    const template = templates.find(t => t.id === attempt.templateId);
    
    if (!template) {
      return NextResponse.json({ message: 'Template not found' }, { status: 404 });
    }

    // Calculate score
    let correctCount = 0;
    const attemptDetails = [];

    for (const [questionIdStr, userAnswer] of Object.entries(answers)) {
      const questionId = parseInt(questionIdStr);
      const question = questionBank.find(q => q.id === questionId);

      if (!question) continue;

      let isCorrect = false;

      if (question.type === 'single_choice') {
        // Single choice: compare single value
        isCorrect = userAnswer === question.correctOptionId;
        attemptDetails.push({
          questionId: questionId,
          submittedOptionId: userAnswer,
          isCorrect: isCorrect
        });
      } else if (question.type === 'multi_choice') {
        // Multiple choice: compare arrays
        const userAnswerArray = Array.isArray(userAnswer) ? userAnswer : [];
        const correctAnswers = question.correctOptionIds || [];
        
        // Check if arrays have same elements (order doesn't matter)
        isCorrect = userAnswerArray.length === correctAnswers.length &&
                   userAnswerArray.every(id => correctAnswers.includes(id));
        
        attemptDetails.push({
          questionId: questionId,
          submittedOptionIds: userAnswerArray,
          isCorrect: isCorrect
        });
      }

      if (isCorrect) {
        correctCount++;
      }
    }

    // Calculate percentage
    const totalQuestions = attempt.totalQuestions;
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const passed = percentage >= template.passingScore;

    // Update attempt
    userAttempts[attemptIndex] = {
      ...attempt,
      endTime: new Date().toISOString(),
      status: 'completed',
      score: correctCount,
      percentage: percentage,
      passed: passed,
      attemptDetails: attemptDetails
    };

    // Save updated attempts
    if (!saveData('userAttempts.json', userAttempts)) {
      return NextResponse.json({ message: 'Failed to save results' }, { status: 500 });
    }

    return NextResponse.json({
      attemptId: attemptId,
      score: correctCount,
      totalQuestions: totalQuestions,
      percentage: percentage,
      passed: passed
    });

  } catch (error) {
    console.error('Error in POST /api/quiz/submit:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
