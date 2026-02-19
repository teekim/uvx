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

async function loadConfig(){
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

function render(cfg){
  document.title = `${t(cfg.title) || "Event"} | ${cfg.brand || "Event"}`;
  $("brand").textContent = cfg.brand || "EVENT";

  const heroBgFile = cfg.sections?.heroBg || "hero.jpg";
  const heroBg = asset(heroBgFile);

  const ticketUrl = (cfg.links?.tickets || "#");
  const merchUrl  = (cfg.links?.merch || "");
  const lineUrl   = (cfg.links?.line || "");

  const cta = $("ctaTicketsTop");
  cta.href = ticketUrl;
  cta.textContent = state.lang === "jp" ? "Lumaで購入" : "Buy on Luma";

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

  $("app").innerHTML = `
    <section class="section hero">
      <div class="bg" style="background-image:url('${heroBg}')"></div>
      <div class="section-inner">
        <div class="card">
          <div class="kicker">${t(cfg.subtitle)}</div>
          <h1>${t(cfg.title)}</h1>
          <div class="small">${t(cfg.description)}</div>

          <div class="meta">
            <div class="pill">📅 ${t(cfg.dateText)}</div>
            <div class="pill">📍 ${t(cfg.venueText)}</div>
            ${state.ref ? `<div class="pill">REF: ${state.ref}</div>` : ``}
          </div>

          <div class="meta" style="margin-top:16px;">
            <a class="btn primary" href="${ticketUrl}" target="_blank" rel="noreferrer">${state.lang==="jp"?"Lumaで購入":"Buy on Luma"}</a>
            ${merchUrl ? `<a class="btn" href="${merchUrl}" target="_blank" rel="noreferrer">Merch</a>` : ``}
            ${lineUrl ? `<a class="btn" href="${lineUrl}" target="_blank" rel="noreferrer">LINE</a>` : ``}
          </div>

          <div class="small" style="margin-top:14px;">
            Debug: loading <code>${configPath()}</code>
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

    ${vipStepsHtml ? `
    <section class="section">
      <div class="section-inner">
        <div class="kicker">${t(cfg.vipFlow?.headline) || (state.lang==="jp"?"VIP導線":"VIP Flow")}</div>
        <h2>${state.lang==="jp"?"支払い後の流れ":"After payment"}</h2>
        <div class="grid">${vipStepsHtml}</div>
      </div>
    </section>` : ``}

    ${photosHtml ? `
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
}

(async function main(){
  try{
    const cfg = await loadConfig();
    setLangUI();
    render(cfg);

    $("langEn").onclick = () => { state.lang="en"; setLangUI(); render(cfg); };
    $("langJp").onclick = () => { state.lang="jp"; setLangUI(); render(cfg); };
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
