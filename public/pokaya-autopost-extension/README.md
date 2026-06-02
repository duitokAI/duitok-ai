# Pokaya Auto Post

Chrome extension for pulling Pokaya scheduled TikTok posts into TikTok upload pages.

## What it does

- Reads scheduled jobs from `/api/autopost/jobs`
- Opens TikTok upload page
- Copies or fills caption and hashtags into the visible TikTok caption field
- Marks a queue item as posted in Pokaya after the user confirms it

## What it does not do

- It does not bypass TikTok login, captcha, review screens, or account checks
- It does not silently click the final publish button
- It cannot select a local video file automatically because browsers block that for security

## Install

1. Download and extract the extension folder.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable **Developer Mode**.
4. Click **Load unpacked**.
5. Select the extracted `pokaya-autopost-extension` folder.
6. Open Pokaya locally or production, then set the API URL in the extension popup.
