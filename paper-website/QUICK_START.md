# Quick Start Guide - Get Running in 10 Minutes

Follow these steps to get the API key feature up and running quickly.

## Step 1: Set Up Clerk (3 minutes)

1. Go to **https://clerk.com** and sign up (free)
2. Create a new application
3. In the dashboard:
   - Go to **API Keys** → Copy:
     - `Publishable Key` → Save as `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
     - `Secret Key` → Save as `CLERK_SECRET_KEY`
   
4. Create JWT Template:
   - Go to **JWT Templates** → Click **New Template**
   - Select **Convex** template
   - Name it "convex"
   - Copy the **Issuer** URL (looks like: `https://your-app.clerk.accounts.dev`)
   - Remove `https://` from it → Save as `CLERK_JWT_ISSUER_DOMAIN`

## Step 2: Set Environment Variables (2 minutes)

1. Check if `.env.local` exists in project root
2. Add these lines to `.env.local`:

```env
# Clerk Keys (from Step 1)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
CLERK_JWT_ISSUER_DOMAIN=your-app.clerk.accounts.dev

# Convex (should already be there)
CONVEX_DEPLOYMENT=neighborly-bass-250
NEXT_PUBLIC_CONVEX_URL=https://neighborly-bass-250.convex.cloud
```

## Step 3: Set Convex Environment Variable (2 minutes)

1. Go to **https://dashboard.convex.dev**
2. Open your deployment (`neighborly-bass-250`)
3. Go to **Settings** → **Environment Variables**
4. Click **Add Environment Variable**
5. Add:
   - **Name**: `CLERK_JWT_ISSUER_DOMAIN`
   - **Value**: `your-app.clerk.accounts.dev` (from Step 1)
6. Click **Save**

## Step 4: Start the App (3 minutes)

### Terminal 1 - Start Convex:
```bash
npx convex dev
```
✅ Wait for "Convex functions ready!" message

### Terminal 2 - Start Next.js:
```bash
npm run dev
```
✅ Wait for "Ready in X ms"

## Step 5: Test It! (2 minutes)

1. Open **http://localhost:3000**
2. Click **"Sign In"** → Create account
3. Click **"API Keys"** in navigation
4. Generate a new API key
5. **Copy the key** (shown only once!)
6. Test the API:

```bash
curl -X GET "http://localhost:3000/api/v1/questions?subject=Algorithms&limit=5" \
  -H "X-API-Key: YOUR_API_KEY_HERE"
```

You should see JSON with 5 questions! 🎉

## Troubleshooting

### "Not authenticated" error
- Check that `CLERK_JWT_ISSUER_DOMAIN` is set in BOTH:
  - `.env.local` file
  - Convex dashboard environment variables
- Restart both terminals

### "Invalid API key" error
- Make sure Convex dev is running
- Generate a fresh API key
- Copy the FULL key including `gate_live_` prefix

### Can't sign in
- Check `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is in `.env.local`
- Restart `npm run dev`

## What's Next?

- ✅ Read full setup guide: `SETUP.md`
- ✅ Read implementation details: `IMPLEMENTATION_SUMMARY.md`
- ✅ Check API docs at: http://localhost:3000/api-docs
- ✅ Deploy to production (see `SETUP.md`)

---

**Need help?** Check the detailed guides:
- Full setup: `SETUP.md`
- Implementation details: `IMPLEMENTATION_SUMMARY.md`
- Project README: `README.md`

