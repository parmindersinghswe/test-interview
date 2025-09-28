# Quick Deployment Guide

## 🚀 Go Live in 5 Minutes

### Option 1: Vercel (Recommended - Full Stack)

1. **Push to GitHub** (if not already done)
2. **Connect to Vercel**:
   - Go to https://vercel.com
   - Import your GitHub repository
   - Configure these environment variables:
     ```
     DATABASE_URL=your_postgres_url
     DATABASE_CLIENT=neon # required when using Neon serverless Postgres
     SESSION_DB_URL=optional_separate_session_store
     SESSION_SECRET=generate_random_32_char_string
     JWT_SECRET=your_jwt_secret
     RAZORPAY_KEY_ID=rzp_live_your_key_id
     RAZORPAY_KEY_SECRET=your_razorpay_secret
     RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_if_used
     SITE_URL=https://your-production-domain
     BASE_URL=https://your-production-domain
     VERBOSE_LOGGING=false
     ```
3. **Deploy** - Vercel auto-deploys from the `vercel.json` configuration

### Option 2: Railway (Easiest Database Setup)

1. **Go to https://railway.app**
2. **Create new project** → Import from GitHub
3. **Add PostgreSQL service** → Copy DATABASE_URL
4. **Set environment variables** in Railway dashboard (DATABASE_URL, SESSION_SECRET, JWT_SECRET, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
5. **Deploy** - Railway auto-deploys on git push

### Option 3: Netlify (Frontend) + Railway (Backend)

1. **Deploy Backend to Railway** (follow Option 2)
2. **Deploy Frontend to Netlify**:
   - Connect GitHub repo to Netlify
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Update `netlify.toml` with your Railway backend URL

## Database Setup (Choose One)

### Neon (Recommended - Free Tier)
- Go to https://neon.tech
- Create database → Copy connection string
- If deploying with Node.js and Drizzle, remove `channel_binding=require` from the connection string—the `pg` client used by
  Drizzle doesn't support channel binding.
- Free: 0.5GB storage, 100 hours compute

### Supabase (Alternative)
- Go to https://supabase.com
- Create project → Copy connection string
- Free: 500MB database

### Railway PostgreSQL
- Add PostgreSQL service in Railway project
- Copy DATABASE_URL from service details

## Required Environment Variables

```env
# Essential for Production
DATABASE_URL=postgresql://user:pass@host:port/db
SESSION_SECRET=your_32_character_secret_key
JWT_SECRET=your_jwt_secret
NODE_ENV=production

# Payment Processing (Razorpay)
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Optional
DATABASE_CLIENT=neon
SESSION_DB_URL=postgresql://session_user:password@host:5432/session_db
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_if_used
SITE_URL=https://your-production-domain
BASE_URL=https://your-production-domain
VERBOSE_LOGGING=false

> ℹ️ Set `DATABASE_CLIENT=neon` only when deploying to Neon serverless Postgres. For Supabase, Railway, or other traditional Postgres providers, omit this override so the standard `pg` client is used.
```

## Post-Deployment Checklist

1. **Database Migration**: Connect to production DB and run:
   ```sql
   -- Create admin user
   UPDATE users SET role = 'admin' WHERE email = 'your-email@domain.com';
   ```

2. **Test Payment**: Make a small test purchase to verify Razorpay integration

3. **Domain Setup**: Add your custom domain in the hosting platform dashboard

4. **SSL Certificate**: Enable HTTPS (usually automatic)

5. **Monitor**: Set up error tracking and uptime monitoring

## Troubleshooting

- **Payment not working**: Verify Razorpay keys are live keys (not test)
- **Database connection error**: Check DATABASE_URL format and credentials
- **Build fails**: Ensure all dependencies are in package.json
- **Admin access denied**: Verify user role is set to 'admin' in database

## Support

For deployment issues, check the full README.md deployment section or contact support.