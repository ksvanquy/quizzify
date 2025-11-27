// app/api/quiz/submit/route.js

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  scoreSingleChoice,
  scoreMultiChoice,
  scoreTrueFalse,
  scoreOrdering,
  scoreMatching,
  scoreFillBlank,
  scoreImageChoice,
  scoreNumericInput,
  scoreClozeTest,
  calculateTotalScore
} from '@/app/utils/scoring';

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

    // Check authentication
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json({ 
        message: 'Bạn cần đăng nhập để nộp bài.' 
      }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const userId = session.userId;

    // Load data
    const userAttempts = loadData('userAttempts.json');
    const questions = loadData('questions.json');
    const templates = loadData('quizTemplates.json');

    // Find the attempt
    const attemptIndex = userAttempts.findIndex(a => a.id === attemptId);
    
    if (attemptIndex === -1) {
      return NextResponse.json({ message: 'Attempt not found' }, { status: 404 });
    }

    const attempt = userAttempts[attemptIndex];

    // Verify attempt belongs to the authenticated user
    if (attempt.userId !== userId) {
      return NextResponse.json({ 
        message: 'Bạn không có quyền nộp bài thi này.' 
      }, { status: 403 });
    }
    
    if (attempt.status !== 'in_progress') {
      return NextResponse.json({ message: 'This attempt is already completed' }, { status: 400 });
    }

    // Find the template
    const template = templates.find(t => t.id === attempt.templateId);
    
    if (!template) {
      return NextResponse.json({ message: 'Template not found' }, { status: 404 });
    }

    // Get all question IDs for this quiz
    let allQuestionIds = [];
    if (template.questionSelection?.mode === 'manual') {
      allQuestionIds = template.questionSelection.manualQuestionIds || [];
    } else if (template.questionSelection?.mode === 'random') {
      // For random mode, get from what was loaded for this attempt
      // You may need to get this from quiz start API - for now use attempt.totalQuestions
      allQuestionIds = Object.keys(answers).map(id => parseInt(id));
    }

    // Calculate score for ALL questions in the quiz (not just answered ones)
    const questionResults = [];

    for (const questionId of allQuestionIds) {
      const question = questions.find(q => q.id === questionId);
      if (!question) continue;

      const points = question.points || 1;
      const userAnswer = answers[questionId.toString()];
      let scoreResult;

      // If question was not answered, mark as incorrect with 0 score
      if (userAnswer === undefined || userAnswer === null) {
        scoreResult = {
          questionId: 0,
          isCorrect: false,
          score: 0,
          maxScore: points,
          percentage: 0
        };
      } else {
        switch (question.type) {
          case 'single_choice':
            scoreResult = scoreSingleChoice(question.correctOptionId, userAnswer, points);
            break;

          case 'multi_choice':
            scoreResult = scoreMultiChoice(
              question.correctOptionIds || [],
              Array.isArray(userAnswer) ? userAnswer : [],
              points
            );
            break;

          case 'true_false':
            scoreResult = scoreTrueFalse(question.correctAnswer, userAnswer, points);
            break;

          case 'ordering':
            scoreResult = scoreOrdering(
              question.correctOrder || [],
              Array.isArray(userAnswer) ? userAnswer : [],
              points
            );
            break;

          case 'matching':
            scoreResult = scoreMatching(
              question.correctMatches || {},
              typeof userAnswer === 'object' && userAnswer !== null ? userAnswer : {},
              points
            );
            break;

          case 'fill_blank':
            scoreResult = scoreFillBlank(
              question.correctAnswers || [],
              typeof userAnswer === 'string' ? userAnswer : '',
              question.caseSensitive || false,
              points
            );
            break;

          case 'image_choice':
            scoreResult = scoreImageChoice(
              question.correctOptionId,
              userAnswer,
              points,
              false
            );
            break;

          case 'image_choice_multiple':
            scoreResult = scoreImageChoice(
              question.correctOptionIds || [],
              Array.isArray(userAnswer) ? userAnswer : [],
              points,
              true
            );
            break;

          case 'numeric_input':
            scoreResult = scoreNumericInput(
              question.correctAnswer,
              userAnswer,
              question.tolerance || 0,
              points
            );
            break;

          case 'cloze_test':
            scoreResult = scoreClozeTest(
              question.correctAnswers || {},
              typeof userAnswer === 'object' && userAnswer !== null ? userAnswer : {},
              question.caseSensitive || false,
              points
            );
            break;

          default:
            scoreResult = {
              questionId: 0,
              isCorrect: false,
              score: 0,
              maxScore: points,
              percentage: 0
            };
        }
      }

      questionResults.push({
        questionId,
        userAnswer: userAnswer || null,
        earnedPoints: scoreResult.score,
        maxPoints: scoreResult.maxScore,
        isCorrect: scoreResult.isCorrect
      });
    }

    // Convert to format expected by calculateTotalScore
    const resultsForScoring = questionResults.map(r => ({
      questionId: r.questionId,
      isCorrect: r.isCorrect,
      score: r.earnedPoints,
      maxScore: r.maxPoints,
      percentage: r.maxPoints > 0 ? (r.earnedPoints / r.maxPoints) * 100 : 0
    }));

    // Calculate total score
    const { totalScore, maxScore, percentage: scorePercentage, correctCount } = calculateTotalScore(resultsForScoring);
    const totalQuestions = questionResults.length;
    
    // Calculate percentage based on correct count (standard quiz grading)
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const passed = percentage >= template.passingScore;

    // Update attempt
    userAttempts[attemptIndex] = {
      ...attempt,
      endTime: new Date().toISOString(),
      status: 'completed',
      score: totalScore,
      maxScore: maxScore,
      percentage: percentage,
      passed: passed,
      correctCount: correctCount,
      attemptDetails: questionResults
    };

    // Save updated attempts
    if (!saveData('userAttempts.json', userAttempts)) {
      return NextResponse.json({ message: 'Failed to save results' }, { status: 500 });
    }

    return NextResponse.json({
      attemptId: attemptId,
      score: totalScore,
      maxScore: maxScore,
      correctCount: correctCount,
      totalQuestions: totalQuestions,
      percentage: percentage,
      passed: passed
    });

  } catch (error) {
    console.error('Error in POST /api/quiz/submit:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
