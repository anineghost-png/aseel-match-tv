(function () {
  var v = document.getElementById("test-video"),
    mode = "",
    hls = null,
    sent = false;
  function start(m) {
    if (!Aseel.get("deviceId")) {
      Aseel.text("video-result", "احفظ فحص القدرات أولًا");
      return;
    }
    mode = m;
    sent = false;
    if (hls) {
      hls.destroy();
      hls = null;
    }
    v.pause();
    v.removeAttribute("src");
    v.load();
    Aseel.text("video-result", "اختبار قيد التشغيل…");
    if (m === "native") {
      v.src = "/test-media/test.m3u8";
      go();
    } else if (
      window.MediaSource &&
      window.Promise &&
      window.Map &&
      window.Set &&
      Array.from &&
      Array.prototype.includes
    ) {
      var script = document.createElement("script");
      script.src = "/vendor/hls.light.min.js";
      script.onload = function () {
        if (!Hls.isSupported()) {
          Aseel.text("video-result", "MSE غير مدعوم");
          return;
        }
        hls = new Hls({ enableWorker: false });
        hls.loadSource("/test-media/test.m3u8");
        hls.attachMedia(v);
        hls.on(Hls.Events.MANIFEST_PARSED, go);
        hls.on(Hls.Events.ERROR, function (_, d) {
          if (d.fatal) Aseel.text("video-result", "فشل اختبار الفيديو");
        });
      };
      document.head.appendChild(script);
    } else Aseel.text("video-result", "متطلبات HLS.js غير متوفرة");
  }
  function go() {
    var p = v.play();
    if (p && p.catch)
      p.catch(function () {
        Aseel.text("video-result", "اضغط زر التشغيل داخل الفيديو");
      });
  }
  v.addEventListener("error", function () {
    Aseel.text(
      "video-result",
      "فشل الاختبار. تأكد من توليد ملف الفيديو ودعم الجهاز."
    );
  });
  v.addEventListener("timeupdate", function () {
    if (v.currentTime >= 3 && !sent) {
      sent = true;
      Aseel.request(
        "POST",
        "/api/devices/" + Aseel.get("deviceId") + "/verify",
        { mode: mode, seconds: v.currentTime },
        function (err) {
          Aseel.text(
            "video-result",
            err ||
              "نجح التشغيل في هذا المتصفح. قبول PS4 الكامل ما زال يحتاج الاختبارات الفعلية."
          );
        }
      );
    }
  });
  document.getElementById("test-native").onclick = function () {
    start("native");
  };
  document.getElementById("test-mse").onclick = function () {
    start("hlsjs");
  };
})();
