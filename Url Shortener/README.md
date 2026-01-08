# URL Shortener - Linkly

A production-ready, full-featured URL Shortener with authentication, real-time analytics, QR codes, and a sleek dark UI. Built with Node.js, TypeScript, React, PostgreSQL, and Redis.

## 🌟 Features

### Core Features
- ✅ **URL Shortening** - Base62 encoded 7-character codes (3.5T unique URLs)
- ✅ **Fast Redirects** - Redis cache-aside pattern for sub-millisecond lookups
- ✅ **Smart Deduplication** - Same long URL returns same short URL
- ✅ **Rate Limiting** - Token bucket algorithm (10 requests/minute)
- ✅ **Real-Time Click Tracking** - Live analytics refreshed every 5 seconds
- ✅ **QR Code Generation** - Instant QR codes for all shortened URLs
- ✅ **URL Expiration** - Optional TTL for short URLs

### Authentication System
- 🔐 **User Registration** - Secure signup with validation
- 🔐 **Login System** - Session-based authentication
- 🔐 **Guest Mode** - Try 5 free URLs before signup
- 🔐 **Unlimited URLs** - Registered users get unlimited shortening

### Professional Dark UI
- 🎨 **Modern Dark Theme** - Sleek, professional design inspired by top URL shorteners
- 🎨 **Responsive Design** - Works perfectly on all devices
- 🎨 **Platform Icons** - Auto-detect Twitter, YouTube, GitHub, LinkedIn
- 🎨 **Interactive Table** - Sortable, searchable URL management
- 🎨 **QR Code Modal** - View and download QR codes instantly
- 🎨 **Status Badges** - Real-time status indicators
- 🎨 **Smooth Animations** - Professional transitions and effects

## 📐 Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          Frontend (React + TypeScript)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Navbar  │  │   Home   │  │  Login   │  │  Signup  │  │  Footer  │   │
│  │          │  │ +Table   │  │          │  │          │  │          │   │
│  │          │  │ +QR Modal│  │          │  │          │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      Backend API (Express + TypeScript)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  URL Routes │  │ Auth Routes │  │  QR Routes  │  │  Redirect   │     │
│  │  /api/*     │  │ /api/auth/* │  │  /api/qr/*  │  │   /:code    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │
└──────────────────────────────────────────────────────────────────────────┘
                    │                               │
    ┌───────────────┴───────────────┐               │
    ▼                               ▼               ▼
┌──────────────────────┐  ┌──────────────────────────────────────┐
│    Redis Cache       │  │         PostgreSQL                    │
│  • URL mappings      │  │  • Users table                        │
│  • Rate limits       │  │  • URLs table (with user_id)          │
│  • 1 hour TTL        │  │  • Real-time click analytics          │
└──────────────────────┘  └──────────────────────────────────────┘
```

## 🛠 Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18, TypeScript, Vite |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| QR Codes | qrcode library |
| Styling | CSS Variables, Dark Theme |
| Containerization | Docker, Docker Compose |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- Docker & Docker Compose
- npm, pnpm, or yarn

### 1. Start Infrastructure

```bash
cd "D:\Coding\System Design Interview\Url Shortener"
docker-compose down -v
docker-compose up -d
```

Wait ~10 seconds for PostgreSQL to initialize.

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file
echo PORT=3001 > .env
echo NODE_ENV=development >> .env
echo DATABASE_URL=postgresql://postgres:postgres@localhost:5433/urlshortener >> .env
echo REDIS_URL=redis://localhost:6379 >> .env
echo RATE_LIMIT_WINDOW_SECONDS=60 >> .env
echo RATE_LIMIT_MAX_REQUESTS=10 >> .env
echo SHORT_CODE_LENGTH=7 >> .env
echo BASE_URL=http://localhost:3001 >> .env

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 📡 API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

### URL Operations

#### Create Short URL
```http
POST /api/shorten
Content-Type: application/json

{
  "url": "https://example.com/very-long-url",
  "expiresIn": 86400  // Optional: seconds
}
```

**Response:**
```json
{
  "shortCode": "abc1234",
  "shortUrl": "http://localhost:3001/abc1234",
  "originalUrl": "https://example.com/very-long-url",
  "isExisting": false
}
```

#### Redirect
```http
GET /:shortCode
```
Redirects to the original URL (302 redirect) and increments click count.

#### Get Statistics
```http
GET /api/stats/:shortCode
```

**Response:**
```json
{
  "shortCode": "abc1234",
  "shortUrl": "http://localhost:3001/abc1234",
  "originalUrl": "https://example.com/very-long-url",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "expiresAt": null,
  "clickCount": 42
}
```

### QR Code Generation

#### Get QR Code (Data URL)
```http
GET /api/qr/:shortCode
```

**Response:**
```json
{
  "shortCode": "abc1234",
  "shortUrl": "http://localhost:3001/abc1234",
  "qrCode": "data:image/png;base64,..."
}
```

#### Get QR Code (PNG Image)
```http
GET /api/qr/:shortCode/image
```
Returns a PNG image file.

## 💾 Database Schema

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- URLs table
CREATE TABLE urls (
  id SERIAL PRIMARY KEY,
  short_code VARCHAR(10) UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  click_count INTEGER DEFAULT 0,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);
```

## ✨ UI Features

### Guest Experience
- Create up to 5 short URLs without signing up
- View limit counter showing remaining free URLs
- Prompted to sign up after reaching limit
- All URLs stored in browser localStorage

### Authenticated Experience
- Unlimited URL shortening
- Persistent URL history across devices
- User profile in navbar
- Full analytics access

### URL Management Table
- **Platform Detection** - Auto-detect and show icons for Twitter, YouTube, GitHub, LinkedIn
- **Real-Time Clicks** - Live click counts updated every 5 seconds
- **QR Code Generation** - Click to view and download QR codes
- **Status Badges** - Active/Inactive indicators
- **Copy to Clipboard** - One-click copy with confirmation
- **Delete URLs** - Remove individual URLs
- **Clear All** - Bulk delete option
- **Responsive Design** - Horizontal scroll on mobile

### QR Code Features
- **Instant Generation** - QR codes generated on demand
- **High Quality** - 300x300px resolution
- **Download** - Save QR codes as PNG files
- **Modal View** - Clean preview interface

## 🎨 Design System

### Color Palette (Dark Theme)
```css
--color-bg: #0f1419           /* Deep dark background */
--color-surface: #1e2433      /* Card backgrounds */
--color-border: #2d3548       /* Border color */
--color-text: #e8eaed         /* Primary text */
--color-primary: #3b82f6      /* Brand blue */
--color-accent: #a855f7       /* Purple accent */
--color-pink: #ec4899         /* Pink gradient */
```

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700, 800
- **Gradient Text**: Animated blue → pink → purple

### Animations
- Fade in, slide up, scale in effects
- Gradient animation on logo
- Smooth hover transitions
- Loading spinners

## 🔒 Security Features

1. **Rate Limiting**: 10 requests per minute per IP
2. **Input Validation**: URL format validation
3. **Password Requirements**: Minimum 8 characters
4. **SQL Injection Protection**: Parameterized queries
5. **CORS Configuration**: Controlled origin access
6. **Click Tracking**: Asynchronous, non-blocking

## 📊 Real-Time Analytics

- **Auto-Refresh**: Click counts update every 5 seconds
- **Non-Blocking**: Analytics fetched asynchronously
- **Cached**: Redis caching for fast reads
- **Accurate**: Database-backed persistence

## 🔧 Configuration

Environment variables (backend/.env):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | API server port |
| `DATABASE_URL` | postgresql://... | PostgreSQL connection string |
| `REDIS_URL` | redis://localhost:6379 | Redis connection string |
| `RATE_LIMIT_WINDOW_SECONDS` | 60 | Rate limit window |
| `RATE_LIMIT_MAX_REQUESTS` | 10 | Max requests per window |
| `SHORT_CODE_LENGTH` | 7 | Length of generated short codes |
| `BASE_URL` | http://localhost:3001 | Base URL for short links |

## 🚀 Production Deployment

### Environment Variables
```env
# Production settings
NODE_ENV=production
PORT=3001
BASE_URL=https://yourdomain.com

# Database (use connection pooling)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Redis (use Redis Cluster in production)
REDIS_URL=redis://host:6379
```

### Scaling Recommendations
1. **Horizontal Scaling**: Multiple API instances behind load balancer
2. **Database**: Read replicas for redirect traffic
3. **Redis**: Redis Cluster or Sentinel for HA
4. **CDN**: Cache redirect responses at edge
5. **Monitoring**: Add APM (Datadog, New Relic)

## 📝 Project Structure

```
Url Shortener/
├── backend/
│   ├── src/
│   │   ├── cache/          # Redis connection
│   │   ├── config/         # Configuration
│   │   ├── db/             # Database & migrations
│   │   ├── middleware/     # Rate limiting, error handling
│   │   ├── repositories/   # URL & User data access
│   │   ├── routes/         # API endpoints (url, auth, qr, redirect)
│   │   ├── services/       # Business logic
│   │   └── index.ts        # Server entry
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, Footer, UrlShortener, UrlTable
│   │   ├── pages/          # Home, Login, Signup
│   │   ├── App.tsx         # Main app component
│   │   ├── index.css       # Global dark theme styles
│   │   └── main.tsx        # Entry point
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml      # PostgreSQL & Redis
└── README.md
```

## 🎯 Key Features Showcase

### 1. URL Shortening
- Enter any long URL
- Get a short, memorable code
- Auto-detect and prevent duplicates

### 2. Real-Time Analytics
- See click counts update live
- Track URL performance
- Historical data preserved

### 3. QR Code Generation
- Click QR icon in table
- View instant preview
- Download high-quality PNG

### 4. Platform Detection
- Twitter/X URLs → Blue bird icon
- YouTube URLs → Red play icon
- GitHub URLs → GitHub icon
- LinkedIn URLs → LinkedIn icon
- Others → Generic link icon

### 5. Guest Limitations
- 5 free URLs without account
- Clear counter display
- Easy signup process

## 📈 Performance

- **Redirect Latency**: < 5ms (with Redis cache)
- **QR Generation**: < 100ms
- **Click Tracking**: Async, non-blocking
- **Table Refresh**: Every 5 seconds
- **Rate Limiting**: Token bucket (fair distribution)

## 🐛 Troubleshooting

### Port Conflicts
If PostgreSQL port 5432 is in use:
- The app uses port 5433 by default
- Update `DATABASE_URL` if needed

### Clear localStorage
To reset app state:
```javascript
localStorage.clear();
location.reload();
```

### Check Services
```bash
# Check if containers are running
docker ps

# View logs
docker logs url-shortener-db
docker logs url-shortener-cache

# Restart services
docker-compose restart
```

## 📄 License

MIT License - feel free to use this project for learning and production use.

## 🤝 Contributing

This is a system design interview project. Feel free to fork and enhance!

---

**Built with ❤️ for System Design Interview Practice**

*Featuring real-time analytics, QR code generation, and a beautiful dark UI*
