import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HelpCircle, CheckCircle } from "lucide-react";
import { Question } from "@/types/question";
import { getDisplaySubtopic } from "@/lib/subtopicNormalization";
import { detectCorrectOption } from "@/utils/questionUtils";
import { SimilarQuestions } from "@/components/similar-questions";

interface QuestionCardProps {
  question: Question;
  index: number;
  onGetHelp: (question: Question) => void;
}

export function QuestionCard({ question, index, onGetHelp }: QuestionCardProps) {
  const hasOptions = question.options && question.options.length > 0;
  const correctOptionIndex = hasOptions ? detectCorrectOption(question.options!, question.correct_answer) : null;

  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-card via-card/95 to-card/90 border border-border/50 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-2">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="relative p-8">
        {/* Question Header */}
        <div className="flex items-start justify-between gap-6 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {question.year && (
                <Badge variant="outline" className="bg-background/90 backdrop-blur-sm border-primary/20 text-primary font-medium shadow-sm">
                  {question.year}
                </Badge>
              )}
              {question.marks != null && (
                <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-sm">
                  {question.marks} Mark{question.marks !== 1 ? "s" : ""}
                </Badge>
              )}
              <Badge variant="secondary" className="bg-secondary/80 backdrop-blur-sm shadow-sm capitalize">
                {question.theoretical_practical}
              </Badge>
              <span className="text-sm text-muted-foreground/80 bg-muted/60 px-3 py-1.5 rounded-full border border-border/30 font-medium">
                #{question.question_no}
              </span>
            </div>

            {/* Question Text */}
            <div className="prose prose-lg max-w-none dark:prose-invert">
              <p className="text-xl leading-relaxed text-foreground/90 font-medium m-0">
                {question.question_text}
              </p>
            </div>
          </div>
        </div>

        {/* Options */}
        {hasOptions && (
          <div className="mb-6 space-y-4">
            <div className="text-base font-medium text-muted-foreground flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              Answer Options
            </div>

            <div className="grid gap-3">
              {question.options!.map((option, optIndex) => {
                const isCorrect = correctOptionIndex === optIndex;

                return (
                  <div
                    key={optIndex}
                    className={`group/option relative p-4 rounded-xl border-2 transition-all duration-300 ${
                      isCorrect
                        ? "bg-gradient-to-r from-green-50/50 to-green-100/30 dark:from-green-950/20 dark:to-green-900/10 border-green-300 dark:border-green-700 shadow-sm shadow-green-500/10"
                        : "bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30 border-border/40 hover:border-primary/30 hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                        isCorrect
                          ? "bg-green-500 border-green-500 text-white shadow-md shadow-green-500/30"
                          : "bg-primary/10 border-primary/30 text-primary group-hover/option:bg-primary group-hover/option:text-primary-foreground group-hover/option:border-primary"
                      }`}>
                        {isCorrect ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          String.fromCharCode(65 + optIndex)
                        )}
                      </div>

                      <div className="flex-1">
                        <span className={`text-base leading-relaxed transition-colors ${
                          isCorrect
                            ? "text-green-800 dark:text-green-200 font-medium"
                            : "text-foreground/90 group-hover/option:text-foreground"
                        }`}>
                          {option}
                        </span>

                        {isCorrect && (
                          <div className="mt-2">
                            <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700">
                              ✓ Correct Answer
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-border/30">
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground/80">
              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"></div>
              <span className="font-medium">Topic:</span>
              <span className="text-foreground/70 font-medium">{getDisplaySubtopic(question.subtopic)}</span>
            </div>
            {question.provenance && (
              <div className="flex items-center gap-2 text-muted-foreground/80">
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"></div>
                <span className="font-medium">Source:</span>
                <span className="text-foreground/70">{question.provenance}</span>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onGetHelp(question)}
            className="gap-2 bg-background/50 backdrop-blur-sm border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 shadow-sm"
          >
            <HelpCircle className="h-4 w-4" />
            Get Help
          </Button>
        </div>

        {/* Similar Questions */}
        {question.questionId && (
          <div className="mt-6 pt-6 border-t border-border/30">
            <SimilarQuestions
              questionId={question.questionId}
              onQuestionClick={onGetHelp}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
