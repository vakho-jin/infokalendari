"use strict";

/* ─── დასვენების დღეების გასაღებები ── */
const HOLIDAY_KEYS = new Set([
"01-01","01-02","01-07","01-19","03-03","03-08","04-09",
"05-09","05-12","05-17","05-26","08-28","10-14","11-23"
]);

/* ─── ლოკალიზაცია ── */
const MONTHS_GEN = ["იანვარი","თებერვალი","მარტი","აპრილი","მაისი","ივნისი",
                    "ივლისი","აგვისტო","სექტემბერი","ოქტომბერი","ნოემბერი","დეკემბერი"];
const MONTHS_NOM = ["იანვარი","თებერვალი","მარტი","აპრილი","მაისი","ივნისი",
                    "ივლისი","აგვისტო","სექტემბერი","ოქტომბერი","ნოემბერი","დეკემბერი"];
const WEEKDAYS   = ["კვირა","ორშაბათი","სამშაბათი","ოთხშაბათი",
                    "ხუთშაბათი","პარასკევი","შაბათი"];

/* ─── მდგომარეობა ── */
let current = new Date();
current.setHours(0, 0, 0, 0);
const today = new Date(current);

let mcYear  = current.getFullYear();
let mcMonth = current.getMonth();

/* ─── DOM ── */
const dayCard = document.getElementById("day-card");
const elDay   = document.getElementById("day-num");
const elMY    = document.getElementById("month-yr");
const elWD    = document.getElementById("weekday");
const elList  = document.getElementById("holidays");
const mcGrid  = document.getElementById("mc-grid");
const mcTitle = document.getElementById("mc-title");

/* ─── დამხმარე ── */
const pad     = n  => String(n).padStart(2, "0");
const dateKey = d  => `${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const delay   = ms => new Promise(r => setTimeout(r, ms));

/* ─── Wikipedia სურათების ქეში ── */
const _imgCache = {};

function detectLanguage(text) {
  if (!text) return 'en';
  if (/[\u10A0-\u10FF]/.test(text)) return 'ka';
  if (/[\u0400-\u04FF]/.test(text)) return 'ru';
  return 'en';
}

async function fetchWikimediaImg(query) {
  const queries = Array.isArray(query) ? query : [query];

  for (const q of queries) {
    if (_imgCache[q] !== undefined) return _imgCache[q];

    const lang  = detectLanguage(q);
    const langs = lang === 'en' ? ['en'] : [lang, 'en'];

    for (const tryLang of langs) {
      try {
        const base = `https://${tryLang}.wikipedia.org/w/api.php`;

        const sUrl = `${base}?action=opensearch&search=${encodeURIComponent(q)}&limit=1&format=json&origin=*`;
        const sRes  = await fetch(sUrl);
        const sJson = await sRes.json();
        const title = sJson[1]?.[0] || q;

        const iUrl  = `${base}?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&pithumbsize=600&pilicense=any&format=json&origin=*`;
        const iRes  = await fetch(iUrl);
        const iJson = await iRes.json();
        const pages = iJson.query.pages;
        const page  = pages[Object.keys(pages)[0]];
        const src   = page?.thumbnail?.source || null;

        if (src) { _imgCache[q] = src; return src; }
      } catch { continue; }
    }
  }

  _imgCache[query] = null;
  return null;
}

function makePlaceholderUrl(sig) {
  return `https://picsum.photos/seed/${sig}/260/200`;
}

/* ─── data/XX-XX.js ჩამტვირთველი ── */
const _dayCache = {};
let _pendingResolve = null;

window.__dayDataCallback__ = function(data) {
  if (_pendingResolve) {
    _pendingResolve(data);
    _pendingResolve = null;
  }
};

function loadDay(key) {
  // ქეშიდან დაბრუნება
  if (_dayCache.hasOwnProperty(key)) {
    return Promise.resolve(_dayCache[key]);
  }

  return new Promise(resolve => {
    // წინა script ტეგის წაშლა
    const prev = document.getElementById("__ds__");
    if (prev) prev.remove();

    // timeout — 5 წამზე მეტი ველოდება
    const timer = setTimeout(() => {
      _pendingResolve = null;
      _dayCache[key] = null;
      resolve(null);
    }, 5000);

    _pendingResolve = function(data) {
      clearTimeout(timer);
      _dayCache[key] = data;
      resolve(data);
    };

    const s   = document.createElement("script");
    s.id      = "__ds__";
    s.src     = `data/${key}.js`;
    s.onerror = function() {
      clearTimeout(timer);
      s.remove();
      _pendingResolve = null;
      _dayCache[key] = null;
      resolve(null);
    };
    document.head.appendChild(s);
  });
}

/* ─── წლის დღის ინფო ── */
function getDayOfYearInfo(d) {
  const year      = d.getFullYear();
  const isLeap    = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  const totalDays = isLeap ? 366 : 365;
  const start     = new Date(year, 0, 1);
  const dayNum    = Math.floor((d - start) / 86400000) + 1;
  const remain    = totalDays - dayNum;
  return {
    dayNum, remain, isLeap,
    line1: `გრიგორიანული კალენდრის ${dayNum}-ე დღე.`,
    line2: `წლის ბოლომდე დარჩენილია ${remain} დღე.`
  };
}

/* ─── რენდერი: თარიღი ── */
function renderDate(d) {
  elDay.textContent = d.getDate();
  elMY.textContent  = `${MONTHS_GEN[d.getMonth()]} ${d.getFullYear()}`;
  elWD.textContent  = WEEKDAYS[d.getDay()];

  let dayInfo = document.getElementById("day-of-year");
  if (!dayInfo) {
    dayInfo = document.createElement("div");
    dayInfo.id        = "day-of-year";
    dayInfo.className = "day-of-year";
    elWD.insertAdjacentElement("afterend", dayInfo);
  }
  const info = getDayOfYearInfo(d);
  dayInfo.innerHTML = `<span>${info.line1}</span><span>${info.line2}</span>`;
}

/* ─── კატეგორიები ── */
const CATEGORIES = [
  {
    key: "holidays", label: "დღესასწაულები", field: "holidays",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`
  },
  {
    key: "history", label: "ისტორიული ფაქტები", field: "history",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`
  },
  {
    key: "born", label: "დღეს დაბადებულნი", field: "born",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
  },
  {
    key: "died", label: "დღეს გარდაცვლილნი", field: "died",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 22v-8"/></svg>`
  },
];

const catOpen = { holidays: true, history: false, born: false, died: false };

/* ─── რენდერი: კატეგორიები ── */
function renderHolidays(key, data) {
  elList.innerHTML = "";

  const categorized = data && (data.holidays || data.history || data.born || data.died);

  if (categorized) {
    CATEGORIES.forEach(cat => renderCategory(cat, data[cat.field] || [], key));
  } else {
    const named = data ? data.filter(h => h.name && h.name.trim()) : [];
    const plain = data ? data.filter(h => !h.name || !h.name.trim()) : [];

    CATEGORIES.forEach(cat => {
      let items = [];
      if (cat.key === "holidays") {
        items = (!named.length && plain.length) ? [{ name: "", fact: plain[0].fact }] : named;
      }
      renderCategory(cat, items, key);
    });
  }
}

function renderCategory(cat, items, key) {
  const section = document.createElement("div");
  section.className   = "cat-section";
  section.dataset.cat = cat.key;

  const header = document.createElement("button");
  header.className = "cat-header";
  header.setAttribute("aria-expanded", catOpen[cat.key]);

  const left    = document.createElement("span");
  left.className = "cat-header-left";

  const iconEl  = document.createElement("span");
  iconEl.className = "cat-icon";
  iconEl.innerHTML = cat.icon;

  const labelEl = document.createElement("span");
  labelEl.className   = "cat-label";
  labelEl.textContent = cat.label;

  const countEl = document.createElement("span");
  countEl.className   = "cat-count";
  countEl.textContent = items.length;

  left.append(iconEl, labelEl, countEl);

  const arrow = document.createElement("span");
  arrow.className = "cat-arrow";
  arrow.innerHTML = `<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 4l4 4 4-4"/></svg>`;

  header.append(left, arrow);
  section.appendChild(header);

  const body = document.createElement("div");
  body.className = "cat-body";
  if (!catOpen[cat.key]) body.style.display = "none";

  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className   = "cat-empty";
    empty.textContent = "ინფორმაცია დაემატება უმოკლეს დროში";
    body.appendChild(empty);
  } else {
    items.forEach((h, idx) => {
      const sig = Math.abs(
        (key + cat.key + idx).split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0)
      );
      body.appendChild(buildEventCard(h, sig));
    });
  }

  section.appendChild(body);
  elList.appendChild(section);

  header.addEventListener("click", () => {
    const open = catOpen[cat.key] = !catOpen[cat.key];
    header.setAttribute("aria-expanded", open);
    section.classList.toggle("is-open", open);
    if (open) {
      body.style.display = "";
      body.classList.add("cat-body-anim");
      setTimeout(() => body.classList.remove("cat-body-anim"), 380);
    } else {
      body.style.display = "none";
    }
  });

  if (catOpen[cat.key]) section.classList.add("is-open");
}

function makeImgWrap(query, sig, label) {
  const imgWrap = document.createElement("div");
  imgWrap.className = "ev-img";

  const ph = document.createElement("div");
  ph.className   = "ev-img-ph";
  ph.textContent = "✦";

  const img = document.createElement("img");
  img.alt     = label || "";
  img.loading = "lazy";
  img.src     = makePlaceholderUrl(sig);
  img.addEventListener("load",  () => img.classList.add("loaded"));
  img.addEventListener("error", () => { img.style.display = "none"; });
  imgWrap.append(ph, img);

  fetchWikimediaImg(query).then(src => {
    if (src) {
      const t = new Image();
      t.onload = () => { img.src = src; };
      t.src = src;
    }
  });

  return imgWrap;
}

function buildEventCard(h, sig) {
  const evCard = document.createElement("div");
  evCard.className = "event-card";

  const imgLeft    = makeImgWrap(h.img || h.name, sig, h.name);
  const rightQuery = h.img2 || h.img || h.name;
  const sig2       = h.img2 ? (sig * 1000003) >>> 0 : sig;
  const imgRight   = makeImgWrap(rightQuery, sig2, h.name);

  const evBody = document.createElement("div");
  evBody.className = "ev-body";

  const nameEl = document.createElement("div");
  nameEl.className   = "ev-name";
  nameEl.textContent = h.name || "";

  const factEl = document.createElement("div");
  factEl.className   = "ev-fact";
  factEl.textContent = h.fact || "";

  evBody.append(nameEl, factEl);
  evCard.append(imgLeft, evBody, imgRight);
  return evCard;
}

/* ─── მინი-კალენდარი ── */
function renderMiniCal() {
  mcTitle.textContent = `${MONTHS_NOM[mcMonth]} ${mcYear}`;

  const firstDow    = new Date(mcYear, mcMonth, 1).getDay();
  const startDow    = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = new Date(mcYear, mcMonth + 1, 0).getDate();
  const daysInPrev  = new Date(mcYear, mcMonth,     0).getDate();

  mcGrid.innerHTML = "";

  const todayKey = dateKey(today);
  const selKey   = dateKey(current);

  for (let i = startDow - 1; i >= 0; i--) {
    const btn = document.createElement("button");
    btn.className   = "mc-day other-month";
    btn.textContent = daysInPrev - i;
    const d = new Date(mcYear, mcMonth - 1, daysInPrev - i);
    btn.addEventListener("click", () => jumpTo(d));
    mcGrid.appendChild(btn);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const btn  = document.createElement("button");
    btn.className   = "mc-day";
    btn.textContent = d;

    const dt  = new Date(mcYear, mcMonth, d);
    const k   = dateKey(dt);
    const dow = dt.getDay();

    if (dow === 0 || dow === 6) btn.classList.add("wknd");
    if (k === todayKey)         btn.classList.add("is-today");
    if (k === selKey)           btn.classList.add("selected");
    if (HOLIDAY_KEYS.has(k))   btn.classList.add("has-holiday");

    btn.addEventListener("click", () => jumpTo(dt));
    mcGrid.appendChild(btn);
  }

  const tail = (7 - ((startDow + daysInMonth) % 7)) % 7;
  for (let d = 1; d <= tail; d++) {
    const btn = document.createElement("button");
    btn.className   = "mc-day other-month";
    btn.textContent = d;
    const dt = new Date(mcYear, mcMonth + 1, d);
    btn.addEventListener("click", () => jumpTo(dt));
    mcGrid.appendChild(btn);
  }
}

/* ─── განახლება ── */
async function update(d, instant) {
  if (!instant && dayCard) {
    dayCard.classList.add("fade-out");
    await delay(175);
  }

  const key  = dateKey(d);
  const data = await loadDay(key);

  renderDate(d);
  renderHolidays(key, data);

  if (mcYear !== d.getFullYear() || mcMonth !== d.getMonth()) {
    mcYear  = d.getFullYear();
    mcMonth = d.getMonth();
  }
  renderMiniCal();

  if (!instant && dayCard) dayCard.classList.remove("fade-out");
}

/* ─── ნავიგაცია ── */
const step    = n => { current.setDate(current.getDate() + n); update(current); };
const jumpTo  = d => { current = new Date(d); current.setHours(0,0,0,0); update(current); };
const goToday = () => { current = new Date(today); current.setHours(0,0,0,0); update(current); };

document.getElementById("btn-prev").addEventListener("click",  () => step(-1));
document.getElementById("btn-next").addEventListener("click",  () => step(+1));
document.getElementById("btn-today").addEventListener("click", goToday);

document.getElementById("mc-prev").addEventListener("click", () => {
  if (--mcMonth < 0) { mcMonth = 11; mcYear--; }
  renderMiniCal();
});
document.getElementById("mc-next").addEventListener("click", () => {
  if (++mcMonth > 11) { mcMonth = 0; mcYear++; }
  renderMiniCal();
});

/* ─── ინიციალიზაცია ── */
update(current, true);

/* ─── თემა ── */
(function() {
  const html  = document.documentElement;
  const btn   = document.getElementById("theme-toggle");
  const saved = localStorage.getItem("cal-theme") || "light";
  html.setAttribute("data-theme", saved);
  if (btn) {
    btn.addEventListener("click", () => {
      const next = html.getAttribute("data-theme") === "light" ? "dark" : "light";
      html.setAttribute("data-theme", next);
      try { localStorage.setItem("cal-theme", next); } catch(e) {}
    });
  }
})();

/* ─── სარეკლამო ბანერები ── */
(function() {
  const slides = document.querySelectorAll('.ad-slide');
  const dots   = document.querySelectorAll('.ad-dot');
  if (!slides.length) return;

  let adCurrent = 0;
  let timer;

  function goToSlide(index) {
    slides[adCurrent].classList.remove('active');
    dots[adCurrent].classList.remove('active');
    adCurrent = index;
    slides[adCurrent].classList.add('active');
    dots[adCurrent].classList.add('active');
    resetTimer();
  }

  function next() {
    goToSlide((adCurrent + 1) % slides.length);
  }

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(next, 4000);
  }

  window.goToSlide = goToSlide;
  timer = setInterval(next, 4000);
})();
