import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { MaterialCard } from '@/components/MaterialCard';

import type { Material } from '@shared/schema';
import { Link } from 'wouter';
import { CheckCircle2, Download, Star, Code, Settings } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { useEffect, useState } from 'react';

const technologies = [
  '.NET', 'React', 'Flutter', 'Java', 'Python', 'ML/AI', 'Node.js', 'Angular', 'Vue.js', 'PHP'
];

export default function Home() {
  const { user } = useAuth();

  const [currentTechIndex, setCurrentTechIndex] = useState(0);

  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ['/api/materials'],
  });

  // Auto-scroll technology carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTechIndex((prev) => (prev + 1) % technologies.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
      <SEO title="Dashboard" url="https://www.techinterviewnotes.com" />
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center bg-purple-500/20 rounded-full px-4 py-2 mb-6">
              <Star className="h-4 w-4 mr-2 text-yellow-400" />
              <span className="text-sm font-medium">Launch Special: 50% OFF</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Master Your <span className="text-purple-300">Tech Interview</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-purple-100 mb-8 max-w-3xl mx-auto">
              Get instant access to 1000+ real interview questions from top tech companies with expert solutions and insider tips.
            </p>
            
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-400 mr-2" />
                <span>Real Company Questions</span>
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-400 mr-2" />
                <span>Expert Solutions</span>
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-400 mr-2" />
                <span>Instant PDF Download</span>
              </div>
            </div>
            
            {user?.isAdmin ? (
              <Link href="/admin">
                <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8 py-3">
                  <Settings className="h-5 w-5 mr-2" />
                  Manage Content
                </Button>
              </Link>
            ) : (
              <Link href="/materials">
                <Button size="lg" className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-8 py-3">
                  <Download className="h-5 w-5 mr-2" />
                  Get Started Today
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Technologies Covered Section */}
      <div className="py-16 bg-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Technologies Covered</h2>
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-1000 ease-in-out gap-8"
              style={{ transform: `translateX(-${currentTechIndex * 200}px)` }}
            >
              {[...technologies, ...technologies].map((tech, index) => (
                <div 
                  key={index}
                  className="flex-shrink-0 bg-white/10 rounded-lg px-6 py-4 backdrop-blur-sm border border-white/20"
                >
                  <div className="flex items-center space-x-3">
                    <Code className="h-6 w-6 text-purple-300" />
                    <span className="font-semibold text-lg whitespace-nowrap">{tech}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Materials Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Interview Materials</h2>
            <p className="text-xl text-purple-100">Real questions from leading tech companies</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {materials.slice(0, 6).map((material) => (
              <MaterialCard 
                key={material.id} 
                material={material} 
                showBuyButton={!user?.isAdmin}
              />
            ))}
          </div>
          
          <div className="text-center">
            <Link href="/materials">
              <Button variant="outline" size="lg" className="border-purple-300 text-purple-300 hover:bg-purple-300 hover:text-purple-900">
                View All Materials
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}