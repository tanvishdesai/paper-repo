import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, Play } from "lucide-react";
import type { Question } from "@/types/question";

interface QuestionsHeaderProps {
  subjectName: string;
  subjectIcon?: string;
  totalQuestions: number;
  practiceQuestionsCount: number;
  onStartPractice: () => void;
  showPracticeButton?: boolean;
}

export function QuestionsHeader({
  subjectName,
  subjectIcon,
  totalQuestions,
  practiceQuestionsCount,
  onStartPractice,
  showPracticeButton = true,
}: QuestionsHeaderProps) {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
                <span className="text-xl">{subjectIcon || "📚"}</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  {subjectName}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {totalQuestions} question{totalQuestions !== 1 ? "s" : ""}
                  {practiceQuestionsCount > 0 && (
                    <span className="ml-1 text-primary/80">
                      • {practiceQuestionsCount} practice question{practiceQuestionsCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {showPracticeButton && practiceQuestionsCount > 0 && (
              <Button onClick={onStartPractice} className="gap-2 shadow-lg hover:shadow-xl transition-all duration-300">
                <Play className="h-4 w-4" />
                Practice Mode
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
