# 📚 Cấu trúc Dữ liệu Quiz System

## 1. 📝 Question Types (Các loại câu hỏi)

### 1.1. Single Choice (Chọn 1 đáp án)
```json
{
  "id": 101,
  "text": "Câu hỏi của bạn?",
  "type": "single_choice",
  "topic": "Topic_Name",
  "difficulty": "easy|medium|hard",
  "points": 1,
  "shuffleOptions": true,
  "answerOptionIds": [1001, 1002, 1003, 1004],
  "correctOptionId": 1003,
  "explanation": "Giải thích đáp án đúng"
}
```

### 1.2. Multi Choice (Chọn nhiều đáp án)
```json
{
  "id": 102,
  "text": "Chọn tất cả đáp án đúng?",
  "type": "multi_choice",
  "topic": "Topic_Name",
  "difficulty": "medium",
  "points": 2,
  "shuffleOptions": true,
  "answerOptionIds": [1005, 1006, 1007, 1008],
  "correctOptionIds": [1005, 1007],
  "explanation": "Giải thích các đáp án đúng"
}
```

### 1.3. True/False (Đúng/Sai)
```json
{
  "id": 106,
  "text": "React là một JavaScript framework",
  "type": "true_false",
  "topic": "React_Fundamentals",
  "difficulty": "easy",
  "points": 1,
  "shuffleOptions": false,
  "correctAnswer": false,
  "explanation": "React là library, không phải framework"
}
```

### 1.4. Ordering (Sắp xếp thứ tự)
```json
{
  "id": 108,
  "text": "Kéo thả để sắp xếp đúng thứ tự",
  "type": "ordering",
  "topic": "Topic_Name",
  "difficulty": "medium",
  "points": 2,
  "shuffleOptions": true,
  "items": [
    { "id": "item1", "text": "Bước 2", "correctOrder": 2 },
    { "id": "item2", "text": "Bước 1", "correctOrder": 1 },
    { "id": "item3", "text": "Bước 3", "correctOrder": 3 }
  ],
  "explanation": "Giải thích thứ tự đúng"
}
```

### 1.5. Matching (Nối cặp)
```json
{
  "id": 109,
  "text": "Nối các khái niệm với định nghĩa đúng",
  "type": "matching",
  "topic": "Topic_Name",
  "difficulty": "hard",
  "points": 3,
  "shuffleOptions": true,
  "pairs": [
    { 
      "id": "pair1", 
      "left": "Khái niệm A", 
      "right": "Định nghĩa A",
      "leftId": "left1",
      "rightId": "right1"
    },
    { 
      "id": "pair2", 
      "left": "Khái niệm B", 
      "right": "Định nghĩa B",
      "leftId": "left2",
      "rightId": "right2"
    }
  ],
  "explanation": "Giải thích các cặp đúng"
}
```

### 1.6. Fill in the Blank (Điền vào chỗ trống)
```json
{
  "id": 110,
  "text": "React sử dụng _____ DOM để tối ưu hiệu suất",
  "type": "fill_blank",
  "topic": "React_Fundamentals",
  "difficulty": "easy",
  "points": 1,
  "shuffleOptions": false,
  "correctAnswers": ["Virtual", "virtual", "VIRTUAL"],
  "caseSensitive": false,
  "explanation": "React sử dụng Virtual DOM"
}
```

## 2. 🎯 Question Fields (Các trường dữ liệu)

### Trường bắt buộc:
- `id` (number): ID duy nhất
- `text` (string): Nội dung câu hỏi
- `type` (string): Loại câu hỏi
- `topic` (string): Chủ đề
- `difficulty` (string): Độ khó (easy/medium/hard)
- `points` (number): Điểm số
- `shuffleOptions` (boolean): Có shuffle đáp án không

### Trường tùy chọn:
- `explanation` (string): Giải thích đáp án (hiển thị sau khi nộp bài)
- `imageUrl` (string): Link ảnh minh họa
- `codeSnippet` (string): Code snippet (nếu là câu hỏi code)
- `hint` (string): Gợi ý

## 3. 📋 Answer Options Structure

```json
{
  "id": 1001,
  "questionId": 101,
  "text": "Nội dung đáp án",
  "isCorrect": true
}
```

### Trường bổ sung (tùy chọn):
- `imageUrl` (string): Link ảnh cho đáp án
- `explanation` (string): Giải thích riêng cho đáp án này

## 4. 🎲 Quiz Template với Shuffle

```json
{
  "id": 1,
  "name": "Bài Thi Example",
  "shuffleQuestions": true,
  "shuffleOptionsGlobally": true,
  "questionSelection": {
    "mode": "random",
    "sourceTopics": ["Topic1", "Topic2"],
    "randomCounts": {
      "easy": 5,
      "medium": 10,
      "hard": 5
    }
  }
}
```

### Shuffle Options:
- `shuffleQuestions` (boolean): Shuffle thứ tự câu hỏi
- `shuffleOptionsGlobally` (boolean): Override shuffleOptions của từng câu hỏi
- Mỗi câu hỏi có `shuffleOptions` riêng để kiểm soát

## 5. 🔧 Implementation Guidelines

### Frontend Component cần hỗ trợ:
1. **SingleChoiceQuestion**: Radio buttons
2. **MultiChoiceQuestion**: Checkboxes
3. **TrueFalseQuestion**: 2 buttons (Đúng/Sai)
4. **OrderingQuestion**: Drag & drop items
5. **MatchingQuestion**: Drag & drop matching
6. **FillBlankQuestion**: Text input

### Scoring Logic:
- Single Choice: 100% điểm nếu đúng, 0% nếu sai
- Multi Choice: Điểm chia đều cho các đáp án đúng
- True/False: 100% hoặc 0%
- Ordering: Tính % theo số items đúng vị trí
- Matching: Tính % theo số cặp đúng
- Fill Blank: 100% nếu match (có thể case insensitive)

## 6. 📊 Migration Strategy

### Bước 1: Thêm trường mới vào questions hiện có
```javascript
// Thêm vào mỗi question:
{
  "points": 1,
  "shuffleOptions": true,
  "explanation": "..."
}
```

### Bước 2: Thêm isCorrect vào options
```javascript
// Thêm vào mỗi option:
{
  "isCorrect": true/false
}
```

### Bước 3: Tạo components mới cho các loại câu hỏi mới
- TrueFalseQuestion.tsx
- OrderingQuestion.tsx
- MatchingQuestion.tsx
- FillBlankQuestion.tsx

### Bước 4: Update quiz renderer để detect type và render đúng component

## 7. 🎨 UI/UX Recommendations

### Icons cho question types:
- single_choice: 🔘 (Radio)
- multi_choice: ☑️ (Checkbox)
- true_false: ✓✗ (Check/Cross)
- ordering: ⇅ (Arrows)
- matching: 🔗 (Link)
- fill_blank: ✏️ (Pencil)

### Colors:
- Correct answer: Green (#10B981)
- Wrong answer: Red (#EF4444)
- Partial correct: Yellow (#F59E0B)
- Not answered: Gray (#6B7280)
