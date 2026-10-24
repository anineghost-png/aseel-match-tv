import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { parseDramaShare } from "../../packages/providers/drama.js";
import { refreshCatalog } from "../worker/jobs.js";
import type { Store } from "./store.js";
import type { SafeNet } from "./net.js";
import { registerDramaDirect } from "./drama-direct.js";

const bodySchema = z.object({
  providerId: z
    .string()
    .regex(/^[a-zA-Z0-9_-]{1,60}$/)
    .default("drama-live"),
  authorized: z.literal(true),
  text: z.string().min(1).max(8192)
});

export function dramaProviderRoutes(
  app: FastifyInstance,
  store: Store,
  net: SafeNet
) {
  app.post("/api/admin/providers/drama/preview", async (req) => {
    const body = bodySchema.parse(req.body);
    const source = parseDramaShare(body.text);
    return {
      ok: true,
      providerId: body.providerId,
      kind: source.kind,
      host: source.host,
      readyToImport: source.kind !== "fg",
      secretStored: false
    };
  });

  app.post("/api/admin/providers/drama", async (req, reply) => {
    const body = bodySchema.parse(req.body);
    const source = parseDramaShare(body.text);
    if (source.kind === "fg")
      return reply.code(409).send({
        error: "FG_REQUIRES_RESOLUTION",
        host: source.host
      });
    await net.validate(source.m3uUrl);
    await refreshCatalog(store, net, {
      id: body.providerId,
      authorized: true,
      m3uUrl: source.m3uUrl,
      type: "personal",
      sourceKind: "drama-live",
      dramaKind: source.kind
    });
    return {
      ok: true,
      providerId: body.providerId,
      kind: source.kind,
      host: source.host,
      channels: store
        .all("channel")
        .filter((channel) => channel.providerId === body.providerId).length,
      sources: store
        .all("source")
        .filter((item) => item.providerId === body.providerId).length
    };
  });

  registerDramaDirect(app, store, net);
}
