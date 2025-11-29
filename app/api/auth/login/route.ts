import { NextResponse } from "next/server";
import { API_URL } from "@/app/lib/api";

export async function POST(req: Request) {
  const body = await req.json();

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (!data.success) {
    return NextResponse.json(data);
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set("accessToken", data.data.accessToken, {
    httpOnly: true,
    path: "/",
  });

  response.cookies.set("refreshToken", data.data.refreshToken, {
    httpOnly: true,
    path: "/",
  });

  return response;
}
