import { API_URL } from "@/app/lib/api";

export async function login(username: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Include `email` as an alias for `username` so backends expecting
    // an `email` field still receive the value from the login form.
    body: JSON.stringify({ username, email: username, password }), // ⚠️ BẮT BUỘC
  });

  return res.json();
}

export async function register(data: any) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    cache: "no-store"
  });

  return res.json();
}

export async function getProfile(accessToken: string) {
  const res = await fetch(`${API_URL}/auth/profile`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store"
  });

  return res.json();
}

export async function refreshToken(refreshToken: string) {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store"
  });

  return res.json();
}

export async function logout(accessToken: string) {
  const res = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store"
  });

  return res.json();
}

// Logout using cookie-based flow: server clears the cookie when browser sends it.
export async function logoutWithCookie() {
  const res = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: 'include',
    cache: "no-store"
  });

  return res.json();
}
