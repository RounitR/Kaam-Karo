import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, User, LoginCredentials, RegisterData } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  profile: any;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔄 Initializing auth...');
      const token = authService.getAccessToken();
      console.log('🔑 Token found:', !!token);
      
      if (token) {
        try {
          console.log('📡 Fetching user data...');
          const userData = await authService.getCurrentUser();
          console.log('✅ User data received:', userData);
          setUser(userData.user);
          setProfile(userData.profile);
        } catch (error) {
          console.error('❌ Failed to get current user:', error);
          authService.clearTokens();
        }
      }
      console.log('✅ Auth initialization complete');
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    console.log('🔐 Starting login process...');
    setLoading(true);
    try {
      console.log('📡 Sending login request...');
      const response = await authService.login(credentials);
      console.log('✅ Login response received:', response);
      setUser(response.user);
      
      // Fetch profile data
      console.log('📡 Fetching profile data...');
      const userData = await authService.getCurrentUser();
      console.log('✅ Profile data received:', userData);
      setProfile(userData.profile);
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setLoading(true);
    try {
      const response = await authService.register(data);
      setUser(response.user);
      
      // Fetch profile data
      const userData = await authService.getCurrentUser();
      setProfile(userData.profile);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};