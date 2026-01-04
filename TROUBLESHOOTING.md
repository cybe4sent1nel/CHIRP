# 🔧 Troubleshooting Guide

## Routes Not Matching Issue

### Symptoms
```
⚠️  No routes matched location "/profile-qr"
⚠️  No routes matched location "/ai-studio"
```

### Why This Happens
1. **Browser cache** - Old JS files still loaded
2. **Vite cache** - Dev server hasn't rebuilt
3. **Module not hot-reloaded** - Changes not applied
4. **Route guard** - User not authenticated

### Fix (Choose One)

#### 🔥 Quick Fix (90% Success)
```bash
# 1. Stop dev server (Ctrl+C)
# 2. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
# 3. Restart dev server
npm start
```

#### 🧹 Clear Cache (Most Reliable)
```bash
# 1. Stop dev server
Ctrl+C

# 2. Clear Vite cache
cd client
rm -rf node_modules/.vite

# 3. Clear browser cache
# DevTools → Application → Clear storage

# 4. Restart
npm run dev
```

#### 🔄 Full Clean (Nuclear Option)
```bash
# 1. Stop everything
Ctrl+C

# 2. Delete cache folders
cd client
rm -rf node_modules/.vite dist

# 3. Reinstall
npm install

# 4. Start fresh
npm run dev
```

#### 🌐 Test with Debug Page
1. Add this to `App.jsx` temporarily:
   ```javascript
   <Route path="debug" element={<RouteDebug />} />
   ```

2. Visit: http://localhost:5173/debug
3. Check current pathname
4. Use debug links to test routing
5. Remove after testing

---

## Verification Steps

### Step 1: Check Routes Are Defined
```bash
# Search for route definitions
grep -n "ai-studio\|profile-qr" client/src/App.jsx
```

Expected output:
```
91:          <Route path="ai-studio" element={<AIStudio />} />
92:          <Route path="profile-qr" element={<ProfileQR />} />
```

### Step 2: Check Components Are Imported
```bash
grep -n "import.*AIStudio\|import.*ProfileQR" client/src/App.jsx
```

Expected output:
```
12: import AIStudio from "./pages/AIStudio";
13: import ProfileQR from "./pages/ProfileQR";
```

### Step 3: Check Files Exist
```bash
ls -la client/src/pages/AIStudio.jsx
ls -la client/src/pages/ProfileQR.jsx
```

Both files should exist and be readable.

### Step 4: Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors
4. Check Network tab for failed requests

---

## Common Issues & Solutions

### Issue: "Module not found" Error
**Cause**: Component files don't exist  
**Solution**: Run these commands to verify:
```bash
ls client/src/pages/ | grep -E "AIStudio|ProfileQR"
```

### Issue: "Cannot find module" Error
**Cause**: Import path is wrong  
**Solution**: Check imports in App.jsx:
```javascript
import AIStudio from "./pages/AIStudio";  ✅ Correct
import AIStudio from "./pages/aistudio";  ❌ Wrong case
```

### Issue: Routes work initially, then break
**Cause**: Hot module replacement (HMR) issue  
**Solution**: 
1. Hard refresh: `Ctrl+Shift+R`
2. Restart dev server
3. Check Vite is running properly

### Issue: Navigate function doesn't work
**Cause**: Using wrong navigation method  
**Solution**: Use `useNavigate` hook:
```javascript
import { useNavigate } from 'react-router-dom';

const MyComponent = () => {
  const navigate = useNavigate();
  
  return (
    <button onClick={() => navigate("/profile-qr")}>
      Go to QR
    </button>
  );
};
```

### Issue: Routes work in sidebar but not clicking button
**Cause**: Button doesn't have onClick handler or navigate not imported  
**Solution**: Verify Profile.jsx has:
```javascript
import { useNavigate } from "react-router-dom";

const navigate = useNavigate();

<button onClick={() => navigate("/profile-qr")}>
```

---

## Testing Checklist

- [ ] Routes defined in App.jsx (lines 91-92)
- [ ] Components imported in App.jsx (lines 12-13)
- [ ] Component files exist in pages/
- [ ] No typos in file names (case-sensitive on Linux!)
- [ ] Browser hard refresh done (Ctrl+Shift+R)
- [ ] Dev server restarted
- [ ] No errors in console
- [ ] Sidebar shows AI Studio menu item
- [ ] Clicking AI Studio navigates
- [ ] Profile QR button navigates
- [ ] Pages load with content

---

## Debug Output

### Route Structure in App.jsx
```
<Routes>
  <Route path="/" element={Layout}>
    <Route index element={Feed} />
    <Route path="notifications" element={Notifications} />
    <Route path="messages" element={Messages} />
    ...
    <Route path="ai-studio" element={AIStudio} />      ✅ Line 91
    <Route path="profile-qr" element={ProfileQR} />    ✅ Line 92
  </Route>
</Routes>
```

### Expected File Structure
```
client/src/pages/
  ├── AIStudio.jsx          ✅ 368 lines
  ├── ProfileQR.jsx         ✅ 301 lines
  ├── Profile.jsx           ✅ Updated
  ├── App.jsx               ✅ Routes defined
  └── ... (other pages)
```

---

## If All Else Fails

### Nuclear Option: Complete Rebuild
```bash
# 1. Kill all processes
# Close all terminals

# 2. Delete everything
rm -rf client/node_modules
rm -rf server/node_modules
rm -rf client/.next
rm -rf client/dist

# 3. Reinstall
npm install:all

# 4. Start fresh
npm start
```

### Check Node Version
```bash
node --version    # Should be 16+
npm --version     # Should be 7+
```

### Check Vite Config
```bash
cat client/vite.config.js
```

Should contain:
```javascript
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

---

## Getting Help

If issue persists after all fixes:

1. **Check Browser Console** (F12)
   - Copy all errors
   - Note exact message

2. **Check Dev Server Output**
   - Look for build errors
   - Check for module errors

3. **Verify File Contents**
   - Open `client/src/pages/AIStudio.jsx`
   - Verify it's not empty
   - Check imports

4. **Test Simple Route**
   - Try `/about` page (known working)
   - Try `/profile` page (known working)
   - Compare with `/ai-studio`

---

## Quick Reference

| Issue | Solution |
|-------|----------|
| Routes not matching | Hard refresh + restart |
| Can't find module | Check file exists |
| Button doesn't navigate | Verify onClick handler |
| Page loads blank | Check loading state |
| Old code still running | Clear .vite cache |
| Can't click button | Verify z-index/pointer-events |

---

**Most issues are resolved by: Hard refresh + Dev server restart**

If that doesn't work, clearing the Vite cache should fix it.

