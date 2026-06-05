# Project Collaboration Rules

These rules apply to every agent working inside this project, including new chatboxes and existing chatboxes that continue from this repository.

## User-Facing PRD Language

- All PRDs, product requirement documents, UX optimization plans, execution PRDs, and design/spec documents written for the user must be in Chinese by default.
- If a source screenshot or UI text uses English or Malay, explain recommendations in Chinese unless the user explicitly asks for another language.
- PRD filenames may use English slugs for readability, but the document content must be Chinese.

## Deployment / Cloud Workflow

- After any executed update, code change, UI change, configuration change, or documentation change that is intended to affect the project, commit and push to the remote branch immediately.
- The user expects to review the final result from the cloud deployment, not only from local preview.
- Do not ask whether to push after execution unless there is a real blocker, a destructive risk, or the user explicitly says not to push.
- PRD-only planning documents do not need to be pushed when the user only asks to write a PRD. If the user asks to execute the PRD or make any project update, push after completion.

## Git Safety

- Preserve unrelated local changes. Stage and commit only the files or hunks related to the current request.
- Do not revert user changes unless the user explicitly asks.
- Before final response, verify whether the requested update was pushed and report the commit hash.

## User Preference Summary

- The user wants Chinese PRDs.
- The user wants all executed changes automatically pushed to cloud.
- The user prefers checking the final version on the cloud deployment.

## Pokaya UI Stability Skill

- For any Pokaya Studio, sidebar, settings modal, composer, media wall, billing, usage, image/video result, or responsive layout change, follow the project-local skill at `.codex/skills/pokaya-ui-stability/SKILL.md`.
- This skill is required for UI bug fixes, visual polish, responsive adaptation, performance-sensitive media work, and any change driven by screenshots.
- Do not introduce a new frontend framework, UI kit, animation library, or routing architecture for these tasks unless the user explicitly asks for that migration.

## Pokaya Studio Purple Orange Design System

- Studio/backend Figma-to-code work must keep the Purple to Orange Mix as tokenized project style: `#210024`, `#32103A`, `#8B1A78`, `#C12B62`, `#FF6738`.
- Do not hardcode new Studio colors in component markup. Add or reuse scoped CSS variables under `.studio-shell` whenever possible.
- Use deep plum for Studio shell/sidebar/media-wall foundations, orange for primary action, focus, selected edge, and confirm states, and rose/magenta for active or hover surfaces.
- Keep Studio changes scoped to the logged-in backend surface. Do not let Studio palette overrides affect public landing, login/register, or marketing pages.
- Treat Figma MCP output as design context only. Translate any generated React/Tailwind suggestions into this project's existing vanilla JS/CSS structure.
- Preserve existing Studio DOM and routing unless a task explicitly requires markup changes.
- Media wall, top tabs, sidebar nav, and composer controls must keep stable dimensions across hover, loading, selected, failed, and narrow viewport states.
- Primary gradient styling is reserved for Generate/Confirm actions. Retry/Edit, status badges, and parameter pills must remain visually secondary.
