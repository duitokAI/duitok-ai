# Pokaya AI: What To Do Next

You currently have config files for several cloud platforms:

- `render.yaml` - recommended now
- `vercel.json` - optional later if you split frontend
- `railway.json` - optional alternative to Render
- `fly.toml` - optional advanced Docker deployment

Do not use all four. Use Render first.

## Current Recommended Setup

```text
Render
  ├─ serves the Pokaya AI frontend
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
PUBLIC_APP_URL=https://pokaya.ai
CORS_ORIGINS=https://pokaya.ai,https://www.pokaya.ai
AUTH_SECRET=your_long_random_auth_secret
ADMIN_USER_IDS=u_1
ADMIN_EMAILS=admin@pokaya.ai
ADMIN_API_KEY=your_private_admin_unlock_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_REDIRECT_URI=https://pokaya.ai/api/auth/google/callback
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
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_CHAT_PATH=/chat/completions
DEEPSEEK_MODEL=deepseek-v4-pro
WEB_SEARCH_BASE_URL=https://duckduckgo.com/html/
WEB_SEARCH_TIMEOUT_MS=12000
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
WUYIN_VEO_SIZE=720p
WUYIN_SORA_ASPECT_RATIO=9:16
WUYIN_SORA_DURATION=10
WUYIN_SORA_SIZE=small
WUYIN_OMNI_DURATION=10
WUYIN_OMNI_SIZE=720x1280
WUYIN_GROK_DURATION=10
WUYIN_GROK_ASPECT_RATIO=9:16
ATLASCLOUD_API_KEY=your_atlascloud_api_key
ATLASCLOUD_BASE_URL=https://api.atlascloud.ai
ATLASCLOUD_GENERATE_VIDEO_PATH=/api/v1/model/generateVideo
ATLASCLOUD_PREDICTION_PATH_PREFIX=/api/v1/model/prediction
ATLASCLOUD_SEEDANCE_MODEL=bytedance/seedance-2.0/text-to-video
ATLASCLOUD_SEEDANCE_DURATION=4
ATLASCLOUD_SEEDANCE_ASPECT_RATIO=9:16
ATLASCLOUD_SEEDANCE_FPS=24
ATLASCLOUD_SEEDANCE_WATERMARK=false
ATLASCLOUD_POLL_ATTEMPTS=60
ATLASCLOUD_POLL_MS=5000
ATLASCLOUD_TIMEOUT_MS=120000
ASSET_STORAGE_PROVIDER=r2
REQUIRE_DURABLE_ASSETS=true
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ENDPOINT=https://your_cloudflare_account_id.r2.cloudflarestorage.com
R2_BUCKET=your_r2_bucket
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_PUBLIC_BASE_URL=https://media.pokaya.ai
```

After Render deploys, copy its HTTPS domain and paste it into `PUBLIC_APP_URL`.

`REQUIRE_DURABLE_ASSETS=true` is intentional. In production, generation should fail closed if R2/CDN is not configured, instead of returning an upstream provider URL to the user.

## Step 4: Create Supabase Database

1. Open Supabase and create a new project.
2. Go to Project Settings > Database > Connection string.
3. Choose the pooled connection string if Supabase offers it.
4. Copy the URI and replace `[YOUR-PASSWORD]` with the database password you created.
5. Paste that value into Render as `DATABASE_URL`. Keep `POSTGRES_SSL=true` and do not add `sslmode=require` to the URL.
6. Redeploy the Render service.

The app will automatically create one table called `app_state` and store the current Pokaya AI app data there. If `DATABASE_URL` is empty, it falls back to local `data/db.json` for development.

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

1. Open your deployed Pokaya AI site.
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

速创API powers `Veo 3.1`, `Sora 2`, `Gemini Omni`, and `Grok Imagine Video` video generation.

The media endpoints used are:

- `Veo 3.1` -> `/api/async/video_veo3.1_fast` with `model=veo3.1-fast`
- `Sora 2` -> `/api/async/video_sora2`
- `Gemini Omni` -> `/api/async/video_google_omni`
- `Grok Imagine Video` -> `/api/async/video_grok_imagine`

All tasks are polled through `/api/async/detail`.

## Optional: Connect Atlas Cloud Seedance 2.0

Atlas Cloud powers only `Seedance 2.0` video generation. The other media models stay on their existing providers.

The media endpoints used are:

- `Seedance 2.0` -> `/api/v1/model/generateVideo` with `model=bytedance/seedance-2.0/text-to-video`

Results are polled through `/api/v1/model/prediction/{id}`.

## Later, Not Now

When traffic grows, split the single JSONB app state into normalized Postgres tables:

- `users`
- `projects`
- `payments`
- `usage_events`
- `support_tickets`

Only split frontend to Vercel after the Render version is working.
