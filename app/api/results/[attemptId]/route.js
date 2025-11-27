// app/api/results/[attemptId]/route.js

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

export async function GET(request, { params }) {
  try {
    const { attemptId: attemptIdParam } = await params;
    const attemptId = parseInt(attemptIdParam);

    // Load data
    const userAttempts = loadData('userAttempts.json');
    const templates = loadData('quizTemplates.json');
    const questions = loadData('questions.json');
    const answers = loadData('answers.json');

    // Find the attempt
    const attempt = userAttempts.find(a => a.id === attemptId);
    
    if (!attempt) {
      return NextResponse.json({ message: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.status !== 'completed') {
      return NextResponse.json({ message: 'This attempt is not completed yet' }, { status: 400 });
    }

    // Find the template
    const template = templates.find(t => t.id === attempt.templateId);
    
    if (!template) {
      return NextResponse.json({ message: 'Template not found' }, { status: 404 });
    }

    // Calculate duration
    const startTime = new Date(attempt.startTime);
    const endTime = new Date(attempt.endTime);
    const durationMinutes = Math.round((endTime - startTime) / 1000 / 60);

    // Get question IDs based on selection mode
    let questionIds = [];
    if (template.questionSelection?.mode === 'manual') {
      questionIds = template.questionSelection.manualQuestionIds || [];
    } else if (template.questionSelection?.mode === 'random') {
      // For random mode, we need to get the actual questions from the attempt
      // since they were randomly selected when the quiz started
      questionIds = attempt.attemptDetails?.map(detail => detail.questionId) || [];
    } else {
      // Fallback: try to get from old questionIds field
      questionIds = template.questionIds || [];
    }

    // Get full question details with options
    const questionsWithDetails = questionIds.map(qId => {
      const question = questions.find(q => q.id === qId);
      if (!question) return null;

      // Add options for single_choice and multi_choice questions
      if (question.type === 'single_choice' || question.type === 'multi_choice') {
        const options = answers.filter(opt => opt.questionId === qId);
        return { ...question, options };
      }

      return question;
    }).filter(q => q !== null);

    return NextResponse.json({
      attemptId: attempt.id,
      quizTitle: template.name,
      score: attempt.score,
      maxScore: attempt.maxScore || attempt.totalQuestions,
      correctCount: attempt.correctCount || attempt.score,
      totalQuestions: attempt.totalQuestions,
      percentage: attempt.percentage,
      passingScore: template.passingScore,
      passed: attempt.passed,
      durationMinutes: durationMinutes,
      startTime: attempt.startTime,
      endTime: attempt.endTime,
      attemptDetails: attempt.attemptDetails || [],
      questions: template.revealAnswersAfterSubmission ? questionsWithDetails : []
    });

  } catch (error) {
    console.error('Error in GET /api/results/[attemptId]:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
