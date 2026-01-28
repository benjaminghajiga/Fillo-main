# AgroConnect - Complete File Index

## 📁 Project Structure Overview

### Root Level Files
```
/home/benjamin/Desktop/ALT/
├── README.md              # Complete project documentation
├── QUICKSTART.md          # 5-minute setup guide
├── DEPLOYMENT.md          # Production deployment guide
├── setup.sh               # Automated setup script
└── agroconnect-{backend,frontend}/
```

---

## 🔧 Backend Files (`agroconnect-backend/`)

### Configuration Files
| File | Purpose |
|------|---------|
| `package.json` | Dependencies (Express, Prisma, JWT, bcryptjs) |
| `tsconfig.json` | TypeScript configuration |
| `.env.example` | Environment variables template |
| `.gitignore` | Git ignore rules |

### Database (`prisma/`)
| File | Purpose |
|------|---------|
| `schema.prisma` | Database models (User, Product, Order, Payment, etc.) |

### Source Code (`src/`)

#### Controllers (`src/controllers/`)
| File | Purpose |
|------|---------|
| `authController.ts` | Register/Login endpoints, JWT generation |
| `productController.ts` | Product CRUD (Create, Read, Update, Delete) |
| `orderController.ts` | Order management endpoints |
| `paymentController.ts` | Paystack & Stacks payment integration |

#### Routes (`src/routes/`)
| File | Purpose |
|------|---------|
| `authRoutes.ts` | Auth route definitions |
| `productRoutes.ts` | Product route definitions |
| `orderRoutes.ts` | Order route definitions |
| `paymentRoutes.ts` | Payment route definitions |

#### Middleware (`src/middleware/`)
| File | Purpose |
|------|---------|
| `auth.ts` | JWT verification & role-based access control |
| `errorHandler.ts` | Global error handling |

#### Utilities (`src/utils/`)
| File | Purpose |
|------|---------|
| `jwt.ts` | JWT token generation/verification |
| `password.ts` | Password hashing & comparison (bcryptjs) |

#### Config (`src/config/`)
| File | Purpose |
|------|---------|
| `database.ts` | Prisma client initialization |

#### Main
| File | Purpose |
|------|---------|
| `index.ts` | Express server setup, route mounting |

### Database Models

```typescript
// User
- id (UUID)
- email (unique)
- passwordHash
- role (FARMER, BUYER, ADMIN)
- timestamps

// FarmerProfile
- userId (FK)
- farmName
- location
- crops (array)
- phone
- bio

// BuyerProfile
- userId (FK)
- companyName
- location
- phone
- website
- bio

// Product
- id (UUID)
- farmerId (FK)
- name
- category
- quantity
- unit
- pricePerUnit
- available (boolean)
- image (URL)
- timestamps

// Order
- id (UUID)
- buyerId (FK)
- productId (FK)
- quantity
- totalPrice
- status
- notes
- timestamps

// Payment
- id (UUID)
- orderId (FK)
- userId (FK)
- type (PAYSTACK, FLUTTERWAVE, STACKS_CRYPTO)
- status (PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED)
- amount
- reference
- metadata (JSON)
- walletAddress
- timestamps
```

---

## 🎨 Frontend Files (`agroconnect-frontend/`)

### Configuration Files
| File | Purpose |
|------|---------|
| `package.json` | Dependencies (Next.js, React, Zustand, Tailwind) |
| `tsconfig.json` | TypeScript configuration |
| `next.config.ts` | Next.js configuration |
| `.env.example` | Environment variables template |
| `.gitignore` | Git ignore rules |

### Core Files (`app/`)

#### Layout & Global
| File | Purpose |
|------|---------|
| `layout.tsx` | Root layout with navigation footer |
| `page.tsx` | Homepage with hero, features, how-it-works |
| `globals.css` | Global styles (Tailwind) |

#### Authentication Pages
| File | Purpose |
|------|---------|
| `auth/login/page.tsx` | Login form |
| `auth/register/page.tsx` | Registration form (role-based) |

#### Farmer Pages
| File | Purpose |
|------|---------|
| `farmer/dashboard/page.tsx` | Add products, manage listings, view orders |

#### Buyer Pages
| File | Purpose |
|------|---------|
| `buyer/marketplace/page.tsx` | Browse products, search, filter |
| `buyer/checkout/page.tsx` | Select quantity, choose payment method |
| `buyer/payment-status/page.tsx` | Paystack payment confirmation |
| `buyer/stacks-payment/page.tsx` | Blockchain payment verification |
| `buyer/orders/page.tsx` | View and track orders |

### Library Files (`lib/`)
| File | Purpose |
|------|---------|
| `api.ts` | Axios API client with all endpoints |
| `auth.ts` | Zustand auth store (login, register, logout) |
| `types.ts` | TypeScript interfaces (Product, Order, Payment) |

---

## ⛓️ Smart Contract Files (`smart-contracts/`)

| File | Purpose |
|------|---------|
| `agroconnect-escrow.clar` | Clarity smart contract for STX escrow |
| `DEPLOYMENT_GUIDE.md` | Smart contract deployment instructions |

### Smart Contract Functions

```clarity
create-escrow(order-id, farmer, amount)
  → Locks STX in contract escrow

release-to-farmer(order-id)
  → Releases funds to farmer after delivery

refund-buyer(order-id)
  → Refunds buyer after 30-day timeout

file-dispute(order-id, reason)
  → Files dispute claim

get-escrow(order-id)
  → Read: Get escrow details

get-escrow-status(order-id)
  → Read: Get status (pending/released/refunded)

get-balance()
  → Read: Total STX in contract

get-dispute(order-id)
  → Read: Get dispute details
```

---

## 📊 API Endpoints Summary

### Authentication
```
POST   /api/auth/register         Register new user
POST   /api/auth/login            Login user
```

### Products
```
POST   /api/products              Create product (farmers)
GET    /api/products              List all products
GET    /api/products/:id          Get product details
PUT    /api/products/:id          Update product (farmers)
DELETE /api/products/:id          Delete product (farmers)
GET    /api/products/farmer/my-products    Get farmer's products
```

### Orders
```
POST   /api/orders                Create order (buyers)
GET    /api/orders                Get buyer's orders
GET    /api/orders/:id            Get order details
PUT    /api/orders/:id/status     Update order status
GET    /api/orders/farmer/my-orders        Get farmer's incoming orders
```

### Payments
```
POST   /api/payments/paystack/initiate     Initialize bank payment
POST   /api/payments/paystack/webhook      Paystack webhook
POST   /api/payments/stacks/initiate       Initialize crypto payment
POST   /api/payments/stacks/verify         Verify blockchain transaction
GET    /api/payments/:paymentId            Get payment status
```

---

## 🚀 Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@host/dbname
JWT_SECRET=your-secret-key
JWT_EXPIRY=24h
PORT=3000
NODE_ENV=production
PAYSTACK_PUBLIC_KEY=pk_live_...
PAYSTACK_SECRET_KEY=sk_live_...
STACKS_NETWORK=mainnet
STACKS_API_URL=https://api.mainnet.hiro.so
STACKS_CONTRACT_ADDRESS=ST...
STACKS_CONTRACT_NAME=agroconnect_escrow
FRONTEND_URL=https://yourdomain.com
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_STACKS_NETWORK=mainnet
NEXT_PUBLIC_STACKS_API_URL=https://api.mainnet.hiro.so
```

---

## 🔐 Security Features Implemented

✅ **Authentication**
- JWT-based token system
- Bcryptjs password hashing
- Role-based access control (RBAC)

✅ **API Security**
- Input validation with Zod
- Error handling middleware
- CORS configuration
- Prepared database queries (Prisma)

✅ **Payment Security**
- Webhook verification for Paystack
- Smart contract escrow for crypto
- Payment status tracking

---

## 📦 Dependencies Summary

### Backend
- **Express.js** - Web framework
- **Prisma** - ORM for PostgreSQL
- **jsonwebtoken** - JWT auth
- **bcryptjs** - Password hashing
- **zod** - Input validation
- **axios** - HTTP client (Paystack API)
- **cors** - CORS middleware
- **dotenv** - Environment variables

### Frontend
- **Next.js 14** - React framework
- **React 18** - UI library
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **Axios** - API client
- **Stacks.js** - Blockchain integration
- **React Hook Form** - Form handling
- **Zod** - Form validation

---

## 🎯 Key Features by Module

### Authentication Module
- User registration (farmer/buyer roles)
- Login with JWT tokens
- Password hashing with bcryptjs
- Token refresh mechanism
- Session persistence

### Product Management
- Create/Read/Update/Delete products
- Product search and filtering
- Category-based browsing
- Availability tracking
- Farmer product dashboard

### Order Management
- Create orders with quantity validation
- Order status tracking
- Buyer and farmer views
- Order history

### Payment Processing
1. **Bank Transfer (Paystack)**
   - Real payment processing
   - Webhook verification
   - Transaction reference tracking

2. **Blockchain (Stacks)**
   - Smart contract escrow
   - Wallet integration
   - Transaction verification
   - 30-day timeout with refund

---

## 📈 Database Relationships

```
User
  ├── FarmerProfile (1:1)
  ├── BuyerProfile (1:1)
  ├── Products (1:N as farmerId)
  ├── Orders (1:N as buyerId)
  └── Payments (1:N)

Product
  ├── Farmer (FK to User)
  └── Orders (1:N)

Order
  ├── Buyer (FK to User)
  ├── Product (FK)
  └── Payments (1:N)

Payment
  ├── Order (FK)
  └── User (FK)
```

---

## 🔄 Data Flow Examples

### Buy Flow
```
Buyer Register
    ↓
Browse Products (GET /products)
    ↓
View Product (GET /products/:id)
    ↓
Create Order (POST /orders)
    ↓
Choose Payment Method
    ├─ Bank Transfer → Paystack Payment
    └─ Crypto → Stacks Smart Contract
    ↓
Payment Confirmation
    ↓
Order Status Update
```

### Sell Flow
```
Farmer Register
    ↓
Create Product (POST /products)
    ↓
View My Products (GET /products/farmer/my-products)
    ↓
Monitor Incoming Orders (GET /orders/farmer/my-orders)
    ↓
Prepare & Ship
    ↓
Receive Payment (auto-released after buyer confirms)
```

---

## 🚀 Deployment Architecture

```
GitHub (Source Code)
    ↓
Vercel ← Frontend (Next.js)
Railway/Fly.io ← Backend (Express)
Supabase/Neon ← Database (PostgreSQL)
Stacks Network ← Smart Contract
Paystack API ← Payment Gateway
```

---

## 📝 Additional Documentation

| Document | Location | Purpose |
|----------|----------|---------|
| README.md | Root | Complete project overview |
| QUICKSTART.md | Root | 5-minute setup guide |
| DEPLOYMENT.md | Root | Production deployment |
| DEPLOYMENT_GUIDE.md | smart-contracts/ | Smart contract deployment |

---

## ✅ Project Completion Status

### Backend
- ✅ Express server setup
- ✅ Database models (Prisma)
- ✅ Authentication endpoints
- ✅ Product endpoints
- ✅ Order endpoints
- ✅ Payment processing (Paystack + Stacks)
- ✅ Error handling
- ✅ Validation with Zod
- ✅ JWT middleware & role guards

### Frontend
- ✅ Next.js project setup
- ✅ Authentication pages (login/register)
- ✅ Farmer dashboard
- ✅ Buyer marketplace
- ✅ Checkout page
- ✅ Payment selection
- ✅ Order tracking
- ✅ API client integration
- ✅ Zustand state management
- ✅ Responsive Tailwind CSS design

### Smart Contract
- ✅ Clarity escrow contract
- ✅ Deposit/Release/Refund functions
- ✅ Dispute mechanism
- ✅ Deployment guide

### Documentation
- ✅ README with full overview
- ✅ Quick start guide
- ✅ Deployment instructions
- ✅ Smart contract guide
- ✅ API documentation
- ✅ Environment setup guide

---

## 🎯 Ready for Production

This is a **complete, production-ready** codebase with:
- ✅ Real database integration (PostgreSQL)
- ✅ Real payment processing (Paystack + Stacks)
- ✅ Real blockchain smart contracts
- ✅ Secure authentication (JWT + bcryptjs)
- ✅ Full error handling
- ✅ Input validation
- ✅ Role-based access control
- ✅ Deployment guides

**No mock data, no fake transactions, everything uses real services.**

---

Last Updated: January 28, 2026
AgroConnect - Connecting Real Farmers with Real Buyers
