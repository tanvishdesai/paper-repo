import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { ChatDialog } from "@/components/chat-dialog";
import { Doc } from "@/convex/_generated/dataModel";
import { X, HelpCircle, Check, ChevronRight, ArrowLeft } from "lucide-react";

interface PracticeModeProps {
  questions: Doc<"questions">[];
  answers: (Doc<"answers">[] | undefined)[];
  onExit: () => void;
  onAnswerSelected: (questionId: string, answerId: string) => void;
}

export function PracticeMode({ questions, answers, onExit, onAnswerSelected }: PracticeModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Map<string, string>>(new Map());
  const [showResults, setShowResults] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatQuestion, setChatQuestion] = useState<Doc<"questions"> | null>(null);

  const currentQuestion = questions[currentIndex];
  const currentAnswers = answers[currentIndex] || [];
  const selectedAnswerId = userAnswers.get(currentQuestion?._id || "");
  const progress = (userAnswers.size / questions.length) * 100;

  const handleAnswerSelect = (answer: Doc<"answers">) => {
    if (!currentQuestion) return;
    
    const newAnswers = new Map(userAnswers);
    newAnswers.set(currentQuestion._id, answer._id);
    setUserAnswers(newAnswers);
    onAnswerSelected(currentQuestion._id, answer._id);

    // Auto-advance after short delay
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setShowResults(true);
      }
    }, 800);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleOpenChat = () => {
    setChatQuestion(currentQuestion);
    setChatOpen(true);
  };

  const handleCloseChat = () => {
    setChatOpen(false);
    setChatQuestion(null);
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setUserAnswers(new Map());
    setShowResults(false);
  };

  // Calculate results
  const results = showResults ? (() => {
    const total = questions.length;
    const answered = userAnswers.size;
    let correct = 0;

    questions.forEach((q, index) => {
      const qa = answers[index];
      const userAnswerId = userAnswers.get(q._id);
      if (userAnswerId && qa) {
        const isCorrect = qa.find(a => a._id === userAnswerId)?.correct;
        if (isCorrect) correct++;
      }
    });

    return { total, answered, correct, incorrect: answered - correct, unanswered: total - answered };
  })() : null;

  // Results Screen
  if (showResults && results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onExit}>
                  <X className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-lg font-bold">Quiz Results</h1>
                  <p className="text-xs text-muted-foreground">Practice Mode Complete</p>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Score Overview */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 mb-6 border-4 border-primary/20">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {Math.round((results.correct / results.total) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Score</div>
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
            <p className="text-muted-foreground text-lg">
              You answered {results.answered} out of {results.total} questions
            </p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="text-center p-6 rounded-2xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">{results.correct}</div>
              <div className="text-sm text-green-600 dark:text-green-400 font-medium">Correct</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">{results.incorrect}</div>
              <div className="text-sm text-red-600 dark:text-red-400 font-medium">Incorrect</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800">
              <div className="text-3xl font-bold text-gray-600 dark:text-gray-400 mb-2">{results.unanswered}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Unanswered</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">{results.total}</div>
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4">
            <Button onClick={resetQuiz} variant="outline" size="lg">
              Retake Quiz
            </Button>
            <Button onClick={onExit} size="lg">
              Back to Questions
            </Button>
          </div>
        </div>

        {/* Chat Dialog */}
        <ChatDialog
          isOpen={chatOpen}
          onClose={handleCloseChat}
          question={chatQuestion}
        />
      </div>
    );
  }

  if (!currentQuestion) {
    return <div>No questions available</div>;
  }

  // Quiz Interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onExit}>
                <X className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-bold">Practice Mode</h1>
                <p className="text-xs text-muted-foreground">
                  Question {currentIndex + 1} of {questions.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenChat}
                className="gap-2"
              >
                <HelpCircle className="h-4 w-4" />
                Help
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              {userAnswers.size} / {questions.length} answered
            </span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card/95 to-card/90 border border-border/50 shadow-2xl mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10"></div>
          <div className="relative p-8 lg:p-10">
            {/* Question Header */}
            <div className="flex items-start justify-between gap-6 mb-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-6 flex-wrap">
                  {currentQuestion.year && (
                    <Badge variant="outline" className="bg-background/90 backdrop-blur-sm border-primary/20 text-primary font-medium">
                      {currentQuestion.year}
                    </Badge>
                  )}
                  {currentQuestion.questionType && (
                    <Badge variant="secondary" className="bg-secondary/80 backdrop-blur-sm capitalize">
                      {currentQuestion.questionType}
                    </Badge>
                  )}
                </div>

                {/* Question Text */}
                <div className="prose prose-xl max-w-none dark:prose-invert">
                  <div
                    className="text-2xl leading-relaxed text-foreground/90 font-medium m-0"
                    dangerouslySetInnerHTML={{ __html: currentQuestion.question }}
                  />
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-6">
              <div className="text-lg font-medium text-muted-foreground flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                Select your answer
              </div>
              <div className="grid gap-4">
                {currentAnswers.sort((a, b) => a.sortOrder - b.sortOrder).map((answer, index) => {
                  const isSelected = selectedAnswerId === answer._id;
                  const optionLabels = ["A", "B", "C", "D"];

                  return (
                    <button
                      key={answer._id}
                      onClick={() => handleAnswerSelect(answer)}
                      disabled={selectedAnswerId !== undefined}
                      className={`group/option w-full text-left p-6 rounded-2xl border-2 transition-all duration-300 ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-xl shadow-primary/20 scale-[1.02]"
                          : selectedAnswerId !== undefined
                          ? "border-border/30 bg-muted/30 cursor-not-allowed opacity-60"
                          : "border-border/50 hover:border-primary/40 hover:bg-accent/50 hover:shadow-lg hover:scale-[1.01]"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex-shrink-0 h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                            isSelected
                              ? "border-primary bg-primary shadow-lg"
                              : "border-border group-hover/option:border-primary/50"
                          }`}
                        >
                          {isSelected && <Check className="h-5 w-5 text-primary-foreground" />}
                        </div>
                        <div
                          className={`flex-1 text-left text-lg transition-colors ${
                            isSelected
                              ? "text-primary font-semibold"
                              : "text-foreground/80 group-hover/option:text-foreground"
                          }`}
                          dangerouslySetInnerHTML={{ __html: answer.answer }}
                        />
                        <div className="flex-shrink-0 text-lg font-bold text-primary/60 bg-primary/10 px-3 py-1 rounded-full">
                          {optionLabels[index]}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-10 pt-8 border-t border-border/30">
              <div className="flex flex-wrap gap-6 text-sm">
                {currentQuestion.chapter && (
                  <div className="flex items-center gap-2 text-muted-foreground/80">
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"></div>
                    <span className="font-medium">Chapter:</span>
                    <span className="text-foreground/70 font-medium">{currentQuestion.chapter}</span>
                  </div>
                )}
                {currentQuestion.subject && (
                  <div className="flex items-center gap-2 text-muted-foreground/80">
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"></div>
                    <span className="font-medium">Subject:</span>
                    <span className="text-foreground/70">{currentQuestion.subject}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="text-center">
            <div className="text-lg font-medium mb-2">
              {currentIndex + 1} / {questions.length}
            </div>
            {selectedAnswerId === undefined && (
              <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                Select an answer to continue
              </div>
            )}
          </div>

          <Button
            onClick={handleNext}
            disabled={selectedAnswerId === undefined || currentIndex === questions.length - 1}
            className="gap-2"
          >
            {currentIndex === questions.length - 1 ? "Finish Quiz" : "Next"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chat Dialog */}
      <ChatDialog
        isOpen={chatOpen}
        onClose={handleCloseChat}
        question={chatQuestion}
      />
    </div>
  );
}
