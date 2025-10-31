import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Type definitions for graph nodes and links
interface SubjectNode {
  id: string;
  label: string;
  type: 'Subject';
  questionCount?: number;
}

interface QuestionNode {
  id: string;
  label: string;
  type: 'Question';
  year: number;
  subject?: string;
}

interface Link {
  source: string;
  target: string;
  type: string;
}

type GraphNode = SubjectNode | QuestionNode;

// Get graph data for visualization (simplified from Neo4j version)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const subject = searchParams.get("subject") || undefined;

    // Get questions for graph visualization
    const result = await convex.query(api.questions.getQuestions, {
      subject,
      limit,
      offset: 0,
    });

    // Get subjects, chapters, and subtopics
    const subjects = await convex.query(api.questions.getSubjects);
    
    // Transform data for graph visualization
    const nodes: GraphNode[] = [];
    const links: Link[] = [];

    // Add subject nodes
    subjects.forEach(s => {
      nodes.push({
        id: `subject-${s.name}`,
        label: s.name,
        type: 'Subject',
        questionCount: s.questionCount,
      });
    });

    // Add question nodes and links
    result.questions.forEach(q => {
      const questionNode: QuestionNode = {
        id: `question-${q.questionId}`,
        label: q.question_no,
        type: 'Question',
        year: q.year,
        subject: q.subject,
      };
      nodes.push(questionNode);

      // Link question to subject
      links.push({
        source: `question-${q.questionId}`,
        target: `subject-${q.subject}`,
        type: 'HAS_SUBJECT',
      });
    });

    return NextResponse.json({
      success: true,
      data: { nodes, links },
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Get connected questions for a specific subject (simplified)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, limit = 50 } = body;

    if (!subject) {
      return NextResponse.json(
        { error: "subject is required" },
        { status: 400 }
      );
    }

    const result = await convex.query(api.questions.getQuestions, {
      subject,
      limit,
      offset: 0,
    });

    const nodes: GraphNode[] = [];
    const links: Link[] = [];

    // Add subject node
    nodes.push({
      id: `subject-${subject}`,
      label: subject,
      type: 'Subject',
    });

    // Add question nodes and links
    result.questions.forEach(q => {
      const questionNode: QuestionNode = {
        id: `question-${q.questionId}`,
        label: q.question_no,
        type: 'Question',
        year: q.year,
      };
      nodes.push(questionNode);

      links.push({
        source: `question-${q.questionId}`,
        target: `subject-${subject}`,
        type: 'HAS_SUBJECT',
      });
    });

    return NextResponse.json({
      success: true,
      data: { nodes, links },
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

