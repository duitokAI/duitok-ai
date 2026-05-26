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
  ├─ connects to Supabase Postgres for durable app data
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
PUBLIC_APP_URL=https://duitok.com
CORS_ORIGINS=
DATABASE_URL=your_supabase_postgres_connection_string
POSTGRES_SSL=true
CHIP_API_TOKEN=your_chip_api_token
CHIP_BRAND_ID=your_chip_brand_id
CHIP_PUBLIC_KEY=your_chip_public_key
APIMART_API_KEY=your_apimart_api_key
APIMART_BASE_URL=https://api.apimart.ai
APIMART_CHAT_PATH=/v1/chat/completions
APIMART_IMAGE_PATH=/v1/images/generations
APIMART_TASK_PATH_PREFIX=/v1/tasks
APIMART_TEXT_MODEL=gpt-5-mini
APIMART_IMAGE_MODEL=gpt-image-2
APIMART_IMAGE_SIZE=1:1
APIMART_IMAGE_RESOLUTION=1K
GRSAI_API_KEY=your_grsai_api_key
GRSAI_BASE_URL=https://grsaiapi.com
GRSAI_DRAW_PATH=/v1/draw/nano-banana
GRSAI_RESULT_PATH=/v1/draw/result
GRSAI_NANO_MODEL=nano-banana-pro
GRSAI_NANO_ASPECT_RATIO=1:1
GRSAI_NANO_IMAGE_SIZE=1K
GRSAI_IMAGE_POLL_ATTEMPTS=36
GRSAI_IMAGE_POLL_MS=3000
WUYIN_API_KEY=your_wuyin_api_key
WUYIN_BASE_URL=https://api.wuyinkeji.com
WUYIN_IMAGE_SIZE=1K
WUYIN_IMAGE_ASPECT_RATIO=1:1
WUYIN_VIDEO_MODEL=veo3.1-fast
WUYIN_VIDEO_RATIO=9:16
WUYIN_SORA_ASPECT_RATIO=9:16
WUYIN_SORA_DURATION=10
WUYIN_SORA_SIZE=small
WUYIN_OMNI_DURATION=10
WUYIN_OMNI_SIZE=720x1280
```

After Render deploys, copy its HTTPS domain and paste it into `PUBLIC_APP_URL`.

## Step 4: Create Supabase Database

1. Open Supabase and create a new project.
2. Go to Project Settings > Database > Connection string.
3. Choose the pooled connection string if Supabase offers it.
4. Copy the URI and replace `[YOUR-PASSWORD]` with the database password you created.
5. Paste that value into Render as `DATABASE_URL`. Keep `POSTGRES_SSL=true` and do not add `sslmode=require` to the URL.
6. Redeploy the Render service.

The app will automatically create one table called `app_state` and store the current Duitok  AI app data there. If `DATABASE_URL` is empty, it falls back to local `data/db.json` for development.

## Step 5: Connect CHIP

In CHIP dashboard:

1. Use the same business/brand as `CHIP_BRAND_ID`.
2. Make sure the public key used for callbacks is copied into `CHIP_PUBLIC_KEY`.
3. Test a top up from the deployed site.

The app creates the callback URL automatically:

```text
https://your-domain.com/api/payments/chip/callback
```

## Step 6: Test Payment

1. Open your deployed Duitok  AI site.
2. Sign in.
3. Go to Top Up Credit.
4. Click RM10 first.
5. You should be redirected to CHIP.
6. After successful payment, CHIP callback updates credits.

## Step 7: Connect APIMart Image Generation

In APIMart:

1. Create an API key.
2. Paste it into Render as `APIMART_API_KEY`.
3. Keep the key only in Render/local `.env`; never expose it in frontend code.
4. Redeploy the Render service.
5. Open Studio > Media Generator, choose `GPT Image 2`, write a prompt, then click Generate Media.

The app submits image tasks through `/v1/images/generations`, polls `/v1/tasks/{task_id}`, then saves the returned image URL into the project result.

## Optional: Connect GRS AI

GRS AI powers `Nano Banana Pro` image generation. `GPT Image 2` stays on APIMart. Text outputs also use APIMart.

The media endpoint used is:

- `Nano Banana Pro` -> `/v1/draw/nano-banana` with `model=nano-banana-pro`

Results are polled through `/v1/draw/result`.

## Optional: Connect 速创API / 无垠科技

速创API powers `Veo 3.1`, `Sora 2`, and `Gemini Omni` video generation.

The media endpoints used are:

- `Veo 3.1` -> `/api/video/veo` with `model=veo3.1-fast`
- `Sora 2` -> `/api/async/video_sora2`
- `Gemini Omni` -> `/api/async/video_google_omni`

All tasks are polled through `/api/async/detail`.

## Later, Not Now

When traffic grows, split the single JSONB app state into normalized Postgres tables:

- `users`
- `projects`
- `payments`
- `usage_events`
- `support_tickets`

Only split frontend to Vercel after the Render version is working.
