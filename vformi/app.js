/* V FORMI — mobilna logika. localStorage. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = {
    get: (k, d) => { try { const v = localStorage.getItem("vf_" + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set: (k, v) => localStorage.setItem("vf_" + k, JSON.stringify(v)),
  };
  const toast = (m) => { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("show"), 2400); };
  const esc = (s) => String(s).replace(/[&<>"]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /* WhatsApp številke (PLACEHOLDER — zamenjaj s pravimi) */
  const WA = { moski: "38640111111", zenska: "38640222222" };

  /* ---------- Datum ---------- */
  let cursor = new Date();
  const dayKey = (d = cursor) => d.toISOString().slice(0, 10);
  function dayLabel() {
    const diff = Math.round((new Date(dayKey()) - new Date(new Date().toISOString().slice(0, 10))) / 864e5);
    return diff === 0 ? "Danes" : diff === -1 ? "Včeraj" : diff === 1 ? "Jutri" : cursor.toLocaleDateString("sl-SI", { weekday: "short", day: "numeric", month: "short" });
  }

  /* ---------- Splash ---------- */
  window.addEventListener("load", () => {
    setTimeout(() => $("#splash").classList.add("done"), 1900);
    setTimeout(() => { $("#splash").remove(); if (!store.get("profile")) openWizard(); }, 2500);
  });

  /* ---------- WIZARD ---------- */
  const wizData = {};
  let wizStep = 0;
  const wizSteps = () => $$(".wstep");
  // korak je viden, če nima data-only ali če trenutni cilj ustreza
  const stepVisible = (s) => { const only = s.dataset.only; return !only || only.split(",").includes(wizData.cilj); };
  function openWizard() { wizStep = 0; showWizStep(); $("#wizard").classList.add("open"); }
  function showWizStep() {
    const steps = wizSteps();
    steps.forEach((s, i) => s.classList.toggle("is-active", i === wizStep));
    const visible = steps.filter(stepVisible);
    const pos = visible.indexOf(steps[wizStep]);
    $("#wizBar").style.width = ((pos + 1) / visible.length * 100) + "%";
    $("#wizBack").style.visibility = wizStep === 0 ? "hidden" : "visible";
    $("#wizNext").textContent = (steps[wizStep] === visible[visible.length - 1]) ? "Pripravi moj načrt 🚀" : "Naprej";
  }
  $$(".optbig button, .optcol button").forEach(b => b.onclick = () => {
    const field = b.closest("[data-field]").dataset.field;
    wizData[field] = b.dataset.val;
    $$("[data-field='" + field + "'] button").forEach(x => x.classList.toggle("is-sel", x === b));
    setTimeout(() => $("#wizNext").click(), 180);
  });
  $$("[data-skip]").forEach(b => b.onclick = () => { wizData[b.dataset.skip] = ""; advance(); });
  $("#wizBack").onclick = () => { for (let i = wizStep - 1; i >= 0; i--) { if (stepVisible(wizSteps()[i])) { wizStep = i; return showWizStep(); } } };
  $("#wizNext").onclick = () => {
    const cur = wizSteps()[wizStep];
    for (const inp of $$("input", cur)) { if (inp.required && !inp.value) { inp.focus(); return toast("Izpolni polje"); } if (inp.name) wizData[inp.name] = inp.value; }
    const fieldEl = $("[data-field]", cur);
    if (fieldEl && !wizData[fieldEl.dataset.field]) return toast("Izberi možnost");
    advance();
  };
  function advance() {
    const steps = wizSteps();
    for (let i = wizStep + 1; i < steps.length; i++) { if (stepVisible(steps[i])) { wizStep = i; return showWizStep(); } }
    finishWizard();
  }
  function finishWizard() {
    const d = { ...wizData }; d.starost = +d.starost; d.visina = +d.visina; d.teza = +d.teza;
    if (!d.nivo) d.nivo = "zacetnik";
    d.kgLose = +d.kgLose || 0; d.okvir = +d.okvir || 12; d.bf = +d.bf || null;
    store.set("profile", d);
    store.set("calc", calcProfile(d));
    store.set("plan_meta", buildPlanMeta(d));
    if (!store.get("trialStart")) store.set("trialStart", Date.now());   // 3-dnevni preizkus
    if (d.sync) { const steps = 4000 + Math.floor(Math.random() * 8000); store.set("steps_" + dayKey(), steps); }   // simuliran uvoz korakov
    $("#wizard").classList.remove("open");
    syncProfileForm(); renderAll(); renderPlans();
    if (ALL_ACCESS) { nav("dashboard"); toast(`Pozdravljen, ${d.ime}! Polni dostop odklenjen ✅`); }
    else { $("#paywallHi").innerHTML = `Tvoj načrt je pripravljen, ${esc(d.ime)}. <span>Začni s preizkusom.</span>`; nav("paywall"); toast("Vse pripravljeno, " + d.ime + "! 💪"); }
  }

  /* ---------- TDEE + deficit/presežek ---------- */
  function calcProfile(d) {
    // Katch-McArdle (če poznamo % maščobe — natančnejše), sicer Mifflin-St Jeor
    let bmr;
    if (d.bf && d.bf > 3 && d.bf < 60) { const lbm = d.teza * (1 - d.bf / 100); bmr = 370 + 21.6 * lbm; }
    else bmr = 10 * d.teza + 6.25 * d.visina - 5 * d.starost + (d.spol === "moski" ? 5 : -161);
    bmr = Math.round(bmr);
    const tdee = bmr * parseFloat(d.trening);
    const okvir = +d.okvir || 12;
    let target, deficit = 0;
    if (d.cilj === "hujsanje") {
      const kg = +d.kgLose || 5;
      let perDay = kg * 7700 / (okvir * 7);            // potrebni deficit/dan
      perDay = Math.min(perDay, 0.27 * tdee);          // varna meja ~27 %
      target = Math.max(Math.round((tdee - perDay) / 10) * 10, Math.round(Math.max(1200, bmr * 1.05) / 10) * 10);
      deficit = Math.round(tdee - target);
    } else if (d.cilj === "misice" && d.podcilj === "masa") {
      const surplus = Math.round(tdee * 0.12);          // lean bulk
      target = Math.round((tdee + surplus) / 10) * 10; deficit = -surplus;
    } else { // oblikovanje / vzdrzevanje
      target = Math.round(tdee / 10) * 10;
    }
    const lean = d.cilj === "misice" && d.podcilj === "masa";
    const p = Math.round(d.teza * (lean ? 1.8 : 2.0));
    const f = Math.round(d.teza * 0.9);
    const c = Math.max(0, Math.round((target - (p * 4 + f * 9)) / 4));
    const bmi = d.teza / Math.pow(d.visina / 100, 2);
    const catn = bmi < 18.5 ? "podhranjenost" : bmi < 25 ? "normalna teža" : bmi < 30 ? "prekomerna teža" : "debelost";
    return { bmr, tdee: Math.round(tdee), target, deficit, p, c, f, bmi: bmi.toFixed(1), cat: catn, ratePerWeek: +(deficit * 7 / 7700).toFixed(2), method: (d.bf ? "Katch-McArdle" : "Mifflin-St Jeor") };
  }
  function buildPlanMeta(d) {
    const c = calcProfile(d), okvir = +d.okvir || 12;
    let goalWeight = d.teza, desc = "";
    if (d.cilj === "hujsanje") {
      goalWeight = +(d.teza - (+d.kgLose || 5)).toFixed(1);
      const realWeeks = Math.ceil((+d.kgLose || 5) * 7700 / (c.deficit * 7)) || okvir;
      desc = `Za izgubo <b>${d.kgLose} kg</b> moraš biti v deficitu <b>${c.deficit} kcal/dan</b>. Tvoj dnevni cilj je <b>${c.target} kcal</b> (≈ ${c.ratePerWeek} kg/teden). Pri tem tempu cilj dosežeš v približno <b>${realWeeks} tednih</b>. Trening: 3× moč/teden za ohranjanje mišic ob hujšanju.`;
    } else if (d.cilj === "misice" && d.podcilj === "masa") {
      goalWeight = +(d.teza + 0.25 * okvir).toFixed(1);
      desc = `Za rast mišic si v rahlem presežku <b>+${-c.deficit} kcal/dan</b>. Dnevni cilj <b>${c.target} kcal</b>, beljakovine <b>${c.p} g</b>. Trening: 3–4× moč/teden + progresivna obremenitev.`;
    } else if (d.cilj === "misice") {
      desc = `Rekompozicija: ostani okrog vzdrževanja <b>${c.target} kcal</b>, a z visokimi beljakovinami (<b>${c.p} g</b>) in rednim treningom moči — mišice gor, maščoba dol.`;
    } else {
      desc = `Vzdržuješ pri <b>${c.target} kcal</b>. Cilj: konsistenca, dovolj gibanja in beljakovin (<b>${c.p} g</b>) za zdravje in ohranjanje mišic.`;
    }
    return { goalWeight, startWeight: d.teza, desc };
  }
  const goalKcal = () => store.get("calc")?.target || 2000;

  /* ---------- 3-DNEVNI PREIZKUS ---------- */
  const TRIAL_MS = 3 * 864e5;
  const trialActive = () => { const t = store.get("trialStart"); return t && (Date.now() - t) < TRIAL_MS; };
  const trialDaysLeft = () => { const t = store.get("trialStart"); return t ? Math.max(0, Math.ceil((TRIAL_MS - (Date.now() - t)) / 864e5)) : 0; };

  /* ---------- Profil form ---------- */
  const form = $("#profileForm");
  function syncProfileForm() { const p = store.get("profile"); if (!p) return; for (const [k, v] of Object.entries(p)) if (form.elements[k]) form.elements[k].value = v; const r = store.get("calc"); if (r) renderProfileResult(r); }
  function renderProfileResult(r) {
    $("#tdeeKcal").textContent = r.target; $("#mP").textContent = r.p + "g"; $("#mC").textContent = r.c + "g"; $("#mF").textContent = r.f + "g";
    $("#bmiNote").innerHTML = `Bazalni metabolizem (BMR): <b>${r.bmr} kcal</b> · Poraba z aktivnostjo (TDEE): <b>${r.tdee} kcal</b><br>${r.deficit > 0 ? "Deficit" : r.deficit < 0 ? "Presežek" : "Vzdrževanje"}: <b>${Math.abs(r.deficit) || 0} kcal/dan</b> → cilj <b>${r.target} kcal</b> · ITM ${r.bmi} (${r.cat})<br><span class="small">Metoda: ${r.method}.</span>`; $("#profileResult").classList.remove("hidden");
  }
  form.addEventListener("submit", e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form)); d.starost = +d.starost; d.visina = +d.visina; d.teza = +d.teza;
    store.set("profile", d); store.set("calc", calcProfile(d)); renderProfileResult(store.get("calc"));
    renderAll(); toast("Profil shranjen ✅");
  });

  /* ---------- Navigacija ---------- */
  function nav(name) {
    $$(".page").forEach(p => p.classList.toggle("is-active", p.id === "page-" + name));
    $$(".navbtn").forEach(b => b.classList.toggle("is-active", b.dataset.nav === name));
    $("#screen").scrollTop = 0;
    if (name === "dashboard") renderDashboard();
    if (name === "blog") renderBlog();
    if (name === "treningi") renderTreningi();
    if (name === "recepti") renderRecipes();
    if (name === "progres") { drawWeight("#weightChart2", "#weightTrend2"); renderBodies(); renderWA(); restoreProgress(); renderExProgress(); }
    if (name === "pro" || name === "paywall") renderPlans();
    if (name === "story") renderStory();
  }
  $("#continueFree").onclick = () => nav("dashboard");
  $$(".navbtn").forEach(b => b.onclick = () => nav(b.dataset.nav));
  document.addEventListener("click", e => {
    const go = e.target.closest("[data-go]"); if (go) return nav(go.dataset.go);
    const back = e.target.closest("[data-back]"); if (back) return nav(back.dataset.back);
  });
  $("#openProfile").onclick = () => nav("profil"); $("#openProfile2").onclick = () => nav("profil");
  $("#restartWizard").onclick = () => { Object.keys(wizData).forEach(k => delete wizData[k]); $$(".optbig button,.optcol button").forEach(x => x.classList.remove("is-sel")); $$("#wizForm input").forEach(i => i.value = ""); openWizard(); };

  /* ---------- Dan ---------- */
  $("#dayPrev").onclick = () => { cursor = new Date(cursor - 864e5); renderDashboard(); };
  $("#dayNext").onclick = () => { cursor = new Date(+cursor + 864e5); renderDashboard(); };

  /* ---------- Dnevnik hrane ---------- */
  const MEALS = [["zajtrk", "🌅 Zajtrk"], ["kosilo", "🍽️ Kosilo"], ["vecerja", "🌙 Večerja"], ["prigrizki", "🍎 Prigrizki"]];
  const diaryOf = (d = dayKey()) => store.get("diary_" + d, { zajtrk: [], kosilo: [], vecerja: [], prigrizki: [] });
  const saveDiary = (o, d = dayKey()) => store.set("diary_" + d, o);
  function foodTotals(d = dayKey()) { const di = diaryOf(d); let k = 0, p = 0, c = 0, f = 0; MEALS.forEach(([m]) => di[m].forEach(i => { k += i.kcal; p += i.p; c += i.c; f += i.f; })); return { kcal: Math.round(k), p: Math.round(p), c: Math.round(c), f: Math.round(f) }; }
  const exOf = (d = dayKey()) => store.get("ex_" + d, { kcal: 0, min: 0 });
  const stepsOf = (d = dayKey()) => store.get("steps_" + d, 0);

  /* ---------- DASHBOARD ---------- */
  function renderDashboard() {
    const p = store.get("profile");
    $("#greet").textContent = p?.ime ? `Pozdravljen, ${p.ime}! 👋` : "";
    $("#dayLabel").textContent = dayLabel();
    const steps = stepsOf(), stepsKcal = Math.round(steps * 0.04);
    const goal = goalKcal(), food = foodTotals(), ex = exOf(), burn = ex.kcal + stepsKcal, remain = goal - food.kcal + burn;
    $("#statGoal").textContent = goal; $("#statFood").textContent = food.kcal; $("#statEx").textContent = burn; $("#ringRemain").textContent = remain;
    const C = 2 * Math.PI * 86, frac = Math.min(food.kcal / (goal + burn || 1), 1), fg = $("#ringFg");
    fg.style.strokeDasharray = C; fg.style.strokeDashoffset = C * (1 - frac);
    fg.style.stroke = remain < 0 ? "#ff5d5d" : food.kcal / goal > 0.9 ? "#9bd64a" : "#39d98a";
    const calc = store.get("calc"), tg = calc ? { p: calc.p, c: calc.c, f: calc.f } : { p: 130, c: 220, f: 70 };
    $("#macroBars").innerHTML = [["Beljakovine", food.p, tg.p, "#39d98a"], ["OH", food.c, tg.c, "#9bd64a"], ["Maščobe", food.f, tg.f, "#e0a14b"]]
      .map(([n, v, t, col]) => `<div class="mbar"><div class="mbar__top"><span>${n}</span><b>${v}/${t} g</b></div><div class="mbar__track"><i style="width:${Math.min(100, v / t * 100)}%;background:${col}"></i></div></div>`).join("");
    $("#dashSteps").textContent = steps.toLocaleString("sl-SI"); $("#stepsBar").style.width = Math.min(100, steps / 100) + "%";
    $("#dashExCal").textContent = burn + " kcal"; $("#dashExMin").textContent = "≈ " + stepsKcal + " kcal iz korakov";
    $("#diaryGoal").textContent = goal; $("#diaryEaten").textContent = food.kcal;
    renderMeals(); renderTrialBanner(); renderPlanCard(); renderRecMeals();
  }
  function renderTrialBanner() {
    const el = $("#trialBanner"); if (!el) return;
    if (ALL_ACCESS) { el.innerHTML = `<div class="trialbar">✓ <b>Polni dostop</b> — vse storitve odklenjene</div>`; return; }
    const fullyOwned = store.get("plan") === "premium" || (plans().treningi && plans().recepti && plans().trener);
    if (trialActive() && !fullyOwned) el.innerHTML = `<button class="trialbar" data-go="pro">🎁 Brezplačni preizkus — še <b>${trialDaysLeft()}</b> ${trialDaysLeft() === 1 ? "dan" : "dni"} · poglej pakete ›</button>`;
    else el.innerHTML = "";
  }
  function renderPlanCard() {
    const el = $("#planCard"), meta = store.get("plan_meta"); if (!el) return;
    if (!meta) { el.innerHTML = ""; return; }
    el.innerHTML = `<div class="card plancard"><div class="cardhead"><h4>🎯 Tvoj načrt</h4></div>
      <p class="plandesc">${meta.desc}</p>
      <p class="muted small">Tehtaj se 1× tedensko — cilj samodejno prilagodimo tvojemu napredku.</p>
      <button class="btn btn--ghost block" data-go="treningi">Odpri priporočen trening</button></div>`;
  }
  function renderRecMeals() {
    const el = $("#recMeals"); if (!el) return;
    const goal = store.get("profile")?.cilj, pod = store.get("profile")?.podcilj;
    const cat = goal === "hujsanje" ? "hujsanje" : (goal === "misice" && pod === "masa") ? "bulk" : goal === "misice" ? "zdravo" : "zdravo";
    const pool = (window.RECIPES || []).filter(r => r.cat === cat);
    if (!pool.length) { el.innerHTML = ""; return; }
    const seed = new Date().getDate();
    const pick = [pool[seed % pool.length], pool[(seed * 3 + 1) % pool.length], pool[(seed * 7 + 2) % pool.length]].filter((v, i, a) => a.indexOf(v) === i);
    el.innerHTML = `<div class="card"><div class="cardhead"><h4>🍽️ Priporočeni obroki danes</h4></div>
      ${pick.map(r => `<button class="recmini" data-recpick='${esc(JSON.stringify({ cat: r.cat, name: r.name }))}'>
        <span class="recmini__em" style="background:${recGrad(r.cat)}">${r.emoji}</span>
        <span class="recmini__t"><b>${r.name}</b><small>${r.kcal} kcal · B ${r.p}g · ${r.time} min</small></span><span class="chevr">›</span></button>`).join("")}</div>`;
  }
  document.addEventListener("click", e => { const b = e.target.closest("[data-recpick]"); if (!b) return; const o = JSON.parse(b.dataset.recpick); const r = (window.RECIPES || []).find(x => x.cat === o.cat && x.name === o.name); if (r) openRecipe(r); });
  function renderMeals() {
    const di = diaryOf();
    $("#meals").innerHTML = MEALS.map(([key, label]) => {
      const items = di[key], sum = Math.round(items.reduce((s, i) => s + i.kcal, 0));
      return `<div class="meal"><div class="meal__head"><b>${label}</b><span>${sum} kcal</span></div>
        <ul class="meal__list">${items.map((it, i) => `<li><span>${esc(it.name)} <small>${it.grams || ""}${it.grams ? "g" : ""}</small></span><b>${Math.round(it.kcal)}</b><button class="del" data-meal="${key}" data-i="${i}">✕</button></li>`).join("") || '<li class="muted empty">—</li>'}</ul>
        <button class="meal__add" data-addmeal="${key}">+ Dodaj</button></div>`;
    }).join("");
  }
  $("#meals").addEventListener("click", e => {
    const del = e.target.closest(".del"); if (del) { const di = diaryOf(); di[del.dataset.meal].splice(+del.dataset.i, 1); saveDiary(di); renderDashboard(); return; }
    const add = e.target.closest("[data-addmeal]"); if (add) openSheet(add.dataset.addmeal);
  });

  /* ---------- SHEET ---------- */
  let curMeal = "zajtrk";
  function openSheet(meal) {
    curMeal = meal || pickMeal();
    $("#mealPick").innerHTML = MEALS.map(([k, l]) => `<button class="chip ${k === curMeal ? "is-sel" : ""}" data-meal="${k}">${l}</button>`).join("");
    $("#foodSearch").value = ""; renderFoodResults(""); $("#sheet").classList.add("open"); setTimeout(() => $("#foodSearch").focus(), 200);
  }
  const pickMeal = () => { const h = new Date().getHours(); return h < 11 ? "zajtrk" : h < 15 ? "kosilo" : h < 21 ? "vecerja" : "prigrizki"; };
  $("#fabAdd").onclick = () => openSheet();
  $("#sheetClose").onclick = () => $("#sheet").classList.remove("open");
  $("#mealPick").addEventListener("click", e => { const c = e.target.closest(".chip"); if (!c) return; curMeal = c.dataset.meal; $$("#mealPick .chip").forEach(x => x.classList.toggle("is-sel", x === c)); });
  $("#foodSearch").addEventListener("input", e => renderFoodResults(e.target.value));
  function renderFoodResults(q) {
    q = q.trim().toLowerCase(); let items = window.FOODS; if (q) items = items.filter(f => f[0].toLowerCase().includes(q));
    const rec = store.get("recentFoods", []);
    const head = (!q && rec.length) ? `<div class="reslabel">Nazadnje</div>` + rec.slice(0, 5).map(foodRow).join("") + `<div class="reslabel">Vsa hrana (${window.FOODS.length})</div>` : "";
    $("#foodResults").innerHTML = head + items.slice(0, 60).map(foodRow).join("") + (items.length ? "" : `<div class="muted empty">Ni zadetkov. Skeniraj kodo.</div>`);
  }
  const foodRow = (f) => `<button class="foodrow" data-food='${esc(JSON.stringify(f))}'><span class="foodrow__name">${esc(f[0])}</span><span class="foodrow__kcal">${f[1]} kcal<small>/100g</small></span></button>`;
  $("#foodResults").addEventListener("click", e => { const r = e.target.closest(".foodrow"); if (r) openPortion(JSON.parse(r.dataset.food)); });

  /* ---------- PORTION ---------- */
  let pending = null;
  function openPortion(f) { pending = f; $("#portionName").textContent = f[0]; $("#portionPer").textContent = `${f[1]} kcal · B ${f[2]} · OH ${f[3]} · M ${f[4]} (na 100 g)`; $("#portionGrams").value = 100; updPortion(); $("#portionModal").classList.add("open"); }
  function updPortion() { const k = (+$("#portionGrams").value || 0) / 100; $("#portionCalc").innerHTML = `<b>${Math.round(pending[1] * k)} kcal</b> · B ${(pending[2] * k).toFixed(1)} · OH ${(pending[3] * k).toFixed(1)} · M ${(pending[4] * k).toFixed(1)}`; }
  $("#portionGrams").addEventListener("input", updPortion);
  $("#portionCancel").onclick = () => $("#portionModal").classList.remove("open");
  $("#portionAdd").onclick = () => {
    const g = +$("#portionGrams").value || 0; if (!g) return toast("Vnesi gramaturo"); const k = g / 100, di = diaryOf();
    di[curMeal].push({ name: pending[0], grams: g, kcal: pending[1] * k, p: pending[2] * k, c: pending[3] * k, f: pending[4] * k }); saveDiary(di);
    const rec = store.get("recentFoods", []).filter(x => x[0] !== pending[0]); rec.unshift(pending); store.set("recentFoods", rec.slice(0, 10));
    $("#portionModal").classList.remove("open"); $("#sheet").classList.remove("open"); renderDashboard(); nav("dashboard"); toast(pending[0] + " dodano ✅");
  };

  /* ---------- OCENA IZ SLIKE (deluje: vodena ocena) ---------- */
  const EST = { solata: [250, 12, 15, 16], zajtrk: [400, 18, 45, 16], kroznik: [650, 45, 55, 25], testenine: [600, 22, 80, 20], hitra: [820, 30, 75, 42], juha: [220, 10, 25, 8], sladica: [450, 7, 60, 20], sadje: [120, 1.5, 28, 0.5] };
  let estSize = 1, estData = null;
  $("#photoEstBtn").onclick = () => { $("#foodPhoto").value = ""; $("#photoPreview").classList.add("hidden"); $("#photoStep2").classList.add("hidden"); $("#photoAdd").classList.add("hidden"); $("#photoModal").classList.add("open"); };
  $("#photoCancel").onclick = () => $("#photoModal").classList.remove("open");
  $("#foodPhoto").onchange = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const img = $("#photoPreview"); img.src = URL.createObjectURL(f); img.classList.remove("hidden");
    $("#photoStep2").classList.remove("hidden"); $("#photoAdd").classList.remove("hidden"); calcEst();
  };
  $("#estType").onchange = calcEst;
  $("#estSize").addEventListener("click", e => { const c = e.target.closest(".chip"); if (!c) return; estSize = +c.dataset.s; $$("#estSize .chip").forEach(x => x.classList.toggle("is-sel", x === c)); calcEst(); });
  function calcEst() {
    const t = $("#estType").value, b = EST[t], k = estSize;
    estData = { name: "Obrok s slike (" + $("#estType").selectedOptions[0].text.toLowerCase() + ")", kcal: Math.round(b[0] * k), p: b[1] * k, c: b[2] * k, f: b[3] * k };
    $("#estResult").innerHTML = `Ocena: <b>${estData.kcal} kcal</b> · B ${estData.p.toFixed(0)} · OH ${estData.c.toFixed(0)} · M ${estData.f.toFixed(0)}`;
  }
  $("#photoAdd").onclick = () => {
    if (!estData) return; const di = diaryOf(); di[pickMeal()].push({ ...estData, grams: "" }); saveDiary(di);
    $("#photoModal").classList.remove("open"); renderDashboard(); toast("Dodano iz slike ✅");
  };

  /* ---------- SKENER ---------- */
  let stream = null, scanning = false;
  $("#openScan").onclick = startScan; $("#scanClose").onclick = stopScan;
  async function startScan() {
    $("#scanner").classList.add("open"); $("#scanStatus").textContent = "Vklapljam kamero…";
    if (!("BarcodeDetector" in window)) $("#scanStatus").innerHTML = "Brskalnik ne podpira skeniranja.<br>Vnesi kodo ročno 👇";
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      const v = $("#scanVideo"); v.srcObject = stream; await v.play(); $("#scanStatus").textContent = "Usmeri kamero v črtno kodo…";
      if ("BarcodeDetector" in window) { const det = new BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"] }); scanning = true; loopScan(det, v); }
    } catch { $("#scanStatus").innerHTML = "Ni dostopa do kamere.<br>Vnesi kodo ročno 👇"; }
  }
  async function loopScan(det, v) { if (!scanning) return; try { const c = await det.detect(v); if (c.length) { scanning = false; return lookupBarcode(c[0].rawValue); } } catch { } requestAnimationFrame(() => loopScan(det, v)); }
  function stopScan() { scanning = false; if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; } $("#scanner").classList.remove("open"); }
  $("#manualLookup").onclick = () => { const c = $("#manualBarcode").value.trim(); if (c) lookupBarcode(c); };
  async function lookupBarcode(code) {
    $("#scanStatus").textContent = "Iščem izdelek (" + code + ")…";
    try {
      const r = await fetch(`https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(code)}.json`); const d = await r.json();
      if (d.status === 1 && d.product) {
        const p = d.product, n = p.nutriments || {};
        const food = [p.product_name || ("Izdelek " + code), Math.round(n["energy-kcal_100g"] || (n["energy_100g"] ? n["energy_100g"] / 4.184 : 0)) || 0, +(n.proteins_100g || 0), +(n.carbohydrates_100g || 0), +(n.fat_100g || 0)];
        if (!food[1]) return $("#scanStatus").textContent = "Ni podatka o kalorijah. Poskusi drugega.";
        stopScan(); openPortion(food); toast("Najdeno: " + food[0]);
      } else $("#scanStatus").textContent = "Izdelka ni v bazi. Vnesi ročno.";
    } catch { $("#scanStatus").textContent = "Ni povezave do baze (rabi internet)."; }
  }

  /* ---------- VADBA (kcal) ---------- */
  $("#addExercise").onclick = () => $("#exModal").classList.add("open");
  $("#exCancel").onclick = () => $("#exModal").classList.remove("open");
  $("#exSave").onclick = () => { const met = +$("#exType").value, min = +$("#exMin").value || 0, teza = store.get("profile")?.teza || 80, kcal = Math.round(met * teza * (min / 60)); const ex = exOf(); ex.kcal += kcal; ex.min += min; store.set("ex_" + dayKey(), ex); $("#exModal").classList.remove("open"); renderDashboard(); toast(`+${kcal} kcal 🔥`); };

  /* ---------- SYNC ---------- */
  $("#syncApple").onclick = () => simSync("Apple Health"); $("#syncGoogle").onclick = () => simSync("Google Fit");
  function simSync(name) { const steps = 4000 + Math.floor(Math.random() * 8000), min = 15 + Math.floor(Math.random() * 45), teza = store.get("profile")?.teza || 80; store.set("steps_" + dayKey(), steps); const ex = exOf(); ex.kcal += Math.round(7 * teza * (min / 60)); ex.min += min; store.set("ex_" + dayKey(), ex); $("#stepsToday").value = steps; $("#sportToday").value = min; renderDashboard(); toast(`${name} povezan ✅ (${steps} korakov)`); }
  $("#stepsToday").oninput = e => { store.set("steps_" + dayKey(), +e.target.value || 0); renderDashboard(); };

  /* ---------- TEŽA ---------- */
  function quickWeigh() {
    const v = prompt("Današnja teža (kg):"); if (!v) return;
    const kg = parseFloat(v.replace(",", ".")); if (!kg) return toast("Neveljaven vnos");
    const w = store.get("weights", []).filter(x => x.d !== dayKey()); w.push({ d: dayKey(), kg }); w.sort((a, b) => a.d < b.d ? -1 : 1); store.set("weights", w);
    const p = store.get("profile"); let msg = "Teža shranjena ⚖️";
    if (p) {
      const before = store.get("calc")?.target;
      p.teza = kg; store.set("profile", p);
      store.set("calc", calcProfile(p)); store.set("plan_meta", buildPlanMeta(p));
      if (form.elements.teza) form.elements.teza.value = kg;
      const after = store.get("calc").target;
      if (before && after !== before) msg = `Cilj prilagojen: ${after} kcal/dan (prej ${before}) 🎯`;
    }
    drawWeight("#weightChart2", "#weightTrend2"); renderDashboard(); toast(msg);
  }
  $("#quickWeigh").onclick = quickWeigh;
  function drawWeight(cvSel, trendSel) {
    const w = store.get("weights", []), cv = $(cvSel); if (!cv) return; const ctx = cv.getContext("2d"), W = cv.width = cv.offsetWidth || 320, H = cv.height; ctx.clearRect(0, 0, W, H);
    if (!w.length) { if ($(trendSel)) $(trendSel).textContent = "Še ni vnosov — dodaj prvo tehtanje."; return; }
    const vals = w.map(x => x.kg), min = Math.min(...vals) - 1, max = Math.max(...vals) + 1, X = i => 24 + i * (W - 44) / Math.max(1, w.length - 1), Y = v => H - 18 - (v - min) / (max - min || 1) * (H - 36);
    ctx.strokeStyle = "#39d98a"; ctx.lineWidth = 2.5; ctx.beginPath(); w.forEach((p, i) => i ? ctx.lineTo(X(i), Y(p.kg)) : ctx.moveTo(X(i), Y(p.kg))); ctx.stroke();
    ctx.fillStyle = "#39d98a"; w.forEach((p, i) => { ctx.beginPath(); ctx.arc(X(i), Y(p.kg), 3.2, 0, 7); ctx.fill(); });
    const diff = vals[vals.length - 1] - vals[0]; if ($(trendSel)) $(trendSel).textContent = w.length > 1 ? `Sprememba: ${diff > 0 ? "+" : ""}${diff.toFixed(1)} kg (${w.length} vnosov)` : `Začetna teža: ${vals[0]} kg`;
  }

  /* ---------- TELO ---------- */
  const BF = [10, 15, 20, 25, 30, 35];
  function silho(sex, bf) { const w = 26 + (bf - 10) * 1.6, belly = (bf - 10) * 0.85, cx = 60, fill = bf <= 15 ? "#39d98a" : bf <= 25 ? "#9bd64a" : "#e0a14b"; return `<svg viewBox="0 0 120 200" class="silho"><circle cx="${cx}" cy="26" r="13" fill="${fill}"/><path d="M${cx - w} 60 Q${cx - w - belly} 110 ${cx - w * 0.7} 150 L${cx - 13} 196 L${cx - 4} 196 L${cx - 4} 150 L${cx + 4} 150 L${cx + 4} 196 L${cx + 13} 196 L${cx + w * 0.7} 150 Q${cx + w + belly} 110 ${cx + w} 60 Q${cx} 44 ${cx - w} 60 Z" fill="${fill}" opacity=".92"/></svg>`; }
  function renderBodies() {
    const sex = store.get("profile")?.spol || "moski";
    const build = (sel, key, val) => { const el = $(sel); if (!el) return; el.innerHTML = BF.map(b => `<button class="bodycard ${val === b ? "is-sel" : ""}" data-key="${key}" data-bf="${b}">${silho(sex, b)}<span>${b}%</span></button>`).join(""); };
    build("#bodyCurrent", "bodyCurrent", store.get("bodyCurrent")); build("#bodyTarget", "bodyTarget", store.get("bodyTarget"));
    const cur = store.get("bodyCurrent"), tgt = store.get("bodyTarget"), box = $("#bodySummary");
    if (box) box.innerHTML = (cur && tgt) ? (cur > tgt ? `🎯 Iz <b>${cur}%</b> na <b>${tgt}%</b> — ${cur - tgt}% manj. Realno v ${Math.ceil((cur - tgt) / 1.5)}–${cur - tgt} mesecih.` : cur < tgt ? `🎯 Gradiš maso: ${cur}% → ${tgt}%.` : `Vzdržuješ ${cur}%. 💪`) : "";
  }
  document.addEventListener("click", e => { const b = e.target.closest(".bodycard"); if (!b) return; store.set(b.dataset.key, +b.dataset.bf); renderBodies(); });

  /* ---------- PROGRES počutje ---------- */
  ["mood", "energy", "sleep"].forEach(id => { const el = $("#" + id); if (el) el.oninput = () => $("#" + id + "Val").textContent = el.value; });
  let tf = null, su = null;
  $("#trainFeel").addEventListener("click", e => { const c = e.target.closest(".chip"); if (!c) return; tf = c.dataset.tf; $$("#trainFeel .chip").forEach(x => x.classList.toggle("is-sel", x === c)); });
  $("#sustain").addEventListener("click", e => { const c = e.target.closest(".chip"); if (!c) return; su = c.dataset.su; $$("#sustain .chip").forEach(x => x.classList.toggle("is-sel", x === c)); });
  $("#saveProgress").onclick = () => {
    const rec = { d: dayKey(), mood: +$("#mood").value, energy: +$("#energy").value, sleep: +$("#sleep").value, tf, su };
    const arr = store.get("progress", []).filter(x => x.d !== rec.d); arr.push(rec); store.set("progress", arr);
    let tip = tf === "tezek" ? "Trening je pretežek — zmanjšaj teže/ponovitve in dodaj počitek." : su === "ne" || su === "tezko" ? "Težko vzdržuješ — postavimo bolj realen tempo. Manjše spremembe vztrajajo dlje." : rec.sleep <= 4 ? "Slab spanec vpliva na napredek — cilj 7–8 h." : "Odlično, nadaljuj! 💪";
    $("#progStatus").innerHTML = "✅ Shranjeno. " + tip;
  };
  function restoreProgress() { const a = store.get("progress", []); if (!a.length) return; const last = a[a.length - 1]; if (last.d === dayKey()) { $("#mood").value = last.mood; $("#energy").value = last.energy; $("#sleep").value = last.sleep; ["mood", "energy", "sleep"].forEach(id => $("#" + id + "Val").textContent = $("#" + id).value); tf = last.tf; su = last.su; $$("#trainFeel .chip").forEach(x => x.classList.toggle("is-sel", x.dataset.tf === tf)); $$("#sustain .chip").forEach(x => x.classList.toggle("is-sel", x.dataset.su === su)); } }

  /* ---------- WHATSAPP ---------- */
  function renderWA() {
    const sex = store.get("profile")?.spol || "moski", el = $("#waInner");
    if (has("trener")) {
      const num = WA[sex], name = store.get("profile")?.ime || "";
      const txt = encodeURIComponent(`Živjo, sem ${name} iz V FORMI aplikacije. Rad/a bi nasvet glede…`);
      el.innerHTML = `<p class="muted">Tvoj osebni profesionalni trener za ${sex === "zenska" ? "ženske" : "moške"} ti odgovori v 24 urah. <b>Garantirani rezultati ali denar nazaj.</b></p>
        <a class="btn btn--gold block" href="https://wa.me/${num}?text=${txt}" target="_blank" rel="noopener">💬 Odpri WhatsApp klepet</a>
        <p class="muted small">Številka: +${num.replace(/^386/, "386 ")} (zamenljiva)</p>`;
    } else {
      el.innerHTML = `<p class="muted">🔒 Osebni trener na WhatsApp je del paketa <b>Osebni trener (30 €/mes)</b> — z garancijo rezultatov.</p><button class="btn btn--solid block" data-go="pro">Poglej pakete</button>`;
    }
  }

  /* ---------- SKUPNOST ---------- */
  $("#addComment").onclick = () => { const name = $("#commentName").value.trim() || (store.get("profile")?.ime || "Anonimni"), text = $("#commentText").value.trim(); if (!text) return toast("Napiši komentar"); const c = store.get("comments", []); c.unshift({ name, text, d: new Date().toLocaleDateString("sl-SI"), likes: 0 }); store.set("comments", c); $("#commentText").value = ""; renderComments(); };
  function renderComments() { const c = store.get("comments", []), el = $("#comments"); if (!el) return; el.innerHTML = c.length ? c.map((x, i) => `<div class="comment card"><div class="comment__head"><b>${esc(x.name)}</b><span class="muted">${x.d}</span></div><p>${esc(x.text)}</p><button class="link like" data-i="${i}">👍 ${x.likes}</button></div>`).join("") : `<p class="muted">Še ni komentarjev — bodi prvi! 💬</p>`; }
  $("#comments").addEventListener("click", e => { const b = e.target.closest(".like"); if (!b) return; const c = store.get("comments", []); c[+b.dataset.i].likes++; store.set("comments", c); renderComments(); });

  /* ---------- BLOG ---------- */
  const imgOrEmoji = (a, cls) => a.img
    ? `<div class="${cls}" style="background:${a.grad}"><img src="${a.img}" alt="" onerror="this.remove()" /><span>${a.emoji}</span></div>`
    : `<div class="${cls}" style="background:${a.grad}"><span>${a.emoji}</span></div>`;
  function renderBlog() {
    $("#blogList").innerHTML = (window.ARTICLES || []).map(a => `<button class="blogcard" data-article="${a.id}">
      ${imgOrEmoji(a, "blogcard__img")}
      <div class="blogcard__body"><b>${a.title}</b><p>${a.excerpt}</p><span class="muted small">${a.read}</span></div></button>`).join("");
  }
  $("#blogList").addEventListener("click", e => { const b = e.target.closest("[data-article]"); if (!b) return; openArticle(b.dataset.article); });
  function openArticle(id) {
    const a = window.ARTICLES.find(x => x.id === id); if (!a) return;
    $("#blogPost").innerHTML = `${imgOrEmoji(a, "post__hero")}<h1 class="post__title serif">${a.title}</h1><p class="muted">${a.read}</p><div class="post__body">${a.html}</div>`;
    nav("blogpost");
  }

  /* ---------- TRENINGI ---------- */
  function renderTreningi() {
    const prof = store.get("profile") || {};
    const lvl = prof.nivo || "zacetnik", sex = prof.spol || "moski";
    // privzet cilj treninga iz profila (mišice→misice, hujšanje→definicija, drugo→funkcionalnost)
    const tgoal = store.get("trainGoal") || (prof.cilj === "misice" ? "misice" : prof.cilj === "hujsanje" ? "definicija" : "funkcionalnost");
    $("#goalPick").innerHTML = Object.entries(window.TRAIN_GOALS).map(([k, v]) => `<button class="chip ${k === tgoal ? "is-sel" : ""}" data-tgoal="${k}">${v.label}</button>`).join("");
    $("#goalNote").textContent = window.TRAIN_GOALS[tgoal].note;
    $("#levelPick").innerHTML = Object.entries(window.LEVELS).map(([k, v]) => `<button class="chip ${k === lvl ? "is-sel" : ""}" data-lvl="${k}">${v.label}</button>`).join("");
    $("#levelNote").textContent = window.LEVELS[lvl].note + ` · ${window.LEVELS[lvl].sets} serij · počitek ${window.LEVELS[lvl].rest} · ${window.LEVELS[lvl].days} dni/teden.`;
    $("#progGoalNote").textContent = `${window.TRAIN_GOALS[tgoal].label} · ${sex === "zenska" ? "ženski" : "moški"} program · ${window.LEVELS[lvl].days} dni/teden. Zapiši teže/ponovitve in spremljaj napredek.`;
    const prog = window.buildProgram(lvl, tgoal, sex);
    const log = store.get("exLog", {});
    const owned = has("treningi");
    const shown = owned ? prog.days : prog.days.slice(0, 1);
    let html = shown.map((d, di) => `<details class="trainday" ${di === 0 ? "open" : ""}><summary>${d.title} <small>(${d.items.length} vaj)</small></summary>
      ${d.items.map(it => { const last = log[it.name]; return `<div class="exrow"><div class="exrow__top"><b>${it.name}</b><span>${it.sets} × ${it.reps}</span></div>
        <div class="exrow__log"><button class="exlogbtn" data-ex="${esc(it.name)}">${last ? "✓ " + esc(last) : "📝 Zabeleži"}</button></div></div>`; }).join("")}</details>`).join("");
    if (!owned) html += `<div class="lockcta"><b>🔒 Odkleni cel program (${prog.days.length} dni/teden)</b><p class="muted">Personaliziran trening po meri tvojega cilja in nivoja.</p><button class="btn btn--solid block" data-go="pro">Treningi po meri — 4,99 €/mes</button></div>`;
    $("#programArea").innerHTML = html;
    // knjižnica
    const groups = ["Vse", ...new Set(window.EXERCISES.map(e => e[1]))];
    const af = store.get("exGroup") || "Vse";
    $("#exFilter").innerHTML = groups.map(g => `<button class="chip ${g === af ? "is-sel" : ""}" data-grp="${g}">${g}</button>`).join("");
    const items = window.EXERCISES.filter(e => af === "Vse" || e[1] === af);
    const hist = store.get("exHist", {});
    $("#exLibrary").innerHTML = `<p class="muted small">${items.length} vaj${af === "Vse" ? ` (skupaj ${window.EXERCISES.length})` : ""}</p>` + items.map(e => {
      const last = (hist[e[0]] || []).slice(-1)[0];
      return `<div class="exlib"><span class="exlib__img" style="background:${grpColor(e[1])}">${e[3]}</span>
        <div class="exlib__t"><b>${e[0]}</b><p class="muted small">${e[1]} · ${e[2]} — ${e[4]}</p>
        ${last ? `<p class="exlast">📈 zadnjič: ${esc(last.v)} <span class="muted">(${last.d})</span></p>` : ""}</div>
        <button class="exlogbtn" data-ex="${esc(e[0])}">📝</button></div>`;
    }).join("");
  }
  const grpColor = (g) => ({ "Prsi": "#c0501f", "Hrbet": "#185fa5", "Ramena": "#7e3ca8", "Biceps": "#2f7d32", "Triceps": "#a86a00", "Kvadriceps": "#b83280", "Zadnja loža & glutei": "#a52a5a", "Meča": "#495057", "Jedro": "#0c8a6a", "Kardio": "#b13b3b" }[g] || "#1f8f6e");
  function logExercise(name) {
    const v = prompt(`${name}\nVnesi opravljeno (npr. "20 kg × 12, 20 × 10, 18 × 8" ali "12, 10, 8"):`);
    if (!v) return;
    const hist = store.get("exHist", {}); (hist[name] = hist[name] || []).push({ d: new Date().toLocaleDateString("sl-SI"), v: v.trim() });
    store.set("exHist", hist);
    const log = store.get("exLog", {}); log[name] = v.trim(); store.set("exLog", log);
    renderTreningi(); renderExProgress(); toast("Zabeleženo 📈");
  }
  $("#goalPick").addEventListener("click", e => { const b = e.target.closest(".chip"); if (!b) return; store.set("trainGoal", b.dataset.tgoal); renderTreningi(); });
  $("#levelPick").addEventListener("click", e => { const b = e.target.closest(".chip"); if (!b) return; const p = store.get("profile") || {}; p.nivo = b.dataset.lvl; store.set("profile", p); if (form.elements.nivo) form.elements.nivo.value = p.nivo; renderTreningi(); });
  $("#exFilter").addEventListener("click", e => { const b = e.target.closest(".chip"); if (!b) return; store.set("exGroup", b.dataset.grp); renderTreningi(); });
  $("#programArea").addEventListener("click", e => { const b = e.target.closest(".exlogbtn"); if (b) logExercise(b.dataset.ex); });
  $("#exLibrary").addEventListener("click", e => { const b = e.target.closest(".exlogbtn"); if (b) logExercise(b.dataset.ex); });
  function renderExProgress() {
    const el = $("#exProgress"); if (!el) return;
    const hist = store.get("exHist", {}), names = Object.keys(hist);
    if (!names.length) { el.innerHTML = `<p class="muted">Še ni zabeleženih vaj. V zavihku Trening tapni 📝 pri vaji.</p>`; return; }
    el.innerHTML = names.map(n => {
      const h = hist[n], last = h[h.length - 1];
      return `<div class="exprog"><div class="exprog__h"><b>${esc(n)}</b><span class="muted">${h.length}×</span></div>
        <p class="exlast">📈 ${esc(last.v)} <span class="muted">(${last.d})</span></p>
        ${h.length > 1 ? `<p class="muted small">prej: ${h.slice(0, -1).slice(-3).map(x => esc(x.v)).join(" · ")}</p>` : ""}</div>`;
    }).join("");
  }

  /* ---------- RECEPTI ---------- */
  const CATS = [["zdravo", "🌿 Zdrav slog (50)"], ["hujsanje", "🔥 Hujšanje (50)"], ["bulk", "💪 Bulk (20)"]];
  function renderRecipes() {
    const active = store.get("recCat") || "zdravo";
    $("#recFilter").innerHTML = CATS.map(([k, l]) => `<button class="chip ${k === active ? "is-sel" : ""}" data-cat="${k}">${l}</button>`).join("");
    const all = window.RECIPES.filter(r => r.cat === active);
    const owned = has("recepti");
    const items = owned ? all : all.slice(0, 4);
    $("#recCount").textContent = owned ? `${all.length} receptov · ✨ novi vsak teden` : `Predogled — ${all.length} receptov v paketu`;
    let html = items.map((r, i) => `<button class="reccard2" data-cat="${active}" data-i="${i}">
      <div class="reccard2__img" style="background:${recGrad(r.cat)}"><span>${r.emoji}</span></div>
      <div class="reccard2__body"><b>${r.name}</b><div class="reccard2__meta"><span>${r.kcal} kcal</span><span>B ${r.p}g</span><span>${r.time} min</span></div></div></button>`).join("");
    $("#recGrid").innerHTML = html;
    const old = document.getElementById("recCta"); if (old) old.remove();
    if (!owned) $("#recGrid").insertAdjacentHTML("afterend", `<div class="lockcta" id="${ctaId}"><b>🔒 Odkleni vseh ${window.RECIPES.length} receptov</b><p class="muted">Po kategorijah, s postopki in makri — ✨ novi recepti vsak teden.</p><button class="btn btn--solid block" data-go="pro">Recepti — 9,99 €/mes</button></div>`);
  }
  const recGrad = (c) => c === "zdravo" ? "linear-gradient(135deg,#39d98a,#1f8f6e)" : c === "hujsanje" ? "linear-gradient(135deg,#ff8a5c,#e8590c)" : "linear-gradient(135deg,#845ef7,#5f3dc4)";
  $("#recFilter").addEventListener("click", e => { const b = e.target.closest(".chip"); if (!b) return; store.set("recCat", b.dataset.cat); renderRecipes(); });
  $("#recGrid").addEventListener("click", e => { const b = e.target.closest(".reccard2"); if (!b) return; const items = window.RECIPES.filter(r => r.cat === b.dataset.cat); openRecipe(items[+b.dataset.i]); });
  function openRecipe(r) {
    $("#recipeDetail").innerHTML = `<div class="post__hero" style="background:${recGrad(r.cat)}"><span>${r.emoji}</span></div>
      <h1 class="post__title">${r.name}</h1>
      <div class="recmacros"><span>${r.kcal} kcal</span><span>B ${r.p}g</span><span>OH ${r.c}g</span><span>M ${r.f}g</span><span>⏱ ${r.time} min</span></div>
      <h4 class="lbl">Sestavine</h4><ul class="reclist">${r.ing.map(i => `<li>${i}</li>`).join("")}</ul>
      <h4 class="lbl">Priprava</h4><ol class="recsteps">${(Array.isArray(r.steps) ? r.steps : [r.steps]).map(s => `<li>${s}</li>`).join("")}</ol>
      <button class="btn btn--solid block" id="recToDiary">+ Dodaj v dnevnik (${r.kcal} kcal)</button>`;
    $("#recToDiary").onclick = () => { const di = diaryOf(); di[pickMeal()].push({ name: r.name, grams: "", kcal: r.kcal, p: r.p, c: r.c, f: r.f }); saveDiary(di); renderDashboard(); toast("Dodano v dnevnik ✅"); };
    nav("recipe");
  }

  /* ---------- ČLANSTVO / PAKETI ---------- */
  const ALL_ACCESS = true;   // POLNI DOSTOP — vse storitve odklenjene (nastavi na false za pravi paywall)
  const plans = () => store.get("plans", {});
  const has = (k) => ALL_ACCESS || !!plans()[k] || store.get("plan") === "premium" || trialActive();
  const PLANS = [
    { id: "treningi", name: "Treningi po meri", price: "4,99 €", emoji: "🏋️", feats: ["Personaliziran tedenski program", "Glede na nivo & cilj", "Sledenje napredku vaj"] },
    { id: "recepti", name: "Recepti", price: "9,99 €", emoji: "🥗", feats: ["120+ receptov s postopki", "Po kategorijah & makrih", "✨ Novi recepti vsak teden"] },
    { id: "trener", name: "Osebni trener", price: "30 €", emoji: "💬", feature: true, feats: ["Profesionalni trener na WhatsApp", "Ločeno za moške & ženske", "🏅 Garantirani rezultati ali denar nazaj"] },
  ];
  function renderPlans() {
    const html = PLANS.map(p => {
      const owned = has(p.id);
      return `<div class="plan ${p.feature ? "plan--feature" : ""} ${owned ? "plan--owned" : ""}">
        ${p.feature ? '<span class="ribbon">Garancija rezultatov</span>' : ""}
        <div class="plan__emoji">${p.emoji}</div>
        <h3 class="serif">${p.name}</h3>
        <p class="price">${p.price}<span>/mesec</span></p>
        <ul>${p.feats.map(f => `<li>${f}</li>`).join("")}</ul>
        ${owned ? `<button class="btn btn--ghost block" disabled>✓ Aktivno</button>` : `<button class="btn ${p.feature ? "btn--gold" : "btn--solid"} block unlock" data-plan="${p.id}">Odkleni</button>`}
      </div>`;
    }).join("");
    $$("[data-plans]").forEach(c => c.innerHTML = html);
  }
  document.addEventListener("click", e => { const b = e.target.closest(".unlock"); if (!b) return; const o = plans(); o[b.dataset.plan] = true; store.set("plans", o); toast("Odklenjeno! 🎉 (demo plačilo)"); renderPlans(); renderWA(); renderTreningi(); renderRecipes(); });

  /* ---------- NAŠA ZGODBA ---------- */
  function renderStory() {
    $("#storyBody").innerHTML = `
      <div class="story__hero"><span>🌿</span><div><p class="kicker">Naša zgodba</p><h1 class="serif">Edina stvar, ki je ne moreš kupiti</h1></div></div>
      <div class="post__body">
        <p class="hook">Lahko si kupiš avto, telefon, večerjo v najboljši restavraciji. Ne moreš pa si kupiti zdravja nazaj, ko ga enkrat izgubiš.</p>
        <p>V FORMI se ni začel v pisarni s tabelami in cilji prodaje. Začel se je v trenutku, ko je nekomu blizu zdravnik rekel besede, ki spremenijo vse: »Morali bi začeti skrbeti zase — prej.« Tisti »prej« je bil lekcija. Zdravje ni nekaj, kar opaziš, dokler ga imaš. Opaziš ga šele, ko ga zmanjka.</p>
        <p>Pogledali smo okoli sebe in videli Slovenijo, ki dela predolgo, sedi preveč, je na hitro in spi premalo. Videli smo ljudi, ki si <b>želijo</b> spremembe, a ne vedo, kje začeti — in se izgubijo med tisočimi nasveti, dietami in modnimi muhami.</p>
        <h4>Zato smo naredili to aplikacijo</h4>
        <p>Ne še eno aplikacijo za štetje kalorij. Spremljevalca, ki ti pokaže <b>kje si</b>, <b>kam greš</b> in <b>točno naslednji korak</b> — preprosto, pošteno, brez pravljic. Vsak obrok, ki ga vneseš, vsak trening, ki ga opraviš, vsaka skodelica vode namesto sladke pijače — to so majhne zmage, ki se seštevajo v drugačno življenje.</p>
        <div class="tldr"><b>Naša misija</b><ul><li>Z vsako majhno spremembo narediti Slovence bolj zdrave.</li><li>Zdravje vrniti tja, kamor spada — na prvo mesto.</li><li>Dokazati, da ni nikoli prepozno za najboljšo verzijo sebe.</li></ul></div>
        <p>Ne obljubljamo bližnjic. Obljubljamo orodje, ki deluje, in skupnost, ki te ne pusti samega. Ker če lahko ena sprememba na dan, pri enem človeku, sčasoma spremeni celo državo — potem je vredno.</p>
        <p class="story__sign">— Ekipa V FORMI 🌿</p>
        <button class="btn btn--solid block" data-go="pro">Pridruži se misiji</button>
      </div>`;
  }

  /* ---------- INIT ---------- */
  function renderAll() { syncProfileForm(); renderDashboard(); renderComments(); }
  renderAll();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").then(r => r.update()).catch(() => { });
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => { if (!reloaded) { reloaded = true; location.reload(); } });
  }
  window.addEventListener("resize", () => drawWeight("#weightChart2", "#weightTrend2"));
})();
