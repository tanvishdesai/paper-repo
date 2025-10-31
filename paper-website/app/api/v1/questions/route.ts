import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Hash the API key to match stored hash
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify API key
async function verifyApiKey(apiKey: string) {
  const keyHash = await hashApiKey(apiKey);
  const result = await convex.query(api.apiKeys.verify, { keyHash });
  return result;
}

// Log API usage
async function logApiUsage(apiKeyId: string) {
  try {
    await convex.mutation(api.apiKeys.updateLastUsed, { keyId: apiKeyId as Id<"apiKeys"> });
  } catch (error) {
    console.error("Failed to log API usage:", error);
  }
}

// Get all questions from Convex database
export async function GET(request: NextRequest) {
  try {
    // Get API key from header
    const apiKey = request.headers.get("X-API-Key") || request.headers.get("Authorization")?.replace("Bearer ", "");
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required. Include X-API-Key header or Authorization: Bearer <key>" },
        { status: 401 }
      );
    }

    // Verify API key
    const keyData = await verifyApiKey(apiKey);
    if (!keyData) {
      return NextResponse.json(
        { error: "Invalid or inactive API key" },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get("subject") || undefined;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;
    const marks = searchParams.get("marks") ? parseInt(searchParams.get("marks")!) : undefined;
    const type = searchParams.get("type") || undefined;
    const search = searchParams.get("search") || undefined;
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Query Convex database
    const result = await convex.query(api.questions.getQuestions, {
      subject,
      year,
      marks,
      type,
      search,
      limit,
      offset,
    });

    // Log usage
    await logApiUsage(keyData.id);

    // Return response
    return NextResponse.json({
      success: true,
      data: result.questions,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: offset + limit < result.total,
      },
      filters: {
        subject,
        year,
        marks,
        type,
        search,
      },
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
