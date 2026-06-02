# Pokaya AI API Provider Security PRD

## 1. Background

Pokaya AI currently routes user-facing media generation through a model router. The actual upstream providers are configured on the server through environment variables, but several surfaces can still let a technical user infer which providers, endpoints, or models are being used.

The goal is not to make provider usage impossible to infer under all circumstances. A determined attacker can compare output style, latency, pricing, and metadata. The goal is to remove avoidable leakage from the product, API responses, logs, health checks, generated asset URLs, error messages, and public repository docs.

## 2. Problem

Users or competitors may inspect:

- Browser Network requests
- Frontend JavaScript bundles
- Public health endpoints
- Error responses
- Generated result text
- Generated media URLs
- Admin screens accidentally exposed to non-admins
- Public docs, examples, and deployment files
- Task IDs and provider-specific response shapes

From these, they may infer that Pokaya uses providers such as APIMart, GRS AI, Wuyin, Atlas Cloud, or specific model families.

## 3. Goals

- Hide upstream provider names from all non-admin product surfaces.
- Hide upstream endpoint paths from public API responses.
- Avoid storing or returning provider-specific task IDs to regular users.
- Normalize all generation errors into Pokaya-branded error messages.
- Proxy generated assets through Pokaya-controlled URLs.
- Keep provider diagnostics available only to admins.
- Make `/api/health` useful for infrastructure checks without revealing provider configuration.
- Create a repeatable security checklist before adding any new AI provider.

## 4. Non-Goals

- Prevent all model fingerprinting by output quality or latency.
- Hide provider names from server-only environment variables.
- Remove provider diagnostics from admin-only operational views.
- Build a full WAF or enterprise DLP system in this phase.

## 5. Current Leakage Inventory

### 5.1 Public Health Endpoint

Current risk:

- `/api/health` returns configured provider names in the `ai` field.
- This lets anyone poll production and see which upstream providers are active.

Required change:

- Public health response should only return generic status:
  - `ok`
  - `service`
  - `storage`
  - `generation`
- Provider details must move to an admin-authenticated endpoint.

### 5.2 Frontend Model Names

Current risk:

- User-facing dropdowns include names that may map directly to upstream provider/model choices.
- Some names are product names, which is acceptable, but provider-specific naming should be avoided.

Required change:

- Keep user-facing product labels only:
  - `AI Image`
  - `Product Image`
  - `Cinematic Video`
  - `Fast Video`
  - `Realistic Avatar Video`
- Server maps these labels to providers internally.

Decision:

- If marketing requires model names such as `Seedance 2.0`, treat that as an intentional product disclosure. Otherwise use Pokaya-branded labels.

### 5.3 Result Text

Current risk:

- Generated result body can include strings such as `Image generated with APIMart`, `GRS AI`, `Atlas Cloud`, or `速创API`.
- Users can see provider names directly in their result history.

Required change:

- Replace all user-facing result text with Pokaya-branded text:
  - `Image generated with Pokaya AI.`
  - `Video generated with Pokaya AI.`
  - `Your media is ready.`
- Provider names only appear in admin logs.

### 5.4 Task IDs

Current risk:

- User-facing result cards display upstream `taskId`.
- Task ID format can reveal provider and may be useful for probing third-party APIs.

Required change:

- Store two IDs:
  - `publicJobId`: Pokaya UUID shown to users.
  - `providerTaskId`: encrypted or server-only field for admin diagnostics.
- Never return `providerTaskId` in normal `publicState`.

### 5.5 Admin API Call Logs

Current risk:

- Admin screens show provider, endpoint, task ID, cost, and error messages.
- This is acceptable only if admin access is strict.

Required change:

- Confirm all `apiCalls` and full `generationJobs` views require admin.
- Add explicit `isAdmin` guard tests.
- Redact API call logs in browser if the current user is not admin.

### 5.6 Error Messages

Current risk:

- Server errors mention provider env names and provider brands.
- Upstream error bodies may be passed through to generation jobs.

Required change:

- User-facing errors:
  - `Generation failed. Please try again.`
  - `Provider is temporarily unavailable.`
  - `This model is currently unavailable.`
- Admin logs can store provider error details separately.
- Never return raw upstream error JSON to non-admin users.

### 5.7 Generated Asset URLs

Current risk:

- If media remains hosted on provider URLs, the URL domain reveals the upstream provider or intermediate API.

Required change:

- Mirror all generated assets to Pokaya-controlled storage, preferably Cloudflare R2.
- Serve user media through:
  - `/api/media/result/:id/image`
  - `/api/media/result/:id/video`
- Do not expose `originalImageUrl` or `originalVideoUrl` to non-admin users.

### 5.8 Public Docs And Config

Current risk:

- `.env.example`, `render.yaml`, and `DEPLOY.md` contain provider names and endpoint paths.
- This is acceptable in a private repo, but risky if repo becomes public or screenshots are shared.

Required change:

- Move provider-specific setup into private operator docs.
- Public docs should use generic names:
  - `IMAGE_PROVIDER_API_KEY`
  - `VIDEO_PROVIDER_API_KEY`
  - `MEDIA_PROVIDER_BASE_URL`
- Keep real provider mappings in private deployment notes.

## 6. Product Requirements

### P0: Public Health Endpoint Redaction

As an unauthenticated visitor, I should not be able to determine which AI providers Pokaya has configured.

Acceptance criteria:

- `GET /api/health` returns no provider names.
- `GET /api/health` returns no model names.
- `GET /api/health` returns no endpoint paths.
- Admin-only diagnostics endpoint returns provider status after auth.

### P0: User-Facing Result Redaction

As a normal user, I should only see Pokaya-branded generation status.

Acceptance criteria:

- Result cards do not display provider names.
- Result cards do not display upstream task IDs.
- Result body does not mention APIMart, GRS AI, Atlas Cloud, Wuyin, or upstream endpoint names.
- Failed result messages are generic and helpful.

### P0: Provider Task ID Isolation

As an operator, I need provider task IDs for debugging, but users should not receive them.

Acceptance criteria:

- `publicState` for non-admin users excludes provider task IDs.
- Admin state can include provider task IDs.
- User-visible job ID is a Pokaya UUID.

### P0: Asset Proxy Enforcement

As a normal user, I should never see provider-hosted media URLs.

Acceptance criteria:

- Generated media in the UI uses Pokaya URLs.
- API responses for non-admin users exclude original provider URLs.
- If R2 is not configured, `/api/media/result` still proxies provider URLs server-side.

### P1: Provider-Agnostic UI Labels

As a product owner, I want the flexibility to swap providers without changing user-facing UI.

Acceptance criteria:

- UI labels do not directly reveal provider names.
- Server has an internal mapping from product capability to provider/model.
- Changing provider does not require changing frontend labels.

### P1: Error Normalization

As a user, I should receive clear errors without upstream details.

Acceptance criteria:

- Upstream errors are mapped to safe messages.
- Admin logs retain raw details behind admin auth.
- No upstream request body or response body is returned to non-admin users.

### P1: Admin Diagnostics Hardening

As an admin, I need provider visibility, but only after strong access checks.

Acceptance criteria:

- `apiCalls` only visible to admin.
- Full generation job provider fields only visible to admin.
- Add tests for admin/non-admin state separation.

### P2: Public Repo Hygiene

As the owner, I should be able to make the repo public without revealing exact supplier stack.

Acceptance criteria:

- Public docs use generic provider names.
- Private deployment docs hold real provider names.
- `.env.example` avoids exact upstream endpoints unless intentionally documented.

## 7. Technical Design

### 7.1 Provider Router Boundary

Create a single internal provider router module:

```text
User request -> Pokaya capability -> provider router -> upstream provider
```

The frontend should only know `capability`, not `provider`.

Recommended internal fields:

- `capability`: `image_standard`, `image_product`, `video_fast`, `video_cinematic`, `video_avatar`
- `publicModelLabel`: user-facing label
- `provider`: admin-only
- `providerModel`: admin-only
- `providerTaskId`: admin-only

### 7.2 Public Job Shape

Normal user response:

```json
{
  "id": "pokaya-job-id",
  "type": "video",
  "status": "completed",
  "modelLabel": "Cinematic Video",
  "mediaUrl": "/api/media/result/result-id/video",
  "message": "Video generated with Pokaya AI."
}
```

Admin response:

```json
{
  "id": "pokaya-job-id",
  "provider": "internal-provider-code",
  "providerTaskId": "upstream-task-id",
  "endpoint": "/internal/upstream/path",
  "rawError": "redacted unless expanded"
}
```

### 7.3 Health Endpoint

Public:

```json
{
  "ok": true,
  "service": "pokaya-ai",
  "storage": "postgres",
  "generation": "available"
}
```

Admin:

```json
{
  "ok": true,
  "providers": [
    { "capability": "image_standard", "configured": true },
    { "capability": "video_fast", "configured": true }
  ]
}
```

### 7.4 Media Proxy

All user media should resolve through Pokaya:

```text
/api/media/result/:id/image
/api/media/result/:id/video
```

Rules:

- Verify auth and ownership.
- Fetch original provider URL server-side only.
- Stream media with safe content type.
- Cache through R2/CDN when possible.
- Never include original URL in non-admin JSON.

## 8. Security Test Plan

### Manual Checks

- Open DevTools Network as a normal user.
- Generate image and video.
- Confirm Network requests only hit Pokaya domain.
- Confirm response JSON has no provider names.
- Confirm response JSON has no upstream task IDs.
- Confirm media URL is Pokaya URL, not provider URL.
- Visit `/api/health` while logged out and confirm no provider names.

### Automated Checks

Add tests for:

- `publicState` redacts provider fields for non-admin users.
- `publicState` includes provider diagnostics for admin users only.
- `/api/health` returns generic data.
- Failed generation returns safe error to normal user.
- Result media endpoint requires auth and ownership.

### Static Scans

Add CI scan for:

- Provider brand names in frontend bundles.
- Upstream endpoint paths in frontend source.
- `API_KEY` values committed to repo.
- Raw `taskId` returned in non-admin API responses.

## 9. Rollout Plan

### Phase 1: Stop Obvious Leakage

- Redact `/api/health`.
- Remove provider names from result text.
- Hide upstream task IDs from normal users.
- Normalize user-facing errors.

### Phase 2: Strengthen Media Privacy

- Enforce Pokaya media proxy.
- Configure R2 mirror for all generated assets.
- Remove original provider URLs from normal user state.

### Phase 3: Provider-Agnostic Product Layer

- Replace frontend model names with capability labels.
- Move provider/model mapping fully server-side.
- Add admin-only provider diagnostics.

### Phase 4: Repo And Ops Hygiene

- Split public docs from private operator docs.
- Add static leak scan.
- Add provider onboarding checklist.

## 10. Success Metrics

- Zero provider names visible in logged-out Network/HTML/JS.
- Zero provider names visible in normal-user API responses.
- Zero upstream media URLs visible in normal-user responses.
- Public health endpoint reveals no provider stack.
- Admin can still debug provider failures within 2 minutes.

## 11. Open Decisions

- Should user-facing model names remain specific, such as `Seedance 2.0`, for marketing trust?
- Should generated assets always be mirrored to R2 before being shown, or can the proxy stream first and mirror asynchronously?
- Should provider docs be removed from repo entirely or moved to a private `ops/` folder?
- Should admin logs show full upstream endpoint paths by default, or require an explicit reveal action?

## 12. Recommended Immediate Fixes

1. Change `/api/health` to remove provider names.
2. Replace result messages like `Image generated with APIMart` with `Image generated with Pokaya AI`.
3. Stop returning upstream `taskId` to non-admin users.
4. Ensure `originalImageUrl` and `originalVideoUrl` are admin-only.
5. Add a regression test that searches normal-user JSON for provider names.
