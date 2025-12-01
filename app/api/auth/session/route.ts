import { NextResponse } from "next/server";
import { API_URL } from "@/app/lib/api";

export async function GET(req: Request) {
  // Require Authorization Bearer token
  const auth = req.headers.get('authorization');
  
  if (!auth || !auth.startsWith('Bearer ')) {
    // Return unauthenticated user (not an error)
    return NextResponse.json({ 
      success: true, 
      data: { user: null } 
    });
  }
  
  try {
    const res = await fetch(`${API_URL}/auth/session`, {
      method: "GET",
      headers: {
        'Authorization': auth
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
