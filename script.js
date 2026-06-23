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
  const maxPhotos = 8, maxPhotoSize = 8 * 1024 * 1024, maxTotalSize = 20 * 1024 * 1024;
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
      if (file.size > maxPhotoSize) return `Fotografija »${file.name}« je večja od 8 MB.`;
      total += file.size;
    }
    if (total > maxTotalSize) return 'Skupna velikost fotografij je lahko največ 20 MB.';
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
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.message || 'Pošiljanje ni uspelo.');

      note.textContent = `Hvala, ${ime}! Oglasimo se v 24 urah.`;
      form.reset();
      clearPhotoPreviews();
      if (fileStatus) fileStatus.textContent = 'Izberite fotografije sten';
      $$('.field').forEach(f => f.classList.remove('error'));
    } catch (err) {
      note.style.color = 'var(--c-pink)';
      note.textContent = 'Povpraševanja trenutno ni bilo mogoče poslati. Poskusite znova ali nam pišite na info@pobelime.si.';
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
  const m2 = $('#m2'), m2out = $('#m2out'), priceEl = $('#price'), surfEl = $('#surface');
  let rate = 5;        // € / m² — privzeto dvojni premaz
  const HEIGHT = 2.6;  // predpostavljena višina stropa (m)
  if (m2) {
    const fmt = n => n.toLocaleString('sl-SI');
    // iz tlorisa ocenimo stene (obseg × višina) + strop (tloris)
    const surface = floor => Math.round(4 * Math.sqrt(floor) * HEIGHT + floor);
    const animate = (el, target) => {
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
      m2out.textContent = fmt(v) + ' m²';
      const surf = surface(v);
      animate(surfEl, surf);
      animate(priceEl, surf * rate);
      const pct = ((v - m2.min) / (m2.max - m2.min)) * 100;
      m2.style.background = `linear-gradient(90deg, var(--c-pink) ${pct}%, rgba(246,243,238,.2) ${pct}%)`;
    };
    m2.addEventListener('input', render);
    $$('.calc__chips button').forEach(c => c.addEventListener('click', () => {
      m2.value = c.dataset.m2; render();
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
