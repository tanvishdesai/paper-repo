import { useState, useMemo } from "react";
import { Doc } from "@/convex/_generated/dataModel";

export interface QuestionFilters {
  searchQuery: string;
  yearFilter: string;
  chapterFilter: string;
  sortBy: string;
}

export function useQuestionFilters(questions: Doc<"questions">[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [chapterFilter, setChapterFilter] = useState("all");
  const [sortBy, setSortBy] = useState("year-desc");

  const filters: QuestionFilters = {
    searchQuery,
    yearFilter,
    chapterFilter,
    sortBy,
  };

  const setFilters = {
    setSearchQuery,
    setYearFilter,
    setChapterFilter,
    setSortBy,
  };

  // Extract unique chapters from questions
  const chapters = useMemo(() => {
    const uniqueChapters = [
      ...new Set(
        questions
          .map((q) => q.chapter)
          .filter((c): c is string => c != null && c.trim() !== "")
      ),
    ].sort();
    return uniqueChapters;
  }, [questions]);

  // Filter and sort questions
  const filteredQuestions = useMemo(() => {
    // Ensure questions is an array
    if (!Array.isArray(questions) || questions.length === 0) {
      return [];
    }

    const filtered = questions.filter((q) => {
      // Search in question text (strip HTML for better search)
      const questionText = q.question?.replace(/<[^>]*>/g, "") || "";
      const matchesSearch =
        searchQuery === "" ||
        questionText.toLowerCase().includes(searchQuery.toLowerCase());

      // Year filter - handle both string and number comparisons
      let matchesYear = true;
      if (yearFilter !== "all" && yearFilter !== "") {
        const filterYear = typeof yearFilter === "string" ? parseInt(yearFilter, 10) : yearFilter;
        matchesYear = q.year !== undefined && q.year !== null && q.year === filterYear;
      }

      // Chapter filter - handle null/undefined and normalize comparison
      let matchesChapter = true;
      if (chapterFilter !== "all" && chapterFilter !== "") {
        const questionChapter = q.chapter?.trim() || "";
        const filterChapter = chapterFilter.trim();
        matchesChapter = questionChapter === filterChapter;
      }

      return matchesSearch && matchesYear && matchesChapter;
    });

    // Sort questions
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "year-desc":
          // Sort by year descending, then by originalId for stability
          const yearDiff = (b.year ?? 0) - (a.year ?? 0);
          if (yearDiff !== 0) return yearDiff;
          return (a.originalId ?? 0) - (b.originalId ?? 0);
        case "year-asc":
          // Sort by year ascending, then by originalId for stability
          const yearDiffAsc = (a.year ?? 0) - (b.year ?? 0);
          if (yearDiffAsc !== 0) return yearDiffAsc;
          return (a.originalId ?? 0) - (b.originalId ?? 0);
        case "chapter-asc":
          // Sort by chapter name ascending
          const chapterA = (a.chapter || "").toLowerCase();
          const chapterB = (b.chapter || "").toLowerCase();
          if (chapterA !== chapterB) return chapterA.localeCompare(chapterB);
          // If chapters are same, sort by year descending
          const chapterYearDiff = (b.year ?? 0) - (a.year ?? 0);
          if (chapterYearDiff !== 0) return chapterYearDiff;
          return (a.originalId ?? 0) - (b.originalId ?? 0);
        case "chapter-desc":
          // Sort by chapter name descending
          const chapterADesc = (a.chapter || "").toLowerCase();
          const chapterBDesc = (b.chapter || "").toLowerCase();
          if (chapterADesc !== chapterBDesc) return chapterBDesc.localeCompare(chapterADesc);
          // If chapters are same, sort by year descending
          const chapterYearDiffDesc = (b.year ?? 0) - (a.year ?? 0);
          if (chapterYearDiffDesc !== 0) return chapterYearDiffDesc;
          return (a.originalId ?? 0) - (b.originalId ?? 0);
        default:
          // Default: sort by year descending
          const defaultYearDiff = (b.year ?? 0) - (a.year ?? 0);
          if (defaultYearDiff !== 0) return defaultYearDiff;
          return (a.originalId ?? 0) - (b.originalId ?? 0);
      }
    });

    return filtered;
  }, [questions, searchQuery, yearFilter, chapterFilter, sortBy]);

  const hasActiveFilters =
    searchQuery !== "" ||
    yearFilter !== "all" ||
    chapterFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setYearFilter("all");
    setChapterFilter("all");
  };

  return {
    filters,
    setFilters,
    filteredQuestions,
    practiceQuestions: filteredQuestions,
    chapters,
    hasActiveFilters,
    clearFilters,
  };
}
