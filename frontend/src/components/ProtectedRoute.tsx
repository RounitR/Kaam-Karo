import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredUserType?: 'customer' | 'worker';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredUserType 
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  console.log('🛡️ ProtectedRoute check:', {
    loading,
    isAuthenticated,
    user: user ? { id: user.id, user_type: user.user_type } : null,
    requiredUserType,
    pathname: location.pathname
  });

  // Show loading spinner while checking authentication
  if (loading) {
    console.log('⏳ Showing loading spinner...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('🚫 Not authenticated, redirecting to login...');
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Check if user type matches required type
  if (requiredUserType && user?.user_type !== requiredUserType) {
    console.log('🔄 User type mismatch, redirecting...');
    // Redirect to appropriate dashboard based on user type
    const redirectPath = user?.user_type === 'customer' ? '/customer' : '/worker';
    return <Navigate to={redirectPath} replace />;
  }

  console.log('✅ ProtectedRoute passed, rendering children...');
  return <>{children}</>;
};

export default ProtectedRoute;