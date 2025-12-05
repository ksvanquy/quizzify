# Custom Hooks Documentation

Tài liệu về các custom hooks được tạo để cải thiện tái sử dụng code và dễ bảo trì.

## 📁 Vị trí: `app/hooks/`

Tất cả các custom hooks được tổ chức trong thư mục `app/hooks/` và được export thông qua `index.ts`.

---

## 🎣 Danh Sách Các Hooks

### 1. **useAccessToken**
**Tệp:** `useAccessToken.ts`

**Mục đích:** Lấy access token từ localStorage một cách an toàn với SSR support.

**Cách sử dụng:**
```typescript
import { useAccessToken } from '@/app/hooks';

export default function MyComponent() {
  const getAccessToken = useAccessToken();
  
  const token = getAccessToken();
  if (!token) {
    // Token không tồn tại, redirect to login
  }
}
```

**Trả về:**
- `() => string | null` - Callback trả về access token hoặc null

---

### 2. **useToast**
**Tệp:** `useToast.ts`

**Mục đích:** Quản lý toast notifications với auto-dismiss.

**Cách sử dụng:**
```typescript
import { useToast } from '@/app/hooks';

export default function MyComponent() {
  const { toast, showToast, removeToast } = useToast(3000); // 3s duration
  
  const handleClick = () => {
    showToast('Success!', 'success');
    // showToast('Error!', 'error');
    // showToast('Warning!', 'warning');
  };
  
  return (
    <>
      <button onClick={handleClick}>Show Toast</button>
      {toast && <div>{toast.message}</div>}
    </>
  );
}
```

**Trả về:**
```typescript
{
  toast: Toast | null,
  showToast: (message: string, type?: 'success' | 'error' | 'warning') => void,
  removeToast: () => void
}
```

**Tham số:**
- `duration` (ms) - Thời gian hiển thị toast, mặc định 3000ms

---

### 3. **useFormatTime**
**Tệp:** `useFormatTime.ts`

**Mục đích:** Định dạng giây sang format mm:ss.

**Cách sử dụng:**
```typescript
import { useFormatTime } from '@/app/hooks';

export default function Timer() {
  const formatTime = useFormatTime();
  
  return <span>{formatTime(125)}</span>; // Output: 2:05
}
```

**Trả về:**
- `(seconds: number) => string` - Hàm định dạng thời gian

---

### 4. **useQuizState**
**Tệp:** `useQuizState.ts`

**Mục đích:** Quản lý trạng thái bài quiz (câu hỏi hiện tại, đáp án, navigation).

**Cách sử dụng:**
```typescript
import { useQuizState } from '@/app/hooks';

export default function Quiz() {
  const {
    currentQuestionIndex,
    userAnswers,
    handleAnswerChange,
    goToPrevQuestion,
    goToNextQuestion,
    setCurrentQuestionIndex,
    resetAnswers
  } = useQuizState(totalQuestions);
  
  return (
    <>
      <p>Câu {currentQuestionIndex + 1}</p>
      <button onClick={goToPrevQuestion}>Câu Trước</button>
      <button onClick={goToNextQuestion}>Câu Tiếp Theo</button>
    </>
  );
}
```

**Trả về:**
```typescript
{
  currentQuestionIndex: number,
  userAnswers: Record<string, any>,
  handleAnswerChange: (id, answer) => void,
  goToPrevQuestion: () => void,
  goToNextQuestion: () => void,
  resetAnswers: () => void,
  setCurrentQuestionIndex: (index) => void
}
```

**Tham số:**
- `totalQuestions` - Tổng số câu hỏi

---

### 5. **useBookmarkWatchlist**
**Tệp:** `useBookmarkWatchlist.ts`

**Mục đích:** Quản lý bookmark và watchlist với toast notifications.

**Cách sử dụng:**
```typescript
import { useBookmarkWatchlist } from '@/app/hooks';

export default function QuizCard({ quizId }) {
  const { 
    handleBookmarkToggle, 
    handleWatchlistToggle,
    isBookmarked,
    isInWatchlist 
  } = useBookmarkWatchlist(quizId, {
    onSuccess: (msg) => console.log(msg),
    onError: (msg) => console.error(msg)
  });
  
  return (
    <>
      <button onClick={handleBookmarkToggle}>
        {isBookmarked(quizId) ? '★' : '☆'} Bookmark
      </button>
      <button onClick={handleWatchlistToggle}>
        {isInWatchlist(quizId) ? '❤' : '🤍'} Watchlist
      </button>
    </>
  );
}
```

**Trả về:**
```typescript
{
  handleBookmarkToggle: () => Promise<void>,
  handleWatchlistToggle: () => Promise<void>,
  isBookmarked: (id: string) => boolean,
  isInWatchlist: (id: string) => boolean
}
```

**Tham số:**
- `quizId` - Quiz ID cần check
- `options` - Tùy chọn callbacks (onSuccess, onError)

---

### 6. **useAsyncData**
**Tệp:** `useAsyncData.ts`

**Mục đích:** Fetch dữ liệu từ API một cách generic với loading/error states.

**Cách sử dụng:**
```typescript
import { useAsyncData } from '@/app/hooks';

export default function DataFetcher() {
  const { data, loading, error } = useAsyncData(
    async () => {
      const response = await fetch('/api/data');
      return response.json();
    },
    [], // dependencies
    {
      onSuccess: (data) => console.log('Data loaded:', data),
      onError: (error) => console.error('Error:', error)
    }
  );
  
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  return <div>{JSON.stringify(data)}</div>;
}
```

**Trả về:**
```typescript
{
  data: T | null,
  loading: boolean,
  error: string | null
}
```

**Tham số:**
- `fetcher` - Async function để fetch dữ liệu
- `dependencies` - Dependencies array (giống useEffect)
- `options` - Callbacks (onSuccess, onError)

---

### 7. **useFetch**
**Tệp:** `useFetch.ts`

**Mục đích:** Fetch với Bearer token authentication tự động.

**Cách sử dụng:**
```typescript
import { useFetch } from '@/app/hooks';

export default function ApiCaller() {
  const { fetch, abort } = useFetch({ timeout: 5000 });
  
  const handleFetch = async () => {
    try {
      const data = await fetch('/api/quizzes/123');
      console.log(data);
    } catch (error) {
      console.error(error);
    }
  };
  
  return (
    <>
      <button onClick={handleFetch}>Fetch</button>
      <button onClick={abort}>Cancel</button>
    </>
  );
}
```

**Trả về:**
```typescript
{
  fetch: (url: string, options?: FetchOptions) => Promise<any>,
  abort: () => void
}
```

**Tham số:**
- `options` - Tùy chọn (timeout)

---

### 8. **useTimer**
**Tệp:** `useTimer.ts`

**Mục đích:** Quản lý timer countdown với pause/resume.

**Cách sử dụng:**
```typescript
import { useTimer } from '@/app/hooks';

export default function QuizTimer() {
  const { timeRemaining, start, pause, resume, reset, isRunning } = useTimer(600, {
    onTimeUp: () => console.log('Time is up!'),
    interval: 1000
  });
  
  return (
    <>
      <p>{timeRemaining}s</p>
      <button onClick={start}>Start</button>
      <button onClick={isRunning ? pause : resume}>
        {isRunning ? 'Pause' : 'Resume'}
      </button>
      <button onClick={reset}>Reset</button>
    </>
  );
}
```

**Trả về:**
```typescript
{
  timeRemaining: number,
  start: () => void,
  pause: () => void,
  resume: () => void,
  reset: () => void,
  isRunning: boolean
}
```

**Tham số:**
- `initialSeconds` - Thời gian ban đầu
- `options` - Tùy chọn (onTimeUp, interval)

---

### 9. **useSubmitQuiz**
**Tệp:** `useSubmitQuiz.ts`

**Mục đích:** Submit quiz với xử lý lỗi, abort control, và multiple response formats.

**Cách sử dụng:**
```typescript
import { useSubmitQuiz } from '@/app/hooks';

export default function QuizForm() {
  const { submitQuiz, isSubmitting, abort } = useSubmitQuiz({
    onSuccess: (resultId) => console.log('Result ID:', resultId),
    onError: (error) => console.error('Submit failed:', error),
    timeout: 30000
  });
  
  const handleSubmit = async () => {
    await submitQuiz(
      'attempt-123',
      { q1: 'A', q2: 'B' },
      300 // timeSpentSeconds
    );
  };
  
  return (
    <>
      <button onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
      <button onClick={abort}>Cancel</button>
    </>
  );
}
```

**Trả về:**
```typescript
{
  submitQuiz: (attemptId, answers, timeSpent) => Promise<void>,
  isSubmitting: boolean,
  abort: () => void
}
```

**Tham số:**
- `options` - Tùy chọn (onSuccess, onError, timeout)

---

## 🔄 Import toàn bộ Hooks

```typescript
import {
  useAccessToken,
  useToast,
  useFormatTime,
  useQuestionNavigation,
  useQuizState,
  useBookmarkWatchlist,
  useAsyncData,
  useFetch,
  useTimer,
  useSubmitQuiz
} from '@/app/hooks';
```

---

## 📝 Best Practices

1. **Dependencies Management:** Luôn chú ý đến dependencies array trong hooks
2. **Error Handling:** Sử dụng try-catch và callback options để xử lý lỗi
3. **Cleanup:** Hooks tự động cleanup resources khi unmount
4. **Type Safety:** Tất cả hooks có đầy đủ TypeScript types
5. **SSR Safe:** Tất cả hooks kiểm tra `typeof window` để safe với SSR

---

## 🎯 Lợi Ích

✅ **Code Reusability:** Tái sử dụng logic phổ biến trong nhiều components  
✅ **Maintainability:** Dễ dàng cập nhật logic ở một nơi  
✅ **Testability:** Dễ test hooks riêng rẽ  
✅ **Type Safety:** Full TypeScript support  
✅ **Performance:** Optimized với useCallback, useMemo  
✅ **Clean Code:** Components nhỏ gọn, dễ đọc hơn
