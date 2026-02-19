const BASE = "/uvx"; // GitHub Pages subpath for this repo

const qs = new URLSearchParams(location.search);
const state = {
  event: qs.get("event") || "template",
  lang: (qs.get("lang") || "en").toLowerCase() === "jp" ? "jp" : "en",
  ref: qs.get("ref") || ""
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

function configPath(){
  return `${BASE}/events/${state.event}/config.json`;
}

function asset(file){
  return `${BASE}/events/${state.event}/assets/${file}`;
}

/** --- REF + TRACKING (local) --- **/
function getRef(){
  const urlRef = qs.get("ref");
  const saved = localStorage.getItem("uvx_ref");
  const ref = (urlRef || saved || "").trim();
  if (ref) localStorage.setItem("uvx_ref", ref);
  return ref;
}

function withRef(url){
  if (!url || url === "#") return url;
  const ref = getRef();
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
  const payload = {
    ts: Date.now(),
    name,
    event: state.event,
    lang: state.lang,
    ref: getRef() || "",
    ...data
  };

  try{
    const key = "uvx_track";
    const arr = JSON.parse(localStorage.getItem(key) || "[]");
    arr.push(payload);
    localStorage.setItem(key, JSON.stringify(arr.slice(-500)));
  }catch{}
}

async function loadConfig(){
  state.ref = getRef();
  const path = configPath();
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

/** --- INVITE LINK --- **/
function buildInviteLink(){
  const u = new URL(location.href);
  u.searchParams.set("event", state.event);

  const ref = getRef();
  if (ref) u.searchParams.set("ref", ref);

  const to = document.getElementById("invTo")?.value?.trim() || "";
  const from = document.getElementById("invFrom")?.value?.trim() || "";
  const tier = document.getElementById("invTier")?.value || "";

  if (to) u.searchParams.set("to", to); else u.searchParams.delete("to");
  if (from) u.searchParams.set("from", from); else u.searchParams.delete("from");
  if (tier) u.searchParams.set("tier", tier); else u.searchParams.delete("tier");

  u.searchParams.set("lang", state.lang);
  return u.toString();
}

async function copyText(text){
  await navigator.clipboard.writeText(text);
}

function bulletList(items){
  if (!items || !items.length) return "";
  return `
    <div class="list">
      ${items.map(it => `
        <div class="bullet">
          <div class="dot"></div>
          <div class="small">${t(it)}</div>
        </div>
      `).join("")}
    </div>
  `;
}

function ytEmbed(url){
  try{
    const u = new URL(url);
    const id = u.searchParams.get("v");
    if (id) return `https://www.youtube.com/embed/${id}`;
    if (u.hostname.includes("youtu.be")) {
      const pid = u.pathname.replace("/", "");
      if (pid) return `https://www.youtube.com/embed/${pid}`;
    }
  }catch{}
  return "";
}

/** --- MASONRY PATTERN (curated) --- **/
function masonryClass(i){
  const p = i % 10;
  if (p === 0) return "w8 h4";
  if (p === 1) return "w4 h2";
  if (p === 2) return "w4 h3";
  if (p === 3) return "w8 h2";
  if (p === 4) return "w6 h3";
  if (p === 5) return "w6 h1";
  if (p === 6) return "w3 h2";
  if (p === 7) return "w3 h2";
  if (p === 8) return "w6 h2";
  return "w6 h3";
}

function render(cfg){
  document.title = `${t(cfg.title) || "Event"} | ${cfg.brand || "Event"}`;
  $("brand").textContent = cfg.brand || "EVENT";

  const heroBgFile = cfg.sections?.heroBg || "hero.jpg";
  const heroBg = asset(heroBgFile);

  const toQ = qs.get("to") || "";
  const fromQ = qs.get("from") || "";
  const tierQ = qs.get("tier") || "";

  const tierDefault = tierQ || (cfg.tiers?.[0]?.id || "");
  const toDefault = toQ;
  const fromDefault = fromQ;

  const ticketUrl = withRef(cfg.links?.tickets || "#");
  const merchUrl  = withRef(cfg.links?.merch || "");
  const lineUrl   = withRef(cfg.links?.line || "");
  const igUrl     = withRef(cfg.links?.instagram || "");

  const cta = $("ctaTicketsTop");
  cta.href = ticketUrl;
  cta.textContent = state.lang === "jp" ? "Lumaで購入" : "Buy on Luma";
  cta.onclick = () => track("click_top_cta", { href: ticketUrl });

  // ✅ UPDATED: supports badge + note + soldOut visual (optional)
  const tiersHtml = (cfg.tiers || []).map(x => {
    const sold = !!x.soldOut;
    const badge = x.badge ? t(x.badge) : "";
    const note = x.note ? t(x.note) : "";
    const cls = `box${sold ? " is-soldout" : ""}`;
    return `
      <div class="${cls}" style="${sold ? "opacity:.55;filter:grayscale(.1);" : ""}">
        <div class="kicker">
          ${t(x.name)}
          ${badge ? ` • <span style="opacity:.85">${badge}</span>` : ``}
          ${sold ? ` • <span style="opacity:.85">${state.lang==="jp" ? "売り切れ" : "Sold out"}</span>` : ``}
        </div>
        <div class="price" style="margin-top:10px;">¥${yen(x.priceYen)}</div>
        <div class="small" style="margin-top:6px;white-space:pre-line;">${t(x.includes)}</div>
        ${note ? `<div class="small" style="margin-top:8px;opacity:.75">${note}</div>` : ``}
      </div>
    `;
  }).join("");

  const vipStepsHtml = (cfg.vipFlow?.steps || []).map(s => `
    <div class="box">
      <div class="kicker">${t(s.title)}</div>
      <div class="small" style="margin-top:8px;">${t(s.text)}</div>
    </div>
  `).join("");

  const photos = cfg.media?.photos?.images || [];
  const photosHtml = photos.length ? `
    <section class="section">
      <div class="section-inner">
        <div class="kicker">${t(cfg.media?.photos?.headline) || "Photos"}</div>
        <h2>${state.lang==="jp" ? "写真" : "Photos"}</h2>

        <div class="masonry">
          ${photos.map((img, i) => `
            <div class="masonry-item ${masonryClass(i)}">
              <img src="${asset(img)}" alt="photo" loading="lazy">
            </div>
          `).join("")}
        </div>

        ${(t(cfg.media?.photos?.note) || t(cfg.media?.photos?.text)) ? `
          <div class="small" style="margin-top:14px;opacity:.85;">
            ${t(cfg.media?.photos?.text) || ""} ${t(cfg.media?.photos?.note) || ""}
          </div>
        ` : ``}
      </div>
    </section>
  ` : "";

  const videos = cfg.media?.videos?.items || [];
  const primaryVideo = cfg.media?.videos?.primary || (videos[0] || null);

  const videosHtml = (primaryVideo && primaryVideo.type === "youtube") ? `
    <section class="section">
      <div class="section-inner">
        <div class="kicker">${t(cfg.media?.videos?.headline) || "Video"}</div>
        <h2>${state.lang==="jp" ? "ビデオ" : "Video"}</h2>

        <div class="video-big">
          <iframe
            src="${ytEmbed(primaryVideo.url)}"
            title="${t(primaryVideo.title) || "Video"}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>

        ${(videos.length > 1) ? `
          <div class="small" style="margin-top:12px;opacity:.85;">
            ${state.lang==="jp" ? "他の動画も順次追加できます。" : "Add more videos anytime."}
          </div>
        ` : ``}
      </div>
    </section>
  ` : "";

  $("app").innerHTML = `
    <section class="section hero">
      <div class="bg" style="background-image:url('${heroBg}')"></div>
      <div class="section-inner">
        <div class="card">
          <div class="kicker">${t(cfg.subtitle)}</div>
          <h1>${t(cfg.title)}</h1>

          ${cfg.hero?.tagline ? `<div class="hero-tagline">${t(cfg.hero.tagline)}</div>` : ""}

          ${cfg.hero?.lead ? `<div class="small" style="margin-top:10px;">${t(cfg.hero.lead)}</div>` : ""}

          ${(cfg.hero?.vipCallout) ? `
            <div class="box" style="margin-top:14px;">
              <div class="small" style="white-space:pre-line;">${t(cfg.hero.vipCallout)}</div>
            </div>
          ` : ""}

          ${(toQ || fromQ || tierQ) ? `
            <div class="small" style="margin-top:12px;">
              ${toQ ? (state.lang==="jp" ? `招待先: ${toQ}` : `Invitation for: ${toQ}`) : ``}
              ${(toQ && fromQ) ? (state.lang==="jp" ? `（招待: ${fromQ}）` : ` (from ${fromQ})`) : (fromQ ? (state.lang==="jp" ? `招待: ${fromQ}` : `From: ${fromQ}`) : ``)}
            </div>
          ` : ``}

          <div class="meta">
            <div class="pill">📅 ${t(cfg.dateText)}</div>
            <div class="pill">📍 ${t(cfg.venueText)}</div>
            ${getRef() ? `<div class="pill">REF: ${getRef()}</div>` : ``}
          </div>

          <div class="hr"></div>

          <div class="box">
            <div class="kicker">${state.lang==="jp" ? "招待をカスタマイズ" : "Personalize Invitation"}</div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;">
              <input id="invTo" class="input" placeholder="${state.lang==="jp" ? "TO: ゲスト名" : "TO: Guest name"}" value="${toDefault}">
              <input id="invFrom" class="input" placeholder="${state.lang==="jp" ? "FROM: あなたの名前" : "FROM: Your name"}" value="${fromDefault}">
            </div>

            <div style="display:grid;grid-template-columns:1fr auto;gap:10px;margin-top:10px;align-items:center;">
              <select id="invTier" class="select">
                ${(cfg.tiers||[]).map(x => `
                  <option value="${x.id}" ${x.id===tierDefault?"selected":""}>
                    ${t(x.name)} — ¥${yen(x.priceYen)}
                  </option>
                `).join("")}
              </select>

              <button id="copyInvite" class="btn primary" type="button">
                ${state.lang==="jp" ? "リンクをコピー" : "Copy Link"}
              </button>
            </div>

            <div id="copyStatus" class="small" style="margin-top:8px;opacity:.9;"></div>
          </div>

          <div class="meta" style="margin-top:16px;">
            <a class="btn primary" id="buyTickets" href="${ticketUrl}" target="_blank" rel="noreferrer">
              ${state.lang==="jp" ? "【今すぐ前売特典で予約する】" : "GET TICKETS"}
            </a>
            ${igUrl ? `<a class="btn ghost" id="openIG" href="${igUrl}" target="_blank" rel="noreferrer">Instagram</a>` : ``}
            ${lineUrl ? `<a class="btn ghost" id="openLine" href="${lineUrl}" target="_blank" rel="noreferrer">LINE</a>` : ``}
            ${merchUrl ? `<a class="btn ghost" id="buyMerch" href="${merchUrl}" target="_blank" rel="noreferrer">Merch</a>` : ``}
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-inner">
        <div class="kicker">${state.lang==="jp" ? "チケット" : "Tickets"}</div>
        <h2>${state.lang==="jp" ? "料金" : "Pricing"}</h2>
        <div class="grid">${tiersHtml}</div>
      </div>
    </section>

    ${(cfg.content?.included?.items?.length || 0) ? `
      <section class="section">
        <div class="section-inner">
          <div class="kicker">${t(cfg.content.included.headline)}</div>
          <h2>${t(cfg.content.included.headline)}</h2>
          ${bulletList(cfg.content.included.items)}
        </div>
      </section>
    ` : ""}

    ${(cfg.content?.performers?.items?.length || 0) ? `
      <section class="section">
        <div class="section-inner">
          <div class="kicker">${t(cfg.content.performers.headline)}</div>
          <h2>${t(cfg.content.performers.headline)}</h2>
          ${bulletList(cfg.content.performers.items)}
        </div>
      </section>
    ` : ""}

    ${(cfg.content?.music?.text) ? `
      <section class="section">
        <div class="section-inner">
          <div class="kicker">${t(cfg.content.music.headline)}</div>
          <h2>${t(cfg.content.music.headline)}</h2>
          <div class="box"><div class="small">${t(cfg.content.music.text)}</div></div>
        </div>
      </section>
    ` : ""}

    ${(cfg.content?.dress?.text) ? `
      <section class="section">
        <div class="section-inner">
          <div class="kicker">${t(cfg.content.dress.headline)}</div>
          <h2>${t(cfg.content.dress.headline)}</h2>
          <div class="box"><div class="small">${t(cfg.content.dress.text)}</div></div>
        </div>
      </section>
    ` : ""}

    ${(cfg.content?.drinks?.text) ? `
      <section class="section">
        <div class="section-inner">
          <div class="kicker">${t(cfg.content.drinks.headline)}</div>
          <h2>${t(cfg.content.drinks.headline)}</h2>
          <div class="box"><div class="small">${t(cfg.content.drinks.text)}</div></div>
        </div>
      </section>
    ` : ""}

    ${(cfg.content?.vip?.text) ? `
      <section class="section">
        <div class="section-inner">
          <div class="kicker">${t(cfg.content.vip.headline)}</div>
          <h2>${t(cfg.content.vip.headline)}</h2>
          <div class="box"><div class="small">${t(cfg.content.vip.text)}</div></div>
        </div>
      </section>
    ` : ""}

    ${(cfg.vipFlow?.steps?.length || 0) ? `
      <section class="section">
        <div class="section-inner">
          <div class="kicker">${t(cfg.vipFlow.headline) || (state.lang==="jp"?"支払い後の流れ":"After Payment")}</div>
          <h2>${t(cfg.vipFlow.headline) || (state.lang==="jp"?"支払い後の流れ":"After Payment")}</h2>
          <div class="grid">${vipStepsHtml}</div>
        </div>
      </section>
    ` : ""}

    ${videosHtml}
    ${photosHtml}

    <footer class="footer">
      <div class="section-inner">
        ${cfg.policy ? `<div class="small">${t(cfg.policy)}</div>` : ``}
        <div class="small" style="margin-top:10px;">© ${new Date().getFullYear()} ${cfg.brand || "Event"}</div>
      </div>
    </footer>
  `;

  document.getElementById("buyTickets")?.addEventListener("click", () => track("click_buy_luma", { href: ticketUrl }));
  document.getElementById("buyMerch")?.addEventListener("click", () => track("click_merch", { href: merchUrl }));
  document.getElementById("openLine")?.addEventListener("click", () => track("click_line", { href: lineUrl }));
  document.getElementById("openIG")?.addEventListener("click", () => track("click_instagram", { href: igUrl }));

  document.getElementById("copyInvite")?.addEventListener("click", async () => {
    try{
      const link = buildInviteLink();
      await copyText(link);
      document.getElementById("copyStatus").textContent =
        state.lang==="jp" ? "コピーしました。送ってください。" : "Copied. Send it.";
      track("copy_invite_link", { link });
    }catch{
      document.getElementById("copyStatus").textContent =
        state.lang==="jp" ? "コピーに失敗しました。" : "Copy failed.";
    }
  });

  document.getElementById("invTier")?.addEventListener("change", (e) => {
    track("select_tier", { tier: e.target.value });
  });
}

(async function main(){
  try{
    const cfg = await loadConfig();
    setLangUI();
    render(cfg);

    $("langEn").onclick = () => { state.lang="en"; setLangUI(); render(cfg); track("switch_lang", { lang: "en" }); };
    $("langJp").onclick = () => { state.lang="jp"; setLangUI(); render(cfg); track("switch_lang", { lang: "jp" }); };
  }catch(e){
    $("app").innerHTML = `
      <section class="section">
        <div class="section-inner">
          <div class="card">
            <div class="kicker">Error</div>
            <div class="small" style="margin-top:8px;">${String(e.message || e)}</div>
            <div class="small" style="margin-top:10px;">Direct check:</div>
            <div class="small"><a href="${configPath()}" target="_blank" rel="noreferrer">${configPath()}</a></div>
          </div>
        </div>
      </section>
    `;
  }
})();
