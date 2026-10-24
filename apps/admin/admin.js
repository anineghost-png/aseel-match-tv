(function () {
  "use strict";
  var token = "",
    snapshot = {};
  function status(s) {
    document.getElementById("status").textContent = s;
  }
  function call(path, data, cb) {
    var x = new XMLHttpRequest();
    x.open(data ? "POST" : "GET", "/api/admin/" + path);
    x.setRequestHeader("Authorization", "Bearer " + token);
    if (data) x.setRequestHeader("Content-Type", "application/json");
    x.onload = function () {
      var result;
      try {
        result = JSON.parse(x.responseText);
      } catch (e) {
        result = {};
      }
      if (x.status >= 400) {
        var message = result.error || x.status;
        if (message === "FG_REQUIRES_RESOLUTION")
          message = "تم التعرف على FG، ويحتاج رابط المصدر الفعلي من مشاركة Drama Live قبل الاستيراد";
        status("تعذرت العملية: " + message);
        return;
      }
      cb(result);
    };
    x.onerror = function () {
      status("تعذر الاتصال");
    };
    x.send(data ? JSON.stringify(data) : null);
  }
  function refresh() {
    call("diagnostics", null, function (r) {
      snapshot = r;
      var sources = document.getElementById("sources");
      sources.textContent = "";
      (r.sources || []).forEach(function (s) {
        var b = document.createElement("button");
        b.textContent = "فحص المصدر " + s.id.slice(0, 8);
        b.onclick = function () {
          call("probe/" + s.id, {}, refresh);
        };
        sources.appendChild(b);
      });
      document.getElementById("diagnostics").textContent = JSON.stringify(
        r,
        null,
        2
      );
      var list = document.getElementById("mappings");
      list.textContent = "";
      (r.mappings || []).forEach(function (m) {
        var p = document.createElement("p"),
          a = document.createElement("button"),
          b = document.createElement("button");
        p.textContent =
          m.fixtureId +
          " · " +
          m.confidence +
          "% · " +
          m.status +
          " · " +
          m.reasons.join(", ");
        a.textContent = "تأكيد يدوي";
        b.textContent = "رفض";
        a.onclick = function () {
          review(m, true);
        };
        b.onclick = function () {
          review(m, false);
        };
        p.appendChild(a);
        p.appendChild(b);
        list.appendChild(p);
      });
      status("تم تحديث التشخيص");
    });
  }
  function review(m, confirm) {
    call(
      "review",
      { fixtureId: m.fixtureId, channelId: m.channelId, confirm: confirm },
      refresh
    );
  }
  function drama(action) {
    var result = document.getElementById("drama-result"),
      text = document.getElementById("drama-content").value,
      data = {
        providerId: document.getElementById("drama-provider").value,
        authorized: document.getElementById("drama-authorized").checked,
        text: text
      };
    if (!text) {
      result.textContent = "الصق نص المصدر من Drama Live أولاً";
      return;
    }
    call("providers/drama" + (action === "preview" ? "/preview" : ""), data, function (r) {
      if (action === "preview") {
        result.textContent = r.readyToImport
          ? "تم التعرف على المصدر: " + r.kind + " · المضيف: " + r.host + " · جاهز للربط"
          : "تم التعرف على FG · نحتاج مشاركة المصدر الفعلي من Drama Live لإكمال الربط";
        return;
      }
      result.textContent =
        "تم الربط: " +
        r.kind +
        " · " +
        r.channels +
        " قناة · " +
        r.sources +
        " مصدر";
      document.getElementById("drama-content").value = "";
      refresh();
    });
  }
  document.getElementById("connect").onclick = function () {
    token = document.getElementById("token").value;
    document.getElementById("token").value = "";
    refresh();
  };
  document.getElementById("refresh").onclick = refresh;
  document.getElementById("map").onclick = function () {
    call("map", {}, refresh);
  };
  document.getElementById("drama-preview").onclick = function () {
    drama("preview");
  };
  document.getElementById("drama-import").onclick = function () {
    drama("import");
  };
  document.getElementById("import").onclick = function () {
    var data = {
      providerId: document.getElementById("provider").value,
      authorized: document.getElementById("authorized").checked
    };
    var url = document.getElementById("url").value;
    if (url) data.url = url;
    else data.text = document.getElementById("content").value;
    call("import/" + document.getElementById("kind").value, data, function () {
      document.getElementById("content").value = "";
      document.getElementById("url").value = "";
      refresh();
    });
  };
  document.getElementById("file").onchange = function () {
    var f = this.files[0];
    if (!f) return;
    if (f.size > 1900000) {
      status("حجم الملف يتجاوز حد الاستيراد");
      return;
    }
    var r = new FileReader();
    r.onload = function () {
      document.getElementById("content").value = r.result;
    };
    r.readAsText(f);
  };
  document.getElementById("export").onclick = function () {
    var blob = new Blob([JSON.stringify(snapshot, null, 2)], {
        type: "application/json"
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "aseel-diagnostics.json";
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  };
})();
