# Vector Search Setup Guide

## Quick Start

Your vector search feature is now ready! Here's what was implemented:

## What Changed

### 1. **Database Schema** (`convex/schema.ts`)
- Added vector index: `by_embedding` on the `vector_embedding` field
- Dimensions: 1536 (standard for OpenAI embeddings)

### 2. **Backend Logic** (`convex/questions.ts`)
- Added `cosineSimilarity()` helper function
- Added `findSimilarQuestionsWithVectors` query function
- Calculates semantic similarity between question embeddings
- Falls back gracefully if no embeddings available

### 3. **API Endpoint** (`app/api/v1/questions/[questionId]/similar/route.ts`)
- Enhanced to use vector search by default
- Automatic fallback to graph-based similarity
- Returns algorithm used in response

### 4. **Documentation**
- Created `VECTOR_SEARCH_GUIDE.md` with full technical details
- Troubleshooting guide included

## How to Use

### Step 1: Generate and Store Embeddings

You need to populate the `vector_embedding` field in your database. Use your embedding generation script:

```bash
# If you have an embedding generation script
npm run generate-embeddings

# Or manually using the mutation
# See VECTOR_SEARCH_GUIDE.md for details
```

### Step 2: Deploy to Convex

Push your schema changes:

```bash
npx convex push
```

### Step 3: Test the Feature

1. Navigate to a question page
2. Click **"Find Similar Questions"** button
3. You should see semantically similar questions listed

## How It Works

```
Question displayed on page
    ↓
User clicks "Find Similar Questions"
    ↓
Frontend calls: GET /api/v1/questions/{id}/similar?limit=5
    ↓
Backend checks if question has embedding
    ↓
YES → Vector search (semantic similarity)
NO  → Graph search (metadata-based)
    ↓
Results displayed with similarity scores
```

## Key Features

✅ **Semantic Similarity**: Uses embeddings to find truly similar questions
✅ **Graceful Fallback**: Works even without embeddings (uses graph-based)
✅ **Subject Bonus**: +0.1 to similarity score for same subject
✅ **Cosine Similarity**: Optimal metric for high-dimensional embeddings
✅ **Performance**: Fast searches across all questions

## Response Example

```json
{
  "success": true,
  "questionId": "q123",
  "algorithm": "vector",
  "count": 5,
  "data": [
    {
      "questionId": "q456",
      "question_text": "...",
      "year": 2023,
      "marks": 3,
      "subject": "Data Structures",
      "similarityScore": 0.92,
      "similarityReason": "Vector similarity"
    }
  ]
}
```

## Embedding Dimensions

- **Default**: 1536 (OpenAI text-embedding-3-small)
- **To change**: Update `dimensions` in `convex/schema.ts` and regenerate embeddings

## Troubleshooting

### Vector search not working?

1. Check if embeddings are in database:
   ```typescript
   // Query sample question
   const q = await db.query("questions").first();
   console.log(q.vector_embedding?.length); // Should be 1536
   ```

2. Check API response algorithm field - should show "vector" not "graph"

3. If showing "graph", see VECTOR_SEARCH_GUIDE.md troubleshooting section

## Next Steps

1. ✅ Schema updated with vector index
2. ✅ Convex queries added
3. ✅ API endpoint enhanced
4. 🔄 **TODO**: Generate embeddings for all questions
5. 🔄 **TODO**: Deploy to production

## Files Modified

| File | Change |
|------|--------|
| `convex/schema.ts` | Added vector index |
| `convex/questions.ts` | Added vector search query + helper |
| `app/api/v1/questions/[questionId]/similar/route.ts` | Enhanced to use vector search |
| `VECTOR_SEARCH_GUIDE.md` | Full technical documentation |
| `VECTOR_SEARCH_SETUP.md` | This file |

## Support

For detailed technical information, see:
- `VECTOR_SEARCH_GUIDE.md` - Full architecture and implementation
- `convex/questions.ts` - Query implementation
- `app/api/v1/questions/[questionId]/similar/route.ts` - API logic

## Performance Notes

- **Vector search**: O(n) - compares with all questions, but very fast
- **Graph search**: O(1) lookup + sorting - fallback is instant
- For 1000+ questions, consider implementing HNSW indexing

Ready to generate embeddings? Check your embedding generation script! 🚀
