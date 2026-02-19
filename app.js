const qs = new URLSearchParams(window.location.search);

const state = {
  event: qs.get("event") || "uvx-mar-2026",
  lang: (qs.get("lang") || "en").toLowerCase() === "jp" ? "jp" : "en",
  to: qs.get("to") || "",
  from: qs.get("from") || "",
  tier: qs.get("tier") || "",
  ref: qs.get("ref") || "",
  music: qs.get("music") === "1"
};

const $ = (id) => document.getElementById(id);

function t(obj){
  if (obj == null) return "";
  if (typeof obj === "string") return obj;
  return obj[state.lang] ?? obj.en ?? "";
}
function yen(n){ return new Intl.NumberFormat("ja-JP").format(Number(n || 0)); }
function bgPath(file){ return file ? `./events/${state.event}/assets/${file}` : ""; }

function toast(msg){
  const el = $("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1200);
}

function getRef(){
  const urlRef = qs.get("ref");
  const saved = localStorage.getItem("uvx_ref");
  const ref = urlRef || saved || "";
  if (ref) localStorage.setItem("uvx_ref", ref);
  return ref;
}

function withRef(url){
  if (!url) return "";
  const ref = state.ref || getRef();
  if (!ref) return url;
  try{
    const u = new URL(url);
    if (!u.searchParams.get("ref")) u.searchParams.set("ref", ref);
    return u.toString();
  }catch{
    return url;
  }
}

function track(name, data = {}){
  const payload = { event: state.event, lang: state.lang, ref: state.ref || getRef(), tier: state.tier || "", ...data };
  if (typeof window.gtag === "function") window.gtag("event", name, payload);
  try{
    const key = "uvx_tracking_log";
    const arr = JSON.parse(localStorage.getItem(key) || "[]");
    arr.push({ ts: Date.now(), name, ...payload });
    localStorage.setItem(key, JSON.stringify(arr.slice(-300)));
  }catch{}
}

function buildShareLink(){
  const u = new URL(window.location.href);
  u.searchParams.set("event", state.event);
  u.searchParams.set("lang", state.lang);
  if (state.to) u.searchParams.set("to", state.to); else u.searchParams.delete("to");
  if (state.from) u.searchParams.set("from", state.from); else u.searchParams.delete("from");
  if (state.tier) u.searchParams.set("tier", state.tier); else u.searchParams.delete("tier");
  if (state.ref) u.searchParams.set("ref", state.ref); else u.searchParams.delete("ref");
  if (state.music) u.searchParams.set("music", "1"); else u.searchParams.delete("music");
  return u.toString();
}

async function loadConfig(){
  const path = `./events/${state.event}/config.json`;
  const res = await fetch(path, { cache:"no-store" });
  if (!res.ok) throw new Error(`Config not found: ${path}`);
  return await res.json();
}

function setLangUI(){
  $("langEn")?.classList.toggle("active", state.lang === "en");
  $("langJp")?.classList.toggle("active", state.lang === "jp");
  $("langEn")?.setAttribute("aria-selected", state.lang === "en");
  $("langJp")?.setAttribute("aria-selected", state.lang === "jp");
}

function openInvite(){
  $("inviteOverlay").classList.remove("hidden");
  $("inviteOverlay").setAttribute("aria-hidden","false");
}
function closeInvite(){
  $("inviteOverlay").classList.add("hidden");
  $("inviteOverlay").setAttribute("aria-hidden","true");
}

function wireInvite(config){
  // populate tiers
  const sel = $("tierSelect");
  sel.innerHTML = "";
  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = state.lang === "jp" ? "チケット選択" : "Select ticket";
  sel.appendChild(opt0);

  (config.tiers || []).forEach(tier => {
    const opt = document.createElement("option");
    opt.value = tier.id;
    opt.textContent = `${t(tier.name)} — ¥${yen(tier.priceYen)}`;
    sel.appendChild(opt);
  });
  if (state.tier) sel.value = state.tier;

  $("toName").value = state.to;
  $("fromName").value = state.from;

  $("toName").oninput = (e) => state.to = e.target.value;
  $("fromName").oninput = (e) => state.from = e.target.value;
  sel.onchange = (e) => state.tier = e.target.value;

  $("copyLink").onclick = async () => {
    track("copy_link");
    const link = buildShareLink();
    try{ await navigator.clipboard.writeText(link); toast(state.lang === "jp" ? "コピーしました" : "Copied"); }
    catch{ window.prompt("Copy this link:", link); }
  };

  $("enterPage").onclick = () => closeInvite();
  $("closeInvite").onclick = () => closeInvite();
  $("openInvite").onclick = () => openInvite();

  // music
  const audio = $("bgm");
  const musicFile = config.music?.file;
  if (musicFile) {
    audio.src = bgPath(musicFile);
    $("musicToggle").style.display = "block";
    $("playBtn").style.display = state.music ? "block" : "none";
  } else {
    $("musicToggle").style.display = "none";
    $("playBtn").style.display = "none";
  }

  $("musicToggle").onclick = () => {
    state.music = !state.music;
    track("toggle_music", { on: state.music ? 1 : 0 });
    if (!state.music) { audio.pause(); $("playBtn").textContent = "Play Me"; }
    $("playBtn").style.display = state.music ? "block" : "none";
  };

  $("playBtn").onclick = async () => {
    try{
      if (audio.paused) { await audio.play(); $("playBtn").textContent = state.lang === "jp" ? "停止" : "Pause"; track("music_play"); }
      else { audio.pause(); $("playBtn").textContent = "Play Me"; track("music_pause"); }
    }catch{ toast(state.lang === "jp" ? "再生できません" : "Unable to play"); }
  };
}

function render(config){
  document.title = `${t(config.title) || "Event"} | ${config.brand || "Event"}`;
  $("brand").textContent = config.brand || "EVENT";

  const heroBg = bgPath(config.sections?.heroBg || config.heroImage || "hero.jpg");
  const ticketUrl = withRef(config.links?.tickets || "");
  const merchUrl  = withRef(config.links?.merch || "");
  const lineUrl   = withRef(config.links?.line || "");
  const igUrl     = withRef(config.links?.instagram || "");

  const toText = state.to?.trim() || (state.lang === "jp" ? "ご招待客" : "Guest");
  const fromText = state.from?.trim() || (state.lang === "jp" ? "主催" : "Host");

  const tiers = config.tiers || [];
  const tierCards = tiers.map(tier => `
    <div class="card">
      <div class="badge">${t(tier.name)}</div>
      <h3 style="margin:10px 0 6px;">¥${yen(tier.priceYen)}</h3>
      <div class="small">${t(tier.includes)}</div>
      <div style="margin-top:12px;">
        <button class="btn primary" data-tier="${tier.id}">${state.lang === "jp" ? "選択" : "Select"}</button>
      </div>
    </div>
  `).join("");

  const vipSteps = (config.vipFlow?.steps || []).map(s => `
    <div class="card">
      <div class="badge">${t(s.title)}</div>
      <div class="small" style="margin-top:10px;">${t(s.text)}</div>
    </div>
  `).join("");

  const photos = (config.media?.photos?.images || []).map(img => `
    <img src="${bgPath(img)}" alt="photo" loading="lazy">
  `).join("");

  const videos = (config.media?.videos?.items || []).map(v => `
    <div class="card">
      <div class="badge">${t(v.title) || "Video"}</div>
      <div style="margin-top:10px;">
        <a class="btn ghost" data-video="1" href="${withRef(v.url)}" target="_blank" rel="noreferrer">
          ${state.lang === "jp" ? "見る" : "Watch"}
        </a>
      </div>
    </div>
  `).join("");

  $("app").innerHTML = `
    <section class="section hero">
      <div class="bg" style="background-image:url('${heroBg}')"></div>
      <div class="section-inner">
        <div class="hero-card">
          <div class="kicker">${t(config.subtitle)}</div>
          <h1>${t(config.title)}</h1>
          <div class="subhead">${t(config.description || "")}</div>

          <div class="meta">
            <div class="pill">📅 <span>${t(config.dateText)}</span></div>
            <div class="pill">📍 <span>${t(config.venueText)}</span></div>
            ${state.ref ? `<div class="pill">REF: <span>${state.ref}</span></div>` : ``}
          </div>

          <div class="meta" style="margin-top:12px;">
            <div class="pill">TO: <span>${toText}</span></div>
            <div class="pill">FROM: <span>${fromText}</span></div>
          </div>

          <div class="meta" style="margin-top:16px; gap:10px;">
            ${ticketUrl ? `<a class="btn primary" id="buyTickets" href="${ticketUrl}" target="_blank" rel="noreferrer">${state.lang === "jp" ? "Lumaで購入" : "Buy on Luma"}</a>` : ``}
            ${merchUrl ? `<a class="btn ghost" id="buyMerch" href="${merchUrl}" target="_blank" rel="noreferrer">${state.lang === "jp" ? "Merch" : "Merch Drop"}</a>` : ``}
            ${lineUrl ? `<a class="btn ghost" id="contactLine" href="${lineUrl}" target="_blank" rel="noreferrer">LINE</a>` : ``}
            ${igUrl ? `<a class="btn ghost" id="openIG" href="${igUrl}" target="_blank" rel="noreferrer">IG</a>` : ``}
            <button class="btn ghost" id="openInvite2">${state.lang === "jp" ? "招待リンク作成" : "Invite Builder"}</button>
          </div>
        </div>
      </div>
    </section>

    <section class="section" id="tickets">
      <div class="section-inner">
        <div class="kicker">${state.lang === "jp" ? "チケット" : "Tickets"}</div>
        <h2>${state.lang === "jp" ? "プランを選択" : "Choose your version"}</h2>
        <div class="grid">${tierCards}</div>
      </div>
    </section>

    ${vipSteps ? `
    <section class="section">
      <div class="section-inner">
        <div class="kicker">${t(config.vipFlow?.headline) || (state.lang === "jp" ? "VIP導線" : "VIP Flow")}</div>
        <h2>${state.lang === "jp" ? "支払い後の流れ" : "After payment"}</h2>
        <div class="grid">${vipSteps}</div>
      </div>
    </section>` : ``}

    ${photos ? `
    <section class="section">
      <div class="section-inner">
        <div class="kicker">${t(config.media?.photos?.headline) || "Photos"}</div>
        <h2>${state.lang === "jp" ? "雰囲気" : "Vibe"}</h2>
        <div class="gallery">${photos}</div>
      </div>
    </section>` : ``}

    ${videos ? `
    <section class="section">
      <div class="section-inner">
        <div class="kicker">${t(config.media?.videos?.headline) || "Videos"}</div>
        <h2>${state.lang === "jp" ? "動画" : "Clips"}</h2>
        <div class="grid">${videos}</div>
      </div>
    </section>` : ``}

    <footer class="footer">
      <div class="section-inner">
        <div class="small">© ${new Date().getFullYear()} ${config.brand || "Event"}</div>
      </div>
    </footer>
  `;

  // wire tracking
  document.getElementById("buyTickets")?.addEventListener("click", () => track("click_buy_luma"));
  document.getElementById("buyMerch")?.addEventListener("click", () => track("click_merch"));
  document.getElementById("contactLine")?.addEventListener("click", () => track("click_line"));
  document.getElementById("openIG")?.addEventListener("click", () => track("click_instagram"));
  document.getElementById("openInvite2")?.addEventListener("click", () => openInvite());

  document.querySelectorAll("[data-tier]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.tier = btn.getAttribute("data-tier") || "";
      track("select_tier", { tier: state.tier });
      openInvite();
      wireInvite(config);
    });
  });

  document.querySelectorAll("[data-video='1']").forEach(a => {
    a.addEventListener("click", () => track("click_video"));
  });

  $("ctaTop").onclick = () => {
    track("click_top_cta");
    if (ticketUrl) window.open(ticketUrl, "_blank", "noreferrer");
    else document.getElementById("tickets")?.scrollIntoView({ behavior:"smooth" });
  };
}

(async function main(){
  try{
    state.ref = getRef();
    const config = await loadConfig();
    setLangUI();
    render(config);
    wireInvite(config);

    $("langEn").onclick = () => { state.lang = "en"; setLangUI(); render(config); wireInvite(config); };
    $("langJp").onclick = () => { state.lang = "jp"; setLangUI(); render(config); wireInvite(config); };
  }catch(e){
    $("app").innerHTML = `
      <section class="section">
        <div class="section-inner">
          <div class="card">
            <div class="kicker">Error</div>
            <div class="small" style="margin-top:8px;">${String(e.message || e)}</div>
          </div>
        </div>
      </section>
    `;
  }
})();
