# Migration Guide: Neo4j to Convex

This guide explains the migration from Neo4j graph database to Convex for the Paper Predictor project.

## Overview

The project has been migrated from Neo4j to Convex for several reasons:
- **Simpler Architecture**: Convex provides a simpler, more integrated solution for Next.js applications
- **Better Developer Experience**: No need to manage a separate database server
- **Built-in Real-time**: Convex has built-in real-time capabilities
- **Type Safety**: Better TypeScript integration
- **Cost Effective**: No need for separate database hosting

## What Changed

### 1. Database Schema

The Neo4j graph structure has been flattened into Convex tables:

**Before (Neo4j)**:
- Nodes: Question, Subject, Chapter, Subtopic, Paper, Option
- Relationships: HAS_SUBJECT, BELONGS_TO_CHAPTER, HAS_SUBTOPIC, etc.

**After (Convex)**:
```typescript
- questions: Main table storing all question data with indexed fields
- subjects: Subject metadata with question counts
- chapters: Chapter information linked to subjects
- subtopics: Subtopic details linked to chapters and subjects
```

### 2. Query Changes

Neo4j's Cypher queries have been replaced with Convex queries:

**Before (Neo4j)**:
```typescript
const questions = await queries.getQuestions({ subject, year, limit });
```

**After (Convex)**:
```typescript
const result = await convex.query(api.questions.getQuestions, {
  subject,
  year,
  limit,
});
```

### 3. Similar Questions Algorithm

The graph-based similarity algorithm has been adapted:
- **Before**: Used Neo4j graph relationships and path traversal
- **After**: Uses scoring algorithm based on subject, chapter, and subtopic matching

## Migration Steps

### Step 1: Install Dependencies

```bash
npm install
```

This will install Convex and tsx (for running the migration script).

### Step 2: Set Up Convex

If you haven't already:

```bash
npx convex dev
```

This will:
1. Create a new Convex project (or link to existing)
2. Push the schema to Convex
3. Start the Convex development server

### Step 3: Run the Migration Script

The migration script reads all JSON files from `public/data` and imports them into Convex:

```bash
npm run migrate
```

The script will:
1. Read all JSON files from `public/data/`
2. Calculate statistics (subjects, chapters, subtopics)
3. Insert all metadata into Convex
4. Insert all questions into Convex (in batches)

**Expected Output**:
```
🚀 Starting migration to Convex...

📁 Found 5 JSON files in public/data
📖 Reading chunk tt.json...
  ✅ Loaded 1577 questions from chunk tt.json
...

📊 Total questions loaded: 9003

📈 Calculating statistics...
  - 11 unique subjects
  - 15 unique chapters
  - 150 unique subtopics

📚 Inserting subjects...
  ✅ Algorithms: 850 questions
  ✅ Compiler Design: 423 questions
  ...

📖 Inserting chapters...
📑 Inserting subtopics...
❓ Inserting questions...

✨ Migration complete!
```

### Step 4: Verify Migration

Check that data was imported successfully:

1. Open the Convex Dashboard: `https://dashboard.convex.dev`
2. Navigate to your project
3. Check the tables:
   - `questions` should have all your questions
   - `subjects` should have subject metadata
   - `chapters` and `subtopics` should be populated

Alternatively, test the API endpoints:

```bash
# Get stats
curl http://localhost:3000/api/v1/stats

# Get subjects
curl http://localhost:3000/api/v1/subjects \
  -H "X-API-Key: YOUR_API_KEY"

# Get questions
curl "http://localhost:3000/api/v1/questions?subject=Algorithms&limit=10" \
  -H "X-API-Key: YOUR_API_KEY"
```

## API Changes

All API endpoints remain the same, but the underlying implementation now uses Convex:

### Questions API
- `GET /api/v1/questions` - List questions with filters
- `GET /api/v1/questions/[id]/similar` - Get similar questions

### Subjects API
- `GET /api/v1/subjects` - List all subjects

### Stats API
- `GET /api/v1/stats` - Get database statistics

### Graph API
- `GET /api/v1/graph` - Get graph visualization data (simplified)
- `POST /api/v1/graph` - Get connected questions

## Removed Features

The following Neo4j-specific features have been removed or simplified:

1. **Complex Graph Queries**: Advanced graph traversal queries have been simplified
2. **Graph Visualization**: The complex graph visualization has been simplified to work with Convex data
3. **Text Search with Graph Context**: Now uses simple text filtering

## New Features

With Convex, you now have:

1. **Real-time Updates**: Convex provides built-in real-time subscriptions
2. **Better Type Safety**: Full TypeScript support for queries and mutations
3. **Simpler Deployment**: No need to manage a separate database
4. **Built-in Authentication**: Better integration with Clerk auth

## Troubleshooting

### Migration Script Fails

If the migration script fails:

1. **Check Convex Connection**:
   ```bash
   npx convex dev
   ```

2. **Clear Existing Data** (if re-running):
   ```bash
   npx convex run questions:clearAllQuestions
   npx convex run questions:clearAllMetadata
   ```

3. **Check Data Files**: Ensure all JSON files in `public/data/` are valid JSON

### API Errors

If you get API errors after migration:

1. **Verify Data**: Check that questions exist in Convex dashboard
2. **Check Environment**: Ensure `NEXT_PUBLIC_CONVEX_URL` is set
3. **Restart Dev Server**: `npm run dev`

### Missing Questions

If questions are missing:

1. Check the migration log for errors
2. Verify JSON files are complete
3. Re-run migration with cleared data

## Performance Considerations

### Indexing

The Convex schema includes indexes on:
- `questionId` - For fast lookups
- `subject` - For subject filtering
- `year` - For year filtering
- `subject_year` - For combined filtering
- Full-text search on `question_text`

### Pagination

Use `limit` and `offset` parameters for pagination:

```typescript
const result = await convex.query(api.questions.getQuestions, {
  subject: "Algorithms",
  limit: 100,
  offset: 0,
});
```

### Caching

Consider implementing caching for frequently accessed data:
- Subject lists
- Statistics
- Popular questions

## Development Workflow

### Adding New Questions

To add new questions, either:

1. **Add to JSON files** and re-run migration:
   ```bash
   npm run migrate
   ```

2. **Use Convex mutations** directly:
   ```typescript
   await convex.mutation(api.questions.insertQuestions, {
     questions: [/* your questions */]
   });
   ```

### Updating Schema

If you need to update the schema:

1. Edit `convex/schema.ts`
2. Convex will automatically detect changes
3. Re-run migration if needed

## Environment Variables

**Before (Neo4j)**:
```env
NEO4J_URI=neo4j+s://xxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=xxx
```

**After (Convex)**:
```env
NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud
# CONVEX_DEPLOYMENT is set automatically by Convex
```

**Remove** the Neo4j environment variables from your `.env` file.

## Rollback Plan

If you need to rollback to Neo4j:

1. The Neo4j implementation has been removed, but you can restore it from git history:
   ```bash
   git log --all --full-history -- lib/neo4j.ts
   git checkout <commit-hash> -- lib/neo4j.ts
   ```

2. Restore Neo4j dependency:
   ```bash
   npm install neo4j-driver@^6.0.0
   ```

3. Update API routes to use Neo4j imports again

## Support

For issues or questions:
1. Check Convex documentation: https://docs.convex.dev
2. Review migration logs
3. Open an issue in the project repository

## Summary

The migration from Neo4j to Convex simplifies the architecture while maintaining all core functionality. The data model has been adapted to work efficiently with Convex's document-based approach, and all API endpoints remain compatible with existing integrations.

