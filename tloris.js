/* ============================================================
   POBELI ME — risanje tlorisa
   1) stranka nariše prostore (obris s prstom ali diagonala = pravokotnik)
   2) označi vrata in okna na zidovih
   3) vpiše eno pravo mero
   4) izbere višino stropa → površina sten + stropa in cena
   ============================================================ */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const NS = 'http://www.w3.org/2000/svg';
  const STORE = 'pobeli_tloris';
  const OPEN = {
    door:   { w: 0.8, h: 2.0, name: 'Vrata' },   // 1,6 m²
    window: { w: 1.2, h: 1.4, name: 'Okno' }     // 1,68 m²
  };
  const WORLD = 1000;
  const BG = '#fbf9f5';
  const fmt = (n, d = 0) => n.toLocaleString('sl-SI', { minimumFractionDigits: d, maximumFractionDigits: d });

  /* ---------- PRILOGA NA STRANI KONTAKT ---------- */
  const attach = $('#planAttach');
  if (attach) {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) { saved = null; }
    if (saved && saved.png) {
      attach.hidden = false;
      $('#planAttachImg').src = saved.png;
      $('#planAttachTxt').textContent = saved.summary;
      $('#planAttachRemove').addEventListener('click', () => {
        try { localStorage.removeItem(STORE); } catch (e) {}
        attach.hidden = true;
      });
    }
    return;
  }

  const svg = $('#planSvg');
  if (!svg) return;

  /* ---------- STANJE ---------- */
  const state = {
    rooms: [],        // { id, name, pts:[{x,y}] }
    openings: [],     // { id, type:'door'|'window', room, wall, t }
    history: [],      // za razveljavi: { kind:'room'|'opening', id }
    upm: WORLD / 12,  // enot na meter (ocena, dokler stranka ne vpiše mere)
    calibrated: false,
    height: 2.6,
    rate: 5,
    mode: 'draw',     // 'draw' | 'door' | 'window' | 'edit'
    sel: null,        // { type:'room'|'wall'|'opening', room, wall, id }
    nextId: 1
  };

  /* ---------- GEOMETRIJA ---------- */
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const areaPx = pts => {
    let s = 0;
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; s += a.x * b.y - b.x * a.y; }
    return Math.abs(s) / 2;
  };
  const centroid = pts => {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length], f = p.x * q.y - q.x * p.y;
      a += f; cx += (p.x + q.x) * f; cy += (p.y + q.y) * f;
    }
    if (Math.abs(a) < 1e-6) return { x: pts[0].x, y: pts[0].y };
    return { x: cx / (3 * a), y: cy / (3 * a) };
  };
  const inside = (pt, pts) => {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const a = pts[i], b = pts[j];
      if ((a.y > pt.y) !== (b.y > pt.y) && pt.x < (b.x - a.x) * (pt.y - a.y) / (b.y - a.y) + a.x) c = !c;
    }
    return c;
  };
  const segProj = (p, a, b) => {  // projekcija točke na daljico: { t, d, q }
    const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1e-9;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / L2));
    const q = { x: a.x + t * dx, y: a.y + t * dy };
    return { t, d: dist(p, q), q };
  };
  const walls = r => r.pts.map((a, i) => ({ a, b: r.pts[(i + 1) % r.pts.length], i }));
  const labelPoint = pts => {
    const c = centroid(pts);
    if (inside(c, pts)) return c;
    let best = null;
    const ys = pts.map(p => p.y), y0 = Math.min(...ys), y1 = Math.max(...ys);
    for (let k = 1; k < 20; k++) {
      const y = y0 + (y1 - y0) * k / 20, xs = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        if ((a.y > y) !== (b.y > y)) xs.push(a.x + (y - a.y) * (b.x - a.x) / (b.y - a.y));
      }
      xs.sort((m, n) => m - n);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const w = xs[i + 1] - xs[i];
        if (!best || w > best.w) best = { w, x: (xs[i] + xs[i + 1]) / 2, y };
      }
    }
    return best ? { x: best.x, y: best.y } : c;
  };
  const px = () => WORLD / (svg.getBoundingClientRect().width || WORLD);   // enot na zaslonski piksel

  const rdp = (pts, eps) => {
    if (pts.length < 3) return pts.slice();
    const a = pts[0], b = pts[pts.length - 1], L = dist(a, b) || 1e-9;
    let idx = 0, max = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[i];
      const d = Math.abs((b.x - a.x) * (a.y - p.y) - (a.x - p.x) * (b.y - a.y)) / L;
      if (d > max) { max = d; idx = i; }
    }
    if (max > eps) { const l = rdp(pts.slice(0, idx + 1), eps), r = rdp(pts.slice(idx), eps); return l.slice(0, -1).concat(r); }
    return [a, b];
  };

  /* ---------- PRIPENJANJE NA OBSTOJEČE ZIDOVE ---------- */
  // koordinate vseh vodoravnih (y) in navpičnih (x) zidov že narisanih prostorov
  const wallCoords = () => {
    const xs = [], ys = [];
    state.rooms.forEach(r => walls(r).forEach(({ a, b }) => {
      if (Math.abs(a.y - b.y) < 0.5) ys.push(a.y);
      if (Math.abs(a.x - b.x) < 0.5) xs.push(a.x);
    }));
    return { xs, ys };
  };
  const nearest = (v, list, tol) => {
    let best = null, bd = tol;
    for (const c of list) { const d = Math.abs(c - v); if (d < bd) { bd = d; best = c; } }
    return best === null ? v : best;
  };
  const overlapShare = pts => {       // delež novega prostora, ki leži v obstoječih prostorih
    if (!state.rooms.length) return 0;
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    let n = 0, hit = 0;
    for (let i = 1; i < 16; i++) for (let j = 1; j < 16; j++) {
      const p = { x: x0 + (x1 - x0) * i / 16, y: y0 + (y1 - y0) * j / 16 };
      if (!inside(p, pts)) continue;
      n++;
      if (state.rooms.some(r => inside(p, r.pts))) hit++;
    }
    return n ? hit / n : 0;
  };

  /* ---------- PORAVNAVA OBRISA ---------- */
  // prostoročni obris → premice z zaokroženo smerjo (0°/90°, izjemoma 45°)
  const lineOf = s => {
    const rad = s.key * Math.PI / 180;
    return { key: s.key, p: { x: s.mx / s.len, y: s.my / s.len }, u: { x: Math.cos(rad), y: Math.sin(rad) } };
  };
  const angDiff = (k1, k2) => { const d = Math.abs(k1 - k2) % 180; return Math.min(d, 180 - d); };
  // obstoječi zid ob koncu odprte poteze, ki ni vzporeden z zadnjim narisanim odsekom
  const closingWall = (p, key, tol) => {
    let best = null;
    state.rooms.forEach(r => walls(r).forEach(({ a, b }) => {
      const s = segProj(p, a, b);
      if (s.d > tol) return;
      const k = ((Math.round(Math.atan2(b.y - a.y, b.x - a.x) * 1800 / Math.PI) / 10) % 180 + 180) % 180;
      if (angDiff(k, key) < 30) return;
      if (!best || s.d < best.d) {
        const L = dist(a, b) || 1;
        best = { d: s.d, q: s.q, line: { key: k, p: { x: a.x, y: a.y }, u: { x: (b.x - a.x) / L, y: (b.y - a.y) / L } } };
      }
    }));
    return best;
  };
  const toLines = raw => {
    const xs = raw.map(p => p.x), ys = raw.map(p => p.y);
    const diag = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    if (diag < 60) return null;
    const bbox = { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
    let pts = rdp(raw, Math.max(10, diag * 0.045));
    const open = dist(pts[0], pts[pts.length - 1]) >= diag * 0.25;
    // odprta poteza, ki se začne in konča ob obstoječih zidovih: manjkajoče stene dopolnimo z njimi
    if (open && state.rooms.length) {
      const o = segsOf(pts, diag, false);
      if (o.length >= 2) {
        const tol = 45 * px();
        const cS = closingWall(pts[0], o[0].key, tol), cE = closingWall(pts[pts.length - 1], o[o.length - 1].key, tol);
        if (cS && cE) {
          const lines = o.map(lineOf);
          const sameLine = angDiff(cS.line.key, cE.line.key) < 1 &&
            Math.abs((cE.q.x - cS.line.p.x) * cS.line.u.y - (cE.q.y - cS.line.p.y) * cS.line.u.x) < 3;
          const parallel = angDiff(cS.line.key, cE.line.key) < 1;
          if (sameLine || !parallel) {
            lines.push(cE.line);
            if (!sameLine) lines.push(cS.line);
            [cS.q, cE.q].forEach(q => { bbox.x0 = Math.min(bbox.x0, q.x); bbox.x1 = Math.max(bbox.x1, q.x); bbox.y0 = Math.min(bbox.y0, q.y); bbox.y1 = Math.max(bbox.y1, q.y); });
            if (lines.length >= 3) return { diag, bbox, lines, snapKeep: lines.length - o.length };
          }
        }
      }
    }
    if (!open) pts[pts.length - 1] = { ...pts[0] };
    else pts.push({ ...pts[0] });
    const merged = segsOf(pts, diag, true);
    if (merged.length < 3) return null;
    return { diag, bbox, lines: merged.map(lineOf) };
  };
  // odseki obrisa z zaokroženo smerjo, zaporedni v isti smeri združeni
  const segsOf = (pts, diag, closed) => {
    const segs = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], len = dist(a, b);
      if (len < diag * 0.04) continue;
      const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
      let snap = Math.round(ang / 45) * 45;
      // poševna stena samo, če je res dolga in narisana skoraj pod 45° (kratki poševni odseki v vogalih so tresenje roke)
      if (Math.abs(snap) % 90 !== 0 && (Math.abs(ang - snap) > 8 || len < diag * 0.2)) snap = Math.round(ang / 90) * 90;
      segs.push({ key: ((snap % 180) + 180) % 180, len, mx: (a.x + b.x) / 2 * len, my: (a.y + b.y) / 2 * len });
    }
    const merged = [];
    for (const s of segs) {
      const last = merged[merged.length - 1];
      if (last && last.key === s.key) { last.len += s.len; last.mx += s.mx; last.my += s.my; } else merged.push({ ...s });
    }
    if (closed && merged.length > 1 && merged[0].key === merged[merged.length - 1].key) {
      const l = merged.pop(); merged[0].len += l.len; merged[0].mx += l.mx; merged[0].my += l.my;
    }
    return merged;
  };
  const polyFromLines = (L, tol) => {
    const { xs, ys } = wallCoords();
    // pripenjanje nikoli ne sme bistveno spremeniti velikosti prostora (ozki prostori, majhen zaslon)
    const tolY = Math.min(tol, 0.2 * (L.bbox.y1 - L.bbox.y0)), tolX = Math.min(tol, 0.2 * (L.bbox.x1 - L.bbox.x0));
    const lines = L.lines.map(l => {
      const p = { ...l.p };
      if (l.key === 0) p.y = nearest(p.y, ys, tolY);
      if (l.key === 90) p.x = nearest(p.x, xs, tolX);
      return { ...l, p };
    });
    const cross = (l1, l2) => {
      const d = l1.u.x * l2.u.y - l1.u.y * l2.u.x;
      if (Math.abs(d) < 1e-9) return null;
      const t = ((l2.p.x - l1.p.x) * l2.u.y - (l2.p.y - l1.p.y) * l2.u.x) / d;
      return { x: l1.p.x + t * l1.u.x, y: l1.p.y + t * l1.u.y };
    };
    let out = [];
    for (let i = 0; i < lines.length; i++) {
      const v = cross(lines[(i - 1 + lines.length) % lines.length], lines[i]);
      if (!v) return null;
      out.push(v);
    }
    out = out.filter((v, i) => dist(v, out[(i + 1) % out.length]) > 4);
    if (out.length < 3) return null;
    const m = L.diag * 0.3, b = L.bbox;
    if (out.some(v => v.x < b.x0 - m || v.x > b.x1 + m || v.y < b.y0 - m || v.y > b.y1 + m)) return null;
    if (areaPx(out) < 900) return null;
    return out;
  };
  // zid novega prostora, ki stoji nasproti obstoječemu (reža ali prekrivanje), premaknemo nanj
  const closeGaps = (pts, tol) => {
    const out = pts.map(p => ({ ...p }));
    const ex = [];
    state.rooms.forEach(r => walls(r).forEach(({ a, b }) => {
      if (Math.abs(a.y - b.y) < 0.5) ex.push({ h: true, c: a.y, lo: Math.min(a.x, b.x), hi: Math.max(a.x, b.x) });
      else if (Math.abs(a.x - b.x) < 0.5) ex.push({ h: false, c: a.x, lo: Math.min(a.y, b.y), hi: Math.max(a.y, b.y) });
    }));
    const bw = Math.max(...pts.map(p => p.x)) - Math.min(...pts.map(p => p.x));
    const bh = Math.max(...pts.map(p => p.y)) - Math.min(...pts.map(p => p.y));
    for (let i = 0; i < out.length; i++) {
      const a = out[i], b = out[(i + 1) % out.length];
      const h = Math.abs(a.y - b.y) < 0.5, v = Math.abs(a.x - b.x) < 0.5;
      const lim = Math.min(tol, 0.45 * (h ? bh : bw));
      if (!h && !v) continue;
      const c = h ? a.y : a.x, lo = h ? Math.min(a.x, b.x) : Math.min(a.y, b.y), hi = h ? Math.max(a.x, b.x) : Math.max(a.y, b.y);
      let best = null, flush = false;
      ex.forEach(w => {
        if (w.h !== h) return;
        const d = Math.abs(w.c - c);
        const ov = Math.min(hi, w.hi) - Math.max(lo, w.lo);
        if (d <= 0.5 && ov > 0) flush = true;          // zid se že stika z obstoječim — ne premikamo ga
        if (d > 0.5 && d < lim && ov > 0.3 * Math.min(hi - lo, w.hi - w.lo) && (!best || d < best.d)) best = { d, c: w.c };
      });
      if (best && !flush) { if (h) { a.y = best.c; b.y = best.c; } else { a.x = best.c; b.x = best.c; } }
    }
    return areaPx(out) > 900 ? out : pts;
  };
  // pripenjanje: najbližje koordinate zidov, nato zapiranje rež/prekrivanj z nasprotnimi zidovi
  const fit = (build) => {
    const k = px();
    let pts = build(30 * k);
    if (!pts) return null;
    pts = closeGaps(pts, 70 * k);
    return pts.map(v => ({ x: Math.round(v.x * 10) / 10, y: Math.round(v.y * 10) / 10 }));
  };
  // tresenje prsta zgladimo (drseče povprečje), konca poteze ostaneta, kjer sta bila
  const smooth = (raw, w) => raw.map((p, i) => {
    if (i < w || i >= raw.length - w) return p;
    let x = 0, y = 0;
    for (let j = i - w; j <= i + w; j++) { x += raw[j].x; y += raw[j].y; }
    return { x: x / (2 * w + 1), y: y / (2 * w + 1) };
  });
  const straighten = raw => {
    if (raw.length < 6) return null;
    const L = toLines(raw.length > 12 ? smooth(raw, 2) : raw);
    return L ? fit(tol => polyFromLines(L, tol)) : null;
  };
  const rectFrom = (a, b) => fit(tol => {
    const { xs, ys } = wallCoords();
    const tX = Math.min(tol, 0.2 * Math.abs(a.x - b.x)), tY = Math.min(tol, 0.2 * Math.abs(a.y - b.y));
    const x0 = nearest(Math.min(a.x, b.x), xs, tX), x1 = nearest(Math.max(a.x, b.x), xs, tX);
    const y0 = nearest(Math.min(a.y, b.y), ys, tY), y1 = nearest(Math.max(a.y, b.y), ys, tY);
    if (x1 - x0 < 30 || y1 - y0 < 30) return null;
    return [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];
  });
  // poteza, ki je skoraj ravna črta = diagonala pravokotnika
  const isDiagonal = raw => {
    const a = raw[0], b = raw[raw.length - 1], d = dist(a, b);
    if (d < 60) return false;
    let len = 0;
    for (let i = 1; i < raw.length; i++) len += dist(raw[i - 1], raw[i]);
    return len < d * 1.25 && Math.abs(a.x - b.x) > 30 && Math.abs(a.y - b.y) > 30;
  };

  /* ---------- VRATA IN OKNA ---------- */
  const openGeom = o => {
    const r = state.rooms.find(x => x.id === o.room);
    if (!r) return null;
    const a = r.pts[o.wall], b = r.pts[(o.wall + 1) % r.pts.length];
    if (!a || !b) return null;
    const L = dist(a, b) || 1, u = { x: (b.x - a.x) / L, y: (b.y - a.y) / L };
    const c = { x: a.x + (b.x - a.x) * o.t, y: a.y + (b.y - a.y) * o.t };
    let n = { x: -u.y, y: u.x };
    if (!inside({ x: c.x + n.x * 6, y: c.y + n.y * 6 }, r.pts)) n = { x: -n.x, y: -n.y };
    const hw = Math.min(L / 2, OPEN[o.type].w * state.upm / 2);
    return { c, u, n, hw, r };
  };
  // odprtine, ki ležijo na zidovih prostora (tudi odprtine v skupnem zidu soseda)
  const openingsOf = r => state.openings.filter(o => {
    if (o.room === r.id) return true;
    const g = openGeom(o);
    if (!g) return false;
    return walls(r).some(({ a, b }) => {
      const L = dist(a, b) || 1, u = { x: (b.x - a.x) / L, y: (b.y - a.y) / L };
      return Math.abs(u.x * g.u.y - u.y * g.u.x) < 0.02 && segProj(g.c, a, b).d < 2;
    });
  });
  const placeOpening = (p, type) => {
    const k = px();
    // tap na obstoječo odprtino jo odstrani
    const hitO = state.openings.find(o => { const g = openGeom(o); return g && dist(g.c, p) < Math.max(g.hw, 22 * k); });
    if (hitO) { removeOpening(hitO.id); return 'removed'; }
    let best = null;
    state.rooms.forEach(r => walls(r).forEach(({ a, b, i }) => {
      const s = segProj(p, a, b);
      if (s.d < 30 * k && (!best || s.d < best.d)) best = { r, i, s, L: dist(a, b) };
    }));
    if (!best) return 'miss';
    const half = Math.min(0.5, (OPEN[type].w * state.upm / 2) / best.L);
    const t = Math.max(half, Math.min(1 - half, best.s.t));
    const id = state.nextId++;
    state.openings.push({ id, type, room: best.r.id, wall: best.i, t });
    state.history.push({ kind: 'opening', id });
    return 'added';
  };
  const removeOpening = id => {
    state.openings = state.openings.filter(o => o.id !== id);
    if (state.sel && state.sel.type === 'opening' && state.sel.id === id) state.sel = null;
  };

  /* ---------- IZRAČUN ---------- */
  const anyMarked = () => state.openings.length > 0;
  const roomCalc = r => {
    let perim = 0;
    walls(r).forEach(({ a, b }) => { perim += dist(a, b); });
    const perimM = perim / state.upm;
    const floor = areaPx(r.pts) / (state.upm * state.upm);
    let doors, wins;
    if (anyMarked()) {
      const os = openingsOf(r);
      doors = os.filter(o => o.type === 'door').length;
      wins = os.filter(o => o.type === 'window').length;
    } else { doors = 1; wins = 1; }          // privzeto, dokler stranka ne označi ničesar
    const h = r.h || state.height;
    const wallsM2 = Math.max(0, perimM * h - doors * OPEN.door.w * OPEN.door.h - wins * OPEN.window.w * OPEN.window.h);
    return { floor, walls: wallsM2, ceiling: floor, total: wallsM2 + floor, doors, wins, h };
  };

  /* ---------- IZRIS ---------- */
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const layer = $('#planLayer'), preview = $('#planPreview'), empty = $('#planEmpty');
  const onEdit = (node, sel) => node.addEventListener('pointerdown', e => {
    if (state.mode !== 'edit') return;
    e.stopPropagation(); select(sel);
  });

  const render = () => {
    layer.replaceChildren();
    const k = px(), fs = 13 * k, fsBig = 15 * k;
    const drawn = [];
    const same = (a, b, c, d) => (dist(a, c) < 3 && dist(b, d) < 3) || (dist(a, d) < 3 && dist(b, c) < 3);
    const inOther = (pt, r) => state.rooms.some(o => o !== r && inside(pt, o.pts));
    const thick = (r, n) => { const pr = r.pts.map(q => q.x * n.x + q.y * n.y); return (Math.max(...pr) - Math.min(...pr)) / k; };
    const gRooms = el('g', {}, layer), gOpen = el('g', {}, layer), gText = el('g', {}, layer);

    state.rooms.forEach(r => {
      const selRoom = state.sel && state.sel.room === r.id && state.sel.type !== 'opening';
      const g = el('g', { class: 'plan__room' + (selRoom ? ' is-sel' : '') }, gRooms);
      onEdit(el('polygon', { points: r.pts.map(p => `${p.x},${p.y}`).join(' '), class: 'plan__fill' }, g), { type: 'room', room: r.id });
      walls(r).forEach(({ a, b, i }) => {
        const isSel = state.sel && state.sel.type === 'wall' && state.sel.room === r.id && state.sel.wall === i;
        el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'plan__wall' + (isSel ? ' is-sel' : ''), 'stroke-width': 4 * k }, g);
        onEdit(el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'plan__hit', 'stroke-width': 22 * k }, g), { type: 'wall', room: r.id, wall: i });
        // mera
        const isDup = drawn.some(w => same(a, b, w.a, w.b));
        drawn.push({ a, b });
        if (isDup && !isSel) return;
        const L = dist(a, b) || 1, mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        let n = { x: -(b.y - a.y) / L, y: (b.x - a.x) / L };
        if (inside({ x: mid.x + n.x * 6, y: mid.y + n.y * 6 }, r.pts)) n = { x: -n.x, y: -n.y };
        let off = 16 * k;
        if (inOther({ x: mid.x + n.x * off, y: mid.y + n.y * off }, r)) {
          if (thick(r, n) < 70 && !isSel) return;
          off = -16 * k;
        }
        const half = fs * 2.3;
        const t = el('text', {
          x: Math.min(WORLD - half, Math.max(half, mid.x + n.x * off)), y: Math.min(WORLD - fs, Math.max(fs, mid.y + n.y * off)),
          class: 'plan__len' + (isSel ? ' is-sel' : ''), 'font-size': fs, 'text-anchor': 'middle', 'dominant-baseline': 'middle'
        }, gText);
        t.textContent = (state.calibrated ? '' : '≈') + fmt(L / state.upm, 2) + ' m';
        onEdit(t, { type: 'wall', room: r.id, wall: i });
      });
      const c = roomCalc(r), lp = labelPoint(r.pts);
      const xsR = r.pts.map(q => q.x), ysR = r.pts.map(q => q.y);
      const narrow = Math.min(Math.max(...xsR) - Math.min(...xsR), Math.max(...ysR) - Math.min(...ysR)) / k < 80;
      if (!narrow) el('text', { x: lp.x, y: lp.y - fsBig * 0.7, class: 'plan__name', 'font-size': fs, 'text-anchor': 'middle' }, gText).textContent = r.name;
      el('text', { x: lp.x, y: narrow ? lp.y + fs * 0.35 : lp.y + fsBig * 0.75, class: 'plan__area', 'font-size': narrow ? fs * 0.9 : fsBig, 'text-anchor': 'middle' }, gText)
        .textContent = (state.calibrated ? '' : '≈') + fmt(c.floor, 1) + ' m²';
    });

    // vrata in okna
    state.openings.forEach(o => {
      const gm = openGeom(o);
      if (!gm) return;
      const { c, u, n, hw } = gm;
      const isSel = state.sel && state.sel.type === 'opening' && state.sel.id === o.id;
      const g = el('g', { class: 'plan__open plan__open--' + o.type + (isSel ? ' is-sel' : '') }, gOpen);
      const A = { x: c.x - u.x * hw, y: c.y - u.y * hw }, B = { x: c.x + u.x * hw, y: c.y + u.y * hw };
      el('line', { x1: A.x, y1: A.y, x2: B.x, y2: B.y, class: 'plan__gap', 'stroke-width': 7 * k }, g);
      if (o.type === 'door') {
        const leaf = { x: A.x + n.x * hw * 2, y: A.y + n.y * hw * 2 };
        el('line', { x1: A.x, y1: A.y, x2: leaf.x, y2: leaf.y, class: 'plan__sym', 'stroke-width': 2.2 * k }, g);
        const sweep = (u.x * n.y - u.y * n.x) > 0 ? 1 : 0;
        el('path', { d: `M ${leaf.x} ${leaf.y} A ${hw * 2} ${hw * 2} 0 0 ${sweep} ${B.x} ${B.y}`, class: 'plan__sym plan__arc', 'stroke-width': 1.6 * k }, g);
      } else {
        [-1, 1].forEach(s => el('line', {
          x1: A.x + n.x * 3.5 * k * s, y1: A.y + n.y * 3.5 * k * s, x2: B.x + n.x * 3.5 * k * s, y2: B.y + n.y * 3.5 * k * s,
          class: 'plan__sym', 'stroke-width': 1.8 * k
        }, g));
        [A, B].forEach(P => el('line', { x1: P.x - n.x * 5 * k, y1: P.y - n.y * 5 * k, x2: P.x + n.x * 5 * k, y2: P.y + n.y * 5 * k, class: 'plan__sym', 'stroke-width': 2.2 * k }, g));
      }
      onEdit(el('circle', { cx: c.x, cy: c.y, r: Math.max(hw, 20 * k), class: 'plan__ohit' }, g), { type: 'opening', id: o.id, room: o.room });
    });

    empty.hidden = state.rooms.length > 0;
    renderPanel();
  };

  /* ---------- PLOŠČA ---------- */
  const list = $('#planRooms'), editor = $('#planEditor'), scaleNote = $('#planScale'), hint = $('#planHint');
  const step = () => {
    if (!state.rooms.length) return 1;
    if (!state.calibrated) return 2;
    if (!anyMarked()) return 3;
    return 4;
  };
  const HINTS = {
    1: '<b>Korak 1 ·</b> S prstom narišite obris prostora — ali samo potegnite diagonalo za pravokoten prostor. Pri sosednjem prostoru zadošča, da narišete samo manjkajoče stene — od zidu do zidu.',
    2: '<b>Korak 2 ·</b> Izberite <b>Mere</b>, tapnite en zid in vpišite njegovo pravo dolžino. Vse ostale mere se preračunajo.',
    3: '<b>Korak 3 ·</b> Izberite <b>Vrata</b> ali <b>Okno</b> in tapnite zid, kjer so. Ponoven tap jih odstrani.',
    4: '<b>Korak 4 ·</b> Vpišite višino stropa — do centimetra, po želji tudi za posamezen prostor. Nato tloris pošljite s povpraševanjem.'
  };
  let flash = null;
  const renderPanel = () => {
    const s = step();
    $$('.plan__steps li').forEach(li => {
      const n = +li.dataset.step;
      li.classList.toggle('is-done', n < s || (n === 4 && s === 4));
      li.classList.toggle('is-now', n === s);
    });
    hint.innerHTML = flash || HINTS[s];
    hint.classList.toggle('is-warn', !!flash && flash.startsWith('!'));
    if (flash && flash.startsWith('!')) hint.innerHTML = flash.slice(1);
    scaleNote.hidden = state.calibrated || !state.rooms.length;
    list.replaceChildren();
    let wallsSum = 0, ceil = 0;
    state.rooms.forEach(r => {
      const c = roomCalc(r); wallsSum += c.walls; ceil += c.ceiling;
      const li = document.createElement('li');
      li.className = 'plan__li' + (state.sel && state.sel.room === r.id && state.sel.type === 'room' ? ' is-sel' : '');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.innerHTML = '<b></b><span></span>';
      btn.querySelector('b').textContent = r.name;
      btn.querySelector('span').textContent = `${fmt(c.floor, 1)} m² · vrata ${c.doors} · okna ${c.wins}` + (r.h ? ` · višina ${fmt(r.h, 2)} m` : '');
      btn.addEventListener('click', () => { setMode('edit'); select({ type: 'room', room: r.id }); });
      li.appendChild(btn);
      list.appendChild(li);
    });
    $('#planDefault').hidden = anyMarked() || !state.rooms.length;
    const total = wallsSum + ceil;
    $('#planWalls').textContent = fmt(wallsSum, 0);
    $('#planCeil').textContent = fmt(ceil, 0);
    $('#planTotal').textContent = fmt(total, 0);
    $('#planPrice').textContent = fmt(Math.round(total * state.rate), 0);
    $('#planSend').disabled = state.rooms.length === 0;
    renderEditor();
  };

  const renderEditor = () => {
    const s = state.sel;
    const boxes = { wall: $('#edWall'), room: $('#edRoom'), opening: $('#edOpen') };
    Object.values(boxes).forEach(b => { b.hidden = true; });
    if (!s) { editor.hidden = true; return; }
    if (s.type === 'opening') {
      const o = state.openings.find(x => x.id === s.id);
      if (!o) { editor.hidden = true; return; }
      editor.hidden = false; boxes.opening.hidden = false;
      $('#edOpenLbl').textContent = OPEN[o.type].name;
      $$('#edOpen [data-otype]').forEach(b => b.classList.toggle('is-active', b.dataset.otype === o.type));
      return;
    }
    const r = state.rooms.find(x => x.id === s.room);
    if (!r) { editor.hidden = true; return; }
    editor.hidden = false;
    if (s.type === 'wall') {
      boxes.wall.hidden = false;
      const a = r.pts[s.wall], b = r.pts[(s.wall + 1) % r.pts.length];
      $('#edWallLbl').textContent = `${r.name} · dolžina zidu`;
      $('#edWallLen').value = (dist(a, b) / state.upm).toFixed(2);
    } else {
      boxes.room.hidden = false;
      if (document.activeElement !== $('#edName')) $('#edName').value = r.name;
      $('#edArea').value = (areaPx(r.pts) / state.upm / state.upm).toFixed(1);
      if (document.activeElement !== $('#edH')) $('#edH').value = r.h ? r.h.toFixed(2) : '';
      $('#edH').placeholder = state.height.toFixed(2);
      $('#edH').classList.remove('is-bad');
    }
  };

  const select = s => { state.sel = s; flash = null; render(); };

  /* ---------- UREJANJE ---------- */
  const setWallLength = m => {
    const s = state.sel, r = s && state.rooms.find(x => x.id === s.room);
    if (!r || !(m > 0)) return;
    const a = r.pts[s.wall], b = r.pts[(s.wall + 1) % r.pts.length], cur = dist(a, b);
    if (!state.calibrated) { state.upm = cur / m; state.calibrated = true; render(); return; }
    const f = (m * state.upm) / cur;
    if (Math.abs(a.y - b.y) < 0.5) { const x0 = Math.min(a.x, b.x); r.pts = r.pts.map(p => ({ x: x0 + (p.x - x0) * f, y: p.y })); }
    else if (Math.abs(a.x - b.x) < 0.5) { const y0 = Math.min(a.y, b.y); r.pts = r.pts.map(p => ({ x: p.x, y: y0 + (p.y - y0) * f })); }
    else { const c = centroid(r.pts); r.pts = r.pts.map(p => ({ x: c.x + (p.x - c.x) * f, y: c.y + (p.y - c.y) * f })); }
    render();
  };
  const setRoomArea = m2 => {
    const s = state.sel, r = s && state.rooms.find(x => x.id === s.room);
    if (!r || !(m2 > 0)) return;
    const cur = areaPx(r.pts);
    if (!state.calibrated) { state.upm = Math.sqrt(cur / m2); state.calibrated = true; render(); return; }
    const f = Math.sqrt((m2 * state.upm * state.upm) / cur), c = centroid(r.pts);
    r.pts = r.pts.map(p => ({ x: c.x + (p.x - c.x) * f, y: c.y + (p.y - c.y) * f }));
    render();
  };
  const num = v => parseFloat(String(v).replace(',', '.'));
  $('#edWallSet').addEventListener('click', () => setWallLength(num($('#edWallLen').value)));
  $('#edWallLen').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('#edWallSet').click(); } });
  $('#edAreaSet').addEventListener('click', () => setRoomArea(num($('#edArea').value)));
  $('#edArea').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('#edAreaSet').click(); } });
  const setRoomHeight = () => {
    const r = state.sel && state.rooms.find(x => x.id === state.sel.room);
    if (!r) return;
    const v = $('#edH').value.trim();
    if (!v) { delete r.h; render(); return; }
    const h = num(v);
    if (!(h >= 2 && h <= 6)) { $('#edH').classList.add('is-bad'); return; }
    r.h = Math.round(h * 100) / 100;
    render();
  };
  $('#edHSet').addEventListener('click', setRoomHeight);
  $('#edH').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); setRoomHeight(); } });
  $('#edName').addEventListener('input', e => {
    const r = state.sel && state.rooms.find(x => x.id === state.sel.room);
    if (r) { r.name = e.target.value || 'Prostor'; renderPanel(); render(); }
  });
  $('#edDelete').addEventListener('click', () => {
    if (!state.sel) return;
    const id = state.sel.room;
    state.rooms = state.rooms.filter(x => x.id !== id);
    state.openings = state.openings.filter(o => o.room !== id);
    state.sel = null; render();
  });
  $('#edBackRoom').addEventListener('click', () => { if (state.sel) select({ type: 'room', room: state.sel.room }); });
  $$('#edOpen [data-otype]').forEach(b => b.addEventListener('click', () => {
    const o = state.sel && state.openings.find(x => x.id === state.sel.id);
    if (o) { o.type = b.dataset.otype; render(); }
  }));
  $('#edOpenDelete').addEventListener('click', () => { if (state.sel) { removeOpening(state.sel.id); render(); } });

  /* ---------- ORODJA ---------- */
  const setMode = m => {
    state.mode = m;
    $$('.plan__tool[data-mode]').forEach(b => { b.classList.toggle('is-active', b.dataset.mode === m); b.setAttribute('aria-pressed', b.dataset.mode === m); });
    svg.dataset.mode = m;
    if (m !== 'edit') state.sel = null;
    flash = null;
    render();
  };
  $$('.plan__tool[data-mode]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
  $('#planUndo').addEventListener('click', () => {
    const h = state.history.pop();
    if (!h) return;
    if (h.kind === 'room') { state.rooms = state.rooms.filter(r => r.id !== h.id); state.openings = state.openings.filter(o => o.room !== h.id); }
    else removeOpening(h.id);
    state.sel = null; flash = null; render();
  });
  $('#planClear').addEventListener('click', () => {
    Object.assign(state, { rooms: [], openings: [], history: [], sel: null, calibrated: false, upm: WORLD / 12 });
    flash = null; setMode('draw');
  });
  $('#planSample').addEventListener('click', () => {
    // primer: dnevna 5 × 6 m, hodnik 1,5 × 6 m, spalnica 4 × 3,5 m
    const u = 66, ox = 110, oy = 220;
    const R = (x0, y0, x1, y1) => [{ x: ox + x0 * u, y: oy + y0 * u }, { x: ox + x1 * u, y: oy + y0 * u }, { x: ox + x1 * u, y: oy + y1 * u }, { x: ox + x0 * u, y: oy + y1 * u }];
    Object.assign(state, {
      upm: u, calibrated: true, sel: null, nextId: 20, history: [],
      rooms: [
        { id: 1, name: 'Dnevna soba', pts: R(0, 0, 5, 6) },
        { id: 2, name: 'Hodnik', pts: R(5, 0, 6.5, 6) },
        { id: 3, name: 'Spalnica', pts: R(6.5, 0, 10.5, 3.5) }
      ],
      openings: [
        { id: 10, type: 'window', room: 1, wall: 0, t: 0.3 }, { id: 11, type: 'window', room: 1, wall: 3, t: 0.5 },
        { id: 12, type: 'door', room: 1, wall: 1, t: 0.75 },   // med dnevno in hodnikom
        { id: 13, type: 'door', room: 3, wall: 3, t: 0.3 },    // med spalnico in hodnikom
        { id: 14, type: 'door', room: 2, wall: 2, t: 0.5 },    // vhod
        { id: 15, type: 'window', room: 3, wall: 0, t: 0.5 }
      ]
    });
    flash = null; setMode('edit');
  });

  // višina stropa
  const hInput = $('#planH');
  const setHeight = (h, fromInput) => {
    if (!(h >= 2 && h <= 6)) return false;
    state.height = Math.round(h * 100) / 100;
    $$('.plan__h button').forEach(b => b.classList.toggle('is-active', Math.abs(+b.dataset.h - state.height) < 0.001));
    if (!fromInput) hInput.value = state.height.toFixed(2);
    hInput.classList.remove('is-bad');
    renderPanel();
    return true;
  };
  $$('.plan__h button').forEach(b => b.addEventListener('click', () => setHeight(+b.dataset.h)));
  hInput.addEventListener('input', () => { if (!setHeight(num(hInput.value), true)) hInput.classList.toggle('is-bad', hInput.value.trim() !== ''); });
  hInput.addEventListener('change', () => { if (!setHeight(num(hInput.value))) { hInput.value = state.height.toFixed(2); hInput.classList.remove('is-bad'); } });
  $$('.plan__rates .calc__opt').forEach(o => o.addEventListener('click', () => {
    state.rate = +o.dataset.rate;
    $$('.plan__rates .calc__opt').forEach(b => b.classList.toggle('is-active', b === o));
    renderPanel();
  }));

  /* ---------- RISANJE IN TAPI ---------- */
  const toWorld = e => {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const w = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: w.x, y: w.y };
  };
  let drawing = null;
  svg.addEventListener('pointerdown', e => {
    if (state.mode === 'edit') { state.sel = null; render(); return; }
    e.preventDefault();
    if (state.mode === 'door' || state.mode === 'window') {
      if (!state.rooms.length) { flash = '!Najprej narišite prostor, nato označite vrata in okna.'; renderPanel(); return; }
      const res = placeOpening(toWorld(e), state.mode);
      flash = res === 'miss' ? '!Tapnite bližje zidu.' : null;
      render();
      return;
    }
    svg.setPointerCapture(e.pointerId);
    drawing = { pts: [toWorld(e)] };
  });
  svg.addEventListener('pointermove', e => {
    if (!drawing) return;
    const p = toWorld(e);
    if (dist(p, drawing.pts[drawing.pts.length - 1]) < 2) return;
    drawing.pts.push(p);
    preview.setAttribute('points', drawing.pts.map(q => `${q.x},${q.y}`).join(' '));
    preview.setAttribute('stroke-width', 3 * px());
  });
  const finish = () => {
    if (!drawing) return;
    const raw = drawing.pts; drawing = null;
    preview.setAttribute('points', '');
    let pts = straighten(raw);
    if (!pts && isDiagonal(raw)) pts = rectFrom(raw[0], raw[raw.length - 1]);
    if (!pts) { flash = '!Obrisa ni bilo mogoče prepoznati. Narišite sklenjen obris ali potegnite diagonalo.'; renderPanel(); return; }
    const id = state.nextId++;
    state.rooms.push({ id, name: 'Prostor ' + (state.rooms.length + 1), pts });
    state.history.push({ kind: 'room', id });
    flash = null;
    render();
  };
  svg.addEventListener('pointerup', finish);
  svg.addEventListener('pointercancel', () => { drawing = null; preview.setAttribute('points', ''); });
  addEventListener('resize', render);

  /* ---------- POŠLJI S POVPRAŠEVANJEM ---------- */
  const summaryText = () => {
    const lines = state.rooms.map(r => {
      const c = roomCalc(r);
      return `${r.name}${r.h ? ` (višina ${fmt(r.h, 2)} m)` : ''}: ${fmt(c.floor, 1)} m² tal, stene ${fmt(c.walls, 1)} m², strop ${fmt(c.ceiling, 1)} m² (vrata ${c.doors}, okna ${c.wins})`;
    });
    const t = state.rooms.reduce((s, r) => s + roomCalc(r).total, 0);
    return `Tloris (višina stropa ${fmt(state.height, 2)} m${state.calibrated ? '' : ', mere ocenjene'}${anyMarked() ? '' : ', vrata/okna privzeto'}):\n` +
      lines.join('\n') + `\nSkupaj za barvanje: ${fmt(t, 0)} m² · okvirno ${fmt(Math.round(t * state.rate), 0)} € (${state.rate} €/m²)`;
  };
  const toPng = () => new Promise(resolve => {
    const clone = svg.cloneNode(true);
    clone.setAttribute('xmlns', NS);
    clone.setAttribute('width', 1200); clone.setAttribute('height', 1200);
    clone.querySelector('#planPreview')?.remove();
    const ink = getComputedStyle(document.documentElement).getPropertyValue('--c-ink').trim() || '#101014';
    const style = document.createElementNS(NS, 'style');
    style.textContent = `.plan__fill{fill:rgba(255,194,75,.14)}.plan__wall{stroke:${ink};stroke-linecap:round}.plan__hit,.plan__ohit{stroke:transparent;fill:transparent}` +
      `.plan__gap{stroke:${BG}}.plan__sym{stroke:${ink};fill:none}` +
      `text{font-family:Inter,Arial,sans-serif;fill:${ink}}.plan__len{font-weight:600;paint-order:stroke;stroke:${BG};stroke-width:4px}` +
      `.plan__name{fill:#56524c}.plan__area{font-weight:700}`;
    clone.insertBefore(style, clone.firstChild);
    const bg = document.createElementNS(NS, 'rect');
    bg.setAttribute('width', WORLD); bg.setAttribute('height', WORLD); bg.setAttribute('fill', BG);
    clone.insertBefore(bg, clone.firstChild.nextSibling);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = 1200; c.height = 1200;
      c.getContext('2d').drawImage(img, 0, 0, 1200, 1200);
      try { resolve(c.toDataURL('image/png')); } catch (e) { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone));
  });
  $('#planSend').addEventListener('click', async () => {
    if (!state.rooms.length) return;
    $('#planSend').disabled = true;
    const png = await toPng();
    try { localStorage.setItem(STORE, JSON.stringify({ png, summary: summaryText() })); } catch (e) {}
    location.href = 'kontakt.html#form';
  });

  setMode('draw');
})();
