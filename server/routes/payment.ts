// server/routes/payment.ts or payment.js
import Razorpay from 'razorpay';
import express from 'express';
import crypto from 'crypto';
import { storage } from 'server/storage';
const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// router.post('/create-order', async (req, res) => {
//   const { amount, currency = 'INR', receipt } = req.body;

//   try {
//     const options = {
//       amount: amount * 100, // Razorpay works in paise
//       currency,
//       receipt: receipt || `receipt_order_${Date.now()}`,
//     };

//     const order = await razorpay.orders.create(options);
//     res.json({ success: true, order });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error });
//   }
// });


router.post('/orders', async (req, res) => {
  res.json({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});
  // const instance = new Razorpay({
  //   key_id: process.env.RAZORPAY_KEY_ID,
  //   key_secret: process.env.RAZORPAY_SECRET,
  // });
  // const options = {
  //   amount: 29000,
  //   currency: 'INR',
  //   receipt: `receipt_${Date.now()}`,
  // };
  // try {
  //   const order = await instance.orders.create(options);
  //   res.json(order);
  // } catch (err) {
  //   console.error(err);
  //   res.status(500).send('Error creating order');
  // }
});

//2) Verify Payment Signature
router.post('/confirm-success', async (req: any, res) => {
  const { orderCreationId, razorpayPaymentId, razorpaySignature, materialIds } = req.body;
  const digest = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderCreationId}|${razorpayPaymentId}`)
    .digest('hex');

  if (digest === razorpaySignature) {
     try {
               
          // Get materials to purchase
           const userId = req.user.claims.sub;
          let items;
          if (materialIds.includes("cart")) {
            items = await storage.getCartItems(userId);
          } else {
            items = [];
            for (const id of materialIds) {
              const material = await storage.getMaterial(id);
              if (material) {
                items.push({ material });
              }
            }
          }
          
          // Create purchase records
          const purchases = [];
          for (const item of items) {
            const purchase = await storage.createPurchase({
              userId,
              materialId: item.material.id,
              price: item.material.price,
              stripePaymentIntentId: razorpayPaymentId,
            });
            purchases.push(purchase);
          }
          
          // Clear cart if purchasing from cart
          if (materialIds.includes("cart")) {
            await storage.clearCart(userId);
          }
          
          res.json({ purchases, message: "Purchase successful" });
        } catch (error) {
          console.error("Error confirming purchase:", error);
          res.status(500).json({ message: "Failed to confirm purchase" });
        }
    return res.json({ msg: 'Payment verified successfully' });
  }
  res.status(400).json({ msg: 'Invalid signature' });
});


export default router;
