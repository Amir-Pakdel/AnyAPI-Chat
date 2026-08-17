# AnyAPI Chat

A lightweight, cross-platform chat client for services based on **New-API** (such as AgentRouter and BluesMinds).

Enter the server URL and API key, select a model, and start chatting. Works on **Windows, macOS, and Android**.

## Features

* Manage multiple services/servers (URL + API key) and quickly switch between them
* Automatically fetch the list of available models from each server
* Streaming chat (token-by-token responses) with the selected model
* Display the remaining balance/credits for each API key
* Conversation history with local storage on the same device
* Installable as a **PWA** on desktop and mobile
* Persian, right-to-left interface with dark theme

## Running

Because the app uses a Service Worker, it must be served through a local server rather than opening the file directly.

Run the following command inside the project directory:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

> If you don't have Python installed, `npx serve` or any other static file server will work as well.

## Installing as an App

* **Windows/macOS (Chrome/Edge):** Click the **Install** icon in the address bar. The app will be installed like a standalone application.
* **Android (Chrome):** Open the browser menu → **Add to Home screen**.

## Deploying to GitHub Pages

The project is completely static and frontend-only, so it can be deployed directly to GitHub Pages:

1. Create a repository and push these files to the repository root:

   ```bash
   git init && git add . && git commit -m "AnyAPI Chat"
   git branch -M main
   git remote add origin https://github.com/<user>/<repo>.git
   git push -u origin main
   ```

2. In GitHub → **Settings → Pages**:

   * If you are using the included workflow, set the Source to **GitHub Actions**. The `.github/workflows/deploy.yml` file will deploy it automatically.
   * Alternatively, set the Source to **Deploy from a branch**, then select the `main` branch and the `/ (root)` folder.

3. The final URL will be:
   `https://<user>.github.io/<repo>/`

> All paths are relative, so the app works correctly when hosted under a repository subpath. The `.nojekyll` file is included to prevent Jekyll from interfering.

## Version 2.0 Features

* **Professional Markdown rendering** (marked) + **code syntax highlighting** (highlight.js) + secure sanitization (DOMPurify), with an offline fallback
* **System Prompt** and per-conversation parameters: `temperature`, `max_tokens`, and `top_p` (the **⚙ Conversation** button)
* **Edit messages**, **regenerate responses**, **delete individual messages**, copy messages, and copy code blocks
* **Image input** for vision models (📎 button or image paste)
* **Token counting** for each response, when supported by the server
* **Search** through conversation titles and content
* Suggestion chips on the start screen, character counter, and keyboard shortcuts (Enter/Esc)
* Light/dark themes, settings page, JSON backup/restore, and Markdown export for each conversation
* Offline indicator and error/timeout handling with Persian messages

## Solving CORS / Firewall Issues with a Cloudflare Worker (Free)

The `cloudflare-worker.js` file is a ready-to-use proxy that solves CORS issues and makes requests appear more like they are coming from a browser, increasing the chance of getting through a WAF.

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Create Worker**.
2. Paste the code from `cloudflare-worker.js` and click **Deploy**.
3. (Optional) Add your own server hosts to the `ALLOW_HOSTS` array.
4. Copy the Worker URL, for example: `https://newapi.<user>.workers.dev`.
5. In the app, set the **CORS Proxy** field to:
   `https://<your-worker>.workers.dev/?url={url}`

> The app uses `https://agentrouter.m4tinbeigi.workers.dev/?url={url}` as its default proxy. Anyone can change it under **Settings → Default CORS Proxy** and create their own Worker using `cloudflare-worker.js` as the source. Selecting the AgentRouter preset automatically fills in this proxy.
>
> The app automatically replaces `{url}` with the encoded destination URL. Chat streaming is preserved.
>
> If AgentRouter still shows a WAF page after using the Worker, it means the WAF is also challenging Cloudflare IP addresses. In that case, only the native version of the app will work.

## Important: CORS and Server Firewalls

Some servers (such as **AgentRouter**) are behind anti-bot firewalls (Aliyun WAF) and may return a verification page instead of an API response. These servers cannot be used directly from a browser. This is unrelated to your API key or application code.

Servers such as **BluesMinds**, which support CORS and do not have a WAF, work correctly.

When the app runs in a browser, the New-API server must allow CORS headers.

Most New-API servers support this, but if **Test Connection** fails with a CORS error, you have two options:

1. Run the app as an installed PWA.
2. Alternatively, the app can later be packaged as a native application using Tauri/Capacitor, which removes browser CORS restrictions.

## Files

* `index.html` — Entire application (UI + logic)
* `manifest.webmanifest` — PWA configuration
* `sw.js` — Service Worker (installation/offline support)
* `icons/` — Application icons

## Privacy

Server URLs, API keys, and chat history are stored only in the browser's `localStorage` on the same device and are not sent anywhere else, **except directly to your own New-API server**.
