import { mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
mkdirSync("data/test-media", { recursive: true });
function run(args) {
  const r = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-loglevel", "error", "-y", ...args],
    { stdio: "inherit" }
  );
  if (r.error || r.status !== 0) {
    console.error(
      "Test media generation failed. Install FFmpeg and ensure ffmpeg is on PATH."
    );
    process.exit(1);
  }
}
run([
  "-f",
  "lavfi",
  "-i",
  "testsrc2=size=1280x720:rate=25",
  "-f",
  "lavfi",
  "-i",
  "sine=frequency=440:sample_rate=48000",
  "-t",
  "12",
  "-c:v",
  "libx264",
  "-preset",
  "fast",
  "-profile:v",
  "baseline",
  "-level",
  "3.1",
  "-pix_fmt",
  "yuv420p",
  "-b:v",
  "1500k",
  "-g",
  "100",
  "-c:a",
  "aac",
  "-b:a",
  "96k",
  "-movflags",
  "+faststart",
  "data/test-media/test.mp4"
]);
run([
  "-i",
  "data/test-media/test.mp4",
  "-c",
  "copy",
  "-hls_time",
  "4",
  "-hls_playlist_type",
  "vod",
  "-hls_segment_filename",
  "data/test-media/test%d.ts",
  "data/test-media/test.m3u8"
]);
console.log("Local legal test media ready: /compat");
