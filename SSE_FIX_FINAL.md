# SSE ECONNRESET - Root Cause Found and Fixed

## Root Cause (Final)

The SSE connection was closing immediately after the initial message because we were listening to the **`res.finish` event**, which fires when response headers and buffered data are sent - NOT when the stream should close.

```javascript
// WRONG - this fires immediately after headers are sent
res.on("finish", () => cleanup("response finish"));

// This caused:
// 1. Headers sent ✓
// 2. Initial message sent ✓  
// 3. "finish" event fires → cleanup() called ✓
// 4. Connection destroyed 💥
```

## Solution

Only listen to **request-level events** for SSE, not response-level events:
- `req.on("close")` - fires when client closes connection
- `req.on("error")` - fires on request errors
- `req.socket.on("error")` - fires on socket errors
- `req.socket.on("end")` - fires when socket ends
- `res.on("error")` - fires on response errors

Never listen to:
- `res.on("finish")` - fires too early
- `res.on("close")` - unreliable for SSE

## Changes Made

### server/controllers/messageController.js
- ✅ Removed `res.on("finish")` listener
- ✅ Added `req.socket.on("end")` listener for proper cleanup
- ✅ Added detailed logging for debugging
- ✅ Increased heartbeat interval to 25 seconds (was 20s)

### server/server.js  
- ✅ SSE route registered BEFORE all middleware
- ✅ Removed unnecessary debug logging

### client/src/App.jsx
- ✅ Improved logging for SSE connection lifecycle
- ✅ Fallback to localhost:4000 if VITE_BASEURL not set

### client/.env.local (created)
- ✅ Set VITE_BASEURL=http://localhost:4000

## Expected Behavior

```
New client connected: user_xxx
Writing initial message for user user_xxx
Initial message written for user user_xxx, writable: true, result: true

[Connection stays open, sending heartbeats every 25 seconds]

[Only closes when client disconnects or error occurs]
```

## Testing

The SSE connection should now:
- Stay open indefinitely (until client closes)
- Send heartbeats every 25 seconds to keep proxy/firewall from timing out
- Properly handle reconnections with exponential backoff
- Deliver real-time messages without ECONNRESET errors

## Files Modified
1. server/server.js
2. server/controllers/messageController.js
3. server/routes/messageRoutes.js
4. client/src/App.jsx
5. client/.env.local (created)
