# Implementation Plan: Profile Updates, Brand Email Enhancements & Ticket Chat Sidebars

We will implement three main sets of features:
1. **Self-Service Profile Management**: Allow users to edit their email, name, and phone. If they change their email, they will be logged out automatically and redirected to login with their new email.
2. **Branded Email Notification Enhancements**: Upgrade all transactional and OTP emails to use the primary Deep Navy Blue (`#123458`) corporate colors instead of default generic green (`#4CAF50`).
3. **Maintenance Ticket Chat (Discussion Board) Sidebar**: Integrate a slide-out chat sidebar on the right for each maintenance ticket, allowing `workshop_hod` and `worker` (and requesters) to chat on specific tickets, fully responsive on mobile and desktop.

---

## User Review Required

> [!IMPORTANT]
> - Self-profile changes will use a new backend route `PUT /orgs/:orgId/users/me/profile` which does not require admin privileges.
> - When a user changes their email, their session will be invalidated immediately. They must log back in using their new email and original password.
> - Transactional emails (OTP, booking approvals, canteen orders, maintenance updates) will be updated with deep navy borders and accents to match the MITAOE brand identity.
> - A chat sidebar will slide in from the right when the chat icon is clicked on any maintenance ticket. It will render comments as chat bubbles (right-aligned for self, left-aligned for others) and support adding new comments.

---

## Proposed Changes

### Backend APIs

#### [MODIFY] [userService.js](file:///d:/Projects/college-management/backend/src/services/userService.js)
Create `updateSelfProfile` service function:
- Locate user by `userId` and `orgId`.
- Allow editing `name`, `phone`, and `email`.
- Enforce unique email check across the database.

#### [MODIFY] [userController.js](file:///d:/Projects/college-management/backend/src/controllers/userController.js)
Export `updateSelfProfile` controller mapping `req.user.sub` to the service payload.

#### [MODIFY] [userRoutes.js](file:///d:/Projects/college-management/backend/src/routes/userRoutes.js)
Register:
- `router.put("/me/profile", updateSelfProfile);` before `router.put("/:userId")` to prevent it from matching as a parameter.

---

### Backend Branded Emails

#### [MODIFY] [emailTemplates.js](file:///d:/Projects/college-management/backend/src/utils/emailTemplates.js)
- Update CSS accents in `emailWrapper` and templates. Change green color codes (`#4CAF50`) and highlight borders to Deep Navy Blue (`#123458`).

---

### Frontend Profile & API

#### [MODIFY] [api.ts](file:///d:/Projects/college-management/frontend/src/lib/api.ts)
Add `updateSelf` method to `UserApi`:
```typescript
  updateSelf: (orgId: string, data: { name?: string; email?: string; phone?: string }) =>
    api.put(`/orgs/${orgId}/users/me/profile`, data),
```

#### [MODIFY] [MyProfile.tsx](file:///d:/Projects/college-management/frontend/src/pages/user/MyProfile.tsx)
- Re-architect from a read-only view to support editing.
- Display editable fields for Name, Email, and Phone.
- Add "Save Profile" and "Edit Profile" actions.
- On save, call `UserApi.updateSelf()`.
- If the email field is modified, execute `clearAuth()` and redirect the user to the login screen with a success toast saying: *"Profile updated. Please log in with your new email."*

---

### Maintenance Ticket Chat Sidebar

#### [MODIFY] [MaintenancePage.tsx](file:///d:/Projects/college-management/frontend/src/pages/maintenance/MaintenancePage.tsx)
- Add a floating/sliding panel `Right Chat Sidebar` triggered by a chat icon button.
- Make the chat icon visible on the ticket cards and detail dialog.
- The sidebar will:
  - Slide out from the right of the screen (occupying 400px width on desktop, 100% width on mobile).
  - List comments dynamically as styled chat messages.
  - Automatically scroll to the bottom when messages load.
  - Provide a chat message composer (input field + Send button).
  - Call `MaintenanceApi.addComment` to send messages.

---

## Verification Plan

### Automated Tests
- Type checking: `npx tsc -p tsconfig.app.json --noEmit` to verify type-safe compilation.
- Bundle check: `npm run build` to confirm output.

### Manual Verification
1. Login as HOD or Worker.
2. Edit name/phone in Profile, save, verify persistence.
3. Edit email, verify immediate logout, and log back in using the new email and old password. Verify booking history is intact.
4. Trigger a "Forgot Password" OTP, inspect email for Deep Navy theme and logo styling.
5. Go to Maintenance dashboard, click the chat icon on a ticket card, write messages, and confirm HOD and Worker can see messages in real-time bubbles.
