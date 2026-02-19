// app.js — put this file in the REPO ROOT (same level as index.html / styles.css)

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
  const en = $("langEn");
  const jp = $("langJp");
  if (en && jp) {
    en.classList.toggle("active", state.lang === "en");
    jp.classList.toggle("active", state.lang === "jp");
  }

  const labelName = $("labelName");
  const labelTier = $("labelTier");
  if (labelName) labelName.textContent = state.lang === "jp" ? "招待名（任意）" : "Personalize Invitation";
  if (labelTier) labelTier.textContent = state.lang === "jp" ? "チケット種別" : "Ticket Type";
}

function buildShareLink() {
  const u = new URL(window.location.href);
  u.searchParams.set("event", state.event);
  u.searchParams.set("lang", state.lang);
  if (state.name) u.searchParams.set("name", state.name);
  else u.searchParams.delete("name");
  if (state.ref) u.searchParams.set("ref", state.ref);
  else u.searchParams.delete("ref");
  if (state.tier) u.searchParams.set("tier", state.tier);
  else u.searchParams.delete("tier");
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

function render(config) {
  document.title = `${t(config.title) || "Event"} | ${config.brand || "Event"}`;

  const brand = $("brand");
  if (brand) brand.textContent = config.brand || "EVENT";

  // Populate tier select
  const select = $("tierSelect");
  if (select) {
    select.innerHTML = "";

    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = state.lang === "jp" ? "選択してください" : "Select";
    select.appendChild(opt0);

    (config.tiers || []).forEach((tier) => {
      const opt = document.createElement("option");
      opt.value = tier.id;
      opt.textContent = `${t(tier.name)} — ¥${yen(tier.priceYen)}`;
      select.appendChild(opt);
    });

    if (state.tier) select.value = state.tier;
  }

  const guest =
    (state.name && state.name.trim()) ||
    (state.lang === "jp" ? "ご招待客" : "Distinguished Guest");

  const heroImg = config.heroImage
    ? `./events/${state.event}/assets/${config.heroImage}`
    : "";

  const tiersHtml = (config.tiers || [])
    .map(
      (tier) => `
      <div class="tier">
        <strong>${t(tier.name)}</strong>
        <div class="small">¥${yen(tier.priceYen)}</div>
        <div class="small">${t(tier.includes)}</div>
      </div>
    `
    )
    .join("");

  const galleryHtml = (config.gallery?.images || [])
    .map((img) => {
      const src = `./events/${state.event}/assets/${img}`;
      return `<img src="${src}" alt="gallery" loading="lazy">`;
    })
    .join("");

  const payHtml = (config.payments?.methods || [])
    .map((m) => {
      const name = t(m.name || m.id);
      const note = t(m.note);
      const qr = `./events/${state.event}/assets/${m.qr}`;
      return `
        <div class="card">
          <h2>${name}</h2>
          <p>${note}</p>
          <img src="${qr}" alt="${name} QR" loading="lazy">
        </div>
      `;
    })
    .join("");

  const app = $("app");
  if (!app) return;

  app.innerHTML = `
    <section class="section">
      ${heroImg ? `<div class="bg" style="background-image:url('${heroImg}')"></div>` : `<div class="bg"></div>`}
      <div class="content">
        <div class="card">
          <p class="small">${t(config.subtitle)}</p>
          <h1>${t(config.title)}</h1>
          <p>${t(config.dateText)} • ${t(config.venueText)}</p>
          <p class="small">${state.lang === "jp" ? "招待：" : "Invitation for:"} <strong>${guest}</strong></p>
          ${
            config.mapUrl
              ? `<a class="btn" href="${config.mapUrl}" target="_blank" rel="noreferrer">
                   ${state.lang === "jp" ? "マップを見る" : "Open Map"}
                 </a>`
              : ""
          }
        </div>
      </div>
    </section>

    <section class="section">
      <div class="content">
        <div class="card">
          <h2>${state.lang === "jp" ? "チケット" : "Tickets"}</h2>
          <div class="grid">${tiersHtml}</div>
          ${state.ref ? `<p class="small">ref: ${state.ref}</p>` : ""}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="content">
        <div class="card">
          <h2>${state.lang === "jp" ? "ドレスコード" : "Dress Code"}</h2>
          <p>${t(config.dressCode)}</p>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="content">
        <div class="card">
          <h2>${t(config.gallery?.headline)}</h2>
          <div class="gallery">${galleryHtml}</div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="content">
        <div class="card">
          <h2>${t(config.payments?.headline)}</h2>
          <div class="qrs">${payHtml}</div>
          <p class="small">
            ${state.lang === "jp" ? "支払い後、スクショをLINEで送ってください。" : "After payment, send a screenshot via LINE."}
          </p>
          ${
            config.payments?.contactLine
              ? `<a class="btn" href="${config.payments.contactLine}" target="_blank" rel="noreferrer">
                   ${state.lang === "jp" ? "LINEで連絡" : "Contact on LINE"}
                 </a>`
              : ""
          }
        </div>

        <div class="card" style="margin-top:12px;">
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

  const enBtn = $("langEn");
  const jpBtn = $("langJp");

  if (enBtn) enBtn.onclick = () => { state.lang = "en"; setLangUI(); render(config); };
  if (jpBtn) jpBtn.onclick = () => { state.lang = "jp"; setLangUI(); render(config); };

  if (nameInput) {
    nameInput.addEventListener("input", (e) => {
      state.name = e.target.value;
      render(config);
    });
  }

  const tierSelect = $("tierSelect");
  if (tierSelect) {
    tierSelect.addEventListener("change", (e) => {
      state.tier = e.target.value;
    });
  }

  const copyBtn = $("copyLink");
  if (copyBtn) {
    copyBtn.onclick = async () => {
      const link = buildShareLink();
      try {
        await navigator.clipboard.writeText(link);
        toast(state.lang === "jp" ? "リンクをコピーしました" : "Link copied!");
      } catch {
        // Fallback if clipboard is blocked
        window.prompt("Copy this link:", link);
      }
    };
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
        <div class="section">
          <div class="content">
            <div class="card">
              <h2>Error</h2>
              <p class="small">${String(e.message || e)}</p>
              <p class="small">Check: /events/&lt;slug&gt;/config.json and that app.js is in repo root.</p>
            </div>
          </div>
        </div>
      `;
    }
  }
})();
