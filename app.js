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

/** --- REF + TRACKING (minimal, reliable) --- **/
function getRef(){
  // precedence: URL ref > saved ref
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
    localStorage.setItem(key, JSON.stringify(arr.slice(-300)));
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

/** --- INVITE LINK BUILDING --- **/
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

function render(cfg){
  document.title = `${t(cfg.title) || "Event"} | ${cfg.brand || "Event"}`;
  $("brand").textContent = cfg.brand || "EVENT";

  const heroBgFile = cfg.sections?.heroBg || "hero.jpg";
  const heroBg = asset(heroBgFile);

  // Page personalization from URL
  const toQ = qs.get("to") || "";
  const fromQ = qs.get("from") || "";
  const tierQ = qs.get("tier") || "";

  // Default values for widget
  const tierDefault = tierQ || (cfg.tiers?.[0]?.id || "");
  const toDefault = toQ;
  const fromDefault = fromQ;

  // Append ref to outgoing links
  const ticketUrl = withRef(cfg.links?.tickets || "#");
  const merchUrl  = withRef(cfg.links?.merch || "");
  const lineUrl   = withRef(cfg.links?.line || "");
  const igUrl     = withRef(cfg.links?.instagram || "");

  const cta = $("ctaTicketsTop");
  cta.href = ticketUrl;
  cta.textContent = state.lang === "jp" ? "Lumaで購入" : "Buy on Luma";
  cta.onclick = () => track("click_top_cta", { href: ticketUrl });

  const tiersHtml = (cfg.tiers || []).map(x => `
    <div class="box">
      <div class="kicker">${t(x.name)}</div>
      <h3 style="margin:10px 0 6px;">¥${yen(x.priceYen)}</h3>
      <div class="small">${t(x.includes)}</div>
    </div>
  `).join("");

  const vipStepsHtml = (cfg.vipFlow?.steps || []).map(s => `
    <div class="box">
      <div class="kicker">${t(s.title)}</div>
      <div class="small" style="margin-top:8px;">${t(s.text)}</div>
    </div>
  `).join("");

  const photosHtml = (cfg.media?.photos?.images || []).map(img => `
    <img src="${asset(img)}" alt="photo" loading="lazy">
  `).join("");

  // Optional: show selected tier name if tier param matches config
  const tierObj = (cfg.tiers || []).find(x => x.id === tierQ);
  const tierLabel = tierObj ? `${t(tierObj.name)} — ¥${yen(tierObj.priceYen)}` : "";

  $("app").innerHTML = `
    <section class="section hero">
      <div class="bg" style="background-image:url('${heroBg}')"></div>
      <div class="section-inner">
        <div class="card">
          <div class="kicker">${t(cfg.subtitle)}</div>
          <h1>${t(cfg.title)}</h1>
          <div class="small">${t(cfg.description)}</div>

          ${(toQ || fromQ || tierQ) ? `
          <div class="small" style="margin-top:10px;">
            ${toQ ? (state.lang==="jp" ? `招待先: ${toQ}` : `Invitation for: ${toQ}`) : ``}
            ${(toQ && fromQ) ? (state.lang==="jp" ? `（招待: ${fromQ}）` : ` (from ${fromQ})`) : (fromQ ? (state.lang==="jp" ? `招待: ${fromQ}` : `From: ${fromQ}`) : ``)}
            ${tierLabel ? ` • ${tierLabel}` : ``}
          </div>
          ` : ``}

          <div class="meta">
            <div class="pill">📅 ${t(cfg.dateText)}</div>
            <div class="pill">📍 ${t(cfg.venueText)}</div>
            ${getRef() ? `<div class="pill">REF: ${getRef()}</div>` : ``}
          </div>

          <!-- Personalize Invitation -->
          <div style="margin-top:18px;" class="box">
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

            <div id="copyStatus" class="small" style="margin-top:8px;opacity:.85;"></div>
          </div>

          <div class="meta" style="margin-top:16px;">
            <a class="btn primary" id="buyTickets" href="${ticketUrl}" target="_blank" rel="noreferrer">${state.lang==="jp"?"Lumaで購入":"Buy on Luma"}</a>
            ${merchUrl ? `<a class="btn" id="buyMerch" href="${merchUrl}" target="_blank" rel="noreferrer">Merch</a>` : ``}
            ${lineUrl ? `<a class="btn" id="openLine" href="${lineUrl}" target="_blank" rel="noreferrer">LINE</a>` : ``}
            ${igUrl ? `<a class="btn" id="openIG" href="${igUrl}" target="_blank" rel="noreferrer">IG</a>` : ``}
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-inner">
        <div class="kicker">${state.lang==="jp"?"チケット":"Tickets"}</div>
        <h2>${state.lang==="jp"?"料金":"Pricing"}</h2>
        <div class="grid">${tiersHtml}</div>
      </div>
    </section>

    ${(cfg.vipFlow?.steps?.length || 0) ? `
    <section class="section">
      <div class="section-inner">
        <div class="kicker">${t(cfg.vipFlow?.headline) || (state.lang==="jp"?"VIP導線":"VIP Flow")}</div>
        <h2>${state.lang==="jp"?"支払い後の流れ":"After payment"}</h2>
        <div class="grid">${vipStepsHtml}</div>
      </div>
    </section>` : ``}

    ${(cfg.media?.photos?.images?.length || 0) ? `
    <section class="section">
      <div class="section-inner">
        <div class="kicker">${t(cfg.media?.photos?.headline) || "Photos"}</div>
        <h2>${state.lang==="jp"?"雰囲気":"Vibe"}</h2>
        <div class="gallery">${photosHtml}</div>
      </div>
    </section>` : ``}

    <footer class="footer">
      <div class="section-inner">
        <div class="small">© ${new Date().getFullYear()} ${cfg.brand || "Event"}</div>
      </div>
    </footer>
  `;

  // click tracking
  document.getElementById("buyTickets")?.addEventListener("click", () => track("click_buy_luma", { href: ticketUrl }));
  document.getElementById("buyMerch")?.addEventListener("click", () => track("click_merch", { href: merchUrl }));
  document.getElementById("openLine")?.addEventListener("click", () => track("click_line", { href: lineUrl }));
  document.getElementById("openIG")?.addEventListener("click", () => track("click_instagram", { href: igUrl }));

  // invite copy + tracking
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
