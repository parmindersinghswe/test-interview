import { CheckCircle, Users, Award, Target, TrendingUp, Clock } from 'lucide-react';
import { SEO } from '@/components/SEO';

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 py-8">
      <SEO
        title="About DevInterview Pro"
        description="Learn about DevInterview Pro's mission to help developers succeed in technical interviews with real questions and expert guidance."
        url="https://devinterview.pro/about"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* SEO-Optimized Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            About DevInterview Pro - Leading Tech Interview Preparation Platform
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Trusted by thousands of software engineers worldwide, DevInterview Pro provides authentic interview questions from top tech companies including Google, Microsoft, Amazon, Meta, and Apple.
          </p>
        </div>

        <div className="space-y-12">
          {/* Mission Section */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
            <div className="flex items-center mb-6">
              <Target className="h-8 w-8 text-blue-600 mr-3" />
              <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">Our Mission</h2>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              To democratize access to high-quality tech interview preparation by providing real interview questions, 
              expert solutions, and insider tips from actual interviews at leading technology companies. We believe 
              every talented developer deserves the opportunity to succeed, regardless of their background or resources.
            </p>
          </section>

          {/* Stats Section */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center">
              <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">50,000+</div>
              <div className="text-gray-600 dark:text-gray-400">Developers Helped</div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center">
              <Award className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">1000+</div>
              <div className="text-gray-600 dark:text-gray-400">Real Interview Questions</div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center">
              <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">85%</div>
              <div className="text-gray-600 dark:text-gray-400">Success Rate</div>
            </div>
          </section>

          {/* What We Offer */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
            <h2 className="text-3xl font-semibold mb-6 text-gray-900 dark:text-white">
              What Makes DevInterview Pro Different
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Real Company Questions</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Every question comes from actual interviews at Google, Microsoft, Amazon, Meta, Apple, Netflix, and more.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Expert Solutions</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Detailed explanations with code examples, time complexity analysis, and optimization tips.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Multiple Technologies</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Comprehensive coverage for Java, Python, React, .NET, Node.js, ML/AI, Flutter, and system design.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Instant Access</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Download PDF guides immediately after purchase. Study offline, annotate, and practice anywhere.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Team Section */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
            <h2 className="text-3xl font-semibold mb-6 text-gray-900 dark:text-white">
              Built by Engineers, for Engineers
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
              Our team consists of senior software engineers and technical leads from top tech companies who have 
              both conducted thousands of interviews and successfully navigated the interview process themselves. 
              We understand what it takes to succeed because we've been on both sides of the table.
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <Clock className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">Our Experience</h3>
              </div>
              <ul className="text-blue-800 dark:text-blue-200 space-y-2">
                <li>• Combined 50+ years of software engineering experience</li>
                <li>• Former engineers at Google, Microsoft, Amazon, Meta, Apple</li>
                <li>• Conducted 1000+ technical interviews</li>
                <li>• Hired 200+ engineers across various tech roles</li>
              </ul>
            </div>
          </section>

          {/* Quality Commitment */}
          <section className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 text-white">
            <h2 className="text-3xl font-semibold mb-4">Our Quality Commitment</h2>
            <p className="text-lg mb-6 text-purple-100">
              We're committed to providing the highest quality interview preparation materials. Every question is 
              verified, every solution is tested, and every explanation is reviewed by multiple senior engineers.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">30-Day Money-Back Guarantee</h3>
                <p className="text-purple-100">
                  We're so confident in our materials that we offer a full refund if you're not completely satisfied.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Regular Updates</h3>
                <p className="text-purple-100">
                  Our content is continuously updated with the latest interview trends and new questions from recent interviews.
                </p>
              </div>
            </div>
          </section>

          {/* Contact CTA */}
          <section className="text-center bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              Ready to Ace Your Next Interview?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Join thousands of successful developers who landed their dream jobs with DevInterview Pro.
            </p>
            <div className="space-y-4">
              <a 
                href="/materials" 
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Browse Interview Materials
              </a>
              <div className="text-sm text-gray-500">
                Questions? <a href="/contact" className="text-blue-600 hover:text-blue-700">Contact our team</a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}