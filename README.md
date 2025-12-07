<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1vsIDv3z0rTruutbKeIX2N8juhuaW4WwP

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
   
   When running the dev server, open http://localhost:3000 in your browser. Do NOT open `dist/index.html` directly via `file://` — the app relies on Vite serving JS modules.

If you prefer to preview the production build use:

```
npm run build
npm run preview
```

Troubleshooting tips:
- If the UI is blank or you see errors in the console, check DevTools -> Console for red errors, and ensure the dev server is running. Use `document.getElementById('root')` in the console to confirm the root element exists and whether React has mounted.
- If you see duplicate React or import errors, remove any CDN `importmap` from `index.html` so the project resolves local dependencies via Vite.
