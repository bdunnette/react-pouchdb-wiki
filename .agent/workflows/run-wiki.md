---
description: How to run the PouchDB Wiki
---

This wiki uses PouchDB for local storage and can sync with a CouchDB instance.

1. Install dependencies (if not already done)

```bash
bun install
```

2. Start the development server
   // turbo

```bash
bun run dev
```

3. Open your browser to the URL shown in the terminal (usually `http://localhost:5173`)

### Syncing with CouchDB

To sync with a remote CouchDB:

1. Go to **Settings** in the wiki sidebar.
2. Enter your CouchDB URL.
   - Note: You must enable **CORS** on your CouchDB instance for the browser to connect.
3. Click **Connect & Sync**.
