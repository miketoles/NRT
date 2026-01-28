# Scatterplot Data Platform - Design Plan

*Created: January 27, 2026*

## Overview

Build a standalone **Scatterplot Data Platform** for BCBAs and RBTs to:
1. **Enter** behavior data quickly (using the existing Quick Entry UI)
2. **Store** data long-term in a hospital-hosted database (~7 years retention)
3. **Analyze** with rich visualizations (trends, patterns, comparisons)
4. **Export** to Excel with embedded graphs
5. **Work offline** with automatic sync

**Project path:** `~/dev/CR`
**Users:** 12-20 BCBAs and RBTs on a small team

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Scatterplot Platform                      │
│                   (Next.js Web App)                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│   │  Quick Entry │    │   Reports    │    │    Admin     │  │
│   │     UI       │    │   Builder    │    │   (clients)  │  │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘  │
│          │                   │                   │          │
│   ┌──────┴───────────────────┴───────────────────┴───────┐  │
│   │              Offline-First Data Layer                │  │
│   │         (IndexedDB + Background Sync)                │  │
│   └──────────────────────┬───────────────────────────────┘  │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │ (auto-sync via REST API)
                           ▼
              ┌────────────────────────┐
              │   Hospital VPN Server  │
              │  ┌──────────────────┐  │
              │  │   PostgreSQL     │  │
              │  │   or SQL Server  │  │
              │  ├──────────────────┤  │
              │  │   Next.js API    │  │
              │  │   (or Node.js)   │  │
              │  └──────────────────┘  │
              └────────────────────────┘
              (accessible only on hospital VPN)
```

### Why Hospital-Hosted?

- **Data stays in-house** - No third-party cloud storage for patient data
- **VPN access** - Staff can reach it from anywhere (like other hospital systems)
- **IT familiarity** - Hospital IT already manages SQL Server/PostgreSQL
- **Compliance** - Easier to meet HIPAA requirements with on-prem storage

---

## Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| **Framework** | Next.js 16 | Already using in hospital-mini-apps |
| **UI** | React 19 + Tailwind | Consistent with existing work |
| **Charts** | Recharts | React-native, customizable, Excel-compatible styling |
| **Database** | PostgreSQL or SQL Server | Hospital-hosted on VPN, 7-year retention |
| **API Layer** | Next.js API Routes | REST endpoints, runs alongside frontend |
| **ORM** | Prisma | Type-safe SQL queries, works with both Postgres & SQL Server |
| **Offline Storage** | IndexedDB (idb) | Already proven in hospital-mini-apps |
| **Excel Export** | ExcelJS | Full Excel workbook generation with charts |
| **Auth** | NextAuth.js | Will switch to LDAP/AD for Windows auth |
| **Deployment** | Hospital server (Node.js) | Behind VPN, IT-managed |

---

## Database Schema

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  password  String   // hashed (temporary, will use AD)
  role      String   @default("RBT") // RBT, BCBA, ADMIN
  sessions  Session[]
}

model Client {
  id         String     @id @default(uuid())
  name       String
  identifier String?    // MRN or internal ID
  notes      String?
  archivedAt DateTime?
  behaviors  Behavior[]
  sessions   Session[]
}

model Behavior {
  id          String     @id @default(uuid())
  clientId    String
  name        String     // e.g., "Aggression", "Elopement"
  description String?
  color       String?    // UI color for charts
  archivedAt  DateTime?
  intervals   Interval[]
}

model Session {
  id          String     @id @default(uuid())
  clientId    String
  sessionDate DateTime   // The date of observation
  userId      String
  notes       String?
  intervals   Interval[]
  @@unique([clientId, sessionDate])
}

model Interval {
  id            String   @id @default(uuid())
  sessionId     String
  behaviorId    String
  intervalIndex Int      // 0-95 (96 intervals per day)
  value         String   // 'ind', 'err', or 'skip'
  @@unique([sessionId, behaviorId, intervalIndex])
}
```

---

## Implementation Phases

### Phase 1: Foundation (COMPLETE)
- [x] Set up Next.js project structure
- [x] Configure Prisma with SQLite for local dev
- [x] Implement NextAuth with credentials provider
- [x] Build client/behavior management screens
- [x] Create API routes for CRUD operations
- [x] Build ScatterplotGrid component
- [x] Data entry page with save functionality

### Phase 2: Offline-First Sync (NEXT)
- [ ] Implement IndexedDB storage layer
- [ ] Add retry logic for failed syncs
- [ ] Handle offline → online transitions
- [ ] Add sync status indicator
- [ ] Service worker for offline

### Phase 3: Reports & Export
- [ ] Build report builder UI
- [ ] Implement chart components (Recharts)
- [ ] Create Excel export with embedded charts
- [ ] Add report API endpoints

### Phase 4: Deployment + Auth
- [ ] **Switch to Windows/AD authentication**
- [ ] Create Dockerfile
- [ ] Document environment variables
- [ ] PostgreSQL migration guide
- [ ] Coordinate with hospital IT

---

## Key UI Features

### ScatterplotGrid Component

The core data entry interface:
- 96 intervals (15-min each, 7 AM to 7 AM)
- Multiple behaviors per client as columns
- Check column for marking entire rows
- Click to toggle cell, drag to fill ranges
- Keyboard shortcuts: I (ind), E (err), S (skip), C (clear)
- Live totals: observed count, IND count, ERR count

### Interval Values

| Value | Meaning | Display |
|-------|---------|---------|
| `ind` | Behavior occurred | Shaded cell |
| `err` | Observed, no behavior | Blank (row checked) |
| `skip` | Not observed | Red X |
| `` | No data yet | Empty |

---

## Authentication Plan

**Current (Phase 1):** Manual email/password login
- Works for development and testing
- Demo accounts seeded in database

**Future (Phase 4):** Windows/Network Authentication
- Users already logged into hospital computers
- App detects identity from system login
- No separate login required
- Options:
  1. NextAuth + LDAP/Active Directory provider
  2. Windows Integrated Auth (if IIS hosted)
  3. Azure AD (if hospital uses Microsoft 365)

---

## Questions Resolved

- Data access: Team of 12-20 (shared database on hospital VPN)
- Visualizations: All types (trends, patterns, comparisons)
- Offline: Full offline support with auto-sync
- Storage: 7-year retention (hospital-hosted PostgreSQL or SQL Server)
- Export: Excel with embedded charts
- Deployment: Hospital-hosted, VPN-accessible (not third-party cloud)

---

*Document created during initial planning session, January 27, 2026*
