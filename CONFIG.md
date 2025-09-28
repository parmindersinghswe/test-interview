# DevInterview Pro - Complete Configuration Guide

## 🏗️ Technology Stack & Services

### **Core Technologies**
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Wouter Router
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **File Storage**: Local disk storage (`/uploads` directory)
- **Payment Processing**: Stripe (Cards, UPI, Net Banking)
- **Authentication**: Email/Password with JWT tokens + Admin session management
- **UI Components**: shadcn/ui, Radix UI, Lucide React icons

### **Database Schema**
```sql
-- Core tables managed by Drizzle ORM
users              -- User accounts (id, email, password_hash, role)
materials          -- Interview materials catalog
purchases          -- Purchase transactions
cart_items         -- Shopping cart data
reviews            -- User reviews & ratings
uploads            -- Admin uploaded PDF files
sessions           -- Session storage (PostgreSQL store)
```

## 🔐 Required Environment Variables

### **Essential for Production**
```env
# Database Connection
DATABASE_URL=postgresql://username:password@host:port/database

# Authentication & Security
SESSION_SECRET=your_32_character_random_secret_key
NODE_ENV=production

# Payment Processing (Stripe)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
VITE_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_your_stripe_publishable_key

# Application Mode
USE_SIMPLE_ROUTES=false
```

### **Development Environment**
```env
# Development Database
DATABASE_URL=postgresql://localhost:5432/devinterview_dev

# Development Settings
NODE_ENV=development
SESSION_SECRET=dev_secret_minimum_32_characters_long

# Stripe Test Keys
STRIPE_SECRET_KEY=sk_test_your_test_secret_key
VITE_STRIPE_PUBLISHABLE_KEY_TEST=pk_test_your_test_publishable_key

# Route Configuration
USE_SIMPLE_ROUTES=false
```

### **Admin Account Setup**
```env
# For admin panel access (optional - can use database user with role='admin')
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2a$10$hashed_password_here
```

## 📁 File Storage Configuration

### **PDF Upload System**
- **Storage Location**: `./uploads/` directory (auto-created)
- **File Types**: PDF only (application/pdf)
- **File Size Limit**: 10MB maximum
- **Upload Path**: `/api/admin/upload` (admin only)
- **Download Path**: `/api/download/upload/:uploadId`
- **File Naming**: `file-timestamp-random.pdf` format

### **Storage Structure**
```
uploads/
├── file-1749045123456-987654321.pdf
├── file-1749045234567-123456789.pdf
└── ...
```

## 💳 Payment System Configuration

### **Stripe Integration**
- **Supported Methods**: 
  - Credit/Debit Cards (Visa, Mastercard, RuPay)
  - UPI (PhonePe, Google Pay, Paytm, BHIM)
  - Net Banking (All major Indian banks)
  - Digital Wallets

### **Payment Flow**
1. User adds materials to cart
2. Checkout creates Stripe Payment Intent
3. Client-side Stripe handles payment collection
4. Server verifies payment and creates purchase record
5. User gets download access to purchased materials

### **Required Stripe Setup**
1. Create Stripe account at https://stripe.com
2. Enable Indian payment methods in Stripe Dashboard
3. Configure webhooks (optional for advanced features)
4. Get API keys from Dashboard → Developers → API keys

## 🔒 Authentication System

### **User Authentication**
- **Method**: Email/Password with bcrypt hashing
- **Tokens**: JWT-based authentication tokens
- **Session Storage**: PostgreSQL sessions table
- **Registration**: `/api/auth/register`
- **Login**: `/api/auth/login` 
- **User Data**: `/api/auth/user`

### **Admin Authentication**
- **Method**: Dual system (Environment variables OR database role)
- **Access**: Admin panel at `/admin`
- **Permissions**: Upload management, purchase analytics, user management
- **Endpoints**: `/api/admin/*` routes

## 🗄️ Database Hosting Options

### **Production Databases**
1. **Neon** (Recommended)
   - URL: https://neon.tech
   - Free tier: 0.5GB storage
   - Auto-scaling, branching
   - Connection string format: `postgresql://username:password@ep-***.aws.neon.tech/dbname`

2. **Supabase**
   - URL: https://supabase.com
   - Free tier: 500MB database
   - Real-time features included
   - Connection string in project settings

3. **Railway**
   - URL: https://railway.app
   - Simple PostgreSQL addon
   - $5/month for 1GB
   - Auto-generated DATABASE_URL

4. **PlanetScale** (MySQL alternative)
   - URL: https://planetscale.com
   - Serverless MySQL with branching
   - Free tier: 1 database, 5GB

## 🚀 Deployment Platforms

### **Recommended: Vercel (Full-Stack)**
```bash
# Auto-deploys from vercel.json configuration
# Set environment variables in Vercel dashboard
# Includes PostgreSQL connection pooling
```

### **Alternative: Railway**
```bash
# Simple deployment with database included
# Environment variables in Railway dashboard
# Auto-deploys on git push
```

### **Frontend Only: Netlify**
```bash
# For static frontend deployment
# Requires separate backend hosting
# Configure netlify.toml for redirects
```

## 📊 Admin Panel Features

### **Content Management**
- PDF upload system for interview materials
- Technology categorization (React, .NET, Java, Python, etc.)
- Material pricing and description management
- Upload-to-material conversion system

### **Purchase Analytics**
- All purchases overview with user details
- Revenue tracking and reporting
- User purchase history
- Download analytics

### **User Management**
- User role assignment (admin/user)
- Account status management
- Registration oversight

## 🔧 Development Setup

### **Prerequisites**
- Node.js 18+ or 20+
- PostgreSQL database
- Stripe account (for payments)

### **Quick Start**
```bash
git clone <repository>
cd devinterview-pro
npm install
cp .env.example .env
# Configure environment variables
npm run db:push
npm run dev
```

### **Database Migration**
```bash
# Push schema changes to database
npm run db:push

# Generate migration files (if needed)
npm run db:generate

# Access database studio
npm run db:studio
```

## 🛡️ Security Configuration

### **Production Security**
- HTTPS enforcement (automatic on hosting platforms)
- Environment variable protection
- SQL injection prevention (Drizzle ORM)
- XSS protection (React built-in)
- CSRF protection via same-origin policy
- Secure session cookies
- Password hashing with bcrypt

### **API Security**
- JWT token validation
- Role-based access control
- Admin route protection
- File upload validation (PDF only)
- File size limits (10MB)

## 📈 Performance Optimization

### **Frontend**
- Code splitting with React.lazy
- Image optimization
- Bundle size optimization with Vite
- CDN delivery (automatic on Vercel/Netlify)

### **Backend**
- Database connection pooling
- Query optimization with Drizzle
- File streaming for downloads
- Compression middleware

## 🔍 Monitoring & Analytics

### **Recommended Tools**
- **Error Tracking**: Sentry
- **Uptime Monitoring**: UptimeRobot
- **Analytics**: Google Analytics 4
- **Performance**: Vercel Analytics
- **Database**: Built-in platform monitoring

## ⚠️ Common Issues & Solutions

### **Payment Not Working**
- Verify Stripe keys are LIVE keys (sk_live_, pk_live_)
- Check Stripe webhook configuration
- Ensure Indian payment methods are enabled

### **Database Connection Errors**
- Verify DATABASE_URL format and credentials
- Check database server accessibility
- Ensure connection string includes SSL parameters

### **File Upload Issues**
- Verify uploads directory exists and is writable
- Check file size limits (10MB default)
- Ensure PDF mime type validation

### **Admin Access Denied**
- Check user role in database: `UPDATE users SET role = 'admin' WHERE email = 'your-email';`
- Verify admin authentication system
- Clear browser cache and cookies

## 📞 Support & Maintenance

### **Regular Maintenance**
- Database backup schedule
- Log rotation and cleanup
- Security updates for dependencies
- Stripe webhook endpoint monitoring
- File storage cleanup for unused uploads

### **Scaling Considerations**
- Database connection limits
- File storage migration to cloud (AWS S3, Cloudinary)
- CDN for static assets
- Load balancing for high traffic
- Redis for session storage in multi-instance deployments