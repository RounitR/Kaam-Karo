import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  profileService, 
  WorkerProfile, 
  CustomerProfile, 
  UpdateWorkerProfileData, 
  UpdateCustomerProfileData 
} from '@/lib/profile';
import { useAuth } from '@/contexts/AuthContext';

// Query keys
export const profileKeys = {
  all: ['profiles'] as const,
  worker: () => [...profileKeys.all, 'worker'] as const,
  customer: () => [...profileKeys.all, 'customer'] as const,
  user: () => [...profileKeys.all, 'user'] as const,
};

// Worker Profile hooks
export const useWorkerProfile = () => {
  const { isAuthenticated, user } = useAuth();
  
  return useQuery({
    queryKey: profileKeys.worker(),
    queryFn: () => profileService.getWorkerProfile(),
    enabled: isAuthenticated && user?.user_type === 'worker',
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.message?.includes('Authentication') || error?.message?.includes('credentials')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useUpdateWorkerProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateWorkerProfileData) => profileService.updateWorkerProfile(data),
    onSuccess: (updatedProfile) => {
      // Update the worker profile cache
      queryClient.setQueryData(profileKeys.worker(), updatedProfile);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: profileKeys.user() });
    },
    onError: (error) => {
      console.error('Failed to update worker profile:', error);
    },
  });
};

// Customer Profile hooks
export const useCustomerProfile = () => {
  const { isAuthenticated, user } = useAuth();
  
  return useQuery({
    queryKey: profileKeys.customer(),
    queryFn: () => profileService.getCustomerProfile(),
    enabled: isAuthenticated && user?.user_type === 'customer',
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.message?.includes('Authentication') || error?.message?.includes('credentials')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useUpdateCustomerProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateCustomerProfileData) => profileService.updateCustomerProfile(data),
    onSuccess: (updatedProfile) => {
      // Update the customer profile cache
      queryClient.setQueryData(profileKeys.customer(), updatedProfile);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: profileKeys.user() });
    },
    onError: (error) => {
      console.error('Failed to update customer profile:', error);
    },
  });
};

// User Profile hook (includes both user data and profile data)
export const useUserProfile = () => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: profileKeys.user(),
    queryFn: () => profileService.getUserProfile(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.message?.includes('Authentication') || error?.message?.includes('credentials')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useWorkerProfileByUserId = (userId: number | null) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: [...profileKeys.worker(), 'byUserId', userId],
    queryFn: () => profileService.getWorkerProfileByUserId(userId!),
    enabled: isAuthenticated && userId !== null,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.message?.includes('Authentication') || error?.message?.includes('credentials')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};