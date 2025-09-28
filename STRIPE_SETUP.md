# Stripe Payment Integration Setup Guide

## Quick Setup (5 Minutes)

### Step 1: Create Stripe Account
1. Visit https://stripe.com
2. Click "Start now" 
3. Enter email and create password
4. Complete business verification (required for live payments)

### Step 2: Get API Keys
1. After login, go to **Dashboard**
2. Click **Developers** in left sidebar
3. Click **API keys**
4. You'll see 4 keys:

**Test Keys (for development):**
- Secret key: `sk_test_51ABC123...` (starts with sk_test_)
- Publishable key: `pk_test_51ABC123...` (starts with pk_test_)

**Live Keys (for production):**
- Secret key: `sk_live_51ABC123...` (starts with sk_live_)  
- Publishable key: `pk_live_51ABC123...` (starts with pk_live_)

### Step 3: Add Keys to Environment File

**Option A: Create .env file**
```bash
# Copy the example file
cp .env.example .env

# Edit the .env file and add your keys:
STRIPE_SECRET_KEY=sk_test_your_actual_test_secret_key_here
VITE_STRIPE_PUBLISHABLE_KEY_TEST=pk_test_your_actual_test_publishable_key_here
```

**Option B: Edit existing .env**
Open your `.env` file and update these lines:
```env
STRIPE_SECRET_KEY=sk_test_51ABC123def456ghi789...
VITE_STRIPE_PUBLISHABLE_KEY_TEST=pk_test_51ABC123def456ghi789...
```

### Step 4: Enable Indian Payment Methods
1. In Stripe Dashboard, go to **Settings** → **Payment methods**
2. Enable these methods:
   - **Cards**: Visa, Mastercard, RuPay
   - **UPI**: For PhonePe, Google Pay, Paytm, BHIM
   - **Net Banking**: Indian banks
   - **Wallets**: Digital wallets

### Step 5: Test the Integration
1. Restart your application: `npm run dev`
2. Try making a test purchase
3. Use these test details:
   - **Card**: 4111 1111 1111 1111
   - **Expiry**: Any future date (12/28)
   - **CVV**: Any 3 digits (123)
   - **UPI**: test@paytm

## Environment Configuration Examples

### Development Environment
```env
# Database
DATABASE_URL=your_postgres_connection_string

# Authentication
SESSION_SECRET=your_32_character_secret_key

# Stripe Test Keys
STRIPE_SECRET_KEY=sk_test_51ABC123def456ghi789jkl...
VITE_STRIPE_PUBLISHABLE_KEY_TEST=pk_test_51ABC123def456ghi789jkl...

# Application
NODE_ENV=development
USE_SIMPLE_ROUTES=false
```

### Production Environment
```env
# Database
DATABASE_URL=your_production_postgres_url

# Authentication
SESSION_SECRET=your_strong_production_secret

# Stripe Live Keys
STRIPE_SECRET_KEY=sk_live_51ABC123def456ghi789jkl...
VITE_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_51ABC123def456ghi789jkl...

# Application
NODE_ENV=production
USE_SIMPLE_ROUTES=false
```

## Deployment Platform Setup

### Vercel
1. Go to your project in Vercel dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - Name: `STRIPE_SECRET_KEY`
   - Value: `sk_live_your_live_key...`
   - Environment: Production
4. Repeat for `VITE_STRIPE_PUBLISHABLE_KEY_LIVE`

### Railway
1. Open your project in Railway
2. Click **Variables** tab
3. Add **Raw Editor**:
```
STRIPE_SECRET_KEY=sk_live_your_live_key...
VITE_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_your_live_key...
```

### Netlify
1. Go to **Site settings** → **Environment variables**
2. Click **Add a variable**
3. Add each Stripe key

## Testing Payment Methods

### Test Card Numbers
```
Visa: 4111 1111 1111 1111
Mastercard: 5555 5555 5555 4444
RuPay: 6521 1111 1111 1117
```

### Test UPI IDs
```
Success: test@paytm
Success: success@upi
Failure: failure@upi
```

### Test Net Banking
- Select any bank during checkout
- Use test mode credentials provided by Stripe

## Common Issues & Solutions

### Issue: "No API key provided"
**Solution**: Check your .env file has the correct variable names
```env
STRIPE_SECRET_KEY=sk_test_...  # Must start with STRIPE_
```

### Issue: "Invalid API key"
**Solution**: Copy-paste keys directly from Stripe dashboard, avoid extra spaces

### Issue: "Payment method not available"
**Solution**: Enable payment methods in Stripe Dashboard → Settings → Payment methods

### Issue: "Test payments not working"
**Solution**: Ensure you're using test keys (sk_test_, pk_test_) in development

## Going Live Checklist

### Before Launch
- [ ] Account verification completed in Stripe
- [ ] Business details added to Stripe account
- [ ] Bank account connected for payouts
- [ ] Indian payment methods enabled
- [ ] Test payments working correctly

### Deploy with Live Keys
- [ ] Replace test keys with live keys in production
- [ ] Update environment variables on hosting platform
- [ ] Test a small live payment
- [ ] Monitor Stripe dashboard for transactions

## Security Best Practices

### Key Management
- Never commit API keys to git
- Use different keys for development/production
- Rotate keys if compromised
- Store keys securely in hosting platform

### Payment Security
- Stripe handles PCI compliance
- Never store card details on your server
- All payments processed through Stripe's secure servers
- SSL encryption enforced automatically

## Support & Monitoring

### Stripe Dashboard Features
- Real-time payment monitoring
- Transaction history and analytics
- Dispute and chargeback management
- Customer payment method management
- Detailed logs and error tracking

### Getting Help
- Stripe Documentation: https://stripe.com/docs
- Stripe Support: Available in dashboard
- Test payments extensively before going live
- Monitor error logs in production

## Payment Flow Summary

1. **User selects payment method** (UPI, Card, Net Banking)
2. **Stripe creates payment intent** with amount and currency
3. **User completes payment** in their chosen method
4. **Stripe processes payment** securely
5. **Application receives confirmation** and grants access
6. **User downloads purchased materials** immediately

Your payment system is fully configured and ready for production use once you add your Stripe API keys.