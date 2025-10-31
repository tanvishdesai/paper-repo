import { useState, useMemo } from "react";
import { Question } from "@/types/question";
import { normalizeSubtopic } from "@/lib/subtopicNormalization";

export interface QuestionFilters {
  searchQuery: string;
  yearFilter: string;
  marksFilter: string;
  typeFilter: string;
  subtopicFilter: string;
  sortBy: string;
}

export function useQuestionFilters(questions: Question[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [marksFilter, setMarksFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [subtopicFilter, setSubtopicFilter] = useState("all");
  const [sortBy, setSortBy] = useState("year-desc");

  const filters: QuestionFilters = {
    searchQuery,
    yearFilter,
    marksFilter,
    typeFilter,
    subtopicFilter,
    sortBy,
  };

  const setFilters = {
    setSearchQuery,
    setYearFilter,
    setMarksFilter,
    setTypeFilter,
    setSubtopicFilter,
    setSortBy,
  };

  // Filter and sort questions
  const filteredQuestions = useMemo(() => {
    const filtered = questions.filter((q) => {
      const matchesSearch =
        searchQuery === "" ||
        q.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.subtopic.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesYear = yearFilter === "all" || q.year?.toString() === yearFilter;
      const matchesMarks = marksFilter === "all" || q.marks?.toString() === marksFilter;
      const matchesType =
        typeFilter === "all" || q.theoretical_practical === typeFilter;
      const matchesSubtopic = subtopicFilter === "all" || normalizeSubtopic(q.subtopic) === normalizeSubtopic(subtopicFilter);

      return matchesSearch && matchesYear && matchesMarks && matchesType && matchesSubtopic;
    });

    // Sort questions
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "year-desc":
          return (b.year ?? 0) - (a.year ?? 0);
        case "year-asc":
          return (a.year ?? 0) - (b.year ?? 0);
        case "marks-desc":
          return (b.marks ?? 0) - (a.marks ?? 0);
        case "marks-asc":
          return (a.marks ?? 0) - (b.marks ?? 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [questions, searchQuery, yearFilter, marksFilter, typeFilter, subtopicFilter, sortBy]);

  const hasActiveFilters = searchQuery !== "" || yearFilter !== "all" || marksFilter !== "all" || typeFilter !== "all" || subtopicFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setYearFilter("all");
    setMarksFilter("all");
    setTypeFilter("all");
    setSubtopicFilter("all");
  };

  // Filter questions with options for practice mode
  const practiceQuestions = useMemo(() => {
    return filteredQuestions.filter(q => q.options && q.options.length > 0);
  }, [filteredQuestions]);

  return {
    filters,
    setFilters,
    filteredQuestions,
    practiceQuestions,
    hasActiveFilters,
    clearFilters,
  };
}
