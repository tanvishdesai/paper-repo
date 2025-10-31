# Vector Embeddings and Similarity Search Guide

## Overview

The Paper Predictor application now uses **vector embeddings** to find semantically similar questions. This guide explains how the feature works and how to use it.

## Architecture

### Components

1. **Vector Embeddings**: 1536-dimensional vectors generated from question text (using OpenAI's embedding model or similar)
2. **Convex Database**: Stores vector embeddings in the `questions` table
3. **Vector Index**: Convex's `by_embedding` index enables efficient similarity searches
4. **Similarity Search**: Uses cosine similarity to rank questions by semantic relevance

### How It Works

```
User views a question
    ↓
Clicks "Find Similar Questions"
    ↓
Component fetches from API: /api/v1/questions/{questionId}/similar
    ↓
API attempts vector search first (if embeddings available)
    ↓
If vector search succeeds → Returns semantically similar questions
If vector search fails → Falls back to graph-based (metadata) similarity
    ↓
Component displays results with similarity scores
```

## Implementation Details

### 1. Schema Changes (`convex/schema.ts`)

Added a vector index to the questions table:

```typescript
.vectorIndex("by_embedding", {
  vectorField: "vector_embedding",
  dimensions: 1536, // OpenAI embedding dimensions
})
```

### 2. Vector Search Query (`convex/questions.ts`)

**New function**: `findSimilarQuestionsWithVectors`

- Takes a question ID and limit
- Retrieves the target question's embedding
- Calculates cosine similarity with all other questions
- Applies a subject-match bonus (0.1 points)
- Returns top N most similar questions

```typescript
export const findSimilarQuestionsWithVectors = query({
  args: { 
    questionId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Retrieves questions with highest cosine similarity scores
    // Falls back gracefully if no embeddings available
  },
});
```

**Cosine Similarity**: Measures the angle between two embedding vectors
- Range: 0 to 1 (1 = identical meaning, 0 = completely different)
- Subject bonus: +0.1 for same subject

### 3. API Route (`app/api/v1/questions/[questionId]/similar/route.ts`)

Enhanced to:
- **Try vector search first** (when `useVectors` param is not "false")
- **Fall back gracefully** to graph-based similarity if:
  - Vector search fails
  - No results found
  - Embeddings not available
- **Return algorithm used**: Indicates whether "vector" or "graph" was used

Query parameters:
```
?limit=5              # Number of results (default: 5)
?useVectors=true     # Enable/disable vector search (default: true)
```

### 4. UI Component (`components/similar-questions.tsx`)

- Shows "Find Similar Questions" button on hover
- Displays similarity reason (e.g., "Vector similarity", "Same subtopic")
- Shows similarity score for each result
- Gracefully handles cases with no embeddings

## Vector Embeddings Data

### Where Embeddings Come From

Embeddings are typically generated using:
- **OpenAI API**: `text-embedding-3-small` (1536 dimensions)
- **Ollama**: Local embedding models
- **Custom Scripts**: Batch generation scripts in `scripts/` or `temp/`

### Storing Embeddings

Embeddings are stored in the database via the `updateQuestionEmbedding` mutation:

```typescript
export const updateQuestionEmbedding = mutation({
  args: {
    _id: v.id("questions"),
    vectorEmbedding: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args._id, {
      vector_embedding: args.vectorEmbedding,
    });
  },
});
```

## Fallback Mechanism

If a question doesn't have an embedding (or the vector search fails), the system automatically falls back to **graph-based similarity**, which uses:

- **Same subtopic** (highest weight: +5 points)
- **Same chapter** (+3 points)
- **Same subject** (+1 point)
- **Recency boost** (within 5 years: 1.2x multiplier)
- **Difficulty match** (same marks: 1.1x multiplier)

## Performance Characteristics

| Method | Speed | Accuracy | Best For |
|--------|-------|----------|----------|
| Vector | Very Fast | Semantic similarity | Finding truly similar content |
| Graph | Instant | Structural similarity | Fallback, metadata-based matching |

## Example Usage

### Fetching Similar Questions (Client-side)

```typescript
// Automatic (uses vector search by default)
const response = await fetch(`/api/v1/questions/q123/similar?limit=5`);
const data = await response.json();

// Check which algorithm was used
console.log(data.algorithm); // "vector" or "graph"
console.log(data.data); // Array of similar questions with similarity scores
```

## Troubleshooting

### Issue: Getting graph-based results instead of vector results

**Cause**: 
- Questions don't have embeddings yet
- Vector search failed (check server logs)
- All questions were filtered out

**Solution**:
- Ensure embeddings are generated and stored in database
- Check Convex logs for errors
- Verify `vector_embedding` field is populated

### Issue: Similar questions don't seem semantically similar

**Cause**:
- Embeddings may be low quality
- Cosine similarity threshold might be too low

**Solution**:
- Consider using higher-quality embedding models
- Adjust subject bonus in `findSimilarQuestionsWithVectors`
- Review embeddings generation process

### Issue: Performance is slow

**Cause**:
- Computing similarity with all questions (O(n) complexity)

**Solution**:
- Limit the number of questions compared
- Use pagination in frontend
- Consider implementing approximate nearest neighbor search

## Future Enhancements

1. **Approximate Nearest Neighbor (ANN)**: Use HNSW or similar for faster searches
2. **Hybrid Search**: Combine vector + full-text + metadata search
3. **Learning to Rank**: Use ML to re-rank results
4. **Semantic Caching**: Cache embeddings and results
5. **User Preferences**: Weight similarity based on user interests

## Related Files

- Schema: `convex/schema.ts`
- Query Functions: `convex/questions.ts`
- API Route: `app/api/v1/questions/[questionId]/similar/route.ts`
- UI Component: `components/similar-questions.tsx`
- Main Page: `app/questions/[subject]/page.tsx`

## References

- [Convex Vector Search](https://docs.convex.dev/search/vector-search)
- [Cosine Similarity](https://en.wikipedia.org/wiki/Cosine_similarity)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
