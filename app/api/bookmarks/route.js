// app/api/bookmarks/route.js

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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

async function getCurrentUserId() {
  const cookieStore = await cookies();
  return cookieStore.get('userId')?.value;
}

// GET - Lấy danh sách bookmarks của user
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ message: 'Chưa đăng nhập' }, { status: 401 });
    }

    const bookmarks = loadData('bookmarks.json');
    const userBookmarks = bookmarks.filter(b => b.userId === parseInt(userId));

    return NextResponse.json({ bookmarks: userBookmarks });

  } catch (error) {
    console.error('Error in GET /api/bookmarks:', error);
    return NextResponse.json({ message: 'Lỗi server', error: error.message }, { status: 500 });
  }
}

// POST - Thêm bookmark
export async function POST(request) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ message: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { quizId } = await request.json();
    
    if (!quizId) {
      return NextResponse.json({ message: 'Quiz ID không hợp lệ' }, { status: 400 });
    }

    const bookmarks = loadData('bookmarks.json');
    
    // Kiểm tra đã bookmark chưa
    const existingBookmark = bookmarks.find(
      b => b.userId === parseInt(userId) && b.quizId === quizId
    );

    if (existingBookmark) {
      return NextResponse.json({ 
        message: 'Đã có trong bookmark',
        bookmark: existingBookmark
      });
    }

    // Thêm bookmark mới
    const newBookmark = {
      id: bookmarks.length > 0 ? Math.max(...bookmarks.map(b => b.id)) + 1 : 1,
      userId: parseInt(userId),
      quizId: quizId,
      createdAt: new Date().toISOString()
    };

    bookmarks.push(newBookmark);
    saveData('bookmarks.json', bookmarks);

    return NextResponse.json({
      message: 'Đã thêm vào bookmark',
      bookmark: newBookmark
    });

  } catch (error) {
    console.error('Error in POST /api/bookmarks:', error);
    return NextResponse.json({ message: 'Lỗi server', error: error.message }, { status: 500 });
  }
}

// DELETE - Xóa bookmark
export async function DELETE(request) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ message: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const quizId = parseInt(searchParams.get('quizId'));
    
    if (!quizId) {
      return NextResponse.json({ message: 'Quiz ID không hợp lệ' }, { status: 400 });
    }

    const bookmarks = loadData('bookmarks.json');
    
    // Tìm và xóa bookmark
    const bookmarkIndex = bookmarks.findIndex(
      b => b.userId === parseInt(userId) && b.quizId === quizId
    );

    if (bookmarkIndex === -1) {
      return NextResponse.json({ message: 'Bookmark không tồn tại' }, { status: 404 });
    }

    bookmarks.splice(bookmarkIndex, 1);
    saveData('bookmarks.json', bookmarks);

    return NextResponse.json({
      message: 'Đã xóa khỏi bookmark'
    });

  } catch (error) {
    console.error('Error in DELETE /api/bookmarks:', error);
    return NextResponse.json({ message: 'Lỗi server', error: error.message }, { status: 500 });
  }
}
