import { mapFixture } from "../../packages/core/mapping.js";
import { Store } from "./store.js";
import type {
  Fixture,
  Channel,
  Program,
  Mapping
} from "../../packages/core/models.js";
export function generateMappings(store: Store) {
  const out: Mapping[] = [];
  for (const old of store.all<Mapping>("mapping"))
    if (
      old.status !== "MANUAL_CONFIRMED" &&
      !store.get("override", old.fixtureId + ":" + old.channelId)
    )
      store.remove("mapping", old.fixtureId + ":" + old.channelId);
  for (const f of store.all<Fixture>("fixture"))
    for (const c of store.all<Channel>("channel")) {
      const id = f.id + ":" + c.id,
        manual = store.get("override", id);
      if (manual) {
        out.push(manual);
        store.put("mapping", id, manual);
        continue;
      }
      const programs = store
        .all<Program & { providerId: string }>("epg")
        .filter((p) => p.tvgId === c.tvgId && p.providerId === c.providerId);
      let best: Mapping | undefined;
      for (const p of programs) {
        const m = mapFixture(f, c, p, {
          trusted: true,
          history: !!store.get("rule", c.id + ":" + f.competitionId),
          epgUpdatedAt: store.get("epgStatus", c.providerId)?.updatedAt || 0
        });
        if (!best || m.confidence > best.confidence) best = m;
      }
      if (best) {
        out.push(best);
        store.put("mapping", id, best);
      }
    }
  return out;
}
