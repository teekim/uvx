const qs = new URLSearchParams(location.search);
const state = {
  event: qs.get("event") || "_template",
  lang: (qs.get("lang") || "en").toLowerCase() === "jp" ? "jp" : "en",
  ref: qs.get("ref") || ""
};

const $ = (id) => document.getElementById(id);

function t(obj){
  if (obj == null) return "";
  if (typeof obj === "string") return obj;
  return obj[state.lang] ?? obj.en ?? "";
}
function yen(n){ return new Intl.NumberFormat("ja-JP").format(Number(n || 0)); }

async function loadConfig(){
  const path = `./events/${state.event}/config.json`;
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Config not found: ${path}`);
  return await res.json();
}
function asset(file){ return `./events/${state.event}/assets/${file}`; }

function setLangUI(){
  $("langEn").classList.toggle("active", state.lang === "en");
  $("langJp").classList.toggle("active", state.lang === "jp");
}

function render(cfg){
  document.title = `${t(cfg.title)} | ${cfg.brand || "Event"}`;
  $("brand").textContent = cfg.brand || "EVENT";

  const heroBg = asset(cfg.sections?.heroBg || "hero.jpg");

  const ticketUrl = cfg.links?.tickets || "#";
  const cta = $("ctaTicketsTop");
  cta.href = ticketUrl;
  cta.textContent = state.lang === "jp" ? "Lumaで購入" : "Buy on Luma";

  const tiers = (cfg.tiers || []).map(x => `
    <div class="box">
      <div class="kicker">${t(x.name)}</div>
      <h3 style="margin:10px 0 6px;">¥${yen(x.priceYen)}</h3>
      <div class="small">${t(x.includes)}</div>
    </div>
  `).join("");

  const vipSteps = (cfg.vipFlow?.steps || []).map(s => `
    <div class="box">
      <div class="kicker">${t(s.title)}</div>
      <div class="small" style="margin-top:8px;">${t(s.text)}</div>
    </div>
  `).join("");

  const photos = (cfg.media?.photos?.images || []).map(img => `
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
            ${cfg.links?.merch ? `<a class="btn" href="${cfg.links.merch}" target="_blank" rel="noreferrer">Merch</a>` : ``}
            ${cfg.links?.line ? `<a class="btn" href="${cfg.links.line}" target="_blank" rel="noreferrer">LINE_
