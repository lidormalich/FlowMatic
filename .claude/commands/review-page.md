# /review-page

Review a React page component against FlowMatic best practices.

When used, analyze the current file for:

1. **Data Fetching**
   - [ ] Uses React Query hook (useAppointments, useClients, etc.)?
   - [ ] If manual api calls, should use new useCrud hook?
   - [ ] Uses `api` instance from services, not raw `axios`?
   - [ ] Has proper loading state management?

2. **Form Handling**
   - [ ] Uses `useFormData` hook for form state?
   - [ ] Has `handleInputChange` - could be removed with hook?
   - [ ] Create/Edit modal pattern uses `useModal` hook?

3. **UI Components**
   - [ ] Uses `<SkeletonLoader>` while loading?
   - [ ] Has `<EmptyState>` component when no items?
   - [ ] Delete confirmation uses `<ConfirmDialog>`?
   - [ ] Modals are clean and reusable?

4. **Error Handling**
   - [ ] Catches API errors properly?
   - [ ] Shows user-friendly error messages?
   - [ ] No `window.confirm()` — should use ConfirmDialog?

5. **Code Quality**
   - [ ] No duplicate state/functions copied from other pages?
   - [ ] Proper cleanup in useEffect?
   - [ ] Responsive/mobile-friendly?

Provide specific recommendations for improvement.
