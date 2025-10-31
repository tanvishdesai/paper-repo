export interface Question {
  _id?: string; // Convex document ID
  year: number;
  questionNumber: number;
  questionText: string;
  questionImages?: string;
  optionA: string;
  optionAImages?: string;
  optionB: string;
  optionBImages?: string;
  optionC: string;
  optionCImages?: string;
  optionD: string;
  optionDImages?: string;
  correctAnswer: "A" | "B" | "C" | "D";
  questionType: string;
  explanation: string;
  explanationImages?: string;
  subject?: string;
  chapter?: string;
  subtopic?: string;
}

export interface SubjectData {
  name: string;
  fileName: string;
  icon: string;
  description: string;
}

