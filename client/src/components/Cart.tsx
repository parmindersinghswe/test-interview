import { Link, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Material, CartItem } from '@shared/schema';
import { 
  ShoppingCart, 
  Trash2, 
  CreditCard, 
  ArrowLeft,
  Star,
  BookOpen
} from 'lucide-react';
import { useEffect } from 'react';

export default function Cart() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      const timeout = setTimeout(() => {
        navigate('/login');
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isAuthenticated, isLoading, toast, navigate]);

  const { data: cartItems = [], isLoading: isCartLoading } = useQuery<(CartItem & { material: Material })[]>({
    queryKey: ['/api/cart'],
    enabled: isAuthenticated,
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (materialId: number) => {
      await apiRequest('DELETE', `/api/cart/${materialId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: "Success",
        description: "Item removed from cart",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          navigate('/login');
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading || isCartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const total = cartItems.reduce((sum, item) => sum + parseFloat(item.material.price), 0);

  const getTechnologyColor = (tech: string) => {
    switch (tech) {
      case 'dotnet':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'react':
        return 'bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200';
      case 'flutter':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      default:
        return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
    }
  };

  const getTechnologyLabel = (tech: string) => {
    switch (tech) {
      case 'dotnet': return '.NET';
      case 'react': return 'React';
      case 'flutter': return 'Flutter';
      default: return tech;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Shopping Cart
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
          <Link href="/materials">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </div>

        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {cartItems.map((item) => (
                <Card key={item.id} className="bg-white dark:bg-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <img
                        src={item.material.imageUrl || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200'}
                        alt={item.material.title}
                        className="w-24 h-24 object-cover rounded-lg"
                        loading="lazy"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge className={getTechnologyColor(item.material.technology)}>
                                {getTechnologyLabel(item.material.technology)}
                              </Badge>
                              <Badge variant="outline">
                                {item.material.difficulty}
                              </Badge>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              {item.material.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                              {item.material.description}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <BookOpen className="h-4 w-4 mr-1" />
                                {item.material.pages} pages
                              </div>
                              <div className="flex items-center">
                                <Star className="h-4 w-4 mr-1 text-yellow-400" />
                                {item.material.rating}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-blue-600 mb-2">
                              ${item.material.price}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeFromCartMutation.mutate(item.material.id)}
                              disabled={removeFromCartMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="bg-white dark:bg-gray-800 sticky top-8">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Subtotal ({cartItems.length} items)</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Discount</span>
                      <span className="text-green-600">-$0.00</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                      <span>Total</span>
                      <span className="text-blue-600">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Link href="/checkout">
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 mb-4" 
                      size="lg"
                    >
                      <CreditCard className="h-5 w-5 mr-2" />
                      Proceed to Checkout
                    </Button>
                  </Link>

                  <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Instant download after purchase
                    </div>
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      30-day money-back guarantee
                    </div>
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Secure payment processing
                    </div>
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Lifetime access to materials
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="text-center py-16">
              <ShoppingCart className="h-24 w-24 text-gray-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Your cart is empty
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Looks like you haven't added any interview materials to your cart yet. 
                Start building your preparation library with our premium resources.
              </p>
              <div className="space-y-4">
                <Link href="/materials">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Browse Materials
                  </Button>
                </Link>
                <div className="flex justify-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center">
                    <span className="text-green-500 mr-1">✓</span>
                    High-quality content
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-1">✓</span>
                    Expert-created materials
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-1">✓</span>
                    Instant access
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
