---
name: creators-desk-news-card
description: "Create CREATORS DESK style Chinese/English market-analysis posters and social news cards like the reference image: off-white editorial paper, thin rule grid, serif/Songti headline, mono metadata, right-side Market Signal block, large source image, bottom three insight columns, and a final takeaway quote. Use when the user asks for this exact image style, AI market/news analysis cards, eNanyang/Creators Desk inspired posters, business news social cards, 小红书/公众号新闻长图, or a reusable template/skill for this visual format."
---

# Creators Desk News Card

Use this skill to turn one news item, AI market signal, business update, or product/company event into a polished 1080x1440 editorial analysis poster. The output should feel like a quiet newspaper desk page, not a generic infographic.

## Required References

Read only what the task needs:

- `references/visual-rules.md` before designing or coding a card.
- `references/content-model.md` when extracting copy from an article, source link, screenshot, or messy notes.
- `assets/template-creators-desk.html` when producing an HTML-based poster.
- `scripts/render-creators-desk.mjs` after creating a task folder to render `.poster` nodes to PNG.

## Workflow

1. Identify the story in one sentence: company/entity, event, market implication, and why it matters now.
2. Verify unstable facts before writing copy: dates, valuation, IPO status, funding, pricing, executive names, market figures, and source claims.
3. Build a compact content pack:
   - `desk`: usually `CREATORS DESK`
   - `date`: `YYYY.MM.DD`
   - `kicker`: category + source/report label
   - `headline`: 8-18 Chinese characters where possible, split into 2 lines if useful
   - `subhead`: one sentence, 22-42 Chinese characters
   - `signal`: one large market number or short phrase
   - `signal_note`: what the signal means, not another headline
   - `image`: sourced screenshot/photo/evidence block
   - `source`: source image or report origin
   - `topic`: 2-4 tags
   - `insights`: exactly 3 numbered observations
   - `takeaway`: one final sentence with practical meaning
4. Copy `assets/template-creators-desk.html` into a task folder as `index.html`; replace only the poster content and image path unless the user asks for a variant.
5. Render with `node .codex/skills/creators-desk-news-card/scripts/render-creators-desk.mjs <task-folder>`.
6. Inspect the PNG before delivery. Fix overflow, weak contrast, tiny captions, title wrapping, image crop, and bottom spacing.

## Style Contract

The card must preserve these invariants:

- Use an off-white paper background with subtle grain or texture.
- Use black/deep ink as the main color; use accent color only for a small logo mark or source screenshot content.
- Use thin horizontal rules and a strict grid. Do not use rounded cards, shadows, glassmorphism, blobs, stickers, decorative gradients, or emoji.
- Use a serif/Songti display headline. Use mono or letter-spaced sans for metadata.
- Keep the right `MARKET SIGNAL` module visually quieter than the headline but strong enough to scan.
- Treat the source image as evidence. It should occupy the central visual mass and stay readable.
- Bottom insights must be three columns, numbered `01/02/03`, with short titles and one-line explanations.
- The final takeaway must feel like analysis, not motivational filler.

## Output Defaults

- Default ratio: `1080x1440` portrait.
- Default folder: `creators-desk-<slug>/`.
- Save rendered PNGs to `<task-folder>/output/`.
- If the user asks for multiple cards, keep page 1 as this flagship layout and make later pages use the same paper/rule/serif/mono system.

## When The User Provides Only A Screenshot

Use the screenshot as the main source image if it is readable. Extract only visible facts unless browsing confirms more. If the screenshot is low-resolution, ask once for a source link or higher-resolution image; if the user says to proceed, design around the image as documentary evidence and avoid inventing details.

## Quality Gate

Before final response, confirm:

- No text overlap or clipping at 1080x1440.
- Headline is readable at thumbnail size.
- The image crop does not hide the subject.
- The three insights are parallel in length and hierarchy.
- Source/date/topic metadata is present.
- Any factual claims that could have changed are verified or explicitly framed as user-provided.
