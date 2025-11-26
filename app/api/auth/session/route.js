// app/api/auth/session/route.js

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

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const users = loadData('users.json');
    const user = users.find(u => u.id === parseInt(userId));

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Không trả về password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({ user: userWithoutPassword });

  } catch (error) {
    console.error('Error in GET /api/auth/session:', error);
    return NextResponse.json({ message: 'Lỗi server', error: error.message }, { status: 500 });
  }
}
