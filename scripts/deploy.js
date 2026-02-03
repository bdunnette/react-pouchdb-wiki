import PouchDB from "pouchdb";
import fs from "fs";
import path from "path";
import mime from "mime-types";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const couchUrl = "http://admin:admin@localhost:5984/wiki";
const db = new PouchDB(couchUrl);

async function deploy() {
  const distDir = path.resolve(__dirname, "../dist");
  if (!fs.existsSync(distDir)) {
    console.error("Build directory not found. Run bun run build first.");
    process.exit(1);
  }

  const docId = "_design/wiki";
  let existingDoc;
  try {
    existingDoc = await db.get(docId);
  } catch (err) {
    existingDoc = { _id: docId };
  }

  const attachments = {};

  function walk(dir, base = "") {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const relPath = path.join(base, file).replace(/\\/g, "/");
      if (fs.statSync(fullPath).isDirectory()) {
        walk(fullPath, relPath);
      } else {
        const content = fs.readFileSync(fullPath);
        attachments[relPath] = {
          content_type: mime.lookup(fullPath) || "application/octet-stream",
          data: content,
        };
      }
    }
  }

  console.log("Reading dist directory...");
  walk(distDir);

  existingDoc._attachments = attachments;

  console.log("Uploading to CouchDB...");
  try {
    await db.put(existingDoc);
    console.log("Deployment successful!");
    console.log(
      `\n\nAccess your wiki at: http://localhost:5984/wiki/_design/wiki/index.html`,
    );
  } catch (err) {
    console.error("Deployment failed:", err);
  }
}

deploy();
