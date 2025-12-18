import fs from 'fs';
import path from 'path';

// Define the root directory for notes
const NOTES_DIR = path.join(process.cwd(), 'public', 'html-notes');

export interface Subject {
  name: string;
  slug: string; // URL-friendly name
}

export interface Chapter {
  name: string; // Display name (filename without extension)
  slug: string; // URL-friendly name (filename)
}

export function getSubjects(): Subject[] {
  if (!fs.existsSync(NOTES_DIR)) {
    return [];
  }

  const entries = fs.readdirSync(NOTES_DIR, { withFileTypes: true });

  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => ({
      name: entry.name,
      slug: encodeURIComponent(entry.name)
    }));
}

export function getChapters(subjectSlug: string): Chapter[] {
  const subjectName = decodeURIComponent(subjectSlug);
  const subjectDir = path.join(NOTES_DIR, subjectName);

  if (!fs.existsSync(subjectDir)) {
    return [];
  }

  const entries = fs.readdirSync(subjectDir, { withFileTypes: true });

  return entries
    .filter(entry => entry.isFile() && entry.name.endsWith('.html'))
    .map(entry => {
      const name = entry.name.replace(/\.html$/, '');
      return {
        name: name,
        slug: encodeURIComponent(name)
      };
    });
}
