# 🚀 KẾ HOẠCH XÂY DỰNG BACKEND NESTJS + MONGOOSE

**Dự án:** Quizzify - Hệ thống thi trắc nghiệm online  
**Ngày tạo:** 27/11/2025  
**Thời gian dự kiến:** 8 tuần  
**Tech Stack:** NestJS + Mongoose + MongoDB + JWT

---

## I. PHÂN TÍCH HIỆN TRẠNG

### API Endpoints hiện tại (Next.js):

#### AUTH
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/session` - Kiểm tra session

#### QUIZZES
- `GET /api/quizzes/[templateId]` - Tạo attempt & load questions
- `POST /api/quiz/submit` - Submit answers & scoring

#### CATEGORIES
- `GET /api/categories` - List với thống kê
- `GET /api/categories/[id]/quizzes` - Quizzes theo category

#### USER
- `GET /api/user/attempts` - Lịch sử làm bài
- `GET /api/profile` - Xem profile
- `PUT /api/profile` - Cập nhật profile

#### BOOKMARKS & WATCHLIST
- `GET /api/bookmarks` - Danh sách bookmark
- `POST /api/bookmarks` - Thêm bookmark
- `DELETE /api/bookmarks/[quizId]` - Xóa bookmark
- `GET /api/watchlist` - Danh sách watchlist
- `POST /api/watchlist` - Thêm watchlist
- `DELETE /api/watchlist/[quizId]` - Xóa watchlist

#### RESULTS
- `GET /api/results/[attemptId]` - Xem kết quả chi tiết

### Data Models (từ JSON files):
- `users.json` - 5 users mẫu
- `questions.json` - 120 câu hỏi (9 loại)
- `answers.json` - Answer options
- `quizTemplates.json` - Quiz configurations
- `categories.json` - 14 categories (hierarchical)
- `userAttempts.json` - Lịch sử làm bài
- `bookmarks.json` - Bookmarks
- `watchlist.json` - Watchlist

### Loại câu hỏi được hỗ trợ (9 types):
1. **single_choice** - Trắc nghiệm đơn
2. **multi_choice** - Nhiều đáp án đúng
3. **true_false** - Đúng/Sai
4. **ordering** - Sắp xếp thứ tự (drag & drop)
5. **matching** - Ghép cặp (drag & drop)
6. **fill_blank** - Điền vào chỗ trống
7. **image_choice** - Chọn hình ảnh
8. **numeric_input** - Nhập số (với tolerance)
9. **cloze_test** - Điền nhiều chỗ trống trong đoạn văn

---

## II. KIẾN TRÚC NESTJS BACKEND

```
quizzify-backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── auth/                        # Authentication Module
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── local.strategy.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       └── register.dto.ts
│   │
│   ├── users/                       # User Management
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── schemas/
│   │   │   └── user.schema.ts
│   │   └── dto/
│   │       ├── create-user.dto.ts
│   │       └── update-profile.dto.ts
│   │
│   ├── questions/                   # Question Bank
│   │   ├── questions.module.ts
│   │   ├── questions.controller.ts
│   │   ├── questions.service.ts
│   │   ├── schemas/
│   │   │   ├── question.schema.ts
│   │   │   └── answer.schema.ts
│   │   └── dto/
│   │       ├── create-question.dto.ts
│   │       └── filter-question.dto.ts
│   │
│   ├── quizzes/                     # Quiz Templates
│   │   ├── quizzes.module.ts
│   │   ├── quizzes.controller.ts
│   │   ├── quizzes.service.ts
│   │   ├── schemas/
│   │   │   └── quiz-template.schema.ts
│   │   └── dto/
│   │       ├── create-quiz.dto.ts
│   │       └── quiz-selection.dto.ts
│   │
│   ├── attempts/                    # Quiz Attempts
│   │   ├── attempts.module.ts
│   │   ├── attempts.controller.ts
│   │   ├── attempts.service.ts
│   │   ├── schemas/
│   │   │   └── attempt.schema.ts
│   │   └── dto/
│   │       ├── start-attempt.dto.ts
│   │       └── submit-attempt.dto.ts
│   │
│   ├── scoring/                     # Scoring Engine
│   │   ├── scoring.module.ts
│   │   ├── scoring.service.ts
│   │   └── strategies/
│   │       ├── single-choice.scorer.ts
│   │       ├── multi-choice.scorer.ts
│   │       ├── ordering.scorer.ts
│   │       ├── matching.scorer.ts
│   │       ├── fill-blank.scorer.ts
│   │       ├── image-choice.scorer.ts
│   │       ├── numeric.scorer.ts
│   │       └── cloze-test.scorer.ts
│   │
│   ├── categories/                  # Categories
│   │   ├── categories.module.ts
│   │   ├── categories.controller.ts
│   │   ├── categories.service.ts
│   │   └── schemas/
│   │       └── category.schema.ts
│   │
│   ├── bookmarks/                   # Bookmarks & Watchlist
│   │   ├── bookmarks.module.ts
│   │   ├── bookmarks.controller.ts
│   │   ├── bookmarks.service.ts
│   │   └── schemas/
│   │       ├── bookmark.schema.ts
│   │       └── watchlist.schema.ts
│   │
│   ├── common/                      # Shared Resources
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   └── utils/
│   │       ├── shuffle.util.ts
│   │       └── date.util.ts
│   │
│   └── config/                      # Configuration
│       ├── database.config.ts
│       ├── jwt.config.ts
│       └── app.config.ts
│
├── test/
│   ├── unit/
│   └── e2e/
│
├── .env
├── .env.example
├── .dockerignore
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── nest-cli.json
└── README.md
```

---

## III. MONGOOSE SCHEMAS

### 1. User Schema

```typescript
// users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true, minlength: 3, maxlength: 20 })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string; // Bcrypt hashed

  @Prop({ required: true })
  name: string;

  @Prop({ default: 'https://ui-avatars.com/api/?name=' })
  avatar: string;

  @Prop({ default: 'student', enum: ['admin', 'teacher', 'student'] })
  role: string;

  @Prop()
  bio?: string;

  @Prop()
  phone?: string;

  @Prop()
  address?: string;

  @Prop({ type: [Number], default: [] })
  bookmarks: number[]; // QuizTemplate IDs

  @Prop({ type: [Number], default: [] })
  watchlist: number[]; // QuizTemplate IDs

  @Prop()
  lastLogin?: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
```

### 2. Question Schema

```typescript
// questions/schemas/question.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Question extends Document {
  @Prop({ required: true })
  text: string;

  @Prop({ 
    required: true, 
    enum: ['single_choice', 'multi_choice', 'true_false', 'ordering', 
           'matching', 'fill_blank', 'image_choice', 'numeric_input', 'cloze_test']
  })
  type: string;

  @Prop({ required: true })
  topic: string;

  @Prop({ required: true, enum: ['easy', 'medium', 'hard'] })
  difficulty: string;

  @Prop({ default: 1, min: 1, max: 10 })
  points: number;

  @Prop({ default: true })
  shuffleOptions: boolean;

  // For choice types (single_choice, multi_choice, image_choice)
  @Prop({ type: [Number] })
  answerOptionIds?: number[];

  @Prop()
  correctOptionId?: number; // single_choice, image_choice

  @Prop({ type: [Number] })
  correctOptionIds?: number[]; // multi_choice

  // For ordering
  @Prop({ type: [String] })
  correctOrder?: string[];

  // For matching
  @Prop({ type: Object })
  correctPairs?: Record<string, string>;

  // For fill_blank/cloze_test
  @Prop({ type: [String] })
  correctAnswers?: string[];

  @Prop({ default: false })
  caseSensitive?: boolean;

  // For numeric_input
  @Prop()
  correctAnswer?: number;

  @Prop()
  tolerance?: number;

  @Prop()
  unit?: string;

  @Prop()
  step?: number;

  @Prop()
  explanation?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

// Indexes
QuestionSchema.index({ topic: 1, difficulty: 1 });
QuestionSchema.index({ type: 1 });
QuestionSchema.index({ isActive: 1 });
```

### 3. Answer Schema (Options)

```typescript
// questions/schemas/answer.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Answer extends Document {
  @Prop({ required: true })
  questionId: number;

  @Prop({ required: true })
  text: string;

  @Prop() // For image_choice
  imageUrl?: string;

  @Prop({ default: 1 })
  displayOrder: number;
}

export const AnswerSchema = SchemaFactory.createForClass(Answer);

// Indexes
AnswerSchema.index({ questionId: 1 });
```

### 4. Quiz Template Schema

```typescript
// quizzes/schemas/quiz-template.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class QuizTemplate extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ required: true })
  categoryId: number;

  @Prop({ default: 'active', enum: ['active', 'draft', 'archived'] })
  status: string;

  @Prop({ required: true, enum: ['easy', 'medium', 'hard'] })
  difficulty: string;

  @Prop({ required: true, min: 1 })
  durationMinutes: number;

  @Prop({ default: 0 }) // 0 = unlimited
  maxAttempts: number;

  @Prop({ default: false })
  shuffleQuestions: boolean;

  @Prop({ default: false })
  revealAnswersAfterSubmission: boolean;

  @Prop({ default: 0, min: 0, max: 100 })
  passingScore: number;

  @Prop()
  description?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Object, required: true })
  questionSelection: {
    mode: 'manual' | 'random';
    manualQuestionIds?: number[];
    sourceTopics?: string[];
    randomCounts?: {
      easy: number;
      medium: number;
      hard: number;
    };
  };

  @Prop({ default: 0 })
  totalAttempts: number; // Counter cho analytics

  @Prop({ default: 0 })
  averageScore: number; // Cập nhật mỗi khi có submission
}

export const QuizTemplateSchema = SchemaFactory.createForClass(QuizTemplate);

// Indexes
QuizTemplateSchema.index({ categoryId: 1, status: 1 });
QuizTemplateSchema.index({ slug: 1 });
QuizTemplateSchema.index({ status: 1 });
```

### 5. Attempt Schema

```typescript
// attempts/schemas/attempt.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Attempt extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  templateId: number;

  @Prop({ required: true })
  startedAt: Date;

  @Prop()
  submittedAt?: Date;

  @Prop({ default: 'in-progress', enum: ['in-progress', 'completed', 'expired'] })
  status: string;

  @Prop({ type: [Object] })
  questions: {
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
  }[];

  @Prop({ type: Object })
  userAnswers?: Record<string, any>;

  @Prop()
  totalScore?: number;

  @Prop()
  percentage?: number;

  @Prop()
  passed?: boolean;

  @Prop()
  timeSpentSeconds?: number; // Thời gian thực tế làm bài
}

export const AttemptSchema = SchemaFactory.createForClass(Attempt);

// Indexes
AttemptSchema.index({ userId: 1, templateId: 1 });
AttemptSchema.index({ status: 1 });
AttemptSchema.index({ createdAt: -1 });
```

### 6. Category Schema

```typescript
// categories/schemas/category.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Category extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop()
  parentId?: number; // Null = root category

  @Prop({ default: '📁' })
  icon: string;

  @Prop()
  description?: string;

  @Prop({ default: 1 })
  displayOrder: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Indexes
CategorySchema.index({ parentId: 1 });
CategorySchema.index({ slug: 1 });
```

### 7. Bookmark Schema

```typescript
// bookmarks/schemas/bookmark.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Bookmark extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  quizId: number;
}

export const BookmarkSchema = SchemaFactory.createForClass(Bookmark);

// Indexes
BookmarkSchema.index({ userId: 1, quizId: 1 }, { unique: true });
```

### 8. Watchlist Schema

```typescript
// bookmarks/schemas/watchlist.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Watchlist extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  quizId: number;
}

export const WatchlistSchema = SchemaFactory.createForClass(Watchlist);

// Indexes
WatchlistSchema.index({ userId: 1, quizId: 1 }, { unique: true });
```

---

## IV. ROADMAP TRIỂN KHAI (8 TUẦN)

### **WEEK 1: Setup & Infrastructure** ⚙️

**Mục tiêu:** Khởi tạo project và cấu hình cơ bản

#### Tasks:
- [ ] Setup NestJS project với TypeScript
- [ ] Configure MongoDB connection (local/Atlas)
- [ ] Setup Mongoose schemas cơ bản
- [ ] Configure JWT authentication
- [ ] Setup environment variables (.env)
- [ ] Create basic error handling & logging
- [ ] Setup Git repository
- [ ] Configure ESLint & Prettier

#### Commands:
```bash
# Install NestJS CLI
npm i -g @nestjs/cli

# Create new project
nest new quizzify-backend
cd quizzify-backend

# Install dependencies
npm i @nestjs/mongoose mongoose
npm i @nestjs/jwt @nestjs/passport passport passport-jwt
npm i @nestjs/config
npm i bcrypt class-validator class-transformer
npm i --save-dev @types/bcrypt @types/passport-jwt

# Start development
npm run start:dev
```

#### Deliverables:
- ✅ Project structure đầy đủ
- ✅ MongoDB connection thành công
- ✅ Environment config hoạt động
- ✅ Health check endpoint: `GET /health`

---

### **WEEK 2: Auth Module** 🔐

**Mục tiêu:** Xây dựng hệ thống authentication hoàn chỉnh

#### Tasks:
- [ ] User registration với validation
- [ ] Login with JWT token
- [ ] Password hashing (bcrypt)
- [ ] JWT strategy & guards
- [ ] Refresh token mechanism
- [ ] Session management
- [ ] Email validation
- [ ] Username uniqueness check

#### Endpoints:
```
POST   /auth/register        # Đăng ký
POST   /auth/login           # Đăng nhập
POST   /auth/refresh         # Refresh token
POST   /auth/logout          # Đăng xuất
GET    /auth/me              # Lấy thông tin user hiện tại
POST   /auth/change-password # Đổi mật khẩu
```

#### Validation Rules:
- Username: 3-20 ký tự, chỉ chữ cái, số, underscore
- Email: Format chuẩn
- Password: Tối thiểu 6 ký tự
- Name: Không để trống

#### Deliverables:
- ✅ Auth endpoints đầy đủ
- ✅ JWT token generation & validation
- ✅ Password hashing secure
- ✅ Unit tests cho AuthService

---

### **WEEK 3: User & Profile Module** 👤

**Mục tiêu:** Quản lý thông tin người dùng

#### Tasks:
- [ ] User CRUD operations
- [ ] Profile update
- [ ] Avatar upload (Cloudinary/S3)
- [ ] User attempt history
- [ ] Roles & permissions (Admin/Teacher/Student)
- [ ] User statistics

#### Endpoints:
```
GET    /users/profile           # Xem profile của mình
PUT    /users/profile           # Cập nhật profile
POST   /users/avatar            # Upload avatar
GET    /users/attempts          # Lịch sử làm bài
GET    /users/stats             # Thống kê cá nhân
GET    /users (Admin)           # Danh sách users
GET    /users/:id (Admin)       # Chi tiết user
DELETE /users/:id (Admin)       # Xóa user
PUT    /users/:id/role (Admin)  # Đổi role
```

#### Deliverables:
- ✅ Profile management đầy đủ
- ✅ Role-based access control
- ✅ Avatar upload integration
- ✅ User stats API

---

### **WEEK 4: Questions & Answers Module** 📝

**Mục tiêu:** Quản lý ngân hàng câu hỏi

#### Tasks:
- [ ] Question CRUD (Admin/Teacher)
- [ ] Answer options CRUD
- [ ] Question filtering (topic, difficulty, type)
- [ ] Question search (full-text)
- [ ] Bulk import from JSON
- [ ] Validation cho 9 loại câu hỏi
- [ ] Question preview

#### Endpoints:
```
GET    /questions                    # List questions với filter
GET    /questions/:id                # Chi tiết câu hỏi
POST   /questions (Admin)            # Tạo câu hỏi mới
PUT    /questions/:id (Admin)        # Cập nhật câu hỏi
DELETE /questions/:id (Admin)        # Xóa câu hỏi
POST   /questions/import (Admin)     # Import từ JSON
GET    /questions/search?q=          # Tìm kiếm
GET    /questions/topics             # Danh sách topics
GET    /questions/stats              # Thống kê câu hỏi

# Answer options
GET    /questions/:id/answers        # Lấy options của câu hỏi
POST   /questions/:id/answers        # Thêm option
PUT    /answers/:id                  # Sửa option
DELETE /answers/:id                  # Xóa option
```

#### Query Params:
```typescript
{
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  type?: string;
  page?: number;
  limit?: number;
  sort?: 'createdAt' | 'points' | 'difficulty';
}
```

#### Deliverables:
- ✅ Question CRUD hoàn chỉnh
- ✅ Validation cho 9 loại câu hỏi
- ✅ Import script từ JSON
- ✅ Search & filter tốt

---

### **WEEK 5: Quiz Templates & Categories** 📚

**Mục tiêu:** Quản lý quiz templates và categories

#### Tasks:
- [ ] Quiz template CRUD
- [ ] Category hierarchy (parent/child)
- [ ] Quiz by category
- [ ] Quiz search & filter
- [ ] Question selection logic (manual/random)
- [ ] Quiz statistics
- [ ] Popular quizzes

#### Endpoints:
```
# Categories
GET    /categories                    # Danh sách categories
GET    /categories/:id                # Chi tiết category
GET    /categories/:id/quizzes        # Quizzes trong category
POST   /categories (Admin)            # Tạo category
PUT    /categories/:id (Admin)        # Cập nhật category
DELETE /categories/:id (Admin)        # Xóa category

# Quizzes
GET    /quizzes                       # List quizzes với filter
GET    /quizzes/:id                   # Chi tiết quiz
GET    /quizzes/slug/:slug            # Get by slug
POST   /quizzes (Admin)               # Tạo quiz
PUT    /quizzes/:id (Admin)           # Cập nhật quiz
DELETE /quizzes/:id (Admin)           # Xóa quiz
GET    /quizzes/popular               # Quiz phổ biến
GET    /quizzes/:id/stats             # Thống kê quiz
```

#### Quiz Selection Modes:
1. **Manual**: Chọn danh sách questionIds cụ thể
2. **Random**: Random theo topic + difficulty counts

#### Deliverables:
- ✅ Quiz template CRUD
- ✅ Category hierarchy
- ✅ Question selection logic
- ✅ Quiz statistics

---

### **WEEK 6: Attempts & Scoring Engine** 🎯

**Mục tiêu:** Xử lý quiz attempts và chấm điểm

#### Tasks:
- [ ] Start quiz attempt (create + load questions)
- [ ] Validate max attempts
- [ ] Save in-progress answers
- [ ] Submit answers
- [ ] Scoring service cho 9 loại câu hỏi
- [ ] Calculate total score & percentage
- [ ] Save attempt results
- [ ] Check passing score

#### Endpoints:
```
POST   /quizzes/:id/start           # Bắt đầu làm bài
GET    /attempts/:id                 # Xem attempt hiện tại
PATCH  /attempts/:id/save            # Lưu tạm answers (auto-save)
POST   /attempts/:id/submit          # Nộp bài
GET    /attempts/:id/result          # Xem kết quả
GET    /attempts/my-attempts         # Lịch sử của tôi
GET    /attempts/:id/review          # Xem lại bài làm
```

#### Scoring Strategies:
```typescript
// scoring/strategies/
- single-choice.scorer.ts    # 100% nếu đúng
- multi-choice.scorer.ts     # Partial credit
- true-false.scorer.ts       # 100% hoặc 0%
- ordering.scorer.ts         # Position-based scoring
- matching.scorer.ts         # Per-pair scoring
- fill-blank.scorer.ts       # Exact/case-insensitive match
- image-choice.scorer.ts     # Như single/multi choice
- numeric.scorer.ts          # Tolerance-based
- cloze-test.scorer.ts       # Per-blank scoring
```

#### Business Logic:
1. **Start Attempt:**
   - Kiểm tra max attempts
   - Load questions theo template config
   - Shuffle questions nếu cần
   - Shuffle options nếu cần
   - Tạo attempt record với status "in-progress"

2. **Submit Attempt:**
   - Validate attempt belongs to user
   - Score từng câu hỏi
   - Calculate total score
   - Determine pass/fail
   - Update attempt status = "completed"
   - Update quiz stats

#### Deliverables:
- ✅ Start quiz flow hoàn chỉnh
- ✅ 9 scoring strategies
- ✅ Submit & result endpoints
- ✅ Unit tests cho scoring

---

### **WEEK 7: Bookmarks, Watchlist & Analytics** ⭐

**Mục tiêu:** Tính năng bookmark/watchlist và analytics

#### Tasks:
- [ ] Bookmark CRUD
- [ ] Watchlist CRUD
- [ ] User statistics (overview)
- [ ] Quiz popularity metrics
- [ ] Leaderboard (per quiz)
- [ ] Recent attempts
- [ ] Performance trends

#### Endpoints:
```
# Bookmarks
GET    /bookmarks                    # Danh sách bookmarks
POST   /bookmarks                    # Thêm bookmark
DELETE /bookmarks/:quizId            # Xóa bookmark
GET    /bookmarks/quizzes            # Lấy full quiz data

# Watchlist
GET    /watchlist                    # Danh sách watchlist
POST   /watchlist                    # Thêm watchlist
DELETE /watchlist/:quizId            # Xóa watchlist
GET    /watchlist/quizzes            # Lấy full quiz data

# Analytics
GET    /stats/user                   # Thống kê user
GET    /stats/quiz/:id               # Thống kê quiz
GET    /leaderboard/:quizId          # Bảng xếp hạng
GET    /stats/dashboard (Admin)      # Admin dashboard
```

#### User Stats Response:
```typescript
{
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number;
  bestScore: number;
  totalTimeSpent: number; // seconds
  quizzesTaken: number;
  passedQuizzes: number;
  recentAttempts: Attempt[];
  performanceTrend: { date: string; score: number }[];
}
```

#### Quiz Stats Response:
```typescript
{
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  averageTimeSpent: number;
  difficultyRating: number; // calculated từ scores
  topPerformers: User[];
}
```

#### Deliverables:
- ✅ Bookmark/Watchlist CRUD
- ✅ User stats dashboard
- ✅ Quiz analytics
- ✅ Leaderboard system

---

### **WEEK 8: Testing, Optimization & Deployment** 🚀

**Mục tiêu:** Testing, optimization và deploy production

#### Tasks:
- [ ] Unit tests (Jest) cho services
- [ ] E2E tests cho critical flows
- [ ] API documentation (Swagger)
- [ ] Rate limiting (Throttler)
- [ ] Caching (Redis) cho queries
- [ ] Docker setup (Dockerfile + docker-compose)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Deploy to cloud (Railway/Render/AWS)
- [ ] Monitoring setup (PM2/New Relic)
- [ ] Backup strategy

#### Testing Coverage:
```bash
# Unit Tests
- AuthService: register, login, JWT generation
- ScoringService: All 9 question types
- QuestionsService: CRUD, filtering
- AttemptsService: Start, submit, scoring

# E2E Tests
- Auth flow: Register → Login → Get Profile
- Quiz flow: Start → Save answers → Submit → View result
- Admin flow: Create quiz → Create questions → View stats
```

#### Tools & Packages:
```bash
# Documentation
npm i @nestjs/swagger swagger-ui-express

# Rate Limiting
npm i @nestjs/throttler

# Caching
npm i cache-manager cache-manager-redis-store redis

# Testing
npm i --save-dev @nestjs/testing supertest

# Monitoring
npm i @nestjs/terminus # Health checks
```

#### Docker Setup:
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["node", "dist/main"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/quizzify
    depends_on:
      - mongo
  
  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

volumes:
  mongo_data:
```

#### Swagger Documentation:
```typescript
// main.ts
const config = new DocumentBuilder()
  .setTitle('Quizzify API')
  .setDescription('API documentation for Quizzify quiz platform')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api-docs', app, document);
```

#### Deliverables:
- ✅ Test coverage > 70%
- ✅ Swagger documentation đầy đủ
- ✅ Docker setup hoạt động
- ✅ Deployed to production
- ✅ CI/CD pipeline
- ✅ Monitoring & logging

---

## V. MIGRATION STRATEGY

### Phase 1: Parallel Run (2 tuần)
```
Next.js Frontend ──→ Next.js API (JSON files) ─→ Production ✅
                 └─→ NestJS API (MongoDB)     ─→ Testing 🧪
```

**Mục tiêu:** Backend chạy song song để test không ảnh hưởng production

**Tasks:**
- Deploy NestJS backend lên staging environment
- Test tất cả endpoints với Postman/Insomnia
- Import data từ JSON sang MongoDB
- Performance testing
- Bug fixes

### Phase 2: Gradual Migration (4 tuần)

#### Week 1: Auth + Users
```typescript
// Switch frontend to call NestJS for auth
const API_URL = process.env.NEXT_PUBLIC_USE_NESTJS 
  ? 'https://api.quizzify.com' 
  : '/api';

// Update AuthContext
const login = async (username, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  // ... rest of login logic
};
```

**Rollout:**
- 10% traffic → NestJS (test users)
- Monitor errors & performance
- 50% traffic → NestJS
- 100% traffic → NestJS

#### Week 2: Questions + Quizzes
- Migrate question bank
- Update quiz creation/editing
- Test question loading

#### Week 3: Attempts + Scoring
- Migrate attempt flow
- Test scoring engine thoroughly
- Verify results accuracy

#### Week 4: Bookmarks + Analytics
- Migrate bookmarks/watchlist
- Update analytics dashboards
- Full system testing

### Phase 3: Full Cutover
```
Next.js Frontend ──→ NestJS API (MongoDB) ─→ Production ✅
                     ↓
                 Legacy APIs ─→ Deprecated ❌
```

**Tasks:**
- Remove Next.js API routes
- Update all frontend API calls
- DNS/Load balancer configuration
- Final migration announcement
- Keep old data 30 days for backup

---

## VI. ENVIRONMENT CONFIGURATION

### Development (.env.development)
```bash
# Application
NODE_ENV=development
PORT=3001
API_PREFIX=api/v1

# Database
MONGODB_URI=mongodb://localhost:27017/quizzify_dev

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=30d

# CORS
CORS_ORIGIN=http://localhost:3000

# Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TTL=3600

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10

# Logging
LOG_LEVEL=debug
```

### Production (.env.production)
```bash
NODE_ENV=production
PORT=3001
API_PREFIX=api/v1

# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/quizzify?retryWrites=true&w=majority

# JWT (Mạnh hơn cho production)
JWT_SECRET=<generate-strong-secret-64-chars>
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=<generate-strong-secret-64-chars>
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://quizzify.com,https://www.quizzify.com

# Upload
CLOUDINARY_CLOUD_NAME=prod-cloud
CLOUDINARY_API_KEY=prod-key
CLOUDINARY_API_SECRET=prod-secret

# Redis (Production)
REDIS_HOST=redis-prod.example.com
REDIS_PORT=6379
REDIS_PASSWORD=redis-password
REDIS_TTL=7200

# Rate Limiting (Stricter)
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
NEW_RELIC_LICENSE_KEY=xxx

# Logging
LOG_LEVEL=error
```

### .env.example (Template)
```bash
# Copy this to .env and fill in your values
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/quizzify
JWT_SECRET=change-this-secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

---

## VII. API RESPONSE FORMAT

### Success Response
```typescript
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Operation successful",
  "timestamp": "2025-11-27T10:00:00.000Z"
}
```

### Error Response
```typescript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email must be a valid email address"
      }
    ]
  },
  "timestamp": "2025-11-27T10:00:00.000Z"
}
```

### Paginated Response
```typescript
{
  "success": true,
  "data": [
    // Array of items
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 120,
    "totalPages": 6,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "timestamp": "2025-11-27T10:00:00.000Z"
}
```

### HTTP Status Codes
```
200 OK                    # Successful GET, PUT, PATCH
201 Created               # Successful POST
204 No Content            # Successful DELETE
400 Bad Request           # Validation errors
401 Unauthorized          # Not authenticated
403 Forbidden             # Not authorized
404 Not Found             # Resource not found
409 Conflict              # Duplicate resource
422 Unprocessable Entity  # Business logic error
429 Too Many Requests     # Rate limit exceeded
500 Internal Server Error # Server error
```

---

## VIII. AUTHENTICATION FLOW

### Registration Flow
```
Client                    Backend
  |                          |
  |-- POST /auth/register -->|
  |    {username, email,     |
  |     password, name}      |
  |                          |
  |                          |-- Validate input
  |                          |-- Check duplicates
  |                          |-- Hash password
  |                          |-- Create user
  |                          |-- Generate JWT
  |                          |
  |<-- 201 Created -----------|
  |    {user, accessToken,   |
  |     refreshToken}        |
```

### Login Flow
```
Client                    Backend
  |                          |
  |-- POST /auth/login ----->|
  |    {username, password}  |
  |                          |
  |                          |-- Find user
  |                          |-- Verify password
  |                          |-- Generate JWT
  |                          |-- Update lastLogin
  |                          |
  |<-- 200 OK ---------------|
  |    {user, accessToken,   |
  |     refreshToken}        |
```

### Protected Request Flow
```
Client                    Backend
  |                          |
  |-- GET /users/profile --->|
  |    Authorization:        |
  |    Bearer <token>        |
  |                          |
  |                          |-- Verify JWT
  |                          |-- Extract userId
  |                          |-- Load user
  |                          |-- Check permissions
  |                          |
  |<-- 200 OK ---------------|
  |    {user data}           |
```

### Refresh Token Flow
```
Client                    Backend
  |                          |
  |-- POST /auth/refresh --->|
  |    {refreshToken}        |
  |                          |
  |                          |-- Verify refresh token
  |                          |-- Generate new access token
  |                          |
  |<-- 200 OK ---------------|
  |    {accessToken}         |
```

---

## IX. CHECKLIST HOÀN THÀNH

### Core Features ✅
- [ ] Authentication (JWT)
  - [ ] Register
  - [ ] Login
  - [ ] Logout
  - [ ] Refresh token
  - [ ] Change password
- [ ] User Management
  - [ ] Profile CRUD
  - [ ] Avatar upload
  - [ ] Role management
  - [ ] User stats
- [ ] Question Bank
  - [ ] Question CRUD
  - [ ] 9 question types support
  - [ ] Answer options CRUD
  - [ ] Search & filter
  - [ ] Import from JSON
- [ ] Quiz Templates
  - [ ] Quiz CRUD
  - [ ] Manual selection
  - [ ] Random selection
  - [ ] Category assignment
- [ ] Categories
  - [ ] Hierarchy support
  - [ ] Category CRUD
  - [ ] Quiz by category
- [ ] Quiz Attempts
  - [ ] Start quiz
  - [ ] Save in-progress
  - [ ] Submit quiz
  - [ ] View results
  - [ ] Max attempts validation
- [ ] Scoring Engine
  - [ ] Single choice
  - [ ] Multi choice (partial credit)
  - [ ] True/False
  - [ ] Ordering
  - [ ] Matching
  - [ ] Fill blank
  - [ ] Image choice
  - [ ] Numeric input
  - [ ] Cloze test
- [ ] Bookmarks & Watchlist
  - [ ] Bookmark CRUD
  - [ ] Watchlist CRUD
  - [ ] Get bookmarked quizzes

### Advanced Features 🚀
- [ ] Analytics
  - [ ] User statistics
  - [ ] Quiz statistics
  - [ ] Leaderboard
  - [ ] Performance trends
- [ ] Admin Dashboard
  - [ ] User management
  - [ ] Question management
  - [ ] Quiz management
  - [ ] System stats
- [ ] Search & Filter
  - [ ] Full-text search
  - [ ] Advanced filtering
  - [ ] Sorting
  - [ ] Pagination
- [ ] Caching
  - [ ] Redis integration
  - [ ] Cache invalidation
  - [ ] Query caching
- [ ] File Upload
  - [ ] Avatar upload
  - [ ] Image questions
  - [ ] Cloudinary integration

### DevOps & Quality 🛠️
- [ ] Testing
  - [ ] Unit tests (>70% coverage)
  - [ ] E2E tests
  - [ ] Integration tests
- [ ] Documentation
  - [ ] Swagger/OpenAPI
  - [ ] README
  - [ ] API examples
- [ ] Security
  - [ ] Rate limiting
  - [ ] CORS configuration
  - [ ] Helmet middleware
  - [ ] Input validation
  - [ ] SQL injection prevention
- [ ] Monitoring
  - [ ] Health checks
  - [ ] Logging
  - [ ] Error tracking (Sentry)
  - [ ] Performance monitoring
- [ ] Deployment
  - [ ] Docker setup
  - [ ] docker-compose
  - [ ] CI/CD pipeline
  - [ ] Production deployment
  - [ ] Backup strategy

---

## X. COST ESTIMATION

### Development Phase (2 months)
| Item | Cost | Notes |
|------|------|-------|
| Developer Time | Varies | 1-2 full-stack developers |
| MongoDB Atlas (Dev) | Free | M0 Sandbox (512MB) |
| Cloudinary (Dev) | Free | 25GB storage, 25GB bandwidth |
| Redis (Local) | Free | Docker container |
| **Total Dev Cost** | **Free** | Chỉ phí nhân công |

### Production (Monthly)
| Service | Free Tier | Paid Option | Recommended |
|---------|-----------|-------------|-------------|
| **MongoDB Atlas** | M0 (512MB) | M10 (2GB): $57/mo | M10 |
| **Backend Hosting** | | | |
| - Railway | 500 hrs/mo | Pro: $20/mo | Pro Plan |
| - Render | 750 hrs/mo | Starter: $7/mo | Starter |
| - AWS EC2 | 750 hrs/mo (12mo) | t3.small: $15/mo | t3.small |
| **Redis** | | | |
| - Redis Labs | 30MB free | 1GB: $10/mo | 1GB |
| - Upstash | 10K cmds/day | Pay-as-you-go | Free tier OK |
| **Cloudinary** | 25GB | Plus: $89/mo | Free tier OK |
| **Domain** | - | $12/year | Required |
| **SSL** | Free (Let's Encrypt) | - | Free |
| **Monitoring** | | | |
| - Sentry | 5K errors/mo | Team: $26/mo | Free tier OK |
| - New Relic | - | Standard: $25/mo | Optional |

### Cost Summary
| Scenario | Monthly Cost | Yearly Cost |
|----------|-------------|-------------|
| **Minimal** (Free tiers) | $0-10 | $0-120 |
| **Startup** (Small scale) | $50-70 | $600-840 |
| **Production** (Recommended) | $90-120 | $1,080-1,440 |
| **Enterprise** (High scale) | $200-500+ | $2,400-6,000+ |

### Recommended Stack (Startup)
```
MongoDB Atlas M10:      $57/mo
Railway Pro:            $20/mo
Redis 1GB:             $10/mo
Domain:                 $1/mo
------------------------
Total:                 ~$88/mo
```

---

## XI. PERFORMANCE TARGETS

### Response Time
| Endpoint Type | Target | Max Acceptable |
|--------------|--------|----------------|
| Auth (login/register) | < 200ms | < 500ms |
| Quiz list | < 100ms | < 300ms |
| Start quiz | < 500ms | < 1000ms |
| Submit quiz | < 1000ms | < 2000ms |
| View results | < 200ms | < 500ms |

### Throughput
| Metric | Target | Notes |
|--------|--------|-------|
| Concurrent users | 1000+ | With caching |
| Requests/sec | 500+ | Peak load |
| Quiz submissions/min | 100+ | Critical path |

### Caching Strategy
```typescript
// Cache layers
1. Redis Cache
   - Quiz templates: 1 hour
   - Categories: 1 hour
   - Questions (read-only): 30 min
   - User stats: 5 min

2. MongoDB Indexes
   - users.username
   - users.email
   - questions.topic + difficulty
   - attempts.userId + templateId
   - quizTemplates.categoryId + status

3. CDN (Future)
   - Static assets
   - Images (Cloudinary CDN)
```

---

## XII. SECURITY CHECKLIST

### Authentication & Authorization
- [x] Password hashing (bcrypt, salt rounds ≥ 10)
- [x] JWT with expiration
- [x] Refresh token rotation
- [x] Role-based access control (RBAC)
- [ ] Two-factor authentication (2FA) - Future
- [ ] Password reset via email - Future
- [ ] Account lockout after failed attempts
- [ ] Session management

### Input Validation
- [x] DTOs with class-validator
- [x] Sanitize all inputs
- [x] MongoDB injection prevention
- [x] XSS prevention
- [x] SQL injection prevention (N/A for MongoDB)
- [x] File upload validation (type, size)

### API Security
- [x] CORS configuration
- [x] Helmet middleware (security headers)
- [x] Rate limiting (per IP, per user)
- [x] Request size limits
- [ ] API key for third-party integrations
- [ ] Webhook signature verification

### Data Security
- [ ] Encrypt sensitive data at rest
- [x] HTTPS only in production
- [ ] Secure cookie flags (httpOnly, secure, sameSite)
- [ ] Environment variables for secrets
- [ ] Regular security audits
- [ ] Backup encryption

### Monitoring & Logging
- [x] Log all authentication attempts
- [x] Log failed requests
- [x] Monitor suspicious activity
- [ ] Alerting for anomalies
- [ ] GDPR compliance logging

---

## XIII. SCALING STRATEGY

### Vertical Scaling (Phase 1)
```
MongoDB: M0 → M10 → M20 → M30
Backend: t3.micro → t3.small → t3.medium → t3.large
Redis: 30MB → 1GB → 5GB → 10GB
```

### Horizontal Scaling (Phase 2)
```
┌─────────────┐
│ Load Balancer│
│   (Nginx)   │
└──────┬──────┘
       │
   ┌───┴───┬───────┬───────┐
   │       │       │       │
┌──▼──┐ ┌─▼──┐ ┌─▼──┐ ┌─▼──┐
│API-1│ │API-2│ │API-3│ │API-4│
└──┬──┘ └──┬─┘ └──┬─┘ └──┬─┘
   │       │      │      │
   └───┬───┴──┬───┴──┬───┘
       │      │      │
   ┌───▼──┐ ┌▼────┐ ┌▼──────┐
   │MongoDB│ │Redis│ │Storage│
   │Cluster│ │     │ │ (S3) │
   └───────┘ └─────┘ └───────┘
```

### Database Scaling
```
# MongoDB Replica Set
Primary ──┬─→ Secondary 1 (Read)
          ├─→ Secondary 2 (Read)
          └─→ Secondary 3 (Backup)

# Sharding (Future)
Shard 1: users, attempts (0-50% data)
Shard 2: users, attempts (50-100% data)
Shard 3: questions, quizzes (all data)
```

### Caching Strategy
```
Level 1: Application cache (Memory)
Level 2: Redis cache (Distributed)
Level 3: CDN (Static assets)
Level 4: Browser cache
```

---

## XIV. MIGRATION CHECKLIST

### Pre-Migration
- [ ] Backup all JSON data files
- [ ] Export to MongoDB-compatible format
- [ ] Test import scripts
- [ ] Verify data integrity
- [ ] Create rollback plan
- [ ] Inform users (if applicable)

### Data Migration
- [ ] Import users (với password hashing)
- [ ] Import categories
- [ ] Import questions + answers
- [ ] Import quiz templates
- [ ] Import user attempts
- [ ] Import bookmarks
- [ ] Import watchlist
- [ ] Verify record counts match

### Testing
- [ ] Test authentication flow
- [ ] Test quiz creation
- [ ] Test quiz taking flow
- [ ] Test scoring accuracy
- [ ] Test bookmarks/watchlist
- [ ] Load testing
- [ ] Security testing

### Cutover
- [ ] DNS update (if new domain)
- [ ] Frontend API URL switch
- [ ] Monitor error rates
- [ ] Monitor performance
- [ ] User acceptance testing
- [ ] Archive old API

### Post-Migration
- [ ] Monitor for 7 days
- [ ] Fix any issues
- [ ] Optimize slow queries
- [ ] User feedback collection
- [ ] Documentation update
- [ ] Delete old data (after 30 days)

---

## XV. NEXT STEPS

### Immediate (This Week)
1. **Setup NestJS project**
   ```bash
   nest new quizzify-backend
   cd quizzify-backend
   npm install dependencies
   ```

2. **Configure MongoDB**
   - Setup local MongoDB hoặc MongoDB Atlas
   - Test connection
   - Create initial database

3. **Create Git repository**
   ```bash
   git init
   git remote add origin <repo-url>
   git add .
   git commit -m "Initial NestJS setup"
   git push -u origin main
   ```

### Week 1 Tasks
- [ ] Complete project setup
- [ ] Configure environment variables
- [ ] Create User schema
- [ ] Create Question schema
- [ ] Create basic health check endpoint
- [ ] Setup error handling

### Questions to Answer
1. **MongoDB hosting:** Local development hay Atlas ngay từ đầu?
2. **Repository structure:** Monorepo (frontend + backend) hay separate repos?
3. **Authentication:** JWT only hay thêm OAuth (Google, Facebook)?
4. **File upload:** Cloudinary, AWS S3, hay Azure Blob?
5. **Deployment:** Railway, Render, AWS, hay Digital Ocean?

### Recommended Priority
```
Priority 1 (MVP - 4 tuần):
- Auth + Users
- Questions
- Quizzes
- Attempts + Scoring

Priority 2 (Enhancement - 2 tuần):
- Bookmarks/Watchlist
- Analytics
- Admin features

Priority 3 (Polish - 2 tuần):
- Testing
- Documentation
- Deployment
- Optimization
```

---

## XVI. SUPPORT & RESOURCES

### Documentation
- [NestJS Docs](https://docs.nestjs.com/)
- [Mongoose Docs](https://mongoosejs.com/docs/)
- [MongoDB Manual](https://www.mongodb.com/docs/manual/)
- [JWT Best Practices](https://jwt.io/introduction)

### Learning Resources
- [NestJS Fundamentals Course](https://docs.nestjs.com/fundamentals/async-providers)
- [MongoDB University](https://university.mongodb.com/)
- [REST API Design](https://restfulapi.net/)

### Tools
- **API Testing:** Postman, Insomnia, Thunder Client (VSCode)
- **Database GUI:** MongoDB Compass, Studio 3T
- **Monitoring:** PM2, New Relic, DataDog
- **Error Tracking:** Sentry
- **Logging:** Winston, Pino

### Community
- [NestJS Discord](https://discord.gg/nestjs)
- [Stack Overflow - NestJS tag](https://stackoverflow.com/questions/tagged/nestjs)
- [Reddit - r/nestjs](https://reddit.com/r/nestjs)

---

## XVII. GLOSSARY

| Term | Definition |
|------|------------|
| **DTO** | Data Transfer Object - Đối tượng dùng để validate/transform data |
| **Schema** | Mongoose schema - Định nghĩa cấu trúc dữ liệu MongoDB |
| **Guard** | NestJS guard - Middleware kiểm tra authorization |
| **Interceptor** | NestJS interceptor - Middleware xử lý request/response |
| **Pipe** | NestJS pipe - Middleware transform/validate data |
| **Module** | NestJS module - Đơn vị tổ chức code |
| **Provider** | NestJS provider - Service có thể inject |
| **JWT** | JSON Web Token - Token để authentication |
| **RBAC** | Role-Based Access Control - Phân quyền theo role |
| **TTL** | Time To Live - Thời gian sống của cache |

---

## Kết luận

Đây là kế hoạch chi tiết để migrate từ Next.js API (JSON files) sang NestJS + MongoDB backend. Kế hoạch được chia thành 8 tuần với các mốc rõ ràng, có thể điều chỉnh tùy theo tài nguyên và ưu tiên.

**Ưu điểm của kiến trúc mới:**
- ✅ Scalable và maintainable
- ✅ Type-safe với TypeScript
- ✅ Professional architecture
- ✅ Real database với transactions
- ✅ Caching & optimization
- ✅ API documentation (Swagger)
- ✅ Testing framework

**Thời gian hoàn thành:** 8-10 tuần (1 developer full-time)

**Budget dự kiến:** $50-90/month (production), Free (development)

---

**Document Version:** 1.0  
**Last Updated:** 27/11/2025  
**Author:** AI Assistant  
**Status:** Ready for Implementation 🚀
