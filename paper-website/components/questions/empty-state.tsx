import { Card } from "@/components/ui/card";
import { BookOpen, Search } from "lucide-react";

interface EmptyStateProps {
  hasFilters: boolean;
  searchQuery: string;
}

export function EmptyState({ hasFilters, searchQuery }: EmptyStateProps) {
  return (
    <Card className="p-16 text-center border-dashed">
      <div className="max-w-md mx-auto">
        {hasFilters ? (
          <>
            <Search className="h-16 w-16 text-muted-foreground/60 mx-auto mb-6" />
            <h3 className="text-xl font-semibold mb-3">No questions match your filters</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? `No questions found containing "${searchQuery}". Try adjusting your search or filters.`
                : "Try adjusting your filters to see more questions."
              }
            </p>
          </>
        ) : (
          <>
            <BookOpen className="h-16 w-16 text-muted-foreground/60 mx-auto mb-6" />
            <h3 className="text-xl font-semibold mb-3">No questions available</h3>
            <p className="text-muted-foreground mb-6">
              There are no questions available for this subject at the moment.
            </p>
          </>
        )}
      </div>
    </Card>
  );
}
