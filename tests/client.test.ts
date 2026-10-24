import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { parse } from "acorn";
test("TV JavaScript parses as ES5 and stays under 80KB", () => {
  let bytes = 0;
  for (const f of readdirSync("apps/tv").filter((f) => f.endsWith(".js"))) {
    const text = readFileSync("apps/tv/" + f, "utf8");
    parse(text, { ecmaVersion: 5 });
    bytes += Buffer.byteLength(text);
  }
  assert.ok(bytes < 80000);
  assert.ok(statSync("apps/tv/style.css").size < 30000);
});
