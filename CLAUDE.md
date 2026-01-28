# CLAUDE.md - NRT (Neurorehabilitation Team) Platform

---

## Project Overview

**Name:** NRT - Neurorehabilitation Team Platform
**Purpose:** Bespoke ABA data platform for Craig Hospital's unique TBI patient population
**Status:** Active Development - Phase 1 (Scatterplot Quick Win)
**Path:** `~/dev/NRT`
**GitHub:** https://github.com/miketoles/NRT (will rename to NRT)

---

## What is NRT?

Craig Hospital's Neurorehabilitation Team uses Applied Behavior Analysis (ABA) strategies to manage TBI patients who exhibit maladaptive behaviors. This is **the only facility in the world** using this TBI/ABA model.

NRT Platform is being built as a potential **complete replacement for CentralReach**, purpose-built for Craig's unique workflows.

---

## Vision: Two-Track Approach

### Track 1: Quick Win (Current Focus)
- Scatterplot data entry with elegant UI
- Excel reporting
- SQLite database with backup strategy
- **Goal:** Get value into RBT hands quickly

### Track 2: Full NRT Platform (Future)
- Complete patient management
- Scheduling integration
- Supervision workflows
- Custom reporting for TBI/ABA model
- Potential CentralReach replacement

---

## User Roles

| Role | Devices | Primary Tasks |
|------|---------|---------------|
| **RBT** | Personal iPad + office laptop | Data collection, session documentation |
| **BCBA** | Laptop + occasional RBT iPad | Supervision, reports, data review, impromptu collection |

---

## Key Principles

1. **No separate login** - Use Windows/network credentials (seamless auth)
2. **Offline-first** - Hospital wifi can be spotty
3. **TBI-focused** - Workflows designed for this specific population
4. **Simple > Complex** - Elegant solutions over feature bloat

---

## Running the App

```bash
cd ~/dev/NRT
npm run dev
# Open http://localhost:3000
```

**Demo logins (temporary until AD auth):**
- admin@example.com / admin123
- bcba@example.com / bcba123

---

## Key Files

| File | Purpose |
|------|---------|
| `docs/DESIGN.md` | Comprehensive platform design document |
| `components/ScatterplotGrid.tsx` | The 96-interval data entry grid |
| `app/entry/page.tsx` | Data entry page |
| `lib/auth.ts` | NextAuth config (will switch to AD) |
| `prisma/schema.prisma` | Database schema |
| `scripts/backup-db.sh` | Database backup utility |

---

## Tech Stack

- **Framework:** Next.js 16 + React 19 + TypeScript
- **Database:** SQLite (dev) / PostgreSQL (production)
- **ORM:** Prisma 6
- **Auth:** NextAuth.js → Windows/AD (future)
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Excel:** ExcelJS
- **Offline:** idb (IndexedDB wrapper)

---

## Related Docs

- `STATUS.md` - Current status and next steps
- `docs/DESIGN.md` - Full platform design
- `~/dev/projects-hub/SYNC.md` - Session handoff for mobile Claude
