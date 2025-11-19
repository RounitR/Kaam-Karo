const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export interface WorkerProfile {
  id: number;
  user: number;
  skills: string[];
  hourly_rate: number;
  experience_years: number;
  address: string;
  bio: string;
  is_available: boolean;
  total_jobs_completed: number;
  average_rating: number;
  total_earnings: number;
  profile_picture: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerProfile {
  id: number;
  user: number;
  address: string;
  bio: string;
  total_jobs_posted: number;
  average_rating: number;
  profile_picture: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateWorkerProfileData {
  skills?: string[];
  hourly_rate?: number;
  experience_years?: number;
  address?: string;
  bio?: string;
  is_available?: boolean;
  profile_picture?: string;
}

export interface UpdateCustomerProfileData {
  address?: string;
  bio?: string;
  profile_picture?: string;
}

import { authService } from './auth';

class ProfileService {
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    let headers = this.getAuthHeaders();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    // If we get a 401, try to refresh the token and retry once
    if (response.status === 401) {
      try {
        await authService.refreshToken();
        headers = this.getAuthHeaders();
        
        return fetch(url, {
          ...options,
          headers: {
            ...headers,
            ...options.headers,
          },
        });
      } catch (error) {
        // If refresh fails, clear tokens and throw the original error
        authService.clearTokens();
        throw new Error('Authentication failed');
      }
    }

    return response;
  }

  // Worker Profile operations
  async getWorkerProfile(): Promise<WorkerProfile> {
    const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/auth/profile/worker/`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch worker profile');
    }

    return response.json();
  }

  async updateWorkerProfile(data: UpdateWorkerProfileData): Promise<WorkerProfile> {
    const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/auth/profile/worker/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update worker profile');
    }

    return response.json();
  }

  // Customer Profile operations
  async getCustomerProfile(): Promise<CustomerProfile> {
    const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/auth/profile/customer/`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch customer profile');
    }

    return response.json();
  }

  async updateCustomerProfile(data: UpdateCustomerProfileData): Promise<CustomerProfile> {
    const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/auth/profile/customer/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update customer profile');
    }

    return response.json();
  }

  // Get user profile (includes both user data and profile data)
  async getUserProfile(): Promise<{
    user: any;
    profile: WorkerProfile | CustomerProfile | null;
  }> {
    const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/auth/profile/`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch user profile');
    }

    return response.json();
  }

  // Get worker profile by user ID
  async getWorkerProfileByUserId(userId: number): Promise<{
    user: any;
    profile: WorkerProfile;
  }> {
    const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/auth/profile/worker/${userId}/`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch worker profile');
    }

    return response.json();
  }
}

export const profileService = new ProfileService();