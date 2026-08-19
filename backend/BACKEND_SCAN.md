# Backend Scan Summary

> See [docs/CONVENTIONS.md](../docs/CONVENTIONS.md) for API/error/validation standards.

## Framework and Language

- **Framework**: Express.js (Node.js)
- **Language**: JavaScript (ES modules)
- **Database**: MongoDB via Mongoose
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **RBAC**: Permission matrix in `config/permissions.js` (`requirePermission`)

## Folder Structure

```
src/
├── booking/         # bookingConstants, bookingValidation, approvalFlowEngine, hallUtilityBridge
├── chatbot/         # intent, tools, prompt, dateTimeParse
├── config/          # db.js, env.js, permissions.js
├── controllers/     # thin HTTP handlers → services
├── middleware/      # auth.js, errorHandler.js, rateLimit.js
├── models/          # Booking, Category, Hall, MaintenanceTicket, Organization, Requisition, User, Utility, …
├── routes/          # feature routers mounted from routes/index.js
├── services/        # business logic
├── utils/           # emailService, timeSlotUtils, httpError, validation, object, logger, escapeRegex
├── workflows/       # maintenanceWorkflow, requisitionWorkflow
├── app.js
└── server.js
```

## Module Pattern

- **Routes** → `authMiddleware` + `requireOrgAccess` + `requirePermission` → controller
- **Controllers** → extract params/body, call service, `res.json()` / `next(err)`
- **Services** → business logic; throw `Error` with `.status` or use `createHttpError`
- **Models** → Mongoose schemas

## Roles (User model)

| Role | Notes |
|------|--------|
| super_admin | Platform-level |
| org_admin | Organization admin |
| coordinator | Utilities & approvals |
| hod, registrar, director | Booking approval chain |
| faculty | Org member (utility bookings and maintenance) |
| assistant | Canteen requisition orders only |
| workshop_hod | Workshop maintenance approvals |
| worker | Maintenance worker login |
| canteen_owner | Canteen fulfilment |

## Authentication

- **authMiddleware**: JWT Bearer → `req.user` (sub, email, role, organizationId)
- **requirePermission(...perms)**: 403 if role lacks any listed permission
- **requireOrgAccess**: super_admin or matching `organizationId`

## Response Format

| Case | Body |
|------|------|
| Success | Raw JSON entity/array (200/201) or 204 empty |
| Error | `{ message, code?, details?, stack? }` (dev only for stack) |
| Rate limit | 429 with `{ message }` |

Password reset and chatbot tool layers may use `{ success, message }` internally.

## Error Handling

- `errorHandler`: `err.status`, Mongoose validation/cast/duplicate, Mongo connection → 503
- Services: `utils/httpError.js` helpers (`badRequest`, `notFound`, …)

## Feature Areas

| Area | Routes prefix | Service |
|------|---------------|---------|
| Auth / password reset | `/api/auth` | authService, passwordResetService |
| Organizations | `/api/organizations` | organizationService |
| Users, categories, utilities | `/api/orgs/:orgId/...` | userService, categoryService, utilityService |
| Bookings | `/api/orgs/:orgId/bookings` | bookingService (+ `booking/`) |
| Halls (chat only) | — | hallBookingService → unified Booking model |
| Canteen menu & requisitions | `/api/orgs/:orgId/canteen-menu`, `requisitions` | requisitionService |
| Maintenance | `/api/orgs/:orgId/maintenance` | maintenanceService |
| Chat | `/api/chat` | chatbotService (Gemini) |

## Shared Utilities

- `utils/validation.js` — `validateDateOnly`, `validateObjectId`, `validateCustomFieldValues`
- `utils/department.js` — `normalizeDepartment`, `departmentMatches`, `resolveUserDepartment`
- `utils/object.js` — `pick`, `toObjectIdOrNull`
- `utils/escapeRegex.js` — safe user-input regex
- `utils/logger.js` — `createLogger("Module")`
- `utils/httpError.js` — typed HTTP errors

## Environment

Copy `backend/.env.example` → `.env`. Required: `MONGODB_URI`, `JWT_SECRET` (production). Optional: SMTP, `GEMINI_API_KEY`, `LOG_LEVEL`.
