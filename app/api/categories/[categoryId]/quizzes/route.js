// app/api/categories/[categoryId]/quizzes/route.js
import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request, { params }) {
  try {
    const { categoryId } = await params;
    
    const { searchParams } = new URL(request.url);
    const includeChildren = searchParams.get('includeChildren') !== 'false';
    const difficulty = searchParams.get('difficulty');
    const sortBy = searchParams.get('sortBy') || 'name';

    // Fetch from NestJS API
    const headers = {};
    const auth = request.headers.get('authorization');
    const cookie = request.headers.get('cookie');
    if (auth) headers['Authorization'] = auth;
    if (cookie) headers['cookie'] = cookie;

    // Fetch all categories to find children if needed
    let categoryIds = [categoryId];
    
    if (includeChildren) {
      const categoriesRes = await fetch(`${API_URL}/categories?active=true`, { headers });
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        const categories = categoriesData?.data?.categories || [];
        
        // Find the target category
        const targetCategory = categories.find(cat => cat.id === categoryId);
        if (targetCategory) {
          // Find children by matching displayOrder (legacy ID mapping)
          const children = categories.filter(cat => cat.parentId === targetCategory.displayOrder);
          categoryIds.push(...children.map(c => c.id));
        }
      }
    }

    // Fetch all quizzes
    const quizzesRes = await fetch(`${API_URL}/quizzes?status=active`, { headers });
    
    if (!quizzesRes.ok) {
      return NextResponse.json({ message: 'Failed to load quizzes' }, { status: 500 });
    }

    const quizzesData = await quizzesRes.json();
    const allQuizzes = quizzesData?.data?.quizzes || [];
    
    // Filter quizzes by categoryIds
    let quizzes = allQuizzes.filter(quiz => categoryIds.includes(quiz.categoryId));

    // Lọc theo difficulty nếu có
    if (difficulty) {
      quizzes = quizzes.filter(quiz => quiz.difficulty === difficulty);
    }

    // Sắp xếp
    quizzes.sort((a, b) => {
      if (sortBy === 'duration') {
        return a.durationMinutes - b.durationMinutes;
      } else if (sortBy === 'difficulty') {
        const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      } else {
        return a.name.localeCompare(b.name);
      }
    });

    return NextResponse.json({
      quizzes: quizzes,
      total: quizzes.length
    });

  } catch (error) {
    console.error('Error in GET /api/categories/[categoryId]/quizzes:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
