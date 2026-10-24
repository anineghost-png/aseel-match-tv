import { test } from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../services/api/app.js";
import { config } from "../services/api/config.js";
import { Store } from "../services/api/store.js";
const token = "test-token-abcdefghijklmnopqrstuvwxyz123";
test("admin encoded paths, cross-origin writes and arbitrary gateway URLs denied", async () => {
  const app = await buildApp(
    config({ ADMIN_TOKEN: token, DATA_DIR: ":memory:" })
  );
  try {
    for (const url of [
      "/api/admin/diagnostics",
      "/api/%61dmin/diagnostics",
      "/api/admin/../admin/diagnostics"
    ])
      assert.notEqual((await app.inject(url)).statusCode, 200);
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: "/api/admin/map",
          headers: {
            authorization: "Bearer " + token,
            origin: "https://evil.example"
          },
          payload: {}
        })
      ).statusCode,
      403
    );
    assert.equal(
      (await app.inject("/media/arbitrary/url?url=http://127.0.0.1"))
        .statusCode,
      404
    );
    assert.equal((await app.inject("/.env")).statusCode, 404);
  } finally {
    await app.close();
  }
});
test("diagnostics never expose imported provider and source URLs", async () => {
  const s = new Store(":memory:");
  s.put("source", "a", {
    id: "a",
    url: "https://example.com/?password=SECRET"
  });
  s.put("provider", "a", {
    id: "a",
    m3uUrl: "https://example.com/SECRET",
    xmltvUrl: "https://example.com/SECRET"
  });
  const app = await buildApp(
    config({ ADMIN_TOKEN: token, DATA_DIR: ":memory:" }),
    s
  );
  try {
    const r = await app.inject({
      url: "/api/admin/diagnostics",
      headers: { authorization: "Bearer " + token }
    });
    assert.equal(r.statusCode, 200);
    assert.ok(!r.body.includes("SECRET"));
  } finally {
    await app.close();
  }
});
test("private API responses cannot be cached and profile storage is bounded", async () => {
  const s = new Store(":memory:");
  for (let i = 0; i < 100; i++) s.put("device", String(i), { id: String(i) });
  const app = await buildApp(
    config({ ADMIN_TOKEN: token, DATA_DIR: ":memory:" }),
    s
  );
  try {
    const r = await app.inject({
      method: "POST",
      url: "/api/devices",
      payload: { capabilities: {} }
    });
    assert.equal(r.statusCode, 429);
    assert.equal(r.headers["cache-control"], "no-store");
  } finally {
    await app.close();
  }
});
