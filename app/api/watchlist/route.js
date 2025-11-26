// app/api/watchlist/route.js

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

// GET - Lấy danh sách watchlist của user
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ message: 'Chưa đăng nhập' }, { status: 401 });
    }

    const watchlist = loadData('watchlist.json');
    const userWatchlist = watchlist.filter(w => w.userId === parseInt(userId));

    return NextResponse.json({ watchlist: userWatchlist });

  } catch (error) {
    console.error('Error in GET /api/watchlist:', error);
    return NextResponse.json({ message: 'Lỗi server', error: error.message }, { status: 500 });
  }
}

// POST - Thêm vào watchlist
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

    const watchlist = loadData('watchlist.json');
    
    // Kiểm tra đã có trong watchlist chưa
    const existingItem = watchlist.find(
      w => w.userId === parseInt(userId) && w.quizId === quizId
    );

    if (existingItem) {
      return NextResponse.json({ 
        message: 'Đã có trong watchlist',
        item: existingItem
      });
    }

    // Thêm vào watchlist mới
    const newItem = {
      id: watchlist.length > 0 ? Math.max(...watchlist.map(w => w.id)) + 1 : 1,
      userId: parseInt(userId),
      quizId: quizId,
      createdAt: new Date().toISOString()
    };

    watchlist.push(newItem);
    saveData('watchlist.json', watchlist);

    return NextResponse.json({
      message: 'Đã thêm vào watchlist',
      item: newItem
    });

  } catch (error) {
    console.error('Error in POST /api/watchlist:', error);
    return NextResponse.json({ message: 'Lỗi server', error: error.message }, { status: 500 });
  }
}

// DELETE - Xóa khỏi watchlist
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

    const watchlist = loadData('watchlist.json');
    
    // Tìm và xóa khỏi watchlist
    const itemIndex = watchlist.findIndex(
      w => w.userId === parseInt(userId) && w.quizId === quizId
    );

    if (itemIndex === -1) {
      return NextResponse.json({ message: 'Item không tồn tại trong watchlist' }, { status: 404 });
    }

    watchlist.splice(itemIndex, 1);
    saveData('watchlist.json', watchlist);

    return NextResponse.json({
      message: 'Đã xóa khỏi watchlist'
    });

  } catch (error) {
    console.error('Error in DELETE /api/watchlist:', error);
    return NextResponse.json({ message: 'Lỗi server', error: error.message }, { status: 500 });
  }
}
