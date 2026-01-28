# 💰 Earnings System - Quick Reference

## Access Points

### Farmer Dashboard
```
URL: http://localhost:3003/farmer/dashboard
Button: "💰 View Earnings" (top right)
```

### Earnings Page
```
URL: http://localhost:3003/farmer/earnings
Direct access to full earnings dashboard
```

---

## Key Features at a Glance

### 4-Card Dashboard
| Card | Value | Color |
|------|-------|-------|
| Total Earnings | ₦50,000 | Blue |
| Available to Withdraw | ₦35,000 | Green |
| Pending Earnings | ₦10,000 | Yellow |
| Total Quantity Sold | 250 kg | Purple |

### Withdrawal System
- Enter amount to withdraw
- Maximum: Available balance
- Status: Instant validation
- Result: Earnings marked as WITHDRAWN

### Monthly Breakdown Table
Shows earnings trends by month with transaction count

### Earnings History
Complete list of all sales with:
- Transaction date
- Order ID
- Amount earned
- Quantity sold
- Current status

---

## API Endpoints

### Get Earnings
```bash
GET /api/earnings
Header: Authorization: Bearer <token>
```

### Get Stats
```bash
GET /api/earnings/stats
Header: Authorization: Bearer <token>
```

### Get Monthly Data
```bash
GET /api/earnings/monthly
Header: Authorization: Bearer <token>
```

### Withdraw
```bash
POST /api/earnings/withdraw
Header: Authorization: Bearer <token>
Body: { "amount": 35000 }
```

---

## Integration Points

### When Order Completes
```typescript
// Automatically create earning
await prisma.earning.create({
  data: {
    farmerId: product.farmerId,
    orderId: order.id,
    productId: product.id,
    amount: order.totalPrice,
    quantitySold: order.quantity,
    status: 'COMPLETED'
  }
});
```

### When Payment Confirmed
```typescript
// Update earning status
await prisma.earning.updateMany({
  where: { orderId: paymentId },
  data: { status: 'COMPLETED' }
});
```

---

## Database Schema

```prisma
model Earning {
  id            String     @id @default(cuid())
  farmerId      String
  orderId       String
  productId     String
  amount        Float
  quantitySold  Float
  status        String     @default("PENDING")
  description   String?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  farmer User @relation(fields: [farmerId], references: [id])
}
```

---

## Status Flow

```
Order Created
     ↓
Order Paid → Earning Created (PENDING)
     ↓
Payment Confirmed → Earning Status = COMPLETED
     ↓
Farmer Withdraws → Earning Status = WITHDRAWN
```

---

## Files Modified

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Added Earning model |
| `src/index.ts` | Added earnings route |
| `src/controllers/earningController.ts` | NEW - All earnings logic |
| `src/routes/earningRoutes.ts` | NEW - Earnings endpoints |
| `lib/api.ts` | Added 4 new methods |
| `app/farmer/earnings/page.tsx` | NEW - Earnings UI |
| `app/farmer/dashboard/page.tsx` | Added earnings link |

---

## Testing Checklist

- [ ] View earnings dashboard
- [ ] Check total earnings calculation
- [ ] View monthly breakdown
- [ ] Attempt withdrawal
- [ ] Verify withdrawal validation
- [ ] Check status updates
- [ ] Verify API endpoints
- [ ] Check error handling

---

## Troubleshooting

**Problem**: Earnings not showing
- Solution: Check if orders are marked as COMPLETED
- Check: Database has Earning records with correct farmerId

**Problem**: Withdrawal fails
- Solution: Verify available balance > requested amount
- Check: API returns proper error message

**Problem**: API error 401
- Solution: Ensure token is included in Authorization header
- Check: Token is valid and not expired

**Problem**: Database migration issues
```bash
# Regenerate Prisma client
npx prisma generate

# Check schema
npx prisma validate
```

---

## Quick Commands

```bash
# Start development
npm run dev

# Generate Prisma
cd agroconnect-backend && npx prisma generate

# View schema
npx prisma studio

# Check types
tsc --noEmit

# Build
npm run build
```

---

**Status**: ✅ Ready to Use
**Last Updated**: January 28, 2026
