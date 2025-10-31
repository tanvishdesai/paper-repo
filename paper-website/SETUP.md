# API Key Feature Setup Guide

This guide will walk you through setting up the API key functionality with Convex and Clerk authentication.

## Prerequisites

- Node.js 20+ installed
- npm or yarn package manager
- A Convex account (free tier available)
- A Clerk account (free tier available)

## Step 1: Install Dependencies

All dependencies are already installed. If you need to reinstall:

```bash
npm install
```

## Step 2: Set Up Clerk Authentication

1. **Create a Clerk Account**
   - Go to [https://clerk.com](https://clerk.com)
   - Sign up for a free account
   - Create a new application

2. **Get Your Clerk Keys**
   - In your Clerk dashboard, go to **API Keys**
   - Copy the **Publishable Key** and **Secret Key**

3. **Configure JWT Template**
   - In Clerk dashboard, go to **JWT Templates**
   - Click **New Template** → **Convex**
   - Name it "convex"
   - Copy the **Issuer URL** (you'll need this)

## Step 3: Set Up Convex

Convex is already initialized. The deployment is already created.

1. **Get Your Convex URL**
   - Check `.env.local` file (should be auto-generated)
   - Or go to [Convex Dashboard](https://dashboard.convex.dev)
   - Copy your deployment URL

## Step 4: Configure Environment Variables

Create or update `.env.local` file in the project root:

```env
# Convex (should already exist)
CONVEX_DEPLOYMENT=your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-convex-url.convex.cloud

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
CLERK_JWT_ISSUER_DOMAIN=your-clerk-domain.clerk.accounts.dev
```

**Where to find these:**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk Dashboard → API Keys
- `CLERK_SECRET_KEY`: Clerk Dashboard → API Keys
- `CLERK_JWT_ISSUER_DOMAIN`: Clerk Dashboard → JWT Templates → Convex template → Issuer URL (without https://)

## Step 5: Update Convex Auth Configuration

The auth configuration is already set in `convex/auth.config.ts`, but make sure the `CLERK_JWT_ISSUER_DOMAIN` environment variable is set correctly.

## Step 6: Deploy Convex Functions

Run the Convex development server:

```bash
npx convex dev
```

This will:
- Deploy your schema
- Deploy all functions
- Watch for changes
- Keep the connection alive

**Keep this terminal open** while developing.

## Step 7: Run the Application

In a **new terminal**, start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 8: Test the Features

1. **Sign In**
   - Click "Sign In" in the navigation bar
   - Create an account or sign in with email/Google/GitHub

2. **Generate API Key**
   - After signing in, click "API Keys" in the navigation
   - Enter a name for your key
   - Click "Generate Key"
   - **IMPORTANT**: Copy the key immediately (it won't be shown again!)

3. **Test the API**
   - Go to the API Documentation page
   - Use your API key to make requests

### Example API Test (using curl)

```bash
# Get all subjects
curl -X GET "http://localhost:3000/api/v1/subjects" \
  -H "X-API-Key: your_api_key_here"

# Get questions from Algorithms subject
curl -X GET "http://localhost:3000/api/v1/questions?subject=Algorithms&year=2023" \
  -H "X-API-Key: your_api_key_here"
```

### Example API Test (using JavaScript)

```javascript
const apiKey = 'your_api_key_here';

fetch('http://localhost:3000/api/v1/questions?subject=Algorithms', {
  headers: {
    'X-API-Key': apiKey
  }
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

## Features Implemented

✅ **Authentication System**
- Sign in/Sign up with Clerk
- Email, Google, GitHub authentication
- Secure session management

✅ **API Key Management**
- Generate API keys with custom names
- View all your API keys
- Activate/deactivate keys
- Delete/revoke keys
- Track usage and rate limits

✅ **Public API Endpoints**
- `/api/v1/subjects` - Get all subjects
- `/api/v1/questions` - Get questions with filtering
  - Filter by subject, year, marks, type
  - Search in question text and topics
  - Sort by various fields
  - Pagination support

✅ **API Documentation**
- Complete API reference
- Code examples in multiple languages
- Interactive examples

✅ **Security Features**
- API keys are hashed (never stored in plain text)
- Rate limiting (1000 requests/day per key)
- Secure authentication with Clerk
- API key verification on every request

## Project Structure

```
paper-repo/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── questions/route.ts   # Questions API endpoint
│   │       └── subjects/route.ts    # Subjects API endpoint
│   ├── api-keys/page.tsx            # API key management dashboard
│   ├── api-docs/page.tsx            # API documentation
│   ├── page.tsx                     # Homepage (with auth nav)
│   └── questions/[subject]/page.tsx # Questions viewer
├── convex/
│   ├── schema.ts                    # Database schema
│   ├── auth.config.ts               # Clerk integration
│   ├── users.ts                     # User management functions
│   ├── apiKeys.ts                   # API key management functions
│   └── questions.ts                 # Questions queries
├── components/
│   ├── convex-client-provider.tsx   # Convex + Clerk provider
│   └── ui/                          # UI components
├── middleware.ts                    # Clerk authentication middleware
└── .env.local                       # Environment variables
```

## Troubleshooting

### Issue: "Not authenticated" error

**Solution**: Make sure you've:
1. Set up Clerk JWT template correctly
2. Added the correct `CLERK_JWT_ISSUER_DOMAIN` to `.env.local`
3. Restarted both `convex dev` and `npm run dev`

### Issue: API key verification fails

**Solution**: 
1. Make sure Convex dev is running (`npx convex dev`)
2. Check that `NEXT_PUBLIC_CONVEX_URL` is set correctly
3. Ensure you're using the full API key (starts with `gate_live_`)

### Issue: "Invalid API key" error

**Solution**:
1. Generate a new API key
2. Make sure you're including the header: `X-API-Key: your_key`
3. Check that the key is active (not revoked)

### Issue: Convex functions not deploying

**Solution**:
1. Stop `convex dev` (Ctrl+C)
2. Run `npx convex dev` again
3. Check the terminal for any errors

## Production Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add API key functionality"
   git push
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables (same as `.env.local`)
   - Deploy

3. **Create Production Convex Deployment**
   ```bash
   npx convex deploy
   ```
   - Copy the production URL
   - Update `NEXT_PUBLIC_CONVEX_URL` in Vercel environment variables

4. **Update API Documentation**
   - Update the base URL in `/api-docs` page
   - Replace `http://localhost:3000` with your Vercel domain

## Rate Limits

- **Default**: 1,000 requests per day per API key
- Rate limit is tracked per API key
- To change limits, edit the `rateLimit` parameter when generating keys

## Security Best Practices

1. **Never commit `.env.local`** - It's in `.gitignore`
2. **Never share your API keys** - Treat them like passwords
3. **Revoke compromised keys immediately** - Use the dashboard
4. **Use HTTPS in production** - Always
5. **Monitor API usage** - Check the dashboard regularly

## Support

- **Convex Docs**: [https://docs.convex.dev](https://docs.convex.dev)
- **Clerk Docs**: [https://clerk.com/docs](https://clerk.com/docs)
- **Next.js Docs**: [https://nextjs.org/docs](https://nextjs.org/docs)

## Next Steps

1. Customize rate limits per user tier
2. Add billing/subscription system
3. Add more analytics and usage tracking
4. Implement webhook notifications
5. Add API key expiration dates
6. Add IP whitelisting for keys

---

**Congratulations!** You now have a fully functional API key system with authentication. 🎉

