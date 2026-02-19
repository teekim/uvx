const qs = new URLSearchParams(window.location.search);

const state = {
  event: qs.get("event") || "uvx-mar-2026",
  lang: (qs.get("lang") || "en").toLowerCase() === "jp" ? "jp" : "en",
  to: qs.get("to") || "",
  from: qs.get("from") || "",
  ref: qs.get("ref") || "",
  tier: qs.get("tier") || "",
  music: qs.get("music") === "1"
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

function toast(msg) {
  const el = $("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1200);
}

function buildShareLink() {
  const u = new URL(window.location.href);
  u.searchParams.set("event", state.event);
  u.searchParams.set("lang", state.lang);
  if (state.to) u.searchParams.set("to", state.to); else u.searchParams.delete("to");
  if (state.from) u.searchParams.set("from", state.from); else u.searchParams.delete("from");
  if (state.ref) u.searchParams.set("ref", state.ref); else u.searchParams.delete("ref");
  if (state.tier) u.searchParams.set("tier", state.tier); else u.searchParams.delete("tier");
  if (state.music) u.searchParams.set("music", "1"); else u.searchParams.delete("music");
  return u.toString();
}

async function loadConfig() {
  const path = `./events/${state.event}/config.json`;
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Config not found: ${path}`);
  return await res.json();
}

function bgPath(fileName) {
  if (!fileName) return "";
  return `./events/${state.event}/assets/${fileName}`;
}

function setLangUI() {
  $("langEn")?.classList.toggle("active", state.lang === "en");
  $("langJp")?.classList.toggle("active", state.lang === "jp");

  $("overlayTitle").textContent = state.lang === "jp" ? "招待リンクを作成" : "PERSONALIZE INVITATION";
  $("copyText").textContent = state.lang === "jp" ? "リンクをコピー" : "COPY LINK TO SEND";
  $("enterText").textContent = state.lang === "jp" ? "ページを見る" : "ENTER PAGE";
  $("musicLabel").textContent = state.lang === "jp" ? "音楽を追加（任意）" : "ADD MUSIC (OPTIONAL)";

  const toName = $("toName");
  const fromName = $("fromName");
  if (toName) toName.placeholder = state.lang === "jp" ? "TO: ゲスト名" : "TO: GUEST NAME";
  if (fromName) fromName.placeholder = state.lang === "jp" ? "FROM: あなたの名前" : "FROM: YOUR NAME";
}

function renderPage(config) {
  const heroBg = bgPath(config.sections?.heroBg || config.heroImage);
  const ticketsBg = bgPath(config.sections?.ticketsBg) || heroBg;
  const dressBg = bgPath(config.sections?.dressBg) || heroBg;
  const galleryBg = bgPath(config.sections?.galleryBg) || heroBg;
  const paymentBg = bgPath(config.sections?.paymentBg) || heroBg;

  const toText = state.to?.trim() || (state.lang === "jp" ? "ご招待客" : "Distinguished Guest");
  const fromText = state.from?.trim() || (state.lang === "jp" ? "主催者" : "Host");

  const tiersHtml = (config.tiers || []).map((tier) => `
    <div class="tier">
      <strong>${t(tier.name)}</strong>
      <div class="small">¥${yen(tier.priceYen)}</div>
      <div class="small">${t(tier.includes)}</div>
    </div>
  `).join("");

  const galleryHtml = (config.gallery?.images || []).map((img) => {
    const src = bgPath(img);
    return `<img src="${src}" alt="gallery" loading="lazy">`;
  }).join("");

  const payHtml = (config.payments?.methods || []).map((m) => {
    const name = t(m.name || m.id);
    const note = t(m.note);
    const qr = bgPath(m.qr);
    return `
      <div class="card" style="padding:18px;border-radius:22px;">
        <h2>${name}</h2>
        <p>${note}</p>
        <img src="${qr}" alt="${name} QR" loading="lazy">
      </div>
    `;
  }).join("");

  $("app").innerHTML = `
    <section class="section">
      <div class="bg" style="background-image:url('${heroBg}')"></div>
      <div class="content">
        <div class="card">
          <div class="small">${t(config.subtitle)}</div>
          <h1>${t(config.title)}</h1>
          <p>${t(config.dateText)} • ${t(config.venueText)}</p>
          <p class="small">TO: <strong style="color:rgba(244,244,247,.95)">${toText}</strong></p>
          <p class="small">FROM: <strong style="color:rgba(244,244,247,.85)">${fromText}</strong></p>
          ${config.mapUrl ? `<a class="btn" href="${config.mapUrl}" target="_blank" rel="noreferrer">${state.lang === "jp" ? "マップを見る" : "Open Map"}</a>` : ``}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="bg" style="background-image:url('${ticketsBg}')"></div>
      <div class="content">
        <div class="card">
          <h2>${state.lang === "jp" ? "チケット" : "Tickets"}</h2>
          <div class="grid">${tiersHtml}</div>
          ${state.ref ? `<hr class="sep"><div class="small">ref: ${state.ref}</div>` : ``}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="bg" style="background-image:url('${dressBg}')"></div>
      <div class="content">
        <div class="card">
          <h2>${state.lang === "jp" ? "ドレスコード" : "Dress Code"}</h2>
          <p>${t(config.dressCode)}</p>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="bg" style="background-image:url('${galleryBg}')"></div>
      <div class="content">
        <div class="card">
          <h2>${t(config.gallery?.headline) || (state.lang === "jp" ? "過去イベント" : "Past Events")}</h2>
          <div class="gallery">${galleryHtml}</div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="bg" style="background-image:url('${paymentBg}')"></div>
      <div class="content">
        <div class="card">
          <h2>${t(config.payments?.headline) || (state.lang === "jp" ? "お支払い方法" : "How to Pay")}</h2>
          <div class="qrs">${payHtml}</div>
          <hr class="sep">
          <p class="small">${state.lang === "jp" ? "支払い後、スクショをLINEで送ってください。" : "After payment, send a screenshot via LINE."}</p>
          ${config.payments?.contactLine ? `<a class="btn" href="${config.payments.contactLine}" target="_blank" rel="noreferrer">${state.lang === "jp" ? "LINEで連絡" : "Contact on LINE"}</a>` : ``}
          <hr class="sep">
          <h2>${state.lang === "jp" ? "ポリシー" : "Policy"}</h2>
          <p>${t(config.policy)}</p>
        </div>
      </div>
    </section>
  `;
}

function wireOverlay(config) {
  setLangUI();

  // Prefill from URL
  $("toName").value = state.to;
  $("fromName").value = state.from;

  // Populate tier select
  const sel = $("tierSelect");
  sel.innerHTML = "";
  (config.tiers || []).forEach((tie
