import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDramaShare } from "../packages/providers/drama.js";

test("Drama handoff accepts direct M3U URL", () => {
  const source = parseDramaShare("https://media.example.com/list.m3u");
  assert.equal(source.kind, "m3u");
  assert.equal(source.host, "media.example.com");
  assert.equal(source.m3uUrl, "https://media.example.com/list.m3u");
});

test("Drama handoff accepts bare FG Code URL", () => {
  const source = parseDramaShare("fgcode.store/my-private-code");
  assert.equal(source.kind, "fg");
  assert.equal(source.host, "fgcode.store");
  assert.equal(source.m3uUrl, "http://fgcode.store/my-private-code");
});

test("Drama handoff converts Xtream share text to an M3U playlist", () => {
  const source = parseDramaShare(
    "Server: https://tv.example.com:8443\nUsername: aseel\nPassword: secret-value"
  );
  const url = new URL(source.m3uUrl);
  assert.equal(source.kind, "xtream");
  assert.equal(source.host, "tv.example.com");
  assert.equal(url.pathname, "/get.php");
  assert.equal(url.searchParams.get("username"), "aseel");
  assert.equal(url.searchParams.get("password"), "secret-value");
  assert.equal(url.searchParams.get("type"), "m3u_plus");
  assert.equal(url.searchParams.get("output"), "ts");
});

test("Drama handoff understands Arabic Xtream labels", () => {
  const source = parseDramaShare(
    "السيرفر: tv.example.com:8080\nاسم المستخدم: aseel\nكلمة المرور: private"
  );
  assert.equal(source.kind, "xtream");
  assert.match(source.m3uUrl, /^http:\/\/tv\.example\.com:8080\/get\.php\?/);
});

test("Drama handoff rejects URL userinfo and unrelated text", () => {
  assert.throws(() => parseDramaShare("https://user:pass@example.com/list.m3u"));
  assert.throws(() => parseDramaShare("this is not a source"));
});
