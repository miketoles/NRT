# CLAUDE.md - CentralReach Integration

---

## Project Overview

**Name:** CentralReach API Integration
**Purpose:** Explore integration possibilities with CentralReach EMR for hospital internal tools
**Status:** Exploratory - no API credentials yet
**Path:** `~/dev/CR`

---

## What is CentralReach?

CentralReach is a practice management and EMR platform for autism and IDD care. Used for:
- Client/patient management
- Employee/staff management
- Scheduling
- Billing and claims
- Clinical documentation

---

## API Quick Reference

### Authentication
```
Token endpoint: https://login.centralreach.com/connect/token
Grant type: client_credentials
Scope: cr-api
```

### Making Requests
```
Base URL: https://partners-api.centralreach.com/enterprise/v1/
Headers:
  - Authorization: Bearer <JWT>
  - x-api-key: {CR API Key}
  - Content-Type: application/json
```

### Available Domains
- Contacts (Employees, Clients)
- Scheduling
- Billing & Claims
- Payors
- Labels

---

## Project Structure

```
~/dev/CR/
├── docs/                    # API documentation from CentralReach
│   ├── Getting Started with API Integration Guide.pdf
│   ├── CentralReach - Next Gen APIs.pdf
│   └── CentralReach Platform API Demo Deck.pptx
├── STATUS.md               # Current status
└── CLAUDE.md               # This file
```

---

## Potential Use Cases

1. **ScatterplotCreator sync** - Pull client list from CR
2. **Scheduling dashboard** - View appointments without logging into CR
3. **Data export** - Custom reports and analytics
4. **Mini-apps integration** - Mobile views for floor staff

---

## Resources

- [CentralReach API Docs](https://centralreach.com/resources/api/)
- [CR Community](https://community.centralreach.com/)
- Local docs: `~/dev/CR/docs/`
