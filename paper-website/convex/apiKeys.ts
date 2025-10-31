import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Generate a random API key
function generateApiKey(): string {
  const prefix = "gate_";
  const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return prefix + randomBytes;
}

// Hash API key using SHA-256
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Get key prefix for display (first 12 characters)
function getKeyPrefix(key: string): string {
  return key.substring(0, 12) + "...";
}

// List all API keys for the current user
export const list = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    // Find user by clerkId
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", userId))
      .first();

    if (!user) {
      return [];
    }

    // Get all API keys for this user
    const keys = await ctx.db
      .query("apiKeys")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    // Return keys with id field for the frontend
    return keys.map((key) => ({
      id: key._id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      isActive: key.isActive,
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt,
      rateLimit: key.rateLimit,
    }));
  },
});

// Generate a new API key
export const generate = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    // Find user by clerkId
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Generate new API key
    const apiKey = generateApiKey();
    const keyHash = await hashApiKey(apiKey);
    const keyPrefix = getKeyPrefix(apiKey);

    // Store the API key
    const keyId = await ctx.db.insert("apiKeys", {
      userId: user._id,
      name: args.name,
      keyHash,
      keyPrefix,
      isActive: true,
      rateLimit: 1000, // Default rate limit
      createdAt: Date.now(),
    });

    // Return the full key (only shown once)
    return {
      key: apiKey,
      id: keyId,
    };
  },
});

// Revoke (delete) an API key
export const revoke = mutation({
  args: {
    keyId: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    // Find user by clerkId
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get the API key
    const apiKey = await ctx.db.get(args.keyId);
    if (!apiKey) {
      throw new Error("API key not found");
    }

    // Verify ownership
    if (apiKey.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // Delete the API key
    await ctx.db.delete(args.keyId);
  },
});

// Toggle active status of an API key
export const toggleActive = mutation({
  args: {
    keyId: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    // Find user by clerkId
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get the API key
    const apiKey = await ctx.db.get(args.keyId);
    if (!apiKey) {
      throw new Error("API key not found");
    }

    // Verify ownership
    if (apiKey.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // Toggle active status
    await ctx.db.patch(args.keyId, {
      isActive: !apiKey.isActive,
    });
  },
});

// Verify an API key by hash (used in API routes)
export const verify = query({
  args: {
    keyHash: v.string(),
  },
  handler: async (ctx, args) => {
    // Find API key by hash
    const apiKey = await ctx.db
      .query("apiKeys")
      .withIndex("by_keyHash", (q) => q.eq("keyHash", args.keyHash))
      .first();

    if (!apiKey || !apiKey.isActive) {
      return null;
    }

    // Return key data
    return {
      id: apiKey._id,
      userId: apiKey.userId,
      name: apiKey.name,
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
    const apiKey = await ctx.db.get(args.keyId);
    if (!apiKey) {
      return;
    }

    await ctx.db.patch(args.keyId, {
      lastUsedAt: Date.now(),
    });
  },
});

