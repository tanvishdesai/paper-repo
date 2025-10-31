import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    clerkUserId: v.string(),
  })
    .index("by_email", ["email"])
    .index("by_clerk_user_id", ["clerkUserId"]),

  apiKeys: defineTable({
    userId: v.id("users"),
    keyHash: v.string(), // Hashed API key
    keyPrefix: v.string(), // First 8 chars for display (e.g., "gate_liv")
    name: v.string(), // User-friendly label
    isActive: v.boolean(),
    rateLimit: v.number(), // requests per day
    lastUsedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_key_hash", ["keyHash"])
    .index("by_is_active", ["isActive"]),

  apiUsageLogs: defineTable({
    apiKeyId: v.id("apiKeys"),
    userId: v.id("users"),
    endpoint: v.string(),
    method: v.string(),
    statusCode: v.number(),
    timestamp: v.number(),
  })
    .index("by_api_key", ["apiKeyId", "timestamp"])
    .index("by_user", ["userId", "timestamp"]),

  // Questions table
  questions: defineTable({
    questionId: v.string(), // Unique identifier
    question_no: v.string(), // e.g., "Q.21"
    question_text: v.string(),
    year: v.number(),
    paper_code: v.string(), // e.g., "CS2"
    subject: v.string(),
    chapter: v.string(),
    subtopic: v.string(),
    marks: v.number(), // Question marks/points
    theoretical_practical: v.string(), // "theoretical" or "practical"
    provenance: v.string(), // Source of the question
    confidence: v.number(), // Confidence score (0-1)
    correct_answer: v.string(), // The correct answer
    has_diagram: v.boolean(), // Whether question contains a diagram
    options: v.optional(v.array(v.string())), // Multiple choice options (null for NAT questions)
    vector_embedding: v.optional(v.array(v.number())), // Vector embedding for similarity search (empty initially)
  })
    .index("by_question_id", ["questionId"])
    .index("by_subject", ["subject"])
    .index("by_year", ["year"])
    .index("by_subject_year", ["subject", "year"])
    .index("by_chapter", ["chapter"])
    .index("by_subtopic", ["subtopic"])
    .index("by_year_paper", ["year", "paper_code"])
    .vectorIndex("by_embedding", {
      vectorField: "vector_embedding",
      dimensions: 1536, // OpenAI embedding dimensions
    })
    .searchIndex("search_question_text", {
      searchField: "question_text",
      filterFields: ["subject", "year", "chapter", "subtopic"],
    }),

  // Subjects table for quick reference and stats
  subjects: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    questionCount: v.number(),
  })
    .index("by_name", ["name"]),

  // Chapters table for organizing questions
  chapters: defineTable({
    name: v.string(),
    subject: v.string(),
    questionCount: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_subject", ["subject"]),

  // Subtopics table for detailed classification
  subtopics: defineTable({
    name: v.string(),
    chapter: v.string(),
    subject: v.string(),
    questionCount: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_chapter", ["chapter"])
    .index("by_subject", ["subject"]),
});

