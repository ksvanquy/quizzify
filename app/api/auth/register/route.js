// app/api/auth/register/route.js

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

export async function POST(request) {
  try {
    const { username, email, password, name } = await request.json();

    if (!username || !email || !password || !name) {
      return NextResponse.json({ message: 'Vui lòng nhập đầy đủ thông tin' }, { status: 400 });
    }

    const users = loadData('users.json');
    
    // Kiểm tra username hoặc email đã tồn tại
    const existingUser = users.find(u => u.username === username || u.email === email);
    if (existingUser) {
      return NextResponse.json({ message: 'Username hoặc email đã được sử dụng' }, { status: 400 });
    }

    // Tạo user mới
    const newUserId = Math.max(...users.map(u => u.id), 0) + 1;
    const newUser = {
      id: newUserId,
      username,
      password: '$2a$10$rKJ3YOLjZ0KW0lXr5k5k5eQMxV8h5kYbZ8hL0K5k5k5k5k5k5k5k5', // Mock hash
      name,
      email,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`,
      role: 'student',
      bio: '',
      phone: '',
      address: '',
      bookmarks: [],
      watchlist: [],
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    users.push(newUser);
    saveData('users.json', users);

    const { password: _, ...userWithoutPassword } = newUser;

    const response = NextResponse.json({
      message: 'Đăng ký thành công',
      user: userWithoutPassword
    });

    response.cookies.set('userId', newUser.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    });

    return response;

  } catch (error) {
    console.error('Error in POST /api/auth/register:', error);
    return NextResponse.json({ message: 'Lỗi server', error: error.message }, { status: 500 });
  }
}
