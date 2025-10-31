# Vector Search Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React)                           │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  app/questions/[subject]/page.tsx                           │    │
│  │  - Displays questions                                       │    │
│  │  - User clicks "Find Similar Questions"                     │    │
│  └──────────────────────────┬──────────────────────────────────┘    │
│                             │                                       │
│                             ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  components/similar-questions.tsx                           │    │
│  │  - Handles UI and state                                     │    │
│  │  - Calls API endpoint                                       │    │
│  │  - Displays results with similarity scores                  │    │
│  └──────────────────────────┬──────────────────────────────────┘    │
│                             │                                       │
│              HTTP GET /api/v1/questions/{id}/similar                │
│                             │                                       │
└─────────────────────────────┼───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          BACKEND (Next.js API)                       │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  app/api/v1/questions/[questionId]/similar/route.ts        │   │
│  │  1. Extract questionId and limit from params               │   │
│  │  2. Try vector search first (default)                       │   │
│  │  3. Fallback to graph-based if needed                       │   │
│  │  4. Return results with algorithm type                      │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                             │                                        │
│                    Convex Client Query                               │
│                             │                                        │
└─────────────────────────────┼────────────────────────────────────────┘
                              │
                              ├─ Try Vector Search ──────────────┐
                              │                                   │
                              ▼                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    CONVEX BACKEND (Database Logic)                    │
│                                                                        │
│  ┌─ convex/questions.ts ────────────────────────────────────────┐   │
│  │                                                               │   │
│  │  Query: findSimilarQuestionsWithVectors                       │   │
│  │  ┌──────────────────────────────────────────────────────┐   │   │
│  │  │ 1. Get target question by ID                         │   │   │
│  │  │ 2. Retrieve its vector_embedding (1536 dims)         │   │   │
│  │  │ 3. Get ALL questions from database                   │   │   │
│  │  │ 4. Calculate cosine similarity with each             │   │   │
│  │  │ 5. Apply subject bonus (+0.1)                        │   │   │
│  │  │ 6. Sort by similarity score (descending)             │   │   │
│  │  │ 7. Return top N results                              │   │   │
│  │  └──────────────────────────────────────────────────────┘   │   │
│  │                                                               │   │
│  │  Helper: cosineSimilarity(vectorA, vectorB)                  │   │
│  │  ┌──────────────────────────────────────────────────────┐   │   │
│  │  │ Calculates: dot(A,B) / (|A| × |B|)                  │   │   │
│  │  │ Returns: 0 to 1 (1 = identical, 0 = different)      │   │   │
│  │  └──────────────────────────────────────────────────────┘   │   │
│  │                                                               │   │
│  │  Query: getSimilarQuestions (Fallback)                       │   │
│  │  ┌──────────────────────────────────────────────────────┐   │   │
│  │  │ Uses metadata-based scoring                          │   │   │
│  │  │ - Same subtopic: +5 points                           │   │   │
│  │  │ - Same chapter: +3 points                            │   │   │
│  │  │ - Same subject: +1 point                             │   │   │
│  │  │ - Recency boost: ×1.2 (within 5 years)              │   │   │
│  │  │ - Difficulty match: ×1.1 (same marks)               │   │   │
│  │  └──────────────────────────────────────────────────────┘   │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                        │
└───────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   DATABASE (Convex/Storage)                           │
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Database Schema (convex/schema.ts)                            │ │
│  │                                                                 │ │
│  │  questions table:                                              │ │
│  │  ├── questionId (text) - indexed                              │ │
│  │  ├── question_text (text)                                     │ │
│  │  ├── subject (text) - indexed                                 │ │
│  │  ├── chapter (text)                                           │ │
│  │  ├── subtopic (text)                                          │ │
│  │  ├── year (number)                                            │ │
│  │  ├── marks (number)                                           │ │
│  │  ├── theoretical_practical (text)                             │ │
│  │  ├── correct_answer (text)                                    │ │
│  │  ├── options (array)                                          │ │
│  │  └── vector_embedding ★ (array of 1536 floats)              │ │
│  │      │                                                         │ │
│  │      ├── Vector Index: by_embedding                           │ │
│  │      │   └── vectorField: vector_embedding                    │ │
│  │      │   └── dimensions: 1536                                 │ │
│  │      └── Enables fast similarity searches                     │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                        │
└───────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
User Interaction Flow
═══════════════════════════════════════════════════════════════════════

┌──────────────────────┐
│ User Views Question  │
│ on Questions Page    │
└──────────┬───────────┘
           │
           │ Sees: "Find Similar Questions" button
           │        (with Sparkles icon)
           │
           ▼
┌──────────────────────────────────────────┐
│ User Clicks Button                       │
└──────────────┬───────────────────────────┘
               │
               │ Component State:
               │ - setExpanded(true)
               │ - setLoading(true)
               │
               ▼
┌────────────────────────────────────────────────┐
│ Frontend Calls API                             │
│ GET /api/v1/questions/{id}/similar?limit=5    │
└────────────┬─────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│ API Route Processes Request                     │
│ 1. Extract questionId from params               │
│ 2. Parse useVectors parameter (default: true)   │
│ 3. Try vector search first                      │
└────────────┬──────────────────────────────────────┘
             │
             ├─ YES: Results found? ──────┬─────────┐
             │       ▼                     │         │
             │    algorithm = "vector"     │         │
             │    return results           │         │
             │                             │         │
             │  NO or ERROR:               │         │
             │       ▼                     │         │
             │    Fallback to graph        │         │
             │    algorithm = "graph"      │         │
             │    return results           │         │
             │                             │         │
             └─────────────────────────────┴────────┐
                                                    │
                                                    ▼
                                    ┌─────────────────────────────┐
                                    │ Return JSON Response        │
                                    │ {                           │
                                    │   algorithm: "vector"|"graph"
                                    │   count: 5                  │
                                    │   data: [...]               │
                                    │ }                           │
                                    └────────────┬────────────────┘
                                                 │
                                                 ▼
                                    ┌──────────────────────────────┐
                                    │ Frontend Displays Results    │
                                    │ - Similar question cards     │
                                    │ - Similarity scores          │
                                    │ - Topic badges               │
                                    │ - Click to view/help         │
                                    └──────────────────────────────┘
```

## Vector Similarity Calculation

```
Cosine Similarity Algorithm
═══════════════════════════════════════════════════════════════════════

Question 1: "What is binary search?"
    │
    ├─ Embedding Model ──────────► Vector_1: [0.1, -0.5, 0.3, ..., 0.8]
    │                              (1536 dimensions)
    │
    ▼
Question 2: "Implement binary search in O(log n)"
    │
    ├─ Embedding Model ──────────► Vector_2: [0.12, -0.48, 0.25, ..., 0.79]
    │                              (1536 dimensions)
    │
    ▼
Cosine Similarity = dot(V1, V2) / (|V1| × |V2|)

    dot(V1, V2) = sum of (V1[i] * V2[i]) for all i
    
    |V1| = sqrt(sum of V1[i]² for all i)
    |V2| = sqrt(sum of V2[i]² for all i)

Result: 0.92 (very similar - 92% similarity)

Range:
  1.0  ────► Identical vectors (exact same meaning)
  0.8  ────► Very similar questions
  0.6  ────► Similar questions
  0.4  ────► Somewhat related
  0.2  ────► Loosely related
  0.0  ────► Completely different topics

Subject Bonus:
  If question_2.subject == question_1.subject:
    final_score = similarity + 0.1

Example:
  Base similarity: 0.85
  Same subject: YES (+0.1)
  Final score: 0.95
```

## API Response Example

```javascript
GET /api/v1/questions/q123/similar?limit=5

Response:
{
  "success": true,
  "questionId": "q123",
  "algorithm": "vector",        // ← Indicates which method was used
  "count": 5,
  "data": [
    {
      "questionId": "q456",
      "question_text": "Implement binary search algorithm...",
      "year": 2022,
      "marks": 3,
      "subject": "Data Structures",
      "chapter": "Searching",
      "subtopic": "Binary Search",
      "vector_embedding": [0.12, -0.48, 0.25, ..., 0.79],
      "similarityScore": 0.94,    // ← Cosine similarity
      "similarityReason": "Vector similarity"
    },
    {
      "questionId": "q789",
      "question_text": "What is the time complexity of binary search?...",
      "year": 2021,
      "marks": 2,
      "subject": "Data Structures",
      "similarityScore": 0.87,
      "similarityReason": "Vector similarity"
    },
    // ... 3 more results
  ]
}
```

## Error Handling & Fallback Logic

```
Vector Search Flow with Fallbacks
═══════════════════════════════════════════════════════════════════════

START: User requests similar questions
   │
   ├─ useVectors parameter = "true" (default)? 
   │  ├─ YES ─────────────────────────────────┐
   │  │                                        │
   │  │ ┌──────────────────────────────────────┴──────────┐
   │  │ │ TRY Vector Search                               │
   │  │ │                                                 │
   │  │ ├─ Question has vector_embedding? ──┐           │
   │  │ │  ├─ NO ──► Return [] (empty)      │           │
   │  │ │  │         Fallback to graph       │           │
   │  │ │  │                                 │           │
   │  │ │  └─ YES ─► Calculate similarity    │           │
   │  │ │            Any results? ────┐      │           │
   │  │ │                             │      │           │
   │  │ │ ├─ YES ───► Return results  │      │           │
   │  │ │ │           algorithm="vector"    │           │
   │  │ │ │                                 │           │
   │  │ │ └─ NO ──► Fallback to graph      │           │
   │  │ │                                 │           │
   │  │ └─ ERROR ───► CATCH block ────────┘           │
   │  │              Fallback to graph                  │
   │  │              Log warning                       │
   │  │
   │  └─ NO ─────────► Skip vector search
   │                   Go directly to graph
   │
   ├─ Graph Search (Fallback)
   │  ├─ Same subtopic? +5 pts
   │  ├─ Same chapter? +3 pts
   │  ├─ Same subject? +1 pt
   │  ├─ Within 5 years? ×1.2
   │  ├─ Same marks? ×1.1
   │  └─ Return top 5
   │     algorithm="graph"
   │
   ▼
RETURN: Results with algorithm type
```

## Performance Characteristics

```
Operation Timing
═══════════════════════════════════════════════════════════════════════

Vector Search:
  100 questions:    ~5ms
  1,000 questions:  ~50ms
  10,000 questions: ~500ms (consider HNSW at this scale)

Graph Search (Fallback):
  Always:           <1ms (instant)

Memory Usage:
  Per Question:     1536 × 8 bytes = 12.3 KB (float64)
  1,000 questions:  ~12.3 MB
  10,000 questions: ~123 MB

Complexity Analysis:
  Vector Search:    O(n × d) where n = questions, d = dimensions
  Graph Search:     O(n) simple iteration + O(n log n) sort
```

---

**Architecture Version**: 1.0
**Last Updated**: October 22, 2025
**Status**: Ready for Implementation
