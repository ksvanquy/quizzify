// app/api/categories/route.js

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
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

// Hàm chuyển đổi danh sách phẳng thành cây phân cấp
function buildCategoryTree(categories, parentId = null) {
  return categories
    .filter(cat => cat.parentId === parentId && cat.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(cat => ({
      ...cat,
      children: buildCategoryTree(categories, cat.id)
    }));
}

// Hàm đếm số quiz trong mỗi category (bao gồm cả children)
function countQuizzesInCategory(categoryId, categories, quizTemplates) {
  const childIds = categories
    .filter(cat => cat.parentId === categoryId)
    .map(cat => cat.id);
  
  const allCategoryIds = [categoryId, ...childIds.flatMap(id => 
    [id, ...countQuizzesInCategory(id, categories, quizTemplates).ids]
  )];
  
  const count = quizTemplates.filter(quiz => 
    allCategoryIds.includes(quiz.categoryId) && quiz.status === 'active'
  ).length;
  
  return { count, ids: childIds };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'tree'; // tree hoặc flat
    const includeStats = searchParams.get('includeStats') === 'true';

    // Fetch categories from NestJS API
    let categories = [];
    let quizTemplates = [];
    
    try {
      const headers = {};
      const auth = request.headers.get('authorization');
      const cookie = request.headers.get('cookie');
      if (auth) headers['Authorization'] = auth;
      if (cookie) headers['cookie'] = cookie;
      
      const categoriesRes = await fetch(`${API_URL}/categories?active=true`, { headers });
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        categories = categoriesData?.data?.categories || [];
      }
      
      // Fetch quizzes if stats needed
      if (includeStats) {
        const quizzesRes = await fetch(`${API_URL}/quizzes?status=active`, { headers });
        if (quizzesRes.ok) {
          const quizzesData = await quizzesRes.json();
          quizTemplates = quizzesData?.data?.quizzes || [];
        }
      }
    } catch (error) {
      console.error('Error fetching from API:', error);
      return NextResponse.json({ message: 'Failed to load categories' }, { status: 500 });
    }

    if (format === 'tree') {
      // Trả về dạng cây phân cấp
      const tree = buildCategoryTree(categories);
      
      if (includeStats) {
        // Thêm thống kê số quiz cho mỗi category (đơn giản hóa với NestJS API)
        const addStats = (nodes) => {
          return nodes.map(node => {
            const catId = String(node.id || node._id);
            const quizCount = quizTemplates.filter(q => String(q.categoryId) === catId).length;
            return {
              ...node,
              quizCount,
              children: addStats(node.children)
            };
          });
        };
        
        return NextResponse.json({
          success: true,
          data: { categories: addStats(tree) }
        });
      }
      
      return NextResponse.json({
        success: true,
        data: { categories: tree }
      });
    } else {
      // Trả về dạng danh sách phẳng
      const activeCategories = categories
        .filter(cat => cat.isActive)
        .sort((a, b) => a.displayOrder - b.displayOrder);
      
      if (includeStats) {
        console.log('Computing stats - Total quizzes:', quizTemplates.length);
        const withStats = activeCategories.map(cat => {
          const catId = String(cat.id || cat._id);
          const quizCount = quizTemplates.filter(q => String(q.categoryId) === catId).length;
          console.log(`Category ${cat.name} (${catId}): ${quizCount} quizzes`);
          return {
            ...cat,
            quizCount
          };
        });
        
        return NextResponse.json({
          success: true,
          data: { categories: withStats }
        });
      }
      
      return NextResponse.json({
        success: true,
        data: { categories: activeCategories }
      });
    }
  } catch (error) {
    console.error('Error in GET /api/categories:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
