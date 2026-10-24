import { createHash } from "node:crypto";
import { SaxesParser } from "saxes";
import { normalize } from "../core/names.js";
import type { Channel, Source, Program } from "../core/models.js";
const id = (s: string) =>
  createHash("sha256").update(s).digest("hex").slice(0, 24);
export function parseM3u(text: string, providerId: string) {
  if (text.length > 2e6 || !text.trimStart().startsWith("#EXTM3U"))
    throw Error("INVALID_M3U");
  const channels: Channel[] = [],
    sources: Source[] = [],
    seen = new Set<string>();
  let attrs: Record<string, string> = {},
    name = "";
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith("#EXTINF:")) {
      attrs = {};
      for (const m of line.matchAll(/([\w-]+)="([^"]*)"/g)) attrs[m[1]] = m[2];
      name = line.slice(line.lastIndexOf(",") + 1).slice(0, 200);
    } else if (line && !line.startsWith("#")) {
      if (!name) continue;
      const u = new URL(line);
      if (!["http:", "https:"].includes(u.protocol) || u.username || u.password)
        throw Error("URL_REJECTED");
      if (seen.has(u.href)) continue;
      seen.add(u.href);
      const channelId = id(providerId + ":" + (attrs["tvg-id"] || name));
      if (!channels.some((c) => c.id === channelId))
        channels.push({
          id: channelId,
          providerId,
          tvgId: attrs["tvg-id"] || "",
          name,
          normalizedName: normalize(name),
          group: attrs["group-title"] || "",
          logo: attrs["tvg-logo"] || "",
          enabled: true
        });
      sources.push({
        id: id(providerId + u.href),
        channelId,
        providerId,
        url: u.href,
        protocol: u.pathname.endsWith(".m3u8") ? "hls" : "unknown",
        enabled: true,
        priorityOverride: 0
      });
      name = "";
      if (sources.length > 10000) throw Error("CATALOG_LIMIT");
    }
  }
  return { channels, sources };
}
export function xmltvTime(raw: string) {
  const m =
    /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s*([+-])(\d{2})(\d{2})$/.exec(
      raw
    );
  if (!m) throw Error("XMLTV_TIME");
  const [y, mo, d, h, mi, s] = m.slice(1, 7).map(Number);
  if (
    mo < 1 ||
    mo > 12 ||
    d < 1 ||
    d > 31 ||
    h > 23 ||
    mi > 59 ||
    s > 59 ||
    +m[8] > 14 ||
    +m[9] > 59
  )
    throw Error("XMLTV_TIME");
  const base = Date.UTC(y, mo - 1, d, h, mi, s);
  if (new Date(base).getUTCDate() !== d) throw Error("XMLTV_TIME");
  return new Date(
    base - (+m[8] * 60 + +m[9]) * 60000 * (m[7] === "+" ? 1 : -1)
  ).toISOString();
}
export async function parseXmltv(
  chunks: AsyncIterable<string>,
  now = Date.now()
) {
  const result: Program[] = [];
  let current: Program | null = null,
    tag = "",
    bytes = 0;
  const p = new SaxesParser();
  p.on("doctype", () => {
    throw Error("DTD_FORBIDDEN");
  });
  p.on("opentag", (n) => {
    tag = n.name;
    if (tag === "programme") {
      const a = n.attributes as Record<string, string>;
      current = {
        id: id(a.channel + a.start),
        tvgId: a.channel,
        title: "",
        description: "",
        startUtc: xmltvTime(a.start),
        endUtc: xmltvTime(a.stop)
      };
    }
  });
  p.on("text", (text) => {
    if (current && tag === "title")
      current.title = (current.title + text).slice(0, 2000);
    if (current && tag === "desc")
      current.description = (current.description + text).slice(0, 4000);
  });
  p.on("closetag", (n) => {
    if (n.name === "programme" && current) {
      const a = Date.parse(current.startUtc),
        b = Date.parse(current.endUtc);
      if (b > a && b > now - 6 * 3600000 && a < now + 48 * 3600000)
        result.push(current);
      current = null;
      if (result.length > 50000) throw Error("EPG_LIMIT");
    }
    tag = "";
  });
  for await (const chunk of chunks) {
    bytes += Buffer.byteLength(chunk);
    if (bytes > 20e6) throw Error("EPG_SIZE");
    p.write(chunk);
  }
  p.close();
  return result;
}
export async function* textChunks(text: string) {
  for (let i = 0; i < text.length; i += 8192) yield text.slice(i, i + 8192);
}
