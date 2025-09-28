// import { useState } from 'react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { useToast } from '@/hooks/use-toast';
// import { 
//   CreditCard, 
//   Smartphone, 
//   QrCode, 
//   Shield, 
//   CheckCircle 
// } from 'lucide-react';

// declare global {
//   interface Window {
//     Razorpay: any;
//   }
// }

// interface PaymentOptionsProps {
//   total: number;
//   materialId: number;
//   onPaymentSuccess: () => void;
// }

// export function PaymentOptions({ total, materialId, onPaymentSuccess }: PaymentOptionsProps) {
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [upiId, setUpiId] = useState('');
//   const { toast } = useToast();

//   const handleRazorpayPayment = async (method: string) => {
//     setIsProcessing(true);
//     try {
//       const res = await fetch('/api/create-order', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ amount: total })
//       });
// debugger;
//       const result = await res.json();
//       const order = result;
//       if (!order) throw new Error('Failed to create order');

//       const options = {
//         key: 'rzp_test_hjLZwiJLyXU8ez',
//         amount: order.amount,
//         currency: order.currency,
//         name: 'DevInterview Pro',
//         description: 'Premium Interview Guide',
//         image: '/logo.png',
//         order_id: order.id,
//         handler: async function (response: any) {
         
//           await fetch('/api/confirm-purchase', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//               paymentIntentId: response.razorpay_payment_id,
//               materialIds: [materialId]
//             })
//           });
//          toast({
//             title: 'Payment Successful!',
//             description: `Payment ID: ${response.razorpay_payment_id}`,
//           });

//           onPaymentSuccess();
//         },
//         prefill: {
//           name: 'Test User',
//           email: 'test@example.com',
//           contact: '9999999999',
//         },
//         notes: {
//           material_id: materialId.toString(),
//         },
//         theme: {
//           color: '#10b981',
//         },
//       };

//       const rzp = new window.Razorpay(options);
//       rzp.open();
//     } catch (error: any) {
//       toast({
//         title: 'Payment Failed',
//         description: error.message || 'An error occurred during payment',
//         variant: 'destructive',
//       });
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   return (
//     <div className="space-y-6">
//       {/* Payment amount display */}
//       <div className="text-center p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg">
//         <div className="text-2xl font-bold text-emerald-700">Total: ₹{total}</div>
//         <div className="text-sm text-emerald-600 mt-1">Secure payment • Instant access after purchase</div>
//       </div>

//       <Tabs defaultValue="upi" className="w-full">
//         <TabsList className="grid w-full grid-cols-2">
//           <TabsTrigger value="upi" className="flex items-center gap-2">
//             <Smartphone className="w-4 h-4" />
//             UPI & Digital Wallets
//           </TabsTrigger>
//           <TabsTrigger value="card" className="flex items-center gap-2">
//             <CreditCard className="w-4 h-4" />
//             Cards & Banking
//           </TabsTrigger>
//         </TabsList>

//         {/* UPI Tab */}
//         <TabsContent value="upi" className="space-y-4">
//           <Card>
//             <CardHeader>
//               <CardTitle className="text-lg flex items-center gap-2">
//                 <QrCode className="w-5 h-5" />
//                 Pay with UPI Apps
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="grid grid-cols-2 gap-3">
//                 {['PhonePe', 'Google Pay', 'Paytm', 'BHIM UPI'].map((method) => (
//                   <Button
//                     key={method}
//                     onClick={() => handleRazorpayPayment(method)}
//                     disabled={isProcessing}
//                     className={`h-16 ${
//                       method === 'PhonePe'
//                         ? 'bg-purple-600 hover:bg-purple-700'
//                         : method === 'Google Pay'
//                         ? 'bg-blue-600 hover:bg-blue-700'
//                         : method === 'Paytm'
//                         ? 'bg-sky-600 hover:bg-sky-700'
//                         : 'bg-orange-600 hover:bg-orange-700'
//                     } text-white flex flex-col items-center gap-1`}
//                   >
//                     <div className="font-bold">{method}</div>
//                     <div className="text-xs opacity-90">UPI Payment</div>
//                   </Button>
//                 ))}
//               </div>

//               <div className="border-t pt-4">
//                 <Label htmlFor="upi" className="text-sm font-medium">Or enter your UPI ID</Label>
//                 <div className="text-xs text-gray-600 mb-2">For testing, use: demo@paytm or test@ybl</div>
//                 <div className="flex gap-2 mt-2">
//                   <Input
//                     id="upi"
//                     placeholder="yourname@paytm / yourname@ybl"
//                     value={upiId}
//                     onChange={(e) => setUpiId(e.target.value)}
//                     className="flex-1"
//                   />
//                   <Button
//                     onClick={() => handleRazorpayPayment('UPI')}
//                     disabled={!upiId || isProcessing}
//                     className="bg-emerald-600 hover:bg-emerald-700"
//                   >
//                     Pay Now
//                   </Button>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>

//         {/* Card Tab */}
//         <TabsContent value="card" className="space-y-4">
//           <Card>
//             <CardHeader>
//               <CardTitle className="text-lg flex items-center gap-2">
//                 <CreditCard className="w-5 h-5" />
//                 Credit/Debit Cards & Net Banking
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="grid grid-cols-1 gap-3">
//                 <Button
//                   onClick={() => handleRazorpayPayment('Card')}
//                   disabled={isProcessing}
//                   className="h-16 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white flex flex-col items-center gap-1"
//                 >
//                   <div className="font-bold">Credit/Debit Card</div>
//                   <div className="text-xs opacity-90">Visa • Mastercard • RuPay</div>
//                 </Button>

//                 <Button
//                   onClick={() => handleRazorpayPayment('Net Banking')}
//                   disabled={isProcessing}
//                   className="h-16 bg-green-600 hover:bg-green-700 text-white flex flex-col items-center gap-1"
//                 >
//                   <div className="font-bold">Net Banking</div>
//                   <div className="text-xs opacity-90">All major banks supported</div>
//                 </Button>
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>
//       </Tabs>

//       {/* Security badges */}
//       <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
//         <div className="flex items-center gap-1">
//           <Shield className="w-4 h-4 text-green-600" />
//           <span>256-bit SSL Encrypted</span>
//         </div>
//         <div className="flex items-center gap-1">
//           <CheckCircle className="w-4 h-4 text-green-600" />
//           <span>100% Secure Payments</span>
//         </div>
//       </div>

//       {isProcessing && (
//         <div className="text-center py-4">
//           <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-2"></div>
//           <div className="text-sm text-gray-600">Processing your payment...</div>
//         </div>
//       )}
//     </div>
//   );
// }
