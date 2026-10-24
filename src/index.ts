import { config } from "../services/api/config.js";
import { buildApp } from "../services/api/app.js";

async function start() {
  if (process.env.VERCEL) {
    process.env.HOST ||= "0.0.0.0";
    process.env.DATA_DIR ||= "/tmp/aseel-match-tv";
  }
  const cfg = config();
  const app = await buildApp(cfg);
  await app.listen({ port: cfg.PORT, host: cfg.HOST });
}

start().catch(() => {
  console.error("STARTUP_FAILED");
  process.exitCode = 1;
});
