# 🚀 Quick Start: Database Migration Setup

## Prerequisites ✅

Before running the migration, ensure you have:

1. **Convex CLI** installed
   ```bash
   npm install -g convex
   ```

2. **Environment Variable Set**
   ```bash
   # Get your Convex URL from https://dashboard.convex.dev
   # Add to .env.local
   NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
   ```

3. **Node.js and npm** installed
   ```bash
   node --version  # Should be v16+
   npm --version
   ```

---

## Migration Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Verify Convex Setup
```bash
# This will sync your schema with Convex backend
npx convex dev
```
**Note**: The dev server will start. Let it run in the background or a separate terminal.

### Step 3: Run Migration Script

In a new terminal (while `npx convex dev` is running):

```bash
# Windows PowerShell
node migrate-data.mjs

# Or with explicit env
$env:NEXT_PUBLIC_CONVEX_URL = "https://your-deployment.convex.cloud"
node migrate-data.mjs
```

### Step 4: Monitor Progress

The script will output real-time progress:

```
🚀 Starting data migration...
📂 Looking for JSON files in: ./public/jsons raw_cleaned

📋 Found 45 JSON files to import

📥 Processing: gate-cs-2025-set-1.json
   Found 65 questions in gate-cs-2025-set-1.json
   ✓ Processed 50 questions...
   ✓ Processed 100 questions...
   ✓ Completed gate-cs-2025-set-1.json: 65 questions

...

✅ Migration Summary:
   Total questions imported: 7000+
   Total answers imported: 28000+
   Total errors: 0

📊 Starting to pre-compute similar questions...
✓ Pre-computation complete:
   Total questions: 7000+
   Processed: 7000+
   Skipped: 0

🎉 Migration completed!
```

**⏱️ Expected Duration**: 5-15 minutes depending on internet speed

---

## Verification ✓

### Method 1: Using Convex CLI

```bash
# List all functions
npx convex run questions:getSubjects

# Get total question count
npx convex run questions:getQuestionCount

# Get a specific subject's data
npx convex run questions:getChaptersBySubject --args '{"subject":"Operating Systems"}'
```

### Method 2: Check Dashboard

1. Go to https://dashboard.convex.dev
2. Select your deployment
3. Go to "Data" tab
4. View tables:
   - `questions` → Should show 7000+ documents
   - `answers` → Should show 28000+ documents

### Method 3: Quick Frontend Test

```bash
# Start development server
npm run dev
```

Then navigate to:
- http://localhost:3000/explore - Browse questions
- http://localhost:3000/questions/[subject] - View subject questions

---

## Troubleshooting

### ❌ "NEXT_PUBLIC_CONVEX_URL not set"
```bash
# Windows PowerShell
$env:NEXT_PUBLIC_CONVEX_URL = "https://your-url.convex.cloud"
node migrate-data.mjs

# macOS/Linux
export NEXT_PUBLIC_CONVEX_URL="https://your-url.convex.cloud"
node migrate-data.mjs
```

### ❌ "Cannot find JSON files"
Verify directory structure:
```
project-root/
├── public/
│   └── jsons raw_cleaned/
│       ├── gate-cs-2025-set-1.json
│       ├── gate-cs-2025-set-2.json
│       └── ... (45+ files)
```

### ❌ "Migration hangs/times out"
- Check internet connection
- Verify Convex dev server is running
- Try stopping and restarting: `npx convex dev`
- Check Convex dashboard for any errors

### ❌ "Duplicate questions after re-run"
Clear database before re-running:

**Option A: Via Dashboard**
1. Go to https://dashboard.convex.dev
2. Select your deployment
3. Delete tables: `questions`, `answers`, `userProgress`
4. Re-run migration

**Option B: Via CLI**
```bash
# Clear before running
node migrate-data.mjs --clean
```

### ❌ "Out of memory" error
Modify migration to run in batches:
```bash
# Edit migrate-data.mjs - set smaller batchSize
# Then run
node migrate-data.mjs
```

---

## What Gets Imported

| File Type | Count | Example |
|-----------|-------|---------|
| JSON Files | 45+ | gate-cs-2025-set-1.json |
| Questions | 7,000+ | "Operating System Questions" |
| Answers | 28,000+ | "A, B, C, D options" |
| Subjects | 10+ | Operating Systems, Databases, etc. |
| Years | 30 | 1996 to 2025 |

---

## Next Steps

After successful migration:

1. **Update UI Components** to use new functions:
   ```typescript
   import { useQuery } from "convex/react";
   import { api } from "@/convex/_generated/api";
   
   const questions = useQuery(api.questions.getQuestionsByFilters, {
     subject: "Operating Systems"
   });
   ```

2. **Run Pre-computation** (already done by migration):
   - Similar questions are cached for faster lookups
   - Takes 5-10 minutes automatically

3. **Test with Sample Data**:
   ```bash
   npm run dev
   # Navigate to http://localhost:3000/explore
   ```

---

## Performance Benchmarks

After migration, expected performance:

| Operation | Reads | Time |
|-----------|-------|------|
| Get question + answers | 1 + ~4 | <50ms |
| Get similar questions (cached) | 1 + 15 | <100ms |
| Filter by subject | ~10-50 | <100ms |
| Filter by subject + chapter | ~5-20 | <50ms |
| Search by text | ~50-200 | <200ms |

---

## Support & Resources

- **Convex Docs**: https://docs.convex.dev
- **Convex Dashboard**: https://dashboard.convex.dev
- **Schema Details**: See `MIGRATION_GUIDE.md`
- **API Reference**: See `convex/questions.ts`

---

## Summary

✅ **Installation**: `npm install`
✅ **Setup**: `npx convex dev`
✅ **Migrate**: `node migrate-data.mjs`
✅ **Verify**: Check dashboard or CLI
✅ **Deploy**: `npm run build && npm run deploy`

**That's it!** Your database is now ready to use. 🎉
