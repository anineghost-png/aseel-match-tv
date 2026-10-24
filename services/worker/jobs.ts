import { Store } from "../api/store.js";
import { SafeNet } from "../api/net.js";
import {
  parseM3u,
  parseXmltv,
  textChunks
} from "../../packages/providers/media.js";
import { generateMappings } from "../api/mapping.js";
import { probeSource } from "../api/health.js";
export async function refreshCatalog(
  store: Store,
  net: SafeNet,
  provider: any
) {
  if (!provider.authorized) throw Error("AUTHORIZATION");
  if (provider.m3uUrl) {
    const r = await net.get(provider.m3uUrl, 2e6);
    if (r.status !== 200) throw Error("IMPORT_HTTP");
    const data = parseM3u(r.body.toString(), provider.id);
    for (const s of data.sources) await net.validate(s.url);
    store.db.exec("BEGIN");
    try {
      for (const old of store
        .all("source")
        .filter(
          (s) =>
            s.providerId === provider.id &&
            !data.sources.some((n) => n.id === s.id)
        ))
        store.put("source", old.id, { ...old, enabled: false });
      for (const c of data.channels) store.put("channel", c.id, c);
      for (const s of data.sources) store.put("source", s.id, s);
      store.db.exec("COMMIT");
    } catch (e) {
      store.db.exec("ROLLBACK");
      throw e;
    }
  }
  if (provider.xmltvUrl) {
    const r = await net.get(provider.xmltvUrl, 20e6);
    if (r.status !== 200) throw Error("IMPORT_HTTP");
    const programs = await parseXmltv(textChunks(r.body.toString()));
    store.db.exec("BEGIN");
    try {
      for (const p of store
        .all("epg")
        .filter((p) => p.providerId === provider.id))
        store.remove("epg", provider.id + ":" + p.id);
      for (const p of programs)
        store.put("epg", provider.id + ":" + p.id, {
          ...p,
          providerId: provider.id
        });
      store.put("epgStatus", provider.id, {
        updatedAt: Date.now(),
        count: programs.length
      });
      store.db.exec("COMMIT");
    } catch (e) {
      store.db.exec("ROLLBACK");
      throw e;
    }
  }
  store.put("provider", provider.id, {
    ...provider,
    updatedAt: Date.now(),
    failures: 0,
    nextRefreshAt: Date.now() + 3600000
  });
}
export async function runJobs(store: Store, net: SafeNet) {
  for (const provider of store.all("provider")) {
    if (
      (provider.m3uUrl || provider.xmltvUrl) &&
      (!provider.nextRefreshAt || provider.nextRefreshAt <= Date.now())
    )
      try {
        await refreshCatalog(store, net, provider);
      } catch {
        const failures = (provider.failures || 0) + 1;
        store.put("provider", provider.id, {
          ...provider,
          failures,
          nextRefreshAt:
            Date.now() + Math.min(3600000, 60000 * Math.pow(2, failures))
        });
      }
  }
  generateMappings(store);
  const active = store.all("fixture").filter((f) => {
    const t = Date.parse(f.kickoffUtc);
    return t > Date.now() - 3 * 3600000 && t < Date.now() + 15 * 60000;
  });
  const channelIds = store
    .all("mapping")
    .filter(
      (m) =>
        active.some((f) => f.id === m.fixtureId) &&
        ["AUTO_CONFIRMED", "MANUAL_CONFIRMED"].includes(m.status)
    )
    .map((m) => m.channelId);
  let count = 0;
  for (const s of store.all("source")) {
    if (count >= 6) break;
    if (!s.enabled || !channelIds.includes(s.channelId)) continue;
    const last = store.get("latestHealth", s.id);
    if (
      last &&
      Date.now() - last.timestamp < (last.manifestOk ? 180000 : 600000)
    )
      continue;
    await probeSource(s, net, store);
    count++;
  }
  store.cleanup();
  store.put("worker", "status", { lastRunAt: Date.now(), probes: count });
}
export function startWorker(store: Store, net: SafeNet) {
  let busy = false;
  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      await runJobs(store, net);
    } catch {
      store.put("worker", "status", {
        lastRunAt: Date.now(),
        error: "JOB_FAILED"
      });
    } finally {
      busy = false;
    }
  };
  const timer = setInterval(() => void tick(), 60000);
  timer.unref();
  return () => clearInterval(timer);
}
