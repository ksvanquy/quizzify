// app/utils/scoring.ts

export interface QuestionResult {
  questionId: number;
  isCorrect: boolean;
  score: number;
  maxScore: number;
  percentage: number;
}

/**
 * Calculate score for Single Choice question
 */
export function scoreSingleChoice(
  correctOptionId: number,
  selectedOptionId: number | null,
  points: number = 1
): QuestionResult {
  const isCorrect = selectedOptionId === correctOptionId;
  const score = isCorrect ? points : 0;
  
  return {
    questionId: 0, // Will be set by caller
    isCorrect,
    score,
    maxScore: points,
    percentage: (score / points) * 100
  };
}

/**
 * Calculate score for Multi Choice question
 */
export function scoreMultiChoice(
  correctOptionIds: number[],
  selectedOptionIds: number[],
  points: number = 1
): QuestionResult {
  if (selectedOptionIds.length === 0) {
    return {
      questionId: 0,
      isCorrect: false,
      score: 0,
      maxScore: points,
      percentage: 0
    };
  }

  const correctSet = new Set(correctOptionIds);
  const selectedSet = new Set(selectedOptionIds);
  
  // Count correct selections
  let correctCount = 0;
  let incorrectCount = 0;
  
  selectedOptionIds.forEach(id => {
    if (correctSet.has(id)) {
      correctCount++;
    } else {
      incorrectCount++;
    }
  });
  
  // Check for missed correct answers
  const missedCount = correctOptionIds.length - correctCount;
  
  // Perfect match = full points
  // Partial credit based on correct/incorrect ratio
  const isCorrect = correctCount === correctOptionIds.length && incorrectCount === 0;
  const accuracy = correctCount / correctOptionIds.length;
  const penalty = incorrectCount > 0 ? 0.5 : 1; // 50% penalty for wrong selections
  const score = Math.max(0, points * accuracy * penalty);
  
  return {
    questionId: 0,
    isCorrect,
    score: Math.round(score * 100) / 100,
    maxScore: points,
    percentage: (score / points) * 100
  };
}

/**
 * Calculate score for True/False question
 */
export function scoreTrueFalse(
  correctAnswer: boolean,
  selectedAnswer: boolean | null,
  points: number = 1
): QuestionResult {
  const isCorrect = selectedAnswer === correctAnswer;
  const score = isCorrect ? points : 0;
  
  return {
    questionId: 0,
    isCorrect,
    score,
    maxScore: points,
    percentage: (score / points) * 100
  };
}

/**
 * Calculate score for Ordering question
 */
export function scoreOrdering(
  correctOrder: string[],
  selectedOrder: string[],
  points: number = 1
): QuestionResult {
  if (selectedOrder.length === 0) {
    return {
      questionId: 0,
      isCorrect: false,
      score: 0,
      maxScore: points,
      percentage: 0
    };
  }

  // Count items in correct position
  let correctPositions = 0;
  const minLength = Math.min(correctOrder.length, selectedOrder.length);
  
  for (let i = 0; i < minLength; i++) {
    if (correctOrder[i] === selectedOrder[i]) {
      correctPositions++;
    }
  }
  
  const isCorrect = correctPositions === correctOrder.length;
  const percentage = (correctPositions / correctOrder.length) * 100;
  const score = (points * correctPositions) / correctOrder.length;
  
  return {
    questionId: 0,
    isCorrect,
    score: Math.round(score * 100) / 100,
    maxScore: points,
    percentage
  };
}

/**
 * Calculate score for Matching question
 */
export function scoreMatching(
  correctMatches: Record<string, string>,
  selectedMatches: Record<string, string>,
  points: number = 1
): QuestionResult {
  const totalPairs = Object.keys(correctMatches).length;
  
  if (Object.keys(selectedMatches).length === 0) {
    return {
      questionId: 0,
      isCorrect: false,
      score: 0,
      maxScore: points,
      percentage: 0
    };
  }

  // Count correct matches
  let correctCount = 0;
  Object.keys(correctMatches).forEach(leftId => {
    if (selectedMatches[leftId] === correctMatches[leftId]) {
      correctCount++;
    }
  });
  
  const isCorrect = correctCount === totalPairs;
  const percentage = (correctCount / totalPairs) * 100;
  const score = (points * correctCount) / totalPairs;
  
  return {
    questionId: 0,
    isCorrect,
    score: Math.round(score * 100) / 100,
    maxScore: points,
    percentage
  };
}

/**
 * Calculate score for Fill in the Blank question
 */
export function scoreFillBlank(
  correctAnswers: string[],
  selectedAnswer: string,
  caseSensitive: boolean = false,
  points: number = 1
): QuestionResult {
  const normalizedSelected = caseSensitive 
    ? selectedAnswer.trim() 
    : selectedAnswer.trim().toLowerCase();
  
  const isCorrect = correctAnswers.some(answer => {
    const normalizedCorrect = caseSensitive 
      ? answer.trim() 
      : answer.trim().toLowerCase();
    return normalizedSelected === normalizedCorrect;
  });
  
  const score = isCorrect ? points : 0;
  
  return {
    questionId: 0,
    isCorrect,
    score,
    maxScore: points,
    percentage: (score / points) * 100
  };
}

/**
 * Calculate score for Image Choice question (single or multiple)
 */
export function scoreImageChoice(
  correctAnswer: number | number[],
  selectedAnswer: number | number[] | null,
  points: number = 1,
  isMultiple: boolean = false
): QuestionResult {
  if (isMultiple) {
    // Multiple image selection
    const correctIds = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
    const selectedIds = Array.isArray(selectedAnswer) ? selectedAnswer : (selectedAnswer ? [selectedAnswer] : []);
    return scoreMultiChoice(correctIds, selectedIds, points);
  } else {
    // Single image selection
    const correctId = Array.isArray(correctAnswer) ? correctAnswer[0] : correctAnswer;
    const selectedId = Array.isArray(selectedAnswer) ? selectedAnswer[0] : selectedAnswer;
    return scoreSingleChoice(correctId, selectedId, points);
  }
}

/**
 * Calculate score for Numeric Input question
 */
export function scoreNumericInput(
  correctAnswer: number,
  selectedAnswer: string | number | null,
  tolerance: number = 0,
  points: number = 1
): QuestionResult {
  if (selectedAnswer === null || selectedAnswer === '') {
    return {
      questionId: 0,
      isCorrect: false,
      score: 0,
      maxScore: points,
      percentage: 0
    };
  }

  const userValue = typeof selectedAnswer === 'string' ? parseFloat(selectedAnswer) : selectedAnswer;
  
  if (isNaN(userValue)) {
    return {
      questionId: 0,
      isCorrect: false,
      score: 0,
      maxScore: points,
      percentage: 0
    };
  }

  // Check if within tolerance range
  const isCorrect = Math.abs(userValue - correctAnswer) <= tolerance;
  const score = isCorrect ? points : 0;

  return {
    questionId: 0,
    isCorrect,
    score,
    maxScore: points,
    percentage: (score / points) * 100
  };
}

/**
 * Calculate score for Cloze Test question (multiple fill-in-the-blanks)
 */
export function scoreClozeTest(
  correctAnswers: Record<string, string[]>,
  selectedAnswers: Record<string, string> | null,
  caseSensitive: boolean = false,
  points: number = 1
): QuestionResult {
  if (!selectedAnswers) {
    return {
      questionId: 0,
      isCorrect: false,
      score: 0,
      maxScore: points,
      percentage: 0
    };
  }

  const totalBlanks = Object.keys(correctAnswers).length;
  let correctCount = 0;

  // Check each blank
  Object.keys(correctAnswers).forEach(blankId => {
    const userAnswer = selectedAnswers[blankId];
    if (!userAnswer) return;

    const normalizedUser = caseSensitive 
      ? userAnswer.trim() 
      : userAnswer.trim().toLowerCase();

    const isBlankCorrect = correctAnswers[blankId].some(answer => {
      const normalizedCorrect = caseSensitive 
        ? answer.trim() 
        : answer.trim().toLowerCase();
      return normalizedUser === normalizedCorrect;
    });

    if (isBlankCorrect) {
      correctCount++;
    }
  });

  const isCorrect = correctCount === totalBlanks;
  const percentage = totalBlanks > 0 ? (correctCount / totalBlanks) * 100 : 0;
  const score = (points * correctCount) / totalBlanks;

  return {
    questionId: 0,
    isCorrect,
    score: Math.round(score * 100) / 100,
    maxScore: points,
    percentage
  };
}

/**
 * Calculate total quiz score
 */
export function calculateTotalScore(results: QuestionResult[]): {
  totalScore: number;
  maxScore: number;
  percentage: number;
  correctCount: number;
  totalQuestions: number;
} {
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const maxScore = results.reduce((sum, r) => sum + r.maxScore, 0);
  const correctCount = results.filter(r => r.isCorrect).length;
  
  return {
    totalScore: Math.round(totalScore * 100) / 100,
    maxScore,
    percentage: maxScore > 0 ? (totalScore / maxScore) * 100 : 0,
    correctCount,
    totalQuestions: results.length
  };
}

/**
 * Shuffle array (for shuffleOptions)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
