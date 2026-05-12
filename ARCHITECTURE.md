# FlowMatic — Project Context & Architecture Document

*Version: 1.0 | Date: 2026-05-12 | Author: Senior Full-Stack Architect (Claude Code)*

---

## Table of Contents

1. [Executive Summary & Core Business Logic](#1-executive-summary--core-business-logic)
2. [Architecture & Tech Stack](#2-architecture--tech-stack)
3. [Database Schema & Data Models](#3-database-schema--data-models)
4. [API Structure & State Management](#4-api-structure--state-management)
5. [UI/UX & Design System](#5-uiux--design-system)
6. [Page-by-Page Breakdown](#6-page-by-page-breakdown)
7. [Cross-Cutting Concerns](#7-cross-cutting-concerns)
8. [Known Issues & Technical Debt](#8-known-issues--technical-debt)

---

## 1. Executive Summary & Core Business Logic

### What FlowMatic Does

FlowMatic is a **multi-tenant SaaS appointment & business management platform** purpose-built for Israeli service businesses — salons, therapists, consultants, clinics, and similar services. Each registered business owner gets an isolated workspace and a **public-facing booking page** (e.g. `/book/mybusiness`) where their customers can self-book appointments online.

### The Three User Roles

| Role | Hebrew Context | Capabilities |
|---|---|---|
| `business_owner` | עסק | Full workspace: calendar, clients, staff, inventory, analytics, settings |
| `client` | לקוח | Views own appointment history, can self-cancel via link |
| `admin` | מנהל מערכת | Full super-admin: manage all businesses, view platform-wide KPIs, system logs |

### Core Business Workflows

**1. Business Onboarding**
A new user registers → JWT issued → redirected to `/onboarding` wizard → sets business name, type, services, working hours, theme colors → `User.isOnboarded = true` and default `AppointmentType` records are created.

**2. Public Customer Booking**
Customer visits `/book/:username` → picks service → optionally picks a staff member → picks a date (with Hebrew calendar overlay if enabled) → system calls `/api/appointments/available/:username` to compute free slots (accounting for business hours, existing bookings, break times, buffer zones, min gaps) → customer enters name/phone/email → appointment created → `cancelToken` issued for self-service management.

**3. Self-Service Cancellation / Rescheduling**
Customer uses a link containing their `cancelToken` to visit `/manage-booking/:token` → can cancel without logging in.

**4. Business Operator Day-to-Day**
Logs in → Dashboard shows KPIs and quick-action cards → uses the calendar (Events page) to manage all appointments → Clients page tracks full client history and spend → Reports page shows revenue charts and heatmap analytics → can export CSV.

**5. Admin Platform Oversight**
Super-admin logs in → `/admin` shows all business owners with aggregated stats, growth rates, engagement → can drill into any business, view audit logs, suspend/unsuspend users, manage credits and subscription status.

---

## 2. Architecture & Tech Stack

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React 19 SPA (Vite)                │
│   Material UI v7 · Redux Toolkit · TanStack Query    │
│   RTL Hebrew  ·  Recharts  ·  react-big-calendar     │
└────────────────────────┬────────────────────────────┘
                         │ REST API (JSON / CSV)
                    HTTPS (CORS)
                         │
┌────────────────────────▼────────────────────────────┐
│            Express 4 + Passport JWT                  │
│       Rate Limiting · Audit Logger · Winston         │
│  Multer (uploads) · Cloudinary (image storage)       │
│       nodemailer (email) · web-push (PWA push)       │
│               node-cron (background jobs)            │
└────────────────────────┬────────────────────────────┘
                         │ Mongoose 9
┌────────────────────────▼────────────────────────────┐
│                    MongoDB Atlas                      │
│  12 Collections · TTL indexes · compound indexes     │
└─────────────────────────────────────────────────────┘
```

### Backend Stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | LTS |
| Web framework | Express | 4.17 |
| ODM | Mongoose | 9.1 |
| Auth | Passport + passport-jwt | 4.0 |
| Token | jsonwebtoken | 8.5 |
| Password | bcryptjs | 2.4 |
| Validation | Joi | 18.0 |
| Email | nodemailer | 8.0 |
| Push | web-push | 3.6 (VAPID) |
| File upload | multer | in-memory |
| Image CDN | Cloudinary SDK | 2.10 |
| Exports | json2csv | 6.0-alpha |
| Logging | winston + winston-mongodb | 3.19 |
| Jobs | node-cron | 4.2 |
| Dates | moment | 2.30 |
| Calendar invites | ical-generator | 10.0 |
| Rate limiting | express-rate-limit | 8.2 |

### Frontend Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React | 19.2 |
| Build tool | Vite + @vitejs/plugin-react | 5.4 |
| Routing | react-router-dom | 6.30 |
| State (global) | Redux Toolkit + react-redux | 2.11 / 9.2 |
| State (server) | TanStack React Query | 5.90 |
| UI library | Material UI (MUI) v7 | 7.3 |
| Styling | @emotion/react + styled | 11.14 |
| HTTP client | axios | 1.13 |
| Charts | Recharts | 3.7 |
| Calendar | react-big-calendar | 1.19 |
| Toasts | react-toastify | 11.0 |
| Hebrew dates | @hebcal/core + hebcal | 6.0 / 2.3 |
| Date utilities | date-fns | 4.1 |
| Token decode | jwt-decode | 4.0 |

### Deployment

- **Backend:** Render (Node.js service), `npm run build` installs both root and client deps then builds React
- **Frontend:** Served as static files from `client-new/build/` via Express `static` middleware
- **Database:** MongoDB Atlas (connection URI in `.env`)
- **Images:** Cloudinary (profile images, appointment type images)

---

## 3. Database Schema & Data Models

All collections are in a single MongoDB database. All business-scoped documents are keyed by `businessOwnerId` (ref: `users`), with one notable exception (AppointmentType uses `userId` — see Known Issues).

---

### `users` — Business owners, admins, and clients

```
_id                     ObjectId
name                    String (required)
email                   String (required, unique)
username                String (required, unique, lowercase)
password                String (hashed, bcrypt 10)
role                    enum ['client', 'business_owner', 'admin']  default: 'client'
credits                 Number  default: 0
isActive                Boolean  default: true
isSuspended             Boolean  default: false

// Business profile
businessName            String
businessDescription     String
businessAddress         String
businessType            String
profileImage            String (Cloudinary URL)

// Business hours configuration
businessHours: {
  startHour             Number  (e.g. 9)
  endHour               Number  (e.g. 18)
  workingDays           [Number]  (0=Sun … 6=Sat)
  slotInterval          Number  (minutes, e.g. 30)
  breakTime: {
    enabled             Boolean
    startHour           Number
    startMinute         Number
    endHour             Number
    endMinute           Number
  }
  minGapMinutes         Number
  bufferMinutes         Number
  flexibleSlots         Boolean  (5-min grid vs duration-grid)
  daySchedules: {       // per-day overrides
    0: { enabled, startHour, endHour }  // Sunday
    … 6                                 // Saturday
  }
}

// SMS
phoneNumber             String
smsNotifications: {
  enabled               Boolean
  reminderHoursBefore   Number  default: 24
}

// Theme
themeSettings: {
  primaryColor          String  (hex)
  secondaryColor        String  (hex)
  logoUrl               String
  coverImage            String
}

// Cancellation policy
cancellationPolicy: {
  enabled               Boolean
  hoursBefore           Number
}

// Hebrew calendar
showHebrewDate          Boolean
showHebrewDateInBooking Boolean
hebrewCalendar: {
  showHolidays          Boolean
  showShabbat           Boolean
  showEvents            Boolean
}

// Subscription
subscription: {
  status                enum ['trial','active','suspended','expired']
  trialEndsAt           Date
  subscribedAt          Date
  notes                 String
}

// Terms of service
tos: {
  agreedAt              Date
  version               String
  ip                    String
}

// Usage analytics (incremented by routes)
usageStats: {
  appointmentsCreated   Number
  appointmentsCancelled Number
  clientsAdded          Number
  smsSent               Number
  lastActionAt          Date
}

lastLoginAt             Date
loginCount              Number  default: 0
createdAt               Date
updatedAt               Date
```

---

### `events` — All appointments

```
_id                     ObjectId
businessOwnerId         ref: users (required)
appointmentTypeId       ref: appointmentTypes (optional)
staffId                 ref: staff (optional)

// Customer info (denormalized for speed)
customerName            String (required)
customerEmail           String
customerPhone           String (required)
customerId              ref: users (optional — if customer has account)

// Time
date                    Date (required)
startTime               String  "HH:mm"
endTime                 String  "HH:mm"
duration                Number  (minutes)

// Status
status                  enum ['pending','confirmed','cancelled','completed','no_show','blocked']

// Content
description             String
location                String
service                 String  (text fallback)
services                [String]  (additional services array — upsell)
price                   Number

// Recurrence
isRecurring             Boolean
recurrenceRule: {
  frequency             enum ['weekly','biweekly','monthly']
  endDate               Date
}
recurrenceGroupId       String  (shared ID for recurring series)

// Self-service link
cancelToken             String (indexed)

// Notification flags
smsSent                 Boolean
smsReminderSent         Boolean
reminderNotificationSent Boolean
reminderDayBeforeSent   Boolean

createdAt               Date
updatedAt               Date
```

---

### `clients` — CRM records scoped to a business

```
_id                     ObjectId
businessOwnerId         ref: users
name                    String
phone                   String (required)
email                   String
notes                   String
tags                    [String]  (e.g. 'VIP', 'מאחר כרוני', 'חייב כסף', 'חדש', 'קבוע')
isBlocked               Boolean
blockedReason           String

// Cached stats (updated by routes / aggregation)
totalAppointments       Number
totalRevenue            Number
lastAppointmentDate     Date

Compound unique index: { businessOwnerId, phone }
```

---

### `appointmenttypes` — Services offered by a business

```
_id                     ObjectId
userId                  ref: users  ⚠️ (should be businessOwnerId)
name                    String (required)
description             String
category                String
duration                Number (minutes, required)
price                   Number
color                   String  default: '#667eea'
images                  [String]  (max 3 URLs, validated in Hebrew)
relatedServices         [ref: appointmentTypes]  (for upselling)
isActive                Boolean  default: true
createdAt               Date
```

---

### `staff` — Employees / service providers

```
_id                     ObjectId
businessOwnerId         ref: users
name                    String (required)
role                    String  default: 'Employee'
phone                   String
email                   String
color                   String  (for calendar display)
isActive                Boolean
services                [ref: appointmentTypes]  (which services they provide)
createdAt               Date
```

---

### `inventory` — Product stock tracking

```
_id                     ObjectId
businessOwnerId         ref: users
name                    String (required)
unit                    String  default: 'יחידות'
currentStock            Number
minStock                Number  (threshold for low-stock alert)
costPerUnit             Number
isActive                Boolean
createdAt               Date
```

---

### `waitlist` — Queue entries per business

```
_id                     ObjectId
businessOwnerId         ref: users
clientName              String (required)
clientPhone             String
clientEmail             String
serviceId               ref: appointmentTypes
preferredDate           Date
preferredTimeRange: {
  start                 String  "HH:mm"
  end                   String  "HH:mm"
}
notes                   String
status                  enum ['pending','notified','booked','cancelled']
createdAt               Date
```

---

### `notifications` — In-app notifications

```
_id                     ObjectId
userId                  ref: users (indexed)
type                    enum ['reminder','status_change','message','update']
title                   String
body                    String
relatedAppointmentId    ref: events
isRead                  Boolean  default: false
createdAt               Date (indexed)

Compound indexes: {userId, createdAt desc}, {userId, isRead}
```

---

### `notificationtemplates` — Custom message templates

```
_id                     ObjectId
businessOwnerId         ref: users
type                    enum ['email','sms']
name                    String  (e.g. 'confirmation', 'reminder')
subject                 String  (email only)
body                    String
isActive                Boolean

Unique compound index: {businessOwnerId, type, name}
```

---

### `pushsubscriptions` — Web Push device tokens

```
_id                     ObjectId
userId                  ref: users
subscription: {
  endpoint              String
  keys: {
    p256dh              String
    auth                String
  }
}
createdAt               Date

Unique compound index: {userId, subscription.endpoint}
```

---

### `auditlogs` — Full audit trail

```
_id                     ObjectId
userId                  ref: users (indexed)
action                  String (indexed)  e.g. 'create', 'update', 'delete'
resource                String (indexed)  e.g. 'appointment', 'client', 'user'
resourceId              ObjectId
details                 Mixed  (diff or extra data)
ip                      String
userAgent               String
timestamp               Date (indexed)

Compound indexes: {userId, timestamp desc}, {timestamp desc}
```

---

### `passwordresets` — One-time reset tokens

```
_id                     ObjectId
userId                  ref: users
token                   String (unique, hashed SHA256)
expiresAt               Date
used                    Boolean  default: false
createdAt               Date

TTL index: auto-delete expired records
```

---

### Collection Relationships

```
users
  ├─── events (businessOwnerId)
  ├─── clients (businessOwnerId)
  ├─── appointmenttypes (userId ⚠️)
  ├─── staff (businessOwnerId)
  ├─── inventory (businessOwnerId)
  ├─── waitlist (businessOwnerId)
  ├─── notificationtemplates (businessOwnerId)
  ├─── pushsubscriptions (userId)
  ├─── notifications (userId)
  ├─── auditlogs (userId)
  └─── passwordresets (userId)

events
  ├─── appointmenttypes (appointmentTypeId)
  └─── staff (staffId)

staff
  └─── appointmenttypes (services[])

waitlist
  └─── appointmenttypes (serviceId)

notifications
  └─── events (relatedAppointmentId)
```

---

## 4. API Structure & State Management

### Base URL & Auth

All API routes are under `/api`. Protected routes require:
```
Authorization: Bearer <JWT>
```

The JWT is decoded from `localStorage.jwtToken` by the Axios interceptor in `client-new/src/services/api.js`. Any `401` response automatically calls `logout()` from `AuthContext`.

Rate limit: **1000 requests / 15 minutes per IP** across all `/api/*` routes.

---

### API Endpoints Reference

#### Auth & Users (`/api/users`, `/api/auth`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/users/register` | None | Register new user; returns JWT |
| POST | `/users/login` | None | Login; updates lastLoginAt, loginCount; returns JWT |
| GET | `/users/check-username/:username` | None | Check availability |
| GET | `/users/public/:username` | None | Public business profile |
| GET | `/users/profile` | JWT | Own profile |
| PUT | `/users/:id` | JWT | Update profile (admin can update anyone) |
| DELETE | `/users/:id` | JWT + Admin | Hard delete |
| POST | `/users/:id/suspend` | JWT + Admin | Toggle suspend |
| POST | `/users/:id/credits` | JWT + Admin | Adjust credits |
| PUT | `/users/:id/subscription` | JWT + Admin | Update subscription |
| PUT | `/users/onboarding` | JWT | Complete onboarding wizard |
| POST | `/users/upload-profile-image` | JWT | Multer → Cloudinary |
| GET | `/users/admin/stats` | JWT + Admin | Platform-wide KPIs |
| GET | `/users/admin/business/:id` | JWT + Admin | Business drill-down |
| GET | `/users/admin/system-logs` | JWT + Admin | Winston log viewer |
| POST | `/auth/forgot-password` | None | Send reset email |
| POST | `/auth/reset-password` | None | Consume reset token |
| GET | `/auth/verify-reset-token/:token` | None | Validate token |

#### Appointments (`/api/appointments`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/appointments` | JWT | All appointments for business |
| GET | `/appointments/stats` | JWT | KPIs: count, revenue, daily data |
| GET | `/appointments/available/:username` | None | Available time slots (query: date, duration?, staffId?) |
| POST | `/appointments` | JWT | Create appointment |
| POST | `/appointments/public/:username` | None | Public self-booking |
| PUT | `/appointments/:id` | JWT | Update status/time/customer info |
| DELETE | `/appointments/:id` | JWT | Cancel with SMS |
| POST | `/appointments/recurring` | JWT | Create recurring series |
| DELETE | `/appointments/recurring/:groupId` | JWT | Cancel entire series |
| GET | `/appointments/my-bookings` | JWT | Client's own bookings |
| POST | `/appointments/:id/cancel` | None | Self-cancel by phone match |
| POST | `/appointments/block-range` | JWT | Block date/time ranges |

**Slot Calculation Algorithm** (at `GET /appointments/available/:username`):
1. Load `User.businessHours` (start/end hours, workingDays, slotInterval, breakTime, minGapMinutes, bufferMinutes, flexibleSlots, daySchedules).
2. Check if requested date is a working day (per-day override checked first).
3. Query all `events` for `businessOwnerId` on that date with `status` in `['pending','confirmed','blocked']`. If `staffId` provided, filter further.
4. Build a grid of candidate slots (either `slotInterval`-based or 5-min grid if `flexibleSlots`).
5. Exclude slots that: overlap existing appointments (plus buffer zone), fall within break time, conflict with `minGapMinutes` padding.
6. Return array of available `"HH:mm"` strings.

#### Appointment Types (`/api/appointment-types`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/appointment-types` | JWT | Own types (active, sorted by createdAt desc) |
| GET | `/appointment-types/user/:username` | None | Public types for business page |
| POST | `/appointment-types` | JWT | Create |
| PUT | `/appointment-types/:id` | JWT | Update |
| DELETE | `/appointment-types/:id` | JWT | Soft delete (isActive=false) |

#### Clients (`/api/clients`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/clients` | JWT | All clients (searchable by name/phone/email), with aggregated stats |
| GET | `/clients/:id` | JWT | Single client + full appointment history + analytics |
| PUT | `/clients/:id` | JWT | Update |
| POST | `/clients/sync` | JWT | Derive clients from appointment data (creates missing Client records) |
| POST | `/clients/import` | JWT | CSV bulk import via Multer |

#### Staff (`/api/staff`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/staff` | JWT | All staff |
| POST | `/staff` | JWT | Create |
| PUT | `/staff/:id` | JWT | Update |
| DELETE | `/staff/:id` | JWT | Delete |
| GET | `/staff/by-service/:serviceId` | JWT | Staff for specific service |
| GET | `/staff/public/:username` | None | Public: active staff list |

#### Reports (`/api/reports`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/reports/revenue` | JWT | Revenue by period (query: range=month/year), KPIs, type distribution, 30-day daily activity |
| GET | `/reports/heatmap` | JWT | Appointment count by day-of-week × hour-of-day |
| GET | `/reports/export/appointments` | JWT | CSV download |
| GET | `/reports/export/clients` | JWT | CSV download |

#### Inventory (`/api/inventory`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/inventory` | JWT | Active items sorted by name |
| GET | `/inventory/low-stock` | JWT | Items below minStock threshold |
| POST | `/inventory` | JWT | Create item |
| PUT | `/inventory/:id` | JWT | Update item |
| PUT | `/inventory/:id/adjust` | JWT | Adjust stock ± amount |
| DELETE | `/inventory/:id` | JWT | Soft delete |

#### Other Resources

| Resource | Endpoints | Auth Notes |
|---|---|---|
| Waitlist | GET, POST public, PUT status, DELETE | Public join endpoint |
| Templates | GET (auto-creates defaults), PUT | JWT protected |
| Notifications | GET, mark read, unread-count, push subscribe/unsubscribe, VAPID key | VAPID key public |

---

### Frontend State Management

**Two complementary layers:**

#### 1. TanStack React Query (Server State)
Used for all async data. The pattern established in `hooks/useAppointments.js` and `hooks/useUsers.js`:

```js
// Query
useQuery({ queryKey: ['appointments'], queryFn: () => appointmentsApi.getAll().then(r => r.data) })

// Mutation with cache invalidation
useMutation({
  mutationFn: (data) => appointmentsApi.create(data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] })
})
```

Query keys in use: `['appointments']`, `['appointmentTypes']`, `['users']`, `['clients']`, `['staff']`, `['inventory']`, `['waitlist']`, `['templates']`, `['notifications']`

#### 2. Redux Toolkit (Global UI State)
Handles: currently-authenticated user object, UI preferences. Used alongside `AuthContext` (which owns the raw JWT lifecycle).

#### 3. AuthContext (React Context)
Owns: token read/write to `localStorage`, JWT decode, `isAuthenticated`, `fetchUserProfile()`, `logout()`.

On mount: reads `localStorage.jwtToken` → decodes with `jwt-decode` → checks expiry → calls `GET /users/profile` to hydrate `user` object.

#### 4. ThemeContext (React Context)
Owns: `isDark` boolean (persisted to `localStorage`, defaults to `prefers-color-scheme`). Toggles MUI `createTheme()` between light and dark palettes. Applies `class="dark"` to `document.documentElement` for any CSS-var-based custom styling.

---

### Axios Service Layer (`client-new/src/services/api.js`)

Single Axios instance created with `baseURL: /api`. Two interceptors:

- **Request:** Reads `localStorage.jwtToken`, sets `Authorization: Bearer <token>`.
- **Response:** On `401`, calls `AuthContext.logout()` and redirects to `/login`.

Named namespaces exported (all consume the shared instance):
`appointmentsApi`, `appointmentTypesApi`, `reportsApi`, `businessApi`, `clientsApi`, `staffApi`, `inventoryApi`, `waitlistApi`, `templatesApi`, `usersApi`, `authApi`, `notificationsApi`

---

## 5. UI/UX & Design System

### Visual Language

**Primary Accent:** Business owners can customize `primaryColor` and `secondaryColor` in Business Settings — these are applied dynamically on the `/book/:username` public page via `createTheme()`. The admin dashboard and internal app use a consistent neutral palette with MUI defaults.

**Default color:** `#667eea` (periwinkle blue) is the default appointment type color.

### Layout Shell

All private pages share the same layout:

```
┌─ Navbar ────────────────────────────────────┐
│ Logo | Greeting + Role Badge + Credits Badge │
│                        Bell | Dark Toggle | Logout │
├─ Sidebar ──┬─ Main Content ─────────────────┤
│ Menu items  │                                │
│ (role-based)│  <Page Component>              │
│             │                                │
│ [mobile:    │                                │
│  bottom     │                                │
│  drawer]    │                                │
└─────────────┴────────────────────────────────┘
```

**Sidebar menu items (role-filtered):**

| Menu Item | Role |
|---|---|
| Dashboard | all |
| Users | admin |
| Events (Calendar) | business_owner, admin |
| Appointment Types | business_owner, admin |
| Clients | business_owner, admin |
| Reports | business_owner, admin |
| Staff | business_owner, admin |
| Waitlist | business_owner, admin |
| Inventory | business_owner, admin |
| Templates | business_owner, admin |
| Notification Center | admin |
| Admin Dashboard | admin |
| My Appointments | all |
| Settings | business_owner, admin |

**Public pages** (`/book/:username`, `/manage-booking/:token`, `/onboarding`) render without Navbar or Sidebar.

### RTL & Hebrew

- All user-facing text is written directly as Hebrew strings in JSX (no i18n library).
- Layout direction: `dir="rtl"` applied at root — MUI handles RTL mirroring automatically.
- `moment.locale('he')` for Hebrew date formatting.
- Hebrew calendar dates displayed via `@hebcal/core` + custom `utils/hebrewDate.js` helpers: `formatHebrewDate()`, `getHebrewHolidays()`.
- Toast notifications use Hebrew strings: e.g. `toast.error('שגיאה בטעינת נתונים')`.

### Component Library

All UI components come from **MUI v7** (`@mui/material`). Key components in use:

- `DataGrid` / `Table` — client lists, staff lists, inventory
- `Dialog` / `Modal` — create/edit/delete modals throughout
- `TextField`, `Select`, `DatePicker` — forms
- `Chip` — tags, status badges
- `Card`, `CardContent` — dashboard KPI cards
- `AppBar`, `Drawer` — Navbar and Sidebar
- `Tabs` — multi-tab pages (Business Settings, Reports)
- `Skeleton` — loading states via `SkeletonLoader.jsx`
- `Tooltip`, `IconButton` — actions in tables
- `Snackbar` / `Alert` — in addition to react-toastify

### Charts & Data Visualizations

All charts use **Recharts**:
- `LineChart` / `BarChart` — revenue over time (Reports page)
- `PieChart` / `RadialBarChart` — appointment type distribution
- `Sparkline` (mini line) — Dashboard quick stats
- `HeatmapChart.jsx` (custom component using Recharts cells) — day-of-week × hour matrix

### Calendar

`react-big-calendar` (Events page) in three views:
- `month` — monthly overview with color-coded events
- `week` — weekly grid
- `day` — single-day detail

Events are color-coded by `appointmentType.color` or `staff.color`.

### Theme (Dark Mode)

`ThemeContext` wraps the app in MUI's `ThemeProvider`. Dark/light toggled by the Navbar switch. Persisted to `localStorage`.

---

## 6. Page-by-Page Breakdown

### Public Pages (No Auth Required)

---

#### `/` — Landing Page (`LandingPage.jsx`)
- **Purpose:** Marketing/home page for unauthenticated visitors.
- **Features:** Platform description, CTA buttons linking to `/register` and `/login`. If user is already authenticated, redirected to `/dashboard`.
- **Components:** Static marketing content, MUI `Button`, `Typography`.

---

#### `/login` — Login (`auth/Login.jsx`)
- **Purpose:** Authenticate existing users.
- **Features:** Email + password form. Links to `/forgot-password` and `/register`. On success: JWT stored, user redirected to `/dashboard` (or `/onboarding` if not yet onboarded).
- **State:** `useAuth()` hook → `loginMutation` (TanStack `useMutation`). After auth: `promptPushAfterAuth` triggers push notification opt-in flow.
- **Components:** MUI `TextField`, `Button`, `Alert`.

---

#### `/register` — Registration (`auth/Register.jsx`)
- **Purpose:** Create a new business owner account.
- **Features:** Name, email, username (availability check via `/check-username/:username`), password, ToS agreement checkbox. On success: JWT issued, redirect to `/onboarding`.
- **State:** `useAuth()` → `registerMutation`. ToS acceptance timestamped server-side.
- **Components:** `TextField`, `Checkbox`, `Link` (to `/terms`), `Button`.

---

#### `/forgot-password` — Forgot Password (`auth/ForgotPassword.jsx`)
- **Purpose:** Initiate password reset via email.
- **Features:** Email input form. Server sends a reset link. UI shows success regardless of whether email exists (security).
- **State:** Direct `authApi.forgotPassword()` call.

---

#### `/reset-password/:token` — Reset Password (`auth/ResetPassword.jsx`)
- **Purpose:** Consume one-time reset token from email link.
- **Features:** Token verified on mount. New password + confirm fields. On success: redirect to `/login`.
- **State:** `authApi.verifyResetToken()` on mount, `authApi.resetPassword()` on submit.

---

#### `/terms` — Terms of Service (`TermsOfService.jsx`)
- **Purpose:** Static TOS document display.
- **Features:** Scrollable legal text, "Back" navigation.

---

#### `/book/:username` — Public Booking (`pages/PublicBooking.jsx`)
- **Purpose:** Customer-facing self-booking wizard for a business. No login required.
- **Features (multi-step wizard):**
  1. **Service selection** — Lists active appointment types with name, duration, price. Supports **upsell** for related/additional services (stored in `event.services[]`).
  2. **Staff selection** — If business has multiple active staff, customer picks their preferred provider. If only one or none, step is skipped.
  3. **Date picker** — Calendar showing working days only (grayed-out non-working). If `showHebrewDateInBooking` is enabled, shows Hebrew date alongside Gregorian. If `hebrewCalendar.showHolidays` enabled, holidays are marked.
  4. **Time slot selection** — Calls `GET /appointments/available/:username?date=X&duration=Y&staffId=Z`. Renders available slots as buttons.
  5. **Customer details form** — Name (required), phone (required), email (optional).
  6. **Confirmation** — `POST /appointments/public/:username` — success screen with cancel link.
- **Dynamic branding:** Applies `businessOwner.themeSettings.primaryColor` / `secondaryColor` to `createTheme()`. Shows `logoUrl` in header.
- **Cancellation policy notice** shown if `cancellationPolicy.enabled` is true.
- **State:** All local `useState`. Fetches: `usersApi.getPublicProfile`, `appointmentTypesApi.getByUsername`, `staffApi.getPublic`, `appointmentsApi.getAvailable`.

---

#### `/manage-booking/:token` — Manage Booking (`pages/ManageBooking.jsx`)
- **Purpose:** Self-service reschedule or cancel using the `cancelToken` from confirmation.
- **Features:** Shows appointment details. Cancel button posts to `POST /appointments/:id/cancel` with phone verification.
- **State:** Local state, no auth.

---

#### `/AppointmentScheduler` — Appointment Scheduler (`pages/AppointmentScheduler.jsx`)
- **Purpose:** Internal calendar-style scheduler (alternate view). Note: uses raw `axios` instead of centralized `api` instance.
- **Features:** Calendar view, appointment creation. Partially overlaps with Events page.
- **Known Issue:** Uses raw `axios` — bypasses 401 interceptor.

---

### Private Pages (JWT Required)

---

#### `/onboarding` — Onboarding Wizard (`pages/OnboardingWizard.jsx`)
- **Purpose:** Guided first-time setup for new business owners. Shown once (checked via `User.isOnboarded`).
- **Features (multi-step):**
  1. Business name, type, description, address.
  2. Services offered (creates `AppointmentType` records).
  3. Working hours setup (days, start/end hours, slot interval, breaks).
  4. Theme customization (colors, logo upload).
  - On complete: `PUT /users/onboarding` → sets `isOnboarded = true`.
- **Layout:** No Navbar/Sidebar. Standalone wizard UI.

---

#### `/dashboard` — Dashboard (`pages/Dashboard.jsx`)
- **Purpose:** Overview/home page after login.
- **Features:**
  - KPI cards: total appointments this month, revenue, clients, upcoming, cancellation rate, no-show rate.
  - **Quick-action cards** (role-filtered): direct links with icons to all major sections.
  - **Sparkline chart** (mini 30-day trend line) per KPI card.
- **Data:** `GET /appointments/stats`.
- **State:** Direct `useQuery`.

---

#### `/events` — Events Calendar (`pages/Events.jsx`)
- **Purpose:** The primary appointment management view for business owners.
- **Features:**
  - **Calendar** (react-big-calendar) in month/week/day views.
  - Events color-coded by appointment type or staff color.
  - Optional Hebrew date overlay in calendar cells (if `showHebrewDate` enabled).
  - **Filters:** status, appointment type, staff member, text search.
  - **Create appointment modal:** date/time, customer info, service, staff, price, notes.
  - **Edit appointment modal:** update status, reschedule, edit notes, customer info.
  - **Block date/time modal:** `POST /appointments/block-range` for holidays, vacations.
  - **Recurring appointment creation:** frequency (weekly/biweekly/monthly), end date.
  - **Cancel recurring series:** deletes all events in `recurrenceGroupId`.
  - **Per-appointment client notes** — inline editable.
- **State:** TanStack `useQuery` for appointments, types, clients, staff. Mutations for CRUD.
- **Components:** react-big-calendar, MUI Dialog, DatePicker, Select, TextField.

---

#### `/clients` — Clients (`pages/Clients.jsx`)
- **Purpose:** CRM — full client database for the business.
- **Features:**
  - Searchable table (name, phone, email) with pagination.
  - Per-client chips for tags: `VIP`, `מאחר כרוני`, `חייב כסף`, `חדש`, `קבוע`.
  - **Create/Edit client modal:** name, phone, email, notes, tags, blocked toggle.
  - **Delete client** (with confirm).
  - **Client history drawer/modal:** all past appointments with service, date, status, price. KPIs: total visits, total spend, average interval between visits, top services.
  - **Sync clients from appointments:** `POST /clients/sync` — auto-creates Client records from event history.
  - **CSV export:** `GET /reports/export/clients`.
  - **CSV import:** `POST /clients/import` — Multer upload, parses CSV, bulk create/update.
- **State:** Uses `clientsApi` directly with local `useState` (noted as not yet using React Query hook — known tech debt).

---

#### `/reports` — Reports & Analytics (`pages/Reports.jsx`)
- **Purpose:** Business intelligence — revenue, appointments, client trends.
- **Features:**
  - **Revenue over time:** Line or bar chart, configurable for last month or last year.
  - **Appointment type distribution:** Pie chart showing breakdown by service.
  - **Daily activity sparkline:** Always shows 30-day window.
  - **KPI cards with growth rates:** Total revenue, completed, cancelled, no-show counts vs. previous period.
  - **Heatmap:** `HeatmapChart.jsx` — appointment density by day-of-week (0–6) × hour-of-day (grid). Helps identify peak times.
  - **Export buttons:** Download CSV for appointments (`/reports/export/appointments`) and clients (`/reports/export/clients`).
- **State:** Two separate fetch functions (one for revenue/KPIs, one for heatmap). Uses `reportsApi`.

---

#### `/staff` — Staff Management (`pages/Staff.jsx`)
- **Purpose:** Manage employees/service providers.
- **Features:**
  - Staff list: name, role, phone, color swatch, assigned services.
  - **Create/Edit modal:** name, role, phone, email, color picker, service assignment (multi-select from appointmentTypes).
  - **Delete** with confirm.
  - Color is used in the Events calendar for color-coding by staff member.
- **State:** Direct API calls with local `useState` (noted tech debt — should use `useStaff` hook).

---

#### `/appointment-types` — Appointment Types (`pages/AppointmentTypes.jsx`)
- **Purpose:** Manage services/service packages.
- **Features:**
  - List: name, duration, price, color chip, active status.
  - **Create/Edit modal:** name, description, category, duration (minutes), price, color picker, related services (for upsell), image upload (up to 3 images → Cloudinary).
  - **Soft delete:** sets `isActive = false`.
- **State:** `useAppointmentTypes()` hook (TanStack Query).

---

#### `/inventory` — Inventory (`pages/Inventory.jsx`)
- **Purpose:** Track product stock levels.
- **Features:**
  - Item list: name, unit, current stock, min stock threshold, cost per unit.
  - **Low-stock alert badge** when `currentStock < minStock`.
  - **Create/Edit modal:** all fields.
  - **Stock adjustment:** +/- amount input (min 0 enforced).
  - **Soft delete:** `isActive = false`.
- **State:** Direct `inventoryApi` calls with local `useState`.

---

#### `/waitlist` — Waitlist (`pages/Waitlist.jsx`)
- **Purpose:** Manage queue of clients waiting for an appointment slot.
- **Features:**
  - Waitlist table: client name, phone, service, preferred date/time range, status.
  - **Status update:** `PUT /waitlist/:id` — change status to `pending / notified / booked / cancelled`.
  - **Delete entry.**
  - New entries added by customers via `POST /waitlist/public/:username` (public endpoint).
- **State:** Direct `waitlistApi` calls with local `useState`.

---

#### `/templates` — Notification Templates (`pages/Templates.jsx`)
- **Purpose:** Customize SMS and email message templates sent to clients.
- **Features:**
  - Lists templates by type (email / SMS) and name (confirmation / reminder).
  - If no templates exist, `GET /templates` auto-creates default ones.
  - **Edit modal:** subject (email only), body text (with template variable hints), active toggle.
  - Preview of rendered template.
- **State:** Direct `templatesApi` calls.

---

#### `/settings` — Business Settings (`pages/BusinessSettings.jsx`)
- **Purpose:** Master configuration for the business owner's workspace.
- **Features (tabbed):**
  - **General:** Business name, type, description, address.
  - **Hours:** Start/end hour sliders, working days checkboxes (Sun–Sat), slot interval, break time (enabled, start/end), min gap minutes, buffer minutes, flexible slots toggle.
  - **Per-day overrides:** Enable/disable and set custom hours for each individual day of the week.
  - **SMS:** Enable/disable, reminder hours before appointment.
  - **Cancellation policy:** Enable, set hours before appointment (minimum).
  - **Theme:** Primary/secondary color pickers, logo upload (→ Cloudinary), cover image upload.
  - **Hebrew calendar:** Toggle showHebrewDate, showHebrewDateInBooking, holidays, Shabbat, events.
- **State:** Loads `usersApi.getProfile()`, submits `usersApi.update()`.

---

#### `/my-appointments` — My Appointments (`pages/MyAppointments.jsx`)
- **Purpose:** Available to all authenticated users (including clients). Shows the logged-in user's personal appointment history.
- **Features:**
  - List of own appointments: service, business name, date, time, status.
  - Self-cancel option (generates cancel link using `cancelToken`).
- **State:** `appointmentsApi.getMyBookings()` → `GET /appointments/my-bookings`.

---

#### `/users` — User Management (`pages/Users.jsx`)
- **Purpose:** Admin-only page to manage all platform users.
- **Features:**
  - Full user list: name, email, role, credits, subscription status, last login.
  - Search and sort.
  - **Suspend/Unsuspend:** `POST /users/:id/suspend`.
  - **Edit credits:** `POST /users/:id/credits` (add/subtract).
  - **Update subscription:** `PUT /users/:id/subscription` (status + notes).
- **State:** `useUsers()` TanStack Query hook.

---

#### `/admin` — Admin Dashboard (`pages/AdminDashboard.jsx`)
- **Purpose:** Super-admin overview of entire platform.
- **Features:**
  - **Platform KPIs:** Business growth rate, appointment growth, no-show rate, cancellation rate, avg appointments per business, platform conversion rate.
  - **Business owner list:** All businesses with: totalAppointments, completedAppointments, revenue, appointmentsThisMonth, loginCount, lastLoginAt, usageStats.
  - **Business drill-down modal:** click any business → shows last 10 appointments, last 50 audit log entries, engagement metrics.
  - **System logs viewer:** `GET /users/admin/system-logs` — filter by level (error/warn/info), paginated.
- **State:** `usersApi.getAdminStats()`, `usersApi.getAdminBusiness(id)`.

---

#### `/notification-center` — Notification Center (`pages/NotificationCenter.jsx`)
- **Purpose:** Admin broadcast & notification history.
- **Features:**
  - Notification history log (all sent notifications).
  - **Broadcast message** to all users or selected users.
  - Admin-specific notification stream.
- **State:** `notificationsApi.adminHistory()`, `notificationsApi.adminBroadcast()`.

---

### Shared / Utility Components

| Component | Location | Purpose |
|---|---|---|
| `PrivateRoute` | `common/PrivateRoute.jsx` | HOC — checks `isAuthenticated`, redirects to `/login` |
| `NotificationBell` | `common/NotificationBell.jsx` | Bell icon in Navbar; shows unread badge; dropdown list |
| `PushNotificationBanner` | `common/PushNotificationBanner.jsx` | Banner prompting push opt-in (dismissible) |
| `SkeletonLoader` | `common/SkeletonLoader.jsx` | Generic skeleton placeholder during data fetches |
| `HeatmapChart` | `common/HeatmapChart.jsx` | Recharts-based 7×24 appointment density heatmap |
| `Navbar` | `layout/Navbar.jsx` | Top bar: logo, greeting, role/credits badges, bell, dark mode, logout |
| `Sidebar` | `layout/Sidebar.jsx` | Left drawer (RTL: right drawer), role-filtered menu, mobile bottom sheet |

---

## 7. Cross-Cutting Concerns

### Authentication & Authorization

- **JWT** signed with `process.env.JWT_SECRET`, 1-year expiry.
- All protected routes: `passport.authenticate('jwt', { session: false })` (defined in `middleware/auth.js`).
- Admin routes also check `req.user.role !== 'admin'` — returns `403`.
- Business-owner data scoping: every query filters by `businessOwnerId: req.user.id`.
- Password resets: SHA256-hashed token, 1-hour TTL, single-use flag.

### Audit Logging

`middleware/auditLogger.js` is applied globally. On every successful `POST/PUT/PATCH/DELETE` (response status < 400):
- Maps URL path to resource name.
- Creates an `AuditLog` record with `userId`, `action`, `resource`, `resourceId`, `ip`, `userAgent`.
- Used in Admin Dashboard drill-down.

### Notifications

Three notification channels:
1. **In-app** (`/api/notifications`) — stored in `notifications` collection, surfaced by `NotificationBell`.
2. **SMS** — via `smsNotifications` settings; sent on appointment creation/cancellation.
3. **Web Push (PWA)** — `usePushNotifications` hook registers service worker at `/sw-push.js`, subscribes device. `pushNotify.js` service sends via `web-push` VAPID.

### Background Jobs (`node-cron`)

Located in `jobs/` directory. Handles:
- Appointment reminders (day-before + hour-before) — sets `reminderDayBeforeSent` / `smsReminderSent` flags.
- Subscription expiry checks.

### Image Uploads

`multer` used for in-memory file handling. Files passed to `cloudinary.uploader.upload()`. Limits:
- Profile image: max 2MB, `image/*` only, 400×400 Cloudinary transform.
- Appointment type images: max 3 per type.

### CSV Export/Import

- Export: `json2csv` converts Mongoose query results to CSV, set `Content-Type: text/csv`, streamed to client.
- Import (clients): `multer` reads CSV upload, parses rows, `upsert` by `{businessOwnerId, phone}`.

---

## 8. Known Issues & Technical Debt

| # | Issue | Severity | Files Affected |
|---|---|---|---|
| 1 | `AppointmentType` uses `userId` instead of `businessOwnerId` | High | `models/AppointmentType.js`, all appointmentTypes routes |
| 2 | Raw `axios` in `AppointmentScheduler.jsx` and `PublicBooking.jsx` — bypasses 401 auto-logout interceptor | Medium | `pages/AppointmentScheduler.jsx`, `pages/PublicBooking.jsx` |
| 3 | 40+ identical try/catch blocks in route files — no global `asyncHandler` | Medium | All `routes/api/*.js` |
| 4 | 9 page components use manual `useState` + `useEffect` for data fetching instead of React Query hooks | Medium | `Clients.jsx`, `Staff.jsx`, `Inventory.jsx`, `Waitlist.jsx`, `Templates.jsx`, et al. |
| 5 | `window.confirm()` for delete actions — blocks UI thread | Low | Multiple pages |
| 6 | MongoDB credentials may exist in `config/keys.js` in addition to `.env` | Security | `config/keys.js` |
| 7 | `new RegExp(req.params.username)` without escaping — potential ReDoS/regex injection | Security | `routes/api/users.js` |
| 8 | `Client.totalAppointments` and `Client.totalRevenue` fields never updated — stats re-computed via aggregation | Low | `models/Client.js` |
| 9 | `events.js` route file exists but is **not mounted** in `server.js` | Medium | `routes/api/events.js`, `server.js` |
| 10 | `middleware/checkOwnership.js` is unused — auth done inline in routes | Low | `middleware/checkOwnership.js` |

---

*This document was generated from full source-code analysis of the FlowMatic repository. It covers 12 Mongoose models, 60+ API endpoints across 11 route files, 24 page components, 5 custom hooks, 4 middleware files, and all shared utilities.*
