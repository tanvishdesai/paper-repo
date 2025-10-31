# Quick Redeployment Guide

## TL;DR - Fast Redeployment

```bash
# 1. Navigate to project
cd "C:\Users\DELL\Desktop\code_playground\Paper Predictor\paper-repo"

# 2. Update schema (if not already running)
npx convex dev

# 3. Run migration
npx tsx scripts/migrate-to-convex.ts

# 4. Verify
npm run dev
```

That's it! 🎉

## What This Does

1. ✅ Reads all 15 JSON files from `public/data/`
2. ✅ Creates/updates ~18,000+ questions
3. ✅ Updates subjects, chapters, and subtopics
4. ✅ Skips duplicates automatically

## Expected Output

```
🚀 Starting migration to Convex...

📁 Found 15 JSON files in public\data
📖 Reading 2012-data.json...
  ✅ Loaded 1367 questions from 2012-data.json
... (more files)

📊 Total questions loaded: 18xxx

📈 Calculating statistics...
  - 11 unique subjects
  - 50 unique chapters
  - 200+ unique subtopics

📚 Inserting subjects...
  ✅ General Aptitude: 2500 questions
  ✅ Algorithms: 1800 questions
  ... (more subjects)

📖 Inserting chapters...
  ... (chapters being inserted)

📑 Inserting subtopics...
  ✅ Inserted 200+ subtopics...

❓ Inserting questions...
  📦 Processing 180+ batches of 100 questions each
  ✅ Batch 1/180: Inserted 100 questions (Total: 100)
  ✅ Batch 2/180: Inserted 100 questions (Total: 200)
  ... (progress updates)

✨ Migration complete!
📊 Summary:
  - Questions inserted: 18xxx/18xxx
  - Subjects: 11
  - Chapters: 50+
  - Subtopics: 200+

🎉 All data has been migrated to Convex successfully!
```

## Time Estimate

- Small dataset (1-5 files): **~30 seconds**
- Full dataset (15 files): **~2-3 minutes**

## New Data Fields Available

Every question now has:

| Field | Type | Example |
|-------|------|---------|
| `options` | string[] | `["Option A", "Option B", ...]` |
| `correct_answer` | string | `"resolve"` or `"A"` |
| `marks` | number | `1`, `2`, or `5` |
| `theoretical_practical` | string | `"theoretical"` or `"practical"` |
| `has_diagram` | boolean | `true` or `false` |
| `provenance` | string | `"GATE 2025 CS2 PDF"` |
| `confidence` | number | `1.0` |

## Clearing Old Data (If Needed)

If you need to start fresh:

### Option 1: Using Convex Dashboard
1. Go to https://dashboard.convex.dev
2. Select your project
3. Go to **Data** tab
4. Click **questions** table
5. Delete all entries

### Option 2: Using Mutation (Recommended)

Create a temporary script or use Convex dashboard to run:

```javascript
// In Convex dashboard, go to Functions > questions > clearAllQuestions
// Click "Run" to clear all questions

// Or run both:
// 1. clearAllQuestions
// 2. clearAllMetadata
```

Then re-run the migration script.

## Verification Checklist

After migration, verify:

- [ ] Visit `/stats` - Should show updated statistics
- [ ] Visit `/questions/Algorithms` - Should show questions with options
- [ ] Check filters work (marks, type, year)
- [ ] Practice mode shows correct answers
- [ ] API returns all fields: `/api/v1/questions?limit=1`

## Common Issues & Fixes

### ❌ "Environment variable not set"
```bash
# Fix: Check .env.local file
# Should contain:
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### ❌ "Schema validation error"
```bash
# Fix: Clear old data and re-run
# Old data might have different structure
```

### ❌ "Duplicate key error"
```bash
# Fix: Migration automatically skips duplicates
# This is normal and safe
```

### ❌ "Cannot find module 'tsx'"
```bash
# Fix: Install tsx (should already be in package.json)
npm install
# Or use npx:
npx tsx scripts/migrate-to-convex.ts
```

## Files Changed

All schema changes are in:
- ✅ `convex/schema.ts`
- ✅ `convex/questions.ts`
- ✅ `scripts/migrate-to-convex.ts`
- ✅ `types/question.ts`

No other files need changes! The UI already handles all the new fields.

## Need Help?

Check the full guide: [DATABASE_UPDATE_GUIDE.md](./DATABASE_UPDATE_GUIDE.md)

---

**Quick Start Command:**
```bash
npx tsx scripts/migrate-to-convex.ts
```

