import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const getAllQuestions = query({
  args: {},
  handler: async (ctx) => {
    const questions = await ctx.db.query("gateQuestions").collect();
    return questions;
  },
});

export const getQuestionsByYear = query({
  args: {
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("gateQuestions")
      .filter((q) => q.eq(q.field("year"), args.year))
      .collect();
    return questions;
  },
});

export const getQuestionsBySubject = query({
  args: {
    subject: v.string(),
  },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("gateQuestions")
      .filter((q) => q.eq(q.field("subject"), args.subject))
      .collect();
    return questions;
  },
});

export const getQuestionsByChapter = query({
  args: {
    chapter: v.string(),
  },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("gateQuestions")
      .filter((q) => q.eq(q.field("chapter"), args.chapter))
      .collect();
    return questions;
  },
});

export const searchQuestions = query({
  args: {
    searchText: v.string(),
  },
  handler: async (ctx, args) => {
    const questions = await ctx.db.query("gateQuestions").collect();
    
    // Client-side filtering for search
    const searchLower = args.searchText.toLowerCase();
    return questions.filter(
      (q) =>
        q.questionText.toLowerCase().includes(searchLower) ||
        q.explanation.toLowerCase().includes(searchLower) ||
        (q.subtopic && q.subtopic.toLowerCase().includes(searchLower))
    );
  },
});

export const getDetailedStats = query({
  args: {},
  handler: async (ctx) => {
    const questions = await ctx.db.query("gateQuestions").collect();
    
    // Calculate statistics
    const years = {} as Record<number, number>;
    const subjects = {} as Record<string, number>;
    const chapters = {} as Record<string, number>;
    const subtopics = {} as Record<string, number>;
    const types = {} as Record<string, number>;
    const marksCount = { "1-mark": 0, "2-mark": 0 } as Record<string, number>;
    const theoryPracticalCount = { "Theory": 0, "Practical": 0 } as Record<string, number>;
    
    const subjectsSet = new Set<string>();
    const chaptersSet = new Set<string>();
    const subtopicsSet = new Set<string>();
    const chaptersBySubjectMap = new Map<string, Set<string>>();
    const subtopicsByChapterMap = new Map<string, Set<string>>();
    
    // For subject comparison data
    const subjectComparisonData: Array<{
      subject: string;
      year: number;
      subtopic?: string;
      count: number;
    }> = [];
    const subjectYearSubtopicMap = new Map<string, number>();

    for (const q of questions) {
      // Years
      if (q.year) {
        years[q.year] = (years[q.year] || 0) + 1;
      }

      // Subjects
      if (q.subject) {
        subjects[q.subject] = (subjects[q.subject] || 0) + 1;
        subjectsSet.add(q.subject);
      }

      // Chapters
      if (q.chapter) {
        chapters[q.chapter] = (chapters[q.chapter] || 0) + 1;
        chaptersSet.add(q.chapter);

        // Chapters by subject
        if (q.subject) {
          if (!chaptersBySubjectMap.has(q.subject)) {
            chaptersBySubjectMap.set(q.subject, new Set());
          }
          chaptersBySubjectMap.get(q.subject)!.add(q.chapter);
        }
      }

      // Subtopics
      if (q.subtopic) {
        subtopics[q.subtopic] = (subtopics[q.subtopic] || 0) + 1;
        subtopicsSet.add(q.subtopic);

        // Subtopics by chapter
        if (q.chapter) {
          if (!subtopicsByChapterMap.has(q.chapter)) {
            subtopicsByChapterMap.set(q.chapter, new Set());
          }
          subtopicsByChapterMap.get(q.chapter)!.add(q.subtopic);
        }
      }

      // Question types
      if (q.questionType) {
        types[q.questionType] = (types[q.questionType] || 0) + 1;
      }

      // Marks distribution (default to 1-mark for all questions since marks field doesn't exist)
      marksCount["1-mark"] = (marksCount["1-mark"] || 0) + 1;

      // Theory vs Practical (infer from questionType if it contains "theory" or "practical", otherwise default to Theory)
      const questionTypeLower = q.questionType?.toLowerCase() || "";
      if (questionTypeLower.includes("practical") || questionTypeLower.includes("prac")) {
        theoryPracticalCount["Practical"] = (theoryPracticalCount["Practical"] || 0) + 1;
      } else {
        theoryPracticalCount["Theory"] = (theoryPracticalCount["Theory"] || 0) + 1;
      }

      // Subject comparison data - build key for grouping
      if (q.subject && q.year) {
        const key = `${q.subject}|${q.year}|${q.subtopic || ""}`;
        subjectYearSubtopicMap.set(key, (subjectYearSubtopicMap.get(key) || 0) + 1);
      }
    }

    // Convert subjectYearSubtopicMap to array format
    for (const [key, count] of subjectYearSubtopicMap) {
      const [subject, yearStr, subtopic] = key.split("|");
      const year = parseInt(yearStr);
      subjectComparisonData.push({
        subject,
        year,
        subtopic: subtopic || undefined,
        count,
      });
    }

    // Build distribution arrays
    const yearDistribution = Object.entries(years)
      .map(([year, count]) => ({ year: parseInt(year), count }))
      .sort((a, b) => a.year - b.year);

    const subjectDistribution = Object.entries(subjects)
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count);

    const chapterDistribution = Object.entries(chapters)
      .map(([chapter, count]) => ({ chapter, count }))
      .sort((a, b) => b.count - a.count);

    const topSubtopics = Object.entries(subtopics)
      .map(([subtopic, count]) => ({ subtopic, count }))
      .sort((a, b) => b.count - a.count);

    const marksDistribution = Object.entries(marksCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const theoryPracticalDistribution = Object.entries(theoryPracticalCount)
      .map(([name, count]) => ({ name, count }));

    // Convert maps to plain objects
    const chaptersBySubject: Record<string, string[]> = {};
    for (const [subject, chapterSet] of chaptersBySubjectMap) {
      chaptersBySubject[subject] = Array.from(chapterSet).sort();
    }
    
    const subtopicsByChapter: Record<string, string[]> = {};
    for (const [chapter, subtopicSet] of subtopicsByChapterMap) {
      subtopicsByChapter[chapter] = Array.from(subtopicSet).sort();
    }

    return {
      totalQuestions: questions.length,
      years,
      subjects,
      chapters,
      subtopics,
      types,
      yearRange: {
        min: Object.keys(years).length > 0 ? Math.min(...Object.keys(years).map(Number)) : 0,
        max: Object.keys(years).length > 0 ? Math.max(...Object.keys(years).map(Number)) : 0,
      },
      subjectList: Array.from(subjectsSet).sort(),
      chaptersBySubject,
      subtopicsByChapter,
      // Add formatted distributions
      yearDistribution,
      subjectDistribution,
      chapterDistribution,
      topSubtopics,
      marksDistribution,
      theoryPracticalDistribution,
      allSubjects: Array.from(subjectsSet).sort(),
      subjectComparisonData,
    };
  },
});

export const getQuestionsBySubjectAndYear = query({
  args: {
    subject: v.string(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const questions = await ctx.db.query("gateQuestions").collect();
    return questions.filter(
      (q) =>
        q.subject?.toLowerCase() === args.subject.toLowerCase() &&
        q.year === args.year
    );
  },
});

export const getSubjectStats = query({
  args: {
    subject: v.string(),
  },
  handler: async (ctx, args) => {
    const questions = await ctx.db.query("gateQuestions").collect();
    const subjectQuestions = questions.filter(
      (q) => q.subject?.toLowerCase() === args.subject.toLowerCase()
    );

    const stats = {
      totalQuestions: subjectQuestions.length,
      years: {} as Record<number, number>,
      chapters: {} as Record<string, number>,
      subtopics: {} as Record<string, number>,
      types: {} as Record<string, number>,
    };

    for (const q of subjectQuestions) {
      if (q.year) {
        stats.years[q.year] = (stats.years[q.year] || 0) + 1;
      }
      if (q.chapter) {
        stats.chapters[q.chapter] = (stats.chapters[q.chapter] || 0) + 1;
      }
      if (q.subtopic) {
        stats.subtopics[q.subtopic] = (stats.subtopics[q.subtopic] || 0) + 1;
      }
      if (q.questionType) {
        stats.types[q.questionType] = (stats.types[q.questionType] || 0) + 1;
      }
    }

    return stats;
  },
});

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
    let query = ctx.db.query("gateQuestions");

    // Apply filters
    if (args.subject) {
      query = query.filter((q) => q.eq(q.field("subject"), args.subject));
    }
    if (args.year) {
      query = query.filter((q) => q.eq(q.field("year"), args.year));
    }
    if (args.type) {
      query = query.filter((q) => q.eq(q.field("questionType"), args.type));
    }

    // Get filtered results
    let questions = await query.collect();

    // Apply search filter (client-side since it's text search)
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      questions = questions.filter(
        (q) =>
          q.questionText.toLowerCase().includes(searchLower) ||
          q.explanation.toLowerCase().includes(searchLower) ||
          (q.subtopic && q.subtopic.toLowerCase().includes(searchLower))
      );
    }

    const total = questions.length;
    const limit = args.limit || 100;
    const offset = args.offset || 0;

    // Apply pagination
    const paginatedQuestions = questions.slice(offset, offset + limit);

    return {
      questions: paginatedQuestions,
      total,
    };
  },
});

export const getSubjects = query({
  args: {},
  handler: async (ctx) => {
    const questions = await ctx.db.query("gateQuestions").collect();

    // Count questions by subject
    const subjectCounts: Record<string, number> = {};
    for (const q of questions) {
      if (q.subject) {
        subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
      }
    }

    // Transform to the expected format
    const subjects = Object.entries(subjectCounts).map(([name, questionCount]) => ({
      name,
      questionCount,
    }));

    return subjects;
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const questions = await ctx.db.query("gateQuestions").collect();

    const stats = {
      totalQuestions: questions.length,
      totalSubjects: new Set(questions.map(q => q.subject).filter(Boolean)).size,
      totalChapters: new Set(questions.map(q => q.chapter).filter(Boolean)).size,
      totalSubtopics: new Set(questions.map(q => q.subtopic).filter(Boolean)).size,
      years: {} as Record<number, number>,
      subjects: {} as Record<string, number>,
      questionTypes: {} as Record<string, number>,
    };

    for (const q of questions) {
      if (q.year) {
        stats.years[q.year] = (stats.years[q.year] || 0) + 1;
      }
      if (q.subject) {
        stats.subjects[q.subject] = (stats.subjects[q.subject] || 0) + 1;
      }
      if (q.questionType) {
        stats.questionTypes[q.questionType] = (stats.questionTypes[q.questionType] || 0) + 1;
      }
    }

    return stats;
  },
});

export const getSimilarQuestions = query({
  args: {
    questionId: v.id("gateQuestions"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get the target question
    const targetQuestion = await ctx.db.get(args.questionId);
    if (!targetQuestion) {
      return [];
    }

    const allQuestions = await ctx.db.query("gateQuestions").collect();

    // Simple similarity based on subject, chapter, subtopic matching
    const similarQuestions = allQuestions
      .filter(q => q._id !== args.questionId)
      .map(q => {
        let score = 0;
        // Exact subject match gets highest score
        if ('subject' in q && 'subject' in targetQuestion && q.subject === targetQuestion.subject) {
          score += 10;
        }

        // Exact chapter match
        if ('chapter' in q && 'chapter' in targetQuestion && q.chapter === targetQuestion.chapter) {
          score += 5;
        }

        // Exact subtopic match
        if ('subtopic' in q && 'subtopic' in targetQuestion && q.subtopic === targetQuestion.subtopic) {
          score += 3;
        }
        // Same year
        if ('year' in q && 'year' in targetQuestion && q.year === targetQuestion.year) {
          score += 1;
        }

        return { ...q, similarityScore: score };
      })
      .filter(q => q.similarityScore > 0)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, args.limit || 5);

    return similarQuestions;
  },
});

export const findSimilarQuestionsWithVectors = query({
  args: {
    questionId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // For now, just return empty array - vector search not implemented
    // This would require vector embeddings and similarity search
    return [];
  },
});