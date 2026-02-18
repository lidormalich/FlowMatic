# /fix-bugs

Run a bug audit on modified files and identify common issues.

Check for these patterns:

## Common Bugs in FlowMatic

1. **window.confirm() usage**
   ```js
   ❌ const ok = window.confirm('Delete this?');
   ✅ Use <ConfirmDialog> component with useConfirmDialog hook
   ```

2. **Raw axios imports (should use api instance)**
   ```js
   ❌ import axios from 'axios';
      await axios.post('/api/events', data);

   ✅ import { api } from '../services/api';
      await api.post('/events', data);
   ```

3. **Unescaped regex from user input**
   ```js
   ❌ new RegExp('^' + req.params.username + '$', 'i')
   ✅ const escaped = req.params.username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      new RegExp('^' + escaped + '$', 'i')
   ```

4. **Magic numbers without constants**
   ```js
   ❌ if (owner.credits >= 2) { ... }  // What is 2?
   ✅ const { SMS_CREDITS_COST } = require('../constants');
      if (owner.credits >= SMS_CREDITS_COST) { ... }
   ```

5. **Falsy checks that block 0 or empty string updates**
   ```js
   ❌ if (price) client.price = price;  // Won't set to 0
   ✅ if (price !== undefined) client.price = price;  // Allows 0
   ```

6. **Token not sent with "Bearer " prefix**
   ```js
   ❌ config.headers.Authorization = token;
   ✅ config.headers.Authorization = `Bearer ${token}`;
   ```

7. **Hardcoded MongoDB credentials in source**
   ```js
   ❌ // config/keys.js
      const mongoURI = 'mongodb+srv://admin:PASSWORD@cluster.mongodb.net/flowmatic';

   ✅ // Use .env only
      const mongoURI = process.env.MONGODB_URI;
   ```

8. **Manual try/catch on every route**
   ```js
   ❌ router.get('/', (req, res) => {
        try {
          // ...
        } catch (err) {
          res.status(500).json({ message: 'שגיאת שרת' });
        }
      });

   ✅ const asyncHandler = require('../utils/asyncHandler');
      router.get('/', asyncHandler(async (req, res) => {
        // No try/catch needed
      }));
   ```

9. **Duplicated form state in multiple pages**
   ```js
   ❌ // In Clients.jsx, Staff.jsx, Inventory.jsx...
      const [formData, setFormData] = useState({});
      const handleInputChange = (e) => { ... };  // Copied code

   ✅ // Use the hook
      const { formData, handleInputChange, resetForm } = useFormData(initialState);
   ```

10. **AppointmentType using userId instead of businessOwnerId**
    ```js
    ❌ await AppointmentType.findOne({ userId: req.user.id });  // Wrong field
    ✅ await AppointmentType.findOne({ businessOwnerId: req.user.id });
    ```

## Audit Checklist

When reviewing code changes, look for:
- [ ] No `window.confirm()` in React components
- [ ] No raw `axios` imports in frontend
- [ ] No hardcoded credentials in source files
- [ ] No magic numbers without `const` labels
- [ ] All async route handlers wrapped in `asyncHandler`
- [ ] All `if` statements checking fields use `!== undefined` for updates
- [ ] Auth routes use `auth` middleware, not inline `passport.authenticate`
- [ ] All resource ownership checks use consistent field name (businessOwnerId)
- [ ] React Query used for data fetching, not manual useState + useEffect
- [ ] Form pages use `useFormData` hook
- [ ] Modal pages use `useModal` hook
- [ ] Delete actions use `useConfirmDialog` hook

Run this check before committing changes.
