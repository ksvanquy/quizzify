// app/api/auth/login/route.js

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
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ message: 'Vui lòng nhập đầy đủ thông tin' }, { status: 400 });
    }

    const users = loadData('users.json');
    
    // Tìm user (trong thực tế nên dùng bcrypt để compare password)
    const user = users.find(u => 
      (u.username === username || u.email === username) && u.password
    );

    if (!user) {
      return NextResponse.json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' }, { status: 401 });
    }

    // Cập nhật lastLogin
    user.lastLogin = new Date().toISOString();
    saveData('users.json', users);

    // Tạo session (đơn giản, không gửi password)
    const { password: _, ...userWithoutPassword } = user;
    
    const response = NextResponse.json({
      message: 'Đăng nhập thành công',
      user: userWithoutPassword
    });

    // Set cookie (trong production nên dùng httpOnly và secure)
    response.cookies.set('userId', user.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;

  } catch (error) {
    console.error('Error in POST /api/auth/login:', error);
    return NextResponse.json({ message: 'Lỗi server', error: error.message }, { status: 500 });
  }
}
