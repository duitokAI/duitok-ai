# Duitok AI Codex Handoff - 2026-05-27

Reactivation prompt:

```text
We are continuing from this handoff. Read docs/codex-handoffs/2026-05-27-duitok-current-state.md first, inspect the current repo state, verify what still applies, and continue from the next steps without assuming the old chat context is available.
```

## Repo

- Path: `/Users/zixian/Documents/DuitTok AI`
- Branch: `main`
- App: Vite frontend plus Express server in `server.mjs`
- Current working tree has user/previous untracked assets such as screenshots, videos, demo captures, and PRD docs. Do not assume all untracked files are from the current task.

## Current Goal

Keep developing and polishing DuitTok AI while reducing Codex thread drag. This handoff exists so future work can continue in a fresh Codex chat without carrying the long prior conversation.

## Completed This Session

- Fixed Studio sidebar jump:
  - Problem: clicking a project in the left sidebar caused the sidebar/page to jump back to the top because `render()` replaces `app.innerHTML`.
  - Change: added `captureScrollState()` and `restoreScrollState()` around `render()` in `src/main.js`.
  - Relevant file: `src/main.js`.

- Changed homepage background behavior:
  - Problem: `https://duitok.com/` used a CSS gradient that made only the top portion dark and the lower sections light.
  - Cause: `.public-shell` had `linear-gradient(180deg, #100712 0 760px, #f8f6fa 760px 100%)`.
  - Change: added `home-shell` to the homepage `<main>` and added homepage-only dark full-page overrides in `src/styles.css`.
  - Relevant files: `src/main.js`, `src/styles.css`.

- Ran build verification:
  - Command: `npm run build`
  - Result: passed.

## Model Cost Findings

From `server.mjs`:

- Public-to-internal model map is around `server.mjs:51`.
- Provider routing is around `server.mjs:956`.
- Internal cost table is around `server.mjs:119`.
- User credit charge logic is around `server.mjs:987`.

Current DuitTok model table:

| Frontend name | Actual model | Supplier | Internal cost | User charge | Gross profit |
|---|---|---|---:|---:|---:|
| Duitok Image | GPT Image 2 | APIMart | RM0.024 / image | RM0.10 | RM0.076 |
| Duitok Image Pro | Nano Banana Pro | GRS AI | RM0.105 / image | RM0.20 | RM0.095 |
| Duitok Video | Seedance 2.0 | Atlas Cloud | RM0.480 / 4s | RM0.40 / 4s | -RM0.080 |
| Duitok Video Plus | Veo 3.1 | Wuyin / 速创API | RM0.234 / 8s | RM0.40 | RM0.166 |
| Duitok Story Video | Sora 2 | Wuyin / 速创API | RM0.093 / 8s | RM0.48 / 8s | RM0.387 |
| Duitok Omni Video | Gemini Omni | Wuyin / 速创API | RM0.584 / 10s | RM1.30 | RM0.716 |
| Duitok Motion Video | Grok Imagine Video | Wuyin / 速创API | RM0.292 / 10s | RM0.60 / 10s | RM0.308 |
| Text / Prompt actions | APIMart Text | APIMart | RM0.010 / text | RM0.10 | RM0.090 |

Important business note:

- Excluding Seedance, the weighted model-basket gross margin is about 57.8%. So RM100 of usage revenue yields about RM57.80 gross profit and RM42.20 provider cost.
- Seedance is currently negative margin: RM0.48 cost for 4s but only RM0.40 user charge. Consider raising price or changing supplier/cost table.

## PeningLab Findings

PeningLab observed stack:

- Next.js + Vercel + Supabase.
- Supabase project ID seen publicly: `zoxgcqlqovkvlrmpcikt`.
- Logged-in frontend routes:
  - Image: `POST /api/generate/image`
  - UGC video: `POST /api/generate/video`
  - Seedance: `POST /api/generate/seedance`
- PeningLab frontend model names:
  - Image: `nano-banana-pro` / Banana Pro, `gpt-image-2` / GPT Image 2
  - UGC: Veo 3.1
  - Cinema: Seedance 2.0
  - Story/Grok: Grok Imagine 3
  - Sora 2 also exists in their UI.
- PeningLab provider labels:
  - P2 default = Crun.ai
  - P1 = GeminiGen

PeningLab user-facing costs observed:

- Image: RM0.20 per generation.
- Veo 3.1 Fast 8s: RM0.40.
- Auto Content: RM0.30 plan + RM0.40 per video.
- Story / Grok Imagine: RM0.03 per second.
- Seedance: RM0.40 per second.
- Sora 2: RM0.06 per second.

High-level comparison:

- DuitTok excluding Seedance has stronger margin than PeningLab if PeningLab pays public Crun prices.
- PeningLab's RM0.40 Veo 8s pricing is very aggressive and may be near break-even unless they have lower private rates or route cleverly.

## Codex Performance Check

Used `$keep-codex-fast` report-only mode:

- Active sessions: 1.336 GB.
- Archived sessions: 0.499 GB.
- Logs: 261.1 MB.
- Archived logs: 0.591 GB.
- Old session candidates: 0.
- Worktree candidates: 0.
- Config prune candidates: 0.
- Extended Windows paths: 0.
- Node process observed: ~7.1 MB.

Conclusion:

- Local Codex state is not obviously bloated.
- Main slowdown likely comes from the current long thread and large working context.
- Best optimization: continue in a fresh Codex thread using this handoff.

## Commands Already Run

- `npm run build` after sidebar scroll fix: passed.
- `npm run build` after homepage dark background change: passed.
- `python3 /Users/zixian/.codex/skills/keep-codex-fast/scripts/keep_codex_fast.py`: report-only, passed.
- Various `rg`, `git diff`, and local code inspection commands.

## Current Dirty State

Known modified files from this session:

- `src/main.js`
- `src/styles.css`

There are many untracked files in the repo, mostly QA images/videos and docs. Treat them as pre-existing/user-generated unless the user explicitly asks to clean, stage, or remove them.

## Open Decisions

- Whether to raise Seedance pricing or update its supplier/cost assumptions.
- Whether homepage should stay fully dark after visual QA, or use a more nuanced dark-to-dark section rhythm.
- Whether to commit current fixes.
- Whether to run browser visual QA on desktop and mobile for `/` and `/studio`.
- Whether to create a recurring report-only Codex maintenance reminder.

## Suggested Next Steps

1. In a fresh Codex thread, read this handoff and run `git status --short`.
2. Review the homepage visually at desktop and mobile sizes.
3. Verify the sidebar scroll fix in the Studio by scrolling the project list and clicking a lower project.
4. Decide whether to tune the dark homepage section cards for contrast and polish.
5. Decide Seedance pricing: minimum break-even is above RM0.48 per 4s; target margin likely needs RM0.60-RM0.80 per 4s or a per-second rate adjustment.
6. If current fixes are accepted, stage only intended files and commit.
7. Consider a weekly report-only Codex maintenance reminder, but do not run automatic mutating cleanup.
