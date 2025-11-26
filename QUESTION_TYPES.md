# 📚 Hệ thống câu hỏi Quizzify

## Tổng quan

Quizzify hỗ trợ **6 loại câu hỏi** khác nhau với tính năng:
- ✅ Hỗ trợ đầy đủ drag & drop cho ordering và matching
- ✅ Hiển thị explanation sau khi hoàn thành quiz
- ✅ Tính điểm linh hoạt (partial credit cho một số loại câu hỏi)
- ✅ Shuffle options cho từng câu hỏi
- ✅ Visual feedback (màu xanh/đỏ) cho đúng/sai

---

## 1. Single Choice (Trắc nghiệm 1 đáp án)

**Cách dùng:**
- User chọn 1 đáp án duy nhất từ danh sách
- Tính điểm: 100% hoặc 0%

**Cấu trúc dữ liệu:**
```json
{
  "id": 1,
  "text": "JavaScript là gì?",
  "type": "single_choice",
  "topic": "programming",
  "difficulty": "easy",
  "points": 1,
  "shuffleOptions": true,
  "correctOptionId": 1,
  "explanation": "JavaScript là ngôn ngữ lập trình..."
}
```

**Options:**
```json
{
  "id": 1,
  "questionId": 1,
  "text": "Ngôn ngữ lập trình",
  "isCorrect": true
}
```

---

## 2. Multi Choice (Trắc nghiệm nhiều đáp án)

**Cách dùng:**
- User chọn nhiều đáp án từ danh sách
- Tính điểm: Partial credit dựa trên số đáp án đúng/sai

**Công thức tính điểm:**
```
correctSelected = số đáp án đúng được chọn
totalCorrect = tổng số đáp án đúng
wrongSelected = số đáp án sai được chọn

percentage = (correctSelected / totalCorrect) - (wrongSelected * 0.5)
earnedPoints = max(0, percentage) * points
```

**Cấu trúc dữ liệu:**
```json
{
  "id": 2,
  "text": "Chọn các framework JavaScript:",
  "type": "multi_choice",
  "topic": "programming",
  "difficulty": "medium",
  "points": 2,
  "shuffleOptions": true,
  "correctOptionIds": [5, 6, 7],
  "explanation": "React, Vue, Angular là các framework..."
}
```

---

## 3. True/False (Đúng/Sai)

**Cách dùng:**
- User chọn Đúng (✓) hoặc Sai (✗)
- Tính điểm: 100% hoặc 0%

**UI Features:**
- 2 nút lớn với icon ✓ và ✗
- Màu xanh/đỏ khi hiển thị explanation

**Cấu trúc dữ liệu:**
```json
{
  "id": 3,
  "text": "React là thư viện UI của Facebook",
  "type": "true_false",
  "topic": "programming",
  "difficulty": "easy",
  "points": 1,
  "correctAnswer": true,
  "explanation": "React được phát triển và duy trì bởi Facebook..."
}
```

---

## 4. Ordering (Sắp xếp thứ tự)

**Cách dùng:**
- User kéo thả các items để sắp xếp đúng thứ tự
- Tính điểm: Dựa trên % items đúng vị trí

**Công thức tính điểm:**
```
correctPositions = số items ở đúng vị trí
totalItems = tổng số items
percentage = correctPositions / totalItems
earnedPoints = percentage * points
```

**UI Features:**
- HTML5 Drag & Drop API
- Numbered circles (1, 2, 3...)
- Drag handle icon (☰)
- Màu xanh/đỏ cho từng item khi hiển thị explanation

**Cấu trúc dữ liệu:**
```json
{
  "id": 4,
  "text": "Sắp xếp các bước trong React lifecycle:",
  "type": "ordering",
  "topic": "programming",
  "difficulty": "medium",
  "points": 2,
  "items": [
    "Mounting",
    "Updating",
    "Unmounting",
    "Error Handling"
  ],
  "correctOrder": [
    "Mounting",
    "Updating",
    "Unmounting",
    "Error Handling"
  ],
  "explanation": "React lifecycle theo thứ tự..."
}
```

---

## 5. Matching (Nối cặp)

**Cách dùng:**
- User kéo items từ cột phải sang cột trái để nối cặp
- Tính điểm: Dựa trên % cặp đúng

**Công thức tính điểm:**
```
correctPairs = số cặp nối đúng
totalPairs = tổng số cặp
percentage = correctPairs / totalPairs
earnedPoints = percentage * points
```

**UI Features:**
- Two-column layout (Concepts | Definitions)
- Drag from right to left
- Remove button (✗) cho mỗi match
- Màu xanh/đỏ cho từng match khi hiển thị explanation

**Cấu trúc dữ liệu:**
```json
{
  "id": 5,
  "text": "Nối thuật ngữ với định nghĩa:",
  "type": "matching",
  "topic": "programming",
  "difficulty": "hard",
  "points": 3,
  "pairs": [
    {
      "left": "useState",
      "right": "Quản lý state trong functional component"
    },
    {
      "left": "useEffect",
      "right": "Xử lý side effects"
    },
    {
      "left": "useContext",
      "right": "Truy cập Context API"
    }
  ],
  "correctMatches": {
    "useState": "Quản lý state trong functional component",
    "useEffect": "Xử lý side effects",
    "useContext": "Truy cập Context API"
  },
  "explanation": "Các React Hooks cơ bản..."
}
```

---

## 6. Fill in the Blank (Điền vào chỗ trống)

**Cách dùng:**
- User nhập text vào chỗ trống trong câu
- Tính điểm: 100% hoặc 0%

**UI Features:**
- Inline text input embedded trong câu hỏi
- Hỗ trợ nhiều đáp án đúng
- Case-sensitive hoặc case-insensitive

**Cấu trúc dữ liệu:**
```json
{
  "id": 6,
  "text": "React sử dụng _____ để tối ưu hóa render",
  "type": "fill_blank",
  "topic": "programming",
  "difficulty": "medium",
  "points": 2,
  "correctAnswers": ["Virtual DOM", "virtual dom", "VDOM"],
  "caseSensitive": false,
  "explanation": "React sử dụng Virtual DOM..."
}
```

**Template:**
- Dùng `_____` (5 dấu gạch dưới) để đánh dấu vị trí cần điền
- Component sẽ tự động tách và chèn input vào đúng vị trí

---

## 🎨 Components

### QuestionRenderer
Universal question renderer tự động detect type và render component phù hợp:

```tsx
<QuestionRenderer
  question={question}
  userAnswer={userAnswer}
  onAnswerChange={(answer) => handleAnswerChange(question.id, answer)}
  showExplanation={false}
  correctAnswer={null}
/>
```

### Individual Components
- `SingleChoiceQuestion.tsx` (built-in)
- `MultiChoiceQuestion.tsx` (built-in)
- `TrueFalseQuestion.tsx` ✓ Đúng / ✗ Sai buttons
- `OrderingQuestion.tsx` - Drag & drop with numbered circles
- `MatchingQuestion.tsx` - Two-column drag & drop
- `FillBlankQuestion.tsx` - Inline text input

---

## 🧮 Scoring Utility

File: `app/utils/scoring.ts`

**Functions:**
- `scoreSingleChoice(correctId, selectedId, points)`
- `scoreMultiChoice(correctIds, selectedIds, points)` - Partial credit
- `scoreTrueFalse(correctAnswer, selectedAnswer, points)`
- `scoreOrdering(correctOrder, selectedOrder, points)` - Partial credit
- `scoreMatching(correctMatches, selectedMatches, points)` - Partial credit
- `scoreFillBlank(correctAnswers, selectedAnswer, caseSensitive, points)`
- `calculateTotalScore(results[])` - Aggregate total score
- `shuffleArray<T>(array)` - Fisher-Yates shuffle

---

## 📝 Usage Flow

### 1. Quiz Page (app/quiz/[id]/page.js)
```javascript
// Load question with options
const currentQuestion = quizData.questions[currentQuestionIndex];

// Render with QuestionRenderer
<QuestionRenderer
  question={currentQuestion}
  userAnswer={userAnswers[currentQuestion.id]}
  onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
  showExplanation={false}
  correctAnswer={null}
/>

// Submit answers
const response = await fetch('/api/quiz/submit', {
  method: 'POST',
  body: JSON.stringify({ attemptId, answers: userAnswers })
});
```

### 2. Submit API (app/api/quiz/submit/route.js)
```javascript
// Score each question based on type
const questionResults = [];

for (const [questionId, userAnswer] of Object.entries(answers)) {
  const question = questionBank.find(q => q.id === questionId);
  const points = question.points || 1;
  
  let earnedPoints = 0;
  switch (question.type) {
    case 'single_choice':
      earnedPoints = scoreSingleChoice(question.correctOptionId, userAnswer, points);
      break;
    case 'multi_choice':
      earnedPoints = scoreMultiChoice(question.correctOptionIds, userAnswer, points);
      break;
    // ... other types
  }
  
  questionResults.push({ questionId, userAnswer, earnedPoints, maxPoints: points });
}

// Calculate total
const { totalScore, maxScore, percentage } = calculateTotalScore(questionResults);
```

### 3. Result Page (app/result/[attemptId]/page.js)
```javascript
// Show each question with explanation
{result.questions.map((q, index) => (
  <QuestionRenderer
    question={q}
    userAnswer={attemptDetail.userAnswer}
    onAnswerChange={() => {}} // Read-only
    showExplanation={true}
    correctAnswer={correctAnswer}
  />
))}
```

---

## 🚀 Future Enhancements

1. **Admin UI** - Thêm giao diện tạo/sửa câu hỏi với form builder
2. **Question Bank Filtering** - Lọc câu hỏi theo type khi tạo quiz
3. **Mobile Optimization** - Cải thiện drag & drop trên mobile
4. **Analytics** - Thống kê loại câu hỏi nào khó nhất
5. **Image Support** - Hỗ trợ hình ảnh trong câu hỏi
6. **Timer per Question** - Giới hạn thời gian cho từng câu

---

## 📦 Dependencies

- **React 19.2.0** - Core framework
- **Next.js 16.0.4** - App router
- **Tailwind CSS v4** - Styling
- **HTML5 Drag & Drop API** - Native browser API
- **TypeScript** - Type safety

---

## ✅ Testing Checklist

- [ ] Tạo quiz với tất cả 6 loại câu hỏi
- [ ] Test drag & drop trên desktop
- [ ] Test drag & drop trên mobile/tablet
- [ ] Verify scoring calculations cho từng type
- [ ] Test shuffle options
- [ ] Test case-sensitive/insensitive fill blank
- [ ] Test explanation display
- [ ] Test partial credit cho multi-choice
- [ ] Test partial credit cho ordering
- [ ] Test partial credit cho matching
- [ ] Verify visual feedback (green/red colors)
- [ ] Test navigation between questions
- [ ] Test result page với tất cả question types
