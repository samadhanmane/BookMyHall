// Lightweight smoke test for core backend endpoints.
// Usage:
//   node scripts/smoke.js
//   API_URL=http://localhost:4000 node scripts/smoke.js

const API_URL = (process.env.API_URL || "http://localhost:4000").replace(/\/$/, "");

async function request(method, path, { json, headers } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...(headers || {})
    },
    body: json ? JSON.stringify(json) : undefined
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  console.log(`[smoke] API_URL=${API_URL}`);

  const health = await request("GET", "/api/health");
  assert(health.status === 200, `/api/health expected 200, got ${health.status}`);

  const ready = await request("GET", "/api/ready");
  assert([200, 503].includes(ready.status), `/api/ready expected 200/503, got ${ready.status}`);

  const orgs = await request("GET", "/api/organizations");
  assert(orgs.status === 200, `/api/organizations expected 200, got ${orgs.status}`);

  const badLogin = await request("POST", "/api/auth/login", { json: {} });
  assert(badLogin.status === 400, `/api/auth/login {} expected 400, got ${badLogin.status}`);
  assert(
    badLogin.data && typeof badLogin.data.message === "string",
    "/api/auth/login {} expected JSON {message}"
  );

  const chatNoAuth = await request("POST", "/api/chat", {
    json: { messages: [{ role: "user", content: "hello" }] }
  });
  assert(chatNoAuth.status === 401, `/api/chat without token expected 401, got ${chatNoAuth.status}`);

  console.log("[smoke] OK");
}

main().catch((err) => {
  console.error("[smoke] FAILED:", err.message);
  process.exit(1);
});

