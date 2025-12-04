import { API_URL } from "@/app/lib/api";

async function getAccessToken(): Promise<string | null> {
  try {
    // Try to get from localStorage first
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) return token;
    }
  } catch (err) {
    console.log('localStorage not available');
  }
  return null;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// ============================================
// Option Details APIs
// ============================================

export interface OptionDto {
  id: string;
  questionId: string;
  text: string;
  imageUrl?: string;
  isCorrect: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function fetchOptionsByQuestion(questionId: string): Promise<OptionDto[]> {
  try {
    const token = await getAccessToken();
    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${API_URL}/options/question/${questionId}`,
      { headers }
    );

    if (!response.ok) {
      console.error(`Failed to fetch options: ${response.statusText}`);
      return [];
    }

    const result: ApiResponse<{ options: OptionDto[] }> = await response.json();
    return result.data?.options || [];
  } catch (error) {
    console.error('Error fetching options:', error);
    return [];
  }
}

// ============================================
// Ordering Details APIs
// ============================================

export interface OrderingDto {
  id: string;
  questionId: string;
  items: string[];
  correctOrder: string[];
  createdAt: Date;
  updatedAt: Date;
}

export async function fetchOrderingByQuestion(questionId: string): Promise<OrderingDto | null> {
  try {
    const token = await getAccessToken();
    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${API_URL}/orderings/question/${questionId}`,
      { headers }
    );

    if (!response.ok) {
      console.error(`Failed to fetch ordering: ${response.statusText}`);
      return null;
    }

    const result: ApiResponse<{ ordering: OrderingDto }> = await response.json();
    return result.data?.ordering || null;
  } catch (error) {
    console.error('Error fetching ordering:', error);
    return null;
  }
}

// ============================================
// Matching Details APIs
// ============================================

export interface MatchingDto {
  id: string;
  questionId: string;
  leftSide: Record<string, string>;
  rightSide: Record<string, string>;
  correctPairs: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export async function fetchMatchingByQuestion(questionId: string): Promise<MatchingDto | null> {
  try {
    const token = await getAccessToken();
    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${API_URL}/matchings/question/${questionId}`,
      { headers }
    );

    if (!response.ok) {
      console.error(`Failed to fetch matching: ${response.statusText}`);
      return null;
    }

    const result: ApiResponse<{ matching: MatchingDto }> = await response.json();
    return result.data?.matching || null;
  } catch (error) {
    console.error('Error fetching matching:', error);
    return null;
  }
}

// ============================================
// Fill-Blank Details APIs
// ============================================

export interface FillBlankDto {
  id: string;
  questionId: string;
  correctAnswers: string[];
  caseSensitive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function fetchFillBlankByQuestion(questionId: string): Promise<FillBlankDto | null> {
  try {
    const token = await getAccessToken();
    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${API_URL}/fill-blanks/question/${questionId}`,
      { headers }
    );

    if (!response.ok) {
      console.error(`Failed to fetch fill-blank: ${response.statusText}`);
      return null;
    }

    const result: ApiResponse<{ fillBlank: FillBlankDto }> = await response.json();
    return result.data?.fillBlank || null;
  } catch (error) {
    console.error('Error fetching fill-blank:', error);
    return null;
  }
}

// ============================================
// Numeric-Input Details APIs
// ============================================

export interface NumericInputDto {
  id: string;
  questionId: string;
  correctNumber: number;
  tolerance: number;
  unit?: string;
  step?: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function fetchNumericInputByQuestion(questionId: string): Promise<NumericInputDto | null> {
  try {
    const token = await getAccessToken();
    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${API_URL}/numeric-inputs/question/${questionId}`,
      { headers }
    );

    if (!response.ok) {
      console.error(`Failed to fetch numeric-input: ${response.statusText}`);
      return null;
    }

    const result: ApiResponse<{ numericInput: NumericInputDto }> = await response.json();
    return result.data?.numericInput || null;
  } catch (error) {
    console.error('Error fetching numeric-input:', error);
    return null;
  }
}
