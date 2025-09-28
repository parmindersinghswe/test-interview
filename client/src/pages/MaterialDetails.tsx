import { useParams, Link, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@shared/LanguageProvider';
import { isUnauthorizedError } from '@/lib/authUtils';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Material, Review, User } from '@shared/schema';
import {
  Star,
  ShoppingCart,
  ArrowLeft,
  Download,
  Eye,
  Calendar,
  BookOpen,
  Users
} from 'lucide-react';
import { SEO } from '@/components/SEO';
import { DEFAULT_IMAGE_URL, buildSiteUrl } from '@/lib/site';
import { useState } from 'react';

export default function MaterialDetails() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const { data: material, isLoading } = useQuery<Material>({
    queryKey: [`/api/materials/${id}`],
  });

  const { data: reviews = [] } = useQuery<(Review & { user: User })[]>({
    queryKey: [`/api/materials/${id}/reviews`],
    enabled: !!id,
  });

  const { data: hasPurchased = false } = useQuery({
    queryKey: [`/api/purchases/check/${id}`],
    queryFn: async () => {
      if (!isAuthenticated) return false;
      const purchases = await fetch('/api/purchases', { credentials: 'include' });
      if (!purchases.ok) return false;
      const data = await purchases.json();
      return data.some((p: any) => p.materialId === parseInt(id!));
    },
    enabled: isAuthenticated && !!id,
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/cart', { materialId: parseInt(id!) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: "Success",
        description: "Material added to cart successfully!",
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

  const reviewMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', `/api/materials/${id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/materials/${id}/reviews`] });
      setReviewComment('');
      setReviewRating(5);
      toast({
        title: "Success",
        description: "Review submitted successfully!",
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!material) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Material Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The material you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/materials">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Materials
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : parseFloat(material.rating);

  const userHasReviewed = reviews.some(review => review.userId === user?.id);

  const productSchema = material ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: material.title,
    description: material.description,
    image: material.imageUrl ?? DEFAULT_IMAGE_URL,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: Number(material.rating),
      reviewCount: material.reviewCount,
    },
    offers: {
      '@type': 'Offer',
      price: Number(material.price),
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: buildSiteUrl(`/materials/${id}`),
    },
  } : undefined;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 py-8">
      <SEO
        title={material ? material.title : 'Material Details'}
        description={material ? material.description : undefined}
        url={buildSiteUrl(`/materials/${id}`)}
        image={material?.imageUrl ?? DEFAULT_IMAGE_URL}
        type="article"
        schema={productSchema}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/materials">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Materials
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="p-8">
                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Badge className={getTechnologyColor(material.technology)}>
                      {getTechnologyLabel(material.technology)}
                    </Badge>
                    <Badge variant="outline">
                      {material.difficulty}
                    </Badge>
                  </div>
                  
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    {material.title}
                  </h1>
                  
                  <div className="flex items-center space-x-6 text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-400 mr-1" />
                      <span className="font-semibold">{averageRating.toFixed(1)}</span>
                      <span className="ml-1">({reviews.length} reviews)</span>
                    </div>
                    <div className="flex items-center">
                      <BookOpen className="h-5 w-5 mr-1" />
                      <span>{material.pages} pages</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-5 w-5 mr-1" />
                      <span>{material.reviewCount} students</span>
                    </div>
                  </div>
                </div>

                {/* Image */}
                <img
                  src={material.imageUrl || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400'}
                  alt={material.title}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                  loading="lazy"
                />

                {/* Description */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    About This Material
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {material.description}
                  </p>
                </div>

                {/* What You'll Learn */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    What You'll Learn
                  </h2>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Comprehensive interview questions and answers
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Real-world coding challenges and solutions
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Best practices and industry standards
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Expert tips and strategies for success
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card className="bg-white dark:bg-gray-800 mt-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-400 mr-2" />
                  Reviews ({reviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* Add Review Form (if purchased and not reviewed) */}
                {isAuthenticated && hasPurchased && !userHasReviewed && (
                  <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      Leave a Review
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="rating">Rating</Label>
                        <div className="flex items-center space-x-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setReviewRating(star)}
                              className="focus:outline-none"
                            >
                              <Star
                                className={`h-6 w-6 ${
                                  star <= reviewRating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="comment">Comment (Optional)</Label>
                        <Textarea
                          id="comment"
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Share your experience with this material..."
                          className="mt-1"
                        />
                      </div>
                      <Button
                        onClick={() => reviewMutation.mutate()}
                        disabled={reviewMutation.isPending}
                      >
                        Submit Review
                      </Button>
                    </div>
                  </div>
                )}

                {/* Reviews List */}
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
                      <div className="flex items-start space-x-4">
                        <img
                          src={review.user.profileImageUrl || '/default-avatar.png'}
                          alt={review.user.firstName || 'User'}
                          className="w-10 h-10 rounded-full object-cover"
                          loading="lazy"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {review.user.firstName} {review.user.lastName}
                            </span>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">
                              <Calendar className="h-4 w-4 inline mr-1" />
                              {new Date(review.createdAt!).toLocaleDateString()}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-gray-700 dark:text-gray-300">
                              {review.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {reviews.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No reviews yet. Be the first to review this material!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-white dark:bg-gray-800 sticky top-8">
              <CardContent className="p-6">
                {/* Pricing */}
                <div className="text-center mb-6">
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-blue-600">
                      ${material.price}
                    </span>
                    {material.originalPrice && (
                      <span className="text-lg text-gray-500 line-through ml-2">
                        ${material.originalPrice}
                      </span>
                    )}
                  </div>
                  
                  {hasPurchased ? (
                    <div className="space-y-3">
                      <Button className="w-full bg-green-600 hover:bg-green-700">
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        Read Online
                      </Button>
                    </div>
                  ) : isAuthenticated ? (
                    <div className="space-y-3">
                      <Button
                        onClick={() => addToCartMutation.mutate()}
                        disabled={addToCartMutation.isPending}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {t('materials.add_to_cart')}
                      </Button>
                      <Link href="/checkout">
                        <Button variant="outline" className="w-full">
                          Buy Now
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <Link href="/login">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Login to Purchase
                      </Button>
                    </Link>
                  )}
                </div>

                <Separator className="my-6" />

                {/* Material Info */}
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Technology:</span>
                    <Badge className={getTechnologyColor(material.technology)}>
                      {getTechnologyLabel(material.technology)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Difficulty:</span>
                    <span className="font-semibold capitalize text-gray-900 dark:text-white">
                      {material.difficulty}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Pages:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {material.pages}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Rating:</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {averageRating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Guarantees */}
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
                    Lifetime access
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Mobile and desktop compatible
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
