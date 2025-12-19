import { notFound } from "next/navigation";
import Link from "next/link";
import { getSubjects, getChapters } from "@/lib/notes";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{
    subject: string;
    chapter: string;
  }>;
}

export default async function ChapterPage({ params }: PageProps) {
  const { subject: subjectSlug, chapter: chapterSlug } = await params;

  // Verify existence (optional, but good for 404s)
  const chapters = getChapters(subjectSlug);
  const exists = chapters.some(c => c.slug === chapterSlug);

  if (!exists) {
    notFound();
  }

  const subjectName = decodeURIComponent(subjectSlug);
  
  // Construct the public URL path
  const noteUrl = `/html-notes/${subjectName}/${decodeURIComponent(chapterSlug)}.html`;

  return (
    <div className="fixed inset-0 md:left-64 top-0 z-30 bg-background flex flex-col">
      <div className="flex items-center gap-4 p-4 border-b shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/notes/${subjectSlug}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to {subjectName}
          </Link>
        </Button>
        <span className="font-semibold text-lg truncate ml-2">{decodeURIComponent(chapterSlug)}</span>
      </div>

      <div className="flex-1 w-full bg-background relative">
        <iframe 
          src={noteUrl} 
          className="w-full h-full border-none absolute inset-0"
          title="Note Content"
        />
      </div>
    </div>
  );
}

// Generate static params for all chapters
export async function generateStaticParams() {
  const subjects = getSubjects();
  const params: { subject: string; chapter: string }[] = [];

  for (const subject of subjects) {
    const chapters = getChapters(subject.slug);
    for (const chapter of chapters) {
      params.push({
        subject: subject.slug,
        chapter: chapter.slug,
      });
    }
  }

  return params;
}
