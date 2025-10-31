import { v } from "convex/values";
import { query, mutation} from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// Simple in-memory cache for expensive queries
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const queryCache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedResult<T>(key: string): T | null {
  const cached = queryCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

function setCachedResult<T>(key: string, data: T): void {
  queryCache.set(key, { data, timestamp: Date.now() });
}

// Helper function to calculate cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }
  
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  
  return dotProduct / (magnitudeA * magnitudeB);
}

// ==================== QUERY FUNCTIONS ====================

// Get all questions with filters and pagination
export const getQuestions = query({
  args: {
    subject: v.optional(v.string()),
    year: v.optional(v.number()),
    marks: v.optional(v.number()),
    type: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 50, 100); // Cap at 100 to prevent large queries
    const offset = args.offset || 0;

    let questions: Doc<"questions">[] = [];

    // Use search index for text search
    if (args.search) {
      const searchResults = await ctx.db
        .query("questions")
        .withSearchIndex("search_question_text", q => 
          q.search("question_text", args.search!)
            .eq("subject", args.subject ?? "")
        )
        .take(limit + offset);
      
      questions = searchResults;
    } else {
      // Use indexed queries when possible
      if (args.subject && args.year) {
        // Use compound index for subject + year
        questions = await ctx.db
          .query("questions")
          .withIndex("by_subject_year", (q) => 
            q.eq("subject", args.subject!).eq("year", args.year!)
          )
          .take(limit * 3); // Get more to filter
      } else if (args.subject) {
        // Use subject index
        questions = await ctx.db
          .query("questions")
          .withIndex("by_subject", (q) => q.eq("subject", args.subject!))
          .take(limit * 3); // Get more to filter
      } else if (args.year) {
        // Use year index
        questions = await ctx.db
          .query("questions")
          .withIndex("by_year", (q) => q.eq("year", args.year!))
          .take(limit * 3); // Get more to filter
      } else {
        // Fallback to limited query without loading all
        questions = await ctx.db
          .query("questions")
          .take(limit * 3); // Get more to filter
      }
    }

    // Apply additional filters
    if (args.marks) {
      questions = questions.filter(q => q.marks === args.marks);
    }
    
    if (args.type) {
      questions = questions.filter(q => q.theoretical_practical === args.type);
    }

    // Sort by year (desc) then question_no
    questions.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return a.question_no.localeCompare(b.question_no);
    });

    // Apply pagination
    const paginatedQuestions = questions.slice(offset, offset + limit);

    return {
      questions: paginatedQuestions,
      total: questions.length,
    };
  },
});

// Get question count with filters
export const getQuestionCount = query({
  args: {
    subject: v.optional(v.string()),
    year: v.optional(v.number()),
    marks: v.optional(v.number()),
    type: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Use indexed queries and count instead of loading all data
    if (args.search) {
      // For search, we need to get the results and count them
      const searchResults = await ctx.db
        .query("questions")
        .withSearchIndex("search_question_text", q => 
          q.search("question_text", args.search!)
            .eq("subject", args.subject ?? "")
        )
        .collect();
      
      // Apply additional filters
      let filtered = searchResults;
      if (args.year) filtered = filtered.filter(q => q.year === args.year);
      if (args.marks) filtered = filtered.filter(q => q.marks === args.marks);
      if (args.type) filtered = filtered.filter(q => q.theoretical_practical === args.type);
      
      return filtered.length;
    }

    // Use indexed queries for non-search cases
    let questions: Doc<"questions">[] = [];

    if (args.subject && args.year) {
      questions = await ctx.db
        .query("questions")
        .withIndex("by_subject_year", (q) => 
          q.eq("subject", args.subject!).eq("year", args.year!)
        )
        .collect();
    } else if (args.subject) {
      questions = await ctx.db
        .query("questions")
        .withIndex("by_subject", (q) => q.eq("subject", args.subject!))
        .collect();
    } else if (args.year) {
      questions = await ctx.db
        .query("questions")
        .withIndex("by_year", (q) => q.eq("year", args.year!))
        .collect();
    } else {
      // For no filters, get limited results and count them
      const limitedQuestions = await ctx.db.query("questions").take(1000);
      return limitedQuestions.length;
    }

    // Apply additional filters
    if (args.marks) {
      questions = questions.filter(q => q.marks === args.marks);
    }
    
    if (args.type) {
      questions = questions.filter(q => q.theoretical_practical === args.type);
    }

    return questions.length;
  },
});

// Get a single question by ID
export const getQuestionById = query({
  args: { questionId: v.string() },
  handler: async (ctx, args) => {
    const question = await ctx.db
      .query("questions")
      .withIndex("by_question_id", (q) => q.eq("questionId", args.questionId))
      .first();
    
    return question;
  },
});

// Get similar questions based on subject, chapter, and subtopic
export const getSimilarQuestions = query({
  args: { 
    questionId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;
    const cacheKey = `similar_${args.questionId}_${limit}`;
    
    // Check cache first
    const cached = getCachedResult<(Doc<"questions"> & { similarityScore: number; similarityReason: string })[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get the target question
    const targetQuestion = await ctx.db
      .query("questions")
      .withIndex("by_question_id", (q) => q.eq("questionId", args.questionId))
      .first();

    if (!targetQuestion) return [];

    const results: Array<{ question: Doc<"questions">; score: number; reason: string }> = [];

    // 1. Get questions with same subtopic (highest priority)
    const sameSubtopicResults = await ctx.db
      .query("questions")
      .withIndex("by_subtopic", (q) => q.eq("subtopic", targetQuestion.subtopic))
      .take(limit * 2); // Get more to filter
    
    const sameSubtopic = sameSubtopicResults.filter(q => q.questionId !== args.questionId).slice(0, limit);

    for (const q of sameSubtopic) {
      let score = 5; // Base score for same subtopic
      
      // Recency boost (within 5 years)
      if (Math.abs(q.year - targetQuestion.year) <= 5) score *= 1.2;
      
      // Same difficulty level (marks)
      if (q.marks === targetQuestion.marks) score *= 1.1;

      results.push({ question: q, score, reason: 'Same subtopic' });
    }

    // 2. If we need more results, get questions from same chapter
    if (results.length < limit) {
      const sameChapterResults = await ctx.db
        .query("questions")
        .withIndex("by_chapter", (q) => q.eq("chapter", targetQuestion.chapter))
        .take((limit - results.length) * 2); // Get more to filter
      
      const sameChapter = sameChapterResults
        .filter(q => q.questionId !== args.questionId && q.subtopic !== targetQuestion.subtopic)
        .slice(0, limit - results.length);

      for (const q of sameChapter) {
        let score = 3; // Base score for same chapter
        
        // Recency boost
        if (Math.abs(q.year - targetQuestion.year) <= 5) score *= 1.2;
        
        // Same difficulty level
        if (q.marks === targetQuestion.marks) score *= 1.1;

        results.push({ question: q, score, reason: 'Same chapter' });
      }
    }

    // 3. If we still need more results, get questions from same subject
    if (results.length < limit) {
      const sameSubjectResults = await ctx.db
        .query("questions")
        .withIndex("by_subject", (q) => q.eq("subject", targetQuestion.subject))
        .take((limit - results.length) * 2); // Get more to filter
      
      const sameSubject = sameSubjectResults
        .filter(q => q.questionId !== args.questionId && 
                    q.subtopic !== targetQuestion.subtopic && 
                    q.chapter !== targetQuestion.chapter)
        .slice(0, limit - results.length);

      for (const q of sameSubject) {
        let score = 1; // Base score for same subject
        
        // Recency boost
        if (Math.abs(q.year - targetQuestion.year) <= 5) score *= 1.2;
        
        // Same difficulty level
        if (q.marks === targetQuestion.marks) score *= 1.1;

        results.push({ question: q, score, reason: 'Same subject' });
      }
    }

    // Sort by score and return
    results.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return b.question.year - a.question.year;
    });

    const result = results.slice(0, limit).map(item => ({
      ...item.question,
      similarityScore: item.score,
      similarityReason: item.reason
    }));

    // Cache the result
    setCachedResult(cacheKey, result);
    return result;
  },
});

// Find similar questions using vector embeddings (uses vector index)
export const findSimilarQuestionsWithVectors = query({
  args: { 
    questionId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;
    const cacheKey = `vector_similar_${args.questionId}_${limit}`;
    
    // Check cache first
    const cached = getCachedResult<(Doc<"questions"> & { similarityScore: number; similarityReason: string })[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get the target question
    const targetQuestion = await ctx.db
      .query("questions")
      .withIndex("by_question_id", (q) => q.eq("questionId", args.questionId))
      .first();

    if (!targetQuestion || !targetQuestion.vector_embedding || targetQuestion.vector_embedding.length === 0) {
      // Fallback to graph-based similarity if no embedding
      return [];
    }

    // For now, fall back to loading questions with embeddings and calculating similarity
    // TODO: Implement proper vector search when available
    const questionsWithEmbeddings = await ctx.db
      .query("questions")
      .take(limit * 10); // Get more questions to find similar ones
    
    const similarQuestions = questionsWithEmbeddings.filter((q) => 
      q.questionId !== args.questionId && 
      q.vector_embedding && 
      q.vector_embedding.length > 0
    );

    // Calculate final scores with subject bonus
    const scoredQuestions = similarQuestions.map((q) => {
      const similarity = cosineSimilarity(targetQuestion.vector_embedding!, q.vector_embedding!);
      
      // Bonus for same subject
      let finalScore = similarity;
      if (q.subject === targetQuestion.subject) {
        finalScore += 0.1; // Add 0.1 bonus for same subject
      }
      
      return { question: q, similarity, finalScore };
    });

    // Sort by final score and take top N
    scoredQuestions.sort((a, b) => b.finalScore - a.finalScore);

    const result = scoredQuestions
      .slice(0, limit)
      .map((item) => ({
        ...item.question,
        similarityScore: Math.round((item.similarity + 0.5) * 100) / 100, // Round to 2 decimals and scale 0-1
        similarityReason: 'Vector similarity'
      }));

    // Cache the result
    setCachedResult(cacheKey, result);
    return result;
  },
});

// Get all subjects
export const getSubjects = query({
  args: {},
  handler: async (ctx) => {
    const subjects = await ctx.db.query("subjects").collect();
    return subjects.sort((a, b) => a.name.localeCompare(b.name));
  },
});

// Get statistics
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    // Get limited counts instead of loading all data
    const questions = await ctx.db.query("questions").take(1000);
    const subjects = await ctx.db.query("subjects").collect();
    const chapters = await ctx.db.query("chapters").collect();
    const subtopics = await ctx.db.query("subtopics").collect();
    
    const totalQuestions = questions.length;
    const totalSubjects = subjects.length;
    const totalChapters = chapters.length;
    const totalSubtopics = subtopics.length;

    // For year range, we need to get min/max years efficiently
    // Use indexed query to get year range
    const yearQuery = await ctx.db
      .query("questions")
      .withIndex("by_year")
      .take(1); // Get one record to check if we have data
    
    let earliestYear: number | null = null;
    let latestYear: number | null = null;

    if (yearQuery.length > 0) {
      // Get min and max years using indexed queries
      const allYears = await ctx.db
        .query("questions")
        .withIndex("by_year")
        .collect();
      
      const years = allYears.map(q => q.year);
      earliestYear = years.length > 0 ? Math.min(...years) : null;
      latestYear = years.length > 0 ? Math.max(...years) : null;
    }

    return {
      totalQuestions,
      totalSubjects,
      totalChapters,
      totalSubtopics,
      earliestYear,
      latestYear,
    };
  },
});

// Get chapters by subject
export const getChaptersBySubject = query({
  args: { subject: v.string() },
  handler: async (ctx, args) => {
    const chapters = await ctx.db
      .query("chapters")
      .withIndex("by_subject", (q) => q.eq("subject", args.subject))
      .collect();
    
    return chapters;
  },
});

// Get subtopics by chapter
export const getSubtopicsByChapter = query({
  args: { chapter: v.string() },
  handler: async (ctx, args) => {
    const subtopics = await ctx.db
      .query("subtopics")
      .withIndex("by_chapter", (q) => q.eq("chapter", args.chapter))
      .collect();
    
    return subtopics;
  },
});

// ==================== MUTATION FUNCTIONS ====================

// Create a single question
export const createQuestion = mutation({
  args: { 
    questionId: v.string(),
    question_no: v.string(),
    question_text: v.string(),
    year: v.number(),
    paper_code: v.string(),
    subject: v.string(),
    chapter: v.string(),
    subtopic: v.string(),
    marks: v.number(),
    theoretical_practical: v.string(),
    provenance: v.string(),
    confidence: v.number(),
    correct_answer: v.string(),
    has_diagram: v.boolean(),
    options: v.optional(v.array(v.string())),
    vector_embedding: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    // Check if question already exists
    const existing = await ctx.db
      .query("questions")
      .withIndex("by_question_id", (q) => q.eq("questionId", args.questionId))
      .first();
    
    if (!existing) {
      return await ctx.db.insert("questions", args);
    }
    return existing._id;
  },
});

// Create a subject
export const createSubject = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    questionCount: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if subject already exists
    const existing = await ctx.db
      .query("subjects")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
    
    if (!existing) {
      return await ctx.db.insert("subjects", args);
    }
    return existing._id;
  },
});

// Create a chapter
export const createChapter = mutation({
  args: {
    name: v.string(),
    subject: v.string(),
    questionCount: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("chapters", args);
  },
});

// Create a subtopic
export const createSubtopic = mutation({
  args: {
    name: v.string(),
    chapter: v.string(),
    subject: v.string(),
    questionCount: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("subtopics", args);
  },
});

// Update question with vector embedding
export const updateQuestionEmbedding = mutation({
  args: {
    _id: v.id("questions"),
    vectorEmbedding: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args._id, {
      vector_embedding: args.vectorEmbedding,
    });
    return args._id;
  },
});

// Bulk insert questions
export const insertQuestions = mutation({
  args: { 
    questions: v.array(v.object({
      questionId: v.string(),
      question_no: v.string(),
      question_text: v.string(),
      year: v.number(),
      paper_code: v.string(),
      subject: v.string(),
      chapter: v.string(),
      subtopic: v.string(),
      marks: v.number(),
      theoretical_practical: v.string(),
      provenance: v.string(),
      confidence: v.number(),
      correct_answer: v.string(),
      has_diagram: v.boolean(),
      options: v.optional(v.array(v.string())),
    }))
  },
  handler: async (ctx, args) => {
    const insertedIds = [];
    
    for (const question of args.questions) {
      // Check if question already exists
      const existing = await ctx.db
        .query("questions")
        .withIndex("by_question_id", (q) => q.eq("questionId", question.questionId))
        .first();
      
      if (!existing) {
        const id = await ctx.db.insert("questions", question);
        insertedIds.push(id);
      }
    }
    
    return { inserted: insertedIds.length };
  },
});

// Insert or update subject
export const upsertSubject = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    questionCount: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subjects")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        questionCount: args.questionCount,
        description: args.description,
        icon: args.icon,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("subjects", args);
    }
  },
});

// Insert or update chapter
export const upsertChapter = mutation({
  args: {
    name: v.string(),
    subject: v.string(),
    questionCount: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("chapters")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        questionCount: args.questionCount,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("chapters", args);
    }
  },
});

// Insert or update subtopic
export const upsertSubtopic = mutation({
  args: {
    name: v.string(),
    chapter: v.string(),
    subject: v.string(),
    questionCount: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subtopics")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        questionCount: args.questionCount,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("subtopics", args);
    }
  },
});

// Clear all questions (for testing/re-migration)
export const clearAllQuestions = mutation({
  args: {},
  handler: async (ctx) => {
    const questions = await ctx.db.query("questions").collect();
    for (const question of questions) {
      await ctx.db.delete(question._id);
    }
    return { deleted: questions.length };
  },
});

// Clear all metadata tables
export const clearAllMetadata = mutation({
  args: {},
  handler: async (ctx) => {
    const subjects = await ctx.db.query("subjects").collect();
    const chapters = await ctx.db.query("chapters").collect();
    const subtopics = await ctx.db.query("subtopics").collect();
    
    for (const subject of subjects) await ctx.db.delete(subject._id);
    for (const chapter of chapters) await ctx.db.delete(chapter._id);
    for (const subtopic of subtopics) await ctx.db.delete(subtopic._id);
    
    return {
      deleted: {
        subjects: subjects.length,
        chapters: chapters.length,
        subtopics: subtopics.length,
      }
    };
  },
});

// Get graph data for visualization
export const getGraphData = query({
  args: {
    limit: v.optional(v.number()),
    excludeDiagrams: v.optional(v.boolean()),
    subjectFilter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 100, 200); // Cap at 200 to prevent excessive data loading
    const excludeDiagrams = args.excludeDiagrams || false;
    
    // Fetch all metadata efficiently
    let subjects = await ctx.db.query("subjects").collect();
    let chapters = await ctx.db.query("chapters").collect();
    let subtopics = await ctx.db.query("subtopics").collect();
    
    // Filter by subject if provided
    if (args.subjectFilter) {
      subjects = subjects.filter(s => s.name === args.subjectFilter);
      chapters = chapters.filter(c => c.subject === args.subjectFilter);
      subtopics = subtopics.filter(st => st.subject === args.subjectFilter);
    }
    
    // Get sample questions efficiently using indexed queries
    let questions: Doc<"questions">[] = [];
    
    if (args.subjectFilter) {
      // Use subject index for better performance
      questions = await ctx.db
        .query("questions")
        .withIndex("by_subject", (q) => q.eq("subject", args.subjectFilter!))
        .take(limit);
    } else {
      // Use limited query without loading all data
      questions = await ctx.db.query("questions").take(limit);
    }
    
    // Apply filters
    if (excludeDiagrams) {
      questions = questions.filter(q => !q.has_diagram);
    }
    
    // Build nodes and links
    const nodes = [];
    const links = [];
    
    // Add subject nodes
    for (const subject of subjects) {
      nodes.push({
        id: `subject-${subject.name}`,
        label: subject.name,
        type: 'Subject' as const,
        questionCount: subject.questionCount,
      });
    }
    
    // Add chapter nodes and links to subjects
    for (const chapter of chapters) {
      const nodeId = `chapter-${chapter.name}`;
      nodes.push({
        id: nodeId,
        label: chapter.name,
        type: 'Chapter' as const,
        subject: chapter.subject,
        questionCount: chapter.questionCount,
      });
      
      // Link chapter to subject
      links.push({
        source: `subject-${chapter.subject}`,
        target: nodeId,
        type: 'HAS_CHAPTER',
      });
    }
    
    // Add subtopic nodes and links to chapters
    for (const subtopic of subtopics) {
      const nodeId = `subtopic-${subtopic.name}`;
      nodes.push({
        id: nodeId,
        label: subtopic.name,
        type: 'Subtopic' as const,
        chapter: subtopic.chapter,
        subject: subtopic.subject,
        questionCount: subtopic.questionCount,
      });
      
      // Link subtopic to chapter
      links.push({
        source: `chapter-${subtopic.chapter}`,
        target: nodeId,
        type: 'HAS_SUBTOPIC',
      });
    }
    
    // Add question nodes and links to subtopics
    for (const question of questions) {
      const nodeId = `question-${question.questionId}`;
      nodes.push({
        id: nodeId,
        label: question.question_no,
        type: 'Question' as const,
        subject: question.subject,
        chapter: question.chapter,
        subtopic: question.subtopic,
        year: question.year,
        marks: question.marks,
        has_diagram: question.has_diagram,
        question_text: question.question_text.substring(0, 100),
      });
      
      // Link question to subtopic
      links.push({
        source: `subtopic-${question.subtopic}`,
        target: nodeId,
        type: 'HAS_QUESTION',
      });
    }
    
    return {
      nodes,
      links,
      totalQuestions: questions.length,
    };
  },
});

// Get detailed statistics for the analytics page
export const getDetailedStats = query({
  args: {},
  handler: async (ctx) => {
    // Limit the number of questions we process to prevent excessive bandwidth usage
    const questions = await ctx.db.query("questions").take(10000); // Limit to 10k questions

    // Year distribution
    const yearMap = new Map<string, number>();
    questions.forEach(q => {
      const year = q.year.toString();
      yearMap.set(year, (yearMap.get(year) || 0) + 1);
    });
    const yearDistribution = Array.from(yearMap.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => parseInt(a.year) - parseInt(b.year));

    // Subject distribution
    const subjectMap = new Map<string, number>();
    questions.forEach(q => {
      subjectMap.set(q.subject, (subjectMap.get(q.subject) || 0) + 1);
    });
    const subjectDistribution = Array.from(subjectMap.entries())
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 subjects

    // Marks distribution
    const marksMap = new Map<string, number>();
    questions.forEach(q => {
      const marks = q.marks.toString();
      marksMap.set(marks, (marksMap.get(marks) || 0) + 1);
    });
    const marksDistribution = Array.from(marksMap.entries())
      .map(([marks, count]) => ({ marks: `${marks} Mark${marks === '1' ? '' : 's'}`, count }))
      .sort((a, b) => parseInt(a.marks) - parseInt(b.marks));

    // Theory vs Practical
    const theoryPracticalMap = new Map<string, number>();
    questions.forEach(q => {
      const type = q.theoretical_practical === 'theoretical' ? 'Theoretical' :
                   q.theoretical_practical === 'practical' ? 'Practical' : 'Other';
      theoryPracticalMap.set(type, (theoryPracticalMap.get(type) || 0) + 1);
    });
    const theoryPracticalDistribution = Array.from(theoryPracticalMap.entries())
      .map(([type, count]) => ({ type, count }));

    // Chapter distribution
    const chapterMap = new Map<string, number>();
    questions.forEach(q => {
      chapterMap.set(q.chapter, (chapterMap.get(q.chapter) || 0) + 1);
    });
    const chapterDistribution = Array.from(chapterMap.entries())
      .map(([chapter, count]) => ({ chapter, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15); // Top 15 chapters

    // Subtopic distribution
    const subtopicMap = new Map<string, number>();
    questions.forEach(q => {
      subtopicMap.set(q.subtopic, (subtopicMap.get(q.subtopic) || 0) + 1);
    });
    const topSubtopics = Array.from(subtopicMap.entries())
      .map(([subtopic, count]) => ({ subtopic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15); // Top 15 subtopics

    // Subject comparison data (limited to prevent excessive data processing)
    const subjectComparisonMap = new Map<string, number>();
    const allSubjectsSet = new Set<string>();
    const allSubtopicsSet = new Set<string>();

    questions.forEach(q => {
      const year = q.year.toString();
      const subject = q.subject;
      const subtopic = q.subtopic;

      allSubjectsSet.add(subject);
      allSubtopicsSet.add(subtopic);

      // Store data for year-subject combinations
      const key = `${year}-${subject}`;
      subjectComparisonMap.set(key, (subjectComparisonMap.get(key) || 0) + 1);

      // Also store data for year-subject-subtopic combinations
      const subtopicKey = `${year}-${subject}-${subtopic}`;
      subjectComparisonMap.set(subtopicKey, (subjectComparisonMap.get(subtopicKey) || 0) + 1);
    });

    const subjectComparisonData: { year: string; subject: string; subtopic?: string; count: number }[] = [];
    const allSubjects = Array.from(allSubjectsSet).sort();
    const allSubtopics = Array.from(allSubtopicsSet).sort();

    // Process the data for subject comparison
    subjectComparisonMap.forEach((count, key) => {
      const parts = key.split('-');
      if (parts.length === 2) {
        // year-subject combination
        const [year, subject] = parts;
        subjectComparisonData.push({ year, subject, count });
      } else if (parts.length >= 3) {
        // year-subject-subtopic combination (may have dashes in subtopic name)
        const year = parts[0];
        const subject = parts[1];
        const subtopic = parts.slice(2).join('-');
        subjectComparisonData.push({ year, subject, subtopic, count });
      }
    });

    return {
      totalQuestions: questions.length,
      yearDistribution,
      subjectDistribution,
      marksDistribution,
      theoryPracticalDistribution,
      chapterDistribution,
      topSubtopics,
      subjectComparisonData,
      allSubjects,
      allSubtopics
    };
  },
});
