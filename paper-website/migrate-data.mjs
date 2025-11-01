import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ConvexClient } from "convex/browser";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, ".env.local") });

// Check if the Convex URL is set
if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  console.error(
    "❌ Error: NEXT_PUBLIC_CONVEX_URL is not set in .env.local"
  );
  console.error(
    "   Please ensure .env.local contains: NEXT_PUBLIC_CONVEX_URL=your-deployment-url"
  );
  process.exit(1);
}

// Initialize Convex client
const convex = new ConvexClient(process.env.NEXT_PUBLIC_CONVEX_URL);

const JSONS_DIR = path.join(__dirname, "public", "jsons raw_cleaned");

/**
 * Read all JSON files from the directory
 */
function getAllJsonFiles() {
  try {
    const files = fs.readdirSync(JSONS_DIR);
    return files
      .filter((file) => file.endsWith(".json"))
      .map((file) => path.join(JSONS_DIR, file));
  } catch (error) {
    console.error("Error reading directory:", error);
    return [];
  }
}

/**
 * Parse JSON file and extract questions
 */
function parseJsonFile(filePath) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return data.results || [];
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
    return [];
  }
}

/**
 * Transform JSON question data to match new schema
 */
function transformQuestion(jsonQuestion) {
  // Handle null/undefined values - allow them to be optional
  const subject = jsonQuestion.subject ?? undefined;
  const chapter = jsonQuestion.chapter ?? undefined;
  const year = jsonQuestion.year ?? undefined;
  
  // Construct subjectChapter only if both subject and chapter are present
  // Otherwise, it will be undefined (optional)
  const subjectChapter = 
    subject && chapter 
      ? `${subject}::${chapter}` 
      : undefined;

  return {
    originalId: jsonQuestion.id,
    question: jsonQuestion.question,
    explanation: jsonQuestion.explanation ?? undefined,
    year: year,
    subject: subject,
    chapter: chapter,
    questionType: jsonQuestion.question_type ?? undefined,
    createdOn: jsonQuestion.created_on ?? undefined,
    updatedOn: jsonQuestion.updated_on ?? undefined,
    subjectChapter: subjectChapter,
    similarQuestionsComputed: false,
  };
}

/**
 * Transform JSON answer data to match new schema
 */
function transformAnswers(jsonAnswers, questionId) {
  return jsonAnswers.map((answer) => ({
    questionId: questionId,
    originalId: answer.id,
    answer: answer.answer,
    correct: answer.correct,
    sortOrder: answer.sort_order,
  }));
}

/**
 * Import questions and answers using mutations
 */
async function importData() {
  console.log("🚀 Starting data migration...");
  console.log(`📂 Looking for JSON files in: ${JSONS_DIR}\n`);

  const jsonFiles = getAllJsonFiles();
  console.log(`📋 Found ${jsonFiles.length} JSON files to import\n`);

  let totalQuestions = 0;
  let totalAnswers = 0;
  let totalErrors = 0;

  for (const filePath of jsonFiles) {
    const fileName = path.basename(filePath);
    console.log(`📥 Processing: ${fileName}`);

    try {
      const questions = parseJsonFile(filePath);
      console.log(
        `   Found ${questions.length} questions in ${fileName}`
      );

      for (const jsonQuestion of questions) {
        try {
          // Transform and insert question
          const questionData = transformQuestion(jsonQuestion);

          // Use the internal mutation to insert question
          const questionId = await convex.mutation("questions:importQuestion", {
            questionData,
          });

          // Transform and insert answers
          if (jsonQuestion.answers && jsonQuestion.answers.length > 0) {
            const answerData = transformAnswers(
              jsonQuestion.answers,
              questionId
            );

            await convex.mutation("questions:importAnswers", {
              answers: answerData,
            });

            totalAnswers += answerData.length;
          }

          totalQuestions++;

          // Log progress every 50 questions
          if (totalQuestions % 50 === 0) {
            console.log(`   ✓ Processed ${totalQuestions} questions...`);
          }
        } catch (error) {
          totalErrors++;
          console.error(
            `   ✗ Error importing question ${jsonQuestion.id}:`,
            error.message
          );
        }
      }

      console.log(
        `   ✓ Completed ${fileName}: ${questions.length} questions\n`
      );
    } catch (error) {
      console.error(`✗ Error processing ${fileName}:`, error.message);
      totalErrors++;
    }
  }

  console.log("\n✅ Migration Summary:");
  console.log(`   Total questions imported: ${totalQuestions}`);
  console.log(`   Total answers imported: ${totalAnswers}`);
  console.log(`   Total errors: ${totalErrors}`);
  console.log("\n📊 Starting to pre-compute similar questions...");

  try {
    const result = await convex.mutation(
      "questions:precomputeAllSimilarQuestions"
    );
    console.log("✓ Pre-computation complete:");
    console.log(`   Total questions: ${result.totalQuestions}`);
    console.log(`   Processed: ${result.processedCount}`);
    console.log(`   Skipped: ${result.skippedCount}`);
  } catch (error) {
    console.error("✗ Error pre-computing similar questions:", error.message);
  }

  console.log("\n🎉 Migration completed!");
}

// Run the migration
importData().catch((error) => {
  console.error("Fatal error during migration:", error);
  process.exit(1);
});
