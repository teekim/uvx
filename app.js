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
  if (state.ref) u.searchParams.set("ref", state.ref); else u.searchParams.delete("ref");
  if (state.tier) u.searchParams.set("tier", state.tier); else u.searchParams.delete("tier");

  return u.toString();
}

function toast(msg) {
  const el = $("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1200);
}

async function loadConfig() {
  const path = `./events/${state.event}/config.json`;
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Config not found: ${path}`);
  return await res.json();
}

function bgPath(eventSlug, fileName) {
  if (!fileName) return "";
  return `./events/${eventSlug}/assets/${fileName}`;
}

function render(config) {
  document.title = `${t(config.title) || "Event"} | ${config.brand || "Event"}`;
  $("brand").textContent = config.brand || "EVENT";

  // Set up tier select
  const select = $("tierSelect");
  if (select) {
    select.innerHTML = "";
    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = state.lang === "jp" ? "チケット種別" : "Ticket Type";
    select.appendChild(opt0);

    (config.tiers || []).forEach((tier) => {
      const opt = document.createElement("option");
      opt.value = tier.id;
      opt.textContent = `${t(tier.name)} — ¥${yen(tier.priceYen)}`;
      select.appendChild(opt);
    });

    if (state.tier) select.value = state.tier;
  }

  // Music (optional)
  const musicBtn = $("musicBtn");
  const audio = $("bgm");
  const musicFile = config.music?.file;
  if (musicBtn && audio && musicFile) {
    audio.src = bgPath(state.event, musicFile);
    musicBtn.style.display = "inline-block";
    musicBtn.textContent = "Play Me!";
  } else if (musicBtn) {
    musicBtn.style.display = "none";
  }

  const guest =
    (state.name && state.name.trim()) ||
    (state.lang === "jp" ? "ご招待客" : "Distinguished Guest");

  const heroBg = bgPath(state.event, config.sections?.heroBg || config.heroImage);
  const ticketsBg = bgPath(state.event, config.sections?.ticketsBg);
  const dressBg = bgPath(state.event, config.sections?.dressBg);
  const galleryBg = bgPath(state.event, config.sections?.galleryBg);
  const paymentBg = bgPath(state.event, config.sections?.paymentBg);

  const tiersHtml = (config.tiers || []).map((tier) => `
    <div class="tier">
      <strong>${t(tier.name)}</strong>
      <div class="small">¥${yen(tier.priceYen)}</div>
      <div class="small">${t(tier.includes)}</div>
    </div>
  `).join("");

  const galleryHtml = (config.gallery?.images || []).map((img) => {
    const src = bgPath(state.event, img);
    return `<img src="${src}" alt="gallery" loading="lazy">`;
  }).join("");

  const payHtml = (config.payments?.methods || []).map((m) => {
    const name = t(m.name || m.id);
    const note = t(m.note);
    const qr = bgPath(state.event, m.qr);
    return `
      <div class="card" style="padding:18px;border-radius:22px;">
        <h2>${name}</h2>
        <p>${note}</p>
        <img src="${qr}" alt="${name} QR" loading="lazy">
      </div>
    `;
  }).join("");

  const app = $("app");
  if (!app) return;

  app.innerHTML = `
    <!-- HERO -->
    <section class="section">
      <div class="bg" style="background-image:url('${heroBg}')"></div>
      <div class="content">
        <div class="card">
          <div class="small">${t(config.subtitle)}</div>
          <h1>${t(config.title)}</h1>
          <p>${t(config.dateText)} • ${t(config.venueText)}</p>
          <p class="small">${state.lang === "jp" ? "招待：" : "Invitation for:"} <strong style="color:rgba(244,244,247,.95)">${guest}</strong></p>
          ${config.mapUrl ? `<a class="btn" href="${config.mapUrl}" target="_blank" rel="noreferrer">${state.lang === "jp" ? "マップを見る" : "Open Map"}</a>` : ``}
        </div>
      </div>
    </section>

    <!-- TICKETS -->
    <section class="section">
      <div class="bg" style="background-image:url('${ticketsBg || heroBg}')"></div>
      <div class="content">
        <div class="card">
          <h2>${state.lang === "jp" ? "チケット" : "Tickets"}</h2>
          <div class="grid">${tiersHtml}</div>
          ${state.ref ? `<hr class="sep"><div class="small">ref: ${state.ref}</div>` : ``}
        </div>
      </div>
    </section>

    <!-- DRESS CODE -->
    <section class="section">
      <div class="bg" style="background-image:url('${dressBg || heroBg}')"></div>
      <div class="content">
        <div class="card">
          <h2>${state.lang === "jp" ? "ドレスコード" : "Dress Code"}</h2>
          <p>${t(config.dressCode)}</p>
        </div>
      </div>
    </section>

    <!-- GALLERY -->
    <section class="section">
      <div class="bg" style="background-image:url('${galleryBg || heroBg}')"></div>
      <div class="content">
        <div class="card">
          <h2>${t(config.gallery?.headline) || (state.lang === "jp" ? "過去イベント" : "Past Events")}</h2>
          <div class="gallery">${galleryHtml}</div>
        </div>
      </div>
    </section>

    <!-- PAYMENT -->
    <section class="section">
      <div class="bg" style="background-image:url('${paymentBg || heroBg}')"></div>
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

function wireControls(config) {
  setLangUI();

  const nameInput = $("guestName");
  if (nameInput) nameInput.value = state.name;

  $("langEn")?.addEventListener("click", () => { state.lang = "en"; setLangUI(); render(config); });
  $("langJp")?.addEventListener("click", () => { state.lang = "jp"; setLangUI(); render(config); });

  nameInput?.addEventListener("input", (e) => { state.name = e.target.value; render(config); });

  const tierSelect = $("tierSelect");
  tierSelect?.addEventListener("change", (e) => {
    state.tier = e.target.value;
    render(config); // keep UI in sync
  });

  $("copyLink")?.addEventListener("click", async () => {
    const link = buildShareLink();
    try {
      await navigator.clipboard.writeText(link);
      toast(state.lang === "jp" ? "リンクをコピーしました" : "Link copied!");
    } catch {
      window.prompt("Copy this link:", link);
    }
  });

  // Music toggle (optional)
  const musicBtn = $("musicBtn");
  const audio = $("bgm");
  if (musicBtn && audio && config.music?.file) {
    musicBtn.addEventListener("click", async () => {
      try {
        if (audio.paused) {
          await audio.play();
          musicBtn.textContent = "Pause";
        } else {
          audio.pause();
          musicBtn.textContent = "Play Me!";
        }
      } catch {
        // autoplay restrictions or blocked play
        toast(state.lang === "jp" ? "再生できません（ブラウザ制限）" : "Unable to play (browser restriction)");
      }
    });
  }
}

(async function main() {
  try {
    const config = await loadConfig();
    render(config);
    wireControls(config);
  } catch (e) {
    const app = $("app");
    if (app) {
      app.innerHTML = `
        <section class="section">
          <div class="bg"></div>
          <div class="content">
            <div class="card">
              <h2>Error</h2>
              <p class="small">${String(e.message || e)}</p>
              <p class="small">Check: /events/&lt;slug&gt;/config.json and assets filenames.</p>
            </div>
          </div>
        </section>
      `;
    }
  }
})();
