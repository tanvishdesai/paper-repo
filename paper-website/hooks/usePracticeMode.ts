import { useState } from "react";
import { Question } from "@/types/question";

export function usePracticeMode() {
  const [practiceMode, setPracticeMode] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Map<number, string>>(new Map());
  const [quizCompleted, setQuizCompleted] = useState(false);

  const startPractice = (questions: Question[]) => {
    if (questions.length > 0) {
      setPracticeMode(true);
      setCurrentQuestionIndex(0);
      setUserAnswers(new Map());
      setQuizCompleted(false);
    }
  };

  const exitPractice = () => {
    setPracticeMode(false);
    setCurrentQuestionIndex(0);
    setUserAnswers(new Map());
    setQuizCompleted(false);
  };

  const nextQuestion = (totalQuestions: number) => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Quiz completed
      setQuizCompleted(true);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const answerQuestion = (answer: string) => {
    // Record the answer
    const newAnswers = new Map(userAnswers);
    newAnswers.set(currentQuestionIndex, answer);
    setUserAnswers(newAnswers);
  };

  return {
    practiceMode,
    currentQuestionIndex,
    userAnswers,
    quizCompleted,
    startPractice,
    exitPractice,
    nextQuestion,
    previousQuestion,
    answerQuestion,
  };
}
