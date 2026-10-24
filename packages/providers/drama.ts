export type DramaSourceKind = "m3u" | "xtream" | "fg";

export interface DramaSource {
  kind: DramaSourceKind;
  m3uUrl: string;
  host: string;
}

const cleanToken = (value: string) =>
  value.trim().replace(/^["'`]+|["'`,;]+$/g, "");

const findValue = (text: string, labels: string[]) => {
  for (const label of labels) {
    const re = new RegExp(
      `(?:^|\\n)\\s*(?:${label})\\s*[:=：-]\\s*([^\\r\\n]+)`,
      "im"
    );
    const match = re.exec(text);
    if (match) return cleanToken(match[1]);
  }
  return "";
};

const safeHttpUrl = (raw: string) => {
  const value = cleanToken(raw);
  const normalized = /^https?:\/\//i.test(value) ? value : `http://${value}`;
  const url = new URL(normalized);
  if (!["http:", "https:"].includes(url.protocol)) throw Error("DRAMA_URL");
  if (url.username || url.password) throw Error("DRAMA_URL_USERINFO");
  return url;
};

const buildXtreamPlaylist = (base: string, username: string, password: string) => {
  const url = safeHttpUrl(base);
  url.pathname = url.pathname.replace(/\/+$/, "") + "/get.php";
  url.search = "";
  url.hash = "";
  url.searchParams.set("username", username);
  url.searchParams.set("password", password);
  url.searchParams.set("type", "m3u_plus");
  url.searchParams.set("output", "ts");
  return url;
};

export function parseDramaShare(input: string): DramaSource {
  if (!input || input.length > 8192 || input.includes("\0"))
    throw Error("DRAMA_SHARE_INVALID");
  const text = input.trim();

  const server = findValue(text, [
    "server(?:\\s*url)?",
    "host",
    "portal",
    "url",
    "السيرفر",
    "الخادم",
    "الرابط"
  ]);
  const username = findValue(text, ["username", "user", "اسم\\s*المستخدم"]);
  const password = findValue(text, ["password", "pass", "كلمة\\s*المرور"]);

  if (server && username && password) {
    if (username.length > 256 || password.length > 256)
      throw Error("DRAMA_CREDENTIAL_LENGTH");
    const url = buildXtreamPlaylist(server, username, password);
    return { kind: "xtream", m3uUrl: url.href, host: url.hostname };
  }

  const urls = text.match(/https?:\/\/[^\s<>"']+/gi) || [];
  const bare =
    !/\s/.test(text) && /^[a-z0-9.-]+(?::\d+)?(?:\/\S*)?$/i.test(text)
      ? text
      : "";
  const candidates = [server, ...urls, bare]
    .filter(Boolean)
    .map(cleanToken)
    .filter((value, index, all) => all.indexOf(value) === index);

  for (const candidate of candidates) {
    let url: URL;
    try {
      url = safeHttpUrl(candidate);
    } catch {
      continue;
    }
    const lower = url.href.toLowerCase();
    const fg = /(^|\.)fgcode\.(?:store|org|com)$/i.test(url.hostname);
    const playlist =
      fg ||
      /(?:\.m3u8?|\/get\.php)(?:$|[?#])/i.test(url.pathname + url.search) ||
      /(?:m3u|playlist|source)/i.test(lower);
    if (playlist)
      return {
        kind: fg ? "fg" : "m3u",
        m3uUrl: url.href,
        host: url.hostname
      };
  }

  if (candidates.length === 1) {
    const url = safeHttpUrl(candidates[0]);
    return { kind: "m3u", m3uUrl: url.href, host: url.hostname };
  }

  throw Error("DRAMA_SOURCE_NOT_FOUND");
}
