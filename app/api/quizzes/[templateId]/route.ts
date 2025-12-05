import { NextResponse } from 'next/server';
import { shuffleArray } from './utils/data';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ForwardRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

interface ForwardRequestResult {
  status: number;
  body: any;
}

interface RouteParams {
  templateId: string;
}

// Helper function like bookmarks route
async function forwardRequest(
  path: string,
  req: Request,
  init: ForwardRequestOptions = {}
): Promise<ForwardRequestResult> {
  const headers: Record<string, string> = { ...(init.headers || {}) };

  const auth = req.headers.get('authorization');
  const cookie = req.headers.get('cookie');
  
  console.log(`[forwardRequest] ${init.method || 'GET'} ${path}`);
  console.log('  Full Cookie:', cookie || 'MISSING');
  
  // Parse cookies to extract accessToken
  const cookies: Record<string, string> = {};
  if (cookie) {
    cookie.split(';').forEach(c => {
      const [name, ...valueParts] = c.trim().split('=');
      cookies[name] = valueParts.join('=');
    });
  }
  console.log('  Parsed cookies:', Object.keys(cookies).join(', '));
  console.log('  Has accessToken cookie:', !!cookies['accessToken'] ? 'YES' : 'NO');
  
  // CRITICAL: NestJS needs Authorization header, not cookie!
  // Extract accessToken from cookie and add to Authorization header
  if (cookies['accessToken']) {
    headers['Authorization'] = `Bearer ${cookies['accessToken']}`;
    console.log('  ✅ Set Authorization header from cookie');
  } else if (auth) {
    headers['Authorization'] = auth;
    console.log('  ✅ Using existing Authorization header');
  } else {
    console.log('  ❌ NO Authorization header or accessToken cookie!');
  }
  
  // Still forward cookie header for any other uses
  if (cookie) headers['cookie'] = cookie;

  const url = `${API_URL}${path}`;
  
  const fetchOptions: RequestInit = { ...init, headers, redirect: 'follow' };
  
  // Only add body if it exists and method is not GET
  if (init.body && init.method !== 'GET') {
    fetchOptions.body = init.body;
  }

  const res = await fetch(url, fetchOptions);
  const text = await res.text();

  let body: any = text;
  try {
    body = JSON.parse(text);
  } catch (e) {
    // leave as text
  }

  return { status: res.status, body };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { templateId } = await params;
    
    console.log(`\n🎯 GET /api/quizzes/${templateId} - Starting`);
    
    // Fetch quiz template using forwardRequest
    const templateResult = await forwardRequest(`/quizzes/${templateId}`, request, { method: 'GET' });
    
    if (templateResult.status !== 200) {
      console.error(`❌ Failed to fetch template: status=${templateResult.status}`);
      return NextResponse.json(
        templateResult.body || { message: 'Quiz template not found.' },
        { status: templateResult.status }
      );
    }
    
    const template = templateResult.body?.data?.quiz;
    
    if (!template) {
      console.error('❌ Template not found in response');
      return NextResponse.json(
        { message: 'Quiz template not found.' },
        { status: 404 }
      );
    }
    
    console.log(`✅ Template loaded: ${template.name}`);
    
    if (template.status !== 'active') {
      console.error('❌ Template is not active');
      return NextResponse.json(
        { message: 'Quiz template is not active.' },
        { status: 404 }
      );
    }
    
    // Fetch questions using forwardRequest
    const questionsResult = await forwardRequest('/questions', request, { method: 'GET' });
    
    if (questionsResult.status !== 200) {
      console.error(`❌ Failed to fetch questions: status=${questionsResult.status}`);
      return NextResponse.json(
        { message: 'Failed to load questions.' },
        { status: 500 }
      );
    }
    
    // Handle both: data.questions (array) or data being array directly
    let questions: any[] = [];
    if (questionsResult.body?.data?.questions) {
      questions = questionsResult.body.data.questions;
    } else if (Array.isArray(questionsResult.body?.data)) {
      questions = questionsResult.body.data;
    } else if (Array.isArray(questionsResult.body)) {
      questions = questionsResult.body;
    }
    
    console.log(`✅ Loaded ${questions.length} questions from NestJS`);
    
    // Check user attempts using forwardRequest
    let userAttemptsCount = 0;
    const attemptsResult = await forwardRequest(`/attempts/template/${templateId}`, request, { method: 'GET' });
    
    if (attemptsResult.status === 200) {
      const attempts = attemptsResult.body?.data?.attempts || [];
      userAttemptsCount = attempts.filter((a: any) => a.status === 'completed').length;
    }

    // Check attempt limit
    if (template.maxAttempts !== 0 && userAttemptsCount >= template.maxAttempts) {
      return NextResponse.json(
        { 
          message: `Bạn đã hết số lần làm bài cho bài thi này. Đã làm: ${userAttemptsCount}/${template.maxAttempts} lần.` 
        },
        { status: 403 }
      );
    }

    // Select questions based on configuration
    let selectedQuestions: any[] = [];

    if (template.questionSelection?.mode === 'manual' && template.questionSelection.manualQuestionIds) {
      const manualIds = template.questionSelection.manualQuestionIds.map((id: any) => String(id));
      
      console.log('📋 Manual Question Selection');
      
      selectedQuestions = questions.filter(q => {
        const qId = String(q.id || q._id);
        return manualIds.includes(qId);
      });
      
      console.log(`   ✅ Matched: ${selectedQuestions.length}/${manualIds.length} questions`);
    } else if (template.questionSelection?.mode === 'random') {
      console.log('🎲 Random Question Selection');
      
      const filteredQuestions = questions.filter(q => 
        template.questionSelection?.sourceTopics?.includes(q.topic)
      );
      
      console.log(`   Filtered questions: ${filteredQuestions.length} / ${questions.length}`);
      
      // Select randomly by difficulty
      const counts = template.questionSelection.randomCounts || {};
      
      for (const [difficulty, count] of Object.entries(counts)) {
        const questionsByDifficulty = filteredQuestions.filter(q => q.difficulty === difficulty);
        const toSelect = Math.min(count as number, questionsByDifficulty.length);
        
        const shuffled = shuffleArray([...questionsByDifficulty]);
        selectedQuestions.push(...shuffled.slice(0, toSelect));
      }
      
      console.log(`   Total selected: ${selectedQuestions.length}`);
      
      // Shuffle one final time
      shuffleArray(selectedQuestions);
    }

    console.log(`✅ Selected ${selectedQuestions.length} questions for quiz`);
    
    if (selectedQuestions.length === 0) {
      console.error('❌ No questions selected!');
      return NextResponse.json(
        { 
          message: `No questions selected. Template mode: ${template.questionSelection?.mode}, Available questions: ${questions.length}`
        },
        { status: 500 }
      );
    }

    // Prepare quiz data for client (filter correct answers)
    const quizDataForClient = selectedQuestions.map((q: any) => {
      const questionData: any = {
        id: q.id || q._id,
        text: q.text,
        type: q.type,
        points: q.points || 1
      };

      // Handle by question type
      if (q.type === 'single_choice' || q.type === 'multi_choice') {
        const options = q.options || [];
        
        if (q.shuffleOptions && options.length > 0) {
          shuffleArray(options);
        }
        
        questionData.options = options;
      } else if (q.type === 'ordering') {
        const items = q.shuffleOptions ? shuffleArray([...q.items]) : q.items;
        questionData.items = items;
      } else if (q.type === 'matching') {
        const pairs = q.pairs || [];
        if (q.shuffleOptions) {
          questionData.leftItems = shuffleArray(pairs.map((p: any) => p.left));
          questionData.rightItems = shuffleArray(pairs.map((p: any) => p.right));
        } else {
          questionData.leftItems = pairs.map((p: any) => p.left);
          questionData.rightItems = pairs.map((p: any) => p.right);
        }
      } else if (q.type === 'fill_blank') {
        questionData.caseSensitive = q.caseSensitive || false;
      } else if (q.type === 'image_choice' || q.type === 'image_choice_multiple') {
        let options = q.options || [];
        
        if (q.shuffleOptions && options.length > 0) {
          options = shuffleArray([...options]);
        }
        
        questionData.options = options;
      } else if (q.type === 'numeric_input') {
        questionData.unit = q.unit || '';
        questionData.step = q.step || 'any';
        questionData.tolerance = q.tolerance || 0;
      } else if (q.type === 'cloze_test') {
        questionData.caseSensitive = q.caseSensitive || false;
      }

      return questionData;
    });
  
    // Create new attempt
    const createAttemptResult = await forwardRequest('/attempts', request, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId: templateId })
    });

    if (createAttemptResult.status !== 201 && createAttemptResult.status !== 200) {
      return NextResponse.json(
        createAttemptResult.body || { message: 'Failed to create attempt.' },
        { status: createAttemptResult.status }
      );
    }

    const attemptId = createAttemptResult.body?.data?.attempt?.id;
    
    if (!attemptId) {
      return NextResponse.json(
        { message: 'No attempt ID returned' },
        { status: 500 }
      );
    }

    // Return quiz data
    return NextResponse.json({
      attemptId: attemptId,
      quizTitle: template.name,
      duration: template.durationMinutes,
      questions: quizDataForClient
    });
    
  } catch (error: any) {
    console.error('Error in GET /api/quizzes/[templateId]:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
