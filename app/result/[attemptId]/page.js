'use client';

// app/result/[attemptId]/page.js (Component chính)

import Link from 'next/link';
import { useEffect, useState, use } from 'react';

export default function ResultPage({ params }) {
  const unwrappedParams = use(params);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResult() {
      try {
        const response = await fetch(`/api/results/${unwrappedParams.attemptId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch result');
        }
        const data = await response.json();
        setResult(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching result:', error);
        alert('Không thể tải kết quả. Vui lòng thử lại.');
        setLoading(false);
      }
    }
    fetchResult();
  }, [unwrappedParams.attemptId]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-xl">Đang tải kết quả...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-xl text-red-600">Không tìm thấy kết quả</p>
        <Link href="/" className="mt-4 inline-block bg-indigo-600 text-white px-6 py-3 rounded hover:bg-indigo-700">
          Quay về Trang Chủ
        </Link>
      </div>
    );
  }

  const resultStatus = result.passed ? 'ĐẠT' : 'CHƯA ĐẠT';
  const statusColor = result.passed ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';

  return (
    <div className="container mx-auto p-4 max-w-4xl text-center">
      <h1 className="text-4xl font-extrabold mb-8 text-indigo-700">🎉 Kết Quả Bài Thi</h1>
      
      <div className={`p-6 mb-8 rounded-lg shadow-xl ${statusColor}`}>
        <p className="text-xl">Tình trạng:</p>
        <h2 className="text-5xl font-bold mt-2">{resultStatus}</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 text-left p-6 border rounded-lg bg-white shadow-md">
        <p className="text-gray-600">Bài Thi:</p>
        <p className="font-semibold">{result.quizTitle}</p>
        
        <p className="text-gray-600">Điểm Số Đạt Được:</p>
        <p className="text-2xl font-bold text-indigo-600">{result.score} / {result.totalQuestions}</p>

        <p className="text-gray-600">Phần Trăm:</p>
        <p className="text-2xl font-bold">{result.percentage}%</p>
        
        <p className="text-gray-600">Điểm Đạt:</p>
        <p className="font-semibold">{result.passingScore}%</p>
        
        <p className="text-gray-600">Thời Gian Hoàn Thành:</p>
        <p className="font-semibold">{result.durationMinutes} phút</p>
      </div>

      {/* Hiển thị chi tiết đáp án (nếu cấu hình cho phép) */}
      <Link 
        href="/" 
        className="mt-8 inline-block bg-indigo-600 text-white px-6 py-3 rounded hover:bg-indigo-700 transition font-medium"
      >
        Quay về Trang Chủ
      </Link>
    </div>
  );
}