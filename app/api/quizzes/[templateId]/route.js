// app/api/quizzes/[templateId]/route.js

import { NextResponse } from 'next/server';
import { loadData, shuffleArray } from './utils/data'; // Import các hàm hỗ trợ
import fs from 'fs';
import path from 'path';

// Giả định userId được truyền qua Header hoặc Session (để đơn giản, ta dùng ID cứng)
const MOCK_USER_ID = 1; 

export async function GET(request, { params }) {
  try {
    const { templateId: templateIdParam } = await params;
    const templateId = parseInt(templateIdParam);

    // 1. Tải Dữ Liệu
    const templates = loadData('quizTemplates.json');
    const questionBank = loadData('questionBank.json');
    const questionOptions = loadData('questionOptions.json');
    const userAttempts = loadData('userAttempts.json');
    
    console.log('Templates loaded:', templates.length);
    console.log('Looking for templateId:', templateId);
    
    const template = templates.find(t => t.id === templateId);

    if (!template || template.status !== 'active') {
      return NextResponse.json({ message: 'Quiz template not found or inactive.' }, { status: 404 });
    }

    // 2. Kiểm tra giới hạn số lần làm bài (maxAttempts)
    const userAttemptsCount = userAttempts.filter(
      attempt => attempt.userId === MOCK_USER_ID && attempt.templateId === templateId && attempt.status === 'completed'
    ).length;

    console.log('User completed attempts:', userAttemptsCount, 'Max allowed:', template.maxAttempts);

    if (template.maxAttempts !== 0 && userAttemptsCount >= template.maxAttempts) {
      return NextResponse.json({ 
        message: `Bạn đã hết số lần làm bài cho bài thi này. Đã làm: ${userAttemptsCount}/${template.maxAttempts} lần.` 
      }, { status: 403 });
    }

    // 3. Chọn Câu Hỏi theo cấu hình (questionSelection)
    let selectedQuestions = [];

    if (template.questionSelection.mode === 'manual' && template.questionSelection.manualQuestionIds) {
      selectedQuestions = questionBank.filter(q => 
        template.questionSelection.manualQuestionIds.includes(q.id)
      );
    } else if (template.questionSelection.mode === 'random') {
      // Lọc theo chủ đề
      const filteredQuestions = questionBank.filter(q => 
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
        id: q.id,
        text: q.text,
        type: q.type,
        points: q.points || 1
      };

      // Xử lý theo từng loại câu hỏi
      if (q.type === 'single_choice' || q.type === 'multi_choice') {
        // Lấy options cho single/multi choice
        const options = questionOptions
          .filter(opt => q.answerOptionIds && q.answerOptionIds.includes(opt.id))
          .map(opt => ({ id: opt.id, text: opt.text }));
        
        // Xáo trộn nếu cần
        if (q.shuffleOptions) {
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
      }

      return questionData;
    });
  
    // 5. Ghi nhận Bài thi đang làm (`in_progress`)
    const newAttemptId = Math.max(...userAttempts.map(a => a.id), 0) + 1;
    const newAttempt = {
        id: newAttemptId,
        userId: MOCK_USER_ID,
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