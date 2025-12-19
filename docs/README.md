# Kill-Switch Risk Engine - Documentation

## Overview

The Kill-Switch Risk Engine is a scalable monorepo application designed to monitor trading positions, calculate Mark-to-Market (MTM), evaluate risk thresholds, and automatically trigger kill switches when loss limits are breached.

## Architecture

### Monorepo Structure

```
dhan/
├── apps/
│   ├── backend/          # Express.js API server
│   ├── frontend/          # Next.js 16 + shadcn/ui
│   └── docs/              # Documentation site
├── packages/
│   ├── shared/            # Shared types, utilities
│   └── config/            # Shared configs (ESLint, TypeScript, etc.)
```

### Tech Stack

**Backend:**
- Node.js + Express.js
- PostgreSQL (database)
- Redis (caching, distributed locks)
- Prisma ORM
- TypeScript
- JWT authentication

**Frontend:**
- Next.js 16 (App Router)
- shadcn/ui components
- Tailwind CSS
- TypeScript
- React Query

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker and Docker Compose (for local development)
- PostgreSQL 16+ (if not using Docker)
- Redis 7+ (if not using Docker)

### Installation

1. **Clone the repository** (if applicable)

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**

   Backend (`apps/backend/.env`):
   ```env
   PORT=3001
   NODE_ENV=development
   DATABASE_URL="postgresql://user:password@localhost:5432/killswitch?schema=public"
   REDIS_URL="redis://localhost:6379"
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   JWT_EXPIRES_IN="7d"
   ENCRYPTION_KEY="your-32-character-encryption-key!!"
   FRONTEND_URL="http://localhost:3000"
   DHAN_API_BASE_URL="https://api.dhan.co"
   DHAN_API_VERSION="/v2"
   ```

   Frontend (`apps/frontend/.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

4. **Start Docker services:**
   ```bash
   docker-compose up -d
   ```

5. **Run database migrations:**
   ```bash
  docker exec -it killswitch-backend pnpm --filter backend prisma:migrate
   ```

6. **Start development servers:**
   ```bash
   # Start both backend and frontend
   pnpm dev

   # Or start individually
   pnpm dev:backend
   pnpm dev:frontend
   ```

## Data Flow Example: Risk Monitoring

```
1. Worker (monitor.ts) runs every 2 seconds
   ↓
2. Fetches users with killSwitchEnabled=true
   ↓
3. For each user:
   - Gets Dhan client (decrypts token)
   - Fetches positions from Dhan API
   - Calculates MTM (mtm-calculator)
   - Evaluates risk (risk-rules)
   ↓
4. Updates DailyRiskState in database
   ↓
5. If riskStatus === 'TRIGGER':
   - Calls kill-executor
   - Acquires Redis lock
   - Closes all positions
   - Activates Dhan kill switch
   - Logs KillEvent
```


## API Documentation

### DHAN API Documentation
[DHAN v2 API Reference](https://dhanhq.co/docs/v2/)

---

### Authentication

#### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "dhanToken": "optional-dhan-token",
  "dhanClientId": "optional-dhan-client-id"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "userId": "uuid",
    "email": "user@example.com",
    "dhanClientId": "client-id",
    "riskThreshold": 2.0
  }
}
```

#### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "dhanToken": "optional-dhan-token",
  "dhanClientId": "optional-dhan-client-id"
}
```

#### POST /api/auth/logout
Logout (clears JWT cookie).

### User

#### GET /api/user/profile
Get current user profile (requires authentication).

**Response:**
```json
{
  "success": true,
  "user": {
    "userId": "uuid",
    "email": "user@example.com",
    "dhanClientId": "client-id",
    "riskThreshold": 2.0,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### PUT /api/user/settings
Update user settings (requires authentication).

**Request Body:**
```json
{
  "riskThreshold": 2.5,
  "dhanToken": "new-token",
  "dhanClientId": "new-client-id"
}
```

### Positions

#### GET /api/positions
Get current trading positions (requires authentication).

**Response:**
```json
{
  "success": true,
  "positions": [
    {
      "dhanClientId": "client-id",
      "tradingSymbol": "RELIANCE",
      "securityId": "12345",
      "positionType": "LONG",
      "netQty": 10,
      "costPrice": 2500.0,
      "unrealizedProfit": 500.0
    }
  ]
}
```

### Risk

#### GET /api/risk/status
Get current risk status (requires authentication).

**Response:**
```json
{
  "success": true,
  "risk": {
    "mtm": -500.0,
    "invested": 25000.0,
    "lossPercent": 2.0,
    "riskStatus": "SAFE",
    "threshold": 2.0,
    "killStatus": false
  }
}
```

#### GET /api/risk/events
Get kill switch events history (requires authentication).

**Query Parameters:**
- `limit` (optional): Number of events to return (default: 50)
- `offset` (optional): Offset for pagination (default: 0)

**Response:**
```json
{
  "success": true,
  "events": [
    {
      "id": "uuid",
      "triggerMtm": -500.0,
      "triggerLossPercent": 2.0,
      "executionTime": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Balance

#### GET /api/balance
Get account balance (requires authentication).

**Response:**
```json
{
  "success": true,
  "balance": {
    "availableBalance": 100000.0,
    "sodLimit": 100000.0,
    "utilizedAmount": 25000.0,
    "withdrawableBalance": 75000.0,
    "collateralAmount": 0.0,
    "receiveableAmount": 0.0,
    "blockedPayoutAmount": 0.0
  }
}
```

## Database Schema

### Users Table
- `user_id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `password_hash` (VARCHAR)
- `dhan_client_id` (VARCHAR, Nullable)
- `access_token_encrypted` (TEXT, Nullable)
- `risk_threshold` (DECIMAL, Default: 2.00)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Daily Risk State Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `trading_date` (DATE)
- `mtm` (DECIMAL)
- `invested` (DECIMAL)
- `loss_percent` (DECIMAL)
- `kill_status` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- Unique constraint on (`user_id`, `trading_date`)

### Kill Events Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `trigger_mtm` (DECIMAL, Nullable)
- `trigger_loss_percent` (DECIMAL, Nullable)
- `execution_time` (TIMESTAMP)
- `created_at` (TIMESTAMP)

## Deployment

### Docker Deployment

1. **Build and start services:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Set environment variables** in `docker-compose.prod.yml` or use a `.env` file.

### Manual Deployment

1. **Build all packages:**
   ```bash
   pnpm build
   ```

2. **Start backend:**
   ```bash
   cd apps/backend
   pnpm start
   ```

3. **Start frontend:**
   ```bash
   cd apps/frontend
   pnpm start
   ```

## Monitoring

The backend includes a background monitoring worker that:
- Polls user positions every 2 seconds
- Calculates MTM and loss percentage
- Evaluates risk against thresholds
- Automatically triggers kill switches when thresholds are breached
- Uses distributed locks to prevent duplicate executions

## Security Considerations

- Dhan access tokens are encrypted at rest using AES-256-GCM
- JWT tokens are stored in httpOnly cookies
- Passwords are hashed using bcrypt
- SQL injection prevention via Prisma ORM
- CORS configured for frontend origin only
- Rate limiting recommended for production

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running and accessible
- Check `DATABASE_URL` environment variable
- Verify database credentials

### Redis Connection Issues
- Ensure Redis is running and accessible
- Check `REDIS_URL` environment variable

### Frontend API Errors
- Verify `NEXT_PUBLIC_API_URL` matches backend URL
- Check CORS configuration in backend
- Ensure backend is running

## License

Private

<!-- sudo chown -R $USER:$USER apps/frontend/node_modules -->
<!-- rm -rf apps/frontend/node_modules && pnpm install -->
<!-- pnpm dev:frontend -->