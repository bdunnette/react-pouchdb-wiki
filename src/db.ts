import * as PouchDBBase from "pouchdb-browser";
import * as PouchDBFindBase from "pouchdb-find";

// Handle potential ESM default export interop issues
const PouchDB = (PouchDBBase as any).default || PouchDBBase;
const PouchDBFind = (PouchDBFindBase as any).default || PouchDBFindBase;

if (typeof PouchDB.plugin === 'function') {
  PouchDB.plugin(PouchDBFind);
}

export interface WikiPage {
  _id: string;
  _rev?: string;
  title: string;
  content: string;
  updatedAt: string;
  type: "page";
}

const db = new PouchDB("wiki_pages");

// Default CouchDB URL for deployment
const DEFAULT_REMOTE_URL = "http://admin:admin@localhost:5984/wiki";

// Initialize sync if a URL is stored or use the default for local development
const storedUrl = localStorage.getItem('couchdb_url') || DEFAULT_REMOTE_URL;
if (storedUrl) {
  localStorage.setItem('couchdb_url', storedUrl);
}

export default db;

export const syncWithRemote = (remoteUrl: string) => {
  const remoteDB = new PouchDB(remoteUrl);
  return db.sync(remoteDB, {
    live: true,
    retry: true,
  });
};
