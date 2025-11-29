'use client';

import { useState } from "react";
import { login } from "@/app/lib/auth";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    const data = await login(username, password);

    console.log("LOGIN RESPONSE:", data);

    if (data.success) {
      // Lưu vào localStorage tạm thời (nếu muốn dùng cookie tôi sẽ hướng dẫn dưới)
      localStorage.setItem("accessToken", data.data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      alert("Đăng nhập thành công!");
    } else {
      alert("Sai tài khoản hoặc mật khẩu!");
    }
  }

  return (
    <div>
      <input
        placeholder="Tên đăng nhập"
        onChange={e => setUsername(e.target.value)}
      />

      <input
        type="password"
        placeholder="Mật khẩu"
        onChange={e => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>Đăng nhập</button>
    </div>
  );
}
