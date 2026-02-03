const couchUrl = "http://localhost:5984";
const auth = Buffer.from("admin:admin").toString("base64");
const headers = {
  "Content-Type": "application/json",
  Authorization: `Basic ${auth}`,
};

async function setConfig(section, key, value) {
  const url = `${couchUrl}/_node/_local/_config/${section}/${key}`;
  console.log(`Setting ${section}/${key} to ${value}...`);
  const response = await fetch(url, {
    method: "PUT",
    body: JSON.stringify(value),
    headers,
  });
  const data = await response.json();
  console.log("Response:", data);
}

async function fixSandbox() {
  await setConfig("csp", "enable", "false");
  await setConfig("csp", "attachments_enable", "false");
}

fixSandbox();
