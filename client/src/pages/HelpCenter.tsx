import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronRight, Search, Download, CreditCard, Shield, BookOpen, Users } from 'lucide-react';
import { SEO } from '@/components/SEO';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'How do I download my purchased materials?',
    answer: 'After purchasing, log into your account and go to "My Purchases". Click "Download PDF" next to any material to save it to your device, or click "Read Online" to view it in your browser.',
    category: 'Downloads'
  },
  {
    id: '2',
    question: 'What payment methods are accepted?',
    answer: 'We accept all major credit cards (Visa, Mastercard), PayPal, Google Pay, and UPI for Indian customers. All transactions are secured with 256-bit SSL encryption.',
    category: 'Payments'
  },
  {
    id: '3',
    question: 'Can I access materials on multiple devices?',
    answer: 'Yes! Once you purchase materials, you can access them from any device using your account. Your purchases are permanently linked to your account.',
    category: 'Account'
  },
  {
    id: '4',
    question: 'What is your refund policy?',
    answer: 'We offer a 30-day money-back guarantee. If you\'re not satisfied with your purchase, contact our support team for a full refund within 30 days.',
    category: 'Payments'
  },
  {
    id: '5',
    question: 'Are the interview questions from real companies?',
    answer: 'Yes! Our materials contain real interview questions collected from actual interviews at top tech companies like Google, Microsoft, Amazon, and more.',
    category: 'Content'
  },
  {
    id: '6',
    question: 'How often are materials updated?',
    answer: 'We continuously update our materials with new questions and solutions. Premium materials are updated monthly with the latest interview trends.',
    category: 'Content'
  },
  {
    id: '7',
    question: 'I forgot my password. How do I reset it?',
    answer: 'On the login page, click "Forgot Password" and enter your email. You\'ll receive a reset link within minutes.',
    category: 'Account'
  },
  {
    id: '8',
    question: 'Can I purchase materials without creating an account?',
    answer: 'No, an account is required to purchase and access materials. This ensures you can always re-download your purchases and track your interview preparation progress.',
    category: 'Account'
  }
];

const categories = ['All', 'Downloads', 'Payments', 'Account', 'Content'];

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Downloads': return <Download className="h-5 w-5" />;
      case 'Payments': return <CreditCard className="h-5 w-5" />;
      case 'Account': return <Users className="h-5 w-5" />;
      case 'Content': return <BookOpen className="h-5 w-5" />;
      default: return <Shield className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 py-8">
      <SEO
        title="Help Center"
        description="Frequently asked questions and support for Tech Interview Notes."
        url="https://www.techinterviewnotes.com/help"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* SEO-Optimized Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Interview Preparation Help Center - FAQ & Support
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Find instant answers to tech interview questions, download issues, payment problems, and account support. Get help with Java, Python, React, .NET interview preparation.
          </p>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-lg py-3"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-3 mb-8">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className="flex items-center space-x-2"
            >
              {getCategoryIcon(category)}
              <span>{category}</span>
            </Button>
          ))}
        </div>

        {/* FAQ Results */}
        <div className="space-y-4">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No results found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Try different keywords or browse all categories
              </p>
              <Button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                variant="outline"
              >
                Clear Search
              </Button>
            </div>
          ) : (
            filteredFAQs.map((faq) => (
              <div
                key={faq.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <button
                  onClick={() => toggleExpanded(faq.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                      {getCategoryIcon(faq.category)}
                      <span className="text-sm font-medium">{faq.category}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {faq.question}
                    </h3>
                  </div>
                  {expandedItems.includes(faq.id) ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                
                {expandedItems.includes(faq.id) && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Contact Support */}
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4 text-blue-900 dark:text-blue-100">
            Still need help?
          </h2>
          <p className="text-blue-800 dark:text-blue-200 mb-6">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => window.location.href = '/contact'}
            >
              Contact Support
            </Button>
            <Button 
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
              onClick={() => window.open('mailto:support@devinterview.pro', '_blank')}
            >
              Email Us
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}