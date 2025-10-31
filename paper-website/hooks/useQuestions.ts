import { useState, useEffect, useMemo } from "react";
import { Question } from "@/types/question";
import { subjects } from "@/lib/subjects";
import { normalizeSubtopic, getUniqueSubtopics } from "@/lib/subtopicNormalization";

export interface UseQuestionsOptions {
  subjectParam: string;
}

export function useQuestions({ subjectParam }: UseQuestionsOptions) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const subject = subjects.find(
    (s) => s.fileName.replace(".json", "") === decodeURIComponent(subjectParam)
  );

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load from Neo4j via API (fallback to JSON if Neo4j is not configured)
        const subjectName = subject?.name || decodeURIComponent(subjectParam);

        try {
          // Try Neo4j first
          const response = await fetch(`/api/internal/questions?subject=${encodeURIComponent(subjectName)}&limit=1000`);
          if (response.ok) {
            const data = await response.json();
            setQuestions(data.data || []);
            return;
          }
        } catch (neo4jError) {
          console.warn("Neo4j not available, falling back to JSON files:", neo4jError);
        }

        // Fallback to JSON files
        const YEAR_FILES = [
          "2007.json", "2008.json", "2009.json", "2010.json", "2012.json",
          "2013.json", "2014.json", "2015.json", "2016.json", "2017.json",
          "2018.json", "2019.json", "2020.json", "2021-1.json", "2022.json",
          "2023.json", "2024-1.json", "2024-2.json", "2025-1.json", "2025-2.json"
        ];

        const allQuestions: Question[] = [];
        for (const yearFile of YEAR_FILES) {
          try {
            const response = await fetch(`/data/${yearFile}`);
            if (response.ok) {
              const data = await response.json();
              allQuestions.push(...data);
            }
          } catch (error) {
            console.error(`Error loading ${yearFile}:`, error);
          }
        }

        const filteredBySubject = allQuestions.filter(
          q => q.subject.toLowerCase() === subjectName.toLowerCase()
        );

        setQuestions(filteredBySubject);
      } catch (error) {
        console.error("Error loading questions:", error);
        setError("Failed to load questions");
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [subject, subjectParam]);

  // Extract unique values for filters
  const years = useMemo(() => {
    const uniqueYears = [...new Set(questions.map((q) => q.year).filter((y) => y != null))].sort((a, b) => b - a);
    return uniqueYears;
  }, [questions]);

  const marks = useMemo(() => {
    const uniqueMarks = [...new Set(questions.map((q) => q.marks).filter((m) => m != null))].sort((a, b) => a - b);
    return uniqueMarks;
  }, [questions]);

  const subtopics = useMemo(() => {
    const rawSubtopics = questions.map((q) => q.subtopic).filter((s) => s != null && s.trim() !== "");
    return getUniqueSubtopics(rawSubtopics);
  }, [questions]);

  return {
    questions,
    loading,
    error,
    subject,
    years,
    marks,
    subtopics,
  };
}
