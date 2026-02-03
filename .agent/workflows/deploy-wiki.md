---
description: How to deploy the Wiki to CouchDB
---

This workflow explains how to build and deploy the React Wiki to a local CouchDB server.

1. Ensure CouchDB is running at `http://localhost:5984`.

2. Configure CouchDB (CORS and Database creation)
   // turbo

```bash
bun run scripts/configure-couchdb.js
```

3. Build the application
   // turbo

```bash
bun run build
```

4. Deploy to CouchDB as a CouchApp
   // turbo

```bash
bun run scripts/deploy.js
```

5. Access the wiki
   The wiki is now hosted on CouchDB and can be accessed at:
   `http://localhost:5984/wiki/_design/wiki/index.html`

### Default Credentials

The deployment scripts currently use `admin:admin`. If your CouchDB uses different credentials, update `scripts/configure-couchdb.js` and `scripts/deploy.js`.
