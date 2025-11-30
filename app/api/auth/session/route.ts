import { NextResponse } from "next/server";
import { API_URL } from "@/app/lib/api";

export async function GET(req: Request) {
  // Get accessToken from cookie
  const cookie = req.headers.get('cookie');
  
  try {
    const res = await fetch(`${API_URL}/auth/session`, {
      method: "GET",
      headers: {
        ...(cookie && { cookie })
      }
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    // If session check fails, return null user
    return NextResponse.json({ 
      success: true, 
      data: { user: null } 
    });
  }
}
