import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useUserAuth } from '@/hooks/useUserAuth';
import { useTheme } from '@/components/ThemeProvider';
import { Button } from '@/components/ui/button';
import { 
  Moon, 
  Sun, 
  User, 
  Menu,
  Code,
  LogIn,
  LogOut
} from 'lucide-react';

export function Header() {
  const { isAuthenticated, user } = useAuth();
  const { user: userAuthUser, isAuthenticated: isUserAuthenticated, logoutMutation } = useUserAuth();
  const { theme, toggleTheme } = useTheme();


  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Code className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              DevInterview Pro
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/">
              <Button 
                variant={isActive('/') ? 'default' : 'ghost'}
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              >
                Home
              </Button>
            </Link>
            <Link href="/materials">
              <Button 
                variant={isActive('/materials') ? 'default' : 'ghost'}
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              >
                Materials
              </Button>
            </Link>
            {isAuthenticated && (
              <>
                <Link href="/my-purchases">
                  <Button 
                    variant={isActive('/my-purchases') ? 'default' : 'ghost'}
                    className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    My Purchases
                  </Button>
                </Link>
                {(user as any)?.isAdmin && (
                  <Link href="/admin">
                    <Button 
                      variant={isActive('/admin') ? 'default' : 'ghost'}
                      className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold"
                    >
                      Admin Panel
                    </Button>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-4">
{/* Language support removed - English only */}

            {/* Theme Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="border-gray-300 dark:border-gray-600"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>

            {/* Cart removed - direct purchase flow only */}

            {/* User Account */}
            {isAuthenticated || isUserAuthenticated ? (
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-medium">
                    {isUserAuthenticated 
                      ? userAuthUser?.firstName?.charAt(0)?.toUpperCase() || 'U'
                      : 'A'
                    }
                  </span>
                </div>
                <Button 
                  variant="outline"
                  onClick={async () => {
                    if (isUserAuthenticated) {
                      logoutMutation.mutate();
                    } else {
                      try {
                        // Clear all auth data from localStorage
                        localStorage.removeItem('admin-token');
                        localStorage.removeItem('adminAuth');
                        await fetch('/api/test-logout', { method: 'POST' });
                        // Redirect to homepage
                        window.location.href = '/';
                      } catch (error) {
                        console.error('Logout failed:', error);
                        // Even if fetch fails, clear localStorage and redirect
                        window.location.href = '/';
                      }
                    }
                  }}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/auth">
                <Button>
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </Link>
            )}

            {/* Mobile menu button */}
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>
    </header>
  );
}
