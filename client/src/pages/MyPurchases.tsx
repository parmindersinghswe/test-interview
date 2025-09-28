import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useUserAuth } from '@/hooks/useUserAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Material, Purchase } from '@shared/schema';
import { Download, BookOpen, Calendar, Star } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { FaQuestion } from 'react-icons/fa';
import { DEFAULT_IMAGE_URL, buildSiteUrl } from '@/lib/site';

export default function MyPurchases() {
  const { isAuthenticated, isLoading } = useAuth();
  const { user: userAuthUser, isAuthenticated: isUserAuthenticated, isLoading: isUserLoading } = useUserAuth();
  const { toast } = useToast();

  // Check both authentication systems
  const isLoggedIn = isAuthenticated || isUserAuthenticated;
  const isLoadingAuth = isLoading || isUserLoading;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoadingAuth && !isLoggedIn) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isLoggedIn, isLoadingAuth, toast]);

  const { data: purchases = [], isLoading: isPurchasesLoading } = useQuery<(Purchase & { material: Material })[]>({
    queryKey: ['/api/purchases'],
    enabled: isLoggedIn,
  });

  if (isLoadingAuth || isPurchasesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
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
      case 'dotnet':
        return '.NET';
      case 'react':
        return 'React';
      case 'flutter':
        return 'Flutter';
      default:
        return tech;
    }
  };

  const handleDownload = async (material: Material) => {
    try {
      toast({
        title: "Download Started",
        description: `Preparing ${material.title} for download...`,
      });

      // Make API call to get the actual PDF file
      const response = await fetch(`/api/materials/${material.id}/download`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${material.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Complete",
        description: `${material.title} has been downloaded successfully.`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Unable to download the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReadOnline = async (material: Material) => {
    try {
      toast({
        title: "Loading PDF",
        description: `Opening ${material.title} for reading...`,
      });

      // Fetch the PDF content
      const response = await fetch(`/api/materials/${material.id}/view`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load PDF');
      }

      const blob = await response.blob();
      const pdfUrl = window.URL.createObjectURL(blob);
      
      // Open PDF in a new tab with proper cleanup
      const newWindow = window.open(pdfUrl, '_blank');
      if (newWindow) {
        newWindow.onbeforeunload = () => {
          window.URL.revokeObjectURL(pdfUrl);
        };
        
        toast({
          title: "PDF Opened",
          description: "The PDF has been opened in a new tab.",
        });
      } else {
        window.URL.revokeObjectURL(pdfUrl);
        toast({
          title: "Popup Blocked",
          description: "Please allow popups for this site to view PDFs.",
          variant: "destructive",
        });
      }

    } catch (error) {
      toast({
        title: "View Failed",
        description: "Unable to load the PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 py-8">
      <SEO
        title="My Purchases"
        description="Review and download your purchased interview materials."
        url={buildSiteUrl('/my-purchases')}
        image={DEFAULT_IMAGE_URL}
        type="website"
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Purchases
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Access and download your interview preparation materials
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {purchases.length}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">Total Materials</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Download className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {purchases.length}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">Downloads Available</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${purchases.reduce((sum, p) => sum + parseFloat(p.price), 0).toFixed(2)}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">Total Invested</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Purchases List */}
        {purchases.length > 0 ? (
          <div className="space-y-6">
            {purchases.map((purchase) => (
              <Card key={purchase.id} className="bg-white dark:bg-gray-800">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start space-x-4 mb-4 lg:mb-0">
                      <div className="flex-shrink-0">
                        <img
                          src={purchase.material.imageUrl || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200'}
                          alt={purchase.material.title}
                          className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200';
                          }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={getTechnologyColor(purchase.material.technology)}>
                            {getTechnologyLabel(purchase.material.technology)}
                          </Badge>
                          <Badge variant="outline">
                            {purchase.material.difficulty}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {purchase.material.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {purchase.material.description}
                        </p>
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Purchased on {new Date(purchase.purchasedAt!).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <FaQuestion className="h-4 w-4 mr-1" />
                            {purchase.material.pages} questions
                          </div>
                          {/* <div className="flex items-center">
                            <Star className="h-4 w-4 mr-1 text-yellow-400" />
                            {purchase.material.rating}
                          </div> */}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 lg:w-48">
                      <Button
                        onClick={() => handleDownload(purchase.material)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleReadOnline(purchase.material)}
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Read Online
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No purchases yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start building your interview preparation library with our premium materials
              </p>
              <Button onClick={() => window.location.href = '/materials'}>
                Browse Materials
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
