# Fillo - Agricultural Marketplace Platform

A production-ready platform connecting farmers with buyers for agricultural produce trading, featuring secure payments via bank transfers and blockchain (Stacks).

## Project Overview

**Fillo** is a comprehensive agricultural marketplace that enables:
- ✅ Real farmers to list authentic agricultural products
- ✅ Real buyers (companies) to purchase agricultural goods
- ✅ Secure payment methods (traditional + blockchain)
- ✅ Smart contract escrow for cryptocurrency payments
- ✅ Role-based access control and management
- ✅ Real-time order tracking
- ✅ Production-ready infrastructure

## Tech Stack

### Frontend
- **Framework:** Next.js 14 (React + TypeScript)
- **State Management:** Zustand
- **Styling:** Tailwind CSS
- **API Communication:** Axios
- **Blockchain:** Stacks.js for STX payments

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js + TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT (JSON Web Tokens)
- **Password:** bcryptjs hashing

### Blockchain
- **Network:** Stacks (STX)
- **Smart Contract Language:** Clarity
- **Escrow Functionality:** True decentralized payments
- **Wallet Integration:** Leather/Xverse

### Payment Gateways
- **Primary:** Paystack
- **Alternative:** Flutterwave
- **Both:** Support real bank transfers

### Hosting
- **Frontend:** Vercel
- **Backend:** Railway or Fly.io
- **Database:** Supabase or Neon (PostgreSQL)

## Project Structure

```
agroconnect/
├── agroconnect-backend/          # Express API
│   ├── src/
│   │   ├── controllers/          # Business logic
│   │   ├── routes/               # API endpoints
│   │   ├── middleware/           # Auth & error handling
│   │   ├── utils/                # JWT, password hashing
│   │   ├── config/               # Database config
│   │   └── index.ts              # Main server file
│   ├── prisma/
│   │   └── schema.prisma         # Database schema
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── agroconnect-frontend/         # Next.js app
│   ├── app/
│   │   ├── auth/                 # Login/Register
│   │   ├── farmer/               # Farmer dashboard
│   │   ├── buyer/                # Marketplace & orders
│   │   ├── page.tsx              # Homepage
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css
│   ├── lib/
│   │   ├── api.ts                # API client
│   │   ├── auth.ts               # Auth store
│   │   └── types.ts              # TypeScript types
│   ├── components/               # Reusable components
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   └── .env.example
│
├── smart-contracts/
│   ├── agroconnect-escrow.clar   # Smart contract
│   └── DEPLOYMENT_GUIDE.md       # Stacks deployment
│
├── DEPLOYMENT.md                 # Production deployment
└── README.md                      # This file
```

## Features

### 1. User Authentication
- Email/password registration
- Role-based (Farmer/Buyer/Admin)
- JWT token-based sessions
- Secure password hashing (bcryptjs)

### 2. Farmer Features
- Add products with details (name, category, quantity, price)
- Manage product listings
- View incoming orders
- Track payment status
- **💰 Track earnings in real-time** (NEW)
- **📊 View detailed statistics and trends** (NEW)
- **💳 Manage withdrawals** (NEW)
- Receive funds via bank or blockchain

### 3. Buyer Features
- Browse agricultural products
- Search and filter by category
- Place orders with quantities
- Choose payment method
- Track order status
- Confirm delivery (releases payment)

### 4. Payment System (Dual)

#### Bank Transfer (Paystack)
```
Buyer → Paystack API → Bank Account → Farmer
```
- Real-time payment verification
- Webhook-based confirmation
- Multiple payment methods (card, bank transfer)

#### Blockchain (Stacks STX)
```
Buyer → Smart Contract Escrow → Release/Refund → Farmer
```
- STX locked in smart contract
- 30-day timeout for refunds
- Buyer must confirm delivery to release funds
- Decentralized, trustless payment

### 5. Smart Contract (Clarity)
- `create-escrow(order-id, farmer, amount)` - Lock funds
- `release-to-farmer(order-id)` - Release to farmer
- `refund-buyer(order-id)` - Refund after timeout
- `file-dispute(order-id, reason)` - Dispute mechanism

### 6. Database Models
- **User:** Email, role, password
- **FarmerProfile:** Farm name, location, crops
- **Earning:** 💰 NEW - Track farmer earnings (amount, status, date)
- **BuyerProfile:** Company name, location
- **Product:** Name, category, quantity, price
- **Order:** Buyer, product, quantity, status
- **Payment:** Order, type (bank/crypto), status, reference

### 7. Earnings Tracking System ✨ NEW
- **Real-time earnings dashboard** for farmers
- **Statistics overview:**
  - Total earnings across all sales
  - Available balance to withdraw
  - Pending earnings awaiting confirmation
  - Total quantity sold
- **Monthly performance breakdown** - Track trends over time
- **Withdrawal system** - Safe, validated fund withdrawals
- **Transaction history** - Complete sales record with status
- **API endpoints** - Full REST API for earnings data

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login

### Products
- `POST /api/products` - Create (farmers only)
- `GET /api/products` - List all
- `GET /api/products/:id` - Get details
- `PUT /api/products/:id` - Update (farmers only)
- `DELETE /api/products/:id` - Delete (farmers only)
- `GET /api/products/farmer/my-products` - My products

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - My orders
- `GET /api/orders/:id` - Order details
- `PUT /api/orders/:id/status` - Update status
- `GET /api/orders/farmer/my-orders` - Farmer's received orders

### Payments
- `POST /api/payments/paystack/initiate` - Start bank payment
- `POST /api/payments/paystack/webhook` - Paystack callback
- `POST /api/payments/stacks/initiate` - Start blockchain payment
- `POST /api/payments/stacks/verify` - Verify transaction
- `GET /api/payments/:paymentId` - Payment status

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (local or cloud)
- Git

### Backend Setup

```bash
cd agroconnect-backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your database URL and credentials

# Initialize database
npx prisma migrate deploy
npx prisma generate

# Start development server
npm run dev
```

Server runs on `http://localhost:3000`

### Frontend Setup

```bash
cd agroconnect-frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Update NEXT_PUBLIC_API_URL to your backend URL

# Start development server
npm run dev
```

Frontend runs on `http://localhost:3000` (different port if backend is running)

### Database Setup (First Time)

```bash
# In backend directory
npx prisma migrate dev --name init
```

This creates all tables from the Prisma schema.

### Smart Contract Setup

See [smart-contracts/DEPLOYMENT_GUIDE.md](smart-contracts/DEPLOYMENT_GUIDE.md)

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/agroconnect
JWT_SECRET=your-very-secure-secret-change-in-production
JWT_EXPIRY=24h
PORT=3000
NODE_ENV=development
PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_SECRET_KEY=sk_test_...
STACKS_NETWORK=testnet
STACKS_API_URL=https://api.testnet.hiro.so
STACKS_CONTRACT_ADDRESS=ST1234...
STACKS_CONTRACT_NAME=agroconnect_escrow
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_STACKS_NETWORK=testnet
NEXT_PUBLIC_STACKS_API_URL=https://api.testnet.hiro.so
```

## Usage Examples

### Register as Farmer
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "farmer@example.com",
    "password": "SecurePassword123",
    "role": "FARMER",
    "farmName": "Green Valley Farm",
    "location": "Abuja, Nigeria",
    "crops": ["Tomatoes", "Maize", "Cassava"]
  }'
```

### Add Product (as Farmer)
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Fresh Tomatoes",
    "category": "Vegetables",
    "quantity": 500,
    "unit": "kg",
    "pricePerUnit": 150,
    "description": "Freshly harvested tomatoes"
  }'
```

### Get All Products
```bash
curl http://localhost:3000/api/products
```

### Create Order (as Buyer)
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "productId": "product-uuid",
    "quantity": 100,
    "notes": "Delivery to Lagos office"
  }'
```

## Testing Payment Flows

### Bank Transfer (Paystack)
1. Create order
2. Go to checkout
3. Select "Bank Transfer"
4. Click "Proceed to Payment"
5. Use Paystack test cards:
   - Card: `4084084084084081`
   - CVV: Any 3 digits
   - Expiry: Any future date

### Blockchain (Stacks)
1. Install Xverse or Leather wallet
2. Get testnet STX from [faucet](https://testnet-faucet.alexgo.io/)
3. Create order
4. Select "Stacks Crypto"
5. Sign transaction in wallet
6. Copy TX hash and verify

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete production deployment guide covering:
- Database setup (Supabase/Neon)
- Backend deployment (Railway/Fly.io)
- Frontend deployment (Vercel)
- Payment gateway configuration
- Smart contract deployment
- Production checklist

## Security Considerations

✅ **Implemented:**
- JWT-based authentication
- Bcrypt password hashing
- Role-based access control
- Input validation with Zod
- CORS configuration
- Prepared database queries (Prisma)
- Environment variable secrets
- HTTPS-ready configuration

⚠️ **Production Requirements:**
- Enable HTTPS everywhere
- Use strong JWT_SECRET (64+ characters)
- Set real Paystack/Flutterwave keys
- Enable rate limiting
- Add logging and monitoring
- Regular security audits
- Database backups

## Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED
```
- Ensure PostgreSQL is running
- Check DATABASE_URL is correct
- Verify database exists

### JWT Token Error
```
Error: Invalid or expired token
```
- Check JWT_SECRET matches backend
- Verify token is in Authorization header
- Token may have expired (24h default)

### Paystack Payment Failed
- Verify PAYSTACK_SECRET_KEY is correct (sk_test_ or sk_live_)
- Check webhook configuration
- Use test keys for development

### Stacks Transaction Failed
- Ensure wallet is on correct network (testnet/mainnet)
- Check account has sufficient STX
- Verify contract is deployed

## Contributing

This is a production codebase. All changes should:
1. Maintain real data integrity
2. Include proper error handling
3. Use TypeScript for type safety
4. Follow API design patterns
5. Test with real payment systems

## License

MIT

## Support

For deployment and technical issues, refer to:
- [Express.js Documentation](https://expressjs.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Stacks Documentation](https://docs.stacks.co)
- [Paystack Documentation](https://paystack.com/docs)

## Project Status

✅ **Fully Functional**
- Core marketplace features complete
- Payment integrations ready (Paystack + Stacks)
- Smart contract escrow operational
- Production-ready codebase
- Deployment guides provided

**Not Included (To Be Implemented):**
- Email notifications (could use SendGrid)
- Admin dashboard
- Dispute resolution system
- Review/rating system
- Advanced analytics
- Automated testing suite

---

**Fillo** - Empowering farmers and buyers through secure digital commerce.
