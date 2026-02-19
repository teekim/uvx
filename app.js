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

function yen(n){
  return new Intl.NumberFormat("ja-JP").format(Number(n || 0));
}

function bgPath(file){ return file ? `./events/${state.event}/assets/${file}` : ""; }

function toast(msg){
  const el = $("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1200);
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
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Config not found: ${path}`);
  return await res.json();
}

function setLangUI(){
  $("langEn")?.classList.toggle("active", state.lang === "en");
  $("langJp")?.classList.toggle("active", state.lang === "jp");
  $("langEn")?.setAttribute("aria-selected", state.lang === "en");
  $("langJp")?.setAttribute("aria-selected", state.lang === "jp");
}

function render(config){
  document.title = `${t(config.title) || "Event"} | ${config.brand || "Event"}`;
  $("brand").textContent = config.brand || "EVENT";

  // Top CTA scroll
  $("ctaTop").onclick = () => document.getElementById("tickets")?.scrollIntoView({ behavior:"smooth" });

  // Hero background: use your neon paint image by default if event doesn't provide one
  const heroBg = bgPath(config.sections?.heroBg || config.heroImage || "hero.jpg");

  const toText = state.to?.trim() || (state.lang === "jp" ? "ご招待客" : "Guest");
  const fromText = state.from?.trim() || (state.lang === "jp" ? "主催" : "Host");

  const tiers = config.tiers || [];
  const selectedTier = tiers.find(x => x.id === state.tier) || null;

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

  const lineup = (config.lineup || []).map(x => `
    <div class="item">
      <strong>${x.name}</strong>
      <span>${t(x.role)}</span>
    </div>
  `).join("");

  const schedule = (config.schedule || []).map(x => `
    <div class="item">
      <strong>${x.time}</strong>
      <span>${t(x.text)}</span>
    </div>
  `).join("");

  const gallery = (config.gallery?.images || []).map(img => {
    const src = bgPath(img);
    return `<img src="${src}" alt="gallery" loading="lazy">`;
  }).join("");

  const payMethods = (config.payments?.methods || []).map(m => `
    <div class="card">
      <div class="badge">${t(m.name || m.id)}</div>
      <div style="margin-top:10px;">
        <img src="${bgPath(m.qr)}" alt="QR" style="width:100%;max-width:320px;border-radius:18px;border:1px solid rgba(255,255,255,.10);background:#fff;">
      </div>
      <div class="small" style="margin-top:10px;">${t(m.note)}</div>
    </div>
  `).join("");

  const faq = (config.faq || []).map(f => `
    <div class="card">
      <h3 style="margin:0 0 6px;">${t(f.q)}</h3>
      <div class="small">${t(f.a)}</div>
    </div>
  `).join("");

  $("app").innerHTML = `
    <!-- HERO -->
    <section class="section hero">
      <div class="bg" style="background-image:url('${heroBg}')"></div>
      <div class="section-inner">
        <div class="hero-card">
          <div class="kicker">${t(config.subtitle)}</div>
          <h1>${t(config.title)}</h1>
          <div class="subhead">${t(config.description)}</div>

          <div class="meta">
            <div class="pill">📅 <span>${t(config.dateText)}</span></div>
            <div class="pill">📍 <span>${t(config.venueText)}</span></div>
            ${selectedTier ? `<div class="pill">🎟️ <span>${t(selectedTier.name)} • ¥${yen(selectedTier.priceYen)}</span></div>` : ``}
          </div>

          <div class="meta" style="margin-top:12px;">
            <div class="pill">TO: <span>${toText}</span></div>
            <div class="pill">FROM: <span>${fromText}</span></div>
            ${state.ref ? `<div class="pill">REF: <span>${state.ref}</span></div>` : ``}
          </div>

          <div class="cta-row">
            <button class="btn primary" id="ctaTickets">${state.lang === "jp" ? "チケットを見る" : "View Tickets"}</button>
            ${config.mapUrl ? `<a class="btn ghost" href="${config.mapUrl}" target="_blank" rel="noreferrer">${state.lang === "jp" ? "マップ" : "Map"}</a>` : ``}
            ${config.payments?.contactLine ? `<a class="btn ghost" href="${config.payments.contactLine}" target="_blank" rel="noreferrer">LINE</a>` : ``}
          </div>
        </div>
      </div>
    </section>

    <!-- TICKETS -->
    <section class="section" id="tickets">
      <div class="section-inner">
        <div style="display:flex;align-items:end;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <div>
            <div class="kicker">${state.lang === "jp" ? "チケット" : "Tickets"}</div>
            <h2 style="margin:8px 0 0;">${state.lang === "jp" ? "プランを選択" : "Choose your version"}</h2>
          </div>
          <button class="btn ghost" id="openInvite2">${state.lang === "jp" ? "招待リンク作成" : "Invite Builder"}</button>
        </div>

        <div class="grid" style="margin-top:16px;">
          ${tierCards}
        </div>
      </div>
    </section>

    <!-- LINEUP -->
    ${lineup ? `
    <section class="section">
      <div class="section-inner">
        <div class="kicker">${state.lang === "jp" ? "ラインナップ" : "Lineup"}</div>
        <h2 style="margin:8px 0 16px;">${state.lang === "jp" ? "出演者" : "Artists"}</h2>
        <div class="list">${lineup}</div>
      </div>
    </section>` : ``}

    <!-- SCHEDULE -->
    ${schedule ? `
    <section class="section">
      <div class="section-inner">
        <div class="kicker">${state.lang === "jp" ? "タイムテーブル" : "Schedule"}</div>
        <h2 style="margin:8px 0 16px;">${state.lang === "jp" ? "流れ" : "Flow"}</h2>
        <div class="list">${schedule}</div>
      </div>
    </section>` : ``}

    <!-- GALLERY -->
    ${gallery ? `
    <section class="section">
      <div class="section-inner">
        <div class="kicker">${t(config.gallery?.headline) || (state.lang === "jp" ? "ギャラリー" : "Gallery")}</div>
        <h2 style="margin:8px 0 16px;">${state.lang === "jp" ? "過去の雰囲気" : "Past vibe"}</h2>
        <div class="gallery">${gallery}</div>
      </div>
    </section>` : ``}

    <!-- PAYMENT -->
    <section class="section">
      <div class="section-inner">
        <div class="kicker">${t(config.payments?.headline) || (state.lang === "jp" ? "支払い" : "Payment")}</div>
        <h2 style="margin:8px 0 16px;">${state.lang === "jp" ? "お支払い方法" : "How to pay"}</h2>

        <div class="grid">${payMethods}</div>

        <div class="card" style="margin-top:14px;">
          <div class="small">${state.lang === "jp" ? "支払い後、スクショをLINEへ送ってください。" : "After payment, send a screenshot via LINE."}</div>
          ${config.payments?.contactLine ? `<div style="margin-top:12px;"><a class="btn primary" href="${config.payments.contactLine}" target="_blank" rel="noreferrer">${state.lang === "jp" ? "LINEで送る" : "Send on LINE"}</a></div>` : ``}
        </div>

        <div class="card" style="margin-top:14px;">
          <div class="kicker">${state.lang === "jp" ? "ポリシー" : "Policy"}</div>
          <div class="small" style="margin-top:8px;">${t(config.policy)}</div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    ${faq ? `
    <section class="section">
      <div class="section-inner">
        <div class="kicker">FAQ</div>
        <h2 style="margin:8px 0 16px;">${state.lang === "jp" ? "よくある質問" : "Questions"}</h2>
        <div class="grid">${faq}</div>
      </div>
    </section>` : ``}

    <!-- FOOTER -->
    <footer class="footer">
      <div class="section-inner">
        <div class="small">© ${new Date().getFullYear()} ${config.brand || "Event"}</div>
        <div class="small" style="margin-top:8px;">
          ${config.social?.instagram ? `<a href="${config.social.instagram}" target="_blank" rel="noreferrer">Instagram</a>` : ``}
          ${config.social?.website ? ` • <a href="${config.social.website}" target="_blank" rel="noreferrer">Website</a>` : ``}
        </div>
      </div>
    </footer>
  `;

  // Wire buttons after render
  $("ctaTickets").onclick = () => document.getElementById("tickets")?.scrollIntoView({ behavior:"smooth" });
  $("openInvite2")?.addEventListener("click", () => openInvite());

  // Tier select buttons
  document.querySelectorAll("[data-tier]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.tier = btn.getAttribute("data-tier") || "";
      // reflect selection + keep the link builder accurate
      render(config);
      openInvite();
    });
  });
}

function openInvite(){
  const o = $("inviteOverlay");
  o.classList.remove("hidden");
  o.setAttribute("aria-hidden","false");
}

function closeInvite(){
  const o = $("inviteOverlay");
  o.classList.add("hidden");
  o.setAttribute("aria-hidden","true");
}

function wireInvite(config){
  // Populate tier select
  const sel = $("tierSelect");
  sel.innerHTML = "";

  const tiers = config.tiers || [];
  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = state.lang === "jp" ? "チケット選択" : "Select ticket";
  sel.appendChild(opt0);

  tiers.forEach(tier => {
    const opt = document.createElement("option");
    opt.value = tier.id;
    opt.textContent = `${t(tier.name)} — ¥${yen(tier.priceYen)}`;
    sel.appendChild(opt);
  });

  if (state.tier) sel.value = state.tier;

  // Prefill inputs
  $("toName").value = state.to;
  $("fromName").value = state.from;

  // Music
  const audio = $("bgm");
  const musicFile = config.music?.file;
  const musicToggle = $("musicToggle");
  const playBtn = $("playBtn");

  if (musicFile) {
    audio.src = bgPath(musicFile);
    musicToggle.style.display = "block";
    playBtn.style.display = state.music ? "block" : "none";
  } else {
    musicToggle.style.display = "none";
    playBtn.style.display = "none";
  }

  // Handlers
  $("toName").addEventListener("input", (e) => state.to = e.target.value);
  $("fromName").addEventListener("input", (e) => state.from = e.target.value);
  sel.addEventListener("change", (e) => state.tier = e.target.value);

  $("copyLink").onclick = async () => {
    const link = buildShareLink();
    try{
      await navigator.clipboard.writeText(link);
      toast(state.lang === "jp" ? "コピーしました" : "Copied");
    }catch{
      window.prompt("Copy this link:", link);
    }
  };

  $("enterPage").onclick = () => closeInvite();
  $("closeInvite").onclick = () => closeInvite();
  $("openInvite").onclick = () => openInvite();

  $("musicToggle").onclick = () => {
    state.music = !state.music;
    if (!state.music) {
      audio.pause();
      $("playBtn").textContent = "Play Me";
    }
    playBtn.style.display = state.music ? "block" : "none";
  };

  $("playBtn").onclick = async () => {
    try{
      if (audio.paused) { await audio.play(); $("playBtn").textContent = state.lang === "jp" ? "停止" : "Pause"; }
      else { audio.pause(); $("playBtn").textContent = "Play Me"; }
    }catch{
      toast(state.lang === "jp" ? "再生できません" : "Unable to play");
    }
  };
}

function wireLanguage(config){
  $("langEn").onclick = () => { state.lang = "en"; setLangUI(); render(config); wireInvite(config); };
  $("langJp").onclick = () => { state.lang = "jp"; setLangUI(); render(config); wireInvite(config); };
}

(async function main(){
  try{
    const config = await loadConfig();
    setLangUI();
    render(config);
    wireInvite(config);
    wireLanguage(config);
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
