import { useCallback } from 'react';
import { useToast } from './useToast';
import { useAuth } from '@/app/contexts/AuthContext';

interface UseBookmarkWatchlistOptions {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

/**
 * Hook để quản lý bookmark và watchlist
 * @returns { handleBookmarkToggle, handleWatchlistToggle, isBookmarked, isInWatchlist }
 */
export const useBookmarkWatchlist = (
  quizId: string | null | undefined,
  options?: UseBookmarkWatchlistOptions
) => {
  const { user, isBookmarked, addBookmark, removeBookmark, isInWatchlist, addToWatchlist, removeFromWatchlist } = useAuth();
  const { showToast } = useToast();

  const handleBookmarkToggle = useCallback(async () => {
    if (!user) {
      const msg = 'Vui lòng đăng nhập';
      showToast(msg, 'error');
      options?.onError?.(msg);
      return;
    }

    try {
      const qId = quizId ? String(quizId) : null;
      if (!qId) throw new Error('Invalid quiz ID');

      if (isBookmarked(qId)) {
        await removeBookmark(qId);
        const msg = 'Đã xóa khỏi bookmark';
        showToast(msg, 'success');
        options?.onSuccess?.(msg);
      } else {
        await addBookmark(qId);
        const msg = 'Đã thêm vào bookmark';
        showToast(msg, 'success');
        options?.onSuccess?.(msg);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      const msg = 'Có lỗi xảy ra';
      showToast(msg, 'error');
      options?.onError?.(msg);
    }
  }, [user, quizId, isBookmarked, removeBookmark, addBookmark, showToast, options]);

  const handleWatchlistToggle = useCallback(async () => {
    if (!user) {
      const msg = 'Vui lòng đăng nhập';
      showToast(msg, 'error');
      options?.onError?.(msg);
      return;
    }

    try {
      const qId = quizId ? String(quizId) : null;
      if (!qId) throw new Error('Invalid quiz ID');

      if (isInWatchlist(qId)) {
        await removeFromWatchlist(qId);
        const msg = 'Đã xóa khỏi watchlist';
        showToast(msg, 'success');
        options?.onSuccess?.(msg);
      } else {
        await addToWatchlist(qId);
        const msg = 'Đã thêm vào watchlist';
        showToast(msg, 'success');
        options?.onSuccess?.(msg);
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      const msg = 'Có lỗi xảy ra';
      showToast(msg, 'error');
      options?.onError?.(msg);
    }
  }, [user, quizId, isInWatchlist, removeFromWatchlist, addToWatchlist, showToast, options]);

  return { handleBookmarkToggle, handleWatchlistToggle, isBookmarked, isInWatchlist };
};
