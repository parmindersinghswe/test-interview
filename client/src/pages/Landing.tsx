import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MaterialCard } from '@/components/MaterialCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { SEO } from '@/components/SEO';

import type { Material } from '@shared/schema';
import { 
  CheckCircle,
  Star,
  Download,
  Clock,
  Users,
  BookOpen,
  TrendingUp,
  Play,
  Code,
  Database,
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

type ColorKey = 'blue' | 'orange' | 'green' | 'purple' | 'yellow' | 'pink' | 'indigo' | 'red';

const technologies = [
  { name: '.NET', description: 'Enterprise Development', icon: Code, color: 'blue' as ColorKey },
  { name: 'Java', description: 'Backend & Enterprise', icon: Database, color: 'orange' as ColorKey },
  { name: 'Python', description: 'Data Science & Backend', icon: Zap, color: 'green' as ColorKey },
  { name: 'React', description: 'Frontend Development', icon: BookOpen, color: 'purple' as ColorKey },
  { name: 'Node.js', description: 'Backend JavaScript', icon: TrendingUp, color: 'yellow' as ColorKey },
  { name: 'Flutter', description: 'Mobile Development', icon: Star, color: 'pink' as ColorKey },
  { name: 'ML/AI', description: 'Machine Learning', icon: Database, color: 'indigo' as ColorKey },
  { name: 'System Design', description: 'Architecture & Scaling', icon: Code, color: 'red' as ColorKey }
];



export default function Landing() {

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentTechIndex, setCurrentTechIndex] = useState(0);
  const [isTechHovered, setIsTechHovered] = useState(false);

  // Technologies carousel functions
  const getVisibleTechnologies = () => {
    const visible = [];
    for (let i = 0; i < 4; i++) {
      const index = (currentTechIndex + i) % technologies.length;
      visible.push(technologies[index]);
    }
    return visible;
  };

  const nextTechSlide = () => {
    setCurrentTechIndex((prev) => (prev + 1) % technologies.length);
  };

  const prevTechSlide = () => {
    setCurrentTechIndex((prev) => (prev - 1 + technologies.length) % technologies.length);
  };

  // Auto-advance technology carousel
  useEffect(() => {
    if (!isTechHovered) {
      const interval = setInterval(() => {
        setCurrentTechIndex((prev) => (prev + 1) % technologies.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isTechHovered]);

  // Fetch materials for the materials section
  const { data: materials = [], isLoading } = useQuery<Material[]>({
    queryKey: ['/api/materials'],
  });

  // Interview questions for the animated preview
  const interviewQuestions = [
    {
      company: "Microsoft",
      role: ".NET Developer",
      question: "What's the difference between IEnumerable and IQueryable?",
      answer: "🎯 Think of it like ordering at a restaurant: IEnumerable is like getting the entire menu brought to your table, then deciding what you want (executes in memory). IQueryable is like telling the waiter exactly what you want, and they bring only that dish (executes at database). \n\n💡 Code Example: \nIEnumerable<User> users = dbContext.Users.ToList().Where(u => u.Age > 25); // Downloads ALL users first! \nIQueryable<User> users = dbContext.Users.Where(u => u.Age > 25); // Smart: filters at database level",
      tech: "C#",
      level: "Intermediate"
    },
    {
      company: "Google",
      role: "React Developer", 
      question: "Explain React's reconciliation algorithm and virtual DOM diffing",
      answer: "🌳 Think of it like a smart editor comparing two documents: React creates a virtual copy of your UI (Virtual DOM), and when changes happen, it compares the new version with the old one (diffing). Instead of rewriting the entire document, it only updates the specific words that changed (reconciliation). \n\n⚡ Real Example: \n// Before: <div><p>Hello</p><p>World</p></div> \n// After: <div><p>Hi</p><p>World</p></div> \n// React only updates the first <p> tag, not the entire div!",
      tech: "React",
      level: "Senior"
    },
    {
      company: "Amazon",
      role: "Java Backend Developer",
      question: "How would you handle millions of concurrent requests in a Java application?",
      answer: "🏗️ Like managing a busy restaurant: Use connection pooling (prepare tables in advance), implement caching (keep popular dishes ready), add load balancing (multiple kitchens), and use async processing (take orders without blocking). \n\n🔧 Architecture: \n- Spring Boot with WebFlux (reactive) \n- Redis for caching \n- Database connection pooling \n- Message queues for async tasks \n- Horizontal scaling with microservices",
      tech: "Java",
      level: "Senior"
    },
    {
      company: "Meta",
      role: "Python Data Engineer",
      question: "How do you optimize Python code for processing large datasets?",
      answer: "🚀 Think of it like organizing a massive library: Use pandas with chunks (read books one shelf at a time), leverage NumPy for math (like having a super-fast calculator), implement multiprocessing (hire multiple librarians), and use generators (don't load all books at once). \n\n⚡ Performance Tips: \ndf = pd.read_csv('huge_file.csv', chunksize=10000) \nfor chunk in df: \n    process(chunk)  # Memory efficient! \n\nUse vectorization: np.sum(array) instead of sum(array)",
      tech: "Python",
      level: "Senior"
    },
    {
      company: "Apple",
      role: "iOS Developer",
      question: "Explain the difference between weak, strong, and unowned references in Swift",
      answer: "🔗 Think of it like relationship types: Strong reference is like marriage (both hold onto each other tightly, can cause issues if both refuse to let go - retain cycles). Weak reference is like friendship (can become nil if the other person moves away). Unowned is like a work colleague (assumes they'll always be there, crashes if they're not). \n\n📱 Code Example: \nclass Person { weak var spouse: Person? } // Prevents retain cycle \nclass Car { unowned let owner: Person } // Owner must exist",
      tech: "Swift",
      level: "Intermediate"
    },
    {
      company: "Netflix",
      role: "Node.js Developer",
      question: "How does Node.js handle concurrent operations with a single thread?",
      answer: "🎭 Think of Node.js like a talented waiter at a busy restaurant: Instead of waiting for the kitchen to finish one order before taking the next (blocking), they take multiple orders and use callbacks to know when each dish is ready (event loop). The waiter (main thread) never stops moving, but the cooking (I/O operations) happens in the background. \n\n⚡ Event Loop Magic: \nconsole.log('Order 1'); \nsetTimeout(() => console.log('Food ready!'), 0); \nconsole.log('Order 2'); \n// Output: Order 1, Order 2, Food ready!",
      tech: "Node.js",
      level: "Intermediate"
    },
    {
      company: "OpenAI",
      role: "ML Engineer",
      question: "Explain gradient descent and how it optimizes neural networks",
      answer: "🏔️ Imagine you're blindfolded on a mountain trying to reach the bottom (minimum loss): Gradient descent is like taking steps in the direction of steepest downward slope. You calculate which way is 'most downhill' (gradient), take a step in that direction, then repeat. The step size is learning rate - too big and you might overshoot the valley, too small and you'll take forever. \n\n🧠 Neural Network Context: \nfor epoch in range(1000): \n    predictions = model(X) \n    loss = loss_function(predictions, y) \n    gradients = loss.backward() \n    optimizer.step()  # Update weights",
      tech: "ML/AI",
      level: "Senior"
    },
    {
      company: "Spotify",
      role: "Flutter Developer",
      question: "What are the key differences between StatefulWidget and StatelessWidget?",
      answer: "🎵 Think of widgets like music players: StatelessWidget is like a simple speaker - it just displays what you give it and never changes on its own (like showing a song title). StatefulWidget is like a full music player - it can change its display based on interactions (play/pause button, progress bar, volume). \n\n📱 Code Example: \n// StatelessWidget - never changes \nclass SongTitle extends StatelessWidget { \n  final String title; \n  SongTitle(this.title); \n} \n// StatefulWidget - can update \nclass PlayButton extends StatefulWidget { \n  bool isPlaying = false; // This can change! \n}",
      tech: "Flutter",
      level: "Beginner"
    }
  ];

  // Cycle through questions every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuestionIndex((prev) => (prev + 1) % interviewQuestions.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const currentQuestion = interviewQuestions[currentQuestionIndex];

  return (
    <div className="min-h-screen">
      <SEO
        title="Master Your Tech Interview"
        description="Get instant access to 1000+ real interview questions from Microsoft, Google, Amazon, Meta, Apple, Netflix, OpenAI, and Spotify. Expert solutions, code examples, and insider tips for .NET, React, Java, Python, Swift, Node.js, ML/AI, and Flutter developers."
        url="https://devinterview.pro"
        image="https://devinterview.pro/generated-icon.png"
        type="website"
      />

      {/* Hero Section with Animated Question Preview */}
      <section className="relative min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 flex flex-col lg:flex-row items-center min-h-screen">
          {/* Left Content */}
          <div className="lg:w-1/2 text-center lg:text-left mb-12 lg:mb-0">
            <div className="mb-6">
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 mb-4">
                🚀 Launch Special: 50% OFF
              </Badge>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Master Your
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Tech Interview</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
              Get instant access to <span className="text-purple-400 font-semibold">1000+ real interview questions</span> from top tech companies with expert solutions and insider tips.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-gray-300 mb-8">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                Real Company Questions
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                Expert Solutions
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                Instant PDF Download
              </div>
            </div>

            <Link href="/materials">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                <Download className="w-5 h-5 mr-2" />
                Get Instant Access
              </Button>
            </Link>
          </div>

          {/* Right Content - Animated Question Preview */}
          <div className="lg:w-1/2 lg:pl-12">
            <div className="relative bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-700 p-8 shadow-2xl">
              {/* Company Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Code className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{currentQuestion.company}</h3>
                    <p className="text-gray-400 text-sm">{currentQuestion.role}</p>
                  </div>
                </div>
                <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                  {currentQuestion.tech}
                </Badge>
              </div>

              {/* Question */}
              <div className="mb-6">
                <h4 className="text-purple-300 font-semibold mb-3 text-lg">Interview Question:</h4>
                <p className="text-white text-lg leading-relaxed">{currentQuestion.question}</p>
              </div>

              {/* Answer Preview */}
              <div className="mb-6">
                <h4 className="text-green-300 font-semibold mb-3">Expert Answer:</h4>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {currentQuestion.answer.substring(0, 150)}...
                  </p>
                  <div className="mt-3 text-purple-400 text-sm font-medium">
                    ✨ Full explanation with code examples available
                  </div>
                </div>
              </div>

              {/* Progress Indicators */}
              <div className="flex space-x-2 mb-4">
                {interviewQuestions.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      index === currentQuestionIndex 
                        ? 'bg-gradient-to-r from-cyan-400 to-purple-400 w-12' 
                        : 'bg-gray-600 w-2'
                    }`}
                  />
                ))}
              </div>

              {/* Floating Animation Effects */}
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full blur-xl animate-pulse"></div>
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-full blur-lg animate-pulse delay-700"></div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-700 p-8 max-w-2xl">
              <h3 className="text-2xl font-bold text-white mb-3">
                Get 1000+ Questions Like These
              </h3>
              <p className="text-gray-300 mb-6 text-lg">
                Complete answers, code examples, and insider tips from industry experts
              </p>
              <div className="flex items-center justify-center space-x-6 text-gray-300">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  Instant Download
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  Real Questions
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  Expert Solutions
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Materials Section - Moved up for better conversion */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Interview Guide
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Instant access to premium interview preparation materials
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-64 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {materials.map((material) => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  showBuyButton={true}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SEO Content Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <article>
            <header className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Choose DevInterview Pro for Your Tech Interview Preparation?
              </h2>
              <p className="text-xl text-gray-600">
                The most comprehensive collection of real interview questions from top tech companies
              </p>
            </header>

            <div className="grid md:grid-cols-2 gap-12 mb-16">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Real Questions from Top Companies</h3>
                <p className="text-gray-600 mb-6">
                  Our interview guides contain actual questions asked at Microsoft, Google, Amazon, Meta, Apple, Netflix, OpenAI, and Spotify. These aren't generic questions you'll find everywhere - they're carefully curated from real interviews.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>1000+ verified interview questions</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Questions from 2023-2024 interviews</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Organized by difficulty level</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Expert-Crafted Solutions</h3>
                <p className="text-gray-600 mb-6">
                  Every question comes with detailed explanations written by senior engineers from FAANG companies. Our answers include real-world analogies, code examples, and insider tips that give you an edge.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Step-by-step solution explanations</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Working code examples in multiple languages</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Pro tips from industry veterans</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Technologies Carousel */}
            <div className="bg-white rounded-xl p-8 shadow-lg mb-16">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Technologies Covered</h3>
              <div 
                className="relative overflow-hidden"
                onMouseEnter={() => setIsTechHovered(true)}
                onMouseLeave={() => setIsTechHovered(false)}
              >
                <div className="flex transition-transform duration-500 ease-in-out gap-6">
                  {getVisibleTechnologies().map((tech, index) => {
                    const IconComponent = tech.icon;
                    const colorClasses: Record<ColorKey, string> = {
                      blue: 'bg-blue-100 text-blue-600',
                      orange: 'bg-orange-100 text-orange-600',
                      green: 'bg-green-100 text-green-600',
                      purple: 'bg-purple-100 text-purple-600',
                      yellow: 'bg-yellow-100 text-yellow-600',
                      pink: 'bg-pink-100 text-pink-600',
                      indigo: 'bg-indigo-100 text-indigo-600',
                      red: 'bg-red-100 text-red-600'
                    };
                    
                    return (
                      <div 
                        key={`${tech.name}-${index}`}
                        className="flex-shrink-0 text-center min-w-[140px] transform transition-all duration-300 hover:scale-105"
                      >
                        <div className={`w-16 h-16 ${colorClasses[tech.color]} rounded-lg flex items-center justify-center mb-3 mx-auto`}>
                          <IconComponent className="w-8 h-8" />
                        </div>
                        <h4 className="font-semibold text-gray-900">{tech.name}</h4>
                        <p className="text-sm text-gray-600">{tech.description}</p>
                      </div>
                    );
                  })}
                </div>
                
                {/* Navigation buttons */}
                <button 
                  onClick={nextTechSlide}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button 
                  onClick={prevTechSlide}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              
              {/* Dots indicator */}
              <div className="flex justify-center mt-6 space-x-2">
                {technologies.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTechIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentTechIndex ? 'bg-purple-600 w-8' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Land Your Dream Job?</h3>
              <p className="text-xl text-gray-600 mb-8">
                Join thousands of developers who used our guides to succeed in their interviews
              </p>
              <Link href="/materials">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-semibold rounded-full">
                  Get Started Today
                </Button>
              </Link>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}