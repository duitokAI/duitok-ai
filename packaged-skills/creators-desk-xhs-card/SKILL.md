---
name: creators-desk-xhs-card
description: Generate Creators Desk brand-style Xiaohongshu/Rednote tutorial cards, TIP-series covers, and private-domain content cards from tweets, X articles, scripts, notes, or prompt tutorials. Use when the user asks for Creators Desk 小红书图文, TIP 01/TIP 02 cards, 小白填空版 cards, AI prompt tutorial covers, product visual method cards, or asks to convert X/Twitter content into branded private-domain readable images.
---

# Creators Desk XHS Card

Create Creators Desk style Xiaohongshu cards from an article, X/Twitter link, prompt tutorial, or raw notes. Default output is a single 1080 x 1440 PNG cover/card.

## Quick Workflow

1. Extract the source idea.
   - For X/Twitter links, use the user's configured 6551/OpenTwitter lookup when available. If this repo has `/Users/zixian/.openclaw/workspace/twitter_6551_lookup.js`, use it before fallback web methods.
   - Distill the source into: pain point, promise, principles, 3-step process, applications, takeaway.
2. Copy `assets/xhs-tip-cover-template.html` into the working folder.
3. Copy `assets/creators-desk-logo.png` into the output folder's `assets/`.
4. Replace only text and small labels first. Keep the template structure unless the request asks for a new layout.
5. Render with `scripts/render-xhs-card.cjs`.
6. Inspect the PNG. Fix clipping, cramped text, and bottom crowding before delivery.

## Source Distillation

Read `references/content-patterns.md` when converting longer articles.

For one-card covers, compress the source into:

- `TIP`: `TIP 01`, `TIP 02`, etc.
- `Topic chip`: e.g. `GPT Image 2 产品图教程`.
- `Headline`: one strong promise, 2-4 lines.
- `Subtitle`: one sentence that frames the method.
- `Main module`: a short label plus 5 tokens.
- `Step cards`: 3 practical steps.
- `Applications`: 6 concrete use cases.
- `Quote`: one final takeaway.

Do not place full prompts, long excerpts, or product demonstration images in the card unless explicitly requested.

## Brand Rules

Read `references/brand.md` before changing typography, color, or layout.

Defaults:

- Font: `PingFang SC`.
- Size: 1080 x 1440.
- Style: bright Xiaohongshu tutorial cover, warm white/pale pink background, large black/coral headline, small Creators Desk logo.
- Keep text practical and beginner-friendly.

## Rendering

Use the bundled script:

```bash
node path/to/creators-desk-xhs-card/scripts/render-xhs-card.cjs path/to/card.html path/to/output.png
```

The HTML must contain either `#research-cover` or `.poster`.

## Quality Checklist

- The title is readable at phone thumbnail size.
- No text touches the canvas edge.
- Bottom quote/callout is fully visible.
- No visible full prompt blocks unless requested.
- No product demo image unless requested.
- The card can be understood without reading a post body.
- Output PNG is 1080 x 1440.
