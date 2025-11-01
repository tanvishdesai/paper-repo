import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema(
  {
    questions: defineTable({
      // Original fields
      originalId: v.number(), // The id from your JSON (144415)
      question: v.string(), // HTML content
      explanation: v.optional(v.string()),
      year: v.optional(v.number()),
      subject: v.optional(v.string()),
      chapter: v.optional(v.string()),
      questionType: v.optional(v.string()), // "MCQ", etc.

      // Metadata
      createdOn: v.optional(v.string()),
      updatedOn: v.optional(v.string()),

      // Computed fields for optimization
      similarQuestionsComputed: v.boolean(), // Flag to track if similar questions have been computed
      similarQuestionIds: v.optional(v.array(v.id("questions"))), // Array of Convex document IDs

      // Composite key for efficient grouping
      subjectChapter: v.optional(v.string()), // "Operating System::Concurrency & Synchronization"
    })
      .index("by_year", ["year"])
      .index("by_subject_chapter", ["subjectChapter", "year"]) // Primary index for similar questions
      .index("by_subject", ["subject", "chapter", "year"]) // Alternative compound index
      .index("by_original_id", ["originalId"]) // For lookups during migration
      .searchIndex("search_content", {
        searchField: "question",
        filterFields: ["subject", "chapter", "year"],
      }),

    answers: defineTable({
      questionId: v.id("questions"), // Reference to parent question
      originalId: v.number(), // The id from your JSON (552655)
      answer: v.string(), // HTML content
      correct: v.boolean(),
      sortOrder: v.number(),
    })
      .index("by_question", ["questionId", "sortOrder"]) // Get all answers for a question, sorted
      .index("by_correct", ["questionId", "correct"]), // Quickly find correct answer

    // Optional: User progress tracking
    userProgress: defineTable({
      userId: v.string(), // Auth user ID
      questionId: v.id("questions"),
      attempted: v.boolean(),
      correct: v.boolean(),
      attemptedAt: v.number(), // timestamp
    })
      .index("by_user", ["userId", "questionId"])
      .index("by_user_attempted", ["userId", "attempted"]),
  },
  { schemaValidation: true }
);
