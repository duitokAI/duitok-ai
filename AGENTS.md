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
