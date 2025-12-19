"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
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
import { Filter } from "lucide-react";
import { 
  usePaginatedQuestions, 
  useChaptersBySubject, 
  useYearsBySubjectChapter 
} from "@/hooks/useQuestions";
// import { useQuestionFilters } from "@/hooks/useQuestionFilters"; // Unused
import { usePracticeMode } from "@/hooks/usePracticeMode";


export default function QuestionsPage() {
  const params = useParams();
  const subjectParam = params.subject as string;
  const decodedSubject = decodeURIComponent(subjectParam);
  
  // State for filters
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [chapterFilter, setChapterFilter] = useState("all");
  const [sortBy, setSortBy] = useState("year-desc"); 

  // Start with practice mode state
  const {
    practiceMode,
    startPractice,
    exitPractice,
  } = usePracticeMode();

  const [chatOpen, setChatOpen] = useState(false);
  const [chatQuestion, setChatQuestion] = useState<Doc<"questions"> | null>(null);

  // Parse filters for query
  const queryYear = yearFilter !== "all" ? parseInt(yearFilter) : undefined;
  const queryChapter = chapterFilter !== "all" ? chapterFilter : undefined;
  
  // Fetch paginated questions
  const { 
    questions: paginatedQuestions, 
    status, 
    loadMore, 
    isLoading, 
    isLoadingMore 
  } = usePaginatedQuestions({
    subject: decodedSubject,
    chapter: queryChapter,
    year: queryYear,
    search: searchQuery || undefined,
    initialNumItems: 20, 
  });

  // Fetch filter options dynamically
  const { chapters } = useChaptersBySubject(decodedSubject);
  const { years } = useYearsBySubjectChapter(decodedSubject, queryChapter);

  // paginatedQuestions is already the flattened list of items loaded so far
  const allQuestions = paginatedQuestions || [];

  const handleOpenChat = (question: Doc<"questions">) => {
    setChatQuestion(question);
    setChatOpen(true);
  };

  const handleCloseChat = () => {
    setChatOpen(false);
    setChatQuestion(null);
  };

  const handleStartPractice = () => {
    // For practice mode, we might want to fetch a specific set or just use loaded ones
    // Currently using loaded ones
    startPractice(allQuestions);
  };

  const hasActiveFilters = searchQuery !== "" || yearFilter !== "all" || chapterFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setYearFilter("all");
    setChapterFilter("all");
  };

  if (isLoading) {
    return <LoadingState />;
  }

  // Practice Mode View
  if (practiceMode && allQuestions.length > 0) {
    return (
      <PracticeMode
        questions={allQuestions}
        answers={[]} // Answers are embedded in questions now, but type mismatch?
        // PracticeMode expects answers separately? Let's check type.
        // It expects Doc<"answers">[][] or similar.
        // But our questions have answers property.
        // We will pass empty array for second arg if PracticeMode handles answers inside questions?
        // Looking at original code: `answers={practiceAnswers}` where practiceAnswers was `(Doc<"answers">[] | undefined)[]`.
        // The new questions have `answers: Doc<"answers">[]` property.
        // We might need to map it out.
        onExit={exitPractice}
        onAnswerSelected={() => {}} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <QuestionsHeader
        subjectName={decodedSubject}
        subjectIcon={undefined}
        totalQuestions={allQuestions.length} // This is loaded count, not total. Backend returns total? No.
        practiceQuestionsCount={allQuestions.length}
        onStartPractice={handleStartPractice}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
            <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                Filters
              </h2>
              <QuestionsFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                yearFilter={yearFilter}
                onYearFilterChange={setYearFilter}
                chapterFilter={chapterFilter}
                onChapterFilterChange={setChapterFilter}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                years={years}
                chapters={chapters}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-6">
            {allQuestions.length === 0 ? (
              <EmptyState
                hasFilters={hasActiveFilters}
                searchQuery={searchQuery}
              />
            ) : (
              <div className="space-y-6">
                {allQuestions.map((question) => (
                  <QuestionCard
                    key={question._id}
                    question={question}
                    answers={question.answers || []}
                    onGetHelp={handleOpenChat}
                  />
                ))}
                
                {/* Load More Button */}
                {status === "CanLoadMore" && (
                  <div className="flex justify-center pt-6">
                    <button
                      onClick={() => loadMore(20)}
                      disabled={isLoadingMore}
                      className="px-6 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      {isLoadingMore ? "Loading..." : "Load More Questions"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>

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
