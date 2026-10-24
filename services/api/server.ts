import { config } from "./config.js";
import { buildApp } from "./app.js";
import { networkInterfaces } from "node:os";
async function start() {
  const cfg = config();
  const app = await buildApp(cfg);
  await app.listen({ port: cfg.PORT, host: cfg.HOST });
  console.log(
    "ASEEL MATCH TV — PS4 release candidate; physical acceptance PENDING"
  );
  console.log(`Computer: http://127.0.0.1:${cfg.PORT}`);
  if (cfg.HOST === "0.0.0.0") {
    for (const entries of Object.values(networkInterfaces()))
      for (const item of entries || [])
        if (item.family === "IPv4" && !item.internal)
          console.log(
            `PS4 candidate URL: http://${item.address}:${cfg.PORT} — use the adapter shared with your PS4`
          );
  } else
    console.log(
      "LAN is not enabled. Use npm run ps4 to prepare the private-network test."
    );
  console.log(
    "On PS4: open /compat then /controller. Keep the server terminal running."
  );
  for (const sig of ["SIGTERM", "SIGINT"])
    process.once(sig, () => {
      void app.close().then(() => process.exit(0));
    });
}
start().catch(() => {
  console.error(
    "STARTUP_FAILED: check Node 24+, .env ADMIN_TOKEN, PORT, and writable DATA_DIR. No configuration values were printed."
  );
  process.exitCode = 1;
});
