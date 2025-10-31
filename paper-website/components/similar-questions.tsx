"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, ChevronRight, Loader2, Search, Filter, X } from "lucide-react";
import { Question } from "@/types/question";

interface SimilarQuestion extends Question {
  similarityScore?: number;
  similarityReason?: string;
}

interface SimilarQuestionsProps {
  questionId: string;
  onQuestionClick?: (question: Question) => void;
  currentQuestionText?: string;
}

export function SimilarQuestions({ questionId, onQuestionClick, currentQuestionText }: SimilarQuestionsProps) {
  const [similarQuestions, setSimilarQuestions] = useState<SimilarQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [algorithm, setAlgorithm] = useState<"graph" | "text">("graph");

  const fetchSimilarQuestions = async (useSearch: boolean = false) => {
    if (hasLoaded && !useSearch) {
      // If already loaded, just toggle expanded state
      setExpanded(!expanded);
      return;
    }

    try {
      setLoading(true);
      setExpanded(true);

      const params = new URLSearchParams({
        limit: "5",
        algorithm: useSearch && searchQuery.trim() ? "text" : "graph"
      });

      if (useSearch && searchQuery.trim()) {
        params.set("search", searchQuery);
      }

      const response = await fetch(`/api/v1/questions/${questionId}/similar?${params}`);

      if (response.ok) {
        const data = await response.json();
        setSimilarQuestions(data.data || []);
        setHasLoaded(true);
      }
    } catch (error) {
      console.error("Error fetching similar questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchSimilarQuestions(true);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setAlgorithm("graph");
    fetchSimilarQuestions(false);
  };

  // Don't render anything until user clicks the button
  if (!hasLoaded && !loading) {
    return (
      <div className="mt-6 pt-6 border-t border-border/30">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchSimilarQuestions(false)}
          className="w-full gap-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/30 transition-all duration-300"
        >
          <Sparkles className="h-4 w-4 text-purple-500" />
          <span>Find Similar Questions</span>
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-6 pt-6 border-t border-border/30">
        <div className="flex items-center justify-center gap-2 text-muted-foreground py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">
            Finding similar questions{algorithm === "text" && searchQuery ? ` for "${searchQuery}"` : ""}...
          </span>
        </div>
      </div>
    );
  }

  if (similarQuestions.length === 0 && hasLoaded) {
    return (
      <div className="mt-6 pt-6 border-t border-border/30">
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">No similar questions found</p>
          {currentQuestionText && (
            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">Try searching for keywords:</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter keywords to search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="text-sm"
                />
                <Button size="sm" onClick={handleSearch} disabled={!searchQuery.trim()}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 pt-6 border-t border-border/30">
      <div
        className="flex items-center justify-between cursor-pointer group mb-4"
        onClick={() => fetchSimilarQuestions(false)}
      >
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-purple-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              Similar Questions
              <Badge variant="secondary" className="text-xs">
                {similarQuestions.length}
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              {algorithm === "text" ? "Text-based similarity" : "Graph-based relationships"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasLoaded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                clearSearch();
              }}
              className="gap-1 h-6 px-2 text-xs"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <Button variant="ghost" size="sm" className="gap-1">
            <ChevronRight className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Search Interface */}
      {expanded && currentQuestionText && (
        <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Search for similar questions:</span>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Enter keywords (e.g., 'dynamic programming', 'sorting')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="text-sm"
            />
            <Button size="sm" onClick={handleSearch} disabled={!searchQuery.trim()}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {expanded && (
        <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
          {similarQuestions.map((question, index) => (
            <div
              key={question.questionId || index}
              className="group/similar relative p-4 rounded-xl border border-border/50 bg-gradient-to-br from-accent/30 via-accent/20 to-accent/30 hover:border-purple-500/30 hover:bg-accent/50 transition-all duration-300 cursor-pointer"
              onClick={() => onQuestionClick && onQuestionClick(question)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xs font-medium text-purple-500">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {question.year && (
                      <Badge variant="outline" className="text-xs border-purple-500/20 text-purple-500">
                        {question.year}
                      </Badge>
                    )}
                    {question.marks != null && (
                      <Badge variant="secondary" className="text-xs">
                        {question.marks}M
                      </Badge>
                    )}
                    {question.similarityReason && (
                      <Badge variant="outline" className="text-xs border-green-500/20 text-green-600">
                        {question.similarityReason}
                      </Badge>
                    )}
                    {question.similarityScore && (
                      <Badge variant="outline" className="text-xs">
                        {question.similarityScore.toFixed(1)}⭐
                      </Badge>
                    )}
                  </div>
                  {question.subtopic && (
                    <div className="text-xs text-muted-foreground mb-1">
                      {question.subtopic}
                    </div>
                  )}
                  <p className="text-sm text-foreground/80 line-clamp-2 group-hover/similar:text-foreground transition-colors">
                    {question.question_text}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover/similar:opacity-100 transition-opacity flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

