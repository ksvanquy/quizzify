// app/api/quizzes/[templateId]/route.js
import { NextResponse } from 'next/server';
import { shuffleArray } from './utils/data';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper function like bookmarks route
async function forwardRequest(path, req, init = {}) {
  const headers = { ...(init.headers || {}) };

  const auth = req.headers.get('authorization');
  const cookie = req.headers.get('cookie');
  
  console.log(`[forwardRequest] ${init.method || 'GET'} ${path}`);
  console.log('  Full Cookie:', cookie || 'MISSING');
  
  // Parse cookies to extract accessToken
  const cookies = {};
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
  
  const fetchOptions = { ...init, headers, redirect: 'follow' };
  
  // Only add body if it exists and method is not GET
  if (init.body && init.method !== 'GET') {
    fetchOptions.body = init.body;
  }

  const res = await fetch(url, fetchOptions);
  const text = await res.text();

  let body = text;
  try {
    body = JSON.parse(text);
  } catch (e) {
    // leave as text
  }

  return { status: res.status, body };
}

export async function GET(request, { params }) {
  try {
    const { templateId } = await params;
    
    // Fetch quiz template using forwardRequest
    const templateResult = await forwardRequest(`/quizzes/${templateId}`, request, { method: 'GET' });
    
    if (templateResult.status !== 200) {
      return NextResponse.json(templateResult.body || { message: 'Quiz template not found.' }, { status: templateResult.status });
    }
    
    const template = templateResult.body?.data?.quiz;
    
    if (!template) {
      return NextResponse.json({ message: 'Quiz template not found.' }, { status: 404 });
    }
    
    if (template.status !== 'active') {
      return NextResponse.json({ message: 'Quiz template is not active.' }, { status: 404 });
    }
    
    // Fetch questions using forwardRequest
    const questionsResult = await forwardRequest('/questions', request, { method: 'GET' });
    
    if (questionsResult.status !== 200) {
      return NextResponse.json({ message: 'Failed to load questions.' }, { status: 500 });
    }
    
    const questions = questionsResult.body?.data?.questions || [];
    
    console.log(`📊 Loaded ${questions.length} questions from NestJS`);
    if (questions.length > 0) {
      console.log('📄 Sample question structure:', JSON.stringify(questions[0], null, 2));
    }
    console.log(`📋 Template questionSelection mode: ${template.questionSelection?.mode}`);
    
    // Check user attempts using forwardRequest
    let userAttemptsCount = 0;
    const attemptsResult = await forwardRequest(`/attempts/template/${templateId}`, request, { method: 'GET' });
    
    if (attemptsResult.status === 200) {
      const attempts = attemptsResult.body?.data?.attempts || [];
      userAttemptsCount = attempts.filter(a => a.status === 'completed').length;
    }

    // 2. Kiểm tra giới hạn số lần làm bài (maxAttempts)

    if (template.maxAttempts !== 0 && userAttemptsCount >= template.maxAttempts) {
      return NextResponse.json({ 
        message: `Bạn đã hết số lần làm bài cho bài thi này. Đã làm: ${userAttemptsCount}/${template.maxAttempts} lần.` 
      }, { status: 403 });
    }

    // 3. Chọn Câu Hỏi theo cấu hình (questionSelection)
    let selectedQuestions = [];

    if (template.questionSelection.mode === 'manual' && template.questionSelection.manualQuestionIds) {
      // Hỗ trợ MongoDB ObjectId (string)
      const manualIds = template.questionSelection.manualQuestionIds.map(id => String(id));
      console.log('🔍 Looking for manualQuestionIds:', manualIds);
      console.log('🔍 Available question IDs:', questions.map(q => String(q.id || q._id)));
      
      selectedQuestions = questions.filter(q => {
        const qId = String(q.id || q._id);
        return manualIds.includes(qId);
      });
    } else if (template.questionSelection.mode === 'random') {
      // Lọc theo chủ đề
      const filteredQuestions = questions.filter(q => 
        template.questionSelection.sourceTopics.includes(q.topic)
      );
      
      // Chọn ngẫu nhiên theo độ khó
      const counts = template.questionSelection.randomCounts;
      
      for (const [difficulty, count] of Object.entries(counts)) {
        const questionsByDifficulty = filteredQuestions
          .filter(q => q.difficulty === difficulty);
          
        const shuffled = shuffleArray([...questionsByDifficulty]); // Sao chép và xáo trộn
        selectedQuestions.push(...shuffled.slice(0, count));
      }
      
      // Xáo trộn lần cuối để trộn các độ khó lại với nhau
      shuffleArray(selectedQuestions);
    }

    console.log(`✅ Selected ${selectedQuestions.length} questions for quiz`);
    
    if (selectedQuestions.length === 0) {
      console.error('❌ No questions selected!');
      console.error('Template:', JSON.stringify(template.questionSelection, null, 2));
      console.error('Available questions:', questions.length);
      return NextResponse.json({ 
        message: 'No questions found in quiz. Please configure quiz questions in admin panel.' 
      }, { status: 500 });
    }

    // 4. Chuẩn bị dữ liệu cho Frontend (Lọc đáp án đúng và Ghép nối options)
    const quizDataForClient = selectedQuestions.map(q => {
      const questionData = {
        id: q.id || q._id, // Hỗ trợ MongoDB ObjectId
        text: q.text,
        type: q.type,
        points: q.points || 1
      };

      // Xử lý theo từng loại câu hỏi
      if (q.type === 'single_choice' || q.type === 'multi_choice') {
        // TODO: NestJS API cần populate options hoặc có endpoint riêng để lấy answers
        // Tạm thời sử dụng optionIds nếu có, hoặc cần fetch từ answers API
        const options = q.options || []; // Giả định API sẽ populate options
        
        // Xáo trộn nếu cần
        if (q.shuffleOptions && options.length > 0) {
          shuffleArray(options);
        }
        
        questionData.options = options;
      } else if (q.type === 'true_false') {
        // True/False không cần options
        // correctAnswer sẽ được giữ bí mật
      } else if (q.type === 'ordering') {
        // Gửi items nhưng xáo trộn thứ tự
        const items = q.shuffleOptions ? shuffleArray([...q.items]) : q.items;
        questionData.items = items;
      } else if (q.type === 'matching') {
        // Gửi pairs nhưng xáo trộn
        const pairs = q.pairs || [];
        if (q.shuffleOptions) {
          questionData.leftItems = shuffleArray(pairs.map(p => p.left));
          questionData.rightItems = shuffleArray(pairs.map(p => p.right));
        } else {
          questionData.leftItems = pairs.map(p => p.left);
          questionData.rightItems = pairs.map(p => p.right);
        }
      } else if (q.type === 'fill_blank') {
        // Fill blank chỉ cần text, không cần gửi correctAnswers
        questionData.caseSensitive = q.caseSensitive || false;
      } else if (q.type === 'image_choice' || q.type === 'image_choice_multiple') {
        // Image choice - options should be populated by API
        let options = q.options || [];
        
        // Xáo trộn nếu cần
        if (q.shuffleOptions && options.length > 0) {
          options = shuffleArray([...options]);
        }
        
        questionData.options = options;
      } else if (q.type === 'numeric_input') {
        // Numeric input - gửi unit, step, tolerance (nếu có)
        questionData.unit = q.unit || '';
        questionData.step = q.step || 'any';
        questionData.tolerance = q.tolerance || 0;
      } else if (q.type === 'cloze_test') {
        // Cloze test - text đã có placeholder {{blank_id}}
        questionData.caseSensitive = q.caseSensitive || false;
      }

      return questionData;
    });
  
    // 5. Tạo Attempt mới qua forwardRequest
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
      return NextResponse.json({ message: 'No attempt ID returned' }, { status: 500 });
    }

    // 6. Trả về dữ liệu bài thi
    return NextResponse.json({
        attemptId: attemptId,
        quizTitle: template.name,
        duration: template.durationMinutes,
        questions: quizDataForClient
    });
  } catch (error) {
    console.error('Error in GET /api/quizzes/[templateId]:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}