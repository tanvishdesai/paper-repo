import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Generate and cache global statistics
 * This is an expensive operation that scans the entire database.
 * It should be called periodically (e.g., via cron) or manually, not on every page load.
 */
export const generateStats = mutation({
    handler: async (ctx) => {
        const questions = await ctx.db.query("questions").collect();

        // 1. Total Questions
        const totalQuestions = questions.length;

        // 2. Subject Breakdown
        const subjectCounts: Record<string, number> = {};
        const subjectsSet = new Set<string>();

        for (const q of questions) {
            if (q.subject && q.subject.trim()) {
                const subject = q.subject.trim();
                subjectsSet.add(subject);
                subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
            }
        }

        const subjects = Array.from(subjectsSet).sort();

        // 3. Save to stats table
        // Check if a global stats record already exists
        const existing = await ctx.db
            .query("stats")
            .withIndex("by_type", (q) => q.eq("type", "global"))
            .first();

        const data = {
            type: "global",
            totalQuestions,
            subjects,
            subjectCounts,
            updatedAt: Date.now(),
        };

        if (existing) {
            await ctx.db.patch(existing._id, data);
        } else {
            await ctx.db.insert("stats", data);
        }

        return data;
    },
});

/**
 * Get cached statistics
 * This is extremely fast as it only reads a single document.
 */
export const getStats = query({
    handler: async (ctx) => {
        const stats = await ctx.db
            .query("stats")
            .withIndex("by_type", (q) => q.eq("type", "global"))
            .first();

        return stats;
    },
});
