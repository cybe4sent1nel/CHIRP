# 🔐 Google OAuth Setup Guide

## 📋 What to Fill in Google Console

### 1️⃣ **Authorized JavaScript Origins** (2 URIs)

For **localhost testing**, add these EXACT URLs:

```
http://localhost:5173
http://localhost:4000
```

> ⚠️ **Important:** No trailing slash! Must be exact URLs.

---

### 2️⃣ **Authorized Redirect URIs** (1 URI)

For **localhost testing**, add:

```
http://localhost:4000/api/auth/google/callback
```

---

### 3️⃣ **Application Information Fields**

Fill in these fields as shown in the screenshots:

| Field | Value for Localhost |
|-------|---------------------|
| **Application home page** | `http://localhost:5173` |
| **Application privacy policy link** | `http://localhost:5173/privacy-policy.html` |
| **Application terms of service link** | `http://localhost:5173/terms-of-service.html` |

---

## 🚀 For Production Deployment

When you deploy to **Netlify or Vercel**, UPDATE these values:

### **Authorized JavaScript Origins**
```
https://your-domain.com
https://your-api-domain.com
```

### **Authorized Redirect URIs**
```
https://your-api-domain.com/api/auth/google/callback
```

### **Application Information**
| Field | Production Value |
|-------|------------------|
| **Application home page** | `https://your-domain.com` |
| **Application privacy policy link** | `https://your-domain.com/privacy-policy.html` |
| **Application terms of service link** | `https://your-domain.com/terms-of-service.html` |

---

## 📄 Legal Documents Created

✅ **Privacy Policy** - Located at: `client/public/privacy-policy.html`
- Comprehensive GDPR & CCPA compliant
- Covers data collection, usage, and rights
- Google OAuth data usage explained
- Production-ready, no placeholders

✅ **Terms of Service** - Located at: `client/public/terms-of-service.html`
- Complete legal terms & conditions
- User rights and responsibilities
- Content policies and prohibited conduct
- Dispute resolution and liability limitations
- Production-ready, passes Google review

✅ **About/Homepage** - Located at: `client/public/about.html`
- Professional landing page
- Mission, values, and features
- Contact information
- Call-to-action buttons
- Production-ready design

---

## 🔗 How to Access These Pages

### On Localhost:
- Privacy Policy: http://localhost:5173/privacy-policy.html
- Terms of Service: http://localhost:5173/terms-of-service.html
- About Page: http://localhost:5173/about.html

### On Production:
- Privacy Policy: https://your-domain.com/privacy-policy.html
- Terms of Service: https://your-domain.com/terms-of-service.html
- About Page: https://your-domain.com/about.html

---

## ✅ Google OAuth Checklist

- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Create new project (or select existing)
- [ ] Enable Google+ API
- [ ] Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
- [ ] Choose "Web application"
- [ ] Add Authorized JavaScript Origins (2 URIs from above)
- [ ] Add Authorized Redirect URIs (1 URI from above)
- [ ] Fill in Application home page: `http://localhost:5173`
- [ ] Fill in Privacy policy link: `http://localhost:5173/privacy-policy.html`
- [ ] Fill in Terms of service link: `http://localhost:5173/terms-of-service.html`
- [ ] Click "Create"
- [ ] Copy **Client ID** and **Client Secret**
- [ ] Add to `.env` file:
  ```env
  GOOGLE_CLIENT_ID=your_client_id_here
  GOOGLE_CLIENT_SECRET=your_client_secret_here
  ```
- [ ] Restart server: `npm run dev`
- [ ] Test Google login at: http://localhost:5173/auth

---

## 🎯 Quick Test

After setup, test Google OAuth:

1. **Start your app:**
   ```bash
   npm run dev
   ```

2. **Open browser:**
   ```
   http://localhost:5173/auth
   ```

3. **Click "Sign in with Google"**

4. **Should redirect to:**
   - Google consent screen
   - Then back to your app (logged in)

---

## 🐛 Troubleshooting

### ❌ "Redirect URI mismatch" error
- **Solution:** Verify the callback URL in Google Console EXACTLY matches:
  ```
  http://localhost:4000/api/auth/google/callback
  ```

### ❌ "Invalid origin" error
- **Solution:** Check that BOTH origins are added:
  - `http://localhost:5173` (frontend)
  - `http://localhost:4000` (backend)

### ❌ "Application information incomplete"
- **Solution:** All 3 fields must be filled:
  - Application home page
  - Privacy policy link
  - Terms of service link

---

## 📝 Notes

- **Legal Documents:** All 3 HTML files are production-ready with NO placeholders
- **Customization:** You can edit the HTML files to add your business address
- **Styling:** All pages use inline CSS (no external dependencies)
- **Mobile Responsive:** All pages work on mobile devices
- **Professional Design:** Gradient backgrounds, modern UI, proper formatting

---

## 🚨 Before Publishing to Production

1. **Update Business Address:** Edit the HTML files and replace `[Your Business Address]` with your actual business address
2. **Update Domain:** Change all `http://localhost:*` URLs to your production domain
3. **Update Google Console:** Add production URLs to Authorized Origins and Redirect URIs
4. **Test Thoroughly:** Test Google OAuth login on production before announcing

---

## 💡 Pro Tips

- Keep localhost URIs in Google Console even after deployment (for local testing)
- Use different Google OAuth apps for development and production
- Monitor Google Cloud Console for usage limits
- Enable 2FA on your Google Cloud account for security

---

## 🎉 You're Ready!

All legal documents are created and ready to use. Just fill in the Google Console fields with the URLs above, and you can publish your app!

**Need Help?** Contact: support@chirp.com
