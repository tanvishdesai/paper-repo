# Database Schema Update Guide

## Overview
The Convex database schema and migration script have been updated to match the new JSON data structure in the `public/data/` folder. All questions now include comprehensive metadata including options, correct answers, marks, question type, and diagram indicators.

## What Changed

### 1. Schema Updates (`convex/schema.ts`)
The following fields were changed from **optional** to **required** in the `questions` table:

- ✅ `marks` - Now required (number) - Question points/marks
- ✅ `theoretical_practical` - Now required (string) - "theoretical" or "practical"
- ✅ `provenance` - Now required (string) - Source of the question
- ✅ `confidence` - Now required (number) - Confidence score (0-1)
- ✅ `correct_answer` - Now required (string) - The correct answer
- ✅ `has_diagram` - Now required (boolean) - Whether question has a diagram
- ✅ `options` - Now required (array of strings) - Multiple choice options

### 2. Updated Files

#### Core Database Files:
- ✅ `convex/schema.ts` - Schema definition updated
- ✅ `convex/questions.ts` - Mutation arguments updated
- ✅ `scripts/migrate-to-convex.ts` - Migration script interface updated
- ✅ `types/question.ts` - TypeScript interface updated

All changes are **backwards compatible** with existing UI components.

## JSON Data Structure

Each question in the data files now follows this structure:

```json
{
  "year": 2025,
  "paper_code": "CS2",
  "question_no": "Q.1",
  "question_text": "Question text here...",
  "options": [
    "Option 1",
    "Option 2",
    "Option 3",
    "Option 4"
  ],
  "subject": "General Aptitude",
  "chapter": "General Aptitude",
  "subtopic": "OTHER: Vocabulary",
  "theoretical_practical": "practical",
  "marks": 1,
  "provenance": "GATE 2025 CS2 PDF",
  "confidence": 1.0,
  "correct_answer": "Option 1",
  "has_diagram": false
}
```

### ⚠️ Important Note: Correct Answer Format Inconsistency

There is an inconsistency in how `correct_answer` is stored across different years:

- **2023, 2025, 2026**: Uses full text (e.g., `"resolve"`, `"Hive"`, `"nearly"`)
- **2024**: Uses option letters (e.g., `"A"`, `"B"`, `"C"`, `"D"`)

Both formats are supported since the field is a string, but you may need to handle this when comparing answers in your application.

## How to Redeploy the Database

### Step 1: Clear Existing Data (Optional but Recommended)

To ensure a clean migration, you can clear existing data:

```bash
# Navigate to your project directory
cd "C:\Users\DELL\Desktop\code_playground\Paper Predictor\paper-repo"

# Clear existing questions (optional)
# This can be done through the Convex dashboard or by running a script
```

### Step 2: Push New Schema to Convex

```bash
# Push the updated schema
npx convex dev
```

Wait for Convex to confirm the schema update. You may see warnings about schema changes.

### Step 3: Run the Migration Script

```bash
# Make sure you have your environment variables set in .env.local
# Required: NEXT_PUBLIC_CONVEX_URL

# Run the migration
npx tsx scripts/migrate-to-convex.ts
```

The migration script will:
1. ✅ Read all JSON files from `public/data/`
2. ✅ Calculate statistics (subjects, chapters, subtopics)
3. ✅ Insert/update subjects with metadata
4. ✅ Insert/update chapters
5. ✅ Insert/update subtopics
6. ✅ Insert questions in batches of 100

### Step 4: Verify the Migration

After the migration completes, you should see output like:

```
✨ Migration complete!
📊 Summary:
  - Questions inserted: 15000/15000
  - Subjects: 11
  - Chapters: 50
  - Subtopics: 200

🎉 All data has been migrated to Convex successfully!
```

### Step 5: Test Your Application

```bash
# Start your development server
npm run dev
```

Visit your application and verify:
- ✅ Questions load correctly
- ✅ Filtering by marks works
- ✅ Filter by theoretical/practical works
- ✅ Options are displayed
- ✅ Correct answers are stored
- ✅ Statistics page shows correct data

## Data Statistics

Based on the current data files:

| Year | File | Approx. Questions |
|------|------|-------------------|
| 2012 | 2012-data.json | ~1,300 |
| 2014 | 2014-data.json | ~1,200 |
| 2015 | 2015-data.json | ~1,250 |
| 2016 | 2016-data.json | ~1,200 |
| 2017 | 2017-data.json | ~1,250 |
| 2018 | 2018-data.json | ~1,200 |
| 2019 | 2019-data.json | ~1,200 |
| 2020 | 2020-data.json | ~1,200 |
| 2021 | 2021-data.json | ~1,250 |
| 2022 | 2022-data.json | ~1,250 |
| 2023 | 2023-data.json | ~1,250 |
| 2024-1 | 2024-1-data.json | ~1,250 |
| 2024-2 | 2024-2-data.json | ~1,250 |
| 2025-1 | 2025-1-data.json | ~1,250 |
| 2025-2 | 2025-2-data.json | ~1,250 |

**Total: ~18,000+ questions**

## Troubleshooting

### Issue: Schema Validation Errors

If you get schema validation errors during migration:

```bash
# Clear all questions
# In Convex dashboard, go to Data > questions > Delete all
# Or use the clearAllQuestions mutation

# Then re-run migration
npx ts-node scripts/migrate-to-convex.ts
```

### Issue: Missing Required Fields

If some questions fail to insert due to missing fields:

1. Check the JSON file for the problematic question
2. Ensure all required fields are present
3. Verify the data format matches the schema

### Issue: Duplicate Questions

The migration script automatically skips duplicate questions based on `questionId`. If you need to update existing questions, you'll need to delete them first or modify the migration script.

## New Features Enabled

With the updated schema, you can now:

1. **Filter by Question Difficulty**: Filter questions by marks (1, 2, 5 marks)
2. **Practice Mode**: All questions have options for interactive practice
3. **Answer Verification**: Correct answers stored for each question
4. **Question Type Filtering**: Filter by theoretical vs practical questions
5. **Diagram Filtering**: Filter questions that have/don't have diagrams
6. **Enhanced Statistics**: View distribution by marks, question type, etc.

## API Changes

The REST API endpoints (`/api/v1/questions`) now return all fields:

```json
{
  "questionId": "2025-CS2-Q.1",
  "year": 2025,
  "paper_code": "CS2",
  "question_no": "Q.1",
  "question_text": "...",
  "options": ["...", "...", "...", "..."],
  "subject": "General Aptitude",
  "chapter": "General Aptitude",
  "subtopic": "OTHER: Vocabulary",
  "theoretical_practical": "practical",
  "marks": 1,
  "provenance": "GATE 2025 CS2 PDF",
  "confidence": 1.0,
  "correct_answer": "resolve",
  "has_diagram": false
}
```

## Next Steps

After successful migration:

1. ✅ Test all filtering functionality
2. ✅ Verify practice mode works with correct answers
3. ✅ Check statistics page displays new data
4. ✅ Test API endpoints with new fields
5. ✅ Consider adding UI for diagram-only questions filter
6. ✅ Consider normalizing the correct_answer format across all years

## Support

If you encounter any issues during migration:

1. Check the Convex dashboard for errors
2. Review the migration script output
3. Verify your `.env.local` has the correct `NEXT_PUBLIC_CONVEX_URL`
4. Ensure your Convex deployment is active

---

**Last Updated**: October 17, 2025  
**Schema Version**: 2.0  
**Total Questions**: ~18,000+

