import { NextResponse } from "next/server";
import { API_URL } from "@/app/lib/api";

export async function POST(req: Request) {
  const body = await req.json();

  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (!data.success) {
    return NextResponse.json(data, { status: res.status });
  }

  console.log('Registration successful, setting cookies...');
  console.log('AccessToken present:', !!data.data?.accessToken);

  // Return full response including user data
  const response = NextResponse.json(data);

  // Set accessToken cookie if available
  if (data.data?.accessToken) {
    response.cookies.set("accessToken", data.data.accessToken, {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
  }

  if (data.data?.refreshToken) {
    response.cookies.set("refreshToken", data.data.refreshToken, {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });
  }

  return response;
}
