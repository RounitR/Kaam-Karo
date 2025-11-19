import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Briefcase, Users, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleUserTypeSwitch = (targetType: 'customer' | 'worker') => {
    if (isAuthenticated && user?.user_type === targetType) {
      // If already logged in as the target type, navigate to dashboard
      const dashboardPath = targetType === 'customer' ? '/customer' : '/worker';
      navigate(dashboardPath);
    } else {
      // Navigate to login page with target type, keeping user logged in
      navigate(`/login?type=${targetType}`);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">KaamKaro</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-foreground hover:text-primary transition-colors">
              Home
            </Link>
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => handleUserTypeSwitch('customer')}
                  className={`text-foreground hover:text-primary transition-colors ${
                    user?.user_type === 'customer' ? 'bg-primary/10 px-3 py-1 rounded-md font-medium' : ''
                  }`}
                >
                  For Customers
                </button>
                <button
                  onClick={() => handleUserTypeSwitch('worker')}
                  className={`text-foreground hover:text-primary transition-colors ${
                    user?.user_type === 'worker' ? 'bg-primary/10 px-3 py-1 rounded-md font-medium' : ''
                  }`}
                >
                  For Workers
                </button>
              </>
            ) : (
              <>
                <Link to="/login?type=customer" className="text-foreground hover:text-primary transition-colors">
                  For Customers
                </Link>
                <Link to="/login?type=worker" className="text-foreground hover:text-primary transition-colors">
                  For Workers
                </Link>
              </>
            )}
            <Link to="/contact" className="text-foreground hover:text-primary transition-colors">
              Contact
            </Link>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {user?.first_name || user?.username}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={user?.user_type === 'customer' ? '/customer' : '/worker'}>
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Sign Up</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-border">
            <Link
              to="/"
              className="block text-foreground hover:text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            {isAuthenticated ? (
               <>
                 <button
                   onClick={() => {
                     handleUserTypeSwitch('customer');
                     setIsOpen(false);
                   }}
                   className={`block text-foreground hover:text-primary transition-colors ${
                     user?.user_type === 'customer' ? 'bg-primary/10 px-3 py-1 rounded-md font-medium' : ''
                   }`}
                 >
                   For Customers
                 </button>
                 <button
                   onClick={() => {
                     handleUserTypeSwitch('worker');
                     setIsOpen(false);
                   }}
                   className={`block text-foreground hover:text-primary transition-colors ${
                     user?.user_type === 'worker' ? 'bg-primary/10 px-3 py-1 rounded-md font-medium' : ''
                   }`}
                 >
                   For Workers
                 </button>
               </>
             ) : (
              <>
                <Link
                  to="/login?type=customer"
                  className="block text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  For Customers
                </Link>
                <Link
                  to="/login?type=worker"
                  className="block text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  For Workers
                </Link>
              </>
            )}
            <Link
              to="/contact"
              className="block text-foreground hover:text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Contact
            </Link>
            <div className="flex flex-col space-y-2 pt-4">
              {isAuthenticated ? (
                <>
                  <Button variant="outline" asChild className="w-full">
                    <Link to={user?.user_type === 'customer' ? '/customer' : '/worker'} onClick={() => setIsOpen(false)}>
                      Dashboard
                    </Link>
                  </Button>
                  <Button variant="destructive" onClick={() => { handleLogout(); setIsOpen(false); }} className="w-full">
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" asChild className="w-full">
                    <Link to="/login" onClick={() => setIsOpen(false)}>Login</Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link to="/register" onClick={() => setIsOpen(false)}>Sign Up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
