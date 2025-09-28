import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { MaterialCard } from '@/components/MaterialCard';

import type { Material } from '@shared/schema';
import { Search, Filter } from 'lucide-react';
import { SEO } from '@/components/SEO';

export default function Materials() {

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTechnology, setSelectedTechnology] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  const { data: materials = [], isLoading } = useQuery<Material[]>({
    queryKey: ['/api/materials', { search: searchQuery, technology: selectedTechnology, difficulty: selectedDifficulty }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedTechnology) params.append('technology', selectedTechnology);
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
      
      const response = await fetch(`/api/materials?${params}`);
      if (!response.ok) throw new Error('Failed to fetch materials');
      return response.json();
    },
  });

  const handleSearch = () => {
    // Query will automatically refetch due to dependency array
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 py-8">
      <SEO
        title="Interview Materials"
        description="Browse our curated tech interview questions by technology and difficulty."
        url="https://www.techinterviewnotes.com/materials"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* SEO-Optimized Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            Tech Interview Questions & Answers - Java, Python, React, .NET
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Access 1000+ real interview questions from Google, Microsoft, Amazon, and top tech companies. Expert solutions with code examples for software engineers and developers.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Technology Filter */}
            <Select value={selectedTechnology} onValueChange={setSelectedTechnology}>
              <SelectTrigger>
                <SelectValue placeholder="All Technologies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Technologies</SelectItem>
                <SelectItem value="dotnet">.NET</SelectItem>
                <SelectItem value="react">React</SelectItem>
                <SelectItem value="flutter">Flutter</SelectItem>
                <SelectItem value="Java">Java</SelectItem>
                <SelectItem value="Python">Python</SelectItem>
                <SelectItem value="Node.js">Node.js</SelectItem>
                <SelectItem value="ML/AI">ML/AI</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>

            {/* Difficulty Filter */}
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger>
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>

            {/* Search Button */}
            <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400">
                Found {materials.length} material{materials.length !== 1 ? 's' : ''}
                {searchQuery && ` for "${searchQuery}"`}
              </p>
            </div>

            {/* Materials Grid */}
            {materials.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {materials.map((material) => (
                  <MaterialCard key={material.id} material={material} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mb-4">
                  <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No materials found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Try adjusting your search criteria or browse all materials
                </p>
                <Button 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTechnology('');
                    setSelectedDifficulty('');
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
