# Diagnostic Script để tìm nguyên nhân "No questions selected"

## Phân Tích Vấn Đề

Quiz template có 2 mode:

### 1️⃣ **Manual Mode** (Đơn giản nhất)
```json
{
  "questionSelection": {
    "mode": "manual",
    "manualQuestionIds": [
      "692cf7b1e9e51ab47a87a317",
      "692cf7b1e9e51ab47a87a319",
      "692cf7b1e9e51ab47a87a31b"
    ]
  }
}
```
Backend chỉ cần: **Lấy questions có ID trong list `manualQuestionIds`**

---

### 2️⃣ **Random Mode** (Phức tạp hơn)
```json
{
  "questionSelection": {
    "mode": "random",
    "sourceTopics": ["Math", "Science"],
    "randomCounts": {
      "easy": 5,
      "medium": 5,
      "hard": 5
    }
  }
}
```
Backend cần:
1. Filter questions có `topic` trong `sourceTopics`
2. Chọn ngẫu nhiên theo `difficulty` và `randomCounts`

---

## ✅ Logic Backend (Updated)

```javascript
// Manual Mode: Match ObjectId trực tiếp
if (template.questionSelection.mode === 'manual') {
  const manualIds = template.questionSelection.manualQuestionIds.map(id => String(id));
  selectedQuestions = questions.filter(q => 
    manualIds.includes(String(q.id || q._id))
  );
}

// Random Mode: Filter by topic, then by difficulty
if (template.questionSelection.mode === 'random') {
  const filteredQuestions = questions.filter(q => 
    template.questionSelection.sourceTopics?.includes(q.topic)
  );
  
  const counts = template.questionSelection.randomCounts;
  for (const [difficulty, count] of Object.entries(counts)) {
    const qByDifficulty = filteredQuestions.filter(q => q.difficulty === difficulty);
    selectedQuestions.push(...qByDifficulty.slice(0, count));
  }
}
```

---

## 🔍 Debug Checklist

### Khi báo lỗi "No questions selected"

**1. Kiểm tra template mode:**
```bash
# Manual mode
db.quizTemplates.findOne({ _id: ObjectId("...") })
# Output: questionSelection.mode === "manual"

# Random mode
# Output: questionSelection.mode === "random"
```

**2. Nếu manual mode → Kiểm tra questionIds:**
```bash
# Xem template
db.quizTemplates.findOne({ _id: ObjectId("...") })

# Xem những questions đó tồn tại không
db.questions.find({ 
  _id: { $in: [
    ObjectId("692cf7b1e9e51ab47a87a317"),
    ObjectId("692cf7b1e9e51ab47a87a319"),
    ObjectId("692cf7b1e9e51ab47a87a31b")
  ]}
})

# Phải trả về 3 documents, nếu ít hơn → Có ID không tồn tại
```

**3. Nếu random mode → Kiểm tra topics và difficulty:**
```bash
# Xem available topics
db.questions.distinct("topic")

# Xem available difficulties
db.questions.distinct("difficulty")

# Xem template requirements
db.quizTemplates.findOne({ _id: ObjectId("...") })
# Check: sourceTopics, randomCounts
```

**4. Backend logs:**
```
📋 Manual Question Selection:
   Required IDs: 3
   ✅ Matched: 3/3 questions

# Hoặc

🎲 Random Question Selection:
   sourceTopics: Math, Science
   Filtered questions: 20 / 50
   By difficulty: { easy: "5/8", medium: "5/7", hard: "3/5" }
   Total selected: 13
```

---

## ❌ Common Issues & Fixes

### Issue 1: Manual mode, nhưng 0 matches
```
📋 Manual Question Selection:
   Required IDs: 3
   ✅ Matched: 0/3 questions
```

**Nguyên nhân:**
- Questions với ID đó không tồn tại trong database
- Hoặc API questions trả về `id` khác format ObjectId

**Fix:**
```bash
# Kiểm tra questions có tồn tại không
db.questions.find({ _id: ObjectId("692cf7b1e9e51ab47a87a317") })

# Nếu không → Seed test data
db.questions.insertOne({
  _id: ObjectId("692cf7b1e9e51ab47a87a317"),
  text: "Sample question",
  type: "single_choice",
  difficulty: "easy",
  topic: "Math",
  options: [...]
})
```

### Issue 2: Random mode, filtered questions = 0
```
🎲 Random Question Selection:
   sourceTopics: Math, Science
   Filtered questions: 0 / 50
```

**Nguyên nhân:**
- Không có questions với topic "Math" hoặc "Science"
- Topics case-sensitive mismatch

**Fix:**
```bash
# Xem actual topics
db.questions.distinct("topic")
# Output: ["math", "science"] (lowercase)

# Sửa template
db.quizTemplates.updateOne(
  { _id: ObjectId("...") },
  { $set: { "questionSelection.sourceTopics": ["math", "science"] }}
)
```

### Issue 3: Random mode, không đủ questions theo difficulty
```
🎲 Random Question Selection:
   By difficulty: { easy: "2/8", medium: "0/0", hard: "1/5" }
   Total selected: 3  # Cần 15 nhưng chỉ có 3
```

**Nguyên nhân:**
- Không có questions với difficulty "medium"
- randomCounts yêu cầu quá nhiều

**Fix:**
- Hoặc seed thêm questions
- Hoặc giảm randomCounts
```bash
db.quizTemplates.updateOne(
  { _id: ObjectId("...") },
  { $set: {
    "questionSelection.randomCounts": {
      "easy": 2,
      "medium": 0,
      "hard": 1
    }
  }}
)
```

---

## 🧪 Test Data

```javascript
// 1. Insert test questions
db.questions.insertMany([
  {
    _id: ObjectId("692cf7b1e9e51ab47a87a317"),
    text: "Q1: Easy math",
    type: "single_choice",
    difficulty: "easy",
    topic: "Math",
    points: 1,
    options: [
      { _id: ObjectId(), text: "4", isCorrect: true },
      { _id: ObjectId(), text: "5", isCorrect: false }
    ]
  },
  {
    _id: ObjectId("692cf7b1e9e51ab47a87a319"),
    text: "Q2: Medium history",
    type: "single_choice",
    difficulty: "medium",
    topic: "History",
    points: 2,
    options: [...]
  }
])

// 2. Insert test template
db.quizTemplates.insertOne({
  name: "Test Quiz",
  slug: "test-quiz",
  categoryId: ObjectId("692cf7b1e9e51ab47a87a305"),
  status: "active",
  questionSelection: {
    mode: "manual",
    manualQuestionIds: [
      ObjectId("692cf7b1e9e51ab47a87a317"),
      ObjectId("692cf7b1e9e51ab47a87a319")
    ]
  }
})
```

---

## 📋 Verification Checklist

- [ ] Backend logs show "✅ Matched: X/Y questions"
- [ ] No "⚠️ Missing questions" warnings
- [ ] selectedQuestions.length > 0
- [ ] Quiz loads successfully on frontend

