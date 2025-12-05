/**
 * useQuestionDetails Hook
 * 
 * Handles fetching and caching question-specific details based on question type.
 * Prevents re-fetching when question ID hasn't changed.
 * 
 * @returns Object containing fetched details and loading state
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  fetchOptionsByQuestion,
  fetchOrderingByQuestion,
  fetchMatchingByQuestion,
  fetchFillBlankByQuestion,
  fetchNumericInputByQuestion,
  type OptionDto,
  type OrderingDto,
  type MatchingDto,
  type FillBlankDto,
  type NumericInputDto,
} from '@/app/lib/questionDetails';

interface UseQuestionDetailsReturn {
  options: OptionDto[];
  ordering: OrderingDto | null;
  matching: MatchingDto | null;
  fillBlank: FillBlankDto | null;
  numericInput: NumericInputDto | null;
  isLoadingDetails: boolean;
}

/**
 * Fetch question-specific details based on question type
 * 
 * Supported question types:
 * - single_choice, multi_choice, image_choice: fetch options
 * - ordering: fetch ordering data
 * - matching: fetch matching pairs
 * - fill_blank: fetch fill-in-blank details
 * - numeric_input: fetch numeric input constraints
 * 
 * @param questionId - Question ID to fetch details for
 * @param questionType - Type of question to determine which API to call
 * @returns Object with fetched details and loading state
 */
export function useQuestionDetails(
  questionId: string | number | undefined,
  questionType: string | undefined
): UseQuestionDetailsReturn {
  // State for fetched question details
  const [options, setOptions] = useState<OptionDto[]>([]);
  const [ordering, setOrdering] = useState<OrderingDto | null>(null);
  const [matching, setMatching] = useState<MatchingDto | null>(null);
  const [fillBlank, setFillBlank] = useState<FillBlankDto | null>(null);
  const [numericInput, setNumericInput] = useState<NumericInputDto | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Track fetched question ID to prevent re-fetching
  const fetchedQuestionIdRef = useRef<string | null>(null);

  const fetchDetails = useCallback(async () => {
    setIsLoadingDetails(true);

    try {
      const idStr = String(questionId);
      
      if (
        questionType === 'single_choice' ||
        questionType === 'multi_choice' ||
        questionType === 'image_choice'
      ) {
        const opts = await fetchOptionsByQuestion(idStr);
        setOptions(opts);
      } else if (questionType === 'ordering') {
        const ord = await fetchOrderingByQuestion(idStr);
        setOrdering(ord);
      } else if (questionType === 'matching') {
        const mat = await fetchMatchingByQuestion(idStr);
        setMatching(mat);
      } else if (questionType === 'fill_blank') {
        const fb = await fetchFillBlankByQuestion(idStr);
        setFillBlank(fb);
      } else if (questionType === 'numeric_input') {
        const ni = await fetchNumericInputByQuestion(idStr);
        setNumericInput(ni);
      }
    } catch (error) {
      console.error('Error fetching question details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  }, [questionId, questionType]);

  useEffect(() => {
    const questionIdStr = String(questionId);

    // Skip if already fetched this question ID
    if (fetchedQuestionIdRef.current === questionIdStr) return;
    if (!questionId) return;

    // SET REF IMMEDIATELY to prevent re-trigger on state updates
    fetchedQuestionIdRef.current = questionIdStr;

    fetchDetails();
  }, [questionId, fetchDetails]);

  return {
    options,
    ordering,
    matching,
    fillBlank,
    numericInput,
    isLoadingDetails,
  };
}

export default useQuestionDetails;
