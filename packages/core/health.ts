import type { Health } from "./models.js";
export function scoreSource(
  h: Health,
  history: Health[] = [],
  compatible = true,
  now = Date.now()
) {
  const reasons: string[] = [];
  if (
    /hev1|hvc1|av01|vp09/i.test(h.codec) ||
    !h.manifestOk ||
    h.httpStatus !== 200 ||
    h.segmentOkRatio === 0 ||
    !compatible ||
    now - h.timestamp > 300000
  )
    return { score: 0, reasons: ["UNAVAILABLE_STALE_OR_INCOMPATIBLE"] };
  const stability = history.length
    ? history.filter((x) => x.manifestOk && x.segmentOkRatio > 0.8).length /
      history.length
    : h.segmentOkRatio;
  const headroom =
    h.estimatedRequiredMbps > 0
      ? Math.min(1, h.avgSegmentMbps / h.estimatedRequiredMbps / 2)
      : 0.25;
  const startup = Math.max(0, 1 - h.firstByteMs / 5000),
    resolution = h.resolutionHeight <= 1080 ? 1 : 0.3,
    fresh = h.playlistAgeSec < 60 ? 1 : 0;
  let score =
    30 * stability +
    25 * headroom +
    15 * startup +
    15 * h.segmentOkRatio +
    10 * resolution +
    5 * fresh;
  if (!fresh) {
    score -= 25;
    reasons.push("STALE_PLAYLIST");
  }
  reasons.push(
    "STABILITY_" + Math.round(stability * 100),
    "HEADROOM_" + headroom.toFixed(2),
    "TTFB_" + Math.round(h.firstByteMs)
  );
  return { score: Math.max(0, Math.round(score)), reasons };
}
export function parseHls(text: string, base: string) {
  if (!text.startsWith("#EXTM3U")) throw Error("NOT_HLS");
  if (/#EXT-X-(KEY|SESSION-KEY):/.test(text))
    throw Error("ENCRYPTED_MEDIA_UNSUPPORTED");
  const lines = text.split(/\r?\n/),
    variants: {
      url: string;
      bitrate: number;
      height: number;
      codec: string;
    }[] = [],
    segments: string[] = [];
  let pending: any = null,
    programTime: number | undefined;
  for (const line of lines) {
    if (line.startsWith("#EXT-X-STREAM-INF:"))
      pending = {
        bitrate: Number(/BANDWIDTH=(\d+)/.exec(line)?.[1] || 0),
        height: Number(/RESOLUTION=\d+x(\d+)/.exec(line)?.[1] || 0),
        codec: /CODECS="([^"]+)"/.exec(line)?.[1] || ""
      };
    else if (line.startsWith("#EXT-X-PROGRAM-DATE-TIME:"))
      programTime = Date.parse(line.slice(25));
    else if (line && line[0] !== "#") {
      const url = new URL(line, base).href;
      if (pending) {
        variants.push({ ...pending, url });
        pending = null;
      } else segments.push(url);
    }
  }
  return {
    variants,
    segments,
    programTime,
    vod: text.includes("#EXT-X-ENDLIST"),
    sequence: Number(/#EXT-X-MEDIA-SEQUENCE:(\d+)/.exec(text)?.[1] || 0)
  };
}
