// app/lib/quizzesApi.ts
import { API_URL } from './api';

export interface QuestionSelection {
  mode: 'manual' | 'random';
  manualQuestionIds?: string[];
  sourceTopics?: string[];
  randomCounts?: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export interface QuizTemplate {
  id: string | number;
  name: string;
  slug: string;
  categoryId: string | number;
  status: 'active' | 'draft' | 'archived';
  difficulty: 'easy' | 'medium' | 'hard';
  durationMinutes: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  revealAnswersAfterSubmission: boolean;
  passingScore: number;
  description?: string;
  tags?: string[];
  questionSelection: QuestionSelection;
  totalAttempts?: number;
  averageScore?: number;
  createdAt?: Date;
  updatedAt?: Date;
  category?: any; // Category info if populated
}

export interface QueryQuizzesParams {
  status?: 'active' | 'draft' | 'archived';
  categoryId?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

/**
 * Fetch all quiz templates from NestJS API
 */
export async function fetchQuizTemplatesFromAPI(
  params?: QueryQuizzesParams,
  token?: string
): Promise<QuizTemplate[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params?.difficulty) queryParams.append('difficulty', params.difficulty);

    const queryString = queryParams.toString();
    const url = `${API_URL}/quizzes${queryString ? `?${queryString}` : ''}`;

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch quiz templates: ${response.status}`);
    }

    const data = await response.json();
    
    // Normalize NestJS ApiResponse structure
    return data?.data?.quizzes || data?.data || data || [];
  } catch (error) {
    console.error('Error fetching quiz templates from API:', error);
    throw error;
  }
}

/**
 * Fetch a quiz template by slug from NestJS API
 */
export async function fetchQuizTemplateBySlug(
  slug: string,
  token?: string
): Promise<QuizTemplate | null> {
  try {
    const url = `${API_URL}/quizzes/slug/${slug}`;

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch quiz template: ${response.status}`);
    }

    const data = await response.json();
    
    // Normalize NestJS ApiResponse structure
    return data?.data?.quiz || data?.data || data || null;
  } catch (error) {
    console.error('Error fetching quiz template by slug:', error);
    throw error;
  }
}

/**
 * Fetch a quiz template by ID from NestJS API
 * Note: Uses /manage/:id route to avoid conflict with /[templateId] (quiz taking)
 */
export async function fetchQuizTemplateById(
  id: string,
  token?: string
): Promise<QuizTemplate | null> {
  try {
    const url = `${API_URL}/quizzes/${id}`;

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch quiz template: ${response.status}`);
    }

    const data = await response.json();
    
    // Normalize NestJS ApiResponse structure
    return data?.data?.quiz || data?.data || data || null;
  } catch (error) {
    console.error('Error fetching quiz template by ID:', error);
    throw error;
  }
}

/**
 * Create a new quiz template via NestJS API
 */
export async function createQuizTemplate(
  templateData: Partial<QuizTemplate>,
  token: string
): Promise<QuizTemplate> {
  try {
    const url = `${API_URL}/quizzes`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(templateData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create quiz template: ${response.status}`);
    }

    const data = await response.json();
    return data?.data?.quiz || data?.data || data;
  } catch (error) {
    console.error('Error creating quiz template:', error);
    throw error;
  }
}

/**
 * Update a quiz template via NestJS API
 * Note: Uses direct API call to avoid Next.js routing conflicts
 */
export async function updateQuizTemplate(
  id: string,
  updates: Partial<QuizTemplate>,
  token: string
): Promise<QuizTemplate> {
  try {
    const url = `${API_URL}/quizzes/${id}`;

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
      throw new Error(errorData.message || `Failed to update quiz template: ${response.status}`);
    }

    const data = await response.json();
    return data?.data?.quiz || data?.data || data;
  } catch (error) {
    console.error('Error updating quiz template:', error);
    throw error;
  }
}

/**
 * Delete a quiz template via NestJS API
 * Note: Uses direct API call to avoid Next.js routing conflicts
 */
export async function deleteQuizTemplate(
  id: string,
  token: string
): Promise<void> {
  try {
    const url = `${API_URL}/quizzes/${id}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete quiz template: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting quiz template:', error);
    throw error;
  }
}
