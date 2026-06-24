# Visual Rules

## Visual DNA

This style is a single-page editorial market note:

- Paper: warm off-white, restrained texture, no obvious beige theme.
- Ink: black and soft greys. The page should feel printed.
- Grid: 12-column page with generous side margins, dense but calm hierarchy.
- Rules: 1px horizontal lines anchor every section.
- Type: serif/Songti headline, serif body, mono metadata.
- Evidence: one large image well in the middle, usually a news screenshot/photo.
- Analysis: one right-side signal block, three bottom insight columns, one final takeaway.

## Canvas

- Use 1080x1440 for Xiaohongshu-style portrait unless requested otherwise.
- Keep outer margins around 84-96px.
- Reserve top 80-100px for desk label and date.
- Reserve 330-420px for headline/subhead/signal area.
- Reserve 430-520px for the main evidence image.
- Reserve 190-250px for the bottom insight grid and takeaway.

## Typography

- Headline: Songti/serif, 72-96px, weight 500-600, line-height 0.95-1.05.
- English headline fragments: Playfair/Georgia-like serif, same visual weight.
- Body/subhead: serif, 28-34px, line-height 1.35-1.55.
- Metadata: mono or letter-spaced sans, 14-18px, uppercase for English, tracking 0.18em-0.28em.
- Bottom insight title: 28-34px serif, one line when possible.
- Bottom insight body: 18-22px serif, muted.
- Do not solve long text by shrinking below readability; shorten first.

## Layout Recipe

Use this structure for the flagship card:

1. Top desk bar:
   - left: small linked mark + `CREATORS DESK`
   - right: `AI MARKET · YYYY.MM.DD`
   - bottom rule
2. Kicker row:
   - `AI 市场分析 · SOURCE REPORT`
3. Title/signal grid:
   - left 65%: headline + subhead
   - right 30%: top rule, `MARKET SIGNAL`, large number/phrase, small explanation
4. Image well:
   - centered, straight-edged, no rounded corners
   - optional subtle grayscale filter only if the source image is too loud
5. Source/topic row:
   - left: `SOURCE IMAGE · ...`
   - right: `TOPIC · AI / IPO / STARTUP MARKET`
6. Insight grid:
   - three equal columns separated by whitespace and top rules
   - each: number, title, one-line explanation
7. Takeaway:
   - left vertical rule
   - one concise sentence

## Color

Recommended tokens:

- `--paper: #f4f3ef`
- `--ink: #111111`
- `--muted: #767676`
- `--rule: #d4d1ca`
- `--rule-strong: #151515`
- `--soft: #ebe9e3`
- `--accent: #b5165a`

Do not add a multi-color brand palette. The page's personality comes from type and structure.

## Image Treatment

- Prefer real news screenshots, product screenshots, company photos, charts, or official blog screenshots.
- Do not use generic AI stock imagery for market news unless no evidence exists.
- If text in the screenshot matters, use `object-fit: contain` and accept letterboxing.
- If the image is only atmosphere, use `object-fit: cover` and crop deliberately.
- Keep source label honest: `SOURCE IMAGE · USER PROVIDED`, `SOURCE IMAGE · CNBC`, etc.

## Failure Modes

Fix the card if any of these appear:

- Looks like a motivational poster instead of a market note.
- Headline is bold sans or generic banner text.
- Uses rounded cards, shadows, stickers, blobs, or decorative icons.
- Signal block competes with the headline.
- Main image is too small to act as evidence.
- Bottom three insights are wordy paragraphs.
- Metadata is missing, fake, or too large.
