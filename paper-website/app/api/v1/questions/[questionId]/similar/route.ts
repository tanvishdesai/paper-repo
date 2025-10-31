import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Get similar questions for a given question using vector embeddings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const { questionId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "5");
    const useVectors = searchParams.get("useVectors") !== "false"; // Default to true

    let similarQuestions;
    let algorithm = "graph";

    // Try vector-based similarity first if enabled
    if (useVectors) {
      try {
        similarQuestions = await convex.query(api.questions.findSimilarQuestionsWithVectors, {
          questionId,
          limit,
        });

        // If we got results from vector search, use them
        if (similarQuestions && similarQuestions.length > 0) {
          algorithm = "vector";
        } else {
          // Fallback to graph-based if no vector results
          similarQuestions = await convex.query(api.questions.getSimilarQuestions, {
            questionId,
            limit,
          });
          algorithm = "graph";
        }
      } catch (vectorError) {
        console.warn("Vector search failed, falling back to graph-based:", vectorError);
        
        // Fallback to graph-based similarity
        similarQuestions = await convex.query(api.questions.getSimilarQuestions, {
          questionId,
          limit,
        });
        algorithm = "graph";
      }
    } else {
      // Use graph-based similarity if vectors disabled
      similarQuestions = await convex.query(api.questions.getSimilarQuestions, {
        questionId,
        limit,
      });
      algorithm = "graph";
    }

    return NextResponse.json({
      success: true,
      questionId,
      algorithm,
      data: similarQuestions,
      count: similarQuestions.length,
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

