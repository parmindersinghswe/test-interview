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

## SEO Component & Structured Data

Use the `SEO` component to manage meta tags and inject JSON-LD structured data for richer search results. Pass a `schema` object when you need to describe a page as a Product or Article.

```tsx
import { SEO } from '@/components/SEO';

<SEO
  title="Material Title"
  description="Brief description"
  schema={{
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Material Title",
    offers: {
      "@type": "Offer",
      price: 99,
      priceCurrency: "INR"
    }
  }}
/>
```

Pages such as `MaterialDetails` use this capability to expose product-level schema to search engines.

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **TanStack Query** for data fetching
- **Wouter** for routing
- **Razorpay Checkout** for payment processing

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** database
- **Drizzle ORM** for database operations
- **Express Session** for authentication
- **Multer** for file uploads
- **Razorpay Node SDK** for payment processing
- **jsPDF** for PDF generation

## Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Razorpay account with API credentials (for payments)

> **Note:** The host machine must have a CA bundle installed. Without it, Node.js network requests may fail with `ERR_UNABLE_TO_GET_ISSUER_CERT_LOCALLY`.
>
> ```bash
> sudo apt-get install -y ca-certificates && sudo update-ca-certificates  # Debian/Ubuntu
> apk add --no-cache ca-certificates                                     # Alpine
> ```
>
> For custom or corporate certificate chains, set the `NODE_EXTRA_CA_CERTS` environment variable to the path of your CA bundle.

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

# Razorpay Payment Configuration (Required for payments)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# Admin login for simple routes
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2a$10$hashed_password_here

# Replit authentication (optional)
REPLIT_DOMAINS=your-project.username.repl.co
REPL_ID=your_repl_id
ISSUER_URL=https://replit.com/oidc

# Application Configuration
NODE_ENV=development
VERBOSE_LOGGING=true
```

> **Where to find Razorpay credentials:**
> - **Key ID & Key Secret**: Log in to the [Razorpay Dashboard](https://dashboard.razorpay.com/) and go to **Settings → API Keys**. Create a new key pair to download the Key ID and Secret for either the Test or Live mode.
> - **Webhook Secret**: Navigate to **Settings → Webhooks** in the Razorpay Dashboard. When adding your webhook endpoint, define a secret and reuse it as `RAZORPAY_WEBHOOK_SECRET` in your environment variables.

### Database migrations

Apply schema changes with `npm run db:push`. This command is **not** part of `npm run dev`, so remember to run it whenever the Drizzle migrations change:

- **Local development** – Run `npm run db:push` after installing dependencies and any time you edit the files under `migrations/`.
- **Docker / Docker Compose** – Execute `docker compose run --rm app npm run db:push` so the application container updates the PostgreSQL instance before starting normally.
- **Production deploys** – Vercel executes `npm run vercel:migrate` (see `scripts/vercel-migrate.mjs`) immediately after the build, which in turn runs `npm run db:push`. For other platforms, add an explicit manual step or a CI/CD job that runs `npm run db:push` against the production database.

### Run with Docker

#### Prerequisites
- [Docker Engine](https://docs.docker.com/engine/install/) with BuildKit support
- [Docker Compose v2](https://docs.docker.com/compose/install/) (included with recent Docker Desktop/CLI releases)

#### Build the application image
From the repository root, build the combined Express/Vite server image. The command below assumes you are using the root `Dockerfile`; adjust the `-f` flag if you keep the Dockerfile elsewhere.

```bash
docker build -t devinterview-pro-app .
```

The resulting `devinterview-pro-app` image bundles both the API (Express) and the Vite build so the same container can serve the full stack.

#### Start the stack with Docker Compose
A typical `docker-compose.yml` pairs the application container with PostgreSQL:

```yaml
services:
  app:
    image: devinterview-pro-app
    env_file:
      - .env.docker
    ports:
      - "5000:5000"
    depends_on:
      - postgres
  postgres:
    image: postgres:16
    env_file:
      - .env.postgres
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```

Copy `.env.example` to `.env` for local development, and create Docker-specific environment files referenced by Compose (for example, `.env.docker` and `.env.postgres`). Secrets should live in these files rather than being baked into images. When you need to override a value temporarily, set it with `docker compose run -e NAME=value ...` instead of editing the file.

Bring up the containers once the Compose file exists:

```bash
docker compose up -d
```

Before the first run, apply the database schema inside the application container so that PostgreSQL has all required tables:

```bash
docker compose run --rm app npm run db:push
```

After migrations succeed, restart the application container to ensure it picks up the schema:

```bash
docker compose restart app
```

Shut the stack down at any time with `docker compose down`, and add `-v` if you want to remove the PostgreSQL volume as well.

### Vercel Deployment

When deploying with Vercel, keep the Build Command set to `npm run build && npm run vercel:migrate` so migrations run automatically via `scripts/vercel-migrate.mjs` (which calls `npm run db:push`)—this matches the configuration in `vercel.json`. Configure your environment variables in the Vercel dashboard, and when production uses a Neon database be sure to set `DATABASE_CLIENT=neon` alongside `DATABASE_URL`. Review [DEPLOYMENT.md](DEPLOYMENT.md) for the complete deployment checklist.

### Azure Deployment (App Service or Container Apps)

1. **Provision infrastructure**
   - Create an [Azure Database for PostgreSQL flexible server](https://learn.microsoft.com/azure/postgresql/flexible-server) in the same region as the application. Enable public access or configure a private endpoint and firewall rules for outbound connectivity from the app.
   - For *App Service*: create a Linux App Service Plan and a Web App running Node.js 18+. For *Container Apps*: provision a Container Apps environment and an app that uses the repository Dockerfile. Attach a custom domain through Azure Front Door or App Service custom domains, and enable managed HTTPS certificates.
2. **Configure secrets and environment variables**
   - In App Service, use **Settings → Configuration** to add all variables from the `.env` example (`DATABASE_URL`, Razorpay keys, session secret, etc.). In Container Apps, mirror the same settings under **Application** and **Secret** values. Consider linking an Azure Key Vault for centralized secret storage.
   - Update `DATABASE_URL` to point to the Azure Database for PostgreSQL connection string and enforce SSL mode (`?sslmode=require`).
3. **Build and start commands**
   - For App Service with the built-in Node handler, set the build command to `npm install && npm run build` and the startup command to `npm run start`. Container Apps deployments should run the existing Dockerfile or use the same commands in a custom start script.
4. **Run database migrations**
   - Use Azure Cloud Shell or `az webapp ssh`/`az containerapp exec` to open a shell inside the running container and execute `npm run db:push` so the Azure Database instance has the latest schema. Alternatively, run the command from your CI/CD pipeline after deploying.

> **Networking notes:** If you restrict outbound networking, grant the app access to the PostgreSQL server through VNet integration or delegated subnets. Bind a custom domain and enforce HTTPS via App Service managed certificates, Azure Front Door, or Azure CDN.

### AWS Deployment (Elastic Beanstalk or ECS)

1. **Provision infrastructure**
   - Launch an Amazon RDS for PostgreSQL instance (or Aurora PostgreSQL) in a private subnet with public or VPN access that matches your deployment model. Enable automatic backups and enforce IAM or password authentication as required.
   - For *Elastic Beanstalk*: create a Node.js 18+ web server environment (single or load-balanced). For *Amazon ECS*: create a cluster (Fargate or EC2) and a service that runs the container built from the repository Dockerfile behind an Application Load Balancer. Configure Route 53 for custom domains and attach AWS Certificate Manager (ACM) certificates for HTTPS.
2. **Configure secrets and environment variables**
   - In Elastic Beanstalk, add environment properties under **Configuration → Software**; for ECS, use task definition environment variables or inject secrets from AWS Secrets Manager/SSM Parameter Store. Include all variables from `.env` and set the `DATABASE_URL` to the RDS connection string with `sslmode=require`.
   - Ensure security groups allow the application tasks or instances to reach the RDS endpoint on port 5432.
3. **Build and start commands**
   - Elastic Beanstalk’s Node.js platform runs `npm install` automatically; add a `container_commands` section in `.ebextensions` or a build step in your CI/CD pipeline that calls `npm run build`. Set the Node command to `npm run start`. ECS task definitions should run `npm run start` after the image executes `npm install && npm run build` during the image build stage.
4. **Run database migrations**
   - After the environment is healthy, connect via `eb ssh` or use AWS Systems Manager Session Manager (for ECS) to open a shell in the application container and run `npm run db:push`. You can also schedule this step in your deployment pipeline (e.g., CodeBuild, GitHub Actions) with network access to the RDS instance.

> **Networking notes:** Place load balancers and Route 53 DNS in front of the environment to serve a custom domain over HTTPS. For private RDS deployments, ensure the application subnets have the correct route tables/NAT gateways for outbound traffic and that security groups allow bidirectional traffic between the app and database tiers.

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

## API Routes

All API endpoints use **lowercase, case-sensitive** paths. Using a different
casing (for example, `/api/Auth/Login`) will result in a 404 error. Common
paths include:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/user`
- `GET /api/materials`
- `GET /api/materials/:id/download`
- `POST /create-order`
- `POST /confirm-success`

Requests with incorrect casing will receive a helpful error message indicating
the expected path.

### Running Tests

Run the automated test suite:

```bash
npm test
```

Check linting and TypeScript types:

```bash
npm run lint
npm run check
```

### Customizing the Error Boundary

The client application wraps its router with an `ErrorBoundary`. You can change the fallback UI by passing a `fallback` element:

```tsx
<ErrorBoundary fallback={<div>Custom error message</div>}>
  <Router />
</ErrorBoundary>
```


## 🏗️ Complete Technology Stack

### **Core Technologies**
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js + TypeScript  
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Email/Password + JWT tokens
- **Payment**: Razorpay (Cards, UPI, Net Banking)
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

### **Payment System Integration**

Razorpay is used to process all payments. Provide your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the environment. The checkout page will load Razorpay's script and handle payment verification on the server.

### **File Storage System**
- **Location**: `./uploads/` directory (auto-created, not served by Express)
- **Cleanup**: Remove unused files periodically or when materials are deleted
- **File Types**: PDF only (10MB maximum)
- **Access Control**: Admin upload, user download after purchase
- **Naming Convention**: `file-timestamp-random.pdf`
- **Security**: MIME type validation, size limits, admin-only uploads. Consider scanning uploads for malware or storing them in a non-executable storage bucket.

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

UPI payments are processed through Razorpay:

1. **Enable UPI in Razorpay Dashboard**
   - Go to **Settings → Payment Methods → UPI**
   - Ensure UPI is enabled for both Test and Live modes as required

2. **Generate Razorpay API Keys**
   - Navigate to **Settings → API Keys**
   - Create separate key pairs for Test and Live modes and update `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET`

3. **Configure Razorpay Webhooks (Recommended)**
   - Go to **Settings → Webhooks**
   - Add your webhook endpoint (for example, `/api/razorpay/webhook`) and define `RAZORPAY_WEBHOOK_SECRET`
   - Subscribe to events like `payment.captured`, `payment.failed`, and `order.paid`

Refer to the Razorpay documentation for up-to-date test card numbers, UPI IDs, and wallet credentials when exercising the checkout in Test mode.

#### Payment Flow

1. User selects materials and proceeds to checkout
2. Payment options are presented (UPI/Cards/Net Banking)
3. Razorpay creates an order and securely processes the payment
4. The server verifies the Razorpay signature before recording the purchase in the database
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
VERBOSE_LOGGING=false
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
NODE_ENV=production
VERBOSE_LOGGING=false
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
heroku config:set VERBOSE_LOGGING=false
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
VERBOSE_LOGGING=false

# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Authentication
SESSION_SECRET=your_very_strong_secret_key_minimum_32_characters

# Razorpay Live Keys (for production payments)
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_live_secret
RAZORPAY_WEBHOOK_SECRET=your_live_webhook_secret

# Optional: Custom Domain
CUSTOM_DOMAIN=yourdomain.com
```

### Pre-Deployment Checklist

- [ ] Database schema deployed (`npm run db:push`)
- [ ] Environment variables configured
- [ ] Razorpay account verified and live keys obtained
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
   - Make a small test purchase with live Razorpay keys
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
- Razorpay Dashboard for payment analytics
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
   - Rate limiting: 100 requests per 15 minutes on `/api/auth/*` and `/api/admin/*`
   - Regular dependency updates

2. **Razorpay Security**
   - Verify webhook signatures with `RAZORPAY_WEBHOOK_SECRET`
   - Implement proper error handling for Razorpay order and payment APIs
   - Monitor the Razorpay Dashboard for suspicious transactions

### Security Considerations

- Use strong session secrets in production
- Enable HTTPS for all payment transactions
- Regularly update dependencies for security patches
- Rate limiting in place for `/api/auth/*` and `/api/admin/*` (100 requests/15 minutes)
- Use environment variables for all sensitive data
- Enable database connection pooling
- Implement proper error logging and monitoring

## Payment Security

### Razorpay Security Features
- **PCI DSS Level 1 Compliance**: Razorpay maintains PCI DSS Level 1 certification
- **3D Secure & OTP**: Card payments use issuer-backed 3D Secure/OTP flows where required
- **Fraud Monitoring**: Risk engine flags suspicious transactions for review
- **Encryption**: Payment data is encrypted in transit and at rest

### UPI Security
- **Bank-Grade Security**: UPI transactions use bank-level security protocols
- **Two-Factor Authentication**: UPI apps require biometric/PIN verification
- **Real-time Processing**: Instant payment confirmation and settlement

## Troubleshooting

### Common Issues

1. **Payment Processing Unavailable**
   - Ensure Razorpay API keys are correctly configured for the current mode (Test/Live)
   - Verify environment variables are loaded, including `RAZORPAY_WEBHOOK_SECRET`
   - Check the Razorpay Dashboard for any account issues or disabled payment methods

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
2. **Order Creation**: The server requests a Razorpay order for the selected materials
3. **Method Selection**: User chooses preferred payment method
4. **Authentication**:
   - Cards: 3D Secure authentication
   - UPI: Biometric/PIN verification in UPI app
   - Net Banking: Bank login credentials
5. **Processing**: Razorpay processes the payment with issuing banks and UPI providers
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