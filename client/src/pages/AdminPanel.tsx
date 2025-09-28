import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { SEO } from '@/components/SEO';
import { apiRequest } from '@/lib/queryClient';
import { Upload, Trash2, Eye, EyeOff, FileText, RefreshCw } from 'lucide-react';
import type { Upload as UploadType, Purchase, Material, User } from '@shared/schema';

export default function AdminPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [price, setPrice] = useState('');
  const [pageCount, setPageCount] = useState('');
  const [selectedTechnology, setSelectedTechnology] = useState<string>('');
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [activeTab, setActiveTab] = useState<'uploads' | 'purchases'>('uploads');

  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    price: '',
    technology: '',
    difficulty: 'beginner'
  });

  const technologies = [
    'dotnet',
    'java',
    'python',
    'react',
    'nodejs',
    'flutter',
    'ml-ai',
    'system-design'
  ];

  // Check admin status
  const { data: adminCheck, isLoading: isCheckingAdmin } = useQuery<{ isAdmin: boolean }>({
    queryKey: ['/api/admin/check'],
    retry: false,
  });

  // Get all uploads
  const { data: uploads = [], isLoading: isLoadingUploads, refetch: refetchUploads } = useQuery<UploadType[]>({
    queryKey: ['/api/admin/uploads'],
    enabled: adminCheck?.isAdmin === true,
  });

  // Get all purchases for admin tracking
  const { data: purchases = [], isLoading: isLoadingPurchases, refetch: refetchPurchases } = useQuery({
    queryKey: ['/api/admin/purchases'],
    enabled: adminCheck?.isAdmin === true,
    staleTime: 0, // Always fetch fresh data
    queryFn: async () => {
      const token = localStorage.getItem('admin-token');
      const response = await fetch('/api/admin/purchases', {
        headers: {
          'Authorization': token || '',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch purchases');
      }
      return response.json();
    },
  }) as { data: (Purchase & { material: Material, user: User | null })[], isLoading: boolean, refetch: () => void };
  const filteredUploads = useMemo(
    () =>
      !selectedTechnology
        ? uploads
        : uploads.filter(
          (u) => u.technology?.toLowerCase() === selectedTechnology.toLowerCase()
        ),
    [uploads, selectedTechnology]
  );

  // Upload file mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, technology }: { file: File; technology: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('technology', technology);
      formData.append('price', price);
      formData.append('pageCount', pageCount);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': localStorage.getItem('admin-token') || '',
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Upload Successful",
        description: "PDF uploaded and ready for use",
      });
      setSelectedFile(null);
      setSelectedTechnology('');
      refetchUploads();
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete upload mutation
  const deleteMutation = useMutation({
    mutationFn: async (uploadId: number) => {
      return await apiRequest('DELETE', `/api/admin/uploads/${uploadId}`);
    },
    onSuccess: () => {
      toast({
        title: "Delete Successful",
        description: "Upload deleted successfully",
      });
      refetchUploads();
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpload = () => {
    if (!selectedFile || !selectedTechnology) {
      toast({
        title: "Missing Information",
        description: "Please select both a file and technology",
        variant: "destructive",
      });
      return;
    }

    // Check if file for this technology already exists
    const existingUpload = uploads.find(upload => upload.technology === selectedTechnology);
    if (existingUpload) {
      toast({
        title: "Upload Exists",
        description: `A ${selectedTechnology.toUpperCase()} file already exists. Please delete it first or choose a different technology.`,
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({ file: selectedFile, technology: selectedTechnology });
  };

  const handleDelete = (uploadId: number) => {
    if (confirm('Are you sure you want to delete this PDF?')) {
      deleteMutation.mutate(uploadId);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (isCheckingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      debugger;
      setPrice(value);
    }
  };

  const handlePageCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setPageCount(value);
    }
  };

  if (!adminCheck?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need admin privileges to access this panel.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <SEO title="Admin Panel" url="https://www.techinterviewnotes.com/admin" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600">Manage PDF uploads and track purchases</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('uploads')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'uploads'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              File Uploads
            </button>
            <button
              onClick={() => setActiveTab('purchases')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'purchases'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Purchase Tracking
            </button>
          </div>
        </div>

        {activeTab === 'uploads' && (
          <>
            {/* Upload Section */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  Upload New PDF
                </CardTitle>
                <CardDescription>
                  Upload interview guide PDFs organized by technology
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="technology">Technology</Label>
                  <Select value={selectedTechnology} onValueChange={setSelectedTechnology}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select technology" />
                    </SelectTrigger>
                    <SelectContent>
                      {technologies.map((tech) => (
                        <SelectItem key={tech} value={tech}>
                          {tech.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="text"
                    value={price}
                    onChange={handlePriceChange}
                    placeholder="Enter price"
                  />

                </div>

                <div>
                  <Label htmlFor="pageCount">Number Of Questions</Label>
                  <Input
                    id="pageCount"
                    type="text"
                    value={pageCount}
                    onChange={handlePageCountChange}
                    placeholder="Enter Number Of Questions"
                  />

                </div>
                <div>
                  <Label htmlFor="file">PDF File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    disabled={filteredUploads.length > 0}
                  />
                  {filteredUploads.length > 0 && selectedTechnology && <p className="mt-1 text-xs text-red-600">
                    First Delete Existing File.
                  </p>}
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || !selectedTechnology || uploadMutation.isPending || filteredUploads.length > 0 || !selectedTechnology}
                  className="w-full"
                >
                  {uploadMutation.isPending ? "Uploading..." : "Upload PDF"}
                </Button>
              </CardContent>
            </Card>

            {/* Uploaded Files */}
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Files</CardTitle>
                <CardDescription>
                  Manage your uploaded interview guide PDFs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUploads ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : filteredUploads.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No files uploaded yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredUploads.map((upload) => (
                      <div key={upload.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{upload.originalName}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                              <span>Technology: {upload.technology.toUpperCase()}</span>
                              <span>Size: {formatFileSize(upload.fileSize)}</span>
                              <span>Uploaded: {upload.createdAt ? new Date(upload.createdAt).toLocaleDateString() : 'N/A'}</span>
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(upload.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'purchases' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Purchase Tracking
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchPurchases()}
                  disabled={isLoadingPurchases}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </CardTitle>
              <CardDescription>
                View all customer purchases and download activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPurchases ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : purchases.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No purchases yet
                </div>
              ) : (
                <div className="space-y-4">
                  {purchases.map((purchase) => (
                    <div key={purchase.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{purchase.material.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                            <span>Customer: {purchase.user?.email || 'Anonymous'}</span>
                            <span>Technology: {purchase.material.technology}</span>
                            <span>Price: ${purchase.price}</span>
                            <span>Date: {purchase.purchasedAt ? new Date(purchase.purchasedAt).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Purchased
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}