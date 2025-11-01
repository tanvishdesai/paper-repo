import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Get answers for a specific question
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const { questionId: questionIdParam } = await params;
    const questionId = questionIdParam as Id<"questions">;

    // Fetch the question with answers using Convex query
    const questionWithAnswers = await convex.query(api.questions.getQuestion, {
      questionId,
    });

    if (!questionWithAnswers) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Return only the answers
    const answers = questionWithAnswers.answers || [];
    return NextResponse.json(answers);
  } catch (error) {
    console.error("Error fetching answers:", error);
    return NextResponse.json(
      { error: "Failed to fetch answers" },
      { status: 500 }
    );
  }
}
