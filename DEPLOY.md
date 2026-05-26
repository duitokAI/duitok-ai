# Duitok  AI: What To Do Next

You currently have config files for several cloud platforms:

- `render.yaml` - recommended now
- `vercel.json` - optional later if you split frontend
- `railway.json` - optional alternative to Render
- `fly.toml` - optional advanced Docker deployment

Do not use all four. Use Render first.

## Current Recommended Setup

```text
Render
  ├─ serves the Duitok  AI frontend
  ├─ runs the Node API
  ├─ stores temporary JSON data on a Render disk
  └─ receives CHIP payment callbacks
```

This is the least confusing route because app and API share one domain.

## Step 1: Push To GitHub

Commit and push this project to a GitHub repo.

## Step 2: Deploy On Render

1. Open Render.
2. Choose New > Blueprint, or New > Web Service.
3. Connect the GitHub repo.
4. Render can use `render.yaml`.
5. Confirm:
   - Build command: `npm ci && npm run build`
   - Start command: `npm start`
   - Health check path: `/api/health`

## Step 3: Add Render Environment Variables

Set these in Render:

```env
NODE_ENV=production
SERVE_STATIC=true
DATA_DIR=/var/data
PUBLIC_APP_URL=https://your-render-or-custom-domain.com
CORS_ORIGINS=
CHIP_API_TOKEN=your_chip_api_token
CHIP_BRAND_ID=your_chip_brand_id
CHIP_PUBLIC_KEY=your_chip_public_key
```

After Render deploys, copy its HTTPS domain and paste it into `PUBLIC_APP_URL`.

## Step 4: Connect CHIP

In CHIP dashboard:

1. Use the same business/brand as `CHIP_BRAND_ID`.
2. Make sure the public key used for callbacks is copied into `CHIP_PUBLIC_KEY`.
3. Test a top up from the deployed site.

The app creates the callback URL automatically:

```text
https://your-domain.com/api/payments/chip/callback
```

## Step 5: Test Payment

1. Open your deployed Duitok  AI site.
2. Sign in.
3. Go to Top Up Credit.
4. Click RM10 first.
5. You should be redirected to CHIP.
6. After successful payment, CHIP callback updates credits.

## Later, Not Now

Move JSON storage to Postgres before real customer volume:

```env
DATABASE_URL=postgres://...
```

Only split frontend to Vercel after the Render version is working.
