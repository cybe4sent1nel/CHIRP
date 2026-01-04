# Fix: Missing dotenv Package

The `dev.js` script needs the `dotenv` package to load environment variables.

## Quick Fix

Run this command in your terminal:

```bash
npm install
```

This will:
1. Install `dotenv` in the root directory
2. Update `node_modules/`
3. Allow `dev.js` to work properly

## Then Run

```bash
npm run dev
```

---

## What We Did

Updated `package.json` to include `dotenv` as a dependency:

```json
{
  "dependencies": {
    "dotenv": "^17.2.2"
  }
}
```

This ensures the root directory has `dotenv` installed and available for `dev.js` to use.

---

## If npm install fails

Try:
```bash
npm install --legacy-peer-deps
```

Or delete and reinstall:
```bash
rm -r node_modules package-lock.json
npm install
```

Then run:
```bash
npm run dev
```
