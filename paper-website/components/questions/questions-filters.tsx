import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, SortAsc, X } from "lucide-react";

interface QuestionsFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  yearFilter: string;
  onYearFilterChange: (value: string) => void;
  chapterFilter: string;
  onChapterFilterChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  years: number[];
  chapters: string[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function QuestionsFilters({
  searchQuery,
  onSearchChange,
  yearFilter,
  onYearFilterChange,
  chapterFilter,
  onChapterFilterChange,
  sortBy,
  onSortByChange,
  years,
  chapters,
  hasActiveFilters,
  onClearFilters,
}: QuestionsFiltersProps) {
  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search questions..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-12 h-12 text-base border-2 border-border/50 focus:border-primary/50 transition-colors"
        />
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2 text-foreground/80">
            <Filter className="h-4 w-4" />
            Year
          </label>
          <Select value={yearFilter} onValueChange={onYearFilterChange}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2 text-foreground/80">
            <Filter className="h-4 w-4" />
            Chapter
          </label>
          <Select value={chapterFilter} onValueChange={onChapterFilterChange}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Chapters</SelectItem>
              {chapters.map((chapter) => (
                <SelectItem key={chapter} value={chapter}>
                  {chapter}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2 text-foreground/80">
            <SortAsc className="h-4 w-4" />
            Sort By
          </label>
          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="year-desc">Year (Newest First)</SelectItem>
              <SelectItem value="year-asc">Year (Oldest First)</SelectItem>
              <SelectItem value="chapter-asc">Chapter (A-Z)</SelectItem>
              <SelectItem value="chapter-desc">Chapter (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-xl border border-border/50">
          <span className="text-sm font-medium text-foreground/80">Active filters:</span>

          {searchQuery && (
            <Badge variant="secondary" className="gap-2 bg-primary/10 text-primary border-primary/20">
              <Search className="h-3 w-3" />
              {searchQuery}
            </Badge>
          )}

          {yearFilter !== "all" && (
            <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
              Year: {yearFilter}
            </Badge>
          )}

          {chapterFilter !== "all" && (
            <Badge variant="secondary" className="bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
              Chapter: {chapterFilter}
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-7 px-2 text-muted-foreground hover:text-foreground gap-1"
          >
            <X className="h-3 w-3" />
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}
