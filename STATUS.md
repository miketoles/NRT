# STATUS.md - Scatterplot Data Platform

---

**Project:** Scatterplot Data Platform
**Last worked on:** January 27, 2026
**Path:** `~/dev/CR`

---

## Current Status

**Overall:** Phase 1 Complete - Foundation + Data Entry Working

The platform is now a functional Next.js application with:
- User authentication (NextAuth)
- Client/behavior management
- Scatterplot data entry grid
- SQLite database (ready to switch to PostgreSQL for production)

---

## FUTURE AUTH CHANGE (Important!)

**Current:** Manual login with email/password (NextAuth Credentials)

**Desired:** Automatic authentication using Windows/network credentials
- Users are already logged into hospital computers
- App should detect their identity from system login
- No separate login step - seamless experience
- Likely approach: NextAuth + LDAP/Active Directory integration
- Alternative: Windows Integrated Authentication (if IIS hosted)

**Don't implement yet** - wait for hospital IT coordination in Phase 4

---

## What's Done (Phase 1)

- [x] Next.js 16 project setup with TypeScript + Tailwind
- [x] Prisma schema for User, Client, Behavior, Session, Interval
- [x] SQLite database for local development
- [x] NextAuth credentials authentication (temporary)
- [x] Login page with demo accounts
- [x] Dashboard with navigation
- [x] Client list and detail pages
- [x] Behavior management per client
- [x] REST API endpoints for all CRUD operations
- [x] ScatterplotGrid component (96 intervals, click+drag)
- [x] Data entry page with client/date selection
- [x] Session save/load functionality

---

## What's Next (Phase 2-5)

### Phase 2: Offline Sync
- [ ] IndexedDB storage layer (idb library already installed)
- [ ] Background sync with retry logic
- [ ] Sync status indicator component
- [ ] Service worker for offline support
- [ ] Queue failed requests, retry on reconnect

### Phase 3: Reports & Export
- [ ] Report builder UI (select client, date range, behaviors)
- [ ] Trend charts with Recharts (already installed)
- [ ] Heat map visualization (when behaviors occur by time)
- [ ] Behavior comparison charts
- [ ] Excel export with embedded charts (ExcelJS already installed)

### Phase 4: Deployment + Auth
- [ ] **Switch to Windows/network auth** (LDAP/AD integration)
- [ ] Dockerfile for containerized deployment
- [ ] Environment configuration for production
- [ ] PostgreSQL migration (change provider in schema.prisma)
- [ ] Hospital IT coordination for server/database

---

## Demo Accounts (Temporary)

```
admin@example.com / admin123
bcba@example.com / bcba123
```

---

## Running the App

```bash
cd ~/dev/CR
npm run dev
# Open http://localhost:3000
```

---

## Key Files

| File | Purpose |
|------|---------|
| `app/entry/page.tsx` | Data entry page |
| `components/ScatterplotGrid.tsx` | The 96-interval grid component |
| `lib/auth.ts` | NextAuth configuration (will change for AD) |
| `lib/prisma.ts` | Database client singleton |
| `prisma/schema.prisma` | Database schema |
| `app/api/*` | REST API endpoints |

---

## Project Structure

```
~/dev/CR/
├── app/
│   ├── api/           # REST API routes
│   │   ├── auth/      # NextAuth
│   │   ├── clients/   # Client CRUD
│   │   ├── behaviors/ # Behavior CRUD
│   │   └── sessions/  # Session + interval CRUD
│   ├── clients/       # Client management pages
│   ├── entry/         # Data entry page (main feature)
│   ├── login/         # Authentication (will simplify with AD)
│   └── reports/       # Reports (placeholder)
├── components/
│   ├── ScatterplotGrid.tsx  # Core data entry grid
│   ├── Navigation.tsx
│   └── Providers.tsx
├── lib/
│   ├── auth.ts        # NextAuth configuration
│   ├── prisma.ts      # Database client
│   └── types.ts       # TypeScript types
├── prisma/
│   ├── schema.prisma  # Database schema
│   └── seed.ts        # Demo data seeder
└── mockup/
    └── quick-entry.html  # Original prototype (reference)
```

---

## Tech Stack

- **Framework:** Next.js 16 + React 19
- **Database:** SQLite (dev) / PostgreSQL (production)
- **ORM:** Prisma 6
- **Auth:** NextAuth.js (will switch to AD)
- **Styling:** Tailwind CSS
- **Charts:** Recharts (installed, not yet used)
- **Excel:** ExcelJS (installed, not yet used)
- **Offline:** idb (installed, not yet used)

---

## Database Schema

```
User (id, email, name, password, role)
  └─ Session[]

Client (id, name, identifier, notes)
  ├─ Behavior[] (id, name, description, color)
  │    └─ Interval[]
  └─ Session[] (id, sessionDate, userId)
       └─ Interval[] (behaviorId, intervalIndex, value)
```

**Interval values:** 'ind' (behavior occurred), 'err' (observed, no behavior), 'skip' (not observed)

---

*Last updated: January 27, 2026*
