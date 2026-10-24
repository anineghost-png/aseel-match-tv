(function (w) {
  "use strict";
  var scope = null, previous = null, lastPad = 0, selectHeld = false, backHeld = false;
  function nodes() {
    var list = (scope || document).querySelectorAll("button:not([disabled]),a[href],input,select,textarea");
    var out = [], i;
    for (i = 0; i < list.length; i++) if (list[i].offsetWidth && list[i].offsetHeight) out.push(list[i]);
    return out;
  }
  function move(key) {
    var list = nodes(), cur = document.activeElement;
    if (!cur || !cur.getBoundingClientRect || list.indexOf(cur) < 0) { if (list.length) list[0].focus(); return; }
    var r = cur.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var best = null, score = Infinity, i, t, dx, dy, s;
    for (i = 0; i < list.length; i++) {
      if (list[i] === cur) continue;
      t = list[i].getBoundingClientRect(); dx = t.left + t.width / 2 - cx; dy = t.top + t.height / 2 - cy;
      if ((key === 37 && dx < -2) || (key === 39 && dx > 2) || (key === 38 && dy < -2) || (key === 40 && dy > 2)) {
        s = (key === 37 || key === 39) ? Math.abs(dx) + Math.abs(dy) * 2.7 : Math.abs(dy) + Math.abs(dx) * 2.7;
        if (s < score) { score = s; best = list[i]; }
      }
    }
    if (best) { best.focus(); try { best.scrollIntoView({block:"nearest",inline:"nearest"}); } catch (_) {} }
  }
  function back() {
    if (scope) {
      var ev = document.createEvent("Event"); ev.initEvent("dramaback", true, true); w.dispatchEvent(ev); return true;
    }
    var activeView = document.querySelector(".active-view");
    if (activeView && activeView.id !== "home") { if (w.DramaHub && w.DramaHub.showView) w.DramaHub.showView("home"); return true; }
    return false;
  }
  document.addEventListener("keydown", function (e) {
    var k = e.keyCode;
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) { if (k === 27) e.target.blur(); return; }
    if (k >= 37 && k <= 40) { e.preventDefault(); move(k); }
    if (k === 27 || k === 8) { if (back()) e.preventDefault(); }
  });
  w.Focus = {
    trap:function(el){ previous=document.activeElement; scope=el; var a=nodes(); if(a.length)a[0].focus(); },
    release:function(){ scope=null; if(previous&&document.documentElement.contains(previous))previous.focus(); },
    move:move,
    first:function(){ var a=nodes(); if(a.length)a[0].focus(); }
  };
  if (navigator.getGamepads) setInterval(function(){
    var pads=navigator.getGamepads(),p=pads&&pads[0],now=Date.now(),i,keys={12:38,13:40,14:37,15:39};
    if(!p){selectHeld=false;backHeld=false;return;}
    var select=!!(p.buttons[0]&&p.buttons[0].pressed),goBack=!!(p.buttons[1]&&p.buttons[1].pressed);
    if(select&&!selectHeld&&document.activeElement)document.activeElement.click();
    if(goBack&&!backHeld)back(); selectHeld=select; backHeld=goBack;
    if(now-lastPad<210)return;
    for(i=12;i<16;i++)if(p.buttons[i]&&p.buttons[i].pressed){move(keys[i]);lastPad=now;return;}
  },100);
})(window);
