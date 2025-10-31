import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const insertGateQuestion = mutation({
  args: {
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
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("gateQuestions", args);
    return null;
  },
});

export const insertGateQuestionsBulk = mutation({
  args: {
    questions: v.array(v.object({
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
    })),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const question of args.questions) {
      await ctx.db.insert("gateQuestions", question);
    }
    return null;
  },
});

export const clearAllQuestions = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Delete in batches to avoid the 4096 read limit
    const batchSize = 100;
    let hasMore = true;

    while (hasMore) {
      const questions = await ctx.db.query("gateQuestions").take(batchSize);
      if (questions.length === 0) {
        hasMore = false;
      } else {
        for (const question of questions) {
          await ctx.db.delete(question._id);
        }
      }
    }
    return null;
  },
});
