import { createCipheriv, createDecipheriv, createHash } from "node:crypto";
import { normalize } from "../core/names.js";
import type { Channel, Source } from "../core/models.js";

export interface DramaDirectOptions {
  liveBase: string;
  activationCode: string;
  protocolKey: string;
  protocolIv: string;
  context?: Record<string, unknown>;
}

export interface DramaTopic {
  id: string;
  name: string;
  type: string;
}

export interface DramaLiveItem {
  id: string;
  topicId: string;
  name: string;
  topicName: string;
  type: string;
  url: string;
  logo: string;
  agent: string;
  backupUrls: string[];
}

const id = (value: string) =>
  createHash("sha256").update(value).digest("hex").slice(0, 24);

const stringValue = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

const parseJsonList = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const objectValue = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const safeUrl = (raw: string) => {
  try {
    const url = new URL(raw.trim());
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password)
      return "";
    return url.href;
  } catch {
    return "";
  }
};

const backupUrls = (value: unknown) => {
  const found: string[] = [];
  const add = (raw: string) => {
    const url = safeUrl(raw);
    if (url && !found.includes(url)) found.push(url);
  };
  for (const entry of parseJsonList(value)) {
    if (typeof entry === "string") add(entry);
    else {
      const record = objectValue(entry);
      if (record) add(stringValue(record.url));
    }
  }
  if (typeof value === "string" && !found.length) {
    for (const match of value.match(/https?:\/\/[^\s|,;"'<>]+/gi) || []) add(match);
  }
  return found;
};

const keyBytes = (value: string, label: string) => {
  const bytes = Buffer.from(value, "latin1");
  if (bytes.length !== 16) throw Error(`${label}_LENGTH`);
  return bytes;
};

export function encryptDramaPayload(
  payload: Record<string, unknown>,
  key: string,
  iv: string
) {
  const keyBuffer = keyBytes(key, "DRAMA_KEY");
  const ivBuffer = keyBytes(iv, "DRAMA_IV");
  const cipher = createCipheriv("aes-128-cbc", keyBuffer, ivBuffer);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final()
  ]);
  return `${encrypted.toString("base64")}:${ivBuffer.toString("base64")}`;
}

export function decryptDramaPayload(payload: string, key: string) {
  const split = payload.trim().split(":");
  if (split.length !== 2 || !split[0] || !split[1]) throw Error("DRAMA_ENVELOPE");
  const keyBuffer = keyBytes(key, "DRAMA_KEY");
  const ivBuffer = Buffer.from(split[1], "base64");
  if (ivBuffer.length !== 16) throw Error("DRAMA_IV_LENGTH");
  const decipher = createDecipheriv("aes-128-cbc", keyBuffer, ivBuffer);
  return Buffer.concat([
    decipher.update(Buffer.from(split[0], "base64")),
    decipher.final()
  ]).toString("utf8");
}

export function dramaRequestBody(
  options: DramaDirectOptions,
  extra: Record<string, unknown> = {}
) {
  if (!options.activationCode.trim()) throw Error("DRAMA_CODE_REQUIRED");
  return {
    user_id: "",
    device_id: "aseel-match-tv",
    device_api: "29",
    version_name: "13.0.3",
    language: "ar",
    timezone: "Asia/Baghdad",
    device_type: "phone",
    store: "",
    isStoreVersion: false,
    isPremium: true,
    isCoupon_active: false,
    hideAds: true,
    appCount: "",
    mainServer: "",
    ...(options.context || {}),
    KEY_ACTIVATED_TYPE: options.activationCode.trim(),
    ...extra
  };
}

export function dramaEndpoint(base: string, operation: string) {
  const normalized = base.endsWith("/") ? base : `${base}/`;
  const url = new URL(operation, normalized);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password)
    throw Error("DRAMA_API_URL");
  return url.href;
}

export function parseDramaEnvelope(text: string, key: string) {
  const decoded = decryptDramaPayload(text, key);
  const value: unknown = JSON.parse(decoded);
  const record = objectValue(value);
  if (!record) throw Error("DRAMA_RESPONSE");
  return record;
}

export function parseDramaTopics(value: unknown): DramaTopic[] {
  const out: DramaTopic[] = [];
  for (const raw of parseJsonList(value)) {
    const record = objectValue(raw);
    if (!record) continue;
    const topicId = stringValue(record.id_topic || record.id);
    const name = stringValue(record.name || record.name_topic);
    if (!topicId || !name) continue;
    out.push({
      id: topicId.slice(0, 200),
      name: name.slice(0, 200),
      type: stringValue(record.type || "tv").slice(0, 40) || "tv"
    });
  }
  return out;
}

export function parseDramaLive(value: unknown): DramaLiveItem[] {
  const out: DramaLiveItem[] = [];
  for (const raw of parseJsonList(value)) {
    const record = objectValue(raw);
    if (!record) continue;
    const url = safeUrl(stringValue(record.url));
    const name = stringValue(record.name);
    if (!url || !name) continue;
    out.push({
      id: stringValue(record.id_live || record.id || url).slice(0, 300),
      topicId: stringValue(record.id_topic).slice(0, 200),
      name: name.slice(0, 200),
      topicName: stringValue(record.name_topic).slice(0, 200),
      type: stringValue(record.type || "tv").slice(0, 40) || "tv",
      url,
      logo: safeUrl(stringValue(record.img_url)),
      agent: stringValue(record.agent).slice(0, 500),
      backupUrls: backupUrls(record.backup)
    });
  }
  return out;
}

export function normalizeDramaCatalog(
  providerId: string,
  items: DramaLiveItem[]
): { channels: Channel[]; sources: Source[] } {
  const channels: Channel[] = [];
  const sources: Source[] = [];
  const sourceUrls = new Set<string>();
  for (const item of items) {
    const channelId = id(`${providerId}:channel:${item.id || item.name}`);
    if (!channels.some((channel) => channel.id === channelId))
      channels.push({
        id: channelId,
        providerId,
        tvgId: item.id,
        name: item.name,
        normalizedName: normalize(item.name),
        group: item.topicName || item.topicId || "Drama Live",
        logo: item.logo,
        enabled: true
      });
    const urls = [item.url, ...item.backupUrls];
    urls.forEach((url, index) => {
      if (sourceUrls.has(url)) return;
      sourceUrls.add(url);
      const pathname = new URL(url).pathname.toLowerCase();
      sources.push({
        id: id(`${providerId}:source:${url}`),
        channelId,
        providerId,
        url,
        protocol: pathname.endsWith(".m3u8") ? "hls" : "unknown",
        enabled: true,
        priorityOverride: index === 0 ? 10 : 0
      });
    });
  }
  return { channels, sources };
}
