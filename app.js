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
  $("brand").textContent = config.brand || "EVEN
