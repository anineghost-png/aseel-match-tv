(function (w, d) {
  "use strict";
  var DRAMA_URL = "https://web.dramalive.cc";
  var STORAGE = { fg:"dramaHubFg", favorites:"dramaHubFavorites", last:"dramaHubLastUse" };
  var categories = [
    {name:"رياضة",icon:"⚽",desc:"رياضة ومباريات"},
    {name:"أخبار",icon:"◉",desc:"قنوات إخبارية"},
    {name:"أفلام ومسلسلات",icon:"▣",desc:"ترفيه وأعمال درامية"},
    {name:"أطفال",icon:"★",desc:"محتوى العائلة"},
    {name:"وثائقي",icon:"◇",desc:"وثائقيات ومعرفة"},
    {name:"قنوات عربية",icon:"ع",desc:"قنوات عربية متنوعة"},
    {name:"قنوات أجنبية",icon:"A",desc:"قنوات دولية"},
    {name:"الكل",icon:"▦",desc:"افتح القائمة الكاملة"}
  ];
  var selectedSection = null, toastTimer = 0;
  function $(s){return d.querySelector(s);} function $$(s){return d.querySelectorAll(s);}
  function read(k,fallback){try{var v=w.localStorage.getItem(k);return v===null?fallback:v;}catch(_){return fallback;}}
  function write(k,v){try{w.localStorage.setItem(k,v);}catch(_){}}
  function parseFav(){try{return JSON.parse(read(STORAGE.favorites,"[]"))||[];}catch(_){return [];}}
  function saveFav(a){write(STORAGE.favorites,JSON.stringify(a));}
  function showToast(msg){var el=$("#toast");el.textContent=msg;el.className="toast show";clearTimeout(toastTimer);toastTimer=setTimeout(function(){el.className="toast";},2200);}
  function showView(id){
    var views=$$(".view"),nav=$$(".nav-item"),i;
    for(i=0;i<views.length;i++)views[i].className="view";
    var target=$("#"+id);if(!target)return;target.className="view active-view";
    for(i=0;i<nav.length;i++)nav[i].className="nav-item";
    var active=d.querySelector('.nav-item[data-view="'+id+'"]');if(active)active.className="nav-item active";
    if(id==="favorites")renderFavorites(); if(id==="settings")syncSettings();
    w.scrollTo(0,0); setTimeout(function(){if(w.Focus)w.Focus.first();},20);
  }
  function openDrama(){
    var now=new Date().getTime();write(STORAGE.last,String(now));updateLastUse();
    var fg=read(STORAGE.fg,"");
    if(fg)showToast("رمز FG محفوظ في هذه البوابة"); else showToast("يفتح Drama Live الآن");
    setTimeout(function(){w.location.href=DRAMA_URL;},160);
  }
  function openSection(name){
    var item=null,i;for(i=0;i<categories.length;i++)if(categories[i].name===name)item=categories[i];
    if(!item)return;selectedSection=item;
    $("#sectionTitle").textContent=item.name;$("#sectionIcon").textContent=item.icon;
    $("#sectionText").textContent="سنفتح Drama Live مباشرة. من داخله اختر قسم “"+item.name+"” من المصدر الموجود عندك.";
    updateModalFavorite();var modal=$("#sectionModal");modal.className="modal-backdrop open";modal.setAttribute("aria-hidden","false");if(w.Focus)w.Focus.trap(modal);
  }
  function closeModal(){var modal=$("#sectionModal");modal.className="modal-backdrop";modal.setAttribute("aria-hidden","true");if(w.Focus)w.Focus.release();}
  function updateModalFavorite(){var fav=parseFav(),on=fav.indexOf(selectedSection.name)>=0;$("#modalFavorite").textContent=on?"♥ إزالة من المفضلة":"♡ إضافة للمفضلة";}
  function toggleFavorite(name){var fav=parseFav(),i=fav.indexOf(name);if(i>=0){fav.splice(i,1);showToast("تمت الإزالة من المفضلة");}else{fav.push(name);showToast("تمت الإضافة للمفضلة");}saveFav(fav);renderCategories();renderFavorites();if(selectedSection)updateModalFavorite();}
  function card(item){
    var fav=parseFav(),on=fav.indexOf(item.name)>=0;var wrap=d.createElement("div");wrap.className="category-card";wrap.setAttribute("tabindex","0");wrap.setAttribute("role","button");wrap.setAttribute("data-section",item.name);
    wrap.innerHTML='<button class="favorite-toggle '+(on?'on':'')+'" data-favorite="'+item.name+'" aria-label="مفضلة">'+(on?'♥':'♡')+'</button><span class="big-icon">'+item.icon+'</span><strong>'+item.name+'</strong><small>'+item.desc+'</small>';
    return wrap;
  }
  function renderCategories(){var g=$("#categoryGrid");if(!g)return;g.innerHTML="";var i;for(i=0;i<categories.length;i++)g.appendChild(card(categories[i]));}
  function renderFavorites(){var g=$("#favoriteGrid"),empty=$("#emptyFavorites");if(!g)return;g.innerHTML="";var fav=parseFav(),i,j,item;if(!fav.length){empty.style.display="block";return;}empty.style.display="none";for(i=0;i<fav.length;i++){item=null;for(j=0;j<categories.length;j++)if(categories[j].name===fav[i])item=categories[j];if(item)g.appendChild(card(item));}}
  function syncSettings(){var fg=read(STORAGE.fg,"");$("#fgInput").value=fg;$("#fgStatus").textContent=fg?"محفوظ محليًا":"غير محفوظ";}
  function updateLastUse(){var raw=read(STORAGE.last,"");if(!raw){$("#lastUseLabel").textContent="لا يوجد نشاط بعد";return;}var then=parseInt(raw,10),mins=Math.floor((new Date().getTime()-then)/60000),text=mins<1?"الآن":mins<60?"قبل "+mins+" دقيقة":"تم استخدامه سابقًا";$("#lastUseLabel").textContent=text;$("#resumeText").textContent="آخر فتح: "+text;}
  function updateClock(){var n=new Date(),h=n.getHours(),m=n.getMinutes(),ap=h>=12?"م":"ص";h=h%12||12;$("#clock").textContent=(h<10?"0":"")+h+":"+(m<10?"0":"")+m+" "+ap;}
  function detectDevice(){var ua=navigator.userAgent||"",label=/PlayStation 4/i.test(ua)?"PS4 جاهز":"متصفح";$("#deviceBadge").textContent=label;}
  function bind(){
    d.addEventListener("click",function(e){
      var t=e.target;while(t&&t!==d&&!t.getAttribute("data-view")&&!t.getAttribute("data-open-drama")&&!t.getAttribute("data-section")&&!t.getAttribute("data-favorite")&&!t.getAttribute("data-close-modal"))t=t.parentNode;
      if(!t||t===d)return;
      if(t.getAttribute("data-favorite")){e.stopPropagation();toggleFavorite(t.getAttribute("data-favorite"));return;}
      if(t.getAttribute("data-close-modal")){closeModal();return;}
      if(t.getAttribute("data-open-drama")){openDrama();return;}
      if(t.getAttribute("data-section")){openSection(t.getAttribute("data-section"));return;}
      if(t.getAttribute("data-view")){showView(t.getAttribute("data-view"));return;}
    });
    $("#saveFg").onclick=function(){var v=$("#fgInput").value.replace(/^\s+|\s+$/g,"");if(!v){showToast("أدخل الرمز أولًا");return;}write(STORAGE.fg,v);syncSettings();showToast("تم الحفظ على هذا المتصفح");};
    $("#clearFg").onclick=function(){write(STORAGE.fg,"");syncSettings();showToast("تم مسح الرمز");};
    $("#modalOpenDrama").onclick=function(){closeModal();openDrama();};
    $("#modalFavorite").onclick=function(){if(selectedSection)toggleFavorite(selectedSection.name);};
    $("#focusTest").onclick=function(){showToast("استخدم الأسهم أو D-pad ثم X للاختيار");};
    $("#resetApp").onclick=function(){try{w.localStorage.removeItem(STORAGE.fg);w.localStorage.removeItem(STORAGE.favorites);w.localStorage.removeItem(STORAGE.last);}catch(_){}renderCategories();renderFavorites();syncSettings();updateLastUse();showToast("تمت إعادة الضبط");};
    w.addEventListener("dramaback",closeModal);
    d.addEventListener("keydown",function(e){if((e.keyCode===13||e.keyCode===32)&&e.target&&e.target.className&&String(e.target.className).indexOf("category-card")>=0){e.preventDefault();openSection(e.target.getAttribute("data-section"));}});
  }
  function init(){renderCategories();renderFavorites();syncSettings();updateLastUse();updateClock();detectDevice();bind();setInterval(updateClock,30000);setTimeout(function(){if(w.Focus)w.Focus.first();},50);}
  w.DramaHub={showView:showView,openDrama:openDrama};
  if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",init);else init();
})(window,document);
