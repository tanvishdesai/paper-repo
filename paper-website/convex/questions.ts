import { query } from "./_generated/server";
import { v } from "convex/values";

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
    const stats = {
      totalQuestions: questions.length,
      years: {} as Record<number, number>,
      subjects: {} as Record<string, number>,
      chapters: {} as Record<string, number>,
      subtopics: {} as Record<string, number>,
      types: {} as Record<string, number>,
      yearRange: { min: Infinity, max: -Infinity } as { min: number; max: number },
      subjectList: [] as string[],
      chaptersBySubject: {} as Record<string, string[]>,
      subtopicsByChapter: {} as Record<string, string[]>,
    };

    const subjectsSet = new Set<string>();
    const chaptersSet = new Set<string>();
    const subtopicsSet = new Set<string>();
    const chaptersBySubjectMap = new Map<string, Set<string>>();
    const subtopicsByChapterMap = new Map<string, Set<string>>();

    for (const q of questions) {
      // Years
      if (q.year) {
        stats.years[q.year] = (stats.years[q.year] || 0) + 1;
        stats.yearRange.min = Math.min(stats.yearRange.min, q.year);
        stats.yearRange.max = Math.max(stats.yearRange.max, q.year);
      }

      // Subjects
      if (q.subject) {
        stats.subjects[q.subject] = (stats.subjects[q.subject] || 0) + 1;
        subjectsSet.add(q.subject);
      }

      // Chapters
      if (q.chapter) {
        stats.chapters[q.chapter] = (stats.chapters[q.chapter] || 0) + 1;
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
        stats.subtopics[q.subtopic] = (stats.subtopics[q.subtopic] || 0) + 1;
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
        stats.types[q.questionType] = (stats.types[q.questionType] || 0) + 1;
      }
    }

    stats.subjectList = Array.from(subjectsSet).sort();
    
    // Convert maps to plain objects
    for (const [subject, chapters] of chaptersBySubjectMap) {
      stats.chaptersBySubject[subject] = Array.from(chapters).sort();
    }
    
    for (const [chapter, subtopics] of subtopicsByChapterMap) {
      stats.subtopicsByChapter[chapter] = Array.from(subtopics).sort();
    }

    return stats;
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
