import { NextResponse } from "next/server";
import { API_URL } from "@/app/lib/api";

export async function POST(req: Request) {
  // Get accessToken from cookie
  const cookie = req.headers.get('cookie');
  
  const res = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      ...(cookie && { cookie })
    }
  });

  const data = await res.json();

  // Clear cookies regardless of backend response
  const response = NextResponse.json(data);
  
  response.cookies.delete("accessToken");
  response.cookies.delete("refreshToken");

  return response;
}
