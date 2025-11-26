'use client';

// app/page.js
import Link from 'next/link';

// Giả định dữ liệu đã được fetch từ GET /api/quizzes
const mockQuizzes = [
  { id: 1, name: "Bài Thi Cuối Kỳ Next.js", duration: 60, attempts: 3, status: "active" },
  { id: 2, name: "Bài Tập React Hooks Cơ Bản", duration: 30, attempts: 0, status: "active" },
];

export default function HomePage() {
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">📚 Danh Sách Bài Thi</h1>
      <div className="space-y-4">
        {mockQuizzes.map(quiz => (
          <div key={quiz.id} className="p-6 border rounded-lg shadow-md hover:shadow-lg transition duration-200 bg-white">
            <h2 className="text-xl font-semibold text-indigo-700">{quiz.name}</h2>
            <p className="text-gray-600 mt-2">
              Thời gian: **{quiz.duration} phút** | 
              Số lần tối đa: **{quiz.attempts === 0 ? 'Không giới hạn' : quiz.attempts}**
            </p>
            <div className="mt-4 flex justify-end">
              <Link 
                href={`/quiz/${quiz.id}`} 
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
              >
                Bắt Đầu Thi →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}