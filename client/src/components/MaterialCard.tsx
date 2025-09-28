import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Download, Users, FileText, CheckCircle, Check } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { useToast } from '@/hooks/use-toast';
import type { Material } from '@shared/schema';

interface MaterialCardProps {
  material: Material;
  showBuyButton?: boolean;
}

export function MaterialCard({ material, showBuyButton = true }: MaterialCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    addItem(material);
    toast({
      title: "Added to Cart!",
      description: `${material.title} has been added to your cart.`,
    });
  };

  const discountPercent = material.originalPrice 
    ? Math.round((1 - Number(material.price) / Number(material.originalPrice)) * 100)
    : 0;

  const getBadgeColor = (technology: string) => {
    switch(technology) {
      case 'dotnet': return 'bg-blue-500';
      case 'react': return 'bg-cyan-500';
      case 'flutter': return 'bg-blue-600';
      default: return 'bg-gray-500';
    }
  };

  const getBadgeText = (technology: string) => {
    switch(technology) {
      case 'dotnet': return '.NET';
      case 'react': return 'React';
      case 'flutter': return 'Flutter';
      default: return 'General';
    }
  };

  return (
    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
      {/* Top badges */}
      <div className="absolute top-3 left-3 z-10">
        {material.reviewCount > 1000 && (
          <Badge className="bg-red-500 hover:bg-red-600 text-white mb-2 block w-fit">
            Bestseller
          </Badge>
        )}
        {Number(material.rating) >= 4.8 && (
          <Badge className="bg-red-500 hover:bg-red-600 text-white mb-2 block w-fit">
            Popular
          </Badge>
        )}
        {material.id === 1 && (
          <Badge className="bg-orange-500 hover:bg-orange-600 text-white block w-fit">
            New
          </Badge>
        )}
      </div>

      {/* Image with tech pattern */}
      <div className="h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative z-10 text-center">
          <FileText className="w-12 h-12 text-white mb-2" />
          <div className="text-white text-xs font-medium">
            {material.technology.toUpperCase()} GUIDE
          </div>
        </div>
        <div className="absolute -top-4 -right-4 w-16 h-16 bg-white bg-opacity-10 rounded-full"></div>
        <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-white bg-opacity-10 rounded-full"></div>
      </div>

      <CardContent className="p-4">
        {/* Title */}
        <h3 className="font-bold text-lg mb-2 text-gray-900 leading-tight">
          {material.title}
        </h3>

        {/* Rating */}
        {/* <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-4 h-4 ${i < Math.floor(Number(material.rating)) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-gray-700">
            {material.rating} ({material.reviewCount.toLocaleString()} reviews)
          </span>
        </div> */}

        {/* Features with highlighted benefits */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-gray-700 font-medium">{`${material.pages}+`} Real Interview Questions</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-gray-700 font-medium">Detailed Step-by-Step Solutions</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-gray-700 font-medium">Instant PDF Download</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-gray-700 font-medium">Code Examples & Explanations</span>
          </div>
          
          {/* Value proposition */}
          <div className="mt-3 p-2 bg-emerald-50 rounded-lg border border-emerald-100">
            <div className="text-xs text-emerald-700 font-medium mb-1">
              ⚡ Instant Access After Purchase
            </div>
            <div className="text-xs text-emerald-600">
              Download immediately & practice anywhere
            </div>
          </div>
        </div>

        {/* Technology badge */}
        <div className="mb-3">
          <Badge className={`${getBadgeColor(material.technology)} text-white`}>
            {getBadgeText(material.technology)}
          </Badge>
        </div>

        {/* Pricing */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl font-bold text-green-600">
            ₹{Math.round(Number(material.price) * 80)}
          </span>
          {material.originalPrice && (
            <>
              <span className="text-sm text-gray-500 line-through">
                ₹{Math.round(Number(material.originalPrice) * 80)}
              </span>
              <Badge className="bg-green-100 text-green-800 text-xs">
                {discountPercent}% OFF
              </Badge>
            </>
          )}
        </div>

        {/* Buy button */}
        {showBuyButton && (
          <Button 
            onClick={() => {
              // Direct to checkout for this specific material
              window.location.href = `/checkout?material=${material.id}`;
            }}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-3 h-auto shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Get Instant Access
          </Button>
        )}

        {/* Download icon */}
        <div className="absolute top-3 right-3">
          <Download className="w-5 h-5 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  );
}