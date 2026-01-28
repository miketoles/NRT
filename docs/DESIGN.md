# NRT Platform - Design Document

*Neurorehabilitation Team Platform for Craig Hospital*

**Version:** 0.1 (Draft)
**Last Updated:** January 28, 2026
**Status:** In Progress - Gathering Requirements

---

## Executive Summary

NRT Platform is a bespoke ABA (Applied Behavior Analysis) data platform being built for Craig Hospital's Neurorehabilitation Team. Craig Hospital is **the only facility in the world** using ABA strategies to manage TBI (Traumatic Brain Injury) patients who exhibit maladaptive behaviors.

This platform is being developed as a potential **complete replacement for CentralReach**, purpose-built for Craig's unique TBI/ABA model.

---

## Table of Contents

1. [Vision & Goals](#vision--goals)
2. [The TBI/ABA Model](#the-tbiaba-model)
3. [User Personas](#user-personas)
4. [Core Workflows](#core-workflows)
5. [Phase 1: Quick Win (Scatterplot)](#phase-1-quick-win-scatterplot)
6. [Phase 2+: Full Platform](#phase-2-full-platform)
7. [Technical Architecture](#technical-architecture)
8. [Data Model](#data-model)
9. [Authentication Strategy](#authentication-strategy)
10. [CentralReach Comparison](#centralreach-comparison)
11. [Open Questions](#open-questions)

---

## Vision & Goals

### Why Build This?

CentralReach is designed for traditional ABA practices (autism, IDD). Craig Hospital's use case is fundamentally different:

- **Patient population:** TBI patients, not autism/IDD
- **Setting:** Inpatient hospital, not outpatient clinic
- **Behaviors:** Maladaptive behaviors from brain injury, not developmental
- **Workflows:** [TODO: Document unique workflows]

### Goals

1. **Quick Win:** Get scatterplot data entry into team hands immediately
2. **Tailored UX:** Built specifically for TBI/ABA workflows
3. **Seamless Auth:** No separate login - use hospital credentials
4. **Offline-First:** Works reliably on hospital wifi
5. **Simple & Elegant:** Remove friction, not add features

### Non-Goals (for now)

- Billing/insurance integration
- Multi-facility support
- Public/commercial release

---

## The TBI/ABA Model

*[This section needs input from Mike about what makes Craig Hospital's approach unique]*

### What is TBI/ABA?

[TODO: Explain the Neurorehabilitation Team's approach]

### How is it different from traditional ABA?

| Traditional ABA | Craig Hospital TBI/ABA |
|-----------------|------------------------|
| Autism/IDD patients | TBI patients |
| Outpatient clinics | Inpatient hospital |
| Long-term treatment | [TODO] |
| [TODO] | [TODO] |

### Common Maladaptive Behaviors

[TODO: What behaviors does the team track?]

### Treatment Approach

[TODO: How does the team intervene?]

---

## User Personas

### RBT (Registered Behavior Technician)

**Devices:** Personal iPad + office laptop
**Primary tasks:**
- Direct data collection during patient sessions
- Document behaviors in real-time
- Review their own data

**Pain points with CentralReach:**
- [TODO]

**What would make them love NRT:**
- [TODO]

### BCBA (Board Certified Behavior Analyst)

**Devices:** Laptop + occasional RBT iPad
**Primary tasks:**
- Supervise RBTs
- Review and analyze data
- Generate reports
- Sometimes do direct data collection

**Pain points with CentralReach:**
- [TODO]

**What would make them love NRT:**
- [TODO]

### Other Stakeholders

[TODO: Are there other users? Supervisors? Administrators?]

---

## Core Workflows

### Workflow 1: Daily Data Collection

[TODO: Walk through a typical day for an RBT]

1. Start shift
2. Get patient assignments
3. Collect data during session
4. ...

### Workflow 2: Supervision Session

[TODO: What happens during BCBA supervision?]

### Workflow 3: Report Generation

[TODO: What reports does the team need?]

### Workflow 4: [Other workflows?]

[TODO]

---

## Phase 1: Quick Win (Scatterplot)

**Goal:** Get scatterplot data entry + Excel reports into team hands quickly.

### What's Built

- **ScatterplotGrid:** 96 intervals (15-min each, 7 AM to 7 AM)
  - Click to toggle behavior occurred
  - Click+drag to fill ranges
  - Keyboard shortcuts: I (ind), E (err), S (skip), C (clear)
  - Check column for marking rows observed/skipped
  - Live totals
- **Client Management:** Add/edit clients
- **Behavior Management:** Add behaviors per client with colors
- **Session Save/Load:** Persist to SQLite database

### What's Next for Phase 1

- [ ] Excel export with charts
- [ ] Database backup utility (automated + ad-hoc)
- [ ] Remove login requirement (Windows/AD auth)
- [ ] Mobile-optimized view for iPad
- [ ] Test with actual team members

### Success Criteria

- RBTs can enter scatterplot data faster than paper
- BCBAs can generate Excel reports easily
- Data is safely backed up

---

## Phase 2+: Full Platform

*This section will expand as we understand the full scope*

### Potential Modules

| Module | Description | Priority |
|--------|-------------|----------|
| Patient Management | Full patient records | [TBD] |
| Scheduling | Session scheduling | [TBD] |
| Supervision Tracking | Log supervision hours | [TBD] |
| Advanced Reports | Trend analysis, heat maps | [TBD] |
| [Other?] | [TBD] | [TBD] |

### CentralReach Migration

[TODO: Strategy for transitioning from CentralReach]

---

## Technical Architecture

### Current Stack (Phase 1)

```
┌─────────────────────────────────────┐
│         NRT Web App                 │
│    (Next.js 16 + React 19)          │
├─────────────────────────────────────┤
│         Prisma ORM                  │
├─────────────────────────────────────┤
│         SQLite (dev.db)             │
│    + Automated Backups              │
└─────────────────────────────────────┘
```

### Future Architecture (Phase 2+)

```
┌─────────────────────────────────────┐
│         NRT Web App                 │
│    (Next.js + React)                │
├─────────────────────────────────────┤
│      Offline Data Layer             │
│    (IndexedDB + Background Sync)    │
├─────────────────────────────────────┤
│         REST API                    │
├─────────────────────────────────────┤
│     PostgreSQL + AD Auth            │
│    (Hospital Infrastructure)        │
└─────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | Next.js 16, React 19, TypeScript | |
| Styling | Tailwind CSS | |
| Database | SQLite (dev) → PostgreSQL (prod) | |
| ORM | Prisma 6 | |
| Auth | NextAuth → Windows/AD | Seamless auth goal |
| Charts | Recharts | Installed, not yet used |
| Excel | ExcelJS | Installed, not yet used |
| Offline | idb (IndexedDB) | Installed, not yet used |

---

## Data Model

### Current Schema

```
User
├── id, email, name, password, role
└── Sessions[]

Client
├── id, name, identifier, notes
├── Behaviors[]
│   └── id, name, description, color
└── Sessions[]
    └── id, sessionDate, userId
        └── Intervals[]
            └── behaviorId, intervalIndex, value
```

**Interval values:**
- `ind` - Behavior occurred (indicated)
- `err` - Observed, no behavior (error-free)
- `skip` - Not observed (skipped)

### Future Schema Additions

[TODO: What additional data will the full platform need?]

---

## Authentication Strategy

### Philosophy

> "I do not like making users login if I don't have to. I prefer to use what I know about them already to identify them and determine privileges. If the application can see their already logged-in credentials, I can tell who they are from that and make it seamless - open the app and they are in and authenticated without a separate layer of logging in."

### Implementation Plan

**Phase 1 (Current):** NextAuth with demo credentials
**Phase 2+:** Windows/Active Directory integration
- Users logged into hospital computers are auto-authenticated
- No separate login screen
- Role determined from AD groups

### Technical Approach

[TODO: Research Windows Integrated Auth / LDAP options]

---

## CentralReach Comparison

### What CentralReach Does Well

[TODO]

### What CentralReach Does Poorly (for TBI/ABA)

[TODO]

### Features to Replicate

[TODO]

### Features to Skip

[TODO]

### Features to Improve

[TODO]

---

## Open Questions

*Questions to answer before building further:*

### About the TBI/ABA Model
1. What makes Craig Hospital's approach unique?
2. What behaviors are most commonly tracked?
3. How are interventions documented?

### About Workflows
4. Walk me through a typical RBT day
5. What happens during BCBA supervision?
6. What reports do you currently generate?

### About CentralReach
7. What do you hate about CentralReach?
8. What would you miss if we replaced it?
9. What does CR do that you don't actually need?

### About Deployment
10. Where will this run? Hospital servers? Cloud?
11. Who needs to approve new software?
12. What's the IT coordination process?

---

## Appendix

### Glossary

| Term | Definition |
|------|------------|
| **ABA** | Applied Behavior Analysis |
| **BCBA** | Board Certified Behavior Analyst |
| **RBT** | Registered Behavior Technician |
| **TBI** | Traumatic Brain Injury |
| **NRT** | Neurorehabilitation Team |
| **Scatterplot** | Grid showing when behaviors occur by time of day |
| **Interval** | 15-minute time period in scatterplot |

### References

- [CentralReach](https://centralreach.com/) - Current system
- Craig Hospital Neurorehabilitation Team documentation

---

*This document will evolve as we gather more requirements. Use Mobile Claude to brainstorm sections marked [TODO].*
