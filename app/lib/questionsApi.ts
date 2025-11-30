// app/lib/questionsApi.ts
import { API_URL } from './api';

export interface Question {
  id: string | number;
  text: string;
  type: string;
  topic: string;
  difficulty: string;
  points: number;
  shuffleOptions?: boolean;
  answerOptionIds?: number[];
  optionIds?: string[];
  correctOptionId?: string | number;
  correctOptionIds?: string[] | number[];
  correctBoolean?: boolean;
  correctOrder?: string[];
  correctPairs?: Record<string, string>;
  correctAnswers?: string[];
  caseSensitive?: boolean;
  correctNumber?: number;
  tolerance?: number;
  unit?: string;
  step?: number;
  explanation?: string;
  isActive?: boolean;
  items?: string[];
  pairs?: Array<{ left: string; right: string }>;
}

export interface QueryQuestionsParams {
  topic?: string;
  difficulty?: string;
  type?: string;
}

/**
 * Fetch questions from NestJS API
 */
export async function fetchQuestionsFromAPI(
  params?: QueryQuestionsParams,
  token?: string
): Promise<Question[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.topic) queryParams.append('topic', params.topic);
    if (params?.difficulty) queryParams.append('difficulty', params.difficulty);
    if (params?.type) queryParams.append('type', params.type);

    const queryString = queryParams.toString();
    const url = `${API_URL}/questions${queryString ? `?${queryString}` : ''}`;

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch questions: ${response.status}`);
    }

    const data = await response.json();
    
    // Normalize NestJS ApiResponse structure
    return data?.data || data || [];
  } catch (error) {
    console.error('Error fetching questions from API:', error);
    throw error;
  }
}

/**
 * Fetch a single question by ID from NestJS API
 */
export async function fetchQuestionById(
  id: string,
  token?: string
): Promise<Question | null> {
  try {
    const url = `${API_URL}/questions/${id}`;

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch question: ${response.status}`);
    }

    const data = await response.json();
    
    // Normalize NestJS ApiResponse structure
    return data?.data || data || null;
  } catch (error) {
    console.error('Error fetching question by ID:', error);
    throw error;
  }
}

/**
 * Create a new question via NestJS API
 */
export async function createQuestion(
  questionData: Partial<Question>,
  token: string
): Promise<Question> {
  try {
    const url = `${API_URL}/questions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(questionData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create question: ${response.status}`);
    }

    const data = await response.json();
    return data?.data || data;
  } catch (error) {
    console.error('Error creating question:', error);
    throw error;
  }
}

/**
 * Update a question via NestJS API
 */
export async function updateQuestion(
  id: string,
  updates: Partial<Question>,
  token: string
): Promise<Question> {
  try {
    const url = `${API_URL}/questions/${id}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to update question: ${response.status}`);
    }

    const data = await response.json();
    return data?.data || data;
  } catch (error) {
    console.error('Error updating question:', error);
    throw error;
  }
}

/**
 * Delete a question via NestJS API
 */
export async function deleteQuestion(
  id: string,
  token: string
): Promise<void> {
  try {
    const url = `${API_URL}/questions/${id}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete question: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting question:', error);
    throw error;
  }
}
