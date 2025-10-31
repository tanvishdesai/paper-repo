import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { ChatDialog } from "@/components/chat-dialog";
import { Question } from "@/types/question";
import { detectCorrectOption } from "@/utils/questionUtils";
import { getDisplaySubtopic } from "@/lib/subtopicNormalization";
import { X, HelpCircle, Check, ChevronRight, ArrowLeft } from "lucide-react";

interface PracticeModeProps {
  questions: Question[];
  onExit: () => void;
  onOpenChat: (question: Question) => void;
}

export function PracticeMode({ questions, onExit, onOpenChat }: PracticeModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, string>>(new Map());
  const [showResults, setShowResults] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatQuestion, setChatQuestion] = useState<Question | null>(null);

  const currentQuestion = questions[currentIndex];
  const selectedAnswer = answers.get(currentIndex);
  const progress = (answers.size / questions.length) * 100;

  // Calculate results when quiz is completed
  const results = showResults ? (() => {
    const total = questions.length;
    const answered = answers.size;
    const correct = questions.reduce((count, question, index) => {
      const userAnswer = answers.get(index);
      if (!userAnswer || !question.options) return count;

      const correctIndex = detectCorrectOption(question.options, question.correct_answer);
      return count + (correctIndex !== null && question.options[correctIndex] === userAnswer ? 1 : 0);
    }, 0);

    return { total, answered, correct, incorrect: answered - correct, unanswered: total - answered };
  })() : null;

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = new Map(answers);
    newAnswers.set(currentIndex, answer);
    setAnswers(newAnswers);

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
    setAnswers(new Map());
    setShowResults(false);
  };

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
                  <p className="text-xs text-muted-foreground">
                    Practice Mode Complete
                  </p>
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

          {/* Question Review */}
          <div className="space-y-4 mb-8">
            <h3 className="text-xl font-semibold mb-6">Question Review</h3>
            {questions.map((question, index) => {
              const userAnswer = answers.get(index);
              const correctIndex = question.options ? detectCorrectOption(question.options, question.correct_answer) : null;
              const isCorrect = userAnswer && correctIndex !== null && question.options && question.options[correctIndex] === userAnswer;
              const isAnswered = userAnswer !== undefined;

              return (
                <div key={index} className="p-6 rounded-xl border bg-card shadow-sm">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      !isAnswered
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-500"
                        : isCorrect
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }`}>
                      {!isAnswered ? "?" : isCorrect ? <Check className="h-4 w-4" /> : <X className="h-3 w-3" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-lg mb-2">Question {index + 1}</p>
                      <p className="text-muted-foreground line-clamp-2">{question.question_text}</p>
                    </div>
                  </div>

                  {question.options && (
                    <div className="grid gap-3 ml-12">
                      {question.options.map((option, optIndex) => {
                        const isUserChoice = userAnswer === option;
                        const isCorrectOption = correctIndex === optIndex;

                        return (
                          <div
                            key={optIndex}
                            className={`text-sm p-3 rounded-lg border ${
                              isCorrectOption
                                ? "bg-green-50 dark:bg-green-950/20 border-green-500/50 text-green-800 dark:text-green-200"
                                : isUserChoice && !isCorrectOption
                                ? "bg-red-50 dark:bg-red-950/20 border-red-500/50 text-red-800 dark:text-red-200"
                                : "bg-muted/30 border-border/30 text-muted-foreground"
                            }`}
                          >
                            <span className="font-medium">{String.fromCharCode(65 + optIndex)}.</span> {option}
                            {isUserChoice && <span className="ml-2 text-xs">(Your answer)</span>}
                            {isCorrectOption && <span className="ml-2 text-xs">(Correct)</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
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
              {answers.size} / {questions.length} answered
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
                  {currentQuestion.marks != null && (
                    <Badge variant="default" className="bg-primary/10 text-primary">
                      {currentQuestion.marks} Mark{currentQuestion.marks !== 1 ? "s" : ""}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="bg-secondary/80 backdrop-blur-sm capitalize">
                    {currentQuestion.theoretical_practical}
                  </Badge>
                  <span className="text-sm text-muted-foreground/80 bg-muted/50 px-3 py-1 rounded-full">
                    #{currentQuestion.question_no}
                  </span>
                </div>

                {/* Question Text */}
                <div className="prose prose-xl max-w-none dark:prose-invert">
                  <p className="text-2xl leading-relaxed text-foreground/90 font-medium m-0">
                    {currentQuestion.question_text}
                  </p>
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
                {currentQuestion.options?.map((option, index) => {
                  const isSelected = selectedAnswer === option;

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(option)}
                      disabled={selectedAnswer !== undefined}
                      className={`group/option w-full text-left p-6 rounded-2xl border-2 transition-all duration-300 ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-xl shadow-primary/20 scale-[1.02]"
                          : selectedAnswer !== undefined
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
                        <span className={`flex-1 text-left text-lg transition-colors ${
                          isSelected
                            ? "text-primary font-semibold"
                            : "text-foreground/80 group-hover/option:text-foreground"
                        }`}>
                          {option}
                        </span>
                        <div className="flex-shrink-0 text-lg font-bold text-primary/60 bg-primary/10 px-3 py-1 rounded-full">
                          {String.fromCharCode(65 + index)}
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
                <div className="flex items-center gap-2 text-muted-foreground/80">
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"></div>
                  <span className="font-medium">Topic:</span>
                  <span className="text-foreground/70 font-medium">{getDisplaySubtopic(currentQuestion.subtopic)}</span>
                </div>
                {currentQuestion.provenance && (
                  <div className="flex items-center gap-2 text-muted-foreground/80">
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"></div>
                    <span className="font-medium">Source:</span>
                    <span className="text-foreground/70">{currentQuestion.provenance}</span>
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
            {selectedAnswer === undefined && (
              <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                Select an answer to continue
              </div>
            )}
          </div>

          <Button
            onClick={handleNext}
            disabled={selectedAnswer === undefined || currentIndex === questions.length - 1}
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
