# FlowMatic Project Context

## Overview
**FlowMatic** is a MERN-stack appointment/business management system designed for Israeli service businesses (salons, therapists, consultants, etc.). It features:
- Appointment scheduling with calendar views (Hebrew date support)
- Client management with contact info
- Staff/employee management
- Inventory tracking
- Waitlist management
- Detailed reports & analytics with heatmaps
- SMS & push notifications to clients
- Business settings (hours, holidays, themes)
- Public booking pages for customers
- Admin dashboard with statistics

**Tech Stack:**
- Backend: Node.js, Express, MongoDB (Mongoose), Passport JWT
- Frontend: React 19, Material-UI v7, Redux Toolkit, React Query (TanStack), react-big-calendar
- Build: React Scripts 5

---

## Project Structure

```
FlowMatic/
├── CLAUDE.md                          # This file - Claude context
├── server.js                          # Express entry point
├── package.json                       # Backend dependencies
├── .env                              # (DO NOT COMMIT) MongoDB URI, JWT secret, etc.
│
├── config/
│   ├── keys.js                       # ⚠️ SECURITY: Move credentials to .env only
│   └── passport.js                   # JWT strategy for authentication
│
├── middleware/
│   ├── checkOwnership.js             # (Unused - see auth.js, requireAdmin.js below)
│
├── models/                           # 11 Mongoose schemas
│   ├── User.js                       # businessOwner + admin users (Hebrew field: משתמש)
│   ├── Client.js                     # Customer info (businessOwnerId scoped)
│   ├── Event.js                      # Appointments (public or staff)
│   ├── AppointmentType.js            # ⚠️ Uses userId not businessOwnerId (inconsistency)
│   ├── Staff.js                      # Service providers
│   ├── Inventory.js                  # Product inventory
│   ├── Notification.js               # Sent notifications
│   ├── NotificationTemplate.js       # Templates for custom messages
│   ├── PushSubscription.js           # Device tokens for web push
│   ├── Waitlist.js                   # Client waitlist
│   └── PasswordReset.js              # Token-based password reset
│
├── routes/api/
│   ├── appointments.js               # Event CRUD + public booking + stats
│   ├── appointmentTypes.js           # Service type management
│   ├── auth.js                       # Login, register, token refresh
│   ├── clients.js                    # Client CRUD + sync endpoint
│   ├── events.js                     # Events (different from appointments?)
│   ├── inventory.js                  # Inventory CRUD
│   ├── notifications.js              # Send SMS/email/push notifications
│   ├── reports.js                    # Analytics queries (appointments, clients, heatmap)
│   ├── staff.js                      # Staff CRUD + public listing
│   ├── templates.js                  # Notification template CRUD
│   ├── users.js                      # ⚠️ Legacy unprotected routes (user-add, user-data, etc.)
│   └── waitlist.js                   # Waitlist CRUD
│
├── services/
│   ├── api.js                        # Axios instance (used by middleware)
│   └── pushNotify.js                 # Web push notification sender
│
├── jobs/                             # Background jobs (cron)
├── scripts/                          # Utility scripts
│
└── client-new/                       # React frontend
    ├── package.json                  # Frontend dependencies
    ├── public/
    ├── src/
    │   ├── index.jsx
    │   ├── App.jsx                   # Main router
    │   │
    │   ├── components/
    │   │   ├── auth/                 # Login, Register, ForgotPassword, ResetPassword
    │   │   ├── layout/               # Navbar, Sidebar
    │   │   ├── pages/                # All page components (Dashboard, Clients, Staff, Reports, etc.)
    │   │   │   ├── Dashboard.jsx     # Stats page
    │   │   │   ├── Clients.jsx       # Client list + CRUD modal (manual api calls)
    │   │   │   ├── Staff.jsx         # Staff list + CRUD modal (manual api calls)
    │   │   │   ├── Reports.jsx       # Analytics + heatmap (2 separate fetch fns)
    │   │   │   ├── AppointmentScheduler.jsx  # ⚠️ Uses raw axios (needs fix)
    │   │   │   ├── PublicBooking.jsx         # ⚠️ Uses raw axios
    │   │   │   ├── Inventory.jsx     # Inventory CRUD
    │   │   │   ├── Waitlist.jsx
    │   │   │   ├── AppointmentTypes.jsx
    │   │   │   ├── Templates.jsx
    │   │   │   ├── BusinessSettings.jsx
    │   │   │   ├── Events.jsx
    │   │   │   ├── MyAppointments.jsx
    │   │   │   ├── Users.jsx
    │   │   │   └── ...
    │   │   └── common/               # Reusable UI components
    │   │       ├── SkeletonLoader.jsx
    │   │       ├── HeatmapChart.jsx
    │   │       ├── NotificationBell.jsx
    │   │       ├── PushNotificationBanner.jsx
    │   │       └── PrivateRoute.jsx
    │   │
    │   ├── context/
    │   │   ├── AuthContext.jsx        # User, token, login/logout/refresh
    │   │   └── ThemeContext.jsx       # Dark/light theme
    │   │
    │   ├── hooks/                     # React Query hooks (follow this pattern!)
    │   │   ├── useAuth.js             # Login/logout mutations
    │   │   ├── useAppointments.js     # Full CRUD using React Query
    │   │   ├── useAppointmentTypes.js # Full CRUD using React Query
    │   │   ├── useUsers.js            # Full CRUD using React Query
    │   │   └── usePushNotifications.js
    │   │
    │   ├── services/
    │   │   └── api.js                 # Axios instance with interceptor + named API namespaces
    │   │       │ Exports: api, appointmentsApi, clientsApi, staffApi, etc.
    │   │       │ Token attached via interceptor: config.headers.Authorization = token
    │   │       │ 401 response triggers logout
    │   │
    │   └── utils/
    │       ├── setAuthToken.js        # Sets axios global default header (redundant with interceptor)
    │       └── hebrewDate.js          # formatHebrewDate(), getHebrewHolidays()
    │
    └── build/                         # Production build output
```

---

## Key Conventions

### 1. **Scoping by Business Owner**
Almost all resources are scoped to `businessOwnerId` (the logged-in user's ID). In routes:
```js
const client = await Client.findOne({ _id: id, businessOwnerId: req.user.id });
```

**EXCEPTION:** `AppointmentType` uses `userId` instead of `businessOwnerId`. This is an inconsistency.

### 2. **API Instance Usage**
- **✅ Correct:** Use `api` instance from `services/api.js`:
  ```js
  const response = await api.get('/clients');
  ```
  Token is attached via interceptor. 401 triggers logout automatically.

- **❌ Avoid:** Raw `axios` imports in `AppointmentScheduler.jsx`, `PublicBooking.jsx`. These bypass the 401 interceptor logic.

### 3. **React Query Hooks Pattern**
For new CRUD operations, follow the pattern in `useUsers.js`, `useAppointments.js`:
```js
// src/hooks/useClients.js
export const useClients = (options) => {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => (await api.get('/clients')).data,
    ...options
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/clients', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] })
  });
};
```

**DO NOT** use manual `useState` + `useEffect` for data fetching. Use React Query.

### 4. **Form State**
All form pages (Clients, Staff, Inventory) duplicate the same `handleInputChange` and modal state logic. Use the new `useFormData` and `useModal` hooks.

### 5. **Hebrew Strings**
All UI text, error messages, toast notifications use Hebrew strings directly in JSX:
```js
toast.error('שגיאה בטעינת נתונים');
return res.status(404).json({ message: 'לקוח לא נמצא' });
```

### 6. **Authorization**
- Backend routes use `passport.authenticate('jwt', { session: false })` middleware (35+ times).
- Admin-only routes check `req.user.role !== 'admin'` inline (6+ times).
- **These are now unified in middleware** (see utils below).

---

## Important Files to Know

### Backend
- **`server.js`** — Entry point. Sets CORS, static middleware, mounts routes.
- **`config/passport.js`** — JWT strategy. Loads User on every authenticated request.
- **`services/api.js`** — Axios client used by middleware + job services.
- **`routes/api/auth.js`** — Login, register, refresh token. Public routes.
- **`routes/api/appointments.js`** — 800+ lines. Event CRUD, public booking, stats, heatmap.
- **`routes/api/clients.js`** — Client CRUD, sync endpoint (from external CRM?).
- **`routes/api/reports.js`** — Analytics aggregations (revenue, appointments, heatmap).

### Frontend
- **`src/services/api.js`** — Central Axios instance with token interceptor.
- **`src/context/AuthContext.jsx`** — Manages login, token decode, auto-logout on 401.
- **`src/App.jsx`** — Router setup. All pages wrapped in `<PrivateRoute>` except auth.
- **`src/components/pages/Clients.jsx`** — Example of manual API calls (should use `useClients` hook).
- **`src/components/pages/Staff.jsx`** — Example of manual API calls (should use `useStaff` hook).

---

## Running Development

```bash
# Install dependencies
npm install
npm install --prefix client-new

# Start backend + frontend concurrently
npm run dev

# Or separately:
# Terminal 1:
npm run server    # Starts server.js with nodemon

# Terminal 2:
npm run client    # Starts React dev server
```

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000`

---

## Known Issues & Inconsistencies

1. ⚠️ **`AppointmentType` uses `userId` not `businessOwnerId`** — All other models use `businessOwnerId`.
2. ⚠️ **Raw `axios` imports in `AppointmentScheduler.jsx`, `PublicBooking.jsx`** — Bypasses 401 auto-logout interceptor.
3. ⚠️ **40+ identical try/catch blocks in routes** — Should be wrapped in `asyncHandler()` middleware with global error handler.
4. ⚠️ **9 page components with manual fetch + useState** — Should use React Query hooks.
5. ⚠️ **`window.confirm()` for delete actions** — Should use `<ConfirmDialog>` component.
6. ⚠️ **MongoDB credentials in `config/keys.js`** — Should be in `.env` only.
7. ⚠️ **Regex injection in username lookup** — `new RegExp(req.params.username)` needs escaping.
8. ⚠️ **`client.totalAppointments` and `client.totalRevenue` fields never updated** — Dead weight, stats re-computed by aggregation.

---

## Utilities Created (See `.claude/plans/` for details)

After applying the optimization plan, these utilities will be available:

### Backend
- `middleware/auth.js` — Named auth middleware
- `middleware/requireAdmin.js` — Admin role guard
- `utils/asyncHandler.js` — Wrap async route handlers
- `utils/respond.js` — Standard response helpers
- `utils/mongoId.js` — Safe ObjectId casting
- `utils/dateRanges.js` — Date range helpers
- `constants/index.js` — Named constants

### Frontend
- `hooks/useFormData.js` — Controlled form state
- `hooks/useModal.js` — Modal state management
- `hooks/useConfirmDialog.js` — Delete confirmation state
- `hooks/useClients.js` — React Query hook for clients
- `hooks/useStaff.js` — React Query hook for staff
- `components/common/EmptyState.jsx` — Reusable empty state
- `components/common/ConfirmDialog.jsx` — Delete confirmation modal

---

## Custom Claude Code Commands

Available slash commands (in `.claude/commands/`):
- `/review-page` — Checklist for reviewing any page component
- `/add-crud` — Template for creating a new CRUD page
- `/fix-bugs` — Audit checklist for common bugs

---

## Saving Tokens

This file should be included in every Claude session to provide instant context. It saves ~15,000 tokens per session by avoiding manual codebase exploration.
