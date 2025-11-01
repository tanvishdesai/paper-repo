# 🔄 Component Migration Guide

This guide shows how to update your existing React components and hooks to work with the new optimized Convex schema.

---

## Old vs New Schema

### Data Structure Changes

**Old Schema:**
```typescript
{
  year: number
  questionNumber: number
  questionText: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: "A" | "B" | "C" | "D"
  subject?: string
  chapter?: string
  explanation: string
}
```

**New Schema:**
```typescript
// Questions Table
{
  originalId: number
  question: string (HTML)
  explanation: string (HTML)
  year: number
  subject: string
  chapter?: string
  questionType: string
  subjectChapter: string // "Subject::Chapter"
  similarQuestionsComputed: boolean
  similarQuestionIds?: Id[]
}

// Answers Table (separate!)
{
  questionId: Id<"questions">
  originalId: number
  answer: string (HTML)
  correct: boolean
  sortOrder: number
}
```

---

## Hook Updates

### Before: `useQuestions.ts`

```typescript
// OLD CODE - Don't use this anymore
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export const useQuestions = (subject?: string, year?: number) => {
  const questions = useQuery(api.gateQuestions.getBySubject, {
    subject,
    year,
  });
  return questions;
};
```

### After: Updated Hook

```typescript
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export const useQuestions = (subject?: string, chapter?: string, year?: number, limit?: number) => {
  const questions = useQuery(api.questions.getQuestionsByFilters, {
    subject,
    chapter,
    year,
    limit: limit || 50,
  });
  return questions;
};

export const useSimilarQuestions = (questionId: string) => {
  const similar = useQuery(api.questions.getSimilarQuestions, {
    questionId,
    limit: 15,
  });
  return similar;
};

export const useQuestionWithAnswers = (questionId: string) => {
  const questionData = useQuery(api.questions.getQuestion, {
    questionId,
  });
  return questionData;
};
```

**Usage:**
```typescript
// Get questions by subject
const questions = useQuestions("Operating Systems");

// Get questions by subject and chapter
const questions = useQuestions("Operating Systems", "Memory Management");

// Get similar questions
const similar = useSimilarQuestions(questionId);

// Get question with all answers
const question = useQuestionWithAnswers(questionId);
```

---

## Component Updates

### QuestionCard Component

**Before:**
```typescript
export const QuestionCard = ({ question }: { question: typeof gateQuestions }) => {
  return (
    <div>
      <h3>{question.questionText}</h3>
      <div>
        <button>{question.optionA}</button>
        <button>{question.optionB}</button>
        <button>{question.optionC}</button>
        <button>{question.optionD}</button>
      </div>
      <p>Answer: {question.correctAnswer}</p>
      <p>{question.explanation}</p>
    </div>
  );
};
```

**After:**
```typescript
import { Doc } from "@/convex/_generated/dataModel";

export const QuestionCard = ({ 
  question, 
  answers 
}: { 
  question: Doc<"questions">;
  answers: Doc<"answers">[];
}) => {
  return (
    <div>
      <h3 dangerouslySetInnerHTML={{ __html: question.question }} />
      <div>
        {answers
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((answer) => (
            <button key={answer._id} data-correct={answer.correct}>
              <span dangerouslySetInnerHTML={{ __html: answer.answer }} />
            </button>
          ))}
      </div>
      <p dangerouslySetInnerHTML={{ __html: question.explanation }} />
    </div>
  );
};
```

### QuestionList Component

**Before:**
```typescript
export const QuestionList = ({ subject }: { subject: string }) => {
  const questions = useQuery(api.gateQuestions.getBySubject, { subject });

  return (
    <div>
      {questions?.map((q) => (
        <div key={q._id}>
          <h4>{q.questionText}</h4>
          <p>Year: {q.year}</p>
        </div>
      ))}
    </div>
  );
};
```

**After:**
```typescript
export const QuestionList = ({ 
  subject, 
  chapter 
}: { 
  subject: string;
  chapter?: string;
}) => {
  const questions = useQuery(api.questions.getQuestionsByFilters, { 
    subject,
    chapter,
    limit: 50 
  });

  return (
    <div>
      {questions?.map((q) => (
        <div key={q._id}>
          <h3 dangerouslySetInnerHTML={{ __html: q.question }} />
          <p>Year: {q.year} | Chapter: {q.chapter || "General"}</p>
        </div>
      ))}
    </div>
  );
};
```

### SimilarQuestions Component

**New Component:**
```typescript
import { useSimilarQuestions } from "@/hooks/useQuestions";
import { QuestionCard } from "./QuestionCard";

export const SimilarQuestions = ({ questionId }: { questionId: string }) => {
  const similar = useSimilarQuestions(questionId);

  if (!similar || similar.length === 0) {
    return <p>No similar questions found</p>;
  }

  return (
    <div>
      <h3>Similar Questions</h3>
      <div>
        {similar.map((question) => (
          <div key={question._id}>
            <h4 dangerouslySetInnerHTML={{ __html: question.question }} />
            <p>Year: {question.year}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## API Route Updates

### Before: `api/questions/route.ts`

```typescript
// OLD
export async function GET(req: Request) {
  const url = new URL(req.url);
  const subject = url.searchParams.get("subject");
  
  const questions = await convex.query(api.gateQuestions.getBySubject, {
    subject,
  });
  
  return Response.json(questions);
}
```

### After: Updated Routes

```typescript
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const subject = url.searchParams.get("subject");
  const chapter = url.searchParams.get("chapter");
  const year = url.searchParams.get("year");
  const limit = url.searchParams.get("limit") || "50";

  const questions = await convex.query(api.questions.getQuestionsByFilters, {
    subject: subject || undefined,
    chapter: chapter || undefined,
    year: year ? parseInt(year) : undefined,
    limit: parseInt(limit),
  });

  return Response.json(questions);
}
```

**Usage Examples:**
```bash
# Get all questions for a subject
GET /api/questions?subject=Operating Systems

# Get questions for subject + chapter
GET /api/questions?subject=Operating Systems&chapter=Memory Management

# Get questions for specific year
GET /api/questions?subject=Operating Systems&year=2020

# Combine multiple filters
GET /api/questions?subject=Operating Systems&chapter=Memory Management&year=2020&limit=10
```

---

## Database Query Examples

### Get Subject and Chapter Data

```typescript
// Get all subjects
const subjects = useQuery(api.questions.getSubjects);

// Get chapters for a subject
const chapters = useQuery(api.questions.getChaptersBySubject, {
  subject: "Operating Systems",
});

// Get available years
const years = useQuery(api.questions.getYearsBySubjectChapter, {
  subject: "Operating Systems",
  chapter: "Memory Management",
});

// Get question count
const count = useQuery(api.questions.getQuestionCount, {
  subject: "Operating Systems",
});
```

### Track User Progress

```typescript
// Track attempt
const trackAttempt = useMutation(api.questions.trackProgress);

await trackAttempt({
  userId: "user_123",
  questionId: questionId,
  attempted: true,
  correct: isAnswerCorrect,
});

// Get user progress
const progress = useQuery(api.questions.getUserProgress, {
  userId: "user_123",
  questionId: questionId,
});

// Get user stats
const stats = useQuery(api.questions.getUserStatsBySubject, {
  userId: "user_123",
  subject: "Operating Systems",
});
```

---

## Type Updates

### TypeScript Types

**Before:**
```typescript
import { Doc } from "@/convex/_generated/dataModel";

type Question = Doc<"gateQuestions">;
type QuestionWithAnswers = Question & {
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: "A" | "B" | "C" | "D";
};
```

**After:**
```typescript
import { Doc, Id } from "@/convex/_generated/dataModel";

type Question = Doc<"questions">;
type Answer = Doc<"answers">;

type QuestionWithAnswers = Question & {
  answers: Answer[];
};

type UserProgress = Doc<"userProgress">;
```

---

## Migration Checklist

- [ ] Update all `useQuery` calls to new function names
- [ ] Update component props to use new data structures
- [ ] Replace `dangerouslySetInnerHTML` usage for HTML content
- [ ] Update answer iteration (from A/B/C/D to `answers` array)
- [ ] Add answer sorting by `sortOrder`
- [ ] Update filter components to include `chapter` parameter
- [ ] Update API routes with new query names
- [ ] Test with actual data from new schema
- [ ] Update TypeScript types
- [ ] Test similar questions feature
- [ ] Test user progress tracking
- [ ] Verify performance improvements

---

## Performance Tips

1. **Use `limit` parameter** to avoid fetching too many questions
   ```typescript
   useQuery(api.questions.getQuestionsByFilters, {
     subject: "OS",
     limit: 50  // Default is 50
   })
   ```

2. **Cache similar questions** - They're automatically cached after first access
   ```typescript
   // First call: ~200ms, computes similar questions
   const similar = useSimilarQuestions(questionId);
   
   // Subsequent calls: ~50ms, returns cached
   const similar = useSimilarQuestions(questionId);
   ```

3. **Use proper indexes** - Queries automatically use indexed fields
   - Filtering by subject+chapter is fast (indexed)
   - Filtering by year is fast (indexed)
   - Full-text search available on question text

---

## Common Issues & Solutions

### Issue: "Cannot find property 'optionA' on Question"
**Solution:** Use answers array instead
```typescript
// Before: question.optionA
// After:
const optionA = answers.find(a => a.sortOrder === 0);
```

### Issue: "HTML tags showing in question text"
**Solution:** Use `dangerouslySetInnerHTML`
```typescript
<div dangerouslySetInnerHTML={{ __html: question.question }} />
```

### Issue: "Multiple answers showing as correct"
**Solution:** Filter answers by `correct` field
```typescript
const correctAnswer = answers.find(a => a.correct);
```

### Issue: "Answers out of order"
**Solution:** Sort by `sortOrder`
```typescript
answers.sort((a, b) => a.sortOrder - b.sortOrder)
```

---

## Questions?

- Check `MIGRATION_GUIDE.md` for schema details
- See `convex/questions.ts` for available functions
- Review Convex docs: https://docs.convex.dev
