# 🚦 Rate Limiter - Complete System Design Implementation

A comprehensive, production-ready rate limiter implementation in TypeScript with an interactive visualization dashboard. This project demonstrates all 5 major rate limiting algorithms used by companies like Amazon, Stripe, Cloudflare, and Shopify.

![Rate Limiter Banner](https://img.shields.io/badge/Rate%20Limiter-TypeScript-blue?style=for-the-badge&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## 📚 Table of Contents

1. [What is Rate Limiting?](#-what-is-rate-limiting)
2. [Why Do We Need Rate Limiting?](#-why-do-we-need-rate-limiting)
3. [Rate Limiting Algorithms](#-rate-limiting-algorithms)
   - [Token Bucket](#1-token-bucket-algorithm)
   - [Leaking Bucket](#2-leaking-bucket-algorithm)
   - [Fixed Window Counter](#3-fixed-window-counter-algorithm)
   - [Sliding Window Log](#4-sliding-window-log-algorithm)
   - [Sliding Window Counter](#5-sliding-window-counter-algorithm)
4. [System Architecture](#-system-architecture)
5. [Project Structure](#-project-structure)
6. [Quick Start](#-quick-start)
7. [Real-World Use Cases](#-real-world-use-cases)
8. [API Reference](#-api-reference)
9. [Storage Options](#-storage-options)
10. [Distributed Rate Limiting](#-distributed-rate-limiting)
11. [Algorithm Selection Guide](#-algorithm-selection-guide)
12. [Best Practices](#-best-practices)
13. [Real-World Examples](#-real-world-examples)

---

## 🎯 What is Rate Limiting?

**Rate limiting** is a technique used to control the rate at which clients can make requests to a server. It's like a traffic cop for your API - it ensures no single client overwhelms your system.

```
┌─────────┐         ┌──────────────┐         ┌─────────┐
│ Client  │ ──────▶ │ Rate Limiter │ ──────▶ │   API   │
└─────────┘         └──────────────┘         └─────────┘
     │                     │                      
     │                     │ Too many requests?
     │                     ▼
     │              ┌──────────────┐
     │◀──── 429 ────│   BLOCKED    │
     │              └──────────────┘
```

### Real-World Examples:

| Service | Limit | Why? |
|---------|-------|------|
| Twitter | 300 tweets / 3 hours | Prevent spam |
| GitHub API | 5000 requests / hour | Fair usage |
| Stripe API | 100 requests / second | Protect infrastructure |
| Google Docs | 300 reads / minute / user | Resource management |

---

## 🛡️ Why Do We Need Rate Limiting?

### 1. **Prevent DoS Attacks** 🔒
```
Without Rate Limiting:
Attacker → 1,000,000 requests/sec → Server Crash! 💥

With Rate Limiting:
Attacker → 1,000,000 requests/sec → Only 100/sec pass → Server Safe ✓
```

### 2. **Reduce Costs** 💰
```
Every API call to third-party services costs money:
├── Stripe Payment Check: $0.01/call
├── Twilio SMS: $0.0075/message
└── AWS Rekognition: $0.001/image

Rate limiting = Budget control!
```

### 3. **Ensure Fair Usage** ⚖️
```
Without limiting:
User A → 90% of resources
User B → 8% of resources
User C → 2% of resources

With limiting:
User A → 33% of resources
User B → 33% of resources
User C → 33% of resources
```

### 4. **Prevent Server Overload** 🖥️
```
Server Capacity: 1000 req/sec

Without limiting:          With limiting:
Traffic spike: 5000/sec    Traffic spike: 5000/sec
Result: Crash! 💥          Result: 1000/sec processed,
                           4000/sec get 429 response ✓
```

---

## 🧮 Rate Limiting Algorithms

### 1. Token Bucket Algorithm

**Used by:** Amazon AWS, Stripe, Twitter

#### How It Works:
Imagine a bucket that holds tokens. Tokens are added at a fixed rate. Each request consumes one token. If the bucket is empty, requests are rejected.

```
Initial State (bucket size = 4):

    ┌─────────────┐
    │  🪙 🪙 🪙 🪙 │  ← Full bucket (4 tokens)
    └─────────────┘
          ↑
    Refill Rate: 2 tokens/second

After 3 requests:

    ┌─────────────┐
    │  🪙         │  ← 1 token remaining
    └─────────────┘

After 1 second (2 tokens refilled):

    ┌─────────────┐
    │  🪙 🪙 🪙   │  ← 3 tokens now
    └─────────────┘
```

#### Code Location:
`backend/src/algorithms/token-bucket.ts`

#### Parameters:
- **bucketSize**: Maximum tokens the bucket can hold
- **refillRate**: Tokens added per interval
- **refillInterval**: How often tokens are added

#### Pros:
- ✅ Allows burst traffic (use all tokens at once)
- ✅ Memory efficient (only stores 2 values)
- ✅ Simple to implement

#### Cons:
- ❌ Bursts might overwhelm downstream services
- ❌ Two parameters to tune

#### When to Use:
- APIs that need to handle traffic spikes
- Mobile apps with intermittent connectivity
- Gaming APIs

---

### 2. Leaking Bucket Algorithm

**Used by:** Shopify, NGINX

#### How It Works:
Requests enter a queue (bucket) and are processed at a constant rate (leaking). If the queue is full, new requests are dropped.

```
Initial State (queue size = 4, leak rate = 1 req/sec):

    📥 Requests coming in
         ↓
    ┌─────────────┐
    │             │  ← Empty queue
    │             │
    │             │
    │_____________│
         ↓
       💧 (1 request/second leaks out)

Queue is full:

    📥❌ Request REJECTED!
         ↓
    ┌─────────────┐
    │   Req 2     │
    │   Req 3     │
    │   Req 4     │
    │   Req 5     │  ← FULL!
    │_____________│
         ↓
       💧 Still processing at constant rate
```

#### Code Location:
`backend/src/algorithms/leaking-bucket.ts`

#### Parameters:
- **queueSize**: Maximum requests in queue
- **processingRate**: Requests processed per second

#### Pros:
- ✅ Constant, predictable output rate
- ✅ FIFO fairness (first come, first served)
- ✅ Smooth traffic for downstream services

#### Cons:
- ❌ No burst allowance
- ❌ Recent requests may be delayed

#### When to Use:
- When downstream services need constant load
- Background job processing
- File upload processing

---

### 3. Fixed Window Counter Algorithm

**The simplest algorithm!**

#### How It Works:
Divide time into fixed windows. Count requests per window. Reset counter at window boundaries.

```
Timeline with 1-minute windows, limit = 5 requests/minute:

  Window 1 (10:00-10:01)    Window 2 (10:01-10:02)
  ┌────────────────────┐    ┌────────────────────┐
  │ R R R R R          │    │ R R R              │
  │ 1 2 3 4 5          │    │ 1 2 3              │
  └────────────────────┘    └────────────────────┘
        ↑                         ↑
    Counter = 5               Counter = 3
    (FULL - next               (OK - 2 more
     request blocked)           allowed)
```

#### ⚠️ The Edge Case Problem:

```
         Window 1                    Window 2
  ┌───────────┬──────────┐    ┌──────────┬───────────┐
  │           │ R R R R R│    │R R R R R │           │
  │           │← 5 req @ │    │@ 10:01:01│           │
  │           │  10:00:59│    │→ 5 req   │           │
  └───────────┴──────────┘    └──────────┴───────────┘
                   ↑              ↑
                   │              │
                   └──── 10 requests in 2 seconds! ────┘

Both windows allow 5 requests, but at the boundary,
10 requests can pass in ~2 seconds!
```

#### Code Location:
`backend/src/algorithms/fixed-window.ts`

#### Pros:
- ✅ Extremely simple
- ✅ Memory efficient (just 1 counter)
- ✅ Easy to understand and debug

#### Cons:
- ❌ Edge case allows 2x the limit!

#### When to Use:
- Internal APIs
- When simplicity > precision
- Quick prototypes

---

### 4. Sliding Window Log Algorithm

**The most accurate algorithm!**

#### How It Works:
Track the timestamp of every request. Count requests within the sliding window (now - windowSize).

```
Limit: 5 requests per minute

Request Log (timestamps):
[10:00:15, 10:00:30, 10:00:45, 10:01:00, 10:01:10]

At 10:01:20 (new request arrives):

──────────────────────────────────────────────────────→ Time
    │                                                │
 10:00:20                                        10:01:20
 (window start)                                  (now)
    │                                                │
    │←────────────── 1 minute window ───────────────→│
    │                                                │
    │   ✗    ✓      ✓      ✓       ✓      ✓    ?   │
    │ 10:00:15  10:00:30  10:00:45  10:01:00         │
    │   (old)    (in window)                         │

Step 1: Remove 10:00:15 (outside window)
Step 2: Count remaining: 4 requests
Step 3: 4 < 5 (limit), so ALLOW
Step 4: Add 10:01:20 to the log
```

#### Code Location:
`backend/src/algorithms/sliding-window-log.ts`

#### Pros:
- ✅ Perfect accuracy
- ✅ No edge case problems
- ✅ Rolling window is intuitive

#### Cons:
- ❌ High memory usage (stores all timestamps)
- ❌ More CPU for filtering

#### Memory Calculation:
```
For each user, we store:
- With 100 req/min limit: up to 100 timestamps
- Each timestamp: ~8 bytes
- Per user: 100 × 8 = 800 bytes

For 1 million users: 800 × 1,000,000 = 800 MB 😱
```

#### When to Use:
- Login attempt limiting
- Payment operations
- Security-critical features

---

### 5. Sliding Window Counter Algorithm

**Used by:** Cloudflare (processes 400+ million requests!)

**The best balance of accuracy and efficiency.**

#### How It Works:
Combines Fixed Window and Sliding Window Log. Uses weighted averages based on position in current window.

```
Previous Window (10:00-10:01)     Current Window (10:01-10:02)
┌─────────────────────────────┐   ┌─────────────────────────────┐
│ ████████████████████████████│   │ ████████░░░░░░░░░░░░░░░░░░░░│
│          70 requests        │   │  30 req        │            │
└─────────────────────────────┘   └────────────────┼────────────┘
                                                   │
                                               10:01:25
                                                 (NOW)

Calculation at 10:01:25 (25 seconds = 42% into current window):

Step 1: Position in window = 25 sec / 60 sec = 0.42 (42%)
Step 2: Overlap ratio = 1 - 0.42 = 0.58 (58%)
Step 3: Estimated count = 30 + (70 × 0.58) = 30 + 41 = 71 requests
```

**The Magic Formula:**
```
estimated_count = current_window_count + (previous_window_count × overlap_ratio)

Where: overlap_ratio = 1 - (position_in_current_window / window_duration)
```

#### Code Location:
`backend/src/algorithms/sliding-window-counter.ts`

#### Memory Comparison:
```
For 1 million users, 100 req/min limit:

Sliding Window LOG:     800 MB (100 timestamps × 8 bytes × 1M users)
Sliding Window COUNTER: 16 MB  (2 counters × 8 bytes × 1M users)

That's 50x less memory! 🎉
```

#### Pros:
- ✅ Memory efficient
- ✅ 99.997% accurate (per Cloudflare)
- ✅ Smooths out traffic

#### Cons:
- ❌ Approximation (assumes even distribution)

#### When to Use:
- High-traffic APIs
- When you need accuracy but can't afford memory
- Default choice for most cases

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT REQUESTS                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LOAD BALANCER                               │
│                   (distributes traffic)                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
         ┌──────────┐    ┌──────────┐    ┌──────────┐
         │ Server 1 │    │ Server 2 │    │ Server 3 │
         └────┬─────┘    └────┬─────┘    └────┬─────┘
              │               │               │
              │     ┌─────────┴─────────┐     │
              │     │                   │     │
              ▼     ▼                   ▼     ▼
         ┌─────────────────────────────────────────┐
         │              RATE LIMITER                │
         │  ┌─────────────────────────────────┐    │
         │  │      Algorithm Selection         │    │
         │  │  ┌─────┐ ┌─────┐ ┌─────┐       │    │
         │  │  │Token│ │Leak │ │Slide│ ...   │    │
         │  │  │Bucket│ │Bucket│ │Window│      │    │
         │  │  └─────┘ └─────┘ └─────┘       │    │
         │  └─────────────────────────────────┘    │
         └──────────────────┬──────────────────────┘
                            │
                            ▼
         ┌─────────────────────────────────────────┐
         │          REDIS (Shared Storage)          │
         │    ┌─────────────────────────────┐      │
         │    │  user:123:count = 45         │      │
         │    │  user:456:count = 12         │      │
         │    │  user:789:tokens = 8.5       │      │
         │    └─────────────────────────────┘      │
         └─────────────────────────────────────────┘
```

### Components:

1. **Rate Limiter Middleware** (`middleware/rate-limiter.ts`)
   - Intercepts all incoming requests
   - Extracts client identifier (IP, user ID, API key)
   - Checks rate limit
   - Allows or blocks request

2. **Algorithm Layer** (`algorithms/`)
   - Implements the core logic
   - Each algorithm is independent
   - Easy to add new algorithms

3. **Storage Layer** (`storage/`)
   - Abstracts data persistence
   - MemoryStore for single server
   - RedisStore for distributed systems

4. **Configuration** (`config/rules.ts`)
   - Defines rate limiting rules
   - Preset configurations for common use cases

---

## 📁 Project Structure

```
Rate Limiter/
├── backend/                    # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── algorithms/         # Rate limiting algorithm implementations
│   │   │   ├── token-bucket.ts
│   │   │   ├── leaking-bucket.ts
│   │   │   ├── fixed-window.ts
│   │   │   ├── sliding-window-log.ts
│   │   │   ├── sliding-window-counter.ts
│   │   │   └── index.ts
│   │   ├── middleware/         # Express middleware
│   │   │   └── rate-limiter.ts
│   │   ├── storage/            # Data persistence layer
│   │   │   ├── memory-store.ts # In-memory (single server)
│   │   │   ├── redis-store.ts  # Redis (distributed)
│   │   │   └── index.ts
│   │   ├── types/              # TypeScript interfaces
│   │   │   ├── index.ts
│   │   │   └── use-cases.ts    # Real-world use case definitions
│   │   ├── config/             # Configuration
│   │   │   └── rules.ts
│   │   └── index.ts            # Main server file
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # React + TypeScript + Tailwind
│   ├── src/
│   │   ├── App.tsx            # Main application
│   │   ├── main.tsx           # Entry point
│   │   ├── index.css          # Styles
│   │   ├── components/        # React components
│   │   │   ├── Header.tsx
│   │   │   ├── AlgorithmSelector.tsx
│   │   │   ├── RequestControls.tsx
│   │   │   ├── RequestLog.tsx
│   │   │   ├── Statistics.tsx
│   │   │   ├── ModeSwitcher.tsx
│   │   │   ├── UseCaseSelector.tsx
│   │   │   └── UseCaseDetails.tsx
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── useRateLimiter.ts
│   │   │   ├── useUseCases.ts
│   │   │   └── useUseCaseRequest.ts
│   │   ├── types/             # TypeScript interfaces
│   │   │   ├── index.ts
│   │   │   └── use-cases.ts
│   │   ├── constants/         # Constants and configs
│   │   │   └── algorithms.tsx
│   │   └── utils/             # Utility functions
│   │       └── colors.ts
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
└── README.md                   # This file!
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

```bash
# Clone or navigate to the project
cd "Rate Limiter"

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running the Application

**Terminal 1 - Start Backend:**
```bash
cd backend
npm run dev
```
Server starts on http://localhost:3001

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
```
Frontend starts on http://localhost:5173

### Using the Dashboard

The dashboard has **two modes** for different learning approaches:

#### Mode 1: Algorithm Testing
1. **Select an Algorithm**: Click on any of the 5 algorithms
2. **Configure Settings**: Adjust window size, max requests, and auto-send rate
3. **Send Requests**: Click "Send Request" or enable "Auto Send"
4. **Watch Results**: See real-time feedback with success/blocked status
5. **Save Performance**: Compare different algorithms with the same number of requests

#### Mode 2: Real-World Use Cases
1. **Switch to Use Cases Mode**: Toggle the mode switcher
2. **Select a Use Case**: Choose from 10 real-world scenarios (Login, Payment, Search, etc.)
3. **Understand the Context**: Read why this limit exists and what happens when blocked
4. **Test the Scenario**: Send requests and see how rate limiting works in practice
5. **Learn from Examples**: See which companies use similar limits

---

## 🎯 Real-World Use Cases

This project includes **10 real-world use cases** that demonstrate how rate limiting is applied in production systems. Each use case shows:

- **Real API endpoints** (e.g., `/api/auth/login`, `/api/payments/process`)
- **Appropriate rate limits** based on the use case
- **Best algorithm choice** for that scenario
- **Real-world context** explaining why the limit exists
- **What happens** when requests are blocked
- **Companies** using similar limits

### Available Use Cases

| Use Case | Endpoint | Limit | Algorithm | Why? |
|----------|----------|-------|-----------|------|
| 🔐 **Login Attempts** | `POST /api/auth/login` | 5 per 15 min | Sliding Window Log | Prevent brute force attacks |
| 💳 **Payment Processing** | `POST /api/payments/process` | 3 per minute | Sliding Window Log | Money involved - need perfect accuracy |
| 🔑 **Password Reset** | `POST /api/auth/reset-password` | 3 per hour | Sliding Window Log | Prevent account takeover |
| 📖 **API Read Operations** | `GET /api/users/profile` | 100 per minute | Sliding Window Counter | Normal usage, prevent abuse |
| 📤 **File Upload** | `POST /api/files/upload` | 10 per hour | Fixed Window | Storage costs money |
| 🔍 **Search API** | `GET /api/search` | 20 per 10 sec | Token Bucket | Allow search bursts, limit average |
| 📧 **Email Sending** | `POST /api/emails/send` | 100 per day | Fixed Window | Email services charge per email |
| ✍️ **API Write Operations** | `POST /api/posts/create` | 10 per minute | Token Bucket | Allow posting bursts, prevent spam |
| 🔔 **Burst Traffic API** | `POST /api/notifications/push` | 50 per 10 sec | Token Bucket | Handle event spikes |
| ⚙️ **Background Job Queue** | `POST /api/jobs/submit` | 60 per minute | Leaking Bucket | Constant processing rate needed |

### Example: Login Attempts Use Case

**Scenario:** A user trying to guess passwords (brute force attack)

**Configuration:**
- **Limit:** 5 attempts per 15 minutes
- **Algorithm:** Sliding Window Log (most accurate)
- **Why:** Security critical - prevents brute force attacks. Need exact counting.

**What Happens:**
1. User makes 5 failed login attempts
2. 6th attempt is **blocked** with HTTP 429
3. User must wait 15 minutes or contact support
4. System logs the security event

**Real-World Usage:**
- GitHub: 5 attempts per 15 minutes
- Google: Similar limits with account lockout
- Microsoft: Progressive delays after failed attempts
- Banking Apps: Strict limits with 2FA requirements

### How to Use Use Cases in the Dashboard

1. **Switch to "Real-World Use Cases" mode** using the mode switcher
2. **Select a use case** (e.g., "Login Attempts")
3. **Read the explanation** to understand:
   - What the endpoint does
   - Why this limit exists
   - What happens when blocked
   - Which companies use similar limits
4. **Send requests** to see rate limiting in action
5. **Observe the behavior** - requests get blocked after the limit
6. **Learn from context** - understand the real-world impact

### Benefits of Use Cases

✅ **Practical Learning**: See rate limiting in real scenarios, not just abstract examples  
✅ **Context Understanding**: Learn WHY each limit exists  
✅ **Algorithm Selection**: See which algorithm fits which use case  
✅ **Industry Examples**: Know which companies use similar approaches  
✅ **Better Decision Making**: Make informed choices for your own projects  

---

## 📡 API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check (no rate limiting) |
| GET | `/stats` | Get rate limiter statistics |
| POST | `/stats/reset` | Reset all statistics |
| GET | `/api/token-bucket` | Test Token Bucket algorithm |
| GET | `/api/leaking-bucket` | Test Leaking Bucket algorithm |
| GET | `/api/fixed-window` | Test Fixed Window algorithm |
| GET | `/api/sliding-window-log` | Test Sliding Window Log algorithm |
| GET | `/api/sliding-window-counter` | Test Sliding Window Counter |
| POST | `/api/test` | Dynamic testing with custom config |
| GET | `/api/algorithms` | Get algorithm information |
| GET | `/api/use-cases` | Get all real-world use cases |
| POST | `/api/use-case-test` | Test a specific use case endpoint |

### Response Headers

Every rate-limited endpoint returns these headers:

```http
X-RateLimit-Limit: 100        # Max requests per window
X-RateLimit-Remaining: 45     # Requests left
X-RateLimit-Reset: 1699500000 # Unix timestamp when window resets
Retry-After: 30               # Seconds to wait (only on 429)
```

### 429 Response

When rate limited, you get:

```json
{
  "error": "Too Many Requests",
  "retryAfter": 30,
  "limit": 100,
  "remaining": 0,
  "resetTime": "2024-11-09T10:30:00.000Z"
}
```

---

## 💾 Storage Options

### MemoryStore (Single Server)

```typescript
import { MemoryStore } from './storage';

const store = new MemoryStore();
```

**Pros:**
- ✅ No external dependencies
- ✅ Fast (everything in RAM)
- ✅ Great for development

**Cons:**
- ❌ Data lost on restart
- ❌ Can't share between servers

### RedisStore (Distributed)

```typescript
import { RedisStore } from './storage';

const store = new RedisStore('redis://localhost:6379');
```

**Pros:**
- ✅ Persists across restarts
- ✅ Shared between servers
- ✅ Atomic operations (no race conditions)
- ✅ Built-in expiration

**Cons:**
- ❌ External dependency
- ❌ Network latency

---

## 🌐 Distributed Rate Limiting

### The Challenge

When you have multiple servers behind a load balancer:

```
Client → Load Balancer → Server 1 (count: 5)
Client → Load Balancer → Server 2 (count: 0) ← Different count!
```

Without synchronization, each server has its own count!

### The Solution: Centralized Storage (Redis)

```
Client → Server 1 ─┐
                   ├──→ Redis (count: 5) ← Single source of truth!
Client → Server 2 ─┘
```

### Race Condition Prevention

**The Problem:**
```
Server A: GET count (= 99)     Server B: GET count (= 99)
Server A: count < 100? YES     Server B: count < 100? YES
Server A: SET count = 100      Server B: SET count = 100
                    ↓
         Both requests allowed!
        (Should have blocked one)
```

**The Solution: Atomic Operations**

```typescript
// Redis INCR is atomic - each request gets a unique number
Server A: INCR count → 100
Server B: INCR count → 101  // This one gets blocked!
```

---

## 📊 Algorithm Selection Guide

| Scenario | Recommended Algorithm | Why? |
|----------|----------------------|------|
| Login attempts | SLIDING_WINDOW_LOG | Perfect accuracy, security critical |
| Password reset | SLIDING_WINDOW_LOG | Can't afford false positives |
| Payment API | SLIDING_WINDOW_LOG | Money involved! |
| General API | SLIDING_WINDOW_COUNTER | Good balance |
| High-traffic API | SLIDING_WINDOW_COUNTER | Memory efficient |
| Bursty traffic | TOKEN_BUCKET | Allows bursts |
| Mobile app | TOKEN_BUCKET | Intermittent connectivity |
| Gaming API | TOKEN_BUCKET | Bursts are normal |
| File processing | LEAKING_BUCKET | Constant rate needed |
| Background jobs | LEAKING_BUCKET | Smooth processing |
| Internal API | FIXED_WINDOW | Simplicity |
| Quick prototype | FIXED_WINDOW | Easy to implement |

---

## ✅ Best Practices

### 1. Choose the Right Algorithm
Don't just use Fixed Window everywhere. Match the algorithm to your use case.

### 2. Set Appropriate Limits
```typescript
// Too strict: Frustrates users
{ maxRequests: 1, windowMs: 60000 }  // 1 per minute? 😠

// Too loose: No protection
{ maxRequests: 100000, windowMs: 1000 }  // 100k per second? 🤷

// Just right: Balance protection and usability
{ maxRequests: 100, windowMs: 60000 }  // 100 per minute ✓
```

### 3. Return Proper Headers
Always include rate limit headers so clients can adapt:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1699500000
```

### 4. Use Different Limits for Different Endpoints
```typescript
// Expensive operation: Strict limit
app.post('/api/process-video', strictLimiter);

// Simple read: Relaxed limit
app.get('/api/user', relaxedLimiter);
```

### 5. Consider User Tiers
```typescript
const getLimiter = (userTier: string) => {
  switch (userTier) {
    case 'free': return createLimiter({ maxRequests: 100 });
    case 'pro': return createLimiter({ maxRequests: 1000 });
    case 'enterprise': return createLimiter({ maxRequests: 10000 });
  }
};
```

### 6. Fail Open vs Fail Closed
```typescript
try {
  const result = await rateLimiter.checkLimit(key);
  // ...
} catch (error) {
  // FAIL OPEN: Allow request if rate limiter fails
  // Better UX, but less protection
  next();
  
  // FAIL CLOSED: Block request if rate limiter fails
  // More protection, but might block legitimate traffic
  // res.status(503).send('Service Unavailable');
}
```

### 7. Monitor and Adjust
- Track blocked requests
- Watch for patterns (attacks, bots)
- Adjust limits based on real usage

---

## 🌍 Real-World Examples

### Twitter (X)
```
Tweets: 300 per 3 hours
Follows: 400 per day
DMs: 500 per day
Algorithm: Token Bucket (allows bursts)
```

### GitHub
```
Authenticated: 5000 per hour
Unauthenticated: 60 per hour
Algorithm: Fixed Window (simple, acceptable for this use case)
```

### Stripe
```
Live mode: 100 per second
Test mode: 25 per second
Algorithm: Token Bucket (handles payment bursts)
```

### Cloudflare
```
Handles: 400+ million requests
Algorithm: Sliding Window Counter
Accuracy: 99.997%
```

---

## 🎓 Key Takeaways

1. **Rate limiting is essential** for any production API
2. **Choose your algorithm wisely** - there's no one-size-fits-all
3. **Token Bucket** is great for bursty traffic (most popular)
4. **Sliding Window Counter** is the best all-rounder
5. **Use Redis** for distributed systems
6. **Always return rate limit headers**
7. **Monitor and adjust** your limits based on real usage
8. **Learn from real-world use cases** - see how companies implement rate limiting
9. **Match limits to use cases** - security-critical endpoints need stricter limits
10. **Understand the context** - why a limit exists is as important as the limit itself

---

## 📖 Further Reading

- [Rate Limiting Fundamentals](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)
- [Cloudflare's Rate Limiting](https://blog.cloudflare.com/counting-things-a-lot-of-different-things/)
- [Stripe's Rate Limiting](https://stripe.com/docs/rate-limits)
- [Redis Rate Limiting Patterns](https://redis.io/learn/develop/dotnet/aspnetcore/rate-limiting/fixed-window)

---

## 🤝 Contributing

Feel free to submit issues and pull requests!

---

## 📄 License

MIT License - feel free to use this for learning and production!

---

Made with ❤️ for learning System Design

