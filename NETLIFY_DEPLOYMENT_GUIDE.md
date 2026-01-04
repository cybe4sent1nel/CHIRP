# 🚀 Netlify Deployment Guide for Chirp with Custom Auth

## Prerequisites Checklist

Before deploying to Netlify, ensure you have:

- [x] All custom authentication code completed
- [ ] Environment variables prepared
- [ ] Google OAuth credentials for production
- [ ] Email service (SMTP) configured
- [ ] MongoDB accessible from production
- [ ] Git repository with latest code
- [ ] Netlify account created

---

## Step 1: Prepare Your Code

### 1.1 Update Environment-Specific URLs

Update your `.env` files to handle production URLs:

**Server `.env` (Production values):**
```env
# MongoDB
MONGO_URI=your_production_mongodb_uri

# Frontend URL (Your Netlify domain)
FRONTEND_URL=https://your-app.netlify.app

# Google OAuth (Production callback)
GOOGLE_CALLBACK_URL=https://your-api.netlify.app/api/auth/google/callback

# Email Service
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASSWORD=your_smtp_password
FROM_EMAIL=noreply@chirp.com
FROM_NAME=Chirp

# Secrets (Generate new ones for production!)
JWT_SECRET=<generate_new_production_secret>
SESSION_SECRET=<generate_new_production_secret>

# Google OAuth
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>

# Inngest
INNGEST_SIGNING_KEY=<your_inngest_signing_key>

# Clerk
VITE_CLERK_PUBLISHABLE_KEY=<your_clerk_key>
```

### 1.2 Create netlify.toml Files

**Client `netlify.toml`** (in `client/` directory):
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

**Server `netlify.toml`** (in `server/` directory):
```toml
[build]
  command = "npm install"
  functions = "functions"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200
```

### 1.3 Create Serverless Function Wrapper

Create `server/functions/api.js`:
```javascript
const serverless = require('serverless-http');
const app = require('../server.js');

module.exports.handler = serverless(app);
```

Install serverless-http:
```bash
cd server
npm install serverless-http
```

### 1.4 Update server.js for Serverless

Add to `server/server.js` before `app.listen()`:
```javascript
// Export app for serverless
if (process.env.NETLIFY) {
  module.exports = app;
} else {
  // Regular server start for local development
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
```

---

## Step 2: Set Up Google OAuth for Production

### 2.1 Update Google Cloud Console

1. Go to: https://console.cloud.google.com/
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Edit your OAuth 2.0 Client ID
5. Add production URLs:

**Authorized JavaScript origins:**
```
https://your-app.netlify.app
```

**Authorized redirect URIs:**
```
https://your-api.netlify.app/api/auth/google/callback
```

6. Save changes

---

## Step 3: Deploy to Netlify

### 3.1 Deploy Frontend (Client)

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for Netlify deployment"
   git push origin main
   ```

2. **Go to Netlify Dashboard:**
   - Visit: https://app.netlify.com/
   - Click "Add new site" → "Import an existing project"
   - Choose "GitHub" and authorize
   - Select your repository

3. **Configure Build Settings:**
   - **Base directory:** `client`
   - **Build command:** `npm run build`
   - **Publish directory:** `client/dist`
   - **Node version:** 18

4. **Add Environment Variables:**
   Click "Site settings" → "Environment variables" → "Add variables"
   
   ```
   VITE_BASEURL=https://your-api.netlify.app
   VITE_CLERK_PUBLISHABLE_KEY=<your_clerk_key>
   ```

5. **Deploy:**
   - Click "Deploy site"
   - Wait for build to complete
   - Note your site URL (e.g., `https://your-app.netlify.app`)

### 3.2 Deploy Backend (Server)

1. **Create New Site for API:**
   - Click "Add new site" again
   - Choose same repository
   - This will be your API/server

2. **Configure Build Settings:**
   - **Base directory:** `server`
   - **Build command:** `npm install`
   - **Functions directory:** `server/functions`
   - **Node version:** 18

3. **Add Environment Variables:**
   Add ALL these variables in Netlify dashboard:
   
   ```
   MONGO_URI=<your_mongodb_connection_string>
   JWT_SECRET=<your_production_jwt_secret>
   SESSION_SECRET=<your_production_session_secret>
   GOOGLE_CLIENT_ID=<your_google_client_id>
   GOOGLE_CLIENT_SECRET=<your_google_client_secret>
   GOOGLE_CALLBACK_URL=https://your-api.netlify.app/api/auth/google/callback
   FRONTEND_URL=https://your-app.netlify.app
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USER=<your_smtp_username>
   SMTP_PASSWORD=<your_smtp_password>
   FROM_EMAIL=noreply@chirp.com
   FROM_NAME=Chirp
   INNGEST_SIGNING_KEY=<your_inngest_signing_key>
   NETLIFY=true
   NODE_ENV=production
   ```

4. **Deploy:**
   - Click "Deploy site"
   - Note your API URL (e.g., `https://your-api.netlify.app`)

---

## Step 4: Update Configuration

### 4.1 Update Frontend Environment

Go back to your frontend site on Netlify:
1. Site settings → Environment variables
2. Update `VITE_BASEURL` to your actual API URL:
   ```
   VITE_BASEURL=https://your-api.netlify.app
   ```
3. Click "Save"
4. Go to "Deploys" → "Trigger deploy" → "Deploy site"

### 4.2 Update MongoDB Network Access

1. Go to MongoDB Atlas
2. Network Access → Add IP Address
3. Add `0.0.0.0/0` (allow all) for Netlify Functions
   - Or use MongoDB's Netlify IP allowlist if available

### 4.3 Configure CORS

Ensure your server has CORS configured for production:

In `server/server.js`:
```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## Step 5: Test Your Deployment

### 5.1 Test Authentication Flows

Visit your deployed site: `https://your-app.netlify.app`

**Test Each Flow:**

1. **Signup:**
   - Go to /auth
   - Create new account
   - Check email for verification
   - Click verification link
   - Login

2. **Login:**
   - Enter email/username + password
   - Should redirect to main app
   - Check login alert email

3. **Google OAuth:**
   - Click "Continue with Google"
   - Select account
   - Should redirect back logged in

4. **Forgot Password:**
   - Click "Forgot Password?"
   - Enter email
   - Check email for reset link
   - Click link and reset password

5. **Clerk Login:**
   - Go to /clerk-login
   - Test Clerk authentication
   - Should work as before

### 5.2 Check Browser Console

Open DevTools (F12) and check for:
- No CORS errors
- API calls successful (Network tab)
- No JavaScript errors
- Cookies being set

### 5.3 Test Email Delivery

- Check spam/junk folders
- Verify all email templates render correctly
- Test email links work (verification, password reset)

---

## Step 6: Configure Custom Domain (Optional)

### 6.1 Add Custom Domain to Frontend

1. Go to your frontend site on Netlify
2. **Domain settings** → "Add custom domain"
3. Enter your domain (e.g., `chirp.com`)
4. Follow DNS configuration instructions
5. Enable HTTPS (automatic with Let's Encrypt)

### 6.2 Add Custom Domain to Backend

1. Go to your API site on Netlify
2. **Domain settings** → "Add custom domain"
3. Enter subdomain (e.g., `api.chirp.com`)
4. Configure DNS
5. Enable HTTPS

### 6.3 Update Environment Variables

After custom domains are set up:

**Frontend site:**
```
VITE_BASEURL=https://api.chirp.com
```

**Backend site:**
```
FRONTEND_URL=https://chirp.com
GOOGLE_CALLBACK_URL=https://api.chirp.com/api/auth/google/callback
```

**Google Cloud Console:**
- Update OAuth redirect URIs to use new domains

**Redeploy both sites** after updating variables.

---

## Step 7: Set Up Inngest for Production

### 7.1 Create Inngest Account

1. Visit: https://www.inngest.com/
2. Sign up for free account
3. Create new app

### 7.2 Get Production Signing Key

1. Go to Inngest dashboard
2. Settings → API Keys
3. Copy "Signing Key"
4. Add to Netlify environment variables:
   ```
   INNGEST_SIGNING_KEY=<your_production_signing_key>
   ```

### 7.3 Configure Inngest Webhook

1. In Inngest dashboard, go to "Apps"
2. Click your app
3. Add webhook endpoint:
   ```
   https://your-api.netlify.app/api/inngest
   ```

### 7.4 Redeploy Server

After adding Inngest signing key, redeploy your server site.

---

## Step 8: Monitor and Debug

### 8.1 Netlify Function Logs

1. Go to your API site on Netlify
2. Click "Functions"
3. Click "api" function
4. View real-time logs

### 8.2 Check Email Delivery

- Monitor Brevo/SendGrid dashboard
- Check delivery rates
- Review bounce/spam reports

### 8.3 MongoDB Logs

- Check MongoDB Atlas logs for queries
- Monitor connection counts
- Check for errors

### 8.4 Error Tracking (Optional)

Consider adding Sentry for error tracking:

```bash
npm install @sentry/node @sentry/react
```

Configure in server and client for production error monitoring.

---

## Troubleshooting

### Issue: OAuth Callback Not Working

**Solution:**
- Verify redirect URI in Google Cloud Console matches exactly
- Check `GOOGLE_CALLBACK_URL` in Netlify env variables
- Ensure HTTPS is enabled
- Check CORS configuration

### Issue: Emails Not Sending

**Solution:**
- Check SMTP credentials in Netlify env variables
- Verify Inngest signing key is correct
- Check function logs for email errors
- Test direct SMTP connection (fallback should work)

### Issue: Session Not Persisting

**Solution:**
- Check `SESSION_SECRET` is set
- Verify MongoDB connection string
- Ensure cookies have `secure: true` in production
- Check browser allows cookies from your domain

### Issue: JWT Token Invalid

**Solution:**
- Regenerate `JWT_SECRET` for production
- Ensure it's set in Netlify env variables
- Clear browser localStorage
- Check token expiry (30 days default)

### Issue: MongoDB Connection Failed

**Solution:**
- Verify `MONGO_URI` is correct
- Check MongoDB Atlas network access (allow all IPs)
- Ensure database user has correct permissions
- Check connection string format

### Issue: CORS Errors

**Solution:**
- Verify `FRONTEND_URL` matches your frontend domain exactly
- Check CORS middleware configuration
- Ensure `credentials: true` is set
- Add your domain to CORS origin

### Issue: Build Fails

**Solution:**
- Check Node version (should be 18)
- Verify all dependencies in package.json
- Check build logs for specific errors
- Try building locally first

---

## Production Checklist

Before going live, verify:

### Security
- [ ] All secrets generated with crypto.randomBytes
- [ ] Environment variables not in code
- [ ] HTTPS enabled on both sites
- [ ] Secure cookies enabled
- [ ] MongoDB network access configured
- [ ] Google OAuth production credentials set

### Functionality
- [ ] Signup flow works
- [ ] Email verification works
- [ ] Login with email works
- [ ] Login with username works
- [ ] Google OAuth works
- [ ] Forgot password works
- [ ] Password reset works
- [ ] Clerk login works
- [ ] All email templates render correctly
- [ ] Sessions persist

### Performance
- [ ] API response times acceptable
- [ ] Email delivery fast
- [ ] Frontend loads quickly
- [ ] No console errors
- [ ] Images optimized

### Monitoring
- [ ] Function logs accessible
- [ ] Email delivery tracked
- [ ] Database performance monitored
- [ ] Error tracking configured (optional)

---

## Deployment Commands Summary

```bash
# 1. Generate production secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# 2. Install serverless
cd server
npm install serverless-http

# 3. Create netlify.toml files (see above)

# 4. Push to GitHub
git add .
git commit -m "Deploy to Netlify"
git push origin main

# 5. Deploy on Netlify dashboard
# - Frontend: client/ directory
# - Backend: server/ directory with functions

# 6. Set environment variables in Netlify

# 7. Update Google OAuth redirect URIs

# 8. Test all flows
```

---

## Post-Deployment

### Update Documentation

Update your README with:
- Production URLs
- How to contribute
- How to report bugs
- API documentation

### Monitor Usage

- Watch for authentication errors
- Monitor email delivery rates
- Track user signups
- Check server performance

### Regular Maintenance

- Update dependencies monthly
- Rotate secrets every 90 days
- Review access logs
- Backup MongoDB regularly

---

## Cost Estimates

### Netlify (Free Tier)
- **Build minutes**: 300/month
- **Bandwidth**: 100 GB/month
- **Functions**: 125K requests/month
- **Upgrade**: $19/month for more

### MongoDB Atlas (Free Tier)
- **Storage**: 512 MB
- **RAM**: Shared
- **Upgrade**: $9/month for dedicated

### Brevo (Free Tier)
- **Emails**: 300/day
- **Upgrade**: $25/month for 20K

### Inngest (Free Tier)
- **Events**: 50K/month
- **Upgrade**: $20/month for 200K

**Total Free Tier Limits:**
- Good for ~1,000-5,000 users
- 300 emails/day
- 125K function calls/month

---

## Support Resources

- **Netlify Docs**: https://docs.netlify.com/
- **Netlify Forums**: https://answers.netlify.com/
- **MongoDB Atlas Support**: https://www.mongodb.com/cloud/atlas/support
- **Google OAuth Docs**: https://developers.google.com/identity/protocols/oauth2
- **Inngest Docs**: https://www.inngest.com/docs

---

## Next Steps After Deployment

1. **Test extensively** in production
2. **Set up monitoring** (Sentry, LogRocket, etc.)
3. **Create backup strategy** for MongoDB
4. **Set up CI/CD pipeline** (optional)
5. **Plan for scaling** as users grow
6. **Collect user feedback** on authentication experience
7. **Monitor performance** and optimize

---

**Your Chirp app is now deployed with full custom authentication! 🎉**

*Remember to keep your environment variables secure and never commit them to version control!*
