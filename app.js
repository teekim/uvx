const BASE = "/uvx"; // GitHub Pages subpath for this repo

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

  const vipS
