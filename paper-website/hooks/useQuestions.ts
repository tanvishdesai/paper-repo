import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export interface UseQuestionsOptions {
  subject?: string;
  chapter?: string;
  year?: number;
  limit?: number;
}

/**
 * Hook to fetch questions with optional filters
 */
export function useQuestions({
  subject,
  chapter,
  year,
  limit,
}: UseQuestionsOptions) {
  const questions = useQuery(api.questions.getQuestionsByFilters, {
    subject,
    chapter,
    year,
    limit,
  });

  return {
    questions: questions || [],
    loading: questions === undefined,
  };
}

/**
 * Hook to fetch a single question with all its answers
 */
export function useQuestionWithAnswers(questionId: Id<"questions"> | null) {
  const questionData = useQuery(
    api.questions.getQuestion,
    questionId ? { questionId } : "skip"
  );

  return {
    question: questionData,
    loading: questionData === undefined,
  };
}

/**
 * Hook to fetch similar questions
 */
export function useSimilarQuestions(questionId: Id<"questions"> | null, limit?: number) {
  const similar = useQuery(
    api.questions.getSimilarQuestions,
    questionId ? { questionId, limit: limit || 15 } : "skip"
  );

  return {
    similar: similar || [],
    loading: similar === undefined,
  };
}

/**
 * Hook to fetch all available subjects
 */
export function useSubjects() {
  const subjects = useQuery(api.questions.getSubjects);

  return {
    subjects: subjects || [],
    loading: subjects === undefined,
  };
}

/**
 * Hook to fetch chapters for a subject
 */
export function useChaptersBySubject(subject: string | null) {
  const chapters = useQuery(
    api.questions.getChaptersBySubject,
    subject ? { subject } : "skip"
  );

  return {
    chapters: chapters || [],
    loading: chapters === undefined,
  };
}

/**
 * Hook to fetch years available for a subject/chapter
 */
export function useYearsBySubjectChapter(subject: string | null, chapter?: string | null) {
  const years = useQuery(
    api.questions.getYearsBySubjectChapter,
    subject ? { subject, chapter: chapter || undefined } : "skip"
  );

  return {
    years: years || [],
    loading: years === undefined,
  };
}

/**
 * Hook to get question count with optional filters
 */
export function useQuestionCount(subject?: string, chapter?: string, year?: number) {
  const count = useQuery(api.questions.getQuestionCount, {
    subject,
    chapter,
    year,
  });

  return {
    count: count || 0,
    loading: count === undefined,
  };
}
