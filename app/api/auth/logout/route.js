// app/api/auth/logout/route.js

import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const response = NextResponse.json({
      message: 'Đăng xuất thành công'
    });

    // Xóa cookie
    response.cookies.delete('userId');

    return response;

  } catch (error) {
    console.error('Error in POST /api/auth/logout:', error);
    return NextResponse.json({ message: 'Lỗi server', error: error.message }, { status: 500 });
  }
}
