export interface Question {
  questionId?: string; // Generated on insert
  year: number;
  paper_code: string;
  question_no: string;
  question_text: string;
  options?: string[] | null; // Optional - null for NAT (Numerical Answer Type) questions
  subject: string;
  chapter: string;
  subtopic: string;
  theoretical_practical: string; // "theoretical" or "practical"
  marks: number;
  provenance: string;
  confidence: number;
  correct_answer: string;
  has_diagram: boolean;
}

export interface SubjectData {
  name: string;
  fileName: string;
  icon: string;
  description: string;
}

