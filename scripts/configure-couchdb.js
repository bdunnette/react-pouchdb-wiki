const couchUrl = "http://localhost:5984";
const auth = Buffer.from("admin:admin").toString("base64");
const headers = {
  "Content-Type": "application/json",
  Authorization: `Basic ${auth}`,
};

async function configureCouchDB() {
  const configs = [
    { section: "httpd", key: "enable_cors", value: "true" },
    { section: "cors", key: "origins", value: "*" },
    { section: "cors", key: "credentials", value: "true" },
    { section: "cors", key: "methods", value: "GET, PUT, POST, HEAD, DELETE" },
    {
      section: "cors",
      key: "headers",
      value:
        "accept, authorization, content-type, origin, referer, x-csrf-token",
    },
    { section: "csp", key: "enable", value: "false" },
    { section: "csp", key: "attachments_enable", value: "false" },
  ];

  for (const config of configs) {
    const url = `${couchUrl}/_node/_local/_config/${config.section}/${config.key}`;
    console.log(
      `Setting ${config.section}/${config.key} to ${config.value}...`,
    );
    try {
      const response = await fetch(url, {
        method: "PUT",
        body: JSON.stringify(config.value),
        headers,
      });
      const data = await response.json();
      console.log("Response:", data);
    } catch (err) {
      console.error(`Failed to set ${config.key}:`, err.message);
    }
  }

  // Ensure 'wiki' database exists
  try {
    const response = await fetch(`${couchUrl}/wiki`, {
      method: "PUT",
      headers,
    });
    const data = await response.json();
    console.log("Create database /wiki response:", data);
  } catch (err) {
    console.error("Failed to create /wiki database:", err.message);
  }
}

configureCouchDB();
