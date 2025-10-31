// Helper function to detect the correct option index based on correct_answer text
export function detectCorrectOption(options: string[], correctAnswer?: string): number | null {
  if (!options || !correctAnswer || !correctAnswer.trim()) {
    return null;
  }

  const normalizedOptions = options.map(opt => opt.toLowerCase().trim());
  const normalizedAnswer = correctAnswer.toLowerCase().trim();

  // Direct text match
  const directMatch = normalizedOptions.findIndex(opt => opt === normalizedAnswer);
  if (directMatch !== -1) {
    return directMatch;
  }

  // Letter match (A, B, C, D)
  const letterMatch = correctAnswer.trim().match(/^(?:option\s*)?([A-D])\.?$/i);
  if (letterMatch) {
    const letter = letterMatch[1].toUpperCase();
    const index = letter.charCodeAt(0) - 'A'.charCodeAt(0);
    if (index >= 0 && index < options.length) {
      return index;
    }
  }

  // Number match (1, 2, 3, 4)
  const numberMatch = correctAnswer.trim().match(/^(?:option\s*)?(\d+)$/i);
  if (numberMatch) {
    const index = parseInt(numberMatch[1]) - 1;
    if (index >= 0 && index < options.length) {
      return index;
    }
  }

  return null;
}
