(function () {
  "use strict";
  var fixtures = {},
    selected = null,
    modal = document.getElementById("modal");
  var sections = [
    ["live", "مباشر الآن"],
    ["barca", "برشلونة"],
    ["today", "مباريات اليوم"],
    ["liga", "الدوري الإسباني"],
    ["champions", "دوري أبطال أوروبا"],
    ["europe", "الدوريات الخمس"]
  ];

  function firstLetter(name) {
    var clean = String(name || "?").replace(/^\s+|\s+$/g, "");
    return clean ? clean.charAt(0).toUpperCase() : "?";
  }

  function statusLabel(f) {
    if (f.status === "LIVE") return "مباشر";
    if (f.status === "FINISHED" || f.status === "FT") return "انتهت";
    if (f.status === "PAUSED" || f.status === "HT") return "استراحة";
    return "قريبًا";
  }

  function scoreLabel(f) {
    return f.scoreHome === null ? "VS" : f.scoreHome + " — " + f.scoreAway;
  }

  function close() {
    modal.hidden = true;
    AseelPlayer.stop();
    Focus.release();
  }

  document.getElementById("close").onclick = close;
  window.addEventListener("aseelback", close);

  function open(id) {
    var f = fixtures[id];
    if (!f) return;
    selected = id;
    Aseel.text("match-title", f.home + " × " + f.away);
    Aseel.text("match-league", f.competition);
    Aseel.text(
      "match-score",
      f.scoreHome === null ? "لم تبدأ المباراة" : f.scoreHome + " — " + f.scoreAway
    );
    Aseel.text("match-time", Aseel.baghdad(f.kickoffUtc) + " · بتوقيت بغداد");
    Aseel.text(
      "match-freshness",
      (f.delayed ? "النتائج متأخرة من مزود البيانات · " : "") +
        "آخر تحديث: " +
        (f.lastUpdatedAt ? Aseel.baghdad(f.lastUpdatedAt) : "غير متاح")
    );
    Aseel.text(
      "play-status",
      "سيختار ASEEL أفضل مصدر مصرح ومؤكد عند الضغط على شاهد الآن"
    );
    modal.hidden = false;
    Focus.trap(modal);
  }

  function makeSpan(className) {
    var span = document.createElement("span");
    if (className) span.className = className;
    return span;
  }

  function ensureRow(id, title) {
    var row = document.getElementById(id), head, h2, count, box;
    if (row) return row;
    row = document.createElement("section");
    row.id = id;
    row.className = "row";
    head = document.createElement("div");
    head.className = "row-head";
    h2 = document.createElement("h2");
    h2.textContent = title;
    count = makeSpan("row-count");
    count.textContent = "0 مباراة";
    head.appendChild(h2);
    head.appendChild(count);
    box = document.createElement("div");
    box.className = "cards";
    row.appendChild(head);
    row.appendChild(box);
    document.getElementById("rows").appendChild(row);
    return row;
  }

  function ensureCard(box, cid, fixtureId) {
    var card = document.getElementById(cid), top, teams, home, away, bottom;
    if (card) return card;
    card = document.createElement("button");
    card.id = cid;
    card.className = "card";
    card.setAttribute("data-fixture", fixtureId);
    card.onclick = function () {
      open(this.getAttribute("data-fixture"));
    };

    top = document.createElement("div");
    top.className = "card-top";
    top.appendChild(makeSpan("card-meta"));
    top.appendChild(makeSpan("state"));

    teams = document.createElement("div");
    teams.className = "teams";
    home = document.createElement("div");
    home.className = "team-line home";
    home.appendChild(makeSpan("mini-crest"));
    home.appendChild(makeSpan("team-name"));
    away = document.createElement("div");
    away.className = "team-line away";
    away.appendChild(makeSpan("mini-crest"));
    away.appendChild(makeSpan("team-name"));
    teams.appendChild(home);
    teams.appendChild(makeSpan("card-score"));
    teams.appendChild(away);

    bottom = document.createElement("div");
    bottom.className = "card-bottom";
    bottom.appendChild(makeSpan("ready"));
    bottom.appendChild(makeSpan("card-action"));

    card.appendChild(top);
    card.appendChild(teams);
    card.appendChild(bottom);
    box.appendChild(card);
    return card;
  }

  function updateCard(card, f, demo) {
    var top = card.children[0], teams = card.children[1], bottom = card.children[2];
    top.children[0].textContent = f.competition + " · " + Aseel.baghdad(f.kickoffUtc);
    top.children[1].textContent = statusLabel(f);
    top.children[1].className = f.status === "LIVE" ? "state live" : "state";

    teams.children[0].children[0].textContent = firstLetter(f.home);
    teams.children[0].children[1].textContent = f.home;
    teams.children[1].textContent = scoreLabel(f);
    teams.children[2].children[0].textContent = firstLetter(f.away);
    teams.children[2].children[1].textContent = f.away;

    bottom.children[0].textContent = demo ? "بيانات عرض" : "مصدر يُحدد عند التشغيل";
    bottom.children[1].textContent = "فتح المباراة ←";
  }

  function fitsSection(id, f) {
    if (id === "live" && f.status !== "LIVE") return false;
    if (id === "barca" && !f.favorite) return false;
    if (id === "liga" && f.competitionId !== "PD") return false;
    if (id === "champions" && f.competitionId !== "CL") return false;
    if (id === "europe" && f.competitionId === "CL") return false;
    return true;
  }

  function updateHero(f) {
    var hero = document.getElementById("hero-open");
    if (!f) {
      hero.hidden = true;
      return;
    }
    Aseel.text("hero-title", f.home + " × " + f.away);
    Aseel.text(
      "hero-detail",
      f.competition + " · " + Aseel.baghdad(f.kickoffUtc) + " بتوقيت بغداد"
    );
    Aseel.text("hero-home", f.home);
    Aseel.text("hero-away", f.away);
    Aseel.text("hero-home-crest", firstLetter(f.home));
    Aseel.text("hero-away-crest", firstLetter(f.away));
    Aseel.text("hero-score", scoreLabel(f));
    Aseel.text("hero-kickoff", Aseel.baghdad(f.kickoffUtc));
    Aseel.text("hero-competition", f.competition);
    Aseel.text("hero-status", f.status === "LIVE" ? "مباشر الآن" : "المباراة الأبرز");
    hero.hidden = false;
    hero.setAttribute("data-fixture", f.id);
    hero.onclick = function () {
      open(this.getAttribute("data-fixture"));
    };
  }

  function render(data) {
    var fs = data.fixtures || [],
      i,
      j,
      f,
      row,
      box,
      card,
      id,
      cid,
      visible = {},
      count,
      liveCount = 0,
      favorite = null;

    fixtures = {};
    document.getElementById("demo").hidden = !data.demo;
    Aseel.text(
      "network",
      data.stale ? "بيانات محفوظة · التحديث متأخر" : "متصل"
    );
    Aseel.text(
      "empty",
      fs.length ? "" : "لا توجد بيانات مباريات بعد. أضف مزودًا من لوحة الإدارة."
    );

    for (j = 0; j < fs.length; j++) {
      fixtures[fs[j].id] = fs[j];
      if (fs[j].status === "LIVE") liveCount++;
      if (!favorite && fs[j].favorite) favorite = fs[j];
    }
    if (!favorite && fs.length) favorite = fs[0];

    Aseel.text("stat-live", String(liveCount));
    Aseel.text("stat-today", String(fs.length));
    Aseel.text(
      "stat-favorite",
      favorite ? (favorite.status === "LIVE" ? "LIVE" : Aseel.baghdad(favorite.kickoffUtc)) : "—"
    );
    updateHero(favorite);

    for (i = 0; i < sections.length; i++) {
      id = sections[i][0];
      row = ensureRow(id, sections[i][1]);
      box = row.querySelector(".cards");
      count = 0;
      for (j = 0; j < fs.length; j++) {
        f = fs[j];
        if (!fitsSection(id, f)) continue;
        cid = id + "-" + f.id;
        visible[cid] = true;
        count++;
        card = ensureCard(box, cid, f.id);
        card.hidden = false;
        updateCard(card, f, data.demo);
      }
      row.querySelector(".row-count").textContent = count + (count === 1 ? " مباراة" : " مباريات");
      row.hidden = count === 0;
    }

    var cards = document.querySelectorAll(".card");
    for (i = 0; i < cards.length; i++)
      if (!visible[cards[i].id] && cards[i] !== document.activeElement)
        cards[i].parentNode.removeChild(cards[i]);

    if (selected && !modal.hidden && fixtures[selected]) {
      var active = fixtures[selected];
      Aseel.text(
        "match-score",
        active.scoreHome === null
          ? "لم تبدأ المباراة"
          : active.scoreHome + " — " + active.scoreAway
      );
    }
  }

  function refresh() {
    Aseel.request("GET", "/api/fixtures", null, function (err, data) {
      if (err) {
        Aseel.text("network", "تعذر التحديث · نحتفظ بالبيانات");
        if (!document.querySelector(".card"))
          Aseel.text(
            "empty",
            "تعذر تحميل المباريات. تأكد من اتصال الخادم ثم حدّث الصفحة."
          );
        return;
      }
      render(data);
    });
  }

  document.getElementById("watch").onclick = function () {
    if (window.AseelPlayer.loadMatch) window.AseelPlayer.loadMatch(selected);
    else Aseel.text("play-status", "التشغيل لم يُجهّز بعد");
  };

  refresh();
  setInterval(refresh, 120000);

  function clock() {
    Aseel.text("clock", Aseel.baghdad(new Date().toISOString()));
  }
  clock();
  setInterval(clock, 30000);
})();
