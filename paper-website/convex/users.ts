import { mutation } from "./_generated/server";

export const store = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", userId))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    // Create new user
    // Note: In a real app, you'd fetch user details from Clerk
    // For now, we'll store basic info
    const newUserId = await ctx.db.insert("users", {
      clerkId: userId,
      email: "", // You can fetch this from Clerk if needed
      createdAt: Date.now(),
    });

    return newUserId;
  },
});

