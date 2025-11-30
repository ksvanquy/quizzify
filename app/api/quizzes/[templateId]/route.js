// app/api/quizzes/[templateId]/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loadData, shuffleArray } from './utils/data';
import fs from 'fs';
import path from 'path';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request, { params }) {
  try {
    const { templateId: templateIdParam } = await params;
    const templateId = parseInt(templateIdParam);

    // Check authentication
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json({ 
        message: 'Bạn cần đăng nhập để làm bài thi.' 
      }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const userId = session.userId;

    // 1. Tải Dữ Liệu từ NestJS API
    const headers = {
      'Authorization': `Bearer ${session.token || session.accessToken || ''}`,
    };
    
    let template, questions;
    
    try {
      // Lấy quiz template từ NestJS API
      const templateRes = await fetch(`${API_URL}/quizzes/${templateId}`, { headers });
      if (!templateRes.ok) {
        return NextResponse.json({ message: 'Quiz template not found.' }, { status: 404 });
      }
      
      const templateData = await templateRes.json();
      if (!templateData.success || !templateData.data || !templateData.data.quiz) {
        return NextResponse.json({ message: 'Quiz template not found.' }, { status: 404 });
      }
      
      template = templateData.data.quiz;
      
      if (template.status !== 'active') {
        return NextResponse.json({ message: 'Quiz template is not active.' }, { status: 404 });
      }
      
      // Lấy questions từ NestJS API
      const questionsRes = await fetch(`${API_URL}/questions`, { headers });
      if (!questionsRes.ok) {
        return NextResponse.json({ message: 'Failed to load questions.' }, { status: 500 });
      }
      
      const questionsData = await questionsRes.json();
      // API trả về {success, data: {questions: [...], total: number}}
      questions = questionsData?.data?.questions || [];
      
      console.log('Template loaded:', template?.name);
      console.log('Questions loaded:', questions?.length);
      
    } catch (error) {
      console.error('Error fetching from API:', error);
      return NextResponse.json({ message: 'Failed to load quiz data.' }, { status: 500 });
    }
    
    // Check user attempts using NestJS API
    let userAttemptsCount = 0;
    try {
      const attemptsRes = await fetch(`${API_URL}/attempts/template/${templateId}`, { headers });
      if (attemptsRes.ok) {
        const attemptsData = await attemptsRes.json();
        const attempts = attemptsData?.data?.attempts || [];
        userAttemptsCount = attempts.filter(a => a.status === 'completed').length;
      }
    } catch (error) {
      console.error('Error fetching attempts:', error);
    }

    // 2. Kiểm tra giới hạn số lần làm bài (maxAttempts)
    console.log('User completed attempts:', userAttemptsCount, 'Max allowed:', template.maxAttempts);

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
  
    // 5. Ghi nhận Bài thi đang làm (`in_progress`)
    const newAttemptId = Math.max(...userAttempts.map(a => a.id), 0) + 1;
    const newAttempt = {
        id: newAttemptId,
        userId: userId,
        templateId: templateId,
        startTime: new Date().toISOString(),
        status: 'in_progress',
        totalQuestions: quizDataForClient.length,
        attemptDetails: []
    };
    
    // Lưu lại attempt (LƯU Ý: Đây là phương pháp đơn giản cho JSON CSDL)
    // Trong môi trường thực tế, bạn sẽ ghi vào CSDL
    userAttempts.push(newAttempt);
    const dataDir = path.join(process.cwd(), 'app', 'data');
    fs.writeFileSync(path.join(dataDir, 'userAttempts.json'), JSON.stringify(userAttempts, null, 2));


    // 6. Trả về dữ liệu bài thi
    return NextResponse.json({
        attemptId: newAttemptId,
        quizTitle: template.name,
        duration: template.durationMinutes,
        questions: quizDataForClient
    });
  } catch (error) {
    console.error('Error in GET /api/quizzes/[templateId]:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}