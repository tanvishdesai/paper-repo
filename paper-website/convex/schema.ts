import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema(
  {
    gateQuestions: defineTable({
      year: v.number(),
      questionNumber: v.number(),
      questionText: v.string(),
      questionImages: v.optional(v.string()),
      optionA: v.string(),
      optionAImages: v.optional(v.string()),
      optionB: v.string(),
      optionBImages: v.optional(v.string()),
      optionC: v.string(),
      optionCImages: v.optional(v.string()),
      optionD: v.string(),
      optionDImages: v.optional(v.string()),
      correctAnswer: v.union(v.literal("A"), v.literal("B"), v.literal("C"), v.literal("D")),
      questionType: v.string(),
      explanation: v.string(),
      explanationImages: v.optional(v.string()),
      subject: v.optional(v.string()),
      chapter: v.optional(v.string()),
      subtopic: v.optional(v.string()),
    })
    .index("by_year", ["year"])
    .index("by_subject", ["subject"])
    .index("by_chapter", ["chapter"])
    .index("by_year_subject", ["year", "subject"])
    .index("by_year_chapter", ["year", "chapter"])
    .index("by_subject_chapter", ["subject", "chapter"]),
  },
  { schemaValidation: true }
);
