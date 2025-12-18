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
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      <div className="flex items-center gap-4 mb-4 shrink-0">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/notes/${subjectSlug}`} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to {subjectName}
          </Link>
        </Button>
      </div>

      <div className="flex-1 w-full bg-white rounded-lg border overflow-hidden">
        <iframe 
          src={noteUrl} 
          className="w-full h-full border-none"
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
