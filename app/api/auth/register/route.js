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

    // Validate input
    if (!username || !email || !password || !name) {
      return NextResponse.json({ 
        message: 'Vui lòng nhập đầy đủ thông tin (username, email, password, name)' 
      }, { status: 400 });
    }

    // Validate username (alphanumeric, 3-20 chars)
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json({ 
        message: 'Username phải từ 3-20 ký tự, chỉ chứa chữ cái, số và dấu gạch dưới' 
      }, { status: 400 });
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ 
        message: 'Email không hợp lệ' 
      }, { status: 400 });
    }

    // Validate password (min 6 chars)
    if (password.length < 6) {
      return NextResponse.json({ 
        message: 'Mật khẩu phải có ít nhất 6 ký tự' 
      }, { status: 400 });
    }

    const users = loadData('users.json');
    
    // Check if username already exists (case-insensitive)
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return NextResponse.json({ 
        message: 'Username đã tồn tại' 
      }, { status: 409 });
    }

    // Check if email already exists (case-insensitive)
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json({ 
        message: 'Email đã được sử dụng' 
      }, { status: 409 });
    }

    // Tạo user mới
    const newUserId = Math.max(...users.map(u => u.id), 0) + 1;
    
    // Generate random color for avatar
    const colors = ['4F46E5', '8B5CF6', '10B981', 'F59E0B', 'EF4444', '06B6D4', 'EC4899'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newUser = {
      id: newUserId,
      username,
      password: password, // In production, use bcrypt to hash password
      name,
      email,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${randomColor}&color=fff`,
      role: 'student',
      bio: '',
      phone: '',
      address: '',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    users.push(newUser);
    
    if (!saveData('users.json', users)) {
      return NextResponse.json({ 
        message: 'Lỗi khi lưu dữ liệu' 
      }, { status: 500 });
    }

    // Auto login after registration
    const { password: _, ...userWithoutPassword } = newUser;

    const response = NextResponse.json({
      message: 'Đăng ký thành công',
      user: userWithoutPassword
    });

    // Set session cookie (matching login format)
    const session = {
      userId: newUser.id,
      username: newUser.username,
      role: newUser.role
    };

    response.cookies.set('session', JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;

  } catch (error) {
    console.error('Error in POST /api/auth/register:', error);
    return NextResponse.json({ 
      message: 'Lỗi server', 
      error: error.message 
    }, { status: 500 });
  }
}
