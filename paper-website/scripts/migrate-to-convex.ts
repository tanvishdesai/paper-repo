/**
 * Migrate Questions Data to Convex
 * 
 * This script:
 * 1. Reads all JSON files from public/data/
 * 2. Validates data structure against the schema
 * 3. Creates proper relationships between subjects, chapters, subtopics, and questions
 * 4. Initializes empty vector_embedding field for each question
 * 5. Migrates all data to Convex database
 * 
 * Run with: npm run migrate
 */

import { config } from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as fs from "fs";
import * as path from "path";

// Load environment variables from .env.local
config({ path: ".env.local" });

// Get Convex URL from environment
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error(
    "❌ Error: NEXT_PUBLIC_CONVEX_URL environment variable is not set"
  );
  process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL);

// Type definitions
interface QuestionData {
  year: number;
  paper_code: string;
  question_no: string;
  question_text: string;
  options?: string[];
  subject: string;
  chapter: string;
  subtopic: string;
  theoretical_practical: string;
  marks: number;
  provenance: string;
  confidence: number;
  correct_answer: string;
  has_diagram: boolean;
}

interface ProcessedQuestion extends QuestionData {
  questionId: string;
  vector_embedding?: number[];
}

interface SubjectData {
  name: string;
  description?: string;
  icon?: string;
  questionCount: number;
}

interface ChapterData {
  name: string;
  subject: string;
  questionCount: number;
}

interface SubtopicData {
  name: string;
  chapter: string;
  subject: string;
  questionCount: number;
}

class DataMigrator {
  private dataDir = path.join(process.cwd(), "public/data");
  private subjects = new Map<string, SubjectData>();
  private chapters = new Map<string, ChapterData>();
  private subtopics = new Map<string, SubtopicData>();
  private questions: ProcessedQuestion[] = [];
  private errors: string[] = [];

  /**
   * Get all JSON files from the data directory
   */
  private getDataFiles(): string[] {
    const files = fs.readdirSync(this.dataDir);
    return files
      .filter((file) => file.endsWith("-data.json"))
      .map((file) => path.join(this.dataDir, file));
  }

  /**
   * Generate a unique question ID
   */
  private generateQuestionId(
    year: number,
    paperCode: string,
    questionNo: string
  ): string {
    return `${year}-${paperCode}-${questionNo}`.toLowerCase().replace(/\s+/g, "-");
  }

  /**
   * Generate a unique key for chapters (subject + chapter name)
   */
  private generateChapterKey(subject: string, chapter: string): string {
    return `${subject}|${chapter}`;
  }

  /**
   * Generate a unique key for subtopics (subject + chapter + subtopic name)
   */
  private generateSubtopicKey(
    subject: string,
    chapter: string,
    subtopic: string
  ): string {
    return `${subject}|${chapter}|${subtopic}`;
  }

  /**
   * Validate a single question against the schema
   */
  private validateQuestion(question: unknown, fileIndex: number): QuestionData | null {
    const errors: string[] = [];

    // Type guard to check if question is an object
    if (typeof question !== 'object' || question === null) {
      this.errors.push(`File ${fileIndex}: Question is not an object`);
      return null;
    }

    const q = question as Record<string, unknown>;

    // Required fields check
    const requiredFields = [
      "year",
      "paper_code",
      "question_no",
      "question_text",
      "subject",
      "chapter",
      "subtopic",
      "theoretical_practical",
      "marks",
      "provenance",
      "confidence",
      "correct_answer",
      "has_diagram",
    ];

    for (const field of requiredFields) {
      if (q[field] === undefined || q[field] === null) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Type validation
    if (typeof q.year !== "number") errors.push("year must be a number");
    if (typeof q.marks !== "number") errors.push("marks must be a number");
    if (typeof q.confidence !== "number")
      errors.push("confidence must be a number");
    if (typeof q.has_diagram !== "boolean")
      errors.push("has_diagram must be a boolean");
    if (typeof q.question_text !== "string")
      errors.push("question_text must be a string");

    // Validate theoretical_practical enum
    if (!["theoretical", "practical"].includes(q.theoretical_practical as string)) {
      errors.push(
        'theoretical_practical must be "theoretical" or "practical"'
      );
    }

    // Validate options if provided
    if (q.options) {
      if (!Array.isArray(q.options)) {
        errors.push("options must be an array");
      } else if (q.options.length > 0) {
        if (!q.options.every((opt: unknown) => typeof opt === "string")) {
          errors.push("all options must be strings");
        }
      }
    }

    if (errors.length > 0) {
      this.errors.push(
        `File ${fileIndex}, Question ${q.question_no}: ${errors.join(", ")}`
      );
      return null;
    }

    return question as QuestionData;
  }

  /**
   * Read and process all data files
   */
  async readDataFiles(): Promise<void> {
    const files = this.getDataFiles();
    console.log(`\n📂 Found ${files.length} data files to process\n`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = path.basename(file);
      console.log(`📖 Processing ${fileName}...`);

      try {
        const data = JSON.parse(fs.readFileSync(file, "utf-8"));

        if (!Array.isArray(data)) {
          throw new Error(`File ${fileName} does not contain an array`);
        }

        let validCount = 0;
        for (const questionData of data) {
          const validated = this.validateQuestion(questionData, i);
          if (validated) {
            const processedQuestion: ProcessedQuestion = {
              ...validated,
              questionId: this.generateQuestionId(
                validated.year,
                validated.paper_code,
                validated.question_no
              ),
              vector_embedding: [], // Initialize empty for future use
            };

            this.questions.push(processedQuestion);

            // Track subjects
            if (!this.subjects.has(validated.subject)) {
              this.subjects.set(validated.subject, {
                name: validated.subject,
                questionCount: 0,
              });
            }
            (this.subjects.get(validated.subject) as SubjectData).questionCount++;

            // Track chapters
            const chapterKey = this.generateChapterKey(
              validated.subject,
              validated.chapter
            );
            if (!this.chapters.has(chapterKey)) {
              this.chapters.set(chapterKey, {
                name: validated.chapter,
                subject: validated.subject,
                questionCount: 0,
              });
            }
            (this.chapters.get(chapterKey) as ChapterData).questionCount++;

            // Track subtopics
            const subtopicKey = this.generateSubtopicKey(
              validated.subject,
              validated.chapter,
              validated.subtopic
            );
            if (!this.subtopics.has(subtopicKey)) {
              this.subtopics.set(subtopicKey, {
                name: validated.subtopic,
                chapter: validated.chapter,
                subject: validated.subject,
                questionCount: 0,
              });
            }
            (this.subtopics.get(subtopicKey) as SubtopicData).questionCount++;

            validCount++;
          }
        }

        console.log(`  ✅ Valid: ${validCount}/${data.length}`);
      } catch (error) {
        console.error(`  ❌ Error reading file: ${error}`);
      }
    }

    console.log("\n📊 Data Summary:");
    console.log(`  Total questions read: ${this.questions.length}`);
    console.log(`  Total subjects: ${this.subjects.size}`);
    console.log(`  Total chapters: ${this.chapters.size}`);
    console.log(`  Total subtopics: ${this.subtopics.size}`);

    if (this.errors.length > 0) {
      console.log(`\n⚠️  Validation Errors (${this.errors.length}):`);
      this.errors.forEach((error) => console.log(`  - ${error}`));
    }
  }

  /**
   * Migrate all data to Convex
   */
  async migrateToConvex(): Promise<void> {
    console.log("\n🚀 Starting migration to Convex...\n");

    try {
      // Step 1: Migrate subjects
      console.log("📝 Migrating subjects...");
      let subjectCount = 0;
      for (const [, subject] of this.subjects) {
        await convex.mutation(api.questions.createSubject, {
          name: subject.name,
          questionCount: subject.questionCount,
        });
        subjectCount++;
      }
      console.log(`  ✅ Created ${subjectCount} subjects\n`);

      // Step 2: Migrate chapters
      console.log("📚 Migrating chapters...");
      let chapterCount = 0;
      for (const [, chapter] of this.chapters) {
        await convex.mutation(api.questions.createChapter, {
          name: chapter.name,
          subject: chapter.subject,
          questionCount: chapter.questionCount,
        });
        chapterCount++;
      }
      console.log(`  ✅ Created ${chapterCount} chapters\n`);

      // Step 3: Migrate subtopics
      console.log("🔖 Migrating subtopics...");
      let subtopicCount = 0;
      for (const [, subtopic] of this.subtopics) {
        await convex.mutation(api.questions.createSubtopic, {
          name: subtopic.name,
          chapter: subtopic.chapter,
          subject: subtopic.subject,
          questionCount: subtopic.questionCount,
        });
        subtopicCount++;
      }
      console.log(`  ✅ Created ${subtopicCount} subtopics\n`);

      // Step 4: Migrate questions (in batches to avoid overload)
      console.log("❓ Migrating questions...");
      const batchSize = 100;
      for (let i = 0; i < this.questions.length; i += batchSize) {
        const batch = this.questions.slice(
          i,
          Math.min(i + batchSize, this.questions.length)
        );
        for (const question of batch) {
          await convex.mutation(api.questions.createQuestion, {
            questionId: question.questionId,
            question_no: question.question_no,
            question_text: question.question_text,
            year: question.year,
            paper_code: question.paper_code,
            subject: question.subject,
            chapter: question.chapter,
            subtopic: question.subtopic,
            marks: question.marks,
            theoretical_practical: question.theoretical_practical,
            provenance: question.provenance,
            confidence: question.confidence,
            correct_answer: question.correct_answer,
            has_diagram: question.has_diagram,
            options: question.options || undefined, // Convert null to undefined
            vector_embedding: [], // Empty array, ready for embeddings
          });
        }
        const progress = Math.min(i + batchSize, this.questions.length);
        console.log(
          `  ${Math.round((progress / this.questions.length) * 100)}% complete (${progress}/${this.questions.length})`
        );
      }
      console.log(`  ✅ Created ${this.questions.length} questions\n`);

      console.log("✨ Migration completed successfully!");
      console.log("\n📊 Final Summary:");
      console.log(`  ✅ ${subjectCount} subjects migrated`);
      console.log(`  ✅ ${chapterCount} chapters migrated`);
      console.log(`  ✅ ${subtopicCount} subtopics migrated`);
      console.log(`  ✅ ${this.questions.length} questions migrated`);
    } catch (error) {
      console.error("❌ Error during migration:", error);
      throw error;
    }
  }

  /**
   * Run the complete migration process
   */
  async run(): Promise<void> {
    console.log("🔄 Starting Data Migration Process\n");
    console.log("=====================================\n");

    try {
      await this.readDataFiles();
      await this.migrateToConvex();

      console.log("\n=====================================");
      console.log("✨ All data migrated successfully!\n");
    } catch (error) {
      console.error("\n❌ Migration failed:", error);
      process.exit(1);
    }
  }
}

// Run migration
const migrator = new DataMigrator();
migrator
  .run()
  .then(() => {
    console.log("✅ Process completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Process failed:", error);
    process.exit(1);
  });
