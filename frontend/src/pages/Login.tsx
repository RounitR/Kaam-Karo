import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, UserCheck, Briefcase, LogOut } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [userType, setUserType] = useState<'customer' | 'worker'>('customer');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, logout, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Set user type from URL parameter
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam === 'worker' || typeParam === 'customer') {
      setUserType(typeParam);
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email: formData.email, password: formData.password });
      // Redirect to appropriate dashboard based on user type
      const redirectPath = userType === 'customer' ? '/customer' : '/worker';
      navigate(redirectPath);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="flex min-h-screen">
        {/* Hero Image Section */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 items-center justify-center p-12">
          <div className="text-center text-white">
            <div className="mb-8">
              <div className="w-32 h-32 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-6">
                {userType === 'customer' ? (
                  <UserCheck className="w-16 h-16" />
                ) : (
                  <Briefcase className="w-16 h-16" />
                )}
              </div>
              <h2 className="text-4xl font-bold mb-4">
                Welcome Back!
              </h2>
              <p className="text-xl opacity-90">
                {userType === 'customer' 
                  ? 'Continue managing your projects and finding skilled workers'
                  : 'Continue your journey to find meaningful work opportunities'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <Card className="shadow-lg">
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-3xl font-bold text-gray-900">
                  Sign In
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* User Type Toggle */}
                <Tabs value={userType} onValueChange={(value) => setUserType(value as 'customer' | 'worker')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="customer" className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      Customer
                    </TabsTrigger>
                    <TabsTrigger value="worker" className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Worker
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="customer" className="mt-4">
                    {isAuthenticated && user?.user_type === 'customer' ? (
                      <Alert className="border-blue-200 bg-blue-50">
                        <UserCheck className="w-4 h-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          You are already logged in as a customer. 
                          <Button 
                            variant="link" 
                            className="p-0 h-auto text-blue-600 underline ml-1"
                            onClick={async () => {
                              await logout();
                              navigate('/');
                            }}
                          >
                            Logout
                          </Button>
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <p className="text-sm text-gray-600 text-center">
                        Sign in to manage your projects and hire workers
                      </p>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="worker" className="mt-4">
                    {isAuthenticated && user?.user_type === 'worker' ? (
                      <Alert className="border-blue-200 bg-blue-50">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          You are already logged in as a worker. 
                          <Button 
                            variant="link" 
                            className="p-0 h-auto text-blue-600 underline ml-1"
                            onClick={async () => {
                              await logout();
                              navigate('/');
                            }}
                          >
                            Logout
                          </Button>
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <p className="text-sm text-gray-600 text-center">
                        Sign in to find work opportunities and manage your profile
                      </p>
                    )}
                  </TabsContent>
                </Tabs>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      `Sign In as ${userType === 'customer' ? 'Customer' : 'Worker'}`
                    )}
                  </Button>
                </form>
                
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link to={`/register?type=${userType}`} className="font-medium text-blue-600 hover:text-blue-500">
                      Create one
                    </Link>
                  </p>
                  <p className="text-sm text-gray-500">
                    <Link to="/forgot-password" className="hover:text-blue-500">
                      Forgot your password?
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Login;