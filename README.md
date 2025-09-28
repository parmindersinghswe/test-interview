# DevInterview Pro - Interview Preparation Platform

A comprehensive interview preparation platform featuring curated interview materials for .NET, Java, Python, React, Flutter, ML/AI, Node.js, and System Design. Built with React, Express.js, PostgreSQL, and integrated payment processing.

## Features

### Core Functionality
- **Material Marketplace**: Browse and purchase interview preparation materials
- **User Authentication**: Email/password registration and login system
- **Admin Panel**: Content management system for administrators
- **Payment Integration**: Support for UPI, credit cards, and net banking
- **PDF Generation**: Dynamic PDF creation for purchased materials
- **Search & Filter**: Advanced search by technology and difficulty level
- **Responsive Design**: Mobile-first responsive interface
- **SEO Optimized**: Enhanced for search engine visibility

### User Features
- User registration and authentication
- Browse materials by technology (.NET, Java, Python, React, Flutter, ML/AI, Node.js, System Design)
- Shopping cart functionality
- Secure payment processing with multiple options
- Purchase history tracking
- PDF download after purchase
- Material reviews and ratings

### Admin Features
- Admin authentication system
- Content management (upload, edit, delete materials)
- Purchase analytics and history
- File upload with automatic material creation
- User management
- Payment transaction monitoring

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **TanStack Query** for data fetching
- **Wouter** for routing
- **Stripe React** for payment processing

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** database
- **Drizzle ORM** for database operations
- **Express Session** for authentication
- **Multer** for file uploads
- **Stripe** for payment processing
- **jsPDF** for PDF generation

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Stripe account (for payments)

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database_name
PGHOST=your_postgres_host
PGPORT=5432
PGUSER=your_postgres_user
PGPASSWORD=your_postgres_password
PGDATABASE=your_database_name

# Session Configuration
SESSION_SECRET=your_session_secret_key_here

# Stripe Payment Configuration (Required for payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
VITE_STRIPE_PUBLISHABLE_KEY_TEST=pk_test_your_stripe_publishable_key
VITE_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_your_stripe_live_key

# Optional legacy Stripe variables
STRIPE_TEST_SECRET_KEY=sk_test_your_test_secret_key
STRIPE_LIVE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_API_VERSION=2024-03-15

# Admin login for simple routes
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2a$10$hashed_password_here

# Replit authentication (optional)
REPLIT_DOMAINS=your-project.username.repl.co
REPL_ID=your_repl_id
ISSUER_URL=https://replit.com/oidc

# Application Configuration
NODE_ENV=development
USE_SIMPLE_ROUTES=true
```

### Installation Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd devinterview-pro
```

2. **Install dependencies**
```bash
npm install
```

3. **Database Setup**
```bash
# Push database schema
npm run db:push
```
This command creates all tables defined in the project. Ensure the PostgreSQL
database referenced by `DATABASE_URL` already exists before running it.

4. **Start the application**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

5. **(Optional) Seed sample data**
```bash
curl -X POST http://localhost:5000/api/seed
```

The seed command inserts example materials into the database so the
"Materials" page displays sample cards. You may also add your own
materials through the admin panel. If the `materials` table is empty,
the marketplace grid will not show any cards.

## 🏗️ Complete Technology Stack

### **Core Technologies**
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js + TypeScript  
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Email/Password + JWT tokens
- **Payment**: Stripe (Cards, UPI, Net Banking)
- **File Storage**: Local disk storage (`./uploads/`)
- **UI Framework**: shadcn/ui + Radix UI components

### **Database Schema**
- `users` - User accounts with role-based access
- `materials` - Interview preparation materials catalog
- `purchases` - Transaction records and purchase history
- `cart_items` - Shopping cart functionality  
- `reviews` - User reviews and ratings system
- `uploads` - Admin uploaded PDF files management
- `sessions` - Secure session storage

## ⚙️ Configuration Requirements

### **Essential Environment Variables**
```env
# Database Connection (Required)
DATABASE_URL=postgresql://username:password@host:port/database

# Security (Required)
SESSION_SECRET=your_32_character_random_secret_key
NODE_ENV=production

# Payment Processing (Required for transactions)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
VITE_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_your_stripe_publishable_key

# Optional legacy Stripe keys
STRIPE_TEST_SECRET_KEY=sk_test_your_test_secret_key
STRIPE_LIVE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_API_VERSION=2024-03-15

# Admin login for simple routes
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2a$10$hashed_password_here

# Replit authentication (optional)
REPLIT_DOMAINS=your-project.username.repl.co
REPL_ID=your_repl_id
ISSUER_URL=https://replit.com/oidc

# Application Settings
USE_SIMPLE_ROUTES=false
```

### **Payment System Integration**

#### **Step 1: Create Stripe Account**
1. Go to https://stripe.com and create an account
2. Complete account verification (required for live payments)
3. Navigate to Dashboard → Developers → API keys

#### **Step 2: Get Your API Keys**
**For Development (Test Mode):**
```env
STRIPE_SECRET_KEY=sk_test_51ABC123...your_test_secret_key
VITE_STRIPE_PUBLISHABLE_KEY_TEST=pk_test_51ABC123...your_test_publishable_key
```

**For Production (Live Mode):**
```env
STRIPE_SECRET_KEY=sk_live_51ABC123...your_live_secret_key
VITE_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_51ABC123...your_live_publishable_key
```

#### **Step 3: Enable Indian Payment Methods**
1. Go to Dashboard → Settings → Payment methods
2. Enable these payment methods:
   - Cards (Visa, Mastercard, RuPay)
   - UPI (for PhonePe, Google Pay, Paytm, BHIM)
   - Net Banking
   - Digital Wallets

#### **Step 4: Configure Your Environment**
Add to your `.env` file:
```env
# For Development
STRIPE_SECRET_KEY=sk_test_your_actual_test_key_here
VITE_STRIPE_PUBLISHABLE_KEY_TEST=pk_test_your_actual_test_key_here

# For Production (uncomment when going live)
# STRIPE_SECRET_KEY=sk_live_your_actual_live_key_here
# VITE_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_your_actual_live_key_here
```

#### **Step 5: Test Payment Flow**
1. Use test card: `4111 1111 1111 1111`
2. Any future expiry date (e.g., 12/28)
3. Any 3-digit CVV (e.g., 123)
4. For UPI testing: Use `test@paytm` or any test UPI ID

**Supported Payment Methods:**
- Credit/Debit Cards (Visa, Mastercard, RuPay)
- UPI payments (PhonePe, Google Pay, Paytm, BHIM UPI)
- Net Banking (All major Indian banks)
- Digital Wallets (Paytm, MobiKwik, etc.)

### **File Storage System**
- **Location**: `./uploads/` directory (auto-created)
- **File Types**: PDF only (10MB maximum)
- **Access Control**: Admin upload, user download after purchase
- **Naming Convention**: `file-timestamp-random.pdf`
- **Security**: MIME type validation, size limits, admin-only uploads

### **Authentication Architecture**
- **User System**: Email/password registration with bcrypt hashing
- **Admin Access**: Role-based permissions (database role='admin')
- **Session Management**: PostgreSQL session store
- **Token System**: JWT-based authentication for API access
- **Security**: CSRF protection, secure cookies, password validation

### **Admin Panel Capabilities**
- PDF upload and management system
- Material catalog management (pricing, descriptions, categories)
- Purchase analytics and revenue tracking
- User management and role assignment
- Technology categorization (React, .NET, Java, Python, Node.js, etc.)

#### UPI Payment Setup

UPI payments are processed through Stripe's UPI integration:

1. **Enable UPI in Stripe Dashboard**
   - Go to Settings → Payment methods
   - Enable UPI payments for India

2. **Test UPI IDs for Development**
   - `test@upi` - Success
   - `demo@paytm` - Success
   - `failure@upi` - Failure (for testing)

#### Payment Flow

1. User selects materials and proceeds to checkout
2. Payment options are presented (UPI/Cards/Net Banking)
3. Stripe processes the payment securely
4. On success, purchase is recorded in database
5. User gets instant access to download materials

### Admin System Setup

#### Creating Admin Users

1. **Register a regular user** through the application
2. **Update user role in database**:
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

#### Admin Credentials (Pre-configured)
- **Email**: `admin@example.com`
- **Password**: `P@ssw0rd!`
- **Role**: Admin

#### Admin Panel Features
- **Purchase Management**: View all user purchases and transaction history
- **Content Management**: Upload, edit, and delete interview materials
- **File Upload**: Bulk upload PDFs with automatic material creation
- **User Analytics**: Monitor user registrations and activity
- **Revenue Tracking**: View payment analytics and revenue reports

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/user
Authorization: Bearer <token>
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

### Material Endpoints

#### Get All Materials
```http
GET /api/materials
```

#### Search Materials
```http
GET /api/materials/search?q=java&technology=Java&difficulty=medium
```

#### Get Material Details
```http
GET /api/materials/:id
```

### Payment Endpoints

#### Create Payment Intent
```http
POST /api/create-payment-intent
Authorization: Bearer <token>
Content-Type: application/json

{
  "materialIds": [1, 2, 3]
}
```

#### Confirm Purchase
```http
POST /api/confirm-purchase
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentIntentId": "pi_...",
  "materialIds": [1, 2, 3]
}
```

### Admin Endpoints

#### Get Admin Status
```http
GET /api/admin/check
Authorization: Bearer <admin-token>
```

#### Get All Purchases
```http
GET /api/admin/purchases
Authorization: Bearer <admin-token>
```

#### Upload Material
```http
POST /api/admin/upload
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

{
  "file": <pdf-file>,
  "technology": "Java"
}
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id VARCHAR PRIMARY KEY,
  email VARCHAR UNIQUE,
  password VARCHAR,
  firstName VARCHAR,
  lastName VARCHAR,
  role VARCHAR DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### Materials Table
```sql
CREATE TABLE materials (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  technology VARCHAR NOT NULL,
  difficulty VARCHAR,
  price DECIMAL(10,2),
  downloadUrl VARCHAR,
  previewUrl VARCHAR,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

### Purchases Table
```sql
CREATE TABLE purchases (
  id SERIAL PRIMARY KEY,
  userId VARCHAR REFERENCES users(id),
  materialId INTEGER REFERENCES materials(id),
  amount DECIMAL(10,2),
  paymentIntentId VARCHAR,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

## Deployment

### Production Deployment Options

#### Option 1: Vercel (Recommended for Full-Stack)

**Step 1: Prepare for Deployment**
1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

**Step 2: Configure Vercel**
Create `vercel.json` in root directory:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

**Step 3: Environment Variables**
In Vercel dashboard, add these environment variables:
```
DATABASE_URL=your_postgres_connection_string
SESSION_SECRET=your_strong_session_secret
STRIPE_SECRET_KEY=sk_live_your_stripe_secret
VITE_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_your_stripe_publishable
USE_SIMPLE_ROUTES=false
```

**Step 4: Deploy**
```bash
vercel --prod
```

#### Option 2: Railway (Database + Backend)

**Step 1: Setup Railway**
1. Go to https://railway.app and create account
2. Create new project
3. Connect your GitHub repository

**Step 2: Database Setup**
1. Add PostgreSQL service in Railway
2. Copy the DATABASE_URL from Railway dashboard

**Step 3: Environment Variables**
Add in Railway dashboard:
```
DATABASE_URL=postgresql://postgres:password@host:port/database
SESSION_SECRET=your_strong_session_secret_here
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
VITE_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_your_stripe_publishable_key
NODE_ENV=production
USE_SIMPLE_ROUTES=false
```

**Step 4: Deploy**
Railway auto-deploys from GitHub on push to main branch.

#### Option 3: Netlify + External Database

**For Frontend Only (with external API):**

**Step 1: Build Configuration**
Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "https://your-backend-url.com/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Step 2: Deploy to Netlify**
1. Connect GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables for frontend

#### Option 4: DigitalOcean App Platform

**Step 1: App Configuration**
Create `.do/app.yaml`:
```yaml
name: devinterview-pro
services:
- name: web
  source_dir: /
  github:
    repo: your-username/your-repo
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: DATABASE_URL
    value: ${db.DATABASE_URL}
  - key: SESSION_SECRET
    type: SECRET
  - key: STRIPE_SECRET_KEY
    type: SECRET
databases:
- name: db
  engine: PG
  num_nodes: 1
  size: db-s-dev-database
```

#### Option 5: Heroku

**Step 1: Heroku Setup**
```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create your-app-name

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev
```

**Step 2: Configure Build**
Create `Procfile`:
```
web: npm start
```

**Step 3: Environment Variables**
```bash
heroku config:set NODE_ENV=production
heroku config:set SESSION_SECRET=your_secret_here
heroku config:set STRIPE_SECRET_KEY=sk_live_your_key
heroku config:set VITE_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_your_key
heroku config:set USE_SIMPLE_ROUTES=false
```

**Step 4: Deploy**
```bash
git push heroku main
```

### Database Options for Production

#### 1. Neon (PostgreSQL) - Recommended
- **URL**: https://neon.tech
- **Features**: Serverless PostgreSQL, automatic scaling
- **Setup**: Create database, copy connection string
- **Free Tier**: 0.5GB storage, 100 hours compute

#### 2. Supabase (PostgreSQL)
- **URL**: https://supabase.com
- **Features**: PostgreSQL with real-time features
- **Setup**: Create project, get connection string
- **Free Tier**: 500MB database, 50MB file storage

#### 3. PlanetScale (MySQL)
- **URL**: https://planetscale.com
- **Features**: Serverless MySQL with branching
- **Setup**: Create database, get connection string
- **Free Tier**: 1 database, 5GB storage

#### 4. Railway PostgreSQL
- **URL**: https://railway.app
- **Features**: Simple PostgreSQL hosting
- **Setup**: Add PostgreSQL service to project
- **Pricing**: $5/month for 1GB

### Environment Setup for Production

**Required Environment Variables:**
```env
# Production Configuration
NODE_ENV=production
USE_SIMPLE_ROUTES=false

# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Authentication
SESSION_SECRET=your_very_strong_secret_key_minimum_32_characters

# Stripe Live Keys (for production payments)
STRIPE_SECRET_KEY=sk_live_your_actual_stripe_secret_key
VITE_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_your_actual_stripe_publishable_key

# Optional: Custom Domain
CUSTOM_DOMAIN=yourdomain.com
```

### Pre-Deployment Checklist

- [ ] Database schema deployed (`npm run db:push`)
- [ ] Environment variables configured
- [ ] Stripe account verified and live keys obtained
- [ ] Domain name configured (if using custom domain)
- [ ] SSL certificate enabled
- [ ] Admin user created in production database
- [ ] Payment methods tested with small amounts
- [ ] Error monitoring configured
- [ ] Backup strategy implemented

### Post-Deployment Steps

1. **Domain Configuration**
   - Point your domain to the deployment platform
   - Configure SSL certificate
   - Update CORS settings if needed

2. **Database Setup**
   ```bash
   # Run migrations on production database
   npm run db:push
   ```

3. **Create Admin User**
   ```sql
   -- Connect to production database and run:
   UPDATE users SET role = 'admin' WHERE email = 'your-admin@email.com';
   ```

4. **Test Payment Flow**
   - Make a small test purchase with live Stripe keys
   - Verify payment confirmation emails
   - Check database records for purchase data

5. **Monitor Application**
   - Set up error tracking (Sentry, LogRocket)
   - Configure uptime monitoring
   - Enable database backups

### Custom Domain Setup

#### For Vercel:
1. Add domain in Vercel dashboard
2. Configure DNS records:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   
   Type: A
   Name: @
   Value: 76.76.19.61
   ```

#### For Railway:
1. Add custom domain in Railway dashboard
2. Configure DNS:
   ```
   Type: CNAME
   Name: www
   Value: your-app.railway.app
   
   Type: CNAME
   Name: @
   Value: your-app.railway.app
   ```

### Performance Optimization

1. **Frontend Optimization**
   ```bash
   # Enable compression
   npm install compression
   
   # Optimize images
   npm install sharp
   ```

2. **Database Optimization**
   - Enable connection pooling
   - Add database indexes for search queries
   - Configure read replicas for high traffic

3. **CDN Setup**
   - Use Cloudflare for static asset delivery
   - Enable caching for images and fonts
   - Configure gzip compression

### Monitoring & Analytics

1. **Application Monitoring**
   ```bash
   # Add Sentry for error tracking
   npm install @sentry/node @sentry/react
   ```

2. **Performance Monitoring**
   - Google Analytics for user tracking
   - Stripe Dashboard for payment analytics
   - Database monitoring through provider dashboard

### Backup Strategy

1. **Database Backups**
   - Daily automated backups via hosting provider
   - Weekly manual exports for redundancy
   - Test restore procedures monthly

2. **File Backups**
   - Upload folder sync to cloud storage
   - Version control for all code changes
   - Environment variable backup in secure location

### Security Hardening

1. **Production Security**
   - Enable HTTPS enforcement
   - Configure security headers
   - Implement rate limiting
   - Regular dependency updates

2. **Stripe Security**
   - Use webhook endpoints for payment confirmation
   - Implement proper error handling
   - Monitor for suspicious transactions

### Security Considerations

- Use strong session secrets in production
- Enable HTTPS for all payment transactions
- Regularly update dependencies for security patches
- Implement rate limiting for API endpoints
- Use environment variables for all sensitive data
- Enable database connection pooling
- Implement proper error logging and monitoring

## Payment Security

### Stripe Security Features
- **PCI Compliance**: Stripe handles all PCI compliance requirements
- **3D Secure**: Automatic 3D Secure authentication for card payments
- **Fraud Detection**: Built-in fraud detection and prevention
- **Encryption**: All payment data is encrypted in transit and at rest

### UPI Security
- **Bank-Grade Security**: UPI transactions use bank-level security protocols
- **Two-Factor Authentication**: UPI apps require biometric/PIN verification
- **Real-time Processing**: Instant payment confirmation and settlement

## Troubleshooting

### Common Issues

1. **Payment Processing Unavailable**
   - Ensure Stripe API keys are correctly configured
   - Verify environment variables are loaded
   - Check Stripe dashboard for any account issues

2. **Database Connection Errors**
   - Verify DATABASE_URL format and credentials
   - Ensure PostgreSQL server is running
   - Check network connectivity to database

3. **Admin Panel Access Denied**
   - Verify user has 'admin' role in database
   - Check authentication token is valid
   - Ensure admin middleware is correctly configured

4. **File Upload Issues**
   - Check file permissions on uploads directory
   - Verify multer configuration
   - Ensure file size limits are appropriate

## Support

For technical support or questions:
- Create an issue in the repository
- Contact: admin@example.com
- Documentation: Check this README for detailed setup instructions

## License

This project is proprietary software. All rights reserved.

---

## Payment Integration Details

### Supported Payment Methods

#### UPI (Unified Payments Interface)
- **PhonePe**: Direct integration with PhonePe app
- **Google Pay**: GPay quick payment option
- **Paytm**: Paytm wallet and UPI integration
- **BHIM UPI**: Direct UPI transactions
- **Manual UPI ID**: Custom UPI ID entry (format: user@bank)

#### Credit/Debit Cards
- **Visa**: All Visa card types supported
- **Mastercard**: All Mastercard variants accepted
- **RuPay**: Indian domestic card network
- **International Cards**: Global card acceptance

#### Net Banking
- **All Major Banks**: SBI, HDFC, ICICI, Axis, Kotak, and 100+ banks
- **Real-time Processing**: Instant payment confirmation
- **Secure Gateway**: Bank-grade security for all transactions

### Payment Flow Architecture

1. **User Checkout**: User selects materials and proceeds to payment
2. **Payment Intent**: Stripe creates a secure payment intent
3. **Method Selection**: User chooses preferred payment method
4. **Authentication**: 
   - Cards: 3D Secure authentication
   - UPI: Biometric/PIN verification in UPI app
   - Net Banking: Bank login credentials
5. **Processing**: Stripe processes payment with banking partners
6. **Confirmation**: Real-time payment status and receipt
7. **Access Grant**: Immediate access to purchased materials

### Revenue & Settlement

- **Settlement Period**: T+2 business days for most payment methods
- **Transaction Fees**: 
  - UPI: 0.9% + GST
  - Cards: 2.9% + GST
  - Net Banking: 1.9% + GST
- **Currency**: All prices in INR (Indian Rupees)
- **Refund Policy**: 30-day money-back guarantee

### Testing Payment Methods

#### Test Card Numbers (Development)
```
Visa: 4111 1111 1111 1111
Mastercard: 5555 5555 5555 4444
RuPay: 6200 0000 0000 0005
CVV: Any 3 digits
Expiry: Any future date
```

#### Test UPI IDs (Development)
```
Success: test@upi, demo@paytm
Failure: failure@upi, invalid@bank
```

This comprehensive platform provides a complete solution for interview preparation with secure payment processing and robust content management capabilities.