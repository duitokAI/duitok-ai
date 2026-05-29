# Pokaya AI Rebrand Migration PRD

Last updated: 2026-05-29

## 1. Background

The product is moving from **Duitok AI** to **Pokaya AI** because the TikTok developer review rejected the current app name. The reviewer explicitly said the app name must not contain `Tik`, `Tok`, or combinations such as `xyzTok` / `Tikxyz`.

The new brand decision is:

- Product name: **Pokaya AI**
- Primary domain: **pokaya.ai**
- Existing domain: **duitok.com**
- Market focus: Malaysia TikTok Shop sellers and affiliate sellers
- Mascot concept: a wallet mascot, meaning the platform helps users move toward more money

This PRD defines the migration scope, order, risks, and acceptance criteria for changing the product name and domain without breaking production auth, payment callbacks, TikTok callbacks, existing user data, R2 media, or old links.

## 2. Why Pokaya AI

Pokaya works better than names that contain Tik/Tok because:

- It avoids TikTok review rejection caused by `Tik` / `Tok`.
- It sounds brandable and abstract, closer to names like Claude, ChatGPT, or Grok.
- It contains a useful Malay-market association through `kaya`, which suggests wealth / richness.
- It fits the wallet mascot and the promise that users can generate more selling opportunities.
- It is distinctive enough for GEO / SEO. A unique coined name can own search results faster than generic names.

Brand interpretation:

> Pokaya AI = a content and selling assistant for Malaysia sellers who want to create more product content, test more hooks, and move closer to more money.

## 3. Goals

### 3.1 Business Goals

- Pass TikTok developer app name review.
- Move the public brand from Duitok AI to Pokaya AI.
- Make `pokaya.ai` the primary customer-facing domain.
- Preserve existing users, projects, generated media, schedules, payments, and admin access.
- Avoid sudden breakage for old `duitok.com` links during migration.
- Set a clean foundation for GEO pages and brand search traffic.

### 3.2 Product Goals

- Users should see one consistent name: **Pokaya AI**.
- The product should no longer visually look like a TikTok-branded or TikTok-affiliated product.
- TikTok remains the target platform in copy, but only as a destination/use case, not as part of the app name.
- Studio, Agent, SOP, billing, auto-post, and downloads should feel like one Pokaya system.

### 3.3 Technical Goals

- Keep old storage keys and localStorage keys compatible where changing them would log users out or orphan data.
- Add new Pokaya-branded aliases gradually instead of destructive renames.
- Update domain-dependent environment variables and third-party callback URLs in the right order.
- Keep `duitok.com` as a redirect or secondary domain until all callbacks and review processes are stable.

## 4. Non-Goals

This migration does not include:

- Changing the business model or pricing.
- Removing TikTok as a supported platform.
- Rebuilding the app architecture.
- Migrating database table names unless there is a real technical reason.
- Renaming every internal file immediately if the file name is only a harmless implementation detail.
- Replacing every image asset in one pass if the visible brand can be updated first.

## 5. Current Project Findings

The repository has around 998 keyword hits related to `Duitok`, `duitok`, `TikTok`, `PUBLIC_APP_URL`, payment, domain, and storage.

Key surfaces found:

- `index.html`: page title and favicon still use Duitok assets.
- `src/main.js`: most product copy, navigation, Agent copy, SOP copy, localStorage keys, export file names, referral links, billing display, Auto Post copy.
- `src/styles.css`: visual classes are mostly generic, but some page styling assumes current brand assets.
- `server.mjs`: health service name, seed admin user, plan names, default captions/hashtags, model labels, payment customer defaults, provider redaction copy, Agent system identity, TikTok callback URL generation.
- `render.yaml`: Render service name, admin email default, disk name, env template.
- `DEPLOY.md`: deployment instructions, old domain, admin email, media URL examples, CHIP callback instructions.
- `public/duitok-autopost-extension/*`: Chrome extension name, host permissions, popup copy, README, download folder name.
- `public/*`: many Duitok-branded logos, mascot images, favicon, Agent assets, banner assets.
- `scripts/*`: smoke test admin email, demo recorder production URL, file names.
- `docs/*`: many PRDs and handoff docs use Duitok as historical product name.
- Current browser/project context: `pokaya.ai` is already registered on Cloudflare.

## 6. Migration Principles

### 6.1 Public Brand Changes First

Anything users, reviewers, or TikTok sees should move to Pokaya first:

- App name
- Domain
- Landing page
- Login/register
- Studio sidebar
- Billing
- Agent
- SOP
- Auto Post UI
- Email/payment display if visible
- Extension name and description

### 6.2 Preserve Internal Compatibility

Do not blindly rename every internal key in one release. Some names are safe to keep temporarily:

- Database state ID
- Old project data fields
- Existing R2 object paths
- Existing localStorage keys
- Existing old download endpoints
- Existing `duitok.com` links while redirects are active

If we change localStorage keys too quickly, existing users may be logged out or lose client-side Agent chat history.

### 6.3 Keep TikTok As Use Case, Not Brand

Allowed:

- "Create TikTok Shop content"
- "Connect TikTok"
- "Auto Post to TikTok"
- "TikTok Shop seller"

Avoid:

- Product/app names containing `Tik`, `Tok`, `Duitok`, or anything that looks like a TikTok derivative.
- Icons or logos that imply official TikTok affiliation.
- Copy like "TikTok AI" or "Tok seller AI" as a product name.

### 6.4 Domain Cutover Must Be Reversible

The first domain switch should add `pokaya.ai` without deleting `duitok.com`. Once payments, TikTok OAuth, API callbacks, and login are verified, we can choose whether `duitok.com` redirects to `pokaya.ai` or remains as a legacy domain.

## 7. Naming System

### 7.1 Primary Names

| Surface | New Name |
|---|---|
| Product | Pokaya AI |
| Website | pokaya.ai |
| Agent | Pokaya Agent |
| Studio | Pokaya Studio |
| Auto Post extension | Pokaya Auto Post |
| Media storage label | Pokaya media |
| Billing plan | Pokaya AI Pro |
| Admin display | Pokaya AI Admin |

### 7.2 Names To Retire Publicly

- Duitok AI
- Duitok Agent
- Duitok Studio
- Duitok Auto Post
- `#duitok` in generated hashtags
- `admin@duitok.com` as visible public/admin default
- `https://duitok.com/ref/...` referral links

### 7.3 Temporary Internal Aliases

These can remain temporarily for compatibility:

- `localStorage` keys beginning with `duitok-`
- R2 bucket/object names containing `duitok`
- Existing database seed IDs
- Existing exported historical result records
- Internal repo folder name
- Render service name, if no user-facing effect and changing it risks downtime

## 8. Scope By Area

### 8.1 Domain And DNS

Required:

- Add `pokaya.ai` to Cloudflare DNS.
- Add `www.pokaya.ai`.
- Add both custom domains to Render service.
- Configure DNS records according to Render instructions.
- Keep `duitok.com` active during migration.
- Decide canonical behavior:
  - Phase 1: both domains work.
  - Phase 2: `duitok.com` redirects to `pokaya.ai` after TikTok/payment callbacks are updated.

Risks:

- Wrong DNS target can break login and API calls.
- Redirect too early can break TikTok OAuth or CHIP callbacks.

### 8.2 Render Environment

Required env updates:

- `PUBLIC_APP_URL=https://pokaya.ai`
- `CORS_ORIGINS=https://pokaya.ai,https://www.pokaya.ai,https://duitok.com,https://www.duitok.com`
- `R2_PUBLIC_BASE_URL` if media moves to a Pokaya media subdomain.
- `ADMIN_EMAILS` if a new admin email is created, e.g. `admin@pokaya.ai`.

Keep temporarily:

- Existing secrets and provider envs.
- Existing database.
- Existing disk.

### 8.3 TikTok Developer App

Required:

- App name: `Pokaya AI`
- App description: remove any implication of official TikTok affiliation.
- Redirect URI: add `https://pokaya.ai/api/tiktok/oauth/callback`.
- Keep `https://duitok.com/api/tiktok/oauth/callback` until old users/callbacks are confirmed unnecessary.
- Website URL: `https://pokaya.ai`.
- Privacy policy / terms URLs: ideally `https://pokaya.ai/privacy` and `https://pokaya.ai/terms`.

Important:

- The product can still say it helps sellers create content for TikTok Shop.
- The app name itself must not include `Tik`, `Tok`, or `Duitok`.

### 8.4 Cloudflare

Required:

- Confirm `pokaya.ai` is in the same Cloudflare account.
- Configure DNS for root and `www`.
- If using R2 public custom domain, consider `media.pokaya.ai`.
- Keep existing R2 bucket initially unless moving bucket is necessary.

Optional:

- Page rule / redirect rule from `duitok.com` to `pokaya.ai`.
- Email routing for `admin@pokaya.ai` or `support@pokaya.ai`.

### 8.5 Frontend Visible Copy

Update in `src/main.js` and `index.html`:

- Page title.
- Login/register logo text.
- Homepage H1/body mentions.
- Studio sidebar brand.
- Project header copy.
- Billing plan copy.
- Agent title/copy.
- SOP center copy.
- Auto Post copy.
- Modal label.
- Toasts and export messages.
- Referral link display.
- Download file names.

Do not remove TikTok use-case copy:

- TikTok Shop seller
- TikTok content
- Auto Post TikTok
- TikTok connection

But ensure the product name is always Pokaya AI.

### 8.6 Assets

Required public-facing asset changes:

- `favicon`
- tab icon
- horizontal logo
- stacked logo
- transparent logo
- banner
- mascot lockup if it includes the old wordmark

Current files with old brand patterns:

- `public/duitok-tab-icon-transparent.png`
- `public/duitok-logo-transparent.png`
- `public/duitok-logo-horizontal.png`
- `public/duitok-logo-stacked.png`
- `public/duitok-brand-banner.png`
- `public/duitok-brand-banner-transparent.png`
- `public/duitok-brand-mascot.png`
- `public/duitok-mascot-transparent.png`
- `public/duittok-favicon.svg`
- `public/duittok-favicon-v2.svg`

Recommended approach:

- Add new `pokaya-*` assets first.
- Update references to new files.
- Keep old files in `public/` temporarily so old cached bundles do not 404.

### 8.7 Server Copy And Data Defaults

Update in `server.mjs`:

- `/api/health` service from `duitok-ai` to `pokaya-ai`.
- `defaultBilling().plan` from `Duitok AI Pro` to `Pokaya AI Pro`.
- Seed admin name from `Duitok AI Admin` to `Pokaya AI Admin`.
- Seed billing plan.
- Default captions such as `Generated with Duitok AI`.
- Default hashtags from `#duitok` to `#pokaya`.
- Provider redaction text from `Duitok AI` to `Pokaya AI`.
- Agent system identity from `You are Duitok AI...` to `You are Pokaya AI...`.
- `User-Agent` string from `DuitokAgent/1.0` to `PokayaAgent/1.0`.
- CHIP default customer email/name if no customer email exists.
- Payment item name from `Duitok AI credits` to `Pokaya AI credits`.

Compatibility:

- Existing users with `Duitok AI Pro` should either be migrated on read or displayed as `Pokaya AI Pro` without rewriting all history.
- Historical invoices can keep old text if already issued, but new invoices should use Pokaya.

### 8.8 Auth And localStorage

Current frontend keys:

- `duitok-user`
- `duitok-auth`
- `duitok-lang`
- `duitok-admin-key`
- `duitok-agent-messages`
- `duitok-agent-context-summary`

Recommendation:

- Phase 1: keep reading old keys and write both old + new keys.
- Phase 2: read `pokaya-*` first, fallback to `duitok-*`.
- Phase 3: after 30-60 days, optionally stop writing old keys.

Do not do a hard localStorage rename in the first release.

### 8.9 Auto Post Chrome Extension

Required:

- Rename extension to `Pokaya Auto Post`.
- Update description.
- Add host permissions:
  - `https://*.pokaya.ai/*`
  - keep `https://*.duitok.com/*` temporarily.
- Update popup title/copy.
- Update README.
- Update download filename from `duitok-autopost-extension.zip` to `pokaya-autopost-extension.zip`.

Important:

- Extension package folder may stay `duitok-autopost-extension` internally for one release if renaming folder breaks export code.
- If distributing to Chrome Web Store later, create a clean package with only Pokaya naming.

### 8.10 Payments / CHIP

Required:

- Update CHIP brand/business display to Pokaya AI.
- Update callback URL if CHIP requires a domain allowlist:
  - `https://pokaya.ai/api/payments/chip/callback`
- Keep old callback active while `duitok.com` is live.
- Update product names in payment creation.
- Update customer-facing receipt/invoice plan labels.

Acceptance:

- Successful payment returns to Pokaya domain.
- Callback updates credits.
- Old callback still works during transition.

### 8.11 Referral Links

Current frontend copies:

- `https://duitok.com/ref/${code}`

Change to:

- `https://pokaya.ai/ref/${code}`

Compatibility:

- `duitok.com/ref/*` should redirect to `pokaya.ai/ref/*`.

### 8.12 Admin / Email

Current defaults include:

- `admin@duitok.com`

Recommended:

- Create `admin@pokaya.ai` or `support@pokaya.ai`.
- Add it to `ADMIN_EMAILS`.
- Keep `admin@duitok.com` in `ADMIN_EMAILS` until admin account migration is complete.

Do not remove existing admin email before confirming login and role access.

### 8.13 Docs

Docs should be split into two classes:

1. Active docs that should use Pokaya:
   - DEPLOY.md
   - current PRDs for future implementation
   - SOP export docs
   - extension README

2. Historical docs that can keep Duitok with a note:
   - old handoff files
   - old design PRDs
   - screenshots and QA artifacts

Recommendation:

- Add a note to old docs: "Historical name: Duitok AI. Current brand: Pokaya AI."
- Do not spend time rewriting every old PRD unless it is actively used.

## 9. Implementation Plan

### Phase 0: Domain Setup

Owner: ops / Codex-assisted

- Add `pokaya.ai` to Render custom domains.
- Add DNS records in Cloudflare.
- Verify:
  - `https://pokaya.ai`
  - `https://www.pokaya.ai`
  - `/api/health`
  - login page loads

Exit criteria:

- Pokaya domain works without breaking `duitok.com`.

### Phase 1: Public Brand Rename

Owner: frontend

- Add brand constants:
  - `APP_NAME = "Pokaya AI"`
  - `APP_DOMAIN = "pokaya.ai"`
  - `LEGACY_DOMAIN = "duitok.com"`
- Replace visible copy in frontend.
- Replace title/favicon/logo references.
- Update referral link.
- Update download filenames.
- Update Agent visible title to Pokaya Agent.
- Update Auto Post page visible title to Pokaya Auto Post.

Exit criteria:

- No user-facing Duitok text appears in normal homepage, login, Studio, Agent, billing, SOP, Auto Post.

### Phase 2: Backend Brand Defaults

Owner: backend

- Update health service.
- Update billing plan defaults.
- Update seed admin display name.
- Update default captions/hashtags.
- Update Agent system identity.
- Update payment product names.
- Update redaction copy.
- Keep old database records readable.

Exit criteria:

- New generated results say Pokaya AI.
- New payment links say Pokaya AI.
- Existing accounts still load.

### Phase 3: Third-Party Callback Updates

Owner: ops

- TikTok Developer:
  - app name
  - website URL
  - redirect URI
  - privacy/terms
- CHIP:
  - brand display
  - callback allowlist
- Cloudflare:
  - redirect strategy
  - optional email routing

Exit criteria:

- TikTok OAuth succeeds from `pokaya.ai`.
- CHIP payment succeeds from `pokaya.ai`.
- Old domain still works or redirects safely.

### Phase 4: Compatibility And Cleanup

Owner: engineering

- Add read fallback for old localStorage keys.
- Optionally add new `pokaya-*` localStorage keys.
- Keep old asset files for cached users.
- Add redirects for old download paths if needed.
- Update scripts and QA commands.
- Update active docs.

Exit criteria:

- Returning user can still log in and see projects.
- Agent history does not disappear unexpectedly.
- Old shared links do not hard fail.

### Phase 5: Legacy Retirement

Timing: after TikTok approval and 30-60 days of stable traffic.

Decide:

- Keep `duitok.com` as permanent redirect, or
- Keep it as secondary defensive domain, or
- Retire public use but keep ownership.

Do not retire until:

- TikTok review is approved.
- Payment callbacks are stable.
- Cloudflare analytics shows low old-domain traffic.

## 10. Acceptance Criteria

### 10.1 Product

- Homepage shows Pokaya AI.
- Login/register show Pokaya AI.
- Studio sidebar shows Pokaya AI.
- Billing plan shows Pokaya AI Pro.
- Agent title shows Pokaya Agent.
- SOP center uses Pokaya AI in platform-level copy.
- Auto Post UI uses Pokaya Auto Post.
- Referral links use `pokaya.ai`.

### 10.2 Technical

- `npm run build` passes.
- `https://pokaya.ai/api/health` returns ok.
- `https://duitok.com/api/health` still returns ok or redirects safely.
- Login works on Pokaya domain.
- Admin login works.
- Project generation still works.
- Generated media URLs still load.
- Agent message works.
- TikTok OAuth flow starts with Pokaya callback.
- Payment top-up flow starts and callback updates credits.

### 10.3 Review Safety

- TikTok developer app name does not contain `Tik`, `Tok`, or `Duitok`.
- App description says the product helps create content for sellers; it does not imply official TikTok ownership.
- Website domain is `pokaya.ai`.
- Privacy policy and terms use Pokaya branding.

## 11. QA Checklist

Desktop:

- Homepage
- Pricing/register
- Login
- Studio dashboard
- Project page
- Image SOP modal
- Full SOP page
- Agent page
- Content Library
- Billing
- Top Up Credit
- Usage
- Affiliate
- Auto Post
- Admin CRM

Mobile:

- Homepage first viewport
- Login
- Studio sidebar
- Project page
- Agent page
- Pricing/register

Functional:

- Login/logout
- Create project
- Generate image
- Generate video prompt
- Download result
- Export SOP
- Copy referral link
- Agent inspect workspace
- Agent create 7-day plan
- Auto Post queue view
- TikTok connect button
- CHIP top-up button

## 12. Search Queries Before Final Release

Run these and inspect all remaining matches:

```bash
rg -n "Duitok|duitok|DuiTok|DUITOK|duittok|#duitok|admin@duitok|duitok\\.com" . --glob '!node_modules/**' --glob '!dist/**' --glob '!test-results/**'
rg -n "TikTok AI|TikTok app|Tik Tok|TikTok-branded|Tok" src public server.mjs index.html render.yaml DEPLOY.md
rg -n "pokaya|Pokaya|pokaya\\.ai" src public server.mjs index.html render.yaml DEPLOY.md
```

Remaining `Duitok` matches are acceptable only if they are:

- Historical docs.
- Backward-compatible aliases.
- Old asset files kept intentionally.
- Redirect logic.
- Legacy migration comments.

## 13. Risks

### P0 Risks

- TikTok OAuth fails because redirect URI was not added.
- CHIP callback fails because callback domain changed before allowlist update.
- Users get logged out because localStorage keys changed without fallback.
- Generated media breaks because R2 public base URL changed incorrectly.
- Old `duitok.com` links break because redirect was applied too early.

### P1 Risks

- SEO/GEO resets if `duitok.com` redirects without canonical planning.
- User confusion if both names appear in the same flow.
- Chrome extension cannot access `pokaya.ai` because host permissions were not updated.
- Admin email migration locks out the admin account.

### P2 Risks

- Old screenshots/docs still show Duitok.
- File names in repo remain mixed for a while.
- Existing invoices show old brand historically.

## 14. Recommended First Implementation Batch

Do this first:

1. Connect `pokaya.ai` and `www.pokaya.ai` to Render.
2. Update `PUBLIC_APP_URL` and `CORS_ORIGINS`.
3. Add brand constants in frontend.
4. Rename visible product copy to Pokaya AI.
5. Add new logo/favicon assets.
6. Update server user-facing defaults.
7. Keep old localStorage keys and old domain compatibility.
8. Build, deploy, verify both domains.
9. Update TikTok Developer app name and callback.

Do not do this in the first batch:

- Rename database IDs.
- Delete old assets.
- Delete old domain.
- Remove `admin@duitok.com`.
- Rewrite every historical PRD.
- Rename every internal file/folder.

## 15. Open Decisions

1. Should `duitok.com` immediately redirect to `pokaya.ai`, or stay as secondary domain until TikTok approval?
   - Recommendation: keep both working until TikTok approval.

2. Should we create `support@pokaya.ai` now?
   - Recommendation: yes, because payment/TikTok review looks cleaner with brand email.

3. Should R2 media move to `media.pokaya.ai`?
   - Recommendation: yes eventually, but not in the first domain cutover unless easy.

4. Should internal product labels like `Duitok Image` be renamed to `Pokaya Image`?
   - Recommendation: yes for UI, but preserve backend model mapping aliases.

5. Should the Auto Post extension folder be renamed immediately?
   - Recommendation: update visible extension name first; folder/package rename can happen after export path is tested.

## 16. Final Position

Pokaya AI should become the public brand immediately, but the migration must be compatibility-first.

The correct move is not a blind global search-and-replace. The correct move is:

1. Public brand and domain first.
2. Callback and payment safety second.
3. Compatibility aliases third.
4. Internal cleanup last.

This keeps the business moving, gives TikTok a clean app name to review, and avoids breaking the working product while the brand changes.
