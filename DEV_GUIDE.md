# AgroConnect Development Guide

## Quick Start

### Option 1: Using the Startup Script (Recommended)

```bash
cd /home/benjamin/Desktop/ALT
./dev-setup.sh
```

This script will:
- ✅ Check prerequisites (Node.js, npm)
- ✅ Start the backend server on port 3001
- ✅ Start the frontend server (port 3000, 3001, 3002, or 3003 - auto-selected)
- ✅ Verify both servers are healthy
- ✅ Display access URLs

The script will keep both servers running until you press `Ctrl+C`.

### Option 2: Manual Setup

#### Terminal 1 - Start Backend
```bash
cd /home/benjamin/Desktop/ALT/agroconnect-backend
npm run dev
```

The backend will start on `http://localhost:3001`

#### Terminal 2 - Start Frontend
```bash
cd /home/benjamin/Desktop/ALT/agroconnect-frontend
npm run dev
```

The frontend will start on `http://localhost:3000` (or next available port)

## Access the Application

- **Frontend**: http://localhost:3000 (or http://localhost:3003 if ports are in use)
- **Backend API**: http://localhost:3001
- **Backend Health Check**: http://localhost:3001/health

## Frontend Features (Improved UX)

### Registration Flow
- **Enhanced Form Validation**: Real-time field-level error messages
- **Better Error Handling**: Clear, user-friendly API error messages
- **Loading States**: Animated spinner during form submission
- **Network Error Detection**: Helpful message if backend isn't running
- **Duplicate Email Detection**: "This email is already registered" message
- **Password Mismatch Warning**: Instant feedback on password confirmation

### Login Flow
- Same UX improvements as registration
- Persistent session using localStorage
- Automatic redirect based on user role (FARMER → dashboard, BUYER → marketplace)

## API Configuration

### Frontend Configuration
Edit `agroconnect-frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_STACKS_NETWORK=testnet
```

### Backend Configuration
Edit `agroconnect-backend/.env`:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="agroconnect-super-secret-jwt-key-change-in-production-2026"
PORT=3001
NODE_ENV="development"
```

## Testing Registration

### Via Frontend (UI)
1. Go to http://localhost:3000/auth/register
2. Select role (Farmer or Buyer)
3. Fill in all fields
4. Click "Create Account"
5. You should be redirected to your dashboard

### Via API (curl)
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "farmer@example.com",
    "password": "password123",
    "role": "FARMER",
    "location": "Lagos, Nigeria",
    "farmName": "Green Valley Farm",
    "crops": ["Tomato", "Maize", "Cassava"]
  }'
```

Expected response:
```json
{
  "user": {
    "id": "ckm...",
    "email": "farmer@example.com",
    "role": "FARMER"
  },
  "token": "eyJhbGc..."
}
```

## Error Handling

The frontend now provides clear error messages for:

| Scenario | Message |
|----------|---------|
| Email already in use | "This email is already registered" |
| Invalid email format | "Please enter a valid email address" |
| Password too short | "Password must be at least 8 characters" |
| Passwords don't match | "Passwords do not match" |
| Network error | "Cannot connect to server. Is the backend running?" |
| Server error | "Server error. Please try again later." |
| Invalid input | "Invalid input. Please check your entries" |
| Missing required field | Field-specific error below the input |

## Troubleshooting

### Port Already in Use
If you see "Port 3000 is in use, trying 3001 instead..."

**Solution 1**: Kill stale processes
```bash
pkill -f "npm run dev"
pkill -f "ts-node-dev"
pkill -f "next dev"
```

**Solution 2**: Use a different port
```bash
PORT=3000 npm run dev  # in frontend directory
PORT=3002 npm run dev  # to use 3002 instead
```

### Backend Not Responding
If you see "Cannot connect to server. Is the backend running?"

1. Check if backend is running:
   ```bash
   curl http://localhost:3001/health
   ```

2. If not running, start it:
   ```bash
   cd agroconnect-backend
   npm run dev
   ```

3. Check logs for errors:
   ```bash
   tail -50 /tmp/agroconnect-backend.log
   ```

### Database Issues
If you see database-related errors:

1. Clear the database:
   ```bash
   rm agroconnect-backend/dev.db
   ```

2. Restart the backend - Prisma will recreate the database

### Frontend Build Issues
If you see TypeScript or build errors:

```bash
cd agroconnect-frontend
rm -rf .next node_modules
npm install
npm run dev
```

## Database

- **Type**: SQLite (for development)
- **Location**: `agroconnect-backend/dev.db`
- **ORM**: Prisma
- **Schema**: `agroconnect-backend/prisma/schema.prisma`

### Reset Database
```bash
cd agroconnect-backend
rm dev.db
npm run dev  # Prisma will recreate it
```

### Inspect Database
```bash
cd agroconnect-backend
npx prisma studio  # Opens web UI at http://localhost:5555
```

## Development Workflow

1. **Start servers** using `./dev-setup.sh`
2. **Make code changes** (both frontend and backend support hot-reload)
3. **Test in browser** at http://localhost:3000
4. **Check console logs** for errors
5. **Commit changes** when satisfied

### Hot Reload
- **Frontend**: Changes in `agroconnect-frontend/app` and `agroconnect-frontend/lib` are auto-reloaded
- **Backend**: Changes in `agroconnect-backend/src` are auto-reloaded (using ts-node-dev)

## Code Structure

```
├── agroconnect-backend/
│   ├── src/
│   │   ├── index.ts                 # Express server entry
│   │   ├── config/database.ts       # Prisma client
│   │   ├── controllers/authController.ts  # Auth logic
│   │   ├── routes/authRoutes.ts    # Auth endpoints
│   │   ├── middleware/auth.ts      # JWT middleware
│   │   └── utils/                  # Helpers (jwt, password)
│   ├── prisma/schema.prisma        # Database schema
│   └── package.json
│
└── agroconnect-frontend/
    ├── app/
    │   ├── page.tsx                # Landing page
    │   ├── auth/register/page.tsx  # Registration page (improved)
    │   ├── auth/login/page.tsx     # Login page (improved)
    │   ├── farmer/dashboard/       # Farmer pages
    │   └── buyer/                  # Buyer pages
    ├── lib/
    │   ├── api.ts                  # API client (improved)
    │   ├── auth.ts                 # Auth store (improved)
    │   └── types.ts                # TypeScript types
    └── package.json
```

## Recent Improvements (This Session)

### API Client (`lib/api.ts`)
- ✨ SSR-safe initialization with `getApiBaseUrl()` function
- ✨ Response interceptor to handle auth errors
- ✨ 10-second timeout on requests
- ✨ New `getErrorMessage()` helper for consistent error handling
- ✨ Support for custom `ApiErrorResponse` type

### Auth Store (`lib/auth.ts`)
- ✨ Enhanced error messages using `getErrorMessage()`
- ✨ Better error classification (409, 401, 400, 500, network)
- ✨ Clearer error display to users

### Registration Page (`app/auth/register/page.tsx`)
- ✨ Field-level validation with inline error messages
- ✨ Loading spinner during submission
- ✨ Real-time error clearing on input change
- ✨ Enhanced UI with better color contrast
- ✨ Form validation before submission
- ✨ Better accessibility with proper labels and ARIA attributes

### Login Page (`app/auth/login/page.tsx`)
- ✨ Consistent UX improvements as registration
- ✨ Field-level validation
- ✨ Loading spinner
- ✨ Enhanced error display

## Next Steps

Recommended future improvements:
1. Add forgot password flow
2. Add email verification
3. Add 2FA (two-factor authentication)
4. Add product image upload
5. Add payment gateway integration UI
6. Add order tracking
7. Add notifications/messaging system
8. Add admin dashboard
9. Add export to PDF functionality
10. Add mobile app (React Native)

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

## Support

For issues or questions:
1. Check the logs: `/tmp/agroconnect-backend.log`, `/tmp/agroconnect-frontend.log`
2. Review this guide
3. Check TypeScript compilation: `npx tsc --noEmit`
4. Restart the servers: Kill processes and run `./dev-setup.sh` again
