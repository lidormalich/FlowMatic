# FlowMatic - תכנון מערכת ניהול תורים

## 📋 סקירה כללית

מערכת SaaS לניהול תורים שמאפשרת לבעלי עסקים לנהל יומן תורים ולאפשר ללקוחות לקבוע תורים דרך קישור ציבורי.

---

## 👥 רמות משתמשים

### 1. Client (לקוח)

- יכול לקבוע תורים דרך קישור ציבורי
- לא צריך להתחבר למערכת
- מקבל אישור SMS (אופציונלי)

### 2. Business Owner (בעל עסק)

- יש לו username ייחודי (URL ציבורי: `/USER/:username`)
- מנהל את סוגי התורים שלו
- רואה ומנהל את כל התורים שלו
- יכול לבטל/לאשר תורים
- מקבל התראות SMS על תורים חדשים
- יש לו מערכת קרדיטים (כל תור עולה קרדיט)
- יכול להגדיר שעות עבודה
- יכול להגדיר תיאור עסק
- יכול להעלות תמונה לעסק
- יכול לקשר את חשבון גוגל שלו ולבחור את היומן שיתעדכן לתורים

### 3. Admin (מנהל מערכת)

- רואה את כל המשתמשים
- יכול להוסיף/להסיר/להשעות משתמשים
- יכול להוסיף/להסיר קרדיטים למשתמשים
- רואה סטטיסטיקות כלליות
- גישה לכל התכונות

---

## 🎯 תכונות מרכזיות

### 📱 דף ציבורי לקביעת תורים (`/:username`)

**מה צריך להיות בדף:**

- [ ] כותרת עם שם העסק ותיאור
- [ ] פרטי קשר (טלפון, כתובת)
- [ ] בחירת סוג תור (grid של כרטיסים)
  - שם השירות
  - משך זמן
  - מחיר
  - תיאור
- [ ] בחירת תאריך (calendar picker)
  - חסימת תאריכים עבר
  - חסימת ימים שלא עובדים
  - הצגת תאריך עברי
- [ ] בחירת שעה מתוך שעות פנויות
  - חישוב אוטומטי לפי משך התור
  - הצגת רק שעות פנויות
- [ ] טופס פרטי לקוח
  - שם מלא
  - טלפון
  - אימייל (אופציונלי)
  - הערות (אופציונלי)
- [ ] כפתור אישור ושמירה
- [ ] הודעת הצלחה עם פרטי התור
- [ ] אפשרות להוסיף ליומן (Google Calendar, iCal)

### 🏢 דשבורד בעל עסק

**תכונות:**

- [ ] סטטיסטיקות
  - מספר תורים החודש
  - מספר תורים היום
  - קרדיטים נותרים
  - הכנסות החודש (אם יש מחירים)
- [ ] תורים קרובים (היום + מחר)
- [ ] קישורים מהירים
  - הקישור הציבורי שלי
  - ניהול סוגי תורים
  - יומן תורים
  - הגדרות

### 📅 ניהול תורים (Events)

**תכונות:**

- [ ] תצוגת לוח שנה (Calendar View)
  - תצוגת חודש/שבוע/יום
  - צבעים לפי סוג תור
  - RTL support
- [ ] רשימת תורים (List View)
  - פילטר לפי תאריך
  - פילטר לפי סטטוס
  - פילטר לפי סוג תור
  - חיפוש לפי שם לקוח/טלפון
- [ ] פעולות על תור
  - צפייה בפרטים
  - עריכה (שעה, תאריך)
  - ביטול
  - סימון כהגיע / לא הגיע
  - שליחת SMS תזכורת
- [ ] הוספת תור ידנית

### ⚙️ ניהול סוגי תורים (Appointment Types)

**תכונות:**

- [ ] רשימת סוגי תורים
  - grid/table עם כל הסוגים
- [ ] הוספת סוג תור חדש
  - שם השירות
  - תיאור
  - משך זמן (בדקות)
  - מחיר (אופציונלי)
  - צבע (לקלנדר)
- [ ] עריכת סוג תור
- [ ] מחיקה (soft delete - השבתה)
- [ ] הפעלה/השבתה מהירה

### 👥 ניהול משתמשים (Admin בלבד)

**תכונות:**

- [ ] טבלת משתמשים
  - שם
  - אימייל
  - username
  - role
  - credits
  - סטטוס (פעיל/מושעה)
  - תאריך הצטרפות
- [ ] פעולות
  - הוספת משתמש חדש
  - עריכת משתמש
  - השעיה/ביטול השעיה
  - הוספת/הסרת קרדיטים
  - מחיקה
- [ ] פילטרים
  - לפי role
  - לפי סטטוס
  - חיפוש

### 🔔 מערכת SMS (sms4free)

**תכונות:**

- [ ] שליחת SMS לאישור תור ללקוח
- [ ] שליחת SMS תזכורת (24 שעות לפני)
- [ ] שליחת SMS לבעל העסק על תור חדש
- [ ] ניהול תבניות SMS
- [ ] היסטוריית SMS שנשלחו
- [ ] ניהול קרדיטים SMS

### 💳 מערכת קרדיטים

**לוגיקה:**

- [ ] כל תור שנקבע = -1 קרדיט
- [ ] כשנגמרים הקרדיטים - חסימת קביעת תורים חדשים
- [ ] אדמין יכול להוסיף קרדיטים
- [ ] התראה ל-business owner כשנותרו 10 קרדיטים
- [ ] דף "קנה קרדיטים" (אינטגרציה עם תשלומים בעתיד)

### ⚙️ הגדרות עסק

**תכונות:**

- [ ] פרטי עסק
  - שם העסק
  - תיאור
  - כתובת
  - טלפון
  - לוגו (העלאת תמונה)
- [ ] שעות עבודה
  - ימי עבודה (checkboxes)
  - שעת התחלה
  - שעת סיום
  - הפסקות (אופציונלי)
- [ ] הגדרות SMS
  - הפעלה/כיבוי
  - שעות לפני התזכורת
  - תבנית הודעה
- [ ] הגדרות כלליות
  - אורך ברירת מחדל לתור
  - זמן מינימלי בין תורים
  - כמה זמן מראש אפשר לקבוע

---

## 🗄️ מבנה Database

### Users Collection

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  username: String (unique, lowercase),
  password: String (hashed),
  role: String (client/business_owner/admin),
  credits: Number (default: 0),
  isActive: Boolean (default: true),
  isSuspended: Boolean (default: false),
  businessName: String,
  businessDescription: String,
  businessAddress: String,
  businessLogo: String (URL),
  businessHours: {
    startHour: Number,
    endHour: Number,
    workingDays: [Number], // 0=Sunday, 6=Saturday
    breaks: [{start: String, end: String}]
  },
  phoneNumber: String,
  smsNotifications: {
    enabled: Boolean,
    reminderHoursBefore: Number,
    messageTemplate: String
  },
  settings: {
    defaultAppointmentDuration: Number,
    minTimeBetweenAppointments: Number,
    maxAdvanceBookingDays: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### AppointmentTypes Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: Users),
  name: String,
  description: String,
  duration: Number (minutes),
  price: Number,
  color: String (hex color),
  isActive: Boolean,
  order: Number, // for sorting
  createdAt: Date
}
```

### Appointments Collection (Events)

```javascript
{
  _id: ObjectId,
  businessOwnerId: ObjectId (ref: Users),
  appointmentTypeId: ObjectId (ref: AppointmentTypes),
  customerName: String,
  customerEmail: String,
  customerPhone: String,
  customerId: ObjectId (ref: Users, optional),
  date: Date,
  startTime: String,
  endTime: String,
  duration: Number,
  status: String (pending/confirmed/cancelled/completed/no_show),
  notes: String,
  service: String,
  price: Number,
  smsSent: Boolean,
  smsReminderSent: Boolean,
  createdAt: Date,
  updatedAt: Date,
  cancelledAt: Date,
  cancelReason: String
}
```

### SMS History Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: Users),
  appointmentId: ObjectId (ref: Appointments),
  phoneNumber: String,
  message: String,
  type: String (confirmation/reminder/cancellation),
  status: String (sent/failed),
  sentAt: Date,
  provider: String (sms4free),
  cost: Number
}
```

### Credits History Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: Users),
  amount: Number (positive=added, negative=used),
  reason: String,
  description: String,
  relatedAppointment: ObjectId (ref: Appointments, optional),
  performedBy: ObjectId (ref: Users, for admin actions),
  createdAt: Date
}
```

---

## 🎨 עיצוב UI/UX

### צבעים

- Primary: `#667eea` (סגול-כחול)
- Secondary: `#764ba2` (סגול כהה)
- Success: `#10b981` (ירוק)
- Warning: `#f59e0b` (כתום)
- Danger: `#ef4444` (אדום)
- Info: `#3b82f6` (כחול)

### קומפוננטים

- כל הקומפוננטים עם Tailwind CSS
- RTL support מלא
- Responsive (mobile-first)
- אנימציות חלקות
- Loading states
- Error handling

---

## 🔐 Authentication & Authorization

### Routes Protection

```
Public Routes:
- /login
- /register
- /:username (public booking)

Private Routes (requires login):
- /dashboard
- /events
- /appointment-types
- /settings

Admin Only:
- /users
- /system-settings
- /credits-management
```

### Role-based Access

- Middleware בצד שרת לבדיקת role
- Frontend גם בודק ומסתיר/מציג תכונות

---

## 📡 API Endpoints

### Users

- `POST /api/users/register` - הרשמה
- `POST /api/users/login` - התחברות
- `GET /api/users` - רשימת משתמשים (admin)
- `GET /api/users/:id` - פרטי משתמש
- `PUT /api/users/:id` - עדכון משתמש
- `DELETE /api/users/:id` - מחיקת משתמש (admin)
- `POST /api/users/:id/suspend` - השעיה (admin)
- `POST /api/users/:id/credits` - הוספת/הסרת קרדיטים (admin)
- `GET /api/users/public/:username` - פרטי עסק ציבוריים

### Appointment Types

- `GET /api/appointment-types` - סוגי תורים של המשתמש
- `GET /api/appointment-types/user/:username` - סוגי תורים ציבוריים
- `POST /api/appointment-types` - יצירת סוג תור
- `PUT /api/appointment-types/:id` - עדכון
- `DELETE /api/appointment-types/:id` - מחיקה

### Appointments

- `GET /api/appointments` - תורים של המשתמש
- `GET /api/appointments/:id` - פרטי תור
- `POST /api/appointments` - קביעת תור חדש
- `PUT /api/appointments/:id` - עדכון תור
- `DELETE /api/appointments/:id` - ביטול תור
- `GET /api/appointments/available-times` - שעות פנויות
- `POST /api/appointments/:id/send-reminder` - שליחת SMS תזכורת

### SMS

- `POST /api/sms/send` - שליחת SMS
- `GET /api/sms/history` - היסטוריית SMS
- `GET /api/sms/balance` - יתרת SMS

### Credits

- `GET /api/credits/history` - היסטוריית קרדיטים
- `POST /api/credits/add` - הוספת קרדיטים (admin)

---

## 🚀 סדר יישום מומלץ

### Phase 1 - Core (נעשה חלקית) ✅

- [x] Setup project
- [x] User authentication
- [x] Database models
- [x] Basic routing
- [ ] Convert all to Tailwind

### Phase 2 - Business Owner Features

- [ ] ניהול סוגי תורים (CRUD)
- [ ] יומן תורים (Calendar view)
- [ ] הגדרות עסק
- [ ] Dashboard עם סטטיסטיקות

### Phase 3 - Public Booking

- [ ] דף ציבורי /:username מלא ומעוצב
- [ ] חישוב שעות פנויות
- [ ] קביעת תור עם ולידציות
- [ ] אישור ותצוגת הצלחה

### Phase 4 - Admin Features

- [ ] ניהול משתמשים מלא
- [ ] ניהול קרדיטים
- [ ] Dashboard אדמין

### Phase 5 - SMS Integration

- [ ] אינטגרציה עם sms4free
- [ ] שליחת אישורים
- [ ] שליחת תזכורות
- [ ] ניהול תבניות

### Phase 6 - Advanced Features

- [ ] סטטיסטיקות מתקדמות
- [ ] Export data (Excel/CSV)
- [ ] Email notifications
- [ ] Payment integration

---

## 📝 הערות טכניות

### Performance

- Caching של שעות פנויות
- Debounce בחיפוש
- Lazy loading של קומפוננטים
- Pagination ברשימות

### Security

- Rate limiting על API
- Input validation (client + server)
- SQL Injection prevention
- XSS prevention
- CSRF tokens

### Testing

- Unit tests לפונקציות קריטיות
- Integration tests ל-API
- E2E tests למסלולים מרכזיים

---

**האם התכנון נראה טוב? יש משהו להוסיף או לשנות?**
