---
name: pokaya-ui-stability
description: Use for Pokaya/DuitTok AI frontend work involving Studio, sidebar, settings modal, composer, media wall, billing, usage, image/video results, responsive layout, visual regression fixes, hover states, scrolling, clipping, or performance-sensitive UI. This is the default project workflow for screenshot-driven UI changes and production frontend stability.
---

# Pokaya UI Stability

This skill is the default workflow for Pokaya/DuitTok AI UI work. Pokaya is a dense AI content workspace, not a landing page or decorative demo. Prefer small, stable changes that preserve the current architecture.

## Trigger

Use this skill when the user asks to adjust, fix, optimize, or inspect:

- Studio, prompt composer, bottom bar, toolbar, media wall, result cards, image/video pages
- Sidebar, navigation, thread list, settings modal, billing, top-up, usage
- Aspect ratio, image sizing, hover labels, buttons, scroll containers, overlays, z-index
- Visual issues from screenshots: clipping, flashing, shrinking, empty space, overflow, hidden content
- Frontend performance around thumbnails, media loading, wall rendering, or interaction jank

## Non-Goals

- Do not migrate to Next.js, React, Tailwind, shadcn/ui, Framer Motion, or a new routing system unless the user explicitly asks.
- Do not redesign the whole app when the request is a narrow bug fix.
- Do not add marketing-page patterns to Studio surfaces.
- Do not change unrelated user work or clean up dirty files outside the request.

## Required Context

Before editing, inspect the smallest relevant set of files and docs:

- `AGENTS.md` for project collaboration rules
- `DESIGN.md` for Pokaya design direction
- Relevant files in `src/` and `server.mjs`
- Relevant PRDs in `docs/` when the issue is clearly related
- Recent git history for the same surface when regressions are likely

## Design Rules

- Studio is a workspace: prioritize scanability, density, and predictable controls.
- Use the existing white/soft purple Pokaya palette. Keep pink/coral for primary actions and accents.
- Keep dimensions stable. Hover, selection, loading, insert/remove, and close actions must not resize neighboring layout.
- Define fixed or constrained dimensions for composer bars, tool buttons, image tiles, table columns, modal shells, and sidebars.
- Avoid text overlap. Long labels must wrap, truncate, or use responsive layout before they collide.
- Modal overlays must cover the whole product UI, sit above nav/composer/sidebar, and own their scroll behavior.
- Tables and ledgers must work on narrow widths with horizontal scroll, compact columns, or stacked layouts.
- Media walls must use thumbnails, lazy loading, and predictable aspect-ratio containers. Do not eager-load full originals into grids.
- Do not create nested cards unless the inner card is a real repeated item, modal, or framed tool.

## Implementation Workflow

1. Reproduce the surface mentally or locally from the screenshot/request.
2. Locate the current DOM structure, CSS selectors, and related state handlers.
3. Identify the layout invariant that should not change, such as fixed bar height, stable tile size, modal viewport, or scroll container.
4. Make the smallest scoped edit that restores that invariant.
5. Preserve existing class names and patterns where possible.
6. Avoid broad refactors unless the bug comes from shared duplicated behavior.
7. For media or performance changes, prefer thumbnail URLs, `loading="lazy"`, `srcset`, `sizes`, containment, delegated handlers, and capped render batches.

## Verification

Always run the project build after UI changes when feasible:

```bash
npm run build
```

For visible UI changes, also use browser verification when a local target is available:

- Check desktop and one narrow viewport.
- Verify the changed surface and one adjacent workflow.
- Look specifically for clipping, overlap, scroll lock, hover jump, z-index leaks, and blank media.

If browser verification is not possible, say so in the final response and explain what was verified instead.

## Git And Deployment

For executed project updates:

- Stage only files related to the current request.
- Commit with a concise message.
- Push to the remote branch.
- Report the commit hash in the final response.

PRD-only documents do not need a push unless the user asks to execute or update the project.
