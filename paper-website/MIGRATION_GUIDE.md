# 📚 Database Schema Migration Guide

## Overview

This guide documents the migration from the old flat question schema to a new optimized, normalized database design with performance-focused indexes and lazy-computed caching.

## New Schema Design

### Tables

#### 1. `questions` Table
Primary table storing question metadata with optimized indexing.

**Fields:**
- `originalId: number` - Original ID from JSON source
- `question: string` - HTML question content
- `explanation: string` - HTML explanation
- `year: number` - Exam year
- `subject: string` - e.g., "Aptitude", "Quantitative Aptitude", "Operating Systems"
- `chapter: string (optional)` - e.g., "Verbal Aptitude", "Memory Management"
- `questionType: string` - e.g., "MCQ"
- `createdOn: string` - Creation timestamp
- `updatedOn: string` - Last update timestamp
- `subjectChapter: string` - Composite key: `"Subject::Chapter"`
- `similarQuestionsComputed: boolean` - Flag for cached state
- `similarQuestionIds: array<id> (optional)` - Cached similar question IDs

**Indexes:**
- `by_year` - Fast year-based queries
- `by_subject_chapter` - Primary index for similar questions lookup
- `by_subject` - Filter by subject with chapter grouping
- `by_original_id` - Migration lookups
- `search_content` - Full-text search on question text

#### 2. `answers` Table
Normalized answer storage with efficient lookups.

**Fields:**
- `questionId: id("questions")` - Foreign key to questions
- `originalId: number` - Original ID from JSON
- `answer: string` - HTML answer content
- `correct: boolean` - Whether this is the correct answer
- `sortOrder: number` - Display order (0-3 typically)

**Indexes:**
- `by_question` - Get all answers for a question, pre-sorted
- `by_correct` - Quick lookup of correct answer

#### 3. `userProgress` Table
Optional table for tracking user attempts and performance.

**Fields:**
- `userId: string` - Auth user ID
- `questionId: id("questions")` - Reference to question
- `attempted: boolean` - Whether user attempted
- `correct: boolean` - Whether answer was correct
- `attemptedAt: number` - Timestamp of attempt

**Indexes:**
- `by_user` - Get all attempts for a user
- `by_user_subject` - Get stats per subject per user

## Performance Optimizations

### 1. Composite Index Strategy
```typescript
subjectChapter: "Aptitude::Verbal Aptitude"
```
Combines subject and chapter into single field for efficient grouping and searching.

### 2. Lazy Computation with Caching
Similar questions are computed on first access and cached:
- First request: ~50-200 reads (depends on questions in topic)
- Subsequent requests: ~16 reads (1 question + 15 cached similar)

### 3. Normalized Answers Table
Answers are stored separately with foreign keys:
- Avoids document size bloat
- Enables efficient sorting and filtering
- Supports future features (image uploads, media)

## Migration Steps

### Prerequisites
1. Have Convex CLI installed: `npm install -g convex`
2. Set environment variable: `NEXT_PUBLIC_CONVEX_URL`
3. All JSON data files in `public/jsons raw_cleaned/`

### Step 1: Update Schema
The new schema has been applied to `convex/schema.ts`. It includes:
- Renamed table: `gateQuestions` → `questions`
- New normalized `answers` table
- Optional `userProgress` table
- Optimized indexes

### Step 2: Prepare Data
All 45+ JSON files are located in:
```
public/jsons raw_cleaned/
├── gate-cs-2025-set-1.json
├── gate-cs-2025-set-2.json
├── gate-cse-2024-set-2.json
├── gate-da-2025.json
└── ... (40+ more files)
```

### Step 3: Run Migration Script
```bash
# Install dependencies
npm install

# Set environment variable
export NEXT_PUBLIC_CONVEX_URL="https://your-deployment.convex.cloud"

# Run migration
node migrate-data.mjs
```

**Expected Output:**
```
🚀 Starting data migration...
📂 Looking for JSON files in: ./public/jsons raw_cleaned

📋 Found 45 JSON files to import

📥 Processing: gate-cs-2025-set-1.json
   Found 65 questions in gate-cs-2025-set-1.json
   ✓ Processed 50 questions...
   ✓ Completed gate-cs-2025-set-1.json: 65 questions

...

✅ Migration Summary:
   Total questions imported: ~7000+
   Total answers imported: ~28000+
   Total errors: 0

📊 Starting to pre-compute similar questions...
✓ Pre-computation complete:
   Total questions: 7000+
   Processed: 7000+
   Skipped: 0

🎉 Migration completed!
```

### Step 4: Verify Data
```bash
# Check question count
npx convex run questions:getQuestionCount

# Check subjects
npx convex run questions:getSubjects

# Get sample question with similar
npx convex run questions:getQuestion --args '{"questionId":"<convex-id>"}'
npx convex run questions:getSimilarQuestions --args '{"questionId":"<convex-id>"}'
```

## API Functions Reference

### Queries (Read-only)

#### `getQuestion(questionId: id)`
Get a question with all its answers
```typescript
const result = await convex.query("questions:getQuestion", {
  questionId: "question_id_here"
});
// Returns: { question, answers[] }
```

#### `getSimilarQuestions(questionId: id, limit?: number)`
Get similar questions by subject/chapter with lazy caching
```typescript
const similar = await convex.query("questions:getSimilarQuestions", {
  questionId: "question_id_here",
  limit: 15 // optional, default 15
});
```

#### `getQuestionsByFilters(subject?, chapter?, year?, limit?)`
Filter questions by multiple criteria
```typescript
const questions = await convex.query("questions:getQuestionsByFilters", {
  subject: "Operating Systems",
  chapter: "Memory Management",
  year: 2020,
  limit: 50
});
```

#### `getSubjects()`
Get all unique subjects
```typescript
const subjects = await convex.query("questions:getSubjects");
```

#### `getChaptersBySubject(subject: string)`
Get chapters for a subject
```typescript
const chapters = await convex.query("questions:getChaptersBySubject", {
  subject: "Operating Systems"
});
```

#### `getYearsBySubjectChapter(subject: string, chapter?: string)`
Get available years for filtering
```typescript
const years = await convex.query("questions:getYearsBySubjectChapter", {
  subject: "Operating Systems",
  chapter: "Memory Management" // optional
});
```

#### `getQuestionCount(subject?, chapter?, year?)`
Get question count with optional filters
```typescript
const count = await convex.query("questions:getQuestionCount", {
  subject: "Operating Systems"
});
```

### Mutations (Write operations)

#### `trackProgress(userId: string, questionId: id, attempted: boolean, correct: boolean)`
Track user attempts
```typescript
await convex.mutation("questions:trackProgress", {
  userId: "user_123",
  questionId: "question_id",
  attempted: true,
  correct: true
});
```

#### `getUserProgress(userId: string, questionId: id)`
Get user's attempt history
```typescript
const progress = await convex.query("questions:getUserProgress", {
  userId: "user_123",
  questionId: "question_id"
});
```

#### `precomputeAllSimilarQuestions()`
Pre-compute all similar questions (run once after migration)
```typescript
const result = await convex.mutation(
  "questions:precomputeAllSimilarQuestions"
);
// Returns: { totalQuestions, processedCount, skippedCount }
```

## Troubleshooting

### Migration Hangs
- Check network connection to Convex
- Verify `NEXT_PUBLIC_CONVEX_URL` is set correctly
- Try with smaller batch of files first

### Questions Not Appearing
1. Verify schema updated: `npx convex dev`
2. Check migration completed successfully
3. Verify data in dashboard at https://dashboard.convex.dev

### Duplicate Questions
If re-running migration, either:
1. Clear database first (use Convex dashboard or reset script)
2. Or modify migration script to check for existing questions

### Memory Issues
The migration processes ~7000+ questions sequentially. If running on limited resources:
1. Run migration in smaller batches
2. Increase timeout settings in convex.json
3. Use staging environment first

## Data Statistics

After successful migration, expect:

| Metric | Expected Value |
|--------|-----------------|
| Total Questions | 7,000+ |
| Total Answers | 28,000+ |
| Subjects | 10+ |
| Years Covered | 1996-2025 |
| Average Chapter/Subject | 5-10 |
| Avg Answers per Question | 4 |

## Future Enhancements

1. **Media Support** - Images in questions/answers
2. **Question Difficulty** - Compute from stats
3. **Tag System** - Additional categorization
4. **Analytics** - Track difficulty/pass rates
5. **Suggestions** - ML-based similar question ranking

## Questions or Issues?

Refer to:
- Convex Documentation: https://docs.convex.dev
- Schema Reference: `convex/schema.ts`
- Functions Reference: `convex/questions.ts`
- Migration Script: `migrate-data.mjs`
