import { test } from "node:test";
import assert from "node:assert/strict";
import { strategy } from "../packages/player/strategy.js";
import { buildApp } from "../services/api/app.js";
import { config } from "../services/api/config.js";
import { Store } from "../services/api/store.js";
test("capability presence alone never permits playback", () => {
  assert.equal(
    strategy({ capabilities: { MediaSource: true }, verified: {} }),
    null
  );
  assert.equal(strategy({ verified: { nativeHls: true } }), "native");
});
test("playback requires mapping + fresh health, hides URL, switches once and stops", async () => {
  const s = new Store(":memory:"),
    app = await buildApp(
      config({
        ADMIN_TOKEN: "test-token-abcdefghijklmnopqrstuvwxyz123",
        DATA_DIR: ":memory:"
      }),
      s
    );
  const d = "11111111-1111-4111-8111-111111111111";
  s.put("device", d, { verified: { nativeHls: true } });
  s.put("mapping", "f:c", {
    fixtureId: "f",
    channelId: "c",
    status: "NEEDS_REVIEW"
  });
  for (const id of ["a", "b"]) {
    s.put("source", id, {
      id,
      channelId: "c",
      enabled: true,
      url: "https://secret.example/" + id + "?token=SECRET"
    });
    s.put("latestHealth", id, {
      streamSourceId: id,
      timestamp: Date.now(),
      manifestOk: true,
      httpStatus: 200,
      firstByteMs: 10,
      segmentOkRatio: 1,
      avgSegmentMbps: 20,
      estimatedRequiredMbps: 5,
      resolutionHeight: 720,
      playlistAgeSec: 0,
      codec: "avc1",
      errors: []
    });
  }
  const request = () =>
    app.inject({
      method: "POST",
      url: "/api/playback",
      payload: { fixtureId: "f", deviceId: d }
    });
  assert.equal((await request()).statusCode, 409);
  s.put("mapping", "f:c", {
    fixtureId: "f",
    channelId: "c",
    status: "AUTO_CONFIRMED",
    updatedAt: new Date().toISOString()
  });
  const plan = (await request()).json();
  assert.ok(plan.url.startsWith("/media/"));
  assert.ok(!JSON.stringify(plan).includes("SECRET"));
  const event = (e: string) =>
    app.inject({
      method: "POST",
      url: "/api/playback/" + plan.id + "/event",
      payload: { token: plan.token, event: e }
    });
  assert.equal((await event("failover")).statusCode, 200);
  assert.equal((await event("failover")).statusCode, 409);
  assert.equal((await event("stop")).statusCode, 200);
  assert.equal((await app.inject(plan.url)).statusCode, 404);
  await app.close();
});
