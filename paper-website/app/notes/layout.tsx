import Link from "next/link";
import { getSubjects } from "@/lib/notes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const subjects = getSubjects();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card/50 hidden md:block shrink-0">
        <div className="p-4 border-b">
          <Link href="/notes" className="font-bold text-lg text-primary">
            Subject Notes
          </Link>
        </div>
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="p-4 space-y-2">
            {subjects.map((subject) => (
              <Button
                key={subject.slug}
                variant="ghost"
                className="w-full justify-start font-normal truncate"
                asChild
              >
                <Link href={`/notes/${subject.slug}`}>
                  {subject.name}
                </Link>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  );
}
