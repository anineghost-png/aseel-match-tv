import { test } from "node:test";
import assert from "node:assert/strict";
import { demoFixtures } from "../packages/providers/sports.js";
import { mapFixture } from "../packages/core/mapping.js";
const now = Date.parse("2026-10-24T19:00Z"),
  f = demoFixtures(now)[0],
  c = {
    id: "c",
    providerId: "p",
    tvgId: "c",
    name: "Sports 1",
    normalizedName: "sports 1",
    group: "Sports",
    logo: "",
    enabled: true
  };
const p = {
  id: "p",
  tvgId: "c",
  title: "La Liga Barcelona vs Real Madrid",
  description: "",
  startUtc: "2026-10-24T18:45Z",
  endUtc: "2026-10-24T21:00Z"
};
test("both teams, league, time and crosswalk auto-confirm", () => {
  assert.equal(
    mapFixture(f, c, p, { now, epgUpdatedAt: now, trusted: true }).status,
    "AUTO_CONFIRMED"
  );
});
for (const title of [
  "برشلونة ضد ريال مدريد — الدوري الإسباني",
  "La Liga BAR v RMA"
])
  test("bilingual aliases " + title, () =>
    assert.equal(
      mapFixture(
        f,
        c,
        { ...p, title },
        { now, epgUpdatedAt: now, trusted: true }
      ).confidence,
      90
    )
  );
for (const title of [
  "La Liga Barcelona vs Atletico",
  "La Liga Arsenal vs Inter",
  "Sports 1"
])
  test("never guess: " + title, () =>
    assert.equal(
      mapFixture(
        f,
        c,
        { ...p, title },
        { now, epgUpdatedAt: now, trusted: true, history: true }
      ).status,
      "REJECTED"
    )
  );
test("stale EPG and wrong time rejected", () => {
  assert.equal(
    mapFixture(f, c, p, { now, epgUpdatedAt: now - 86400001, trusted: true })
      .status,
    "REJECTED"
  );
  assert.equal(
    mapFixture(
      f,
      c,
      { ...p, startUtc: "2026-10-24T22:00Z", endUtc: "2026-10-25T00:00Z" },
      { now, epgUpdatedAt: now, trusted: true }
    ).status,
    "REJECTED"
  );
});
test("removed EPG cannot leave an old automatic mapping active", async () => {
  const { Store } = await import("../services/api/store.js");
  const { generateMappings } = await import("../services/api/mapping.js");
  const s = new Store(":memory:");
  s.put("mapping", "f:c", {
    fixtureId: "f",
    channelId: "c",
    status: "AUTO_CONFIRMED"
  });
  generateMappings(s);
  assert.equal(s.all("mapping").length, 0);
  s.close();
});
