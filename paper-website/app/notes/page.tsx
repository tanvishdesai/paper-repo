import Link from "next/link";
import { getSubjects } from "@/lib/notes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default function NotesIndexPage() {
  const subjects = getSubjects();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Cheat Sheets</h1>
        <p className="text-muted-foreground">
          Select a subject to view available cheat sheets and summaries.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((subject) => (
          <Link key={subject.slug} href={`/notes/${subject.slug}`}>
            <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  {subject.name}
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  View notes
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
