import type { FastifyInstance } from "fastify";
import type { Store } from "./store.js";
import type { SafeNet } from "./net.js";
import {
  dramaEndpoint,
  dramaRequestBody,
  encryptDramaPayload,
  normalizeDramaCatalog,
  parseDramaEnvelope,
  parseDramaLive,
  parseDramaTopics,
  type DramaDirectOptions,
  type DramaLiveItem
} from "../../packages/providers/drama-direct.js";

const PROVIDER_ID = "drama-direct";

type DramaEnv = Record<string, string | undefined>;

function contextFromEnv(env: DramaEnv): Record<string, unknown> {
  const raw = env.DRAMA_REQUEST_CONTEXT_JSON?.trim() || "";
  if (!raw) return {};
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    throw Error("DRAMA_CONTEXT_JSON");
  return parsed as Record<string, unknown>;
}

export function dramaDirectOptions(
  env: DramaEnv = process.env
): DramaDirectOptions | null {
  if (env.DRAMA_DIRECT_ENABLED !== "true") return null;
  const liveBase = env.DRAMA_LIVE_API_BASE?.trim() || "";
  const activationCode = env.DRAMA_FG_CODE?.trim() || "";
  const protocolKey = env.DRAMA_PROTOCOL_KEY || "";
  const protocolIv = env.DRAMA_PROTOCOL_IV || "";
  if (!liveBase || !activationCode || !protocolKey || !protocolIv) return null;
  return {
    liveBase,
    activationCode,
    protocolKey,
    protocolIv,
    context: {
      user_id: env.DRAMA_USER_ID || "",
      device_id: env.DRAMA_DEVICE_ID || "aseel-match-tv",
      device_api: env.DRAMA_DEVICE_API || "29",
      version_name: env.DRAMA_VERSION_NAME || "13.0.3",
      language: env.DRAMA_LANGUAGE || "ar",
      timezone: env.DRAMA_TIMEZONE || "Asia/Baghdad",
      device_type: env.DRAMA_DEVICE_TYPE === "tv" ? "tv" : "phone",
      mainServer: env.DRAMA_MAIN_SERVER || "",
      ...contextFromEnv(env)
    }
  };
}

export function dramaDirectMissing(env: DramaEnv = process.env) {
  if (env.DRAMA_DIRECT_ENABLED !== "true") return ["DRAMA_DIRECT_ENABLED"];
  const missing: string[] = [];
  if (!env.DRAMA_LIVE_API_BASE?.trim()) missing.push("DRAMA_LIVE_API_BASE");
  if (!env.DRAMA_FG_CODE?.trim()) missing.push("DRAMA_FG_CODE");
  if (!env.DRAMA_PROTOCOL_KEY) missing.push("DRAMA_PROTOCOL_KEY");
  if (!env.DRAMA_PROTOCOL_IV) missing.push("DRAMA_PROTOCOL_IV");
  return missing;
}

async function request(
  net: SafeNet,
  options: DramaDirectOptions,
  operation: string,
  extra: Record<string, unknown>
) {
  const url = dramaEndpoint(options.liveBase, operation);
  const body = encryptDramaPayload(
    dramaRequestBody(options, extra),
    options.protocolKey,
    options.protocolIv
  );
  const response = await net.post(url, body, 4e6, 12000);
  if (response.status !== 200) throw Error("DRAMA_API_HTTP");
  const envelope = parseDramaEnvelope(
    response.body.toString("utf8"),
    options.protocolKey
  );
  const result = Number(envelope.result ?? 0);
  if (result <= 0) throw Error("DRAMA_API_RESULT");
  return envelope;
}

async function fetchCatalog(net: SafeNet, options: DramaDirectOptions) {
  const topicEnvelope = await request(net, options, "getliveTopics", {
    type: "tv"
  });
  const topics = parseDramaTopics(topicEnvelope.live_topics);
  if (!topics.length) throw Error("DRAMA_TOPICS_EMPTY");
  const items: DramaLiveItem[] = [];
  for (let index = 0; index < topics.length; index += 4) {
    const batch = topics.slice(index, index + 4);
    const results = await Promise.all(
      batch.map(async (topic) => {
        const envelope = await request(net, options, "getLiveByTopic", {
          type: topic.type || "tv",
          topic: topic.id
        });
        return parseDramaLive(envelope.live).map((item) => ({
          ...item,
          topicId: item.topicId || topic.id,
          topicName: item.topicName || topic.name
        }));
      })
    );
    for (const result of results) items.push(...result);
    if (items.length > 20000) throw Error("DRAMA_CATALOG_LIMIT");
  }
  return { topics, items };
}

export async function refreshDramaDirect(
  store: Store,
  net: SafeNet,
  options: DramaDirectOptions
) {
  const catalog = await fetchCatalog(net, options);
  const normalized = normalizeDramaCatalog(PROVIDER_ID, catalog.items);
  const allowedSources: typeof normalized.sources = [];
  const blockedHosts = new Set<string>();
  for (const source of normalized.sources) {
    try {
      await net.validate(source.url);
      allowedSources.push(source);
    } catch {
      try {
        blockedHosts.add(new URL(source.url).hostname.toLowerCase());
      } catch {
        // Invalid URLs were already filtered by the pure provider parser.
      }
    }
  }
  const usableChannels = new Set(allowedSources.map((source) => source.channelId));
  const channels = normalized.channels.filter((channel) => usableChannels.has(channel.id));
  store.db.exec("BEGIN");
  try {
    for (const old of store
      .all("source")
      .filter(
        (source) =>
          source.providerId === PROVIDER_ID &&
          !allowedSources.some((next) => next.id === source.id)
      ))
      store.put("source", old.id, { ...old, enabled: false });
    for (const channel of channels) store.put("channel", channel.id, channel);
    for (const source of allowedSources) store.put("source", source.id, source);
    store.put("provider", PROVIDER_ID, {
      id: PROVIDER_ID,
      authorized: true,
      type: "drama-direct",
      sourceKind: "drama-live",
      directConfigured: true,
      topics: catalog.topics.length,
      channels: channels.length,
      sources: allowedSources.length,
      blockedHosts: [...blockedHosts].slice(0, 100),
      updatedAt: Date.now(),
      failures: 0,
      nextRefreshAt: Date.now() + 3600000
    });
    store.db.exec("COMMIT");
  } catch (error) {
    store.db.exec("ROLLBACK");
    throw error;
  }
  return {
    topics: catalog.topics.length,
    channels: channels.length,
    sources: allowedSources.length,
    blockedHosts: [...blockedHosts].slice(0, 100)
  };
}

export function registerDramaDirect(
  app: FastifyInstance,
  store: Store,
  net: SafeNet,
  env: DramaEnv = process.env
) {
  app.get("/api/admin/providers/drama-direct/status", async () => {
    const options = dramaDirectOptions(env);
    let host = "";
    if (options) {
      try {
        host = new URL(options.liveBase).hostname;
      } catch {
        host = "invalid";
      }
    }
    const provider = store.get("provider", PROVIDER_ID);
    return {
      enabled: env.DRAMA_DIRECT_ENABLED === "true",
      ready: !!options,
      missing: dramaDirectMissing(env),
      host,
      lastSync: provider
        ? {
            updatedAt: provider.updatedAt || null,
            topics: provider.topics || 0,
            channels: provider.channels || 0,
            sources: provider.sources || 0,
            blockedHosts: provider.blockedHosts || []
          }
        : null
    };
  });
  app.post("/api/admin/providers/drama-direct/refresh", async () => {
    const options = dramaDirectOptions(env);
    if (!options) throw Error("DRAMA_DIRECT_NOT_READY");
    return { ok: true, ...(await refreshDramaDirect(store, net, options)) };
  });

  const options = dramaDirectOptions(env);
  if (!options) return;
  let busy = false;
  let running: Promise<void> = Promise.resolve();
  const tick = async () => {
    const provider = store.get("provider", PROVIDER_ID);
    if (busy || (provider?.nextRefreshAt && provider.nextRefreshAt > Date.now())) return;
    busy = true;
    try {
      await refreshDramaDirect(store, net, options);
    } catch {
      const current = store.get("provider", PROVIDER_ID) || {};
      const failures = (current.failures || 0) + 1;
      store.put("provider", PROVIDER_ID, {
        ...current,
        id: PROVIDER_ID,
        authorized: true,
        type: "drama-direct",
        directConfigured: true,
        failures,
        nextRefreshAt:
          Date.now() + Math.min(3600000, 60000 * Math.pow(2, failures))
      });
    } finally {
      busy = false;
    }
  };
  running = tick();
  const timer = setInterval(() => {
    if (!busy) running = tick();
  }, 60000);
  timer.unref();
  app.addHook("onClose", async () => {
    clearInterval(timer);
    await running;
  });
}
