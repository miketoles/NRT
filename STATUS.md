# STATUS.md - NRT Platform

---

**Project:** NRT (Neurorehabilitation Team) Platform
**Last worked on:** January 28, 2026
**Path:** `~/dev/NRT`

---

## Current Status

**Overall:** Phase 1 - Quick Win (Scatterplot Data Entry)

The platform has been renamed from "CR" to "NRT" to reflect its expanded vision as a potential complete CentralReach replacement, built specifically for Craig Hospital's unique TBI/ABA model.

**Working features:**
- User authentication (NextAuth - temporary until AD integration)
- Client/behavior management
- ScatterplotGrid (96 intervals, click+drag, keyboard shortcuts)
- REST API for all CRUD operations
- SQLite database

---

## Two-Track Development

### Track 1: Quick Win (Current)
Get scatterplot data entry + Excel reports into team hands quickly.

- [x] ScatterplotGrid component
- [x] Data entry page
- [x] Session save/load
- [ ] Database backup utility
- [ ] Excel export with charts
- [ ] Remove login requirement (use AD credentials)

### Track 2: Full NRT Platform (Future)
Comprehensive design for TBI/ABA workflows.

- [ ] Complete DESIGN.md
- [ ] Patient management beyond scatterplots
- [ ] Supervision workflows
- [ ] Scheduling integration
- [ ] CentralReach migration strategy

---

## Auth Strategy

**Current:** Manual login (temporary)
**Goal:** Seamless authentication via Windows/AD credentials

Users are already logged into hospital computers. The app should detect their identity automatically - no separate login step.

---

## Running the App

```bash
cd ~/dev/NRT
npm run dev
# Open http://localhost:3000
```

**Demo logins (until AD auth):**
- admin@example.com / admin123
- bcba@example.com / bcba123

---

## Backup Strategy

Database backup utility: `scripts/backup-db.sh`
- Timestamped backups to `backups/` folder
- Can run ad-hoc or as scheduled job
- Keeps last 30 backups

---

## Key Docs

| Doc | Purpose |
|-----|---------|
| `docs/DESIGN.md` | Comprehensive platform design |
| `CLAUDE.md` | Project context for Claude |
| `~/dev/projects-hub/SYNC.md` | Mobile Claude handoff |

---

*Last updated: January 28, 2026*
