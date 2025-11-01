"use client";

import { useParams } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { Doc } from "@/convex/_generated/dataModel";
import { ChatDialog } from "@/components/chat-dialog";
import {
  LoadingState,
  QuestionsHeader,
  QuestionsFilters,
  QuestionCard,
  EmptyState,
  PracticeMode,
} from "@/components/questions";
import { useQuestions } from "@/hooks/useQuestions";
import { useQuestionFilters } from "@/hooks/useQuestionFilters";
import { usePracticeMode } from "@/hooks/usePracticeMode";


export default function QuestionsPage() {
  const params = useParams();
  const subjectParam = params.subject as string;
  const [chatOpen, setChatOpen] = useState(false);
  const [chatQuestion, setChatQuestion] = useState<Doc<"questions"> | null>(null);
  const [answersMap, setAnswersMap] = useState<Map<string, Doc<"answers">[]>>(new Map());

  // Custom hooks for data and state management
  const { questions, loading } = useQuestions({ subject: decodeURIComponent(subjectParam) });
  
  // Ensure questions is always an array
  const questionsArray = useMemo(() => {
    return Array.isArray(questions) ? questions : [];
  }, [questions]);
  
  const {
    filters,
    setFilters,
    filteredQuestions,
    practiceQuestions,
    hasActiveFilters,
    clearFilters,
    chapters,
  } = useQuestionFilters(questionsArray);
  const {
    practiceMode,
    startPractice,
    exitPractice,
  } = usePracticeMode();

  // Extract unique years from questions
  const years = useMemo(() => {
    const uniqueYears = [
      ...new Set(
        questionsArray
          .map((q) => q.year)
          .filter((y): y is number => y != null && !isNaN(y))
      ),
    ].sort((a, b) => b - a);
    return uniqueYears;
  }, [questionsArray]);

  // Create a stable reference to question IDs for dependency tracking
  // This prevents infinite loops when filteredQuestions array reference changes
  const questionIds = useMemo(() => {
    return filteredQuestions.map((q) => q._id).sort().join(",");
  }, [filteredQuestions]);

  // Fetch answers for all filtered questions in parallel
  // Only re-runs when questionIds actually change (not just array reference)
  useEffect(() => {
    if (filteredQuestions.length === 0) {
      setAnswersMap(new Map());
      return;
    }

    const fetchAnswers = async () => {
      // Fetch all answers in parallel using Promise.all
      const answerPromises = filteredQuestions.map(async (question) => {
        try {
          const response = await fetch(`/api/questions/${question._id}/answers`);
          if (response.ok) {
            const answers = await response.json();
            return { questionId: question._id, answers };
          }
          return { questionId: question._id, answers: [] };
        } catch (error) {
          console.error(`Failed to fetch answers for question ${question._id}:`, error);
          return { questionId: question._id, answers: [] };
        }
      });

      // Wait for all answers to be fetched in parallel
      const results = await Promise.all(answerPromises);
      
      // Build the answers map from all results
      const newAnswersMap = new Map<string, Doc<"answers">[]>();
      results.forEach(({ questionId, answers }) => {
        newAnswersMap.set(questionId, answers);
      });
      
      setAnswersMap(newAnswersMap);
    };

    fetchAnswers();
    // questionIds is memoized from filteredQuestions, so when IDs change,
    // filteredQuestions has changed too, and the closure will have the latest value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionIds]);

  const handleOpenChat = (question: Doc<"questions">) => {
    setChatQuestion(question);
    setChatOpen(true);
  };

  const handleCloseChat = () => {
    setChatOpen(false);
    setChatQuestion(null);
  };

  const handleStartPractice = () => {
    startPractice(practiceQuestions);
  };

  const handleExitPractice = () => {
    exitPractice();
  };

  const handleAnswerSelected = (questionId: string, answerId: string) => {
    // Handle answer selection - can be used for tracking progress
    console.log(`Question ${questionId} answered with ${answerId}`);
  };

  if (loading) {
    return <LoadingState />;
  }

  // Practice Mode View
  if (practiceMode && practiceQuestions?.length > 0) {
    // Get answers for practice questions
    const practiceAnswers: (Doc<"answers">[] | undefined)[] = [];
    
    return (
      <PracticeMode
        questions={practiceQuestions}
        answers={practiceAnswers}
        onExit={handleExitPractice}
        onAnswerSelected={handleAnswerSelected}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <QuestionsHeader
        subjectName={decodeURIComponent(subjectParam)}
        subjectIcon={undefined}
        totalQuestions={filteredQuestions.length}
        practiceQuestionsCount={practiceQuestions?.length || 0}
        onStartPractice={handleStartPractice}
      />

      <div className="container mx-auto px-4 py-6">
        <QuestionsFilters
          searchQuery={filters.searchQuery}
          onSearchChange={setFilters.setSearchQuery}
          yearFilter={filters.yearFilter}
          onYearFilterChange={setFilters.setYearFilter}
          chapterFilter={filters.chapterFilter}
          onChapterFilterChange={setFilters.setChapterFilter}
          sortBy={filters.sortBy}
          onSortByChange={setFilters.setSortBy}
          years={years}
          chapters={chapters}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />

        {/* Questions List */}
        {filteredQuestions.length === 0 ? (
          <EmptyState
            hasFilters={hasActiveFilters}
            searchQuery={filters.searchQuery}
          />
        ) : (
          <div className="space-y-6">
            {filteredQuestions.map((question) => (
              <QuestionCard
                key={question._id}
                question={question}
                answers={answersMap.get(question._id) || []}
                onGetHelp={handleOpenChat}
              />
            ))}
          </div>
        )}

        {/* Chat Dialog */}
        <ChatDialog
          isOpen={chatOpen}
          onClose={handleCloseChat}
          question={chatQuestion}
        />
      </div>
    </div>
  );
}
