import { useState } from "react";
import {  Doc } from "@/convex/_generated/dataModel";

export function usePracticeMode() {
  const [practiceMode, setPracticeMode] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Map<string, string>>(new Map()); // questionId -> answerId
  const [quizCompleted, setQuizCompleted] = useState(false);

  const startPractice = (questions: Doc<"questions">[]) => {
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

  const answerQuestion = (questionId: string, answerId: string) => {
    // Record the answer
    const newAnswers = new Map(userAnswers);
    newAnswers.set(questionId, answerId);
    setUserAnswers(newAnswers);
  };

  const getAnswerForQuestion = (questionId: string): string | undefined => {
    return userAnswers.get(questionId);
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
    getAnswerForQuestion,
  };
}
