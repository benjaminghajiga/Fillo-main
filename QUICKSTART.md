# AgroConnect - Quick Start Guide

## 🚀 5-Minute Setup

### Prerequisites
- Node.js 18+
- PostgreSQL (local or cloud - Supabase/Neon)
- npm or yarn

### Step 1: Clone & Install
```bash
# If you haven't already
chmod +x setup.sh
./setup.sh
```

This will:
- ✅ Check Node.js installation
- ✅ Install backend dependencies
- ✅ Install frontend dependencies
- ✅ Generate Prisma client
- ✅ Create .env template files

### Step 2: Configure Database

**Option A: Local PostgreSQL**
```bash
# Create database
createdb agroconnect

# Update agroconnect-backend/.env
DATABASE_URL="postgresql://username:password@localhost:5432/agroconnect"
```

**Option B: Supabase (Recommended)**
1. Go to https://supabase.com
2. Create new project
3. Get PostgreSQL connection string
4. Paste into `agroconnect-backend/.env`

**Option C: Neon**
1. Go to https://console.neon.tech
2. Create new project
3. Get connection string
4. Paste into `agroconnect-backend/.env`

### Step 3: Setup Backend

```bash
cd agroconnect-backend

# Edit .env file
# DATABASE_URL - add your database
# PAYSTACK_SECRET_KEY - get from https://paystack.com
# JWT_SECRET - create secure random string

# Initialize database
npx prisma migrate dev --name init

# Start backend
npm run dev
```

Backend will run on `http://localhost:3000`

### Step 4: Setup Frontend

```bash
cd ../agroconnect-frontend

# Edit .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Start frontend
npm run dev
```

Frontend will run on `http://localhost:3000` (or next available port)

### Step 5: Test It Out

1. Open http://localhost:3000 in browser
2. Click "Register"
3. Create farmer account with test data
4. Add a product
5. Logout, register as buyer
6. Browse products
7. Place an order

## 📋 Configuration Files

### Backend (.env)

```bash
# REQUIRED: Database connection
DATABASE_URL="postgresql://user:password@host:5432/agroconnect"

# REQUIRED: Authentication
JWT_SECRET="generate-with-: openssl rand -base64 32"
JWT_EXPIRY="24h"

# REQUIRED: Port
PORT=3000
NODE_ENV="development"

# OPTIONAL: Paystack (for bank transfers)
PAYSTACK_PUBLIC_KEY="pk_test_..."
PAYSTACK_SECRET_KEY="sk_test_..."

# OPTIONAL: Stacks blockchain
STACKS_NETWORK="testnet"
STACKS_API_URL="https://api.testnet.hiro.so"
STACKS_CONTRACT_ADDRESS="ST1234..." # After deployment
STACKS_CONTRACT_NAME="agroconnect_escrow"

# REQUIRED: Frontend URL (for CORS)
FRONTEND_URL="http://localhost:3000"
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
NEXT_PUBLIC_STACKS_NETWORK="testnet"
NEXT_PUBLIC_STACKS_API_URL="https://api.testnet.hiro.so"
```

## 🧪 Testing with Sample Data

### Test Paystack Payment
1. Create order as buyer
2. Choose "Bank Transfer" payment
3. Use test card:
   - Number: `4084084084084081`
   - CVV: `123`
   - Expiry: `01/25` (any future date)

### Test Stacks Payment (Blockchain)
1. Install Xverse or Leather wallet
2. Get testnet STX: https://testnet-faucet.alexgo.io/
3. Create order and choose crypto payment
4. Sign transaction in wallet
5. Copy transaction hash

## 🔑 Getting API Keys

### Paystack
1. Go to https://paystack.com/signup
2. Create account
3. Navigate to Dashboard → Settings → Developer
4. Copy:
   - Public key → `PAYSTACK_PUBLIC_KEY`
   - Secret key → `PAYSTACK_SECRET_KEY`

### Stacks Blockchain
1. Install wallet: Xverse or Leather
2. Get testnet funds: https://testnet-faucet.alexgo.io/
3. Deploy smart contract (see smart-contracts/DEPLOYMENT_GUIDE.md)
4. Copy contract address → `STACKS_CONTRACT_ADDRESS`

## 🔍 Debugging Tips

### Backend Logs
```bash
cd agroconnect-backend
npm run dev
```
Watch for errors in terminal

### Database
```bash
# Check connection
psql -U username -h localhost -d agroconnect

# View all tables
\dt

# Check products table
SELECT * FROM "Product";
```

### Frontend
- Open browser DevTools (F12)
- Check Console tab for JavaScript errors
- Check Network tab for API calls
- Check Application → Local Storage for JWT token

### API Testing
```bash
# Test health check
curl http://localhost:3000/health

# Test product listing
curl http://localhost:3000/api/products

# Test with auth
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/orders
```

## 🚀 Next Steps After Setup

### 1. Database Exploration
```bash
npx prisma studio
```
Opens visual database explorer at http://localhost:5555

### 2. Add More Products
- Login as farmer
- Click "+ Add Product"
- Fill form and submit

### 3. Test Full Purchase Flow
- Register farmer with products
- Register buyer account
- Browse marketplace
- Create order
- Complete payment

### 4. Deploy to Production
See [DEPLOYMENT.md](../DEPLOYMENT.md) for:
- Railway backend deployment
- Vercel frontend deployment
- Production database setup
- Environment configuration

## ⚠️ Common Issues & Solutions

### Error: ECONNREFUSED (database)
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:** 
- Start PostgreSQL service: `sudo service postgresql start`
- Or use cloud database (Supabase/Neon)

### Error: EADDRINUSE (port in use)
```
Error: listen EADDRINUSE :::3000
```
**Solution:** 
- Change PORT in .env
- Or kill process: `lsof -i :3000` then `kill -9 <PID>`

### Error: Invalid or expired token
```
Unauthorized
```
**Solution:**
- Login again to get new token
- Check JWT_SECRET matches
- Token expires after 24h

### Paystack payment fails
```
Failed to initialize payment
```
**Solution:**
- Verify PAYSTACK_SECRET_KEY is correct (should start with `sk_`)
- Check it's from https://paystack.com (not Flutterwave)
- Use test keys for development

### Smart contract not found
```
Contract address not found
```
**Solution:**
- Deploy contract first (see smart-contracts/DEPLOYMENT_GUIDE.md)
- Update STACKS_CONTRACT_ADDRESS in .env
- Use testnet for development

## 📞 Support Resources

- **Express.js Help:** https://expressjs.com
- **Next.js Help:** https://nextjs.org/docs
- **PostgreSQL Help:** https://www.postgresql.org/docs
- **Prisma Help:** https://www.prisma.io/docs
- **Stacks Help:** https://docs.stacks.co
- **Paystack Help:** https://paystack.com/support

## ✅ Checklist Before Production

- [ ] Database on production server (Supabase/Neon)
- [ ] Backend on production (Railway/Fly.io)
- [ ] Frontend on production (Vercel)
- [ ] Real Paystack keys (not test)
- [ ] Real JWT_SECRET (64+ characters)
- [ ] HTTPS enabled everywhere
- [ ] Database backups enabled
- [ ] Monitoring configured
- [ ] Error logging setup
- [ ] Smart contract tested

---

**Happy coding!** 🎉 AgroConnect is now running locally. Next step: Deploy to production!
