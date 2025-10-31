import { mutation, query } from "./_generated/server";

// Get or create user from Clerk authentication
export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if user already exists
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => 
        q.eq("clerkUserId", identity.subject)
      )
      .unique();

    if (user !== null) {
      return user._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkUserId: identity.subject,
      email: identity.email!,
      name: identity.name,
    });

    return userId;
  },
});

// Get current user
export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => 
        q.eq("clerkUserId", identity.subject)
      )
      .unique();

    return user;
  },
});

