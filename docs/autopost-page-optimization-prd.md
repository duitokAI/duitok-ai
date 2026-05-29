# Auto Post TikTok Page Optimization PRD

Last updated: 2026-05-29

## 1. Background

The current Auto Post TikTok page is functional but feels like a documentation page plus an empty queue. It shows:

- Chrome extension setup instructions.
- TikTok Direct Post connection controls.
- A TikTok queue section.
- Export button.

The main issue is that the page does not yet behave like a publishing operations center. Users need to understand what to do next, whether they are ready to publish, which content is blocked, and how generated assets move from asset library to scheduled TikTok content.

## 2. Product Positioning

This page should become:

> The publishing command center for turning generated Pokaya assets into reviewed TikTok posts.

It should not feel like a technical integration settings page. It should help sellers answer:

- What is ready to post?
- What still needs a video, caption, product link, or TikTok connection?
- Should I use Chrome extension mode or official TikTok Direct Post?
- What do I need to do next?
- What has already been posted or failed?

## 3. Goals

### User Goals

- Quickly see whether posting setup is complete.
- Understand the difference between Extension Mode and Official API Mode.
- Review scheduled content without opening every project.
- Fix missing media, captions, hashtags, or product URLs before publishing.
- Publish or prepare posts with confidence.
- Track posted, draft, failed, and processing items.

### Business Goals

- Increase weekly active usage after generation.
- Move users from “generate once” to “generate, schedule, publish, repeat.”
- Make asset library and Agent outputs feel connected to real TikTok execution.
- Reduce support questions about how to post.
- Increase perceived value of the platform beyond generation.

## 4. Current Problems

### 4.1 Weak Information Hierarchy

The current page gives three equal columns:

- Extension SOP.
- TikTok Direct Post.
- TikTok Queue.

But not all sections are equally important. The queue and readiness state should be the hero because that is the actual job-to-be-done.

### 4.2 Too Much Instructional Text

The extension card explains setup in long copy. Users scanning the page may not know what to click first.

### 4.3 Queue Empty State Is Not Useful

When there are no scheduled items, the page only says there are 0 scheduled items. It should guide users back to:

- Asset Library.
- Agent.
- Project generation.

### 4.4 No Readiness Diagnostics

A scheduled item can be blocked by:

- No media.
- No caption.
- No hashtag.
- No product URL.
- TikTok not connected.
- Official API publish unavailable.
- Extension not installed.

The page currently does not surface these issues.

### 4.5 Publishing Modes Are Confusing

Users see both extension and official API, but the page does not clearly explain:

- Extension mode = local Chrome assistant, user still reviews/clicks.
- Official API mode = direct TikTok connection, requires Content Posting API access and valid media URL.

## 5. Proposed Page Structure

### 5.1 Top Header

Replace current generic header with a publishing-focused header:

```text
Auto Post TikTok
Review, prepare, and publish your scheduled TikTok content.

[Add from Asset Library] [Ask Agent to create schedule] [Export]
```

Primary CTA should be based on state:

- If queue is empty: `Add from Asset Library`.
- If queue has drafts: `Review Drafts`.
- If TikTok not connected: `Connect TikTok`.
- If ready items exist: `Publish Ready Items`.

### 5.2 Publishing Status Bar

Add 4 compact metrics:

- Drafts.
- Ready.
- Processing.
- Posted.
- Failed.

Example:

```text
Draft 7 | Ready 3 | Processing 1 | Posted 12 | Failed 0
```

This gives the page immediate operational value.

### 5.3 Setup Health Checklist

Add a small setup card:

```text
Publishing setup
✓ Asset library has media
✓ Captions generated
! TikTok official account not connected
✓ Chrome extension available
```

Each checklist item links to the action:

- `Open Asset Library`.
- `Generate caption`.
- `Connect TikTok`.
- `Download Extension`.

### 5.4 Queue First Layout

Desktop layout should prioritize queue:

```text
[Queue / Calendar Table - 65% width] [Setup + Publishing Modes - 35% width]
```

The queue should not be the third column. It should be the primary work surface.

### 5.5 Publishing Mode Cards

Split into two clear mode cards:

#### Extension Mode

Use when:

- Official TikTok API is not approved.
- User wants manual review before final publish.
- User uploads through TikTok web.

CTA:

- `Download Extension`
- `View Setup Steps`

#### Official Direct Post

Use when:

- TikTok account is connected.
- Content Posting API is approved.
- Media URL is durable and public.

CTA:

- `Connect TikTok`
- `Check Creator Info`
- `Publish Ready`

## 6. Queue Item Requirements

Each queue item should become an actionable card or row with:

- Thumbnail or video preview.
- Title.
- Project / product.
- Caption preview.
- Hashtags.
- Scheduled time.
- Status.
- Media readiness.
- Product URL readiness.
- Actions.

### Required Actions

Each queue item should support:

- Edit caption.
- Edit hashtags.
- Edit scheduled time.
- Attach/change media.
- Open source asset.
- Mark Ready.
- Publish via Official API.
- Copy to extension.
- Delete draft.

### Status Rules

Use clear statuses:

- `Draft`: not ready yet.
- `Ready`: ready for extension/API publish.
- `Processing`: publish request started.
- `Posted`: publish completed or user marked posted.
- `Failed`: publish failed or missing required data.

## 7. Empty States

### Empty Queue

Current empty queue should be replaced with:

```text
No scheduled posts yet.
Turn generated assets into TikTok drafts.

[Open Asset Library] [Ask Agent for 7-day schedule] [Create first project]
```

### No TikTok Connection

```text
TikTok is not connected.
You can still use Extension Mode, or connect TikTok for official Direct Post.

[Connect TikTok] [Download Extension]
```

### No Media In Drafts

```text
3 drafts need media.
Attach a generated asset before publishing.

[Find assets]
```

## 8. Agent Integration

Agent should be able to operate this page through natural language:

- “把最近 5 个视频加入排期”
- “检查哪些 TikTok drafts 还缺东西”
- “把 ready 的内容安排到今晚”
- “帮我生成 caption 和 hashtag”
- “把这个 asset 变成 TikTok draft”

Agent tool flow:

```text
inspect_workspace_state
-> identify schedule gaps
-> create_schedule_draft / update_autopost_job
-> open_workspace(page=autopost)
```

## 9. Asset Library Integration

Auto Post page must connect tightly with Asset Library:

- `Add from Asset Library` opens filtered asset picker.
- Asset cards can send result directly to queue.
- Queue item can open source asset.
- Source prompt should remain accessible.
- Product/project association should be visible.

## 10. UX Details

### Visual Style

This page should feel operational, not decorative:

- Dense but clean.
- Fewer oversized cards.
- Clear status chips.
- Tables/cards built for scanning.
- Avoid long paragraphs in primary view.

### Recommended Desktop Layout

```text
Header
Status metrics
Queue toolbar
Main queue table/cards
Right rail: setup health + publishing modes + recent publish log
```

### Recommended Mobile Layout

```text
Header
Status metrics horizontal scroll
Queue cards
Setup accordion
Publishing mode accordion
```

## 11. Functional Requirements

### P0

- Queue-first layout.
- Status metrics.
- Useful empty states.
- Queue item readiness indicators.
- Queue item actions: edit, ready/post toggle, delete.
- Add from Asset Library CTA.
- Official API connection status made clearer.

### P1

- Asset picker modal.
- Bulk actions: mark ready, delete, export.
- Calendar/date grouping.
- Publish readiness score.
- Agent “fix queue” actions.

### P2

- True calendar view.
- Multi-account TikTok queue.
- Per-account posting limits.
- Post-performance feedback loop.
- Auto-generate missing captions/hashtags from asset prompt.

## 12. Backend Requirements

Existing schedule objects should support:

- `projectId`
- `resultId`
- `title`
- `caption`
- `hashtags`
- `mediaUrl`
- `productUrl`
- `platform`
- `time`
- `status`

Add or confirm:

- `GET /api/autopost/jobs`
- `PATCH /api/autopost/jobs/:id`
- `POST /api/results/:id/schedule`
- `POST /api/tiktok/publish/:id`
- `GET /api/tiktok/status`

Future:

- `POST /api/schedule/bulk`
- `POST /api/schedule/:id/repair`
- `GET /api/schedule/readiness`

## 13. Success Metrics

Track:

- Assets added to schedule per user.
- Drafts marked ready.
- Official API publish attempts.
- Extension downloads.
- Empty queue CTA clicks.
- Agent-created schedule drafts.
- Time from generation to scheduled draft.

Target outcomes:

- More users move from asset generation to schedule creation.
- Fewer “how do I post?” support messages.
- More repeat visits to Auto Post page.

## 14. Acceptance Criteria

- A user with zero scheduled items sees clear next actions, not a dead empty page.
- A user with scheduled items can tell what is ready, blocked, posted, and failed within 5 seconds.
- A user can add generated assets to queue from the publishing page or asset library.
- A user can understand whether to use Extension Mode or Official Direct Post.
- Queue cards show missing requirements before publish.
- Mobile layout remains usable without horizontal page overflow.

## 15. Recommended Implementation Order

1. Rebuild layout to queue-first.
2. Add status metrics and empty states.
3. Improve queue item cards with readiness indicators.
4. Add edit/delete/ready/publish actions.
5. Add Asset Library entry point.
6. Add Agent queue diagnostics.
7. Add bulk actions and calendar grouping.

## 16. Product Principle

The Auto Post page should not be a place where users read instructions.

It should be the place where users finish the content loop:

```text
Generate asset -> Review asset -> Add to queue -> Fix missing details -> Publish -> Learn -> Repeat
```

