# Convex Integration Guide

## Overview

The application now uses **Convex** as the database backend to store and retrieve GATE exam questions. This document explains the integration and how the page component uses the Convex data.

## Architecture

### Database Schema
**Table:** `gateQuestions`

```typescript
{
  year: number,                    // Exam year (e.g., 2025)
  questionNumber: number,          // Question number in paper
  questionText: string,            // Question content
  questionImages?: string,         // URL to question diagram
  optionA: string,                 // Option A text
  optionAImages?: string,          // URL to option A image
  optionB: string,                 // Option B text
  optionBImages?: string,          // URL to option B image
  optionC: string,                 // Option C text
  optionCImages?: string,          // URL to option C image
  optionD: string,                 // Option D text
  optionDImages?: string,          // URL to option D image
  correctAnswer: "A" | "B" | "C" | "D",  // Correct answer
  questionType: string,            // Type of question (MCQ, etc.)
  explanation: string,             // Solution/explanation
  explanationImages?: string,      // URL to explanation images
  subject?: string,                // Subject name (optional)
  chapter?: string,                // Chapter name (optional)
  subtopic?: string,               // Subtopic name (optional)
}
```

### Convex Queries (`convex/questions.ts`)

1. **`getAllQuestions()`** - Fetch all questions from the database
2. **`getQuestionsByYear(year)`** - Filter questions by exam year
3. **`getQuestionsBySubject(subject)`** - Filter by subject name
4. **`getQuestionsByChapter(chapter)`** - Filter by chapter
5. **`searchQuestions(searchText)`** - Search across questions

## Component Data Flow

### Page Component (`app/questions/[subject]/page.tsx`)

```
Page Component
    ↓
useQuestions Hook (calls Convex)
    ↓
allQuestionsFromDB (from Convex)
    ↓
Filter by subject
    ↓
useQuestionFilters Hook (applies user filters)
    ↓
filteredQuestions
    ↓
QuestionCard Component (displays each question)
```

### Hooks Breakdown

#### 1. `useQuestions` Hook
- **Purpose**: Fetch questions from Convex and filter by subject
- **Key Changes**: 
  - Uses `useQuery(api.questions.getAllQuestions)` instead of JSON files
  - Filters questions by subject name in `useMemo`
  - Extracts years, marks, and subtopics for filter options

```typescript
const allQuestionsFromDB = useQuery(api.questions.getAllQuestions);
const questions = useMemo(() => {
  if (!allQuestionsFromDB) return [];
  return allQuestionsFromDB.filter((q) =>
    q.subject?.toLowerCase() === subjectName.toLowerCase()
  );
}, [allQuestionsFromDB, subjectName]);
```

#### 2. `useQuestionFilters` Hook
- **Purpose**: Handle all filtering and sorting operations
- **Key Changes**:
  - Updated field names to match new Question type
  - Validates options using new field structure
  - Filters practice mode questions correctly

```typescript
const practiceQuestions = useMemo(() => {
  return filteredQuestions.filter(
    (q) =>
      q.optionA && q.optionB && q.optionC && q.optionD && q.correctAnswer
  );
}, [filteredQuestions]);
```

#### 3. `QuestionCard` Component
- **Purpose**: Display individual question with options
- **Key Changes**:
  - Maps individual option fields (A, B, C, D) to array format
  - Matches correct answer by letter label
  - Displays explanation and metadata
  - Shows question images if available

```typescript
const optionsArray = [
  { label: "A", text: question.optionA },
  { label: "B", text: question.optionB },
  { label: "C", text: question.optionC },
  { label: "D", text: question.optionD },
];

const correctOptionIndex = optionsArray.findIndex(
  (opt) => opt.label === question.correctAnswer
);
```

## Setup Instructions

### 1. Configure Convex Environment
Create `.env.local` with:
```
NEXT_PUBLIC_CONVEX_URL=<your-convex-url>
CONVEX_URL=<your-convex-url>
```

### 2. Deploy to Convex
```bash
npx convex deploy
```

### 3. Run Migration Script
```bash
# Clear existing data and migrate from CSVs
node migrate-data.mjs --reset
```

This will:
- Load all CSV files from `public/csvs/`
- Parse multiline quoted fields correctly
- Handle UTF-8 BOM
- Insert ~1,947 questions into Convex database

## Key Features

### ✅ Smart Field Mapping
- Handles optional fields (subject, chapter, subtopic)
- Validates required fields (options A-D, correct answer)
- Preserves images URLs for questions and explanations

### ✅ Efficient Filtering
- Client-side filtering by year, type, subtopic
- Search across question text and explanations
- Practice mode auto-filters questions with all options

### ✅ Responsive Display
- Shows question diagrams inline
- Displays explanation with formatting
- Highlights correct answers
- Shows metadata badges (year, type, subject, etc.)

## Type Definitions

### Question Type (`types/question.ts`)
```typescript
export interface Question {
  _id?: string;                    // Convex document ID
  year: number;
  questionNumber: number;
  questionText: string;
  questionImages?: string;
  optionA: string;
  optionAImages?: string;
  optionB: string;
  optionBImages?: string;
  optionC: string;
  optionCImages?: string;
  optionD: string;
  optionDImages?: string;
  correctAnswer: "A" | "B" | "C" | "D";
  questionType: string;
  explanation: string;
  explanationImages?: string;
  subject?: string;
  chapter?: string;
  subtopic?: string;
}
```

## Real-time Reactivity

Since Convex is fully reactive:
- Questions update in real-time as they're added
- Filters reactively apply to new data
- No manual refresh needed

## Performance Considerations

### Current Implementation
- Fetches **all questions** on page load
- Client-side filtering and searching

### Optimization Opportunities
1. **Pagination** - Add server-side pagination for large datasets
2. **Indexed Queries** - Use Convex indexes for faster filtering
3. **Lazy Loading** - Load questions as user scrolls
4. **Caching** - Cache filtered results

## Migration Notes

### From Old System to Convex
- **Old**: JSON files + Neo4j fallback
- **New**: Convex database with real-time sync
- **Benefits**: Single source of truth, real-time updates, better scalability

### Data Mapping
| Old Field | New Field | Notes |
|-----------|-----------|-------|
| `question_text` | `questionText` | Renamed |
| `question_no` | `questionNumber` | Renamed & type changed |
| `options` (array) | `optionA, optionB, optionC, optionD` | Split into individual fields |
| `correct_answer` | `correctAnswer` | Renamed |
| `marks` | *(removed)* | Not available in new data |
| `theoretical_practical` | `questionType` | Renamed |

## Testing

### Test the Integration
1. Start dev server: `npm run dev`
2. Navigate to any subject page: `http://localhost:3000/questions/algorithms`
3. Verify questions load from Convex
4. Test filters: year, type, subtopic
5. Test search functionality
6. Test practice mode

### Debug Tips
- Check browser console for Convex sync errors
- Verify migration completed: `node migrate-data.mjs --reset`
- Confirm `.env.local` has correct Convex URL
- Check Convex dashboard for data insertion

## Future Enhancements

- [ ] Add bookmarking feature (save favorite questions)
- [ ] User progress tracking (marked as attempted, correct/incorrect)
- [ ] Difficulty rating system
- [ ] Collaborative notes on questions
- [ ] Spaced repetition algorithm for practice
- [ ] Analytics dashboard (topic-wise performance)

---

**Last Updated:** October 2025
**Status:** ✅ Production Ready
