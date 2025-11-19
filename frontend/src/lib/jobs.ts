const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export interface Job {
  id: number;
  title: string;
  description: string;
  category: string;
  budget_min: number;
  budget_max: number;
  budget_display?: string;
  location: string;
  city: string;
  state: string;
  pincode: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'open' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  customer: number;
  customer_name: string;
  responses_count: number;
  responses?: JobResponse[];
  created_at: string;
  updated_at: string;
}

export interface JobResponse {
  id: number;
  job: number;
  job_title: string;
  worker: number;
  worker_name: string;
  worker_email: string;
  response_type: 'accept' | 'quote';
  quote_amount?: number;
  amount_display?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  estimated_completion_time?: number;
  created_at: string;
  updated_at: string;
}

export interface Assignment {
  id: number;
  job: number;
  job_title: string;
  worker: number;
  worker_name: string;
  worker_email: string;
  customer_name: string;
  job_response: number;
  agreed_amount: number;
  status: 'assigned' | 'started' | 'completed' | 'cancelled';
  assigned_at: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  notes?: string;
  duration_hours?: string;
  customer_rating?: number;
  worker_rating?: number;
  customer_review?: string;
  worker_review?: string;
}

export interface CreateJobData {
  title: string;
  description: string;
  category: string;
  budget_min: number;
  budget_max: number;
  location: string;
  city: string;
  state: string;
  pincode: string;
  urgency: 'low' | 'medium' | 'high';
}

export interface CreateJobResponseData {
  response_type: 'accept' | 'quote';
  quote_amount?: number;
  message?: string;
}

import { authService } from './auth';

class JobService {
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

  // Job CRUD operations
  async getJobs(params?: { 
    category?: string; 
    city?: string; 
    urgency?: string; 
    status?: string;
    customer?: number;
  }): Promise<Job[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const url = `${API_BASE_URL}/jobs/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await this.makeAuthenticatedRequest(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch jobs');
    }

    const data = await response.json();
    
    // Handle paginated response structure
    if (data && typeof data === 'object' && Array.isArray(data.results)) {
      console.log('API returned paginated data, extracting results:', data.results.length, 'jobs');
      return data.results;
    }
    
    // Handle direct array response (fallback)
    if (Array.isArray(data)) {
      return data;
    }
    
    // If neither paginated nor array, log warning and return empty array
    console.warn('API returned unexpected data structure for jobs:', data);
    return [];
  }

  async getJob(id: number): Promise<Job> {
    const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/jobs/${id}/`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch job');
    }

    return response.json();
  }

  async createJob(data: CreateJobData): Promise<Job> {
    const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/jobs/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create job');
    }

    return response.json();
  }

  async updateJob(id: number, data: Partial<CreateJobData>): Promise<Job> {
    const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/jobs/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update job');
    }

    return response.json();
  }

  async deleteJob(id: number): Promise<void> {
    const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/jobs/${id}/`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete job');
    }
  }

  async updateJobStatus(id: number, status: Job['status']): Promise<Job> {
    const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/jobs/${id}/status/`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update job status');
    }

    return response.json();
  }

  // Job Response operations
  async getJobResponses(jobId: number): Promise<JobResponse[]> {
    const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/jobs/${jobId}/responses/`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch job responses');
    }

    return response.json();
  }

  async getWorkerJobResponses(): Promise<JobResponse[]> {
    const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/worker/responses/`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch worker job responses');
    }

    const data = await response.json();
    
    // Handle paginated response structure
    if (data && typeof data === 'object' && Array.isArray(data.results)) {
      console.log('API returned paginated worker responses, extracting results:', data.results.length, 'responses');
      return data.results;
    }
    
    // Handle direct array response (fallback)
    if (Array.isArray(data)) {
      return data;
    }
    
    // If neither paginated nor array, log warning and return empty array
    console.warn('API returned unexpected data structure for worker responses:', data);
    return [];
  }

  async createJobResponse(jobId: number, data: CreateJobResponseData): Promise<JobResponse> {
    const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/jobs/${jobId}/responses/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create job response');
    }

    return response.json();
  }

  async acceptJobResponse(responseId: number): Promise<Assignment> {
    const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/responses/${responseId}/accept/`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to accept job response');
    }

    return response.json();
  }

  async updateJobResponse(responseId: number, data: Partial<CreateJobResponseData>): Promise<JobResponse> {
    const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/responses/${responseId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update job response');
    }

    return response.json();
  }

  async deleteJobResponse(responseId: number): Promise<void> {
    const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/responses/${responseId}/`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete job response');
    }
  }

  // Assignment operations
  async getAssignments(params?: { 
    customer?: number; 
    worker?: number; 
    status?: string;
  }): Promise<Assignment[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const url = `${API_BASE_URL}/assignments/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await this.makeAuthenticatedRequest(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch assignments');
    }

    const data = await response.json();
    
    // Handle paginated response structure
    if (data && typeof data === 'object' && Array.isArray(data.results)) {
      console.log('API returned paginated assignments, extracting results:', data.results.length, 'assignments');
      return data.results;
    }
    
    // Handle direct array response (fallback)
    if (Array.isArray(data)) {
      return data;
    }
    
    // If neither paginated nor array, log warning and return empty array
    console.warn('API returned unexpected data structure for assignments:', data);
    return [];
  }

  async getAssignment(id: number): Promise<Assignment> {
    const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/assignments/${id}/`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch assignment');
    }

    return response.json();
  }

  async updateAssignment(id: number, data: Partial<Assignment>): Promise<Assignment> {
    const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/assignments/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update assignment');
    }

    return response.json();
  }

  // Utility methods
  async getNearbyJobs(params?: { 
    city?: string; 
    radius?: number; 
    category?: string;
  }): Promise<Job[]> {
    return this.getJobs({ 
      status: 'open',
      ...params 
    });
  }

  async getCustomerJobs(customerId: number): Promise<Job[]> {
    return this.getJobs({ customer: customerId });
  }

  async getWorkerAssignments(workerId: number): Promise<Assignment[]> {
    return this.getAssignments({ worker: workerId });
  }
}

export const jobService = new JobService();