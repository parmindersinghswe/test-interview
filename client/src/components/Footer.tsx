import { Link } from 'wouter';
import { Code, Twitter, Linkedin, Github, Youtube } from 'lucide-react';
import { FaCcVisa, FaCcMastercard, FaGooglePay } from 'react-icons/fa';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center mb-4">
              <Code className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-xl font-bold text-white">DevInterview Pro</span>
            </div>
            <p className="text-gray-400 mb-4">
              Empowering developers worldwide with comprehensive interview preparation materials.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/materials" className="hover:text-blue-600 transition-colors">
                  All Materials
                </Link>
              </li>
              <li>
                <Link href="/materials?technology=dotnet" className="hover:text-blue-600 transition-colors">
                  .NET Resources
                </Link>
              </li>
              <li>
                <Link href="/materials?technology=react" className="hover:text-blue-600 transition-colors">
                  React Resources
                </Link>
              </li>
              <li>
                <Link href="/materials?technology=flutter" className="hover:text-blue-600 transition-colors">
                  Flutter Resources
                </Link>
              </li>
              <li>
                <Link href="/materials?search=free" className="hover:text-blue-600 transition-colors">
                  Free Samples
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="hover:text-blue-600 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-blue-600 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-blue-600 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-blue-600 transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-blue-600 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-blue-600 transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Payment Methods */}
          <div>
            <h3 className="text-white font-semibold mb-4">Payment Methods</h3>
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="bg-gray-800 px-3 py-2 rounded flex items-center">
                <FaCcVisa className="text-blue-500 text-xl" />
              </div>
              <div className="bg-gray-800 px-3 py-2 rounded flex items-center">
                <FaCcMastercard className="text-red-500 text-xl" />
              </div>
              <div className="bg-gray-800 px-3 py-2 rounded flex items-center">
                <FaGooglePay className="text-blue-400 text-xl" />
              </div>
              <div className="bg-gray-800 px-3 py-2 rounded flex items-center">
                <span className="text-sm font-medium">UPI</span>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              Secure payments with 256-bit SSL encryption
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2024 DevInterview Pro. All rights reserved. | Made with ❤️ for developers worldwide
          </p>
        </div>
      </div>
    </footer>
  );
}
