# PouchWiki 📝

A local-first, premium wiki application built with React, PouchDB, and CouchDB.

## Features

- **Local-First**: Data is stored in your browser using PouchDB. It works offline and is extremely fast.
- **Sync**: Connect to a CouchDB instance to sync your notes across devices.
- **Markdown**: Full markdown support for formatting your pages.
- **Wiki Links**: Easy linking between pages using `[[Page Title]]`.
- **CouchApp Deployment**: Host the entire wiki directly on your CouchDB server.

## Wiki Links 🔗

You can easily link pages together using the broad wiki-link syntax:

- Type `[[Page Title]]` in the editor to create a link.
- If the target page exists, clicking the link will navigate to it.
- If the target page **doesn't exist**, PouchWiki will automatically create it for you with a default template.

## Development

### Running Locally

1. Install dependencies:
   ```bash
   bun install
   ```
2. Start the dev server:
   ```bash
   bun run dev
   ```

### Deploying to CouchDB

1. Ensure CouchDB is running (typically at `http://localhost:5984`).
2. Run the deployment workflow:
   ```bash
   bun run scripts/configure-couchdb.js
   bun run build
   bun run scripts/deploy.js
   ```
3. Access your wiki at:
   `http://localhost:5984/wiki/_design/wiki/index.html`

## Technical Stack

- **Frontend**: React + TypeScript (Vite)
- **Database**: PouchDB (Browser-side)
- **External Storage**: CouchDB (Remote synchronization)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Markdown Rendering**: React Markdown

## Pre-commit Hooks (prek) ⚡

This project uses `prek` (a fast Rust-based pre-commit runner) to maintain code quality.

1. **Install hooks**:
   ```bash
   bun run prek install
   ```
2. **Configuration**: Managed in `.prek.yaml`.
3. **Manual Run**: Check all files anytime:
   ```bash
   bun run prek run --all-files
   ```
