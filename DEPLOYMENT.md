# AgroConnect Deployment Guide

## Overview
Complete deployment instructions for AgroConnect on production platforms.

## Architecture

```
┌─────────────────────┐
│  Frontend (Next.js) │──┐ Vercel
│  Hosted on Vercel   │  │
└─────────────────────┘  │
                          │
                    ┌─────▼──────────┐
                    │  Backend API   │ Railway/Fly.io
                    │  (Express)     │
                    └─────┬──────────┘
                          │
                    ┌─────▼──────────┐
                    │  PostgreSQL DB │ Supabase/Neon
                    │                │
                    └────────────────┘
                    
┌─────────────────────────────────────┐
│   Stacks Blockchain (Testnet/Main)  │
│   Smart Contract & Payment Gateway   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│    Paystack/Flutterwave Payment     │
│    Traditional Payment Gateway       │
└─────────────────────────────────────┘
```

## 1. Database Setup (Supabase or Neon)

### Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy the connection string
4. In `agroconnect-backend/.env`:
   ```
   DATABASE_URL="postgresql://user:password@db.project.supabase.co:5432/postgres"
   ```

### Neon
1. Go to [console.neon.tech](https://console.neon.tech)
2. Create a project
3. Copy the PostgreSQL connection string
4. In `agroconnect-backend/.env`:
   ```
   DATABASE_URL="postgresql://user:password@ep-something.us-east-1.neon.tech/neondb"
   ```

### Initialize Database

```bash
cd agroconnect-backend
npm install
npx prisma migrate deploy
npx prisma generate
```

## 2. Backend Deployment (Railway or Fly.io)

### Railway

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login:
   ```bash
   railway login
   ```

3. Create project:
   ```bash
   railway init
   ```

4. Set environment variables:
   ```bash
   railway variables set DATABASE_URL="your_postgres_url"
   railway variables set JWT_SECRET="your-very-secure-secret"
   railway variables set PAYSTACK_SECRET_KEY="sk_test_..."
   railway variables set STACKS_CONTRACT_ADDRESS="ST1234..."
   railway variables set FRONTEND_URL="https://yourdomain.com"
   ```

5. Deploy:
   ```bash
   cd agroconnect-backend
   railway up
   ```

6. Get public URL:
   ```bash
   railway open
   ```
   Update your frontend `.env` with this URL

### Fly.io

1. Install Fly CLI:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. Login:
   ```bash
   flyctl auth login
   ```

3. Create app:
   ```bash
   cd agroconnect-backend
   flyctl apps create agroconnect-api
   ```

4. Create `fly.toml`:
   ```toml
   app = "agroconnect-api"
   primary_region = "ord"

   [build]
   builder = "paketobuildpacks"

   [env]
   DATABASE_URL = "postgresql://..."
   JWT_SECRET = "your-secret"
   PORT = "3000"

   [[services]]
   internal_port = 3000
   protocol = "tcp"

   [[services.ports]]
   port = 80
   handlers = ["http"]

   [[services.ports]]
   port = 443
   handlers = ["tls", "http"]
   ```

5. Set secrets:
   ```bash
   flyctl secrets set DATABASE_URL="postgresql://..."
   flyctl secrets set JWT_SECRET="your-secret"
   flyctl secrets set PAYSTACK_SECRET_KEY="sk_test_..."
   ```

6. Deploy:
   ```bash
   flyctl deploy
   ```

7. Get public URL:
   ```bash
   flyctl info
   ```

## 3. Frontend Deployment (Vercel)

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial AgroConnect commit"
git branch -M main
git remote add origin https://github.com/yourusername/agroconnect.git
git push -u origin main
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Select `agroconnect-frontend` repository
5. Configure:
   - Root Directory: `agroconnect-frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`

6. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api
   NEXT_PUBLIC_STACKS_NETWORK=testnet
   NEXT_PUBLIC_STACKS_API_URL=https://api.testnet.hiro.so
   ```

7. Deploy!

## 4. Payment Gateway Setup

### Paystack

1. Go to [paystack.com](https://paystack.com)
2. Create merchant account
3. Get API keys from Dashboard → Settings → Developer
4. In backend `.env`:
   ```
   PAYSTACK_PUBLIC_KEY="pk_live_..."
   PAYSTACK_SECRET_KEY="sk_live_..."
   PAYSTACK_WEBHOOK_SECRET="whsec_..."
   ```

5. Add webhook:
   - Go to Settings → Webhooks
   - Add: `https://your-api.com/api/payments/paystack/webhook`
   - Events: charge.success, charge.failed

### Flutterwave (Alternative)

1. Go to [flutterwave.com](https://flutterwave.com)
2. Create account
3. Get keys from Settings
4. In backend `.env`:
   ```
   FLUTTERWAVE_PUBLIC_KEY="FLWPUBK_LIVE_..."
   FLUTTERWAVE_SECRET_KEY="FLWSECK_LIVE_..."
   ```

## 5. Smart Contract Deployment (Stacks)

See [smart-contracts/DEPLOYMENT_GUIDE.md](../smart-contracts/DEPLOYMENT_GUIDE.md) for detailed instructions.

### Quick Summary:
1. Install Clarinet
2. Create contract from `agroconnect-escrow.clar`
3. Test locally
4. Deploy to testnet
5. Get contract address and update `.env`

## 6. Production Checklist

- [ ] Database configured with real PostgreSQL
- [ ] Backend running on Railway/Fly.io
- [ ] Frontend deployed on Vercel
- [ ] Environment variables set correctly
- [ ] HTTPS enabled on all URLs
- [ ] Paystack/Flutterwave production keys configured
- [ ] Smart contract deployed
- [ ] Webhook endpoints configured
- [ ] Email verification setup (if needed)
- [ ] Error logging configured
- [ ] Database backups enabled
- [ ] Rate limiting configured

## 7. Monitoring & Logs

### Railway
```bash
railway logs
```

### Fly.io
```bash
flyctl logs
flyctl logs -a agroconnect-api
```

### Vercel
Visit Vercel Dashboard → Your Project → Deployments

## 8. Environment Variables Summary

### Backend (.env)
```
# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-very-long-random-string
JWT_EXPIRY=24h

# Port
PORT=3000
NODE_ENV=production

# Paystack
PAYSTACK_PUBLIC_KEY=pk_live_...
PAYSTACK_SECRET_KEY=sk_live_...

# Stacks
STACKS_NETWORK=mainnet
STACKS_API_URL=https://api.mainnet.hiro.so
STACKS_CONTRACT_ADDRESS=ST...
STACKS_CONTRACT_NAME=agroconnect_escrow

# Frontend
FRONTEND_URL=https://yourdomain.com
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_STACKS_NETWORK=mainnet
NEXT_PUBLIC_STACKS_API_URL=https://api.mainnet.hiro.so
```

## 9. Scaling & Performance

- Add Redis caching for product listings
- Implement database connection pooling
- Use CDN for static assets (Vercel/Cloudflare)
- Enable gzip compression
- Optimize database queries
- Add rate limiting to API endpoints
- Monitor API response times

## 10. Support & Troubleshooting

### Common Issues

**API Connection Errors**
- Check frontend `NEXT_PUBLIC_API_URL` is correct
- Verify CORS settings in backend
- Check database connection

**Payment Gateway Issues**
- Verify API keys are correct
- Check webhook configuration
- Review error logs

**Smart Contract Issues**
- Verify contract is deployed
- Check contract address in environment
- Test with testnet first

For more help, refer to:
- [Express.js Docs](https://expressjs.com)
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Stacks Docs](https://docs.stacks.co)
