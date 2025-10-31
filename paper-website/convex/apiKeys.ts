import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate a random API key
function generateApiKey(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const key = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `gate_live_${key}`;
}

// Simple hash function (in production, use a proper hashing library)
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate new API key
export const generate = mutation({
  args: {
    name: v.string(),
    rateLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => 
        q.eq("clerkUserId", identity.subject)
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Generate API key
    const apiKey = generateApiKey();
    const keyHash = await hashApiKey(apiKey);
    const keyPrefix = apiKey.substring(0, 15) + "...";

    // Store hashed key in database
    const apiKeyId = await ctx.db.insert("apiKeys", {
      userId: user._id,
      keyHash,
      keyPrefix,
      name: args.name,
      isActive: true,
      rateLimit: args.rateLimit || 1000,
    });

    // Return the actual key only this once (user must save it)
    return {
      id: apiKeyId,
      key: apiKey, // Only shown once!
      name: args.name,
      keyPrefix,
    };
  },
});

// List user's API keys
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => 
        q.eq("clerkUserId", identity.subject)
      )
      .unique();

    if (!user) {
      return [];
    }

    const apiKeys = await ctx.db
      .query("apiKeys")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return apiKeys.map(key => ({
      id: key._id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      isActive: key.isActive,
      rateLimit: key.rateLimit,
      lastUsedAt: key.lastUsedAt,
      createdAt: key._creationTime,
      expiresAt: key.expiresAt,
    }));
  },
});

// Revoke/delete an API key
export const revoke = mutation({
  args: {
    keyId: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => 
        q.eq("clerkUserId", identity.subject)
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Verify the key belongs to the user
    const apiKey = await ctx.db.get(args.keyId);
    if (!apiKey || apiKey.userId !== user._id) {
      throw new Error("API key not found or unauthorized");
    }

    // Delete the key
    await ctx.db.delete(args.keyId);
  },
});

// Toggle API key active status
export const toggleActive = mutation({
  args: {
    keyId: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => 
        q.eq("clerkUserId", identity.subject)
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const apiKey = await ctx.db.get(args.keyId);
    if (!apiKey || apiKey.userId !== user._id) {
      throw new Error("API key not found or unauthorized");
    }

    await ctx.db.patch(args.keyId, {
      isActive: !apiKey.isActive,
    });
  },
});

// Verify API key (for public API access)
export const verify = query({
  args: {
    keyHash: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = await ctx.db
      .query("apiKeys")
      .withIndex("by_key_hash", (q) => q.eq("keyHash", args.keyHash))
      .unique();

    if (!apiKey || !apiKey.isActive) {
      return null;
    }

    // Check if expired
    if (apiKey.expiresAt && apiKey.expiresAt < Date.now()) {
      return null;
    }

    return {
      id: apiKey._id,
      userId: apiKey.userId,
      rateLimit: apiKey.rateLimit,
    };
  },
});

// Update last used timestamp
export const updateLastUsed = mutation({
  args: {
    keyId: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.keyId, {
      lastUsedAt: Date.now(),
    });
  },
});

// Get usage statistics
export const getUsageStats = query({
  args: {
    keyId: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => 
        q.eq("clerkUserId", identity.subject)
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const apiKey = await ctx.db.get(args.keyId);
    if (!apiKey || apiKey.userId !== user._id) {
      throw new Error("API key not found or unauthorized");
    }

    // Get usage logs for the last 24 hours
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const logs = await ctx.db
      .query("apiUsageLogs")
      .withIndex("by_api_key", (q) => 
        q.eq("apiKeyId", args.keyId).gte("timestamp", oneDayAgo)
      )
      .collect();

    return {
      totalRequests: logs.length,
      requestsToday: logs.length,
      rateLimit: apiKey.rateLimit,
      remainingRequests: Math.max(0, apiKey.rateLimit - logs.length),
    };
  },
});

