import { notFound } from "next/navigation";
import Link from "next/link";
import { getSubjects, getChapters } from "@/lib/notes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{
    subject: string;
  }>;
}

export default async function SubjectPage({ params }: PageProps) {
  const { subject: subjectSlug } = await params;
  
  // Verify subject exists (optional but good for 404)
  const subjects = getSubjects();
  const subject = subjects.find(s => s.slug === subjectSlug);

  if (!subject) {
    notFound();
  }

  const chapters = getChapters(subjectSlug);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="container mx-auto max-w-5xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/notes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">{subject.name}</h1>
            <p className="text-muted-foreground">Select a chapter to read.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {chapters.map((chapter) => (
            <Link key={chapter.slug} href={`/notes/${subjectSlug}/${chapter.slug}`}>
              <Card className="hover:bg-muted/50 transition-all hover:scale-[1.02] cursor-pointer border-border/60 hover:border-primary/50 shadow-sm hover:shadow-md">
                <CardHeader className="flex flex-row items-center space-y-0 pb-2 gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base font-medium leading-none">
                    {chapter.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                   {/* Optional description or metadata if available */}
                </CardContent>
              </Card>
            </Link>
          ))}

          {chapters.length === 0 && (
            <p className="text-muted-foreground col-span-2">No chapters found for this subject.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Generate static params for build time (optional but recommended for SSG)
export async function generateStaticParams() {
  const subjects = getSubjects();
  return subjects.map((subject) => ({
    subject: subject.slug,
  }));
}
