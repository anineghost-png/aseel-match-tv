import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
let value = existsSync(".env")
  ? readFileSync(".env", "utf8")
  : readFileSync(".env.example", "utf8").replace(
      "replace-with-at-least-32-random-characters",
      randomBytes(32).toString("hex")
    );
if (process.argv.includes("--lan"))
  value = /^HOST=/m.test(value)
    ? value.replace(/^HOST=.*$/m, "HOST=0.0.0.0")
    : value + "\nHOST=0.0.0.0\n";
writeFileSync(".env", value, { mode: 0o600 });
console.log(
  "Local configuration ready. Secrets are not printed. " +
    (process.argv.includes("--lan")
      ? "LAN binding enabled for your trusted private network."
      : "")
);
