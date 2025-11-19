import { useState, useEffect } from 'react';
import { authService } from '../lib/auth';

export interface Rating {
  id: number;
  assignment: number;
  assignment_job_title: string;
  rater: number;
  rater_name: string;
  ratee: number;
  ratee_name: string;
  rating_type: 'customer_to_worker' | 'worker_to_customer';
  rating: number;
  review: string;
  quality_rating: number;
  communication_rating: number;
  punctuality_rating: number;
  professionalism_rating: number;
  is_anonymous: boolean;
  is_verified: boolean;
  helpful_count: number;
  can_rate: boolean;
  created_at: string;
  updated_at: string;
}

export interface RatingListItem {
  id: number;
  assignment_job_title: string;
  rater_name: string;
  rating: number;
  review: string;
  is_anonymous: boolean;
  helpful_count: number;
  created_at: string;
}

export interface RatingSummary {
  average_rating: number;
  total_ratings: number;
  rating_distribution: Record<string, number>;
  recent_ratings: RatingListItem[];
}

export interface CreateRatingData {
  assignment: number;
  ratee: number;
  rating_type: 'customer_to_worker' | 'worker_to_customer';
  rating: number;
  review: string;
  quality_rating: number;
  communication_rating: number;
  punctuality_rating: number;
  professionalism_rating: number;
  is_anonymous?: boolean;
}

export interface CanRateResponse {
  can_rate: boolean;
  reason?: string;
  rating_type?: string;
  ratee_id?: number;
  ratee_name?: string;
  existing_rating_id?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export const useRatings = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getHeaders = () => {
    const token = authService.getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  // Fetch ratings with optional filters
  const fetchRatings = async (filters?: {
    assignment?: number;
    ratee?: number;
    rater?: number;
    type?: string;
  }): Promise<Rating[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters?.assignment) params.append('assignment', filters.assignment.toString());
      if (filters?.ratee) params.append('ratee', filters.ratee.toString());
      if (filters?.rater) params.append('rater', filters.rater.toString());
      if (filters?.type) params.append('type', filters.type);

      const url = `${API_BASE_URL}/ratings/${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url, { headers: getHeaders() });

      if (!response.ok) {
        throw new Error(`Failed to fetch ratings: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch ratings';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch ratings for a specific user
  const fetchUserRatings = async (userId: number): Promise<RatingListItem[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/ratings/`, { headers: getHeaders() });

      if (!response.ok) {
        throw new Error(`Failed to fetch user ratings: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user ratings';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch rating summary for a user
  const fetchUserRatingSummary = async (userId: number): Promise<RatingSummary> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/rating-summary/`, { headers: getHeaders() });

      if (!response.ok) {
        throw new Error(`Failed to fetch rating summary: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch rating summary';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch ratings for a specific assignment
  const fetchAssignmentRatings = async (assignmentId: number): Promise<Rating[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/ratings/`, { headers: getHeaders() });

      if (!response.ok) {
        throw new Error(`Failed to fetch assignment ratings: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch assignment ratings';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Check if user can rate an assignment
  const canRateAssignment = async (assignmentId: number): Promise<CanRateResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/can-rate/`, {
        method: 'POST',
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to check rating eligibility: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check rating eligibility';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create a new rating
  const createRating = async (ratingData: CreateRatingData): Promise<Rating> => {
    setLoading(true);
    setError(null);
    
    try {
      // Sanitize payload: clamp rating to 1-5 and omit optional criteria if unset
      const clamp = (v: number) => Math.min(5, Math.max(1, v));
      type CreateRatingPayload = Omit<CreateRatingData,
        'quality_rating' | 'communication_rating' | 'punctuality_rating' | 'professionalism_rating'
      > & Partial<Pick<CreateRatingData,
        'quality_rating' | 'communication_rating' | 'punctuality_rating' | 'professionalism_rating'
      >>;
      const payload: CreateRatingPayload = {
        assignment: ratingData.assignment,
        ratee: ratingData.ratee,
        rating_type: ratingData.rating_type,
        rating: clamp(ratingData.rating),
        review: ratingData.review,
        is_anonymous: !!ratingData.is_anonymous,
      };
      // Only include detailed criteria if provided and valid (>=1)
      if (typeof ratingData.quality_rating === 'number' && ratingData.quality_rating >= 1) payload.quality_rating = clamp(ratingData.quality_rating);
      if (typeof ratingData.communication_rating === 'number' && ratingData.communication_rating >= 1) payload.communication_rating = clamp(ratingData.communication_rating);
      if (typeof ratingData.punctuality_rating === 'number' && ratingData.punctuality_rating >= 1) payload.punctuality_rating = clamp(ratingData.punctuality_rating);
      if (typeof ratingData.professionalism_rating === 'number' && ratingData.professionalism_rating >= 1) payload.professionalism_rating = clamp(ratingData.professionalism_rating);

      const response = await fetch(`${API_BASE_URL}/ratings/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) {
        if (contentType.includes('application/json')) {
          const errorData = await response.json();
          // Surface detailed validation errors when available
          const messages: string[] = [];
          if (errorData?.error) messages.push(errorData.error);
          if (errorData?.detail) messages.push(errorData.detail);
          const errs = errorData?.errors || errorData;
          if (errs && typeof errs === 'object') {
            Object.entries(errs).forEach(([field, value]) => {
              if (field === 'error' || field === 'detail') return;
              const parts = Array.isArray(value) ? value : [value];
              const text = parts.map((v) => (typeof v === 'string' ? v : JSON.stringify(v))).join(', ');
              messages.push(`${field}: ${text}`);
            });
          }
          const message = messages.length ? messages.join(' | ') : `Failed to create rating: ${response.statusText}`;
          throw new Error(message);
        } else {
          const text = await response.text();
          throw new Error(`Failed to create rating: ${response.status} ${response.statusText}. ${text.slice(0, 200)}`);
        }
      }

      const data = contentType.includes('application/json') ? await response.json() : await response.text();
      if (typeof data === 'string') {
        // Fallback shape when server returned text; surface a generic success
        return {
          id: 0,
          assignment: ratingData.assignment,
          assignment_job_title: '',
          rater: 0,
          rater_name: '',
          ratee: ratingData.ratee,
          ratee_name: '',
          rating_type: ratingData.rating_type,
          rating: ratingData.rating,
          review: ratingData.review,
          quality_rating: ratingData.quality_rating,
          communication_rating: ratingData.communication_rating,
          punctuality_rating: ratingData.punctuality_rating,
          professionalism_rating: ratingData.professionalism_rating,
          is_anonymous: !!ratingData.is_anonymous,
          is_verified: false,
          helpful_count: 0,
          can_rate: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create rating';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing rating
  const updateRating = async (ratingId: number, ratingData: Partial<CreateRatingData>): Promise<Rating> => {
    setLoading(true);
    setError(null);
    
    try {
      // Sanitize update payload similarly
      const clamp = (v: number) => Math.min(5, Math.max(1, v));
      const payload: Partial<CreateRatingData> = { ...ratingData };
      if (typeof payload.rating === 'number') payload.rating = clamp(payload.rating);
      if (typeof payload.quality_rating === 'number') payload.quality_rating = payload.quality_rating < 1 ? undefined : clamp(payload.quality_rating);
      if (typeof payload.communication_rating === 'number') payload.communication_rating = payload.communication_rating < 1 ? undefined : clamp(payload.communication_rating);
      if (typeof payload.punctuality_rating === 'number') payload.punctuality_rating = payload.punctuality_rating < 1 ? undefined : clamp(payload.punctuality_rating);
      if (typeof payload.professionalism_rating === 'number') payload.professionalism_rating = payload.professionalism_rating < 1 ? undefined : clamp(payload.professionalism_rating);

      const response = await fetch(`${API_BASE_URL}/ratings/${ratingId}/`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) {
        if (contentType.includes('application/json')) {
          const errorData = await response.json();
          const messages: string[] = [];
          if (errorData?.error) messages.push(errorData.error);
          if (errorData?.detail) messages.push(errorData.detail);
          const errs = errorData?.errors || errorData;
          if (errs && typeof errs === 'object') {
            Object.entries(errs).forEach(([field, value]) => {
              if (field === 'error' || field === 'detail') return;
              const parts = Array.isArray(value) ? value : [value];
              const text = parts.map((v) => (typeof v === 'string' ? v : JSON.stringify(v))).join(', ');
              messages.push(`${field}: ${text}`);
            });
          }
          const message = messages.length ? messages.join(' | ') : `Failed to update rating: ${response.statusText}`;
          throw new Error(message);
        } else {
          const text = await response.text();
          throw new Error(`Failed to update rating: ${response.status} ${response.statusText}. ${text.slice(0, 200)}`);
        }
      }

      const data = contentType.includes('application/json') ? await response.json() : await response.text();
      if (typeof data === 'string') {
        // Fallback minimal object on non-JSON success
        return {
          id: ratingId,
          assignment: ratingData.assignment || 0,
          assignment_job_title: '',
          rater: 0,
          rater_name: '',
          ratee: ratingData.ratee || 0,
          ratee_name: '',
          rating_type: (ratingData.rating_type || 'customer_to_worker') as any,
          rating: ratingData.rating || 0,
          review: ratingData.review || '',
          quality_rating: ratingData.quality_rating || 0,
          communication_rating: ratingData.communication_rating || 0,
          punctuality_rating: ratingData.punctuality_rating || 0,
          professionalism_rating: ratingData.professionalism_rating || 0,
          is_anonymous: !!ratingData.is_anonymous,
          is_verified: false,
          helpful_count: 0,
          can_rate: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update rating';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete a rating
  const deleteRating = async (ratingId: number): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/ratings/${ratingId}/`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete rating: ${response.statusText}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete rating';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Mark rating as helpful
  const markRatingHelpful = async (ratingId: number): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/ratings/helpful/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ rating: ratingId }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData?.detail || errorData?.message || `Failed to mark rating as helpful: ${response.statusText}`);
        } else {
          const text = await response.text();
          throw new Error(`Failed to mark rating as helpful: ${response.status} ${response.statusText}. ${text.slice(0, 200)}`);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark rating as helpful';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Remove helpful vote from rating
  const removeRatingHelpful = async (ratingId: number): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/ratings/${ratingId}/helpful/`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData?.detail || errorData?.message || `Failed to remove helpful vote: ${response.statusText}`);
        } else {
          const text = await response.text();
          throw new Error(`Failed to remove helpful vote: ${response.status} ${response.statusText}. ${text.slice(0, 200)}`);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove helpful vote';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchRatings,
    fetchUserRatings,
    fetchUserRatingSummary,
    fetchAssignmentRatings,
    canRateAssignment,
    createRating,
    updateRating,
    deleteRating,
    markRatingHelpful,
    removeRatingHelpful,
  };
};

// Hook for managing user rating summary with caching
export const useUserRatingSummary = (userId: number | null) => {
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { fetchUserRatingSummary } = useRatings();

  useEffect(() => {
    if (!userId) return;

    const loadSummary = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await fetchUserRatingSummary(userId);
        setSummary(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load rating summary');
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, [userId, fetchUserRatingSummary]);

  const refreshSummary = async () => {
    if (!userId) return;
    
    try {
      const data = await fetchUserRatingSummary(userId);
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh rating summary');
    }
  };

  return {
    summary,
    loading,
    error,
    refreshSummary,
  };
};