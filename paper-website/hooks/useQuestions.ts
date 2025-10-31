import { useState, useEffect, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { subjects } from "@/lib/subjects";
import { getUniqueSubtopics } from "@/lib/subtopicNormalization";

export interface UseQuestionsOptions {
  subjectParam: string;
}

export function useQuestions({ subjectParam }: UseQuestionsOptions) {
  const [loading, setLoading] = useState(true);

  const subject = subjects.find(
    (s) => s.fileName.replace(".json", "") === decodeURIComponent(subjectParam)
  );

  const subjectName = subject?.name || decodeURIComponent(subjectParam);

  // Fetch all questions from Convex
  // Note: You may want to add pagination if you have many questions
  const allQuestionsFromDB = useQuery(api.questions.getAllQuestions);

  // Filter questions by subject
  const questions = useMemo(() => {
    if (!allQuestionsFromDB) return [];
    
    return allQuestionsFromDB.filter((q) => {
      // Match by subject name
      return q.subject?.toLowerCase() === subjectName.toLowerCase();
    });
  }, [allQuestionsFromDB, subjectName]);

  useEffect(() => {
    // Update loading state based on whether data is fetched
    if (allQuestionsFromDB !== undefined) {
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [allQuestionsFromDB]);

  // Extract unique values for filters
  const years = useMemo(() => {
    const uniqueYears = [...new Set(questions.map((q) => q.year).filter((y) => y != null))].sort((a, b) => b - a);
    return uniqueYears;
  }, [questions]);

  const marks = useMemo(() => {
    // For now, calculate marks based on typical patterns (can be enhanced)
    // Marks are typically 1, 2, or 3 for GATE
    const uniqueMarks = [1, 2, 3];
    return uniqueMarks.filter(() => 
      questions.some(() => {
        // Estimate marks from question number or other patterns
        // For now just return default marks
        return true;
      })
    );
  }, [questions]);

  const subtopics = useMemo(() => {
    const rawSubtopics = questions
      .map((q) => q.subtopic)
      .filter((s) => s != null && s.trim() !== "");
    return getUniqueSubtopics(rawSubtopics);
  }, [questions]);

  return {
    questions,
    loading,
    subject,
    years,
    marks,
    subtopics,
  };
}
