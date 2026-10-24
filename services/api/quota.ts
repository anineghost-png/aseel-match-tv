import { Store } from "./store.js";
export class QuotaCache {
  pending = new Map<string, Promise<any>>();
  constructor(
    private store: Store,
    private reservePercent = 15
  ) {}
  async get<T>(
    provider: string,
    key: string,
    limit: number,
    ttl: number,
    load: () => Promise<T>,
    now = Date.now()
  ): Promise<{ value: T; stale: boolean; updatedAt: number }> {
    const id = provider + ":" + key,
      cached = this.store.get<{ value: T; updatedAt: number }>("cache", id);
    if (cached && now - cached.updatedAt < ttl)
      return { ...cached, stale: false };
    if (this.pending.has(id)) return this.pending.get(id)!;
    const backoff = this.store.get("backoff", provider);
    if (
      backoff?.until > now ||
      !this.store.reserve(provider, limit, this.reservePercent, now)
    ) {
      if (cached) return { ...cached, stale: true };
      throw Error("QUOTA_OR_BACKOFF");
    }
    const p = (async () => {
      try {
        const value = await load(),
          out = { value, updatedAt: now };
        this.store.put("cache", id, out);
        this.store.remove("backoff", provider);
        return { ...out, stale: false };
      } catch {
        const failures = (backoff?.failures || 0) + 1;
        this.store.put("backoff", provider, {
          failures,
          until: now + Math.min(3600000, 30000 * Math.pow(2, failures - 1))
        });
        if (cached) return { ...cached, stale: true };
        throw Error("PROVIDER_UNAVAILABLE");
      } finally {
        this.pending.delete(id);
      }
    })();
    this.pending.set(id, p);
    return p;
  }
}
