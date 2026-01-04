# Setup & Integration Checklist

Complete this checklist to fully integrate the Account Settings and Safety Features.

## Phase 1: Verify All Files Created ✓

### Frontend Files
- [x] `client/src/pages/Settings.jsx`
- [x] `client/src/components/MessageStatus.jsx`
- [x] `client/src/components/MessageActions.jsx`
- [x] `client/src/components/ChatManagement.jsx`

### Backend Files
- [x] `server/controllers/safetyController.js`
- [x] `server/routes/safetyRoutes.js`
- [x] `server/models/BlockList.js`
- [x] `server/models/Report.js`
- [x] `server/models/User.js` (updated)
- [x] `server/models/Message.js` (updated)
- [x] `server/routes/userRoutes.js` (updated)
- [x] `server/server.js` (updated)

### Documentation Files
- [x] `ACCOUNT_SETTINGS_IMPLEMENTATION.md`
- [x] `SETTINGS_INTEGRATION_STEPS.md`
- [x] `IMPLEMENTATION_SUMMARY_SETTINGS.md`
- [x] `COMPONENT_INTEGRATION_EXAMPLES.md`
- [x] `SETUP_CHECKLIST.md` (this file)

---

## Phase 2: Backend Setup

### 2.1 Verify Routes Registration
- [ ] Open `server/server.js`
- [ ] Confirm `import safetyRouter from "./routes/safetyRoutes.js"` is present
- [ ] Confirm `app.use('/api/safety', safetyRouter)` is registered
- [ ] Confirm `userRouter` still includes settings endpoints

### 2.2 Verify Models are Updated
- [ ] Check `server/models/User.js` has `privacy_settings`, `notification_settings`, `account_settings`
- [ ] Check `server/models/Message.js` has status fields: `sent`, `delivered`, `read`, `read_by`, `delivered_to`, `deleted_by`, `is_deleted`
- [ ] Verify `server/models/BlockList.js` exists
- [ ] Verify `server/models/Report.js` exists

### 2.3 Verify Controllers
- [ ] Check `server/controllers/safetyController.js` has all 9 exported functions:
  - [ ] `blockUser`
  - [ ] `unblockUser`
  - [ ] `getBlockedUsers`
  - [ ] `reportUser`
  - [ ] `reportPost`
  - [ ] `deleteMessageForMe`
  - [ ] `deleteMessageForEveryone`
  - [ ] `clearChat`
  - [ ] `getMessageInfo`
  - [ ] `updateUserSettings`
  - [ ] `deleteAccount`

### 2.4 Test Backend Routes
Run these commands to test endpoints:

```bash
# Test blocking user
curl -X POST http://localhost:4000/api/safety/block \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"blockedUserId": "USER_ID"}'

# Expected response:
# {"success": true, "message": "User blocked successfully"}

# Test getting blocked users
curl -X GET http://localhost:4000/api/safety/blocked-users \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected response:
# {"success": true, "blockedUsers": [...]}

# Test reporting user
curl -X POST http://localhost:4000/api/safety/report/user \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reportedUserId": "USER_ID",
    "reason": "harassment",
    "description": "This user is harassing me"
  }'

# Test updating settings
curl -X POST http://localhost:4000/api/user/settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "privacy": {"dmFromEveryone": true},
    "notifications": {"messageNotifications": true},
    "account": {"allowAIFeatures": true}
  }'
```

- [ ] All endpoints respond with 200 status
- [ ] No 404 errors
- [ ] Authentication working

---

## Phase 3: Frontend Setup

### 3.1 Verify Components Exist
- [ ] `client/src/pages/Settings.jsx` exists
- [ ] `client/src/components/MessageStatus.jsx` exists
- [ ] `client/src/components/MessageActions.jsx` exists
- [ ] `client/src/components/ChatManagement.jsx` exists

### 3.2 Add Settings Route
In your main router file (e.g., `client/src/App.jsx`):

```jsx
import Settings from '@/pages/Settings'

// Add to your route configuration:
<Route path="/settings" element={<Settings />} />
```

- [ ] Import Settings component
- [ ] Add route to router
- [ ] Can navigate to /settings
- [ ] Settings page loads without errors

### 3.3 Add Settings Link to Navigation
In your navigation component:

```jsx
import { Settings } from 'lucide-react'
import { Link } from 'react-router-dom'

// Add link:
<Link to="/settings" className="...">
  <Settings size={20} />
  Settings
</Link>
```

- [ ] Settings link visible in navigation
- [ ] Clicking link navigates to settings page
- [ ] Link is properly styled

### 3.4 Verify Toast Notifications
Make sure `react-hot-toast` is installed:

```bash
npm install react-hot-toast
```

In your main app file:

```jsx
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <>
      <Toaster position="top-right" />
      {/* Rest of app */}
    </>
  )
}
```

- [ ] Toast package installed
- [ ] Toaster component added to App.jsx
- [ ] Toast position set (top-right recommended)

---

## Phase 4: Component Integration

### 4.1 Integrate Message Status
In your chat/message display component:

```jsx
import MessageStatus from '@/components/MessageStatus'

// In your message render:
{isOwn && <MessageStatus message={message} />}
```

- [ ] Import MessageStatus component
- [ ] Add to message bubble (right side only)
- [ ] Status indicators show correctly
- [ ] Colors are correct (gray for sent/delivered, blue for read)

### 4.2 Integrate Message Actions
In your chat/message display component:

```jsx
import MessageActions from '@/components/MessageActions'

// In your message render:
<MessageActions 
  message={message}
  isOwn={isOwn}
  onDelete={handleMessageDeleted}
  onReport={handleReported}
  onBlock={handleBlocked}
/>
```

- [ ] Import MessageActions component
- [ ] Add to message bubble
- [ ] Menu button visible on hover
- [ ] All actions work without errors
- [ ] Delete/report/block functions trigger correctly

### 4.3 Integrate Chat Management
In your chat screen component:

```jsx
import ChatManagement from '@/components/ChatManagement'

// In your chat render:
<ChatManagement 
  chatUserId={otherUserId}
  onChatCleared={() => refreshMessages()}
/>
```

- [ ] Import ChatManagement component
- [ ] Add to bottom of chat (before message input)
- [ ] Clear chat button visible
- [ ] Confirmation dialog appears
- [ ] Chat clears without errors

---

## Phase 5: API Integration Testing

### 5.1 Test Settings Save
- [ ] Navigate to Settings page
- [ ] Toggle a privacy setting
- [ ] Click "Save Changes"
- [ ] Check Network tab - should see POST to `/api/user/settings`
- [ ] Toast shows success message
- [ ] Page still shows toggled setting (refresh to verify it persists)

### 5.2 Test Message Actions
- [ ] Open a chat
- [ ] Hover over your message
- [ ] Click three-dot menu
- [ ] Test "Delete for me" - message disappears
- [ ] Test "Message info" - shows delivery/read status
- [ ] In another account's message, test "Block" - shows success
- [ ] In another account's message, test "Report" - shows reason dropdown

### 5.3 Test Chat Management
- [ ] Open a chat
- [ ] Scroll to bottom
- [ ] Click "Clear Chat"
- [ ] Confirm action
- [ ] All messages disappear
- [ ] Check Network tab - POST to `/api/safety/chat/clear`

### 5.4 Test Block/Unblock
- [ ] Search for a user
- [ ] Click three-dot menu on their card
- [ ] Click "Block User"
- [ ] Toast shows "User blocked successfully"
- [ ] Go to Settings → Privacy & Safety
- [ ] Should have separate section showing blocked users (add this later)
- [ ] Click unblock button
- [ ] Toast shows "User unblocked successfully"

---

## Phase 6: Data Persistence Testing

### 6.1 MongoDB Verification
Open MongoDB Compass or MongoDB Atlas:

- [ ] Check `users` collection
  - [ ] Users now have `privacy_settings` field
  - [ ] Users now have `notification_settings` field
  - [ ] Users now have `account_settings` field

- [ ] Check `messages` collection
  - [ ] Messages have new status fields (`sent`, `delivered`, `read`)
  - [ ] Messages have `read_by` and `delivered_to` arrays
  - [ ] Messages have deletion tracking fields

- [ ] Check new `blocklists` collection
  - [ ] Block entries created when users block each other
  - [ ] Entries contain `user_id` and `blocked_user_id`

- [ ] Check new `reports` collection
  - [ ] Report entries created when users report
  - [ ] Reports have `type`, `reason`, `description`

---

## Phase 7: Cross-Browser Testing

### 7.1 Settings Page
- [ ] Settings page loads in Chrome
- [ ] Settings page loads in Firefox
- [ ] Settings page loads in Safari
- [ ] Responsive on mobile (use DevTools)
- [ ] All toggles work correctly
- [ ] Save button works and shows loading state
- [ ] Logout and delete buttons work

### 7.2 Message Actions
- [ ] Menu appears on hover in Chrome
- [ ] Menu appears on hover in Firefox
- [ ] Menu appears on tap on mobile
- [ ] All actions trigger correctly
- [ ] API calls complete successfully

### 7.3 Chat Management
- [ ] Clear chat button visible in all browsers
- [ ] Confirmation dialog appears
- [ ] Chat clears on all browsers
- [ ] Responsive on mobile

---

## Phase 8: Security Verification

### 8.1 Authentication Check
- [ ] Log out completely
- [ ] Try accessing `/settings` - should redirect to login
- [ ] Try accessing `/api/safety/block` without token - should return 401
- [ ] Try accessing `/api/safety/block` with invalid token - should return 401

### 8.2 Authorization Check
- [ ] As User A, try to delete User B's message - should fail
- [ ] As User A, try to delete for everyone on your own message - should succeed
- [ ] As User A, try to view message info on User B's message - should fail
- [ ] As User A, try to view message info on your own message - should succeed

### 8.3 Data Safety Check
- [ ] Delete account - verify user document is removed from MongoDB
- [ ] Delete account - verify all user's messages are removed
- [ ] Delete account - verify all reports by/about user are removed
- [ ] Delete account - verify all block entries with user are removed

---

## Phase 9: Performance Optimization (Optional)

- [ ] Settings load within 1 second
- [ ] Message actions menu appears within 200ms
- [ ] Chat clear completes within 5 seconds
- [ ] No console errors
- [ ] No memory leaks (check DevTools)
- [ ] API responses are under 500ms

---

## Phase 10: Documentation & Training

- [ ] Team reviewed `ACCOUNT_SETTINGS_IMPLEMENTATION.md`
- [ ] Team reviewed `SETTINGS_INTEGRATION_STEPS.md`
- [ ] Team reviewed `COMPONENT_INTEGRATION_EXAMPLES.md`
- [ ] Update your project README with new features
- [ ] Create user documentation for end users
- [ ] Create admin documentation for managing reports

---

## Final Checks

### Before Going Live
- [ ] All files created successfully
- [ ] All routes registered
- [ ] All tests passing
- [ ] No console errors
- [ ] Settings persist across refreshes
- [ ] Messages display status indicators correctly
- [ ] Block/unblock works bidirectionally
- [ ] Reports are stored in database
- [ ] Account deletion is permanent
- [ ] Mobile responsive design works

### Post-Deployment
- [ ] Monitor error logs
- [ ] Check database for orphaned data
- [ ] User feedback on new features
- [ ] Performance metrics acceptable
- [ ] Security audit passed

---

## Rollback Plan (If Needed)

If you need to rollback:

1. Remove these routes from `server/server.js`:
   ```javascript
   app.use('/api/safety', safetyRouter)
   ```

2. Remove these files:
   - `server/controllers/safetyController.js`
   - `server/routes/safetyRoutes.js`
   - `server/models/BlockList.js`
   - `server/models/Report.js`

3. Revert model changes in:
   - `server/models/User.js`
   - `server/models/Message.js`
   - `server/routes/userRoutes.js`

4. Remove frontend routes/components

5. Restart server and clear browser cache

---

## Troubleshooting

### Settings Page Won't Load
- [ ] Check browser console for errors
- [ ] Verify route is added to router
- [ ] Check imports are correct
- [ ] Verify Tailwind CSS is working
- [ ] Check network tab for failed API calls

### Message Actions Not Appearing
- [ ] Verify component is imported
- [ ] Check z-index of menu (should be high)
- [ ] Test in different browser
- [ ] Clear browser cache
- [ ] Check for CSS conflicts

### Block/Report Not Working
- [ ] Verify auth token is being sent
- [ ] Check browser console for error messages
- [ ] Verify API endpoint exists in server
- [ ] Check MongoDB connection
- [ ] Test API endpoint with curl

### Settings Not Persisting
- [ ] Check MongoDB connection
- [ ] Verify collection exists
- [ ] Check user ID is correct
- [ ] Review network request/response
- [ ] Check for validation errors

---

## Success Criteria

✅ All features implemented and working
✅ No console errors or warnings
✅ All API endpoints responding correctly
✅ Settings persist across sessions
✅ Mobile responsive
✅ Security verified
✅ Performance acceptable
✅ Documentation complete
✅ Team trained
✅ Monitoring in place

---

## Next Steps After Completion

1. **Gather User Feedback** - Survey users about new features
2. **Monitor Usage** - Track which features are most used
3. **Iterate** - Make improvements based on feedback
4. **Add Features** - Consider:
   - Email notifications
   - 2FA setup flow
   - Admin report dashboard
   - Message search
   - Message pinning
   - Do Not Disturb mode

---

Need help? Refer to:
- `SETTINGS_INTEGRATION_STEPS.md` for quick integration guide
- `COMPONENT_INTEGRATION_EXAMPLES.md` for code examples
- `ACCOUNT_SETTINGS_IMPLEMENTATION.md` for API documentation
