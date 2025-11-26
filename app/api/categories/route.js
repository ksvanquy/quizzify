// app/api/categories/route.js

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

    const categories = loadData('categories.json');
    const quizTemplates = includeStats ? loadData('quizTemplates.json') : [];

    if (format === 'tree') {
      // Trả về dạng cây phân cấp
      const tree = buildCategoryTree(categories);
      
      if (includeStats) {
        // Thêm thống kê số quiz cho mỗi category
        const addStats = (nodes) => {
          return nodes.map(node => ({
            ...node,
            quizCount: countQuizzesInCategory(node.id, categories, quizTemplates).count,
            children: addStats(node.children)
          }));
        };
        
        return NextResponse.json(addStats(tree));
      }
      
      return NextResponse.json(tree);
    } else {
      // Trả về dạng danh sách phẳng
      const activeCategories = categories
        .filter(cat => cat.isActive)
        .sort((a, b) => a.displayOrder - b.displayOrder);
      
      if (includeStats) {
        const withStats = activeCategories.map(cat => ({
          ...cat,
          quizCount: countQuizzesInCategory(cat.id, categories, quizTemplates).count
        }));
        
        return NextResponse.json(withStats);
      }
      
      return NextResponse.json(activeCategories);
    }
  } catch (error) {
    console.error('Error in GET /api/categories:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
