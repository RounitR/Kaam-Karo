import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService, Job, JobResponse, Assignment, CreateJobData, CreateJobResponseData } from '@/lib/jobs';
import { useAuth } from '@/contexts/AuthContext';

// Query keys
export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...jobKeys.lists(), { filters }] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (id: number) => [...jobKeys.details(), id] as const,
  responses: (jobId: number) => [...jobKeys.all, 'responses', jobId] as const,
  assignments: () => ['assignments'] as const,
  assignmentsList: (filters: Record<string, any>) => [...jobKeys.assignments(), 'list', { filters }] as const,
};

// Jobs hooks
export const useJobs = (filters?: { 
  category?: string; 
  city?: string; 
  urgency?: string; 
  status?: string;
  customer?: number;
}) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: jobKeys.list(filters || {}),
    queryFn: () => jobService.getJobs(filters),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
    enabled: isAuthenticated, // Only run when authenticated
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.message?.includes('Authentication') || error?.message?.includes('credentials')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useJob = (id: number) => {
  return useQuery({
    queryKey: jobKeys.detail(id),
    queryFn: () => jobService.getJob(id),
    enabled: !!id,
  });
};

export const useCreateJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateJobData) => jobService.createJob(data),
    onSuccess: () => {
      // Invalidate all job-related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
      queryClient.invalidateQueries({ queryKey: jobKeys.assignments() });
    },
  });
};

export const useUpdateJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateJobData> }) => 
      jobService.updateJob(id, data),
    onSuccess: (updatedJob) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
      queryClient.setQueryData(jobKeys.detail(updatedJob.id), updatedJob);
    },
  });
};

export const useDeleteJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => jobService.deleteJob(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
      queryClient.removeQueries({ queryKey: jobKeys.detail(deletedId) });
    },
  });
};

export const useUpdateJobStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: Job['status'] }) => 
      jobService.updateJobStatus(id, status),
    onSuccess: (updatedJob) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobKeys.assignments() });
      queryClient.setQueryData(jobKeys.detail(updatedJob.id), updatedJob);
    },
  });
};

// Job responses hooks
export const useJobResponses = (jobId: number) => {
  return useQuery({
    queryKey: jobKeys.responses(jobId),
    queryFn: () => jobService.getJobResponses(jobId),
    enabled: !!jobId,
  });
};

export const useWorkerJobResponses = () => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['worker-job-responses'],
    queryFn: () => jobService.getWorkerJobResponses(),
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateJobResponse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: number; data: CreateJobResponseData }) => 
      jobService.createJobResponse(jobId, data),
    onSuccess: (_, { jobId }) => {
      // Invalidate job responses for this specific job
      queryClient.invalidateQueries({ queryKey: jobKeys.responses(jobId) });
      // Invalidate all job lists (including nearby jobs)
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
      // Invalidate worker job responses to update accepted/quoted jobs
      queryClient.invalidateQueries({ queryKey: ['worker-job-responses'] });
      // Invalidate assignments in case this creates a new assignment
      queryClient.invalidateQueries({ queryKey: jobKeys.assignments() });
    },
  });
};

export const useAcceptJobResponse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (responseId: number) => jobService.acceptJobResponse(responseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
      queryClient.invalidateQueries({ queryKey: jobKeys.assignments() });
    },
  });
};

export const useUpdateJobResponse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ responseId, data }: { responseId: number; data: Partial<CreateJobResponseData> }) => 
      jobService.updateJobResponse(responseId, data),
    onSuccess: (updatedResponse) => {
      // Invalidate job responses for the specific job
      queryClient.invalidateQueries({ queryKey: jobKeys.responses(updatedResponse.job) });
      // Invalidate worker job responses to update the worker's view
      queryClient.invalidateQueries({ queryKey: ['worker-job-responses'] });
      // Invalidate all job lists
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
  });
};

export const useDeleteJobResponse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (responseId: number) => jobService.deleteJobResponse(responseId),
    onSuccess: () => {
      // Invalidate all relevant queries since we don't have the job ID after deletion
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
      queryClient.invalidateQueries({ queryKey: ['worker-job-responses'] });
    },
  });
};

// Assignments hooks
export const useAssignments = (filters?: { 
  customer?: number; 
  worker?: number; 
  status?: string;
}) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: jobKeys.assignmentsList(filters || {}),
    queryFn: () => jobService.getAssignments(filters),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
    enabled: isAuthenticated, // Only run when authenticated
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.message?.includes('Authentication') || error?.message?.includes('credentials')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useAssignment = (id: number) => {
  return useQuery({
    queryKey: [...jobKeys.assignments(), 'detail', id],
    queryFn: () => jobService.getAssignment(id),
    enabled: !!id,
  });
};

export const useUpdateAssignment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Assignment> }) => 
      jobService.updateAssignment(id, data),
    onSuccess: (updatedAssignment) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.assignments() });
      queryClient.setQueryData(
        [...jobKeys.assignments(), 'detail', updatedAssignment.id], 
        updatedAssignment
      );
    },
  });
};

// Convenience hooks
export const useCustomerJobs = () => {
  const { user } = useAuth();
  
  return useJobs({ 
    customer: user?.id,
  });
};

export const useNearbyJobs = (city?: string, category?: string) => {
  return useJobs({ 
    status: 'open',
    city,
    category,
  });
};

export const useWorkerAssignments = () => {
  const { user } = useAuth();
  
  return useAssignments({ 
    worker: user?.id,
  });
};

export const useCustomerAssignments = () => {
  const { user } = useAuth();
  
  return useAssignments({ 
    customer: user?.id,
  });
};