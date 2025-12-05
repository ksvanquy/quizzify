# Quizzify API Documentation

## Base URL
```
http://localhost:3001
```

## Authentication
Hầu hết các endpoints yêu cầu JWT token trong header:
```
Authorization: Bearer <access_token>
```

Hoặc token được lưu trong httpOnly cookie `accessToken`.

---

## 📦 Response Format

Tất cả API responses đều có format chuẩn:

```typescript
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "error": "Error type"
}
```

---

## 🔐 Authentication APIs

### 1. Register
**POST** `/auth/register`

**Body:**
```typescript
{
  username: string;      // 3-20 characters, unique
  email: string;         // Valid email, unique
  password: string;      // Min 6 characters
  name: string;          // Display name
}
```

**Response:**
```typescript
{
  success: true;
  message: "Đăng ký thành công";
  data: {
    user: UserDto;
  }
}
```

---

### 2. Login
**POST** `/auth/login`

**Body:**
```typescript
{
  email: string;
  password: string;
}
```

**Response:**
```typescript
{
  success: true;
  message: "Đăng nhập thành công";
  data: {
    accessToken: string;
    user: UserDto;
  }
}
```

**Notes:**
- Sets httpOnly cookie `accessToken` (7 days expiry)
- Use token in `Authorization: Bearer <token>` header for subsequent requests

---

### 3. Logout
**POST** `/auth/logout`

**Response:**
```typescript
{
  success: true;
  message: "Đã đăng xuất";
}
```

---

### 4. Get Session
**GET** `/auth/session`

**Response:**
```typescript
{
  success: true;
  data: {
    user: UserDto | null;
  }
}
```

**Notes:**
- Returns current user if valid cookie exists
- Returns `user: null` if not authenticated

---

### 5. Get Profile
**GET** `/auth/profile`

**Auth Required:** ✅

**Response:**
```typescript
{
  success: true;
  message: "Lấy thông tin profile thành công";
  data: UserDto;
}
```

---

## 📁 Categories APIs

### 1. Get All Categories
**GET** `/categories`

**Query Params:**
- `active` (optional): `"true"` to get only active categories

**Response:**
```typescript
{
  success: true;
  data: {
    categories: CategoryDto[];
  }
}
```

---

### 2. Get Category by ID
**GET** `/categories/:id`

**Response:**
```typescript
{
  success: true;
  data: {
    category: CategoryDto;
  }
}
```

---

### 3. Get Category by Slug
**GET** `/categories/slug/:slug`

**Response:**
```typescript
{
  success: true;
  data: {
    category: CategoryDto;
  }
}
```

---

### 4. Get Subcategories
**GET** `/categories/parent/:parentId`

**Response:**
```typescript
{
  success: true;
  data: {
    categories: CategoryDto[];
  }
}
```

---

### 5. Create Category
**POST** `/categories`

**Auth Required:** ✅

**Body:**
```typescript
{
  name: string;
  slug: string;
  parentId?: number;
  icon?: string;         // Default: "📁"
  description?: string;
  displayOrder?: number; // Default: 1
  isActive?: boolean;    // Default: true
}
```

**Response:**
```typescript
{
  success: true;
  message: "Category created successfully";
  data: {
    category: CategoryDto;
  }
}
```

---

### 6. Update Category
**PUT** `/categories/:id`

**Auth Required:** ✅

**Body:** Same as Create (all fields optional)

**Response:**
```typescript
{
  success: true;
  message: "Category updated successfully";
  data: {
    category: CategoryDto;
  }
}
```

---

### 7. Delete Category
**DELETE** `/categories/:id`

**Auth Required:** ✅

**Response:**
```typescript
{
  success: true;
  message: "Category deleted successfully";
}
```

---

## ❓ Questions APIs

### 1. Get All Questions
**GET** `/questions`

**Query Params:**
```typescript
{
  categoryId?: string;
  topic?: string;
  difficulty?: "easy" | "medium" | "hard";
  type?: string;
  isActive?: boolean;
  limit?: number;
  skip?: number;
}
```

**Response:**
```typescript
{
  success: true;
  data: {
    questions: QuestionDto[];
    total: number;
  }
}
```

---

### 2. Get Question by ID
**GET** `/questions/:id`

**Response:**
```typescript
{
  success: true;
  data: QuestionDto;
}
```

---

### 3. Create Question
**POST** `/questions`

**Body:**
```typescript
{
  text: string;
  type: "single_choice" | "multi_choice" | "true_false" | "ordering" | 
        "matching" | "fill_blank" | "numeric_input" | "cloze_test" | "image_choice";
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  points?: number;              // Default: 1
  shuffleOptions?: boolean;     // Default: true
  
  // For choice questions
  optionIds?: string[];
  correctOptionId?: string;     // single_choice
  correctOptionIds?: string[];  // multi_choice
  
  // For true/false
  correctBoolean?: boolean;
  
  // For ordering
  correctOrder?: string[];
  
  // For matching
  correctPairs?: Record<string, string>;
  
  // For fill_blank
  correctAnswers?: string[];
  caseSensitive?: boolean;
  
  // For numeric_input
  correctNumber?: number;
  tolerance?: number;
  unit?: string;
  step?: number;
  
  explanation?: string;
  isActive?: boolean;           // Default: true
}
```

**Response:**
```typescript
{
  success: true;
  message: "Created";
  data: QuestionDto;
}
```

---

### 4. Update Question
**PUT** `/questions/:id`

**Body:** Same as Create (all fields optional)

**Response:**
```typescript
{
  success: true;
  message: "Updated";
  data: QuestionDto;
}
```

---

### 5. Delete Question
**DELETE** `/questions/:id`

**Response:**
```typescript
{
  success: true;
  message: "Deleted";
}
```

---

## 📝 Quizzes APIs

### 1. Get All Quizzes
**GET** `/quizzes`

**Query Params:**
- `status`: `"active" | "draft" | "archived"`
- `categoryId`: Filter by category
- `difficulty`: `"easy" | "medium" | "hard"`

**Response:**
```typescript
{
  success: true;
  data: {
    quizzes: QuizTemplateDto[];
  }
}
```

---

### 2. Get Quiz by ID
**GET** `/quizzes/:id`

**Response:**
```typescript
{
  success: true;
  data: {
    quiz: QuizTemplateDto;
  }
}
```

---

### 3. Get Quiz by Slug
**GET** `/quizzes/slug/:slug`

**Response:**
```typescript
{
  success: true;
  data: {
    quiz: QuizTemplateDto;
  }
}
```

---

### 4. Create Quiz
**POST** `/quizzes`

**Auth Required:** ✅

**Body:**
```typescript
{
  name: string;
  slug: string;
  categoryId: string;
  status?: "active" | "draft" | "archived";  // Default: "active"
  difficulty: "easy" | "medium" | "hard";
  durationMinutes: number;
  maxAttempts?: number;                      // Default: 0 (unlimited)
  shuffleQuestions?: boolean;                // Default: false
  revealAnswersAfterSubmission?: boolean;    // Default: false
  passingScore?: number;                     // Default: 0 (0-100)
  description?: string;
  tags?: string[];
  
  questionSelection: {
    mode: "manual" | "random";
    
    // For manual mode:
    manualQuestionIds?: string[];
    
    // For random mode:
    sourceTopics?: string[];
    randomCounts?: {
      easy: number;
      medium: number;
      hard: number;
    };
  };
}
```

**Response:**
```typescript
{
  success: true;
  message: "Quiz template created successfully";
  data: {
    quiz: QuizTemplateDto;
  }
}
```

---

### 5. Update Quiz
**PUT** `/quizzes/:id`

**Auth Required:** ✅

**Body:** Same as Create (all fields optional)

**Response:**
```typescript
{
  success: true;
  message: "Quiz template updated successfully";
  data: {
    quiz: QuizTemplateDto;
  }
}
```

---

### 6. Delete Quiz
**DELETE** `/quizzes/:id`

**Auth Required:** ✅

**Response:**
```typescript
{
  success: true;
  message: "Quiz template deleted successfully";
}
```

---

## 🎯 Attempts APIs

**All endpoints require authentication**

### 1. Create Attempt (Start Quiz)
**POST** `/attempts`

**Body:**
```typescript
{
  templateId: string;
}
```

**Response:**
```typescript
{
  success: true;
  message: "Attempt created successfully";
  data: {
    attempt: AttemptDto;
  }
}
```

---

### 2. Get My Attempts
**GET** `/attempts`

**Response:**
```typescript
{
  success: true;
  data: {
    attempts: AttemptDto[];
  }
}
```

---

### 3. Get Attempts by Template
**GET** `/attempts/template/:templateId`

**Response:**
```typescript
{
  success: true;
  data: {
    attempts: AttemptDto[];
  }
}
```

---

### 4. Get Attempt by ID
**GET** `/attempts/:id`

**Response:**
```typescript
{
  success: true;
  data: {
    attempt: AttemptDto;
  }
}
```

---

### 5. Submit Attempt
**POST** `/attempts/:id/submit`

**Body:**
```typescript
{
  userAnswers: Record<string, any>;  // questionId -> answer
  timeSpentSeconds?: number;
}
```

**Response:**
```typescript
{
  success: true;
  message: "Attempt submitted successfully";
  data: {
    attempt: AttemptDto;  // Includes score, percentage, passed
  }
}
```

---

### 6. Delete Attempt
**DELETE** `/attempts/:id`

**Response:**
```typescript
{
  success: true;
  message: "Attempt deleted successfully";
}
```

---

### 7. Get My Stats
**GET** `/attempts/stats/me`

**Response:**
```typescript
{
  success: true;
  data: {
    totalAttempts: number;
    completedAttempts: number;
    averageScore: number;
    totalTimeSpent: number;
    passedCount: number;
    failedCount: number;
  }
}
```

---

## 🔖 Bookmarks APIs

**All endpoints require authentication**

### 1. Get My Bookmarks
**GET** `/bookmarks`

**Response:**
```typescript
{
  success: true;
  data: {
    bookmarks: BookmarkDto[];
  }
}
```

---

### 2. Add Bookmark
**POST** `/bookmarks`

**Body:**
```typescript
{
  quizId: string;
}
```

**Response:**
```typescript
{
  success: true;
  message: "Bookmark added successfully";
  data: {
    bookmark: BookmarkDto;
  }
}
```

---

### 3. Remove Bookmark
**DELETE** `/bookmarks/:quizId`

**Response:**
```typescript
{
  success: true;
  message: "Bookmark removed successfully";
}
```

---

### 4. Check Bookmark Exists
**GET** `/bookmarks/check/:quizId`

**Response:**
```typescript
{
  success: true;
  data: {
    exists: boolean;
  }
}
```

---

## 👁️ Watchlists APIs

**All endpoints require authentication**

### 1. Get My Watchlist
**GET** `/watchlists`

**Response:**
```typescript
{
  success: true;
  data: {
    watchlist: WatchlistDto[];
  }
}
```

---

### 2. Add to Watchlist
**POST** `/watchlists`

**Body:**
```typescript
{
  quizId: string;
}
```

**Response:**
```typescript
{
  success: true;
  message: "Added to watchlist successfully";
  data: {
    watchlistItem: WatchlistDto;
  }
}
```

---

### 3. Remove from Watchlist
**DELETE** `/watchlists/:quizId`

**Response:**
```typescript
{
  success: true;
  message: "Removed from watchlist successfully";
}
```

---

### 4. Check Watchlist Exists
**GET** `/watchlists/check/:quizId`

**Response:**
```typescript
{
  success: true;
  data: {
    exists: boolean;
  }
}
```

---

## 🎯 Options APIs

**All endpoints require authentication**

### 1. Get All Options
**GET** `/options`

**Response:**
```typescript
{
  success: true;
  data: {
    options: OptionDto[];
  }
}
```

---

### 2. Get Options by Question
**GET** `/options/question/:questionId`

**Response:**
```typescript
{
  success: true;
  data: {
    options: OptionDto[];
  }
}
```

---

### 3. Get Correct Options
**GET** `/options/question/:questionId/correct`

**Response:**
```typescript
{
  success: true;
  data: {
    options: OptionDto[];
  }
}
```

---

### 4. Get Option by ID
**GET** `/options/:id`

**Response:**
```typescript
{
  success: true;
  data: {
    option: OptionDto;
  }
}
```

---

### 5. Create Option
**POST** `/options`

**Body:**
```typescript
{
  questionId: string;
  text: string;
  imageUrl?: string;
  isCorrect?: boolean;
  displayOrder?: number;
}
```

**Response:**
```typescript
{
  success: true;
  message: "Option created successfully";
  data: {
    option: OptionDto;
  }
}
```

---

### 6. Update Option
**PUT** `/options/:id`

**Body:** Same as Create (all fields optional)

**Response:**
```typescript
{
  success: true;
  message: "Option updated successfully";
  data: {
    option: OptionDto;
  }
}
```

---

### 7. Delete Option
**DELETE** `/options/:id`

**Response:**
```typescript
{
  success: true;
  message: "Option deleted successfully";
}
```

---

## ↕️ Orderings APIs

**All endpoints require authentication**

### 1. Get All Orderings
**GET** `/orderings`

**Response:**
```typescript
{
  success: true;
  data: {
    orderings: OrderingDto[];
  }
}
```

---

### 2. Get Ordering by Question
**GET** `/orderings/question/:questionId`

**Response:**
```typescript
{
  success: true;
  data: {
    ordering: OrderingDto;
  }
}
```

---

### 3. Get Ordering by ID
**GET** `/orderings/:id`

**Response:**
```typescript
{
  success: true;
  data: {
    ordering: OrderingDto;
  }
}
```

---

### 4. Create Ordering
**POST** `/orderings`

**Body:**
```typescript
{
  questionId: string;
  items: string[];
  correctOrder: string[];
}
```

**Response:**
```typescript
{
  success: true;
  message: "Ordering created successfully";
  data: {
    ordering: OrderingDto;
  }
}
```

---

### 5. Update Ordering
**PUT** `/orderings/:id`

**Body:** Same as Create (all fields optional)

**Response:**
```typescript
{
  success: true;
  message: "Ordering updated successfully";
  data: {
    ordering: OrderingDto;
  }
}
```

---

### 6. Delete Ordering
**DELETE** `/orderings/:id`

**Response:**
```typescript
{
  success: true;
  message: "Ordering deleted successfully";
}
```

---

## 🔗 Matchings APIs

**All endpoints require authentication**

### 1. Get All Matchings
**GET** `/matchings`

**Response:**
```typescript
{
  success: true;
  data: {
    matchings: MatchingDto[];
  }
}
```

---

### 2. Get Matching by Question
**GET** `/matchings/question/:questionId`

**Response:**
```typescript
{
  success: true;
  data: {
    matching: MatchingDto;
  }
}
```

---

### 3. Get Matching by ID
**GET** `/matchings/:id`

**Response:**
```typescript
{
  success: true;
  data: {
    matching: MatchingDto;
  }
}
```

---

### 4. Create Matching
**POST** `/matchings`

**Body:**
```typescript
{
  questionId: string;
  leftSide: Record<string, string>;
  rightSide: Record<string, string>;
  correctPairs: Record<string, string>;
}
```

**Response:**
```typescript
{
  success: true;
  message: "Matching created successfully";
  data: {
    matching: MatchingDto;
  }
}
```

---

### 5. Update Matching
**PUT** `/matchings/:id`

**Body:** Same as Create (all fields optional)

**Response:**
```typescript
{
  success: true;
  message: "Matching updated successfully";
  data: {
    matching: MatchingDto;
  }
}
```

---

### 6. Delete Matching
**DELETE** `/matchings/:id`

**Response:**
```typescript
{
  success: true;
  message: "Matching deleted successfully";
}
```

---

## 📝 Fill-Blanks APIs

**All endpoints require authentication**

### 1. Get All Fill-Blanks
**GET** `/fill-blanks`

**Response:**
```typescript
{
  success: true;
  data: {
    fillBlanks: FillBlankDto[];
  }
}
```

---

### 2. Get Fill-Blank by Question
**GET** `/fill-blanks/question/:questionId`

**Response:**
```typescript
{
  success: true;
  data: {
    fillBlank: FillBlankDto;
  }
}
```

---

### 3. Get Fill-Blank by ID
**GET** `/fill-blanks/:id`

**Response:**
```typescript
{
  success: true;
  data: {
    fillBlank: FillBlankDto;
  }
}
```

---

### 4. Create Fill-Blank
**POST** `/fill-blanks`

**Body:**
```typescript
{
  questionId: string;
  correctAnswers: string[];
  caseSensitive?: boolean;  // Default: false
}
```

**Response:**
```typescript
{
  success: true;
  message: "FillBlank created successfully";
  data: {
    fillBlank: FillBlankDto;
  }
}
```

---

### 5. Update Fill-Blank
**PUT** `/fill-blanks/:id`

**Body:** Same as Create (all fields optional)

**Response:**
```typescript
{
  success: true;
  message: "FillBlank updated successfully";
  data: {
    fillBlank: FillBlankDto;
  }
}
```

---

### 6. Delete Fill-Blank
**DELETE** `/fill-blanks/:id`

**Response:**
```typescript
{
  success: true;
  message: "FillBlank deleted successfully";
}
```

---

## 🔢 Numeric-Inputs APIs

**All endpoints require authentication**

### 1. Get All Numeric-Inputs
**GET** `/numeric-inputs`

**Response:**
```typescript
{
  success: true;
  data: {
    numericInputs: NumericInputDto[];
  }
}
```

---

### 2. Get Numeric-Input by Question
**GET** `/numeric-inputs/question/:questionId`

**Response:**
```typescript
{
  success: true;
  data: {
    numericInput: NumericInputDto;
  }
}
```

---

### 3. Get Numeric-Input by ID
**GET** `/numeric-inputs/:id`

**Response:**
```typescript
{
  success: true;
  data: {
    numericInput: NumericInputDto;
  }
}
```

---

### 4. Create Numeric-Input
**POST** `/numeric-inputs`

**Body:**
```typescript
{
  questionId: string;
  correctNumber: number;
  tolerance?: number;     // Default: 0
  unit?: string;
  step?: number;
}
```

**Response:**
```typescript
{
  success: true;
  message: "NumericInput created successfully";
  data: {
    numericInput: NumericInputDto;
  }
}
```

---

### 5. Update Numeric-Input
**PUT** `/numeric-inputs/:id`

**Body:** Same as Create (all fields optional)

**Response:**
```typescript
{
  success: true;
  message: "NumericInput updated successfully";
  data: {
    numericInput: NumericInputDto;
  }
}
```

---

### 6. Delete Numeric-Input
**DELETE** `/numeric-inputs/:id`

**Response:**
```typescript
{
  success: true;
  message: "NumericInput deleted successfully";
}
```

---

## 📋 TypeScript Types for Frontend

### User Types

```typescript
interface UserDto {
  id: string;
  username: string;
  email: string;
  name: string;
  avatar: string;
  role: "admin" | "teacher" | "student";
  bio?: string;
  phone?: string;
  address?: string;
  lastLogin?: Date;
  isActive: boolean;
}
```

---

### Category Types

```typescript
interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  parentId?: number;
  icon: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateCategoryDto {
  name: string;
  slug: string;
  parentId?: number;
  icon?: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}

interface UpdateCategoryDto {
  name?: string;
  slug?: string;
  parentId?: number;
  icon?: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}
```

---

### Question Types

```typescript
type QuestionType = 
  | "single_choice"
  | "multi_choice"
  | "true_false"
  | "ordering"
  | "matching"
  | "fill_blank"
  | "numeric_input"
  | "cloze_test"
  | "image_choice";

type Difficulty = "easy" | "medium" | "hard";

interface QuestionDto {
  id: string;
  text: string;
  type: QuestionType;
  topic: string;
  difficulty: Difficulty;
  points: number;
  shuffleOptions: boolean;
  
  // Choice questions
  optionIds?: string[];
  correctOptionId?: string;
  correctOptionIds?: string[];
  
  // True/False
  correctBoolean?: boolean;
  
  // Ordering
  correctOrder?: string[];
  
  // Matching
  correctPairs?: Record<string, string>;
  
  // Fill blank
  correctAnswers?: string[];
  caseSensitive?: boolean;
  
  // Numeric input
  correctNumber?: number;
  tolerance?: number;
  unit?: string;
  step?: number;
  
  explanation?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateQuestionDto {
  text: string;
  type: QuestionType;
  topic: string;
  difficulty: Difficulty;
  points?: number;
  shuffleOptions?: boolean;
  optionIds?: string[];
  correctOptionId?: string;
  correctOptionIds?: string[];
  correctBoolean?: boolean;
  correctOrder?: string[];
  correctPairs?: Record<string, string>;
  correctAnswers?: string[];
  caseSensitive?: boolean;
  correctNumber?: number;
  tolerance?: number;
  unit?: string;
  step?: number;
  explanation?: string;
  isActive?: boolean;
}

interface QueryQuestionDto {
  categoryId?: string;
  topic?: string;
  difficulty?: Difficulty;
  type?: QuestionType;
  isActive?: boolean;
  limit?: number;
  skip?: number;
}
```

---

### Quiz Types

```typescript
type QuizStatus = "active" | "draft" | "archived";

interface QuestionSelectionDto {
  mode: "manual" | "random";
  manualQuestionIds?: string[];
  sourceTopics?: string[];
  randomCounts?: {
    easy: number;
    medium: number;
    hard: number;
  };
}

interface QuizTemplateDto {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  status: QuizStatus;
  difficulty: Difficulty;
  durationMinutes: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  revealAnswersAfterSubmission: boolean;
  passingScore: number;
  description?: string;
  tags: string[];
  questionSelection: QuestionSelectionDto;
  totalAttempts: number;
  averageScore: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateQuizTemplateDto {
  name: string;
  slug: string;
  categoryId: string;
  status?: QuizStatus;
  difficulty: Difficulty;
  durationMinutes: number;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
  revealAnswersAfterSubmission?: boolean;
  passingScore?: number;
  description?: string;
  tags?: string[];
  questionSelection: QuestionSelectionDto;
}
```

---

### Attempt Types

```typescript
type AttemptStatus = "in-progress" | "completed" | "expired";

interface AttemptQuestionDto {
  id: number;
  text: string;
  type: string;
  points: number;
  options?: any[];
  correctAnswer?: any;
  userAnswer?: any;
  earnedPoints?: number;
  isCorrect?: boolean;
  explanation?: string;
}

interface AttemptDto {
  id: string;
  userId: string;
  templateId: string;
  startedAt: Date;
  submittedAt?: Date;
  status: AttemptStatus;
  questions: AttemptQuestionDto[];
  userAnswers?: Record<string, any>;
  totalScore?: number;
  percentage?: number;
  passed?: boolean;
  timeSpentSeconds?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateAttemptDto {
  templateId: string;
}

interface SubmitAttemptDto {
  userAnswers: Record<string, any>;
  timeSpentSeconds?: number;
}
```

---

### Bookmark & Watchlist Types

```typescript
interface BookmarkDto {
  id: string;
  userId: string;
  quizId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateBookmarkDto {
  quizId: string;
}

interface WatchlistDto {
  id: string;
  userId: string;
  quizId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateWatchlistDto {
  quizId: string;
}
```

---

### Option Types

```typescript
interface OptionDto {
  id: string;
  questionId: string;
  text: string;
  imageUrl?: string;
  isCorrect: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateOptionDto {
  questionId: string;
  text: string;
  imageUrl?: string;
  isCorrect?: boolean;
  displayOrder?: number;
}

interface UpdateOptionDto {
  questionId?: string;
  text?: string;
  imageUrl?: string;
  isCorrect?: boolean;
  displayOrder?: number;
}
```

---

### Ordering Types

```typescript
interface OrderingDto {
  id: string;
  questionId: string;
  items: string[];
  correctOrder: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface CreateOrderingDto {
  questionId: string;
  items: string[];
  correctOrder: string[];
}

interface UpdateOrderingDto {
  questionId?: string;
  items?: string[];
  correctOrder?: string[];
}
```

---

### Matching Types

```typescript
interface MatchingDto {
  id: string;
  questionId: string;
  leftSide: Record<string, string>;
  rightSide: Record<string, string>;
  correctPairs: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateMatchingDto {
  questionId: string;
  leftSide: Record<string, string>;
  rightSide: Record<string, string>;
  correctPairs: Record<string, string>;
}

interface UpdateMatchingDto {
  questionId?: string;
  leftSide?: Record<string, string>;
  rightSide?: Record<string, string>;
  correctPairs?: Record<string, string>;
}
```

---

### Fill-Blank Types

```typescript
interface FillBlankDto {
  id: string;
  questionId: string;
  correctAnswers: string[];
  caseSensitive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateFillBlankDto {
  questionId: string;
  correctAnswers: string[];
  caseSensitive?: boolean;
}

interface UpdateFillBlankDto {
  questionId?: string;
  correctAnswers?: string[];
  caseSensitive?: boolean;
}
```

---

### Numeric-Input Types

```typescript
interface NumericInputDto {
  id: string;
  questionId: string;
  correctNumber: number;
  tolerance: number;
  unit?: string;
  step?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateNumericInputDto {
  questionId: string;
  correctNumber: number;
  tolerance?: number;
  unit?: string;
  step?: number;
}

interface UpdateNumericInputDto {
  questionId?: string;
  correctNumber?: number;
  tolerance?: number;
  unit?: string;
  step?: number;
}
```

---

### API Response Types

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Specific response types
type LoginResponse = ApiResponse<{
  accessToken: string;
  user: UserDto;
}>;

type RegisterResponse = ApiResponse<{
  user: UserDto;
}>;

type SessionResponse = ApiResponse<{
  user: UserDto | null;
}>;

type CategoriesResponse = ApiResponse<{
  categories: CategoryDto[];
}>;

type QuestionsResponse = ApiResponse<{
  questions: QuestionDto[];
  total: number;
}>;

type QuizzesResponse = ApiResponse<{
  quizzes: QuizTemplateDto[];
}>;

type AttemptsResponse = ApiResponse<{
  attempts: AttemptDto[];
}>;

type BookmarksResponse = ApiResponse<{
  bookmarks: BookmarkDto[];
}>;

type WatchlistResponse = ApiResponse<{
  watchlist: WatchlistDto[];
}>;
```

---

## 🔒 Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate resource |
| 500 | Internal Server Error |

---

## 📝 Common Error Responses

**Validation Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

**Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**Not Found:**
```json
{
  "success": false,
  "message": "Resource not found",
  "error": "Not Found"
}
```

**Conflict:**
```json
{
  "success": false,
  "message": "Email đã tồn tại",
  "error": "Conflict"
}
```

---

## 🚀 Example Usage (JavaScript/TypeScript)

### Using Fetch API

```typescript
// Login
const login = async (email: string, password: string) => {
  const response = await fetch('http://localhost:3001/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important for cookies
    body: JSON.stringify({ email, password }),
  });
  
  const data: LoginResponse = await response.json();
  
  if (data.success) {
    localStorage.setItem('token', data.data.accessToken);
    return data.data.user;
  }
  
  throw new Error(data.message);
};

// Get categories with token
const getCategories = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:3001/categories', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data: CategoriesResponse = await response.json();
  return data.data.categories;
};

// Create quiz
const createQuiz = async (quizData: CreateQuizTemplateDto) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:3001/quizzes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(quizData),
  });
  
  const data = await response.json();
  return data.data.quiz;
};
```

### Using Axios

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login
const login = async (email: string, password: string) => {
  const { data } = await api.post<LoginResponse>('/auth/login', {
    email,
    password,
  });
  
  if (data.success) {
    localStorage.setItem('token', data.data.accessToken);
    return data.data.user;
  }
};

// Get quizzes
const getQuizzes = async (categoryId?: string) => {
  const { data } = await api.get<QuizzesResponse>('/quizzes', {
    params: { categoryId },
  });
  
  return data.data.quizzes;
};

// Start quiz attempt
const startAttempt = async (templateId: string) => {
  const { data } = await api.post('/attempts', { templateId });
  return data.data.attempt;
};

// Submit attempt
const submitAttempt = async (
  attemptId: string,
  userAnswers: Record<string, any>,
  timeSpentSeconds: number
) => {
  const { data } = await api.post(`/attempts/${attemptId}/submit`, {
    userAnswers,
    timeSpentSeconds,
  });
  
  return data.data.attempt;
};
```

---

## 📌 Notes

1. **CORS**: API cho phép CORS từ `http://localhost:3000` (configurable via env)
2. **Cookies**: accessToken được lưu trong httpOnly cookie
3. **Validation**: Tất cả inputs đều được validate tự động
4. **Timestamps**: `createdAt` và `updatedAt` được tự động thêm bởi MongoDB
5. **IDs**: Sử dụng MongoDB ObjectId (string format)

---

## 🔧 Environment Variables

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/quizzify
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

---

**Last Updated:** November 30, 2025
