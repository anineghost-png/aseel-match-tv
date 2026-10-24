import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseM3u,
  parseXmltv,
  textChunks,
  xmltvTime
} from "../packages/providers/media.js";
import { SafeNet, publicIP } from "../services/api/net.js";
test("M3U dedup and provider lineage", () => {
  const r = parseM3u(
    '#EXTM3U\n#EXTINF:-1 tvg-id="one" group-title="Sports",Sports\nhttps://example.com/a.m3u8\n#EXTINF:-1 tvg-id="one",Sports\nhttps://example.com/a.m3u8',
    "user"
  );
  assert.equal(r.sources.length, 1);
  assert.equal(r.channels[0].tvgId, "one");
  assert.equal(r.sources[0].providerId, "user");
});
test("XMLTV timezone and rolling window", async () => {
  assert.equal(xmltvTime("20261024220000 +0300"), "2026-10-24T19:00:00.000Z");
  const data =
    '<tv><programme channel="one" start="20261024220000 +0300" stop="20261025000000 +0300"><title>برشلونة × ريال مدريد</title></programme></tv>';
  assert.equal(
    (await parseXmltv(textChunks(data), Date.parse("2026-10-24"))).length,
    1
  );
  assert.equal(
    (await parseXmltv(textChunks(data), Date.parse("2026-10-26"))).length,
    0
  );
});
test("XML rejects DTD and invalid date", async () => {
  await assert.rejects(
    parseXmltv(textChunks('<!DOCTYPE tv [<!ENTITY x "bad">]><tv/>'))
  );
  assert.throws(() => xmltvTime("20260231000000 +0000"));
});
test("SSRF denies loopback, metadata, IPv6 and unsupported schemes", async () => {
  for (const ip of [
    "127.0.0.1",
    "169.254.169.254",
    "10.2.3.4",
    "::1",
    "::ffff:127.0.0.1",
    "100.64.0.1"
  ])
    assert.equal(publicIP(ip), false);
  const n = new SafeNet(["127.0.0.1"]);
  await assert.rejects(n.validate("http://127.0.0.1"));
  await assert.rejects(n.validate("file:///etc/passwd"));
  await assert.rejects(n.validate("https://unapproved.example"));
});
