import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

/**
 * Get a question with all its answers
 */
export const getQuestion = query({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const question = await ctx.db.get(args.questionId);
    if (!question) return null;

    // Get all answers for this question using the by_question index
    // The index is on [questionId, sortOrder], so ordering by asc will sort by sortOrder
    const answers = await ctx.db
      .query("answers")
      .withIndex("by_question", (q) => q.eq("questionId", args.questionId))
      .order("asc")
      .collect();

    // Sort by sortOrder to ensure correct order (in case index ordering isn't enough)
    const sortedAnswers = answers.sort((a, b) => a.sortOrder - b.sortOrder);

    return { ...question, answers: sortedAnswers };
  },
});

/**
 * Get similar questions with lazy computation and caching
 */
export const getSimilarQuestions = query({
  args: { questionId: v.id("questions"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const question = await ctx.db.get(args.questionId);
    if (!question) return [];

    const limit = args.limit || 15;

    // Check if similar questions are already computed
    if (question.similarQuestionsComputed && question.similarQuestionIds) {
      // Return cached similar questions
      const similarQuestions = await Promise.all(
        question.similarQuestionIds.slice(0, limit).map((id) => ctx.db.get(id))
      );
      return similarQuestions.filter(Boolean); // Filter out any deleted questions
    }

    // Compute similar questions for the first time
    // If subjectChapter is available, use index; otherwise query all questions
    const allSimilarQuestions = question.subjectChapter
      ? await ctx.db
          .query("questions")
          .withIndex("by_subject_chapter", (q) =>
            q.eq("subjectChapter", question.subjectChapter!)
          )
          .collect()
      : await ctx.db.query("questions").collect();

    // Filter out current question and sort by year proximity
    const filtered = allSimilarQuestions.filter(
      (q) => q._id.toString() !== args.questionId.toString()
    );

    const sorted = filtered.sort((a, b) => {
      const aYear = a.year ?? 0;
      const bYear = b.year ?? 0;
      const questionYear = question.year ?? 0;
      
      const diffA = Math.abs(aYear - questionYear);
      const diffB = Math.abs(bYear - questionYear);
      if (diffA !== diffB) return diffA - diffB;
      // If same distance, prefer more recent years
      return bYear - aYear;
    });

    // Take top N similar questions
    const topSimilar = sorted.slice(0, limit);

    // Return results - caching happens via separate mutation call from client
    // or through the precomputeAllSimilarQuestions batch process
    return topSimilar;
  },
});

/**
 * Internal mutation to cache similar questions (called by scheduler)
 */
export const cacheSimilarQuestions = mutation({
  args: {
    questionId: v.id("questions"),
    similarQuestionIds: v.array(v.id("questions")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.questionId, {
      similarQuestionsComputed: true,
      similarQuestionIds: args.similarQuestionIds,
    });
  },
});

/**
 * Get questions with pagination and filters
 */
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
    let questions: Doc<"questions">[] = [];

    // Normalize subject for comparison (trim whitespace, handle case)
    const normalizedSubject = args.subject?.trim();

    // Apply filters based on what's provided
    if (normalizedSubject) {
      // First try using the index for efficiency
      const indexedQuestions = await ctx.db
        .query("questions")
        .withIndex("by_subject", (q) => q.eq("subject", normalizedSubject))
        .collect();
      
      // Also query all questions and filter for case-insensitive subject match
      // This handles edge cases where subject might have slight variations
      const allQuestions = await ctx.db.query("questions").collect();
      const caseInsensitiveMatches = allQuestions.filter((q) => 
        q.subject?.trim().toLowerCase() === normalizedSubject.toLowerCase()
      );

      // Combine and deduplicate by _id (use Map to avoid duplicates)
      const questionMap = new Map<string, Doc<"questions">>();
      
      // Add indexed results first (most likely to be correct)
      indexedQuestions.forEach((q) => questionMap.set(q._id, q));
      
      // Add case-insensitive matches (will only add if not already present)
      caseInsensitiveMatches.forEach((q) => questionMap.set(q._id, q));
      
      questions = Array.from(questionMap.values());
    } else {
      // No subject filter - get all questions
      questions = await ctx.db.query("questions").collect();
    }

    // Apply additional filters
    if (args.year) {
      questions = questions.filter((q) => q.year !== undefined && q.year === args.year);
    }


    if (args.type) {
      questions = questions.filter((q) => q.questionType === args.type);
    }

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      questions = questions.filter((q) => 
        q.question?.toLowerCase().includes(searchLower) ||
        q.explanation?.toLowerCase().includes(searchLower)
      );
    }

    // Get total count before pagination
    const total = questions.length;

    // Apply pagination
    const limit = args.limit || 100;
    const offset = args.offset || 0;
    questions = questions.slice(offset, offset + limit);

    return { questions, total };
  },
});

/**
 * Get questions by filters (subject, chapter, year, limit)
 */
export const getQuestionsByFilters = query({
  args: {
    subject: v.optional(v.string()),
    chapter: v.optional(v.string()),
    year: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let questions: Doc<"questions">[] = [];

    // Normalize subject for comparison (trim whitespace, handle case)
    const normalizedSubject = args.subject?.trim();

    // Apply filters based on what's provided
    if (normalizedSubject && args.chapter && args.year) {
      const subjectChapter = `${normalizedSubject}::${args.chapter}`;
      const allQuestions = await ctx.db
        .query("questions")
        .withIndex("by_subject_chapter", (q) => q.eq("subjectChapter", subjectChapter))
        .collect();
      questions = allQuestions.filter((q) => q.year !== undefined && q.year === args.year);
    } else if (normalizedSubject && args.chapter) {
      const subjectChapter = `${normalizedSubject}::${args.chapter}`;
      questions = await ctx.db
        .query("questions")
        .withIndex("by_subject_chapter", (q) => q.eq("subjectChapter", subjectChapter))
        .collect();
    } else if (normalizedSubject) {
      // First try using the index for efficiency
      const indexedQuestions = await ctx.db
        .query("questions")
        .withIndex("by_subject", (q) => q.eq("subject", normalizedSubject))
        .collect();
      
      // Also query all questions and filter for case-insensitive subject match
      // This handles edge cases where subject might have slight variations
      const allQuestions = await ctx.db.query("questions").collect();
      const caseInsensitiveMatches = allQuestions.filter((q) => 
        q.subject?.trim().toLowerCase() === normalizedSubject.toLowerCase()
      );

      // Combine and deduplicate by _id (use Map to avoid duplicates)
      const questionMap = new Map<string, Doc<"questions">>();
      
      // Add indexed results first (most likely to be correct)
      indexedQuestions.forEach((q) => questionMap.set(q._id, q));
      
      // Add case-insensitive matches (will only add if not already present)
      caseInsensitiveMatches.forEach((q) => questionMap.set(q._id, q));
      
      questions = Array.from(questionMap.values());
    } else {
      // No subject filter - get all questions
      questions = await ctx.db.query("questions").collect();
    }

    // Additional filtering if needed
    if (args.year && !(normalizedSubject && args.chapter)) {
      questions = questions.filter((q) => q.year !== undefined && q.year === args.year);
    }

    // Limit results only if limit is specified (don't limit by default)
    if (args.limit !== undefined && args.limit > 0) {
      questions = questions.slice(0, args.limit);
    }

    return questions;
  },
});

/**
 * Get all unique subjects
 */
export const getSubjects = query({
  handler: async (ctx) => {
    const questions = await ctx.db.query("questions").collect();
    const subjectsSet = new Set(
      questions
        .map((q) => q.subject)
        .filter((subject): subject is string => {
          return subject !== undefined &&
                 subject !== null &&
                 subject !== "undefined" &&
                 subject.trim() !== "";
        })
    );
    return Array.from(subjectsSet).sort();
  },
});

/**
 * Get chapters by subject
 */
export const getChaptersBySubject = query({
  args: { subject: v.string() },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_subject", (q) => q.eq("subject", args.subject))
      .collect();

    const chaptersSet = new Set(
      questions
        .map((q) => q.chapter)
        .filter((chapter) => chapter !== null && chapter !== undefined)
    );
    return Array.from(chaptersSet).sort();
  },
});

/**
 * Get years by subject and chapter
 */
export const getYearsBySubjectChapter = query({
  args: { subject: v.string(), chapter: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let questions: Doc<"questions">[] = [];

    if (args.chapter) {
      const subjectChapter = `${args.subject}::${args.chapter}`;
      questions = await ctx.db
        .query("questions")
        .withIndex("by_subject_chapter", (q) =>
          q.eq("subjectChapter", subjectChapter)
        )
        .collect();
    } else {
      questions = await ctx.db
        .query("questions")
        .withIndex("by_subject", (q) => q.eq("subject", args.subject))
        .collect();
    }

    const yearsSet = new Set(
      questions.map((q) => q.year).filter((year): year is number => year !== undefined)
    );
    return Array.from(yearsSet).sort((a, b) => (b ?? 0) - (a ?? 0)); // Descending order
  },
});

/**
 * Get question count by filters
 */
export const getQuestionCount = query({
  args: {
    subject: v.optional(v.string()),
    chapter: v.optional(v.string()),
    year: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let questions: Doc<"questions">[] = [];

    if (args.subject && args.chapter) {
      const subjectChapter = `${args.subject}::${args.chapter}`;
      questions = await ctx.db
        .query("questions")
        .withIndex("by_subject_chapter", (q) =>
          q.eq("subjectChapter", subjectChapter)
        )
        .collect();
    } else if (args.subject) {
      questions = await ctx.db
        .query("questions")
        .withIndex("by_subject", (q) => q.eq("subject", args.subject!))
        .collect();
    } else {
      questions = await ctx.db.query("questions").collect();
    }

    // Filter by year if provided
    if (args.year) {
      questions = questions.filter((q) => q.year === args.year);
    }

    return questions.length;
  },
});

/**
 * Track user progress
 */
export const trackProgress = mutation({
  args: {
    userId: v.string(),
    questionId: v.id("questions"),
    attempted: v.boolean(),
    correct: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Check if progress already exists
    const existing = await ctx.db
      .query("userProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("questionId"), args.questionId))
      .first();

    if (existing) {
      // Update existing progress
      await ctx.db.patch(existing._id, {
        attempted: args.attempted,
        correct: args.correct,
        attemptedAt: Date.now(),
      });
      return existing._id;
    }

    // Create new progress record
    return await ctx.db.insert("userProgress", {
      userId: args.userId,
      questionId: args.questionId,
      attempted: args.attempted,
      correct: args.correct,
      attemptedAt: Date.now(),
    });
  },
});

/**
 * Get user progress for a question
 */
export const getUserProgress = query({
  args: {
    userId: v.string(),
    questionId: v.id("questions"),
  },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("questionId"), args.questionId))
      .first();

    return progress || null;
  },
});

/**
 * Get user stats by subject
 */
export const getUserStatsBySubject = query({
  args: {
    userId: v.string(),
    subject: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all user progress records
    const progressRecords = await ctx.db
      .query("userProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Filter by subject by looking up question subject
    const subjectFilteredProgress = [];
    for (const progress of progressRecords) {
      const question = await ctx.db.get(progress.questionId);
      if (question && question.subject === args.subject) {
        subjectFilteredProgress.push(progress);
      }
    }

    const attempted = subjectFilteredProgress.filter((p) => p.attempted).length;
    const correct = subjectFilteredProgress.filter((p) => p.correct).length;

    return {
      attempted,
      correct,
      accuracy:
        attempted > 0 ? Math.round((correct / attempted) * 100) : 0,
    };
  },
});

/**
 * Pre-compute all similar questions (run once after import)
 */
export const precomputeAllSimilarQuestions = mutation({
  handler: async (ctx) => {
    const allQuestions = await ctx.db.query("questions").collect();
    let processedCount = 0;
    let skippedCount = 0;

    for (const question of allQuestions) {
      if (question.similarQuestionsComputed) {
        skippedCount++;
        continue;
      }

      // If subjectChapter is available, use index; otherwise query all questions
      const similar = question.subjectChapter
        ? await ctx.db
            .query("questions")
            .withIndex("by_subject_chapter", (q) =>
              q.eq("subjectChapter", question.subjectChapter!)
            )
            .collect()
        : await ctx.db.query("questions").collect();

      const filtered = similar.filter(
        (q) => q._id.toString() !== question._id.toString()
      );

      const sorted = filtered.sort((a, b) => {
        const aYear = a.year ?? 0;
        const bYear = b.year ?? 0;
        const questionYear = question.year ?? 0;
        
        const diffA = Math.abs(aYear - questionYear);
        const diffB = Math.abs(bYear - questionYear);
        return diffA !== diffB ? diffA - diffB : bYear - aYear;
      });

      const topSimilarIds = sorted.slice(0, 15).map((q) => q._id);

      await ctx.db.patch(question._id, {
        similarQuestionsComputed: true,
        similarQuestionIds: topSimilarIds,
      });

      processedCount++;
    }

    return {
      totalQuestions: allQuestions.length,
      processedCount,
      skippedCount,
    };
  },
});

/**
 * Internal mutation for importing a single question (called by migration script)
 */
export const importQuestion = mutation({
  args: {
    questionData: v.object({
      originalId: v.number(),
      question: v.string(),
      explanation: v.optional(v.string()),
      year: v.optional(v.number()),
      subject: v.optional(v.string()),
      chapter: v.optional(v.string()),
      questionType: v.optional(v.string()),
      createdOn: v.optional(v.string()),
      updatedOn: v.optional(v.string()),
      subjectChapter: v.optional(v.string()),
      similarQuestionsComputed: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("questions", args.questionData);
  },
});

/**
 * Internal mutation for importing answers (called by migration script)
 */
export const importAnswers = mutation({
  args: {
    answers: v.array(
      v.object({
        questionId: v.id("questions"),
        originalId: v.number(),
        answer: v.string(),
        correct: v.boolean(),
        sortOrder: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const insertedIds = [];
    for (const answer of args.answers) {
      const id = await ctx.db.insert("answers", answer);
      insertedIds.push(id);
    }
    return insertedIds;
  },
});

/**
 * Get all questions (used for exploration and stats)
 */
export const getAllQuestions = query({
  handler: async (ctx) => {
    const questions = await ctx.db.query("questions").collect();
    return questions;
  },
});

/**
 * Sanitize a string to be used as an object key by replacing invalid characters
 */
function sanitizeKey(key: string): string {
  return key
    .replace(/‐/g, '-') // Replace en-dash (U+2010) with regular hyphen
    .replace(/–/g, '-') // Replace en-dash (U+2013) with regular hyphen
    .replace(/—/g, '-') // Replace em-dash (U+2014) with regular hyphen
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
    .replace(/[^\x20-\x7E]/g, '_'); // Replace any other non-ASCII printable characters with underscore
}

/**
 * Get detailed statistics for exploration and visualization
 */
export const getDetailedStats = query({
  handler: async (ctx) => {
    const allQuestions = await ctx.db.query("questions").collect();

    // Count by subject
    const subjects: Record<string, number> = {};
    const subjectList: string[] = [];
    
    // Count by chapter (using sanitized keys)
    const chapters: Record<string, number> = {};
    
    // Year range and year distribution
    let minYear: number | undefined = undefined;
    let maxYear: number | undefined = undefined;
    const yearCounts: Record<number, number> = {};

    // Subject comparison data (for stats page)
    // Note: Using chapter as subtopic since schema doesn't have a separate subtopic field
    const subjectComparisonData: Array<{
      subject: string;
      chapter: string | undefined;
      subtopic: string | undefined; // Using chapter as subtopic
      year: number | undefined;
      count: number;
    }> = [];

    // Process all questions
    for (const question of allQuestions) {
      // Subject stats
      if (question.subject) {
        const sanitizedSubject = sanitizeKey(question.subject);
        if (!subjects[sanitizedSubject]) {
          subjects[sanitizedSubject] = 0;
          subjectList.push(question.subject); // Keep original in list
        }
        subjects[sanitizedSubject]++;
      }

      // Chapter stats (sanitize keys to avoid invalid characters)
      if (question.chapter) {
        const sanitizedChapter = sanitizeKey(question.chapter);
        chapters[sanitizedChapter] = (chapters[sanitizedChapter] || 0) + 1;
      }

      // Year range and counts
      if (question.year !== undefined && question.year !== null) {
        if (minYear === undefined || question.year < minYear) {
          minYear = question.year;
        }
        if (maxYear === undefined || question.year > maxYear) {
          maxYear = question.year;
        }
        yearCounts[question.year] = (yearCounts[question.year] || 0) + 1;
      }

      // Subject comparison data
      const subjectKey = question.subject || "Unknown";
      // Use chapter as subtopic since schema doesn't have subtopic field
      const subtopic = question.chapter || undefined;
      const existingItem = subjectComparisonData.find(
        (item) =>
          item.subject === subjectKey &&
          item.chapter === question.chapter &&
          item.subtopic === subtopic &&
          item.year === question.year
      );
      
      if (existingItem) {
        existingItem.count++;
      } else {
        subjectComparisonData.push({
          subject: subjectKey,
          chapter: question.chapter,
          subtopic: subtopic,
          year: question.year,
          count: 1,
        });
      }
    }

    // Sort subject list
    subjectList.sort();

    // Create year distribution array
    const yearDistribution = Object.entries(yearCounts)
      .map(([year, count]) => ({ year: parseInt(year), count }))
      .sort((a, b) => a.year - b.year);

    // Create subject distribution array (top 10)
    const subjectDistribution = Object.entries(subjects)
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Create chapter distribution array (top 10)
    const chapterDistribution = Object.entries(chapters)
      .map(([chapter, count]) => ({ chapter, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Create subtopics array (top 10)
    const subtopics: Record<string, number> = {};
    for (const [sanitizedChapter, count] of Object.entries(chapters)) {
      subtopics[sanitizedChapter] = count;
    }
    const topSubtopics = Object.entries(subtopics)
      .map(([subtopic, count]) => ({ subtopic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Create subtopicsByChapter (using chapters as subtopics for now)
    // Since schema doesn't have subtopics, we'll use chapters
    // Use sanitized keys for object keys, but preserve original chapter names in arrays
    const subtopicsByChapter: Record<string, string[]> = {};
    const chapterNameMap = new Map<string, string>(); // Map sanitized -> original
    
    // Build map of sanitized chapter keys to original chapter names
    for (const question of allQuestions) {
      if (question.chapter) {
        const sanitized = sanitizeKey(question.chapter);
        if (!chapterNameMap.has(sanitized)) {
          chapterNameMap.set(sanitized, question.chapter);
        }
      }
    }
    
    // Populate subtopicsByChapter using sanitized keys
    for (const sanitizedChapter of Object.keys(chapters)) {
      const originalChapter = chapterNameMap.get(sanitizedChapter) || sanitizedChapter;
      subtopicsByChapter[sanitizedChapter] = [originalChapter];
    }

    // For marks and theory/practical, return empty arrays since these fields don't exist in schema
    const marksDistribution: Array<{ name: string; count: number }> = [];
    const theoryPracticalDistribution: Array<{ name: string; count: number }> = [];

    return {
      totalQuestions: allQuestions.length,
      subjectList,
      subjects,
      chapters,
      subtopics,
      subtopicsByChapter,
      yearRange: {
        min: minYear ?? new Date().getFullYear(),
        max: maxYear ?? new Date().getFullYear(),
      },
      subjectComparisonData,
      yearDistribution,
      subjectDistribution,
      chapterDistribution,
      topSubtopics,
      marksDistribution,
      theoryPracticalDistribution,
      allSubjects: subjectList, // Add alias for backward compatibility
    };
  },
});

/**
 * Get a breakdown of subjects to help identify duplicates
 * This is a diagnostic query to see if there are multiple variations of the same subject
 */
export const getSubjectBreakdown = query({
  handler: async (ctx) => {
    const questions = await ctx.db.query("questions").collect();
    
    // Group by exact subject name
    const breakdown: Record<string, number> = {};
    
    for (const question of questions) {
      if (question.subject) {
        breakdown[question.subject] = (breakdown[question.subject] || 0) + 1;
      }
    }
    
    // Sort by count descending
    const sorted = Object.entries(breakdown)
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count);
    
    return sorted;
  },
});

/**
 * Clean up questions with undefined or empty subjects
 */
export const cleanupUndefinedSubjects = mutation({
  handler: async (ctx) => {
    const questions = await ctx.db.query("questions").collect();
    let cleanedCount = 0;
    let deletedCount = 0;

    for (const question of questions) {
      if (question.subject === undefined || question.subject === null || question.subject.trim() === "") {
        // Delete questions with invalid subjects
        await ctx.db.delete(question._id);
        deletedCount++;
      } else if (question.subject.trim() !== question.subject) {
        // Trim whitespace from subjects
        await ctx.db.patch(question._id, {
          subject: question.subject.trim(),
        });
        cleanedCount++;
      }
    }

    return {
      cleanedCount,
      deletedCount,
      totalProcessed: questions.length,
    };
  },
});
