import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HelpCircle, CheckCircle } from "lucide-react";
import { Question } from "@/types/question";
import { getDisplaySubtopic } from "@/lib/subtopicNormalization";
import Image from "next/image";

interface QuestionCardProps {
  question: Question;
  onGetHelp: (question: Question) => void;
}

export function QuestionCard({ question, onGetHelp }: QuestionCardProps) {
  // Check if question has all options
  const hasOptions =
    question.optionA &&
    question.optionB &&
    question.optionC &&
    question.optionD &&
    question.correctAnswer;

  // Map options to array with labels
  const optionsArray = hasOptions
    ? [
        { label: "A", text: question.optionA },
        { label: "B", text: question.optionB },
        { label: "C", text: question.optionC },
        { label: "D", text: question.optionD },
      ]
    : [];

  const correctOptionIndex = hasOptions
    ? optionsArray.findIndex(
        (opt) => opt.label === question.correctAnswer
      )
    : -1;

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
                <Badge
                  variant="outline"
                  className="bg-background/90 backdrop-blur-sm border-primary/20 text-primary font-medium shadow-sm"
                >
                  {question.year}
                </Badge>
              )}
              {question.questionType && (
                <Badge
                  variant="secondary"
                  className="bg-secondary/80 backdrop-blur-sm shadow-sm capitalize"
                >
                  {question.questionType}
                </Badge>
              )}
              {question.questionNumber && (
                <span className="text-sm text-muted-foreground/80 bg-muted/60 px-3 py-1.5 rounded-full border border-border/30 font-medium">
                  #{question.questionNumber}
                </span>
              )}
            </div>

            {/* Question Text */}
            <div className="prose prose-lg max-w-none dark:prose-invert">
              <p className="text-xl leading-relaxed text-foreground/90 font-medium m-0">
                {question.questionText}
              </p>
            </div>
          </div>
        </div>

        {/* Question Images */}
        {question.questionImages && (
          <div className="mb-6 relative w-full h-auto">
            <Image
              src={question.questionImages}
              alt="Question diagram"
              width={800}
              height={600}
              className="max-w-full h-auto rounded-lg border border-border/30"
            />
          </div>
        )}

        {/* Options */}
        {hasOptions && (
          <div className="mb-6 space-y-4">
            <div className="text-base font-medium text-muted-foreground flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              Answer Options
            </div>

            <div className="grid gap-3">
              {optionsArray.map((option, optIndex) => {
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
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                          isCorrect
                            ? "bg-green-500 border-green-500 text-white shadow-md shadow-green-500/30"
                            : "bg-primary/10 border-primary/30 text-primary group-hover/option:bg-primary group-hover/option:text-primary-foreground group-hover/option:border-primary"
                        }`}
                      >
                        {isCorrect ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          option.label
                        )}
                      </div>

                      <div className="flex-1">
                        <span
                          className={`text-base leading-relaxed transition-colors ${
                            isCorrect
                              ? "text-green-800 dark:text-green-200 font-medium"
                              : "text-foreground/90 group-hover/option:text-foreground"
                          }`}
                        >
                          {option.text}
                        </span>

                        {isCorrect && (
                          <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
                            <CheckCircle className="h-3 w-3" />
                            Correct Answer
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

        {/* Explanation */}
        {question.explanation && (
          <div className="mb-6 p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/30">
            <div className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Explanation
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
              {question.explanation}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap gap-4 items-center justify-between pt-4 border-t border-border/30">
          <div className="flex flex-wrap gap-2">
            {question.subject && (
              <Badge variant="outline" className="text-xs">
                {question.subject}
              </Badge>
            )}
            {question.chapter && (
              <Badge variant="outline" className="text-xs">
                {question.chapter}
              </Badge>
            )}
            {question.subtopic && (
              <Badge variant="outline" className="text-xs">
                {getDisplaySubtopic(question.subtopic)}
              </Badge>
            )}
          </div>

          <Button
            onClick={() => onGetHelp(question)}
            variant="ghost"
            size="sm"
            className="text-primary hover:bg-primary/10"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Get Help
          </Button>
        </div>
      </div>
    </Card>
  );
}
