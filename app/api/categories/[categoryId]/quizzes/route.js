// app/api/categories/[categoryId]/quizzes/route.js

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

// Lấy tất cả category con
function getAllChildCategoryIds(categoryId, categories) {
  const children = categories.filter(cat => cat.parentId === categoryId);
  const childIds = children.map(cat => cat.id);
  
  // Đệ quy lấy các category con của con
  children.forEach(child => {
    childIds.push(...getAllChildCategoryIds(child.id, categories));
  });
  
  return childIds;
}

export async function GET(request, { params }) {
  try {
    const { categoryId: categoryIdParam } = await params;
    const categoryId = parseInt(categoryIdParam);
    
    const { searchParams } = new URL(request.url);
    const includeChildren = searchParams.get('includeChildren') !== 'false'; // Mặc định true
    const difficulty = searchParams.get('difficulty'); // easy, medium, hard
    const sortBy = searchParams.get('sortBy') || 'name'; // name, duration, difficulty

    const categories = loadData('categories.json');
    const quizTemplates = loadData('quizTemplates.json');

    // Kiểm tra category tồn tại
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }

    // Lấy danh sách categoryIds cần filter
    let categoryIds = [categoryId];
    if (includeChildren) {
      categoryIds = [...categoryIds, ...getAllChildCategoryIds(categoryId, categories)];
    }

    // Lọc quiz theo category
    let quizzes = quizTemplates.filter(quiz => 
      categoryIds.includes(quiz.categoryId) && quiz.status === 'active'
    );

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

    // Thêm thông tin category vào mỗi quiz
    const quizzesWithCategory = quizzes.map(quiz => {
      const quizCategory = categories.find(cat => cat.id === quiz.categoryId);
      return {
        ...quiz,
        category: quizCategory ? {
          id: quizCategory.id,
          name: quizCategory.name,
          slug: quizCategory.slug,
          icon: quizCategory.icon
        } : null
      };
    });

    return NextResponse.json({
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        icon: category.icon,
        description: category.description
      },
      quizzes: quizzesWithCategory,
      total: quizzesWithCategory.length
    });

  } catch (error) {
    console.error('Error in GET /api/categories/[categoryId]/quizzes:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
