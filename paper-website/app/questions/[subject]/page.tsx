"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Question } from "@/types/question";
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
  const [chatQuestion, setChatQuestion] = useState<Question | null>(null);

  // Custom hooks for data and state management
  const { questions, loading, subject, years, marks, subtopics } = useQuestions({ subjectParam });
  const {
    filters,
    setFilters,
    filteredQuestions,
    practiceQuestions,
    hasActiveFilters,
    clearFilters,
  } = useQuestionFilters(questions);
  const {
    practiceMode,
    startPractice,
    exitPractice,
  } = usePracticeMode();

  const handleOpenChat = (question: Question) => {
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

  if (loading) {
    return <LoadingState />;
  }

  // Practice Mode View
  if (practiceMode && practiceQuestions.length > 0) {
    return (
      <PracticeMode
        questions={practiceQuestions}
        onExit={handleExitPractice}
        onOpenChat={handleOpenChat}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <QuestionsHeader
        subjectName={subject?.name || decodeURIComponent(subjectParam)}
        subjectIcon={subject?.icon}
        totalQuestions={filteredQuestions.length}
        practiceQuestionsCount={practiceQuestions.length}
        onStartPractice={handleStartPractice}
      />

      <div className="container mx-auto px-4 py-6">
        <QuestionsFilters
          searchQuery={filters.searchQuery}
          onSearchChange={setFilters.setSearchQuery}
          yearFilter={filters.yearFilter}
          onYearFilterChange={setFilters.setYearFilter}
          marksFilter={filters.marksFilter}
          onMarksFilterChange={setFilters.setMarksFilter}
          typeFilter={filters.typeFilter}
          onTypeFilterChange={setFilters.setTypeFilter}
          subtopicFilter={filters.subtopicFilter}
          onSubtopicFilterChange={setFilters.setSubtopicFilter}
          sortBy={filters.sortBy}
          onSortByChange={setFilters.setSortBy}
          years={years}
          marks={marks}
          subtopics={subtopics}
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
            {filteredQuestions.map((question, index) => (
              <QuestionCard
                key={index}
                question={question}
                index={index}
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
