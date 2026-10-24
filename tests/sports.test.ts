import { test } from "node:test";
import assert from "node:assert/strict";
import { FootballData } from "../packages/providers/sports.js";
import { Store } from "../services/api/store.js";
import { QuotaCache } from "../services/api/quota.js";
import { baghdadDate, normalize, canonical } from "../packages/core/names.js";
test("Arabic normalization, aliases and Baghdad date rollover", () => {
  assert.equal(normalize("أَتْلتيكو"), "اتلتيكو");
  assert.equal(canonical("FC Barcelona"), "barcelona");
  assert.equal(baghdadDate(Date.parse("2026-10-24T22:00:00Z")), "2026-10-25");
});
test("football-data normalization preserves delayed scores", async () => {
  const p = new FootballData("placeholder", async () => ({
    matches: [
      {
        id: 1,
        utcDate: "2026-10-24T19:00:00Z",
        status: "IN_PLAY",
        competition: { code: "PD" },
        homeTeam: { name: "FC Barcelona" },
        awayTeam: { name: "Real Madrid" },
        score: { fullTime: { home: 1, away: 0 } }
      }
    ]
  }));
  const [f] = await p.fixtures("2026-10-24");
  assert.equal(f.home, "برشلونة");
  assert.equal(f.delayed, true);
  assert.equal(f.favorite, true);
});
test("quota coalesces, caches, preserves stale data and backs off", async () => {
  const s = new Store(":memory:"),
    q = new QuotaCache(s);
  let calls = 0;
  const load = async () => {
    calls++;
    await new Promise((r) => setTimeout(r, 10));
    return 42;
  };
  await Promise.all([
    q.get("p", "x", 100, 1000, load, 10000),
    q.get("p", "x", 100, 1000, load, 10000)
  ]);
  assert.equal(calls, 1);
  await q.get("p", "x", 100, 1000, load, 10500);
  assert.equal(calls, 1);
  const r = await q.get(
    "p",
    "x",
    100,
    1000,
    async () => {
      throw Error();
    },
    12000
  );
  assert.equal(r.stale, true);
  assert.equal(r.value, 42);
  s.close();
});
test("football-data query includes previous UTC day for Baghdad midnight", async () => {
  let requested = "";
  const p = new FootballData("placeholder", async (url) => {
    requested = url;
    return {
      matches: [
        {
          id: 1,
          utcDate: "2026-10-23T22:00:00Z",
          status: "SCHEDULED",
          competition: { code: "PD" },
          homeTeam: { name: "Barcelona" },
          awayTeam: { name: "Real Madrid" },
          score: { fullTime: { home: null, away: null } }
        }
      ]
    };
  });
  const fixtures = await p.fixtures("2026-10-24");
  assert.ok(requested.includes("dateFrom=2026-10-23"));
  assert.equal(fixtures.length, 1);
});
test("old cached matches never appear as today", async () => {
  const { visibleFixtures } = await import("../packages/core/fixtures.js");
  const { demoFixtures } = await import("../packages/providers/sports.js");
  const now = Date.parse("2026-10-24T12:00Z");
  assert.equal(
    visibleFixtures(demoFixtures(now - 3 * 86400000), now).length,
    0
  );
  assert.equal(visibleFixtures(demoFixtures(now), now)[0].favorite, true);
});
