import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
// import { PaymentOptions } from '@/components/PaymentOptions';
import { ShoppingCart, Download, CheckCircle, CreditCard } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { Material } from '@shared/schema';
import jsPDF from 'jspdf';
import { SEO } from '@/components/SEO';
import { DEFAULT_IMAGE_URL, buildSiteUrl } from '@/lib/site';
type CurrentUser = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

type CreateOrderResponse = {
  paymentOrder?: {
    id?: string;
    amount?: number;
    currency?: string;
  };
  key_id?: string;
};

type VerifyPaymentResponse = {
  verified?: boolean;
  msg?: string;
};

type FetchJsonOptions = RequestInit & {
  timeoutMs?: number;
};

async function fetchJson<T>(input: RequestInfo | URL, options: FetchJsonOptions = {}): Promise<T> {
  const { timeoutMs, ...init } = options;
  const controller = typeof timeoutMs === "number" ? new AbortController() : undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  if (controller) {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  }

  try {
    const response = await fetch(input, controller ? { ...init, signal: controller.signal } : init);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const contentType = response.headers.get("content-type");

    if (response.status === 204 || !contentType?.includes("application/json")) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}




type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: string; // amount in paise as string
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: { color?: string };
};

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, cb: (...args: any[]) => void) => void;
      close: () => void;
    };
  }
}
type Prefill = { name: string; email: string };

const envVars = import.meta.env as unknown as Record<string, string | undefined>;
const CHECKOUT_BRAND_NAME = envVars.VITE_BRAND_NAME?.trim() || 'DevInterview Pro';
const CHECKOUT_DESCRIPTION =
  envVars.VITE_CHECKOUT_DESCRIPTION?.trim() ||
  'Secure checkout for DevInterview Pro digital interview materials.';

// ---- Utils ----
function loadScript(src: string): Promise<boolean> {
  return new Promise((res) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => res(true);
    script.onerror = () => res(false);
    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [materialId, setMaterialId] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const emailRegex = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/, []);
  const isGuestEmailValid = useMemo(() => emailRegex.test(guestEmail.trim()), [guestEmail, emailRegex]);
  const requireGuestEmail = !isAuthenticated;
  // Get material ID from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('material');
    setMaterialId(id);
  }, []);

  // Fetch all materials and find the specific one
  const { data: materials = [], isLoading: isMaterialLoading } = useQuery<Material[]>({
    queryKey: ['/api/materials'],
  });

  const material = materials.find(m => m.id.toString() === materialId);

  // For demo purposes, allow checkout without authentication

  const priceUSD = material?.price ? parseFloat(material.price.toString()) : 2.99;
  const totalINR = Math.round(priceUSD * 83); // Current USD to INR conversion rate

  const downloadActualPDF = (material: Material) => {
    // If the material has a contentUrl pointing to uploaded file, download it directly
    if (material.contentUrl && material.contentUrl.includes('/api/download/upload/')) {
      // Create a temporary link element for direct download without opening new tab
      const link = document.createElement('a');
      link.href = material.contentUrl;
      link.download = `${material.title}.pdf`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Fallback: generate PDF for older materials that don't have uploaded files
    const tech = material.technology?.toUpperCase() || 'GENERAL';
    const pdf = new jsPDF();

    // Set up PDF document
    pdf.setFontSize(16);
    pdf.text(`DEVINTERVIEW PRO - ${material.title}`, 20, 20);

    pdf.setFontSize(12);
    pdf.text(`Technology: ${tech} | Difficulty: ${material.difficulty || 'All Levels'}`, 20, 35);
    pdf.text(`Total Questions: 1000+ | Pages: ${material.pages || 250}`, 20, 45);

    // Add line separator
    pdf.line(20, 55, 190, 55);

    // Table of Contents
    pdf.setFontSize(14);
    pdf.text('TABLE OF CONTENTS', 20, 70);
    pdf.setFontSize(10);

    const tocItems = [
      '1. Fundamentals & Core Concepts (Q1-Q150)',
      '2. Object-Oriented Programming (Q151-Q300)',
      '3. Design Patterns & Architecture (Q301-Q450)',
      '4. Framework Specific Questions (Q451-Q600)',
      '5. Database & Data Access (Q601-Q750)',
      '6. Testing & Quality Assurance (Q751-Q850)',
      '7. Performance & Optimization (Q851-Q950)',
      '8. System Design & Scalability (Q951-Q1000)',
      '9. Practical Coding Challenges',
      '10. Interview Tips & Career Guide'
    ];

    let yPosition = 85;
    tocItems.forEach(item => {
      pdf.text(item, 25, yPosition);
      yPosition += 7;
    });

    // Add new page for content
    pdf.addPage();
    yPosition = 20;

    // Chapter 1
    pdf.setFontSize(14);
    pdf.text('CHAPTER 1: FUNDAMENTALS & CORE CONCEPTS', 20, yPosition);
    yPosition += 15;

    // Sample questions
    const questions = [
      {
        q: `Q1: What are the fundamental principles of ${tech} development?`,
        a: `${tech} development follows several core principles including type safety, memory management, performance optimization, and maintainable code structure. Key concepts include proper exception handling, following established coding conventions, and understanding the framework lifecycle.`
      },
      {
        q: 'Q2: Explain the concept of polymorphism with practical examples.',
        a: 'Polymorphism allows objects of different types to be treated as instances of the same type through inheritance. This enables method overriding and interface implementation, providing flexibility in code design.'
      },
      {
        q: 'Q3: What is the difference between stack and heap memory allocation?',
        a: 'Stack memory stores value types and method call information in a LIFO structure. It\'s fast but limited in size. Heap memory stores reference types and is managed by garbage collection.'
      }
    ];

    pdf.setFontSize(10);
    questions.forEach(item => {
      // Add question
      pdf.setFont('helvetica', 'bold');
      const qLines = pdf.splitTextToSize(item.q, 170);
      qLines.forEach((line: string) => {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(line, 20, yPosition);
        yPosition += 7;
      });

      // Add answer
      pdf.setFont('helvetica', 'normal');
      const aLines = pdf.splitTextToSize(`Answer: ${item.a}`, 170);
      aLines.forEach((line: string) => {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(line, 20, yPosition);
        yPosition += 7;
      });

      yPosition += 5; // Space between questions
    });

    // Add more content pages
    pdf.addPage();
    pdf.setFontSize(14);
    pdf.text('CHAPTER 2: DESIGN PATTERNS & ARCHITECTURE', 20, 20);

    pdf.setFontSize(10);
    pdf.text('This comprehensive guide contains 1000+ interview questions covering:', 20, 40);
    pdf.text('• Advanced programming concepts', 25, 55);
    pdf.text('• System design principles', 25, 65);
    pdf.text('• Code optimization techniques', 25, 75);
    pdf.text('• Real-world problem solving', 25, 85);
    pdf.text('• Best practices and patterns', 25, 95);

    pdf.addPage();
    pdf.setFontSize(14);
    pdf.text('INTERVIEW PREPARATION GUIDE', 20, 20);

    pdf.setFontSize(10);
    const tips = [
      'Before the Interview:',
      '• Review fundamental concepts thoroughly',
      '• Practice coding challenges daily',
      '• Understand the company\'s tech stack',
      '• Prepare questions about the role',
      '',
      'During the Interview:',
      '• Think out loud while solving problems',
      '• Ask clarifying questions',
      '• Start with a simple solution, then optimize',
      '• Explain your thought process clearly'
    ];

    yPosition = 40;
    tips.forEach(tip => {
      pdf.text(tip, 20, yPosition);
      yPosition += 10;
    });

    // Footer
    pdf.setFontSize(8);
    pdf.text(`© ${new Date().getFullYear()} DevInterview Pro - Premium Interview Materials`, 20, 280);
    pdf.text(`Downloaded: ${new Date().toLocaleString()}`, 20, 287);

    // Save the PDF
    const fileName = `${(material.title || 'Interview_Guide').replace(/[^a-zA-Z0-9]/g, '_')}_Interview_Guide.pdf`;
    pdf.save(fileName);
  };

  async function buildPrefill(): Promise<Prefill> {
    const EMPTY: Prefill = { name: "", email: "" };
    if (!isAuthenticated) return { name: "", email: requireGuestEmail ? guestEmail.trim() : "" };

    try {
      const user = await fetchJson<CurrentUser>("/api/current-user", {
        credentials: "include",
        timeoutMs: 4000,
      });

      const { firstName, lastName, email } = user ?? {};
      const safeEmail = typeof email === "string" ? email.trim() : "";
      const safeName = [firstName, lastName]
        .filter((v) => typeof v === "string" && v.trim().length > 0)
        .join(" ")
        .trim();

      if (!safeEmail) return EMPTY; // email is required for Razorpay prefill
      return { name: safeName, email: safeEmail };
    } catch {
      return EMPTY; // swallow all errors -> safe fallback
    }
  }

  const displayRazorpay = async () => {
    if (requireGuestEmail && !isGuestEmailValid) {
      setEmailTouched(true);
      toast({
        title: 'Email required',
        description: 'Please enter a valid email to receive your receipt & download link.',
        variant: 'destructive',
      });
      return;
    }

    const sdkLoaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
    if (!sdkLoaded) {
      alert('SDK load failed. Check your connection.');
      return;
    }

    try {
      const orderResult = await fetchJson<CreateOrderResponse>(`/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ amount: totalINR }),
      });
      const { paymentOrder, key_id } = orderResult ?? {};
      if (!paymentOrder?.id || !key_id) {
        alert('Server error: missing order details');
        return;
      }

      const { amount, id: order_id } = paymentOrder;
      const currency = paymentOrder.currency ?? 'INR';
      const prefill = await buildPrefill();

      const options: RazorpayOptions = {
        key: key_id,
        amount: String(amount),
        currency,
        name: CHECKOUT_BRAND_NAME,
        description: CHECKOUT_DESCRIPTION,
        order_id,
        handler: async (response) => {
          try {
            const verify = await fetchJson<VerifyPaymentResponse>(`/confirm-success`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id || order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                materialIds: materialId ? [materialId] : [],
                customerEmail: requireGuestEmail ? guestEmail.trim() : undefined,
              }),
            });
            if (!material) return;
            const verificationMessage = verify?.msg ?? "Unable to verify payment. Please contact support.";
            toast({
              title: "Payment Verification",
              description: verificationMessage,
              variant: verify?.verified ? "default" : "destructive",
            });
            if (verify?.verified) {
              setTimeout(() => {
                downloadActualPDF(material);
                toast({
                  title: "Download Complete!",
                  description: "Your interview guide has been downloaded successfully.",
                });
              }, 1500);
            }
          } catch (err: unknown) {
            console.error('Payment verification error:', err);
            alert('Verification failed');
          }
        },
        prefill: prefill,
        theme: { color: '#6920a6' },
      };

      const paymentObj = new window.Razorpay(options);
      paymentObj.open();
    } catch (err: unknown) {
      console.error('Order creation failed:', err);
      alert('Failed to create order');
    }
  };


  if (isMaterialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
      </div>
    );
  }

  if (!material) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Material not found</h1>
          <p className="text-gray-600 mb-4">The requested material could not be found.</p>
          <Button asChild>
            <a href="/">Go Home</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <SEO
        title="Checkout"
        description="Complete your purchase and access premium interview materials."
        url={buildSiteUrl('/checkout')}
        image={DEFAULT_IMAGE_URL}
        type="website"
      />
      <h1 className="text-3xl font-bold mb-8 text-center">Complete Your Purchase</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Material Details */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Your Purchase
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg">{material.title}</h3>
                  <p className="text-gray-600">{material.technology?.toUpperCase() || 'GENERAL'} • {material.difficulty || 'All Levels'}</p>
                  <p className="text-sm text-gray-600 mt-2">{material.description}</p>
                </div>

                <div className="flex justify-between items-center text-2xl font-bold">
                  <span>Total</span>
                  <div className="text-right">
                    <span className="text-emerald-600">₹{totalINR}</span>
                    {material.originalPrice && (
                      <div className="text-sm text-gray-500 line-through">
                        ₹{Math.round(parseFloat(material.originalPrice.toString()) * 83)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-sm text-green-600 text-center bg-green-50 p-3 rounded-lg">
                  🎉 You're saving ₹{material.originalPrice ? Math.round((parseFloat(material.originalPrice.toString()) - priceUSD) * 83) : Math.round(totalINR * 0.6)} with this offer!
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What you get */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                What You Get
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Instant PDF download</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">1000+ real interview questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Detailed answers & explanations</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Code examples & best practices</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Lifetime access</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Ready to Get Started?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-4xl font-bold text-emerald-600 mb-2">₹{totalINR}</div>
                <div className="text-gray-600 mb-6">One-time payment • Instant download</div>
                {requireGuestEmail && (
                  <div className="mb-4 text-left">
                    <label className="block text-sm font-medium mb-2">
                      Email for receipt & download
                    </label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      onBlur={() => setEmailTouched(true)}
                      placeholder="you@example.com"
                      className="w-full rounded-md border px-3 py-2"
                    />
                    {emailTouched && !isGuestEmailValid && (
                      <p className="mt-1 text-xs text-red-600">
                        Enter a valid email address.
                      </p>
                    )}
                  </div>
                )}
                <Button
                  onClick={() => displayRazorpay()}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-4 text-lg"
                >
                  Proceed to Payment
                </Button>

                <div className="text-xs text-gray-500 mt-4">
                  🔒 Secure payment • 100% safe & encrypted
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}