import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, UserCheck, Briefcase } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    password: '',
    password_confirm: '',
  });
  const [userType, setUserType] = useState<'customer' | 'worker'>('customer');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
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

    // Validation
    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        ...formData,
        user_type: userType,
      });
      // Redirect to appropriate dashboard based on user type
      const redirectPath = userType === 'customer' ? '/customer' : '/worker';
      navigate(redirectPath);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
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
                {userType === 'customer' ? 'Find Skilled Workers' : 'Find Great Jobs'}
              </h2>
              <p className="text-xl opacity-90">
                {userType === 'customer' 
                  ? 'Connect with verified professionals for all your needs'
                  : 'Join thousands of workers finding meaningful employment'
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
                  Join KaamWale
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Create your account to get started
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
                    <p className="text-sm text-gray-600 text-center">
                      Looking to hire skilled professionals for your projects
                    </p>
                  </TabsContent>
                  
                  <TabsContent value="worker" className="mt-4">
                    <p className="text-sm text-gray-600 text-center">
                      Ready to showcase your skills and find work opportunities
                    </p>
                  </TabsContent>
                </Tabs>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        name="first_name"
                        type="text"
                        placeholder="First name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        required
                        disabled={isLoading}
                        className="border-gray-300 focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        name="last_name"
                        type="text"
                        placeholder="Last name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        required
                        disabled={isLoading}
                        className="border-gray-300 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="Choose a username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  
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
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <Input
                      id="phone_number"
                      name="phone_number"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
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
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password_confirm">Confirm Password</Label>
                    <Input
                      id="password_confirm"
                      name="password_confirm"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.password_confirm}
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
                        Creating Account...
                      </>
                    ) : (
                      `Create ${userType === 'customer' ? 'Customer' : 'Worker'} Account`
                    )}
                  </Button>
                </form>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link to={`/login?type=${userType}`} className="font-medium text-blue-600 hover:text-blue-500">
                      Sign in
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

export default Register;