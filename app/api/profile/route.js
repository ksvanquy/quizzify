// app/api/profile/route.js

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

async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  
  if (!userId) return null;
  
  const users = loadData('users.json');
  return users.find(u => u.id === parseInt(userId));
}

// GET - Lấy thông tin profile
export async function GET(request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ message: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { password: _, ...userWithoutPassword } = user;
    
    // Lấy bookmarks và watchlist từ file riêng
    const bookmarks = loadData('bookmarks.json');
    const watchlist = loadData('watchlist.json');
    const templates = loadData('quizTemplates.json');
    
    // Lấy quizIds từ bookmarks và watchlist của user
    const userBookmarkIds = bookmarks
      .filter(b => b.userId === user.id)
      .map(b => b.quizId);
    const userWatchlistIds = watchlist
      .filter(w => w.userId === user.id)
      .map(w => w.quizId);
    
    // Lấy chi tiết quiz
    const bookmarkedQuizzes = templates.filter(t => userBookmarkIds.includes(t.id));
    const watchlistedQuizzes = templates.filter(t => userWatchlistIds.includes(t.id));

    // Lấy lịch sử thi
    const attempts = loadData('userAttempts.json');
    const userAttempts = attempts.filter(a => a.userId === user.id);

    return NextResponse.json({
      ...userWithoutPassword,
      bookmarkedQuizzes,
      watchlistedQuizzes,
      attemptsCount: userAttempts.length,
      completedCount: userAttempts.filter(a => a.status === 'completed').length
    });

  } catch (error) {
    console.error('Error in GET /api/profile:', error);
    return NextResponse.json({ message: 'Lỗi server', error: error.message }, { status: 500 });
  }
}

// PUT - Cập nhật profile
export async function PUT(request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ message: 'Chưa đăng nhập' }, { status: 401 });
    }

    const updates = await request.json();
    const { name, bio, phone, address, avatar } = updates;

    const users = loadData('users.json');
    const userIndex = users.findIndex(u => u.id === user.id);

    if (userIndex === -1) {
      return NextResponse.json({ message: 'User không tồn tại' }, { status: 404 });
    }

    // Cập nhật thông tin
    users[userIndex] = {
      ...users[userIndex],
      ...(name && { name }),
      ...(bio !== undefined && { bio }),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
      ...(avatar && { avatar })
    };

    saveData('users.json', users);

    const { password: _, ...userWithoutPassword } = users[userIndex];

    return NextResponse.json({
      message: 'Cập nhật thành công',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Error in PUT /api/profile:', error);
    return NextResponse.json({ message: 'Lỗi server', error: error.message }, { status: 500 });
  }
}
