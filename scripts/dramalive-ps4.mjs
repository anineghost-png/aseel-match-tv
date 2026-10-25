import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import http from "node:http";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync
} from "node:fs";
import { networkInterfaces } from "node:os";
import { resolve } from "node:path";

const dataDir = resolve(process.env.DATA_DIR || "./data");
const hlsDir = resolve(dataDir, "dramalive-hls");
const profileDir = resolve(dataDir, "dramalive-browser-profile");
const startUrl = process.env.DRAMALIVE_URL || "https://web.dramalive.cc/";
const ffmpegBin = process.env.FFMPEG_PATH || "ffmpeg";
const port = Number(process.env.DRAMALIVE_PORT || 3001);

mkdirSync(hlsDir, { recursive: true });
mkdirSync(profileDir, { recursive: true });

let ffmpeg = null;
let browser = null;
let server = null;
let generation = 0;
let currentUrl = "";
let closing = false;
let status = {
  state: "opening",
  message: "جاري فتح DramaLive في Chrome. اختر القناة التي تريدها هناك.",
  updatedAt: new Date().toISOString()
};

function setStatus(next) {
  status = { ...next, updatedAt: new Date().toISOString() };
}

function clearHls() {
  for (const name of readdirSync(hlsDir)) {
    if (/^(live\.m3u8|seg\d{5}\.ts)$/.test(name))
      rmSync(resolve(hlsDir, name), { force: true });
  }
}

function stopFfmpeg() {
  if (!ffmpeg) return;
  const child = ffmpeg;
  ffmpeg = null;
  try {
    child.kill("SIGTERM");
  } catch (_) {}
}

function candidate(url, contentType) {
  return (
    /\.m3u8(?:$|[?#])/i.test(url) ||
    /\.mpd(?:$|[?#])/i.test(url) ||
    /mpegurl|dash\+xml/i.test(contentType || "")
  );
}

function sourceType(url, contentType) {
  return /\.mpd(?:$|[?#])/i.test(url) || /dash\+xml/i.test(contentType || "")
    ? "dash"
    : "hls";
}

function headerArgs(headers) {
  const out = [];
  if (headers["user-agent"]) out.push("-user_agent", headers["user-agent"]);
  const lines = [];
  for (const name of ["referer", "origin", "cookie", "authorization", "accept"]) {
    if (headers[name]) lines.push(name + ": " + headers[name]);
  }
  if (lines.length) out.push("-headers", lines.join("\r\n") + "\r\n");
  return out;
}

function outputArgs(mode) {
  const codecs =
    mode === "copy"
      ? ["-c:v", "copy", "-c:a", "copy"]
      : [
          "-vf",
          "scale=-2:720:force_original_aspect_ratio=decrease",
          "-c:v",
          "libx264",
          "-preset",
          "ultrafast",
          "-tune",
          "zerolatency",
          "-profile:v",
          "main",
          "-level:v",
          "4.1",
          "-pix_fmt",
          "yuv420p",
          "-c:a",
          "aac",
          "-b:a",
          "128k",
          "-ar",
          "48000",
          "-ac",
          "2"
        ];
  return [
    "-map",
    "0:v:0?",
    "-map",
    "0:a:0?",
    ...codecs,
    "-f",
    "hls",
    "-hls_segment_type",
    "mpegts",
    "-hls_time",
    "2",
    "-hls_list_size",
    "8",
    "-hls_flags",
    "delete_segments+append_list+omit_endlist+independent_segments",
    "-hls_segment_filename",
    resolve(hlsDir, "seg%05d.ts"),
    resolve(hlsDir, "live.m3u8")
  ];
}

function waitForReady(myGeneration, host, type, mode) {
  const started = Date.now();
  const timer = setInterval(() => {
    if (myGeneration !== generation) {
      clearInterval(timer);
      return;
    }
    const manifest = resolve(hlsDir, "live.m3u8");
    if (existsSync(manifest) && statSync(manifest).size > 20) {
      clearInterval(timer);
      setStatus({
        state: "ready",
        sourceHost: host,
        sourceType: type,
        mode,
        message: "البث جاهز. اضغط تشغيل من صفحة PS4."
      });
      console.log("PS4 stream ready from", host, "using", mode, "mode.");
      return;
    }
    if (Date.now() - started > 25000) clearInterval(timer);
  }, 500);
}

function spawnFfmpeg(url, headers, host, type, mode, myGeneration) {
  clearHls();
  setStatus({
    state: "preparing",
    sourceHost: host,
    sourceType: type,
    mode,
    message:
      mode === "copy"
        ? "تم اكتشاف البث؛ جاري تمريره للـPS4 بدون إعادة ترميز…"
        : "المصدر يحتاج تحويل توافق؛ جاري تجهيز نسخة 720p…"
  });

  const args = [
    "-nostdin",
    "-hide_banner",
    "-loglevel",
    "warning",
    "-rw_timeout",
    "15000000",
    ...headerArgs(headers),
    "-i",
    url,
    ...outputArgs(mode)
  ];

  const child = spawn(ffmpegBin, args, { stdio: ["ignore", "ignore", "pipe"] });
  ffmpeg = child;
  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr = (stderr + chunk.toString()).slice(-4000);
  });
  child.once("error", (error) => {
    if (myGeneration !== generation) return;
    if (error && error.code === "ENOENT") {
      setStatus({
        state: "error",
        sourceHost: host,
        sourceType: type,
        mode,
        message: "FFmpeg غير موجود على الكمبيوتر. ثبّته أو عيّن FFMPEG_PATH ثم أعد الأمر."
      });
      console.error("FFmpeg was not found in PATH.");
    }
  });
  child.once("exit", (code) => {
    if (myGeneration !== generation || closing) return;
    if (ffmpeg === child) ffmpeg = null;
    const manifest = resolve(hlsDir, "live.m3u8");
    const ready = existsSync(manifest) && statSync(manifest).size > 20;
    if (code !== 0 && !ready && mode === "copy") {
      console.log("Direct remux failed; trying PS4 720p compatibility transcode.");
      spawnFfmpeg(url, headers, host, type, "transcode", myGeneration);
      return;
    }
    if (code !== 0 && !ready) {
      const drmHint = /drm|widevine|encrypted|decryption|decrypt|license/i.test(stderr);
      setStatus({
        state: "error",
        sourceHost: host,
        sourceType: type,
        mode,
        message: drmHint
          ? "هذا المصدر يبدو محميًا بتشفير/DRM غير متوافق مع PS4. اختر مصدرًا آخر داخل DramaLive."
          : "المصدر توقف قبل تجهيز البث. افتح القناة مرة ثانية أو جرّب مصدرًا آخر."
      });
    }
  });
  waitForReady(myGeneration, host, type, mode);
}

async function useResponse(response) {
  const url = response.url();
  const contentType = response.headers()["content-type"] || "";
  if (!candidate(url, contentType) || url === currentUrl) return;

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return;
  }
  if (!["http:", "https:"].includes(parsed.protocol)) return;

  currentUrl = url;
  const myGeneration = ++generation;
  stopFfmpeg();
  const headers = await response.request().allHeaders();
  const type = sourceType(url, contentType);
  console.log("Detected live media from", parsed.hostname, "(" + type + ").");
  spawnFfmpeg(url, headers, parsed.hostname, type, "copy", myGeneration);
}

const pageHtml = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ASEEL MATCH TV — PS4 Live</title>
<style>
html,body{margin:0;background:#07111f;color:#fff;font-family:Arial,Tahoma,sans-serif}main{max-width:1180px;margin:auto;padding:28px}.card{background:#101d2d;border:1px solid #26384d;border-radius:14px;padding:22px;margin-bottom:18px}h1{margin:0 0 8px;font-size:34px}p{font-size:20px;line-height:1.6}.meta{color:#b8c7d9}.btn{font-size:22px;padding:14px 24px;border:0;border-radius:10px;background:#fff;color:#07111f;font-weight:bold}video{width:100%;max-height:74vh;background:#000;border-radius:10px}#badge{display:inline-block;padding:7px 12px;border-radius:999px;background:#26384d;font-weight:bold}
</style>
</head>
<body><main>
<div class="card"><span id="badge">بانتظار القناة</span><h1>ASEEL MATCH TV — مشغل PS4</h1><p id="status">اختر القناة من نافذة DramaLive المفتوحة على الكمبيوتر.</p><p id="meta" class="meta"></p><button id="play" class="btn">تشغيل البث</button></div>
<div class="card"><video id="video" controls playsinline preload="none"></video></div>
</main>
<script>
(function(){var v=document.getElementById('video'),b=document.getElementById('play'),s=document.getElementById('status'),m=document.getElementById('meta'),g=document.getElementById('badge'),stamp='';function play(){v.src='/live.m3u8?t='+new Date().getTime();v.load();var p=v.play();if(p&&p.catch)p.catch(function(){});}function render(d){if(!d)return;g.innerHTML=d.state==='ready'?'جاهز':d.state==='error'?'خطأ':'جاري التجهيز';s.innerHTML=d.message||'';m.innerHTML=(d.sourceHost?'المصدر: '+d.sourceHost+' — ':'')+(d.mode==='copy'?'تمرير مباشر منخفض الحمل':d.mode==='transcode'?'تحويل توافق 720p':'');if(d.state==='ready'&&d.updatedAt!==stamp){stamp=d.updatedAt;play();}}function poll(){var x=new XMLHttpRequest();x.open('GET','/status?_='+new Date().getTime(),true);x.onreadystatechange=function(){if(x.readyState===4&&x.status===200){try{render(JSON.parse(x.responseText));}catch(e){}}};x.send();}b.onclick=play;b.focus();document.addEventListener('keydown',function(e){var k=e.keyCode||e.which;if(k===13||k===32)play();});poll();setInterval(poll,2000);})();
</script></body></html>`;

function safeStatus() {
  const allowed = {};
  for (const key of ["state", "message", "sourceHost", "sourceType", "mode", "updatedAt"])
    if (typeof status[key] === "string") allowed[key] = status[key];
  return allowed;
}

function send(res, code, type, body, cache = "no-store") {
  res.writeHead(code, {
    "Content-Type": type,
    "Cache-Control": cache,
    "X-Content-Type-Options": "nosniff"
  });
  res.end(body);
}

function serveHttp(req, res) {
  const pathname = new URL(req.url || "/", "http://local").pathname;
  if (pathname === "/" || pathname === "/dramalive")
    return send(res, 200, "text/html; charset=utf-8", pageHtml);
  if (pathname === "/status")
    return send(res, 200, "application/json; charset=utf-8", JSON.stringify(safeStatus()));
  if (pathname === "/live.m3u8") {
    const file = resolve(hlsDir, "live.m3u8");
    if (!existsSync(file)) return send(res, 404, "text/plain", "not ready");
    return send(
      res,
      200,
      "application/vnd.apple.mpegurl",
      readFileSync(file),
      "no-store, no-cache, must-revalidate"
    );
  }
  const match = pathname.match(/^\/(seg\d{5}\.ts)$/);
  if (match) {
    const file = resolve(hlsDir, match[1]);
    if (!existsSync(file)) return send(res, 404, "text/plain", "missing");
    if (statSync(file).size > 32 * 1024 * 1024)
      return send(res, 413, "text/plain", "segment too large");
    return send(res, 200, "video/mp2t", readFileSync(file));
  }
  if (pathname === "/favicon.ico") return send(res, 204, "image/x-icon", "");
  return send(res, 404, "text/plain; charset=utf-8", "not found");
}

function printUrls() {
  console.log("\n=== افتح أحد هذه الروابط من متصفح PS4 ===");
  for (const entries of Object.values(networkInterfaces())) {
    for (const item of entries || []) {
      if (item.family === "IPv4" && !item.internal)
        console.log("http://" + item.address + ":" + port + "/dramalive");
    }
  }
  console.log("==========================================\n");
}

async function launchBrowser() {
  const options = { headless: false, viewport: null };
  try {
    browser = await chromium.launchPersistentContext(profileDir, {
      ...options,
      channel: "chrome"
    });
  } catch {
    try {
      browser = await chromium.launchPersistentContext(profileDir, options);
    } catch {
      setStatus({
        state: "error",
        message: "تعذر تشغيل Chrome/Chromium. نفّذ npx playwright install chromium ثم أعد المحاولة."
      });
      throw new Error("Chrome/Chromium launch failed");
    }
  }

  function attach(page) {
    page.on("response", (response) => void useResponse(response));
  }
  browser.on("page", attach);
  for (const page of browser.pages()) attach(page);
  const page = browser.pages()[0] || (await browser.newPage());

  console.log("DramaLive opened. Select the channel you want to watch.");
  try {
    await page.goto(startUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  } catch {
    console.log("The page did not finish loading automatically; use the open Chrome window manually.");
  }
}

async function shutdown() {
  if (closing) return;
  closing = true;
  stopFfmpeg();
  try {
    if (browser) await browser.close();
  } catch (_) {}
  try {
    if (server) await new Promise((resolveClose) => server.close(resolveClose));
  } catch (_) {}
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    void shutdown().finally(() => process.exit(0));
  });
}

try {
  server = http.createServer(serveHttp);
  await new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(port, "0.0.0.0", resolveListen);
  });
  printUrls();
  await launchBrowser();
  await new Promise((resolveClose) => browser.once("close", resolveClose));
} catch (error) {
  console.error("PS4 DramaLive bridge failed:", error.message || error);
  process.exitCode = 1;
} finally {
  await shutdown();
}
