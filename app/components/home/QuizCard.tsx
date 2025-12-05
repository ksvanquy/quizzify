'use client';

import Link from 'next/link';

interface Quiz {
  id: number;
  name: string;
  description?: string;
  difficulty: string;
  durationMinutes: number;
  maxAttempts: number;
  passingScore: number;
  tags?: string[];
  category?: {
    icon: string;
  };
}

interface AttemptStatus {
  canAttempt: boolean;
  completedCount?: number;
  maxAttempts?: number;
  bestScore?: number;
}

interface AttemptInfo {
  templateId: number;
  completedCount: number;
  bestScore: number;
}

interface QuizCardProps {
  quiz: Quiz;
  attemptStatus: AttemptStatus;
  attemptInfo: AttemptInfo | null;
  isBookmarked: boolean;
  isInWatchlist: boolean;
  onBookmarkToggle: (e: React.MouseEvent, quizId: number) => void;
  onWatchlistToggle: (e: React.MouseEvent, quizId: number) => void;
  user: any;
}

const getDifficultyBadge = (difficulty: string) => {
  const styles: Record<string, string> = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard: 'bg-red-100 text-red-700'
  };
  const labels: Record<string, string> = {
    easy: 'Dễ',
    medium: 'Trung bình',
    hard: 'Khó'
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${styles[difficulty] || ''}`}>
      {labels[difficulty] || difficulty}
    </span>
  );
};

export function QuizCard({
  quiz,
  attemptStatus,
  attemptInfo,
  isBookmarked,
  isInWatchlist,
  onBookmarkToggle,
  onWatchlistToggle,
  user
}: QuizCardProps) {
  return (
    <Link
      href={attemptStatus.canAttempt ? `/quiz/${quiz.id}` : '#'}
      onClick={(e) => {
        if (!attemptStatus.canAttempt) {
          e.preventDefault();
          alert(`Bạn đã hết số lần làm bài cho bài thi này. Đã làm: ${attemptStatus.completedCount}/${attemptStatus.maxAttempts} lần.`);
        }
      }}
      className={`group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border flex flex-col ${
        attemptStatus.canAttempt 
          ? 'border-gray-200 hover:border-indigo-300' 
          : 'border-red-200 opacity-75 cursor-not-allowed'
      }`}
    >
      {/* Card Header */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 text-white relative">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {quiz.category && (
              <span className="text-2xl">{quiz.category.icon}</span>
            )}
            {getDifficultyBadge(quiz.difficulty)}
          </div>
          
          {/* Bookmark & Watchlist Icons */}
          <div className="flex gap-1.5 flex-shrink-0">
            <button
              onClick={(e) => onBookmarkToggle(e, quiz.id)}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition backdrop-blur-sm"
              title={isBookmarked ? 'Xóa bookmark' : 'Thêm bookmark'}
            >
              {isBookmarked ? (
                <svg className="w-4 h-4 fill-yellow-300" viewBox="0 0 20 20">
                  <path d="M10 2l2.5 6.5L19 9l-5 4.5L15 20l-5-3.5L5 20l1-6.5L1 9l6.5-.5L10 2z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 stroke-white fill-none" viewBox="0 0 20 20" strokeWidth="2">
                  <path d="M10 2l2.5 6.5L19 9l-5 4.5L15 20l-5-3.5L5 20l1-6.5L1 9l6.5-.5L10 2z" />
                </svg>
              )}
            </button>
            <button
              onClick={(e) => onWatchlistToggle(e, quiz.id)}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition backdrop-blur-sm"
              title={isInWatchlist ? 'Xóa khỏi watchlist' : 'Thêm vào watchlist'}
            >
              {isInWatchlist ? (
                <svg className="w-4 h-4 fill-red-400" viewBox="0 0 20 20">
                  <path d="M10 18l-1.45-1.32C3.4 12.36 0 9.28 0 5.5 0 2.42 2.42 0 5.5 0c1.74 0 3.41.81 4.5 2.09C11.09.81 12.76 0 14.5 0 17.58 0 20 2.42 20 5.5c0 3.78-3.4 6.86-8.55 11.18L10 18z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 stroke-white fill-none" viewBox="0 0 20 20" strokeWidth="2">
                  <path d="M10 18l-1.45-1.32C3.4 12.36 0 9.28 0 5.5 0 2.42 2.42 0 5.5 0c1.74 0 3.41.81 4.5 2.09C11.09.81 12.76 0 14.5 0 17.58 0 20 2.42 20 5.5c0 3.78-3.4 6.86-8.55 11.18L10 18z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        <h3 className="font-bold text-base line-clamp-2 min-h-[2.5rem] group-hover:text-indigo-100 transition">
          {quiz.name}
        </h3>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col">
        {quiz.description && (
          <p className="text-gray-600 text-xs mb-3 line-clamp-2">
            {quiz.description}
          </p>
        )}
        
        <div className="space-y-2 text-xs text-gray-600 mt-auto">
          <div className="flex items-center gap-2">
            <span>⏱️</span>
            <span>{quiz.durationMinutes} phút</span>
          </div>
          <div className="flex items-center gap-2">
            <span>📝</span>
            <span>{quiz.maxAttempts === 0 ? 'Không giới hạn' : `${quiz.maxAttempts} lần`}</span>
          </div>
          {quiz.passingScore > 0 && (
            <div className="flex items-center gap-2">
              <span>🎯</span>
              <span>Điểm đạt: {quiz.passingScore}%</span>
            </div>
          )}
          
          {/* User attempt status */}
          {user && attemptInfo && (
            <>
              <div className="flex items-center gap-2">
                <span>✅</span>
                <span>Đã làm: {attemptInfo.completedCount}{quiz.maxAttempts > 0 ? `/${quiz.maxAttempts}` : ''} lần</span>
              </div>
              {attemptInfo.bestScore > 0 && (
                <div className="flex items-center gap-2">
                  <span>⭐</span>
                  <span>Điểm cao nhất: {attemptInfo.bestScore}%</span>
                </div>
              )}
            </>
          )}
        </div>

        {quiz.tags && quiz.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {quiz.tags.slice(0, 2).map((tag: string) => (
              <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                #{tag}
              </span>
            ))}
            {quiz.tags.length > 2 && (
              <span className="text-gray-400 text-xs px-1">+{quiz.tags.length - 2}</span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="px-4 pb-4">
        {attemptStatus.canAttempt ? (
          <div className="bg-indigo-600 text-white text-center py-2 rounded-lg font-medium text-sm group-hover:bg-indigo-700 transition">
            Bắt Đầu Thi →
          </div>
        ) : (
          <div className="bg-red-500 text-white text-center py-2 rounded-lg font-medium text-sm cursor-not-allowed">
            ❌ Đã hết lượt
          </div>
        )}
      </div>
    </Link>
  );
}
