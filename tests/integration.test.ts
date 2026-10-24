import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { buildApp } from "../services/api/app.js";
import { config } from "../services/api/config.js";
import { Store } from "../services/api/store.js";
import { demoFixtures } from "../packages/providers/sports.js";
test("authorized M3U → XMLTV → mapping → probes → opaque gateway end to end", async () => {
  const upstream = createServer((req, res) => {
    if (req.url?.startsWith("/segment")) res.end(Buffer.alloc(1024));
    else
      res.end(
        "#EXTM3U\n#EXT-X-TARGETDURATION:4\n#EXTINF:4,\nsegment.ts?password=SECRET\n#EXT-X-ENDLIST"
      );
  });
  await new Promise<void>((r) => upstream.listen(0, "127.0.0.1", r));
  const port = (upstream.address() as any).port,
    token = "integration-only-abcdefghijklmnopqrstuvwxyz",
    s = new Store(":memory:"),
    app = await buildApp(
      config({
        ADMIN_TOKEN: token,
        DATA_DIR: ":memory:",
        MEDIA_LAN_HOSTS: "127.0.0.1"
      }),
      s
    ),
    auth = { authorization: "Bearer " + token };
  const post = (url: string, payload: any) =>
    app.inject({ url, method: "POST", headers: auth, payload });
  const now = Date.now(),
    f = demoFixtures(now)[0];
  s.put("fixture", f.id, f);
  function date(t: number) {
    return (
      new Date(t).toISOString().replace(/[-:T]/g, "").slice(0, 14) + " +0000"
    );
  }
  try {
    let r = await post("/api/admin/import/m3u", {
      providerId: "test",
      authorized: true,
      text:
        '#EXTM3U\n#EXTINF:-1 tvg-id="one" group-title="Sports",Test\nhttp://127.0.0.1:' +
        port +
        '/a.m3u8?secret=SECRET\n#EXTINF:-1 tvg-id="one" group-title="Sports",Test\nhttp://127.0.0.1:' +
        port +
        "/b.m3u8?secret=SECRET"
    });
    assert.equal(r.statusCode, 200);
    assert.equal(r.json().sources, 2);
    r = await post("/api/admin/import/xmltv", {
      providerId: "test",
      authorized: true,
      text:
        '<tv><programme channel="one" start="' +
        date(now - 600000) +
        '" stop="' +
        date(now + 7200000) +
        '"><title>La Liga Barcelona vs Real Madrid</title></programme></tv>'
    });
    assert.equal(r.statusCode, 200);
    r = await post("/api/admin/map", {});
    assert.equal(r.json().mappings[0].status, "AUTO_CONFIRMED");
    for (const source of s.all("source"))
      assert.equal(
        (await post("/api/admin/probe/" + source.id, {})).json().segmentOkRatio,
        1
      );
    const deviceId = "11111111-1111-4111-8111-111111111111";
    s.put("device", deviceId, { verified: { nativeHls: true } });
    r = await post("/api/playback", { fixtureId: f.id, deviceId });
    assert.equal(r.statusCode, 200);
    const plan = r.json();
    r = await app.inject(plan.url);
    assert.equal(r.statusCode, 200);
    assert.ok(!r.body.includes("SECRET"));
    const segment = r.body.split("\n").find((x) => x.startsWith("/media/"))!;
    assert.equal((await app.inject(segment)).rawPayload.length, 1024);
    const map = s.all("mapping")[0];
    await post("/api/admin/review", {
      fixtureId: f.id,
      channelId: map.channelId,
      confirm: false
    });
    assert.equal(
      (await post("/api/playback", { fixtureId: f.id, deviceId })).statusCode,
      409
    );
  } finally {
    await app.close();
    upstream.close();
  }
});
