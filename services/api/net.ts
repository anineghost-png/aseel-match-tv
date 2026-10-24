import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import http from "node:http";
import https from "node:https";
export function publicIP(ip: string) {
  if (isIP(ip) !== 4) return false;
  const a = ip.split(".").map(Number);
  return !(
    a[0] === 0 ||
    a[0] === 10 ||
    a[0] === 127 ||
    a[0] >= 224 ||
    (a[0] === 169 && a[1] === 254) ||
    (a[0] === 172 && a[1] >= 16 && a[1] <= 31) ||
    (a[0] === 192 && (a[1] === 168 || a[1] === 0)) ||
    (a[0] === 100 && a[1] >= 64 && a[1] <= 127) ||
    (a[0] === 198 && (a[1] === 18 || a[1] === 19 || a[1] === 51)) ||
    (a[0] === 203 && a[1] === 0 && a[2] === 113)
  );
}
export interface FetchResult {
  body: Buffer;
  status: number;
  firstByteMs: number;
  elapsedMs: number;
  url: string;
  headers: http.IncomingHttpHeaders;
}
export class SafeNet {
  constructor(
    readonly hosts: string[],
    readonly lan: string[] = []
  ) {}
  async validate(raw: string) {
    const u = new URL(raw);
    if (
      !["http:", "https:"].includes(u.protocol) ||
      u.username ||
      u.password ||
      u.hash
    )
      throw Error("URL_REJECTED");
    const host = u.hostname.toLowerCase();
    if (!this.hosts.includes(host) && !this.lan.includes(host))
      throw Error("HOST_NOT_ALLOWED");
    const answers = await lookup(host, { all: true, family: 4 });
    if (
      !answers.length ||
      (!this.lan.includes(host) && answers.some((a) => !publicIP(a.address)))
    )
      throw Error("ADDRESS_REJECTED");
    return { u, address: answers[0].address };
  }
  async get(
    raw: string,
    maxBytes = 2e6,
    timeout = 5000,
    redirects = 0
  ): Promise<FetchResult> {
    const { u, address } = await this.validate(raw),
      start = performance.now();
    return new Promise((resolve, reject) => {
      let done = false;
      const finish = (e: Error) => {
        if (!done) {
          done = true;
          reject(e);
        }
      };
      const request = (u.protocol === "https:" ? https : http).get(
        u,
        {
          lookup: ((_h: any, _o: any, cb: any) => cb(null, address, 4)) as any,
          headers: {
            "User-Agent": "ASEEL-MATCH-TV/0.1",
            "Accept-Encoding": "identity"
          }
        },
        (res) => {
          const firstByteMs = performance.now() - start,
            status = res.statusCode || 0;
          if (status >= 300 && status < 400) {
            res.resume();
            clearTimeout(timer);
            request.destroy();
            if (redirects >= 3 || !res.headers.location) {
              finish(Error("REDIRECT_LIMIT"));
              return;
            }
            this.get(
              new URL(res.headers.location, u).href,
              maxBytes,
              timeout,
              redirects + 1
            ).then(resolve, reject);
            return;
          }
          const chunks: Buffer[] = [];
          let size = 0;
          res.on("data", (chunk: Buffer) => {
            size += chunk.length;
            if (size > maxBytes) {
              res.destroy();
              request.destroy();
              finish(Error("SIZE_LIMIT"));
            } else chunks.push(chunk);
          });
          res.on("error", () => finish(Error("NETWORK_ERROR")));
          res.on("end", () => {
            clearTimeout(timer);
            if (!done) {
              done = true;
              resolve({
                body: Buffer.concat(chunks),
                status,
                firstByteMs,
                elapsedMs: performance.now() - start,
                url: u.href,
                headers: res.headers
              });
            }
          });
        }
      );
      const timer = setTimeout(() => {
        request.destroy();
        finish(Error("TIMEOUT"));
      }, timeout);
      request.on("error", () => {
        clearTimeout(timer);
        finish(Error("NETWORK_ERROR"));
      });
    });
  }
  async post(
    raw: string,
    body: string,
    maxBytes = 2e6,
    timeout = 8000,
    redirects = 0
  ): Promise<FetchResult> {
    const { u, address } = await this.validate(raw),
      start = performance.now(),
      encoded = Buffer.from(body, "utf8");
    return new Promise((resolve, reject) => {
      let done = false;
      const finish = (e: Error) => {
        if (!done) {
          done = true;
          reject(e);
        }
      };
      const request = (u.protocol === "https:" ? https : http).request(
        u,
        {
          method: "POST",
          lookup: ((_h: any, _o: any, cb: any) => cb(null, address, 4)) as any,
          headers: {
            "User-Agent": "ASEEL-MATCH-TV/0.1",
            "Accept-Encoding": "identity",
            "Content-Type": "application/json; charset=utf-8",
            "Content-Length": encoded.length
          }
        },
        (res) => {
          const firstByteMs = performance.now() - start,
            status = res.statusCode || 0;
          if (status >= 300 && status < 400) {
            res.resume();
            clearTimeout(timer);
            request.destroy();
            if (redirects >= 3 || !res.headers.location) {
              finish(Error("REDIRECT_LIMIT"));
              return;
            }
            this.post(
              new URL(res.headers.location, u).href,
              body,
              maxBytes,
              timeout,
              redirects + 1
            ).then(resolve, reject);
            return;
          }
          const chunks: Buffer[] = [];
          let size = 0;
          res.on("data", (chunk: Buffer) => {
            size += chunk.length;
            if (size > maxBytes) {
              res.destroy();
              request.destroy();
              finish(Error("SIZE_LIMIT"));
            } else chunks.push(chunk);
          });
          res.on("error", () => finish(Error("NETWORK_ERROR")));
          res.on("end", () => {
            clearTimeout(timer);
            if (!done) {
              done = true;
              resolve({
                body: Buffer.concat(chunks),
                status,
                firstByteMs,
                elapsedMs: performance.now() - start,
                url: u.href,
                headers: res.headers
              });
            }
          });
        }
      );
      const timer = setTimeout(() => {
        request.destroy();
        finish(Error("TIMEOUT"));
      }, timeout);
      request.on("error", () => {
        clearTimeout(timer);
        finish(Error("NETWORK_ERROR"));
      });
      request.end(encoded);
    });
  }
}
