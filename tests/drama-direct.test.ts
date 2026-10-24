import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decryptDramaPayload,
  dramaRequestBody,
  encryptDramaPayload,
  normalizeDramaCatalog,
  parseDramaLive,
  parseDramaTopics
} from "../packages/providers/drama-direct.js";

const options = {
  liveBase: "https://api.example.test/live/",
  activationCode: "private-code",
  protocolKey: "1234567890abcdef",
  protocolIv: "fedcba0987654321",
  context: { device_id: "private-device", language: "ar" }
};

test("Drama direct protocol round-trips an encrypted JSON body", () => {
  const body = dramaRequestBody(options, { type: "tv", topic: "sports" });
  const encrypted = encryptDramaPayload(
    body,
    options.protocolKey,
    options.protocolIv
  );
  assert.notEqual(encrypted, JSON.stringify(body));
  assert.deepEqual(
    JSON.parse(decryptDramaPayload(encrypted, options.protocolKey)),
    body
  );
});

test("Drama direct request keeps activation secret authoritative", () => {
  const body = dramaRequestBody(
    { ...options, context: { KEY_ACTIVATED_TYPE: "wrong", device_id: "a9" } },
    { type: "tv" }
  );
  assert.equal(body.KEY_ACTIVATED_TYPE, "private-code");
  assert.equal(body.device_id, "a9");
  assert.equal(body.type, "tv");
});

test("Drama direct parses string-encoded topics and live records", () => {
  const topics = parseDramaTopics(
    JSON.stringify([{ id_topic: 7, name: "Sports", type: "tv" }])
  );
  assert.deepEqual(topics, [{ id: "7", name: "Sports", type: "tv" }]);

  const live = parseDramaLive(
    JSON.stringify([
      {
        id_live: 10,
        id_topic: 7,
        name: "Channel One",
        name_topic: "Sports",
        type: "tv",
        url: "https://media.example.test/live/one.m3u8",
        img_url: "https://media.example.test/logo.png",
        backup: JSON.stringify([
          { url: "https://backup.example.test/live/one.m3u8" }
        ])
      }
    ])
  );
  assert.equal(live.length, 1);
  assert.equal(live[0].id, "10");
  assert.equal(live[0].backupUrls.length, 1);
});

test("Drama direct normalizes primary and backup streams without leaking auth data", () => {
  const live = parseDramaLive([
    {
      id_live: "10",
      id_topic: "7",
      name: "Channel One",
      name_topic: "Sports",
      url: "https://media.example.test/live/one.m3u8",
      backup: "https://backup.example.test/live/one.m3u8"
    }
  ]);
  const catalog = normalizeDramaCatalog("drama-direct", live);
  assert.equal(catalog.channels.length, 1);
  assert.equal(catalog.sources.length, 2);
  assert.equal(catalog.sources[0].protocol, "hls");
  assert.equal(catalog.sources[0].priorityOverride, 10);
  assert.equal(catalog.sources[1].priorityOverride, 0);
});

test("Drama direct rejects malformed crypto material", () => {
  assert.throws(() => encryptDramaPayload({}, "short", options.protocolIv));
  assert.throws(() => encryptDramaPayload({}, options.protocolKey, "short"));
});
