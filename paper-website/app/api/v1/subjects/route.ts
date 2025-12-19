import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);






// Get list of all subjects from Convex
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


    // Log usage
 

    // Get subjects from Convex
    const subjects = await convex.query(api.questions.getSubjects);

    // Return subjects list
    return NextResponse.json({
      success: true,
      data: subjects,
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

