/* ============================================================
   POBELI ME — interakcije
   ============================================================ */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- PRELOADER ---------- */
  const pre = $('#preloader');
  const finishPre = () => {
    if (!pre) return;
    pre.classList.add('done');
    setTimeout(() => pre.classList.add('gone'), 1000);
  };
  window.addEventListener('load', () => setTimeout(finishPre, reduce ? 0 : 1500));
  // safety net
  setTimeout(finishPre, 3200);

  /* ---------- YEAR ---------- */
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  /* ---------- CUSTOM CURSOR ---------- */
  const cursor = $('#cursor');
  if (cursor && window.matchMedia('(hover:hover)').matches) {
    const span = $('span', cursor);
    let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
    addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
    const loop = () => {
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      cursor.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener('mouseover', e => {
      const t = e.target.closest('[data-cursor]');
      cursor.classList.remove('hover', 'view');
      if (t) {
        const mode = t.dataset.cursor;
        cursor.classList.add(mode);
        if (span) span.textContent = mode === 'view' ? 'Poglej' : '';
      }
    });
  }

  /* ---------- NAV: hide on scroll down / solid on scroll ---------- */
  const nav = $('#nav');
  let lastY = 0;
  addEventListener('scroll', () => {
    const sy = scrollY;
    nav.classList.toggle('solid', sy > 40);
    if (sy > lastY && sy > 400 && !menu.classList.contains('open')) nav.classList.add('hidden');
    else nav.classList.remove('hidden');
    lastY = sy;
  }, { passive: true });

  /* ---------- MOBILE MENU ---------- */
  const burger = $('#burger'), menu = $('#menu');
  const toggleMenu = (force) => {
    const open = force ?? !menu.classList.contains('open');
    menu.classList.toggle('open', open);
    nav.classList.toggle('open-burger', open);
    document.body.classList.toggle('lock', open);
  };
  burger?.addEventListener('click', () => toggleMenu());
  $$('#menu a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));

  /* ---------- SCROLL REVEAL ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        const sibs = [...e.target.parentElement.children].filter(c => c.classList.contains('reveal'));
        const idx = sibs.indexOf(e.target);
        e.target.style.transitionDelay = `${Math.min(idx, 6) * 70}ms`;
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---------- COUNTERS ---------- */
  const counters = $$('[data-count]');
  const cio = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, end = +el.dataset.count, suf = el.dataset.suffix || '';
      const dur = 1600, t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(end * eased) + suf;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      cio.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => cio.observe(c));

  /* ---------- MAGNETIC BUTTONS ---------- */
  if (!reduce && window.matchMedia('(hover:hover)').matches) {
    $$('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const mx = e.clientX - r.left - r.width / 2;
        const my = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${mx * 0.25}px, ${my * 0.35}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- HERO LAVA PARALLAX (drift whole layer, blobs keep animating) ---------- */
  if (!reduce) {
    const lava = $('.hero__lava');
    addEventListener('scroll', () => {
      const sy = scrollY;
      if (sy > innerHeight || !lava) return;
      lava.style.transform = `translateY(${sy * 0.12}px)`;
    }, { passive: true });
  }

  /* ---------- FORM ---------- */
  const form = $('#form'), note = $('#formNote');
  const fileInput = $('#slike'), fileStatus = $('#fileStatus'), filePreview = $('#filePreview');
  const maxPhotos = 8, maxPhotoSize = 40 * 1024 * 1024, maxTotalSize = 200 * 1024 * 1024;
  const clearPhotoPreviews = () => {
    if (!filePreview) return;
    filePreview.querySelectorAll('img').forEach(img => URL.revokeObjectURL(img.src));
    filePreview.replaceChildren();
  };
  const validatePhotos = files => {
    if (files.length > maxPhotos) return `Dodate lahko največ ${maxPhotos} fotografij.`;
    let total = 0;
    for (const file of files) {
      if (!file.type.startsWith('image/')) return 'Izberite samo slikovne datoteke.';
      if (file.size > maxPhotoSize) return `Fotografija »${file.name}« je prevelika.`;
      total += file.size;
    }
    if (total > maxTotalSize) return 'Fotografije so skupaj prevelike.';
    return '';
  };
  fileInput?.addEventListener('change', () => {
    const files = [...fileInput.files];
    const error = validatePhotos(files);
    clearPhotoPreviews();
    fileInput.closest('.field').classList.toggle('error', Boolean(error));
    if (error) {
      fileStatus.textContent = error;
      fileInput.value = '';
      return;
    }
    fileStatus.textContent = files.length === 0
      ? 'Izberite fotografije sten'
      : files.length === 1
        ? `Izbrana fotografija: ${files[0].name}`
        : `Izbranih je ${files.length} fotografij`;
    files.forEach(file => {
      const figure = document.createElement('figure');
      const image = document.createElement('img');
      const caption = document.createElement('figcaption');
      image.src = URL.createObjectURL(file);
      image.alt = '';
      caption.textContent = file.name;
      figure.append(image, caption);
      filePreview?.append(figure);
    });
  });

  // pomanjša fotografijo in vrne { filename, type, content(base64) } ali null
  const shrinkPhoto = async (file, max, q) => {
    const toB64 = blob => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = no; r.readAsDataURL(blob); });
    const base = (file.name || 'slika').replace(/\.[^.]+$/, '');
    try {
      let src;
      try { src = await createImageBitmap(file); }
      catch (e) {
        src = await new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = URL.createObjectURL(file); });
      }
      const w = src.width || src.naturalWidth, h = src.height || src.naturalHeight;
      const k = Math.min(1, max / Math.max(w, h));
      const c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
      c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
      const blob = await new Promise(ok => c.toBlob(ok, 'image/jpeg', q));
      if (!blob) throw new Error('toBlob');
      return { filename: base + '.jpg', type: 'image/jpeg', content: await toB64(blob) };
    } catch (e) {
      // brskalnik slike ne zna odpreti (npr. HEIC v Chromu): majhno pošljemo kar v izvirniku
      const okType = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(file.type);
      if (okType && file.size < 1.2e6) return { filename: file.name.replace(/[^A-Za-z0-9._-]/g, '_'), type: file.type, content: await toB64(file) };
      return null;
    }
  };

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    let ok = true;
    ['ime', 'email', 'tip'].forEach(id => {
      const f = $('#' + id), field = f.closest('.field');
      const valid = id === 'email' ? /\S+@\S+\.\S+/.test(f.value) : f.value.trim() !== '';
      field.classList.toggle('error', !valid);
      if (!valid) ok = false;
    });
    const photoError = validatePhotos(fileInput ? [...fileInput.files] : []);
    if (photoError) {
      fileInput.closest('.field').classList.add('error');
      fileStatus.textContent = photoError;
      ok = false;
    }
    if (!ok) { note.textContent = 'Prosimo, preverite označena polja.'; note.style.color = 'var(--c-pink)'; return; }
    const ime = $('#ime').value.trim().split(' ')[0];
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    note.style.color = 'var(--c-yellow)';
    note.textContent = 'Pošiljamo povpraševanje ...';

    try {
      if (location.protocol === 'file:') {
        await new Promise(r => setTimeout(r, 600));
        note.textContent = 'Lokalni predogled: povpraševanje ni bilo poslano.';
        return;
      }
      const fd = new FormData(form);
      const payload = {
        ime: fd.get('ime') || '', email: fd.get('email') || '', tel: fd.get('tel') || '',
        tip: fd.get('tip') || '', sporocilo: fd.get('sporocilo') || '', website: fd.get('website') || '',
        tloris: '', attachments: []
      };
      // fotografije: pred pošiljanjem jih pomanjšamo (hitreje in pod omejitvijo strežnika)
      const photos = fileInput ? [...fileInput.files] : [];
      let skipped = 0;
      for (let i = 0; i < photos.length; i++) {
        note.textContent = `Pripravljamo fotografije (${i + 1}/${photos.length}) ...`;
        const a = await shrinkPhoto(photos[i], 1600, 0.8);
        if (a) { a.filename = `foto-${i + 1}-` + a.filename; payload.attachments.push(a); } else skipped++;
      }
      // priložen tloris iz izračuna cene
      const plan = document.getElementById('planAttach');
      if (plan && !plan.hidden) {
        try {
          const saved = JSON.parse(localStorage.getItem('pobeli_tloris') || 'null');
          if (saved) {
            payload.tloris = saved.summary || '';
            if (saved.png) payload.attachments.push({ filename: 'tloris.png', type: 'image/png', content: saved.png.split(',')[1] });
          }
        } catch (e) {}
      }
      // če je vse skupaj preveliko, fotografije še enkrat stisnemo
      const size = () => payload.attachments.reduce((n, a) => n + a.content.length, 0);
      if (size() > 4.6e6 && photos.length) {
        note.textContent = 'Fotografije so velike, dodatno jih stiskamo ...';
        const plan0 = payload.attachments.filter(a => a.filename === 'tloris.png');
        payload.attachments = [];
        for (let i = 0; i < photos.length; i++) { const a = await shrinkPhoto(photos[i], 1100, 0.6); if (a) { a.filename = `foto-${i + 1}-` + a.filename; payload.attachments.push(a); } }
        payload.attachments.push(...plan0);
      }
      if (size() > 4.9e6) throw new Error('too-big');
      note.textContent = 'Pošiljamo povpraševanje ...';
      const res = await fetch(form.getAttribute('action') || '/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.message || 'Pošiljanje ni uspelo.');
      if (plan && !plan.hidden) { try { localStorage.removeItem('pobeli_tloris'); } catch (e) {} plan.hidden = true; }
      if (skipped) note.dataset.skipped = skipped;

      note.style.color = 'var(--c-yellow)';
      note.textContent = `Hvala, ${ime}! Povpraševanje je poslano, oglasimo se v 24 urah.` + (skipped ? ` (${skipped} fotografij ni bilo mogoče odpreti — pošljite jih na info@pobelime.si.)` : '');
      form.reset();
      clearPhotoPreviews();
      if (fileStatus) fileStatus.textContent = 'Izberite fotografije sten';
      $$('.field').forEach(f => f.classList.remove('error'));
    } catch (err) {
      note.style.color = 'var(--c-pink)';
      note.textContent = err && err.message === 'too-big'
        ? 'Fotografije so skupaj prevelike. Izberite jih manj ali jih pošljite na info@pobelime.si.'
        : 'Povpraševanja trenutno ni bilo mogoče poslati. Poskusite znova ali nam pišite na info@pobelime.si.';
    } finally {
      submit.disabled = false;
    }
  });

  /* ---------- COLOR SWITCHER ---------- */
  const swapImg = $('#swapImg'), swapLabel = $('#swapLabel');
  const swapNames = { '0': 'Topla bež', '50': 'Globoka modra', '100': 'Žajbelj zelena' };
  $$('.swap__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const pos = btn.dataset.pos;
      swapImg.dataset.pos = pos;
      if (swapLabel) swapLabel.textContent = swapNames[pos];
      $$('.swap__btn').forEach(b => b.classList.toggle('is-active', b === btn));
    });
  });

  /* ---------- CENOVNI KALKULATOR ---------- */
  // Vsak prostor računamo kot kvadraten: stene = 4 × stranica × višina, + strop.
  // Od vsakega prostora odštejemo ena povprečna vrata in eno povprečno okno.
  // Primer: soba 5 × 5 × 3 m → 60 m² sten + 25 m² stropa = 85 m² − 1,6 − 1,68 ≈ 82 m².
  const m2 = $('#m2'), m2out = $('#m2out'), priceEl = $('#price'), surfEl = $('#surface');
  const wallsEl = $('#walls'), ceilEl = $('#ceil'), roomsEl = $('#rooms');
  let rate = 5;      // € / m² — privzeto dvojni premaz
  let rooms = 1;     // število prostorov za barvanje
  let height = 2.6;  // višina stropa (m)
  const DOOR = 0.8 * 2.0;    // povprečna vrata = 1,6 m²
  const WINDOW = 1.2 * 1.4;  // povprečno okno = 1,68 m²
  if (m2) {
    const fmt = n => n.toLocaleString('sl-SI');
    // strop se vedno barva zraven
    const calc = (floor, n, h) => {
      const side = Math.sqrt(floor / n);                    // stranica enega prostora
      const gross = n * 4 * side * h;                       // stene vseh prostorov
      const walls = Math.max(0, gross - n * (DOOR + WINDOW));
      const ceiling = floor;
      return { walls: Math.round(walls), ceiling: Math.round(ceiling), total: Math.round(walls + ceiling) };
    };
    const animate = (el, target) => {
      if (!el) return;
      const t0 = performance.now(), from = +el.textContent.replace(/\D/g, '') || 0;
      const tick = now => {
        const p = Math.min((now - t0) / 350, 1);
        el.textContent = fmt(Math.round(from + (target - from) * p));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const render = () => {
      const v = +m2.value;
      // več prostorov kot 1 na 5 m² ni realno
      rooms = Math.min(rooms, Math.max(1, Math.floor(v / 5)));
      m2out.textContent = fmt(v) + ' m²';
      if (roomsEl) roomsEl.textContent = rooms;
      const r = calc(v, rooms, height);
      animate(wallsEl, r.walls);
      animate(ceilEl, r.ceiling);
      animate(surfEl, r.total);
      animate(priceEl, r.total * rate);
      const pct = ((v - m2.min) / (m2.max - m2.min)) * 100;
      m2.style.background = `linear-gradient(90deg, var(--c-pink) ${pct}%, rgba(246,243,238,.2) ${pct}%)`;
    };
    m2.addEventListener('input', render);
    $$('.calc__chips button').forEach(c => c.addEventListener('click', () => {
      m2.value = c.dataset.m2;
      if (c.dataset.rooms) rooms = +c.dataset.rooms;
      render();
    }));
    $('#roomsMinus')?.addEventListener('click', () => { rooms = Math.max(1, rooms - 1); render(); });
    $('#roomsPlus')?.addEventListener('click', () => { rooms = Math.min(12, rooms + 1); render(); });
    $$('.calc__seg button').forEach(b => b.addEventListener('click', () => {
      height = +b.dataset.h;
      $$('.calc__seg button').forEach(x => x.classList.toggle('is-active', x === b));
      render();
    }));
    $$('.calc__opt').forEach(o => o.addEventListener('click', () => {
      rate = +o.dataset.rate;
      $$('.calc__opt').forEach(b => b.classList.toggle('is-active', b === o));
      render();
    }));
    render();
  }

  /* ---------- BACK TO TOP ---------- */
  const totop = $('#totop');
  if (totop) {
    addEventListener('scroll', () => {
      totop.classList.toggle('show', scrollY > innerHeight * 0.9);
    }, { passive: true });
    totop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  /* ---------- FAQ: one open at a time ---------- */
  const accItems = $$('.acc__item');
  accItems.forEach(item => {
    item.addEventListener('toggle', () => {
      if (item.open) accItems.forEach(o => { if (o !== item) o.open = false; });
    });
  });

  /* ---------- ACTIVE NAV LINK ---------- */
  const secs = $$('main section[id]');
  const links = $$('.nav__links a');
  const sio = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const id = e.target.id;
        links.forEach(l => l.style.opacity = l.getAttribute('href') === '#' + id ? '1' : '');
      }
    });
  }, { threshold: 0.4 });
  secs.forEach(s => sio.observe(s));
})();
