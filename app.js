// app.js (REPO ROOT) — REG-like poster sections + per-section backgrounds + optional music

const qs = new URLSearchParams(window.location.search);

const state = {
  event: qs.get("event") || "uvx-mar-2026",
  lang: (qs.get("lang") || "en").toLowerCase() === "jp" ? "jp" : "en",
  name: qs.get("name") || "",
  ref: qs.get("ref") || "",
  tier: qs.get("tier") || ""
};

const $ = (id) => document.getElementById(id);

function t(obj) {
  if (obj == null) return "";
  if (typeof obj === "string") return obj;
  return obj[state.lang] ?? obj.en ?? "";
}

function yen(n) {
  return new Intl.NumberFormat("ja-JP").format(Number(n || 0));
}

function setLangUI() {
  $("langEn")?.classList.toggle("active", state.lang === "en");
  $("langJp")?.classList.toggle("active", state.lang === "jp");

  // optional: change placeholders by language
  const nameInput = $("guestName");
  if (nameInput) nameInput.placeholder = state.lang === "jp" ? "ご招待客（任意）" : "Distinguished Guest";
}

function buildShareLink() {
  const u = new URL(window.location.href);
  u.searchParams.set("event", state.event);
  u.searchParams.set("lang", state.lang);

  if (state.name) u.searchParams.set("name", state.name); else u.searchParams.delete("name");
  if (state.ref) u.searchParams.set("ref", state.ref); else u.searchParams.
