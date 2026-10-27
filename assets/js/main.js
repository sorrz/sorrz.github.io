/* portfolio.sys — broken-tech behaviour
   - boot log → hero "powers on"
   - parallax shards (data-speed): 0 = scrolls normally, >0 = lags behind (background), <0 = rushes past (foreground)
   - random glitch bursts, screen tears that sometimes hold in place, noise
   Everything motion-related is skipped under prefers-reduced-motion. */
(() => {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* storage unavailable */ } },
  };

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- hex dump shards ---------- */
  document.querySelectorAll('[data-hex]').forEach((el) => {
    const rows = Number(el.dataset.hex) || 8;
    const start = Math.floor(rand(0x1000, 0xf000)) & 0xfff0;
    const lines = [];
    for (let i = 0; i < rows; i++) {
      const bytes = Array.from({ length: 8 }, () =>
        Math.random() < 0.06 ? '??' : Math.floor(Math.random() * 256).toString(16).padStart(2, '0'));
      lines.push(`${(start + i * 16).toString(16).padStart(6, '0')}  ${bytes.join(' ')}`);
    }
    el.textContent = lines.join('\n');
  });

  /* ---------- boot sequence ---------- */
  const hero = document.querySelector('.hero');
  const bootlog = document.getElementById('bootlog');
  const bootLines = [
    ['[  0.000000] portfolio.sys init, rev 2026.10', ''],
    ['[  0.004211] mounting /dev/dan ........................ ', 'ok'],
    ['[  0.013370] loading modules: qa, devops, dev ........ ', 'ok'],
    ['[  0.021804] attaching docker, kubernetes, azure ..... ', 'ok'],
    ['[  0.031337] display driver: signal integrity 37%', 'warn'],
    ['[  0.031338] WARN framebuffer desync. rendering anyway', 'warn'],
  ];

  function renderBootLine([text, status]) {
    const line = document.createElement('span');
    if (status === 'ok') {
      line.append(text);
      const ok = document.createElement('span');
      ok.className = 'ok';
      ok.textContent = 'ok';
      line.append(ok);
    } else {
      line.textContent = text;
      if (status === 'warn') line.className = 'warn';
    }
    line.append('\n');
    return line;
  }

  function finishBoot() {
    hero.classList.add('booted');
    if (!reduce) setTimeout(() => burst(4), 650);
  }

  if (reduce || store.get('booted')) {
    bootLines.forEach((l) => bootlog.append(renderBootLine(l)));
    finishBoot();
  } else {
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    cursor.textContent = ' ';
    bootlog.append(cursor);
    let i = 0;
    const next = () => {
      if (i >= bootLines.length) {
        store.set('booted', '1');
        jolt();
        finishBoot();
        return;
      }
      bootlog.insertBefore(renderBootLine(bootLines[i]), cursor);
      i++;
      setTimeout(next, i === bootLines.length - 1 ? 420 : rand(90, 220));
    };
    setTimeout(next, 250);
  }

  /* ---------- HUD: sector + progress ---------- */
  const sections = [...document.querySelectorAll('.sect')];
  const navLinks = [...document.querySelectorAll('.hud-nav a')];
  const hudSector = document.getElementById('hud-sector');
  const hudPct = document.getElementById('hud-pct');

  function updateHud() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? Math.round((window.scrollY / max) * 100) : 0;
    hudPct.textContent = String(pct).padStart(3, '0');

    let current = sections[0];
    for (const s of sections) {
      if (s.getBoundingClientRect().top <= window.innerHeight * 0.4) current = s;
    }
    hudSector.textContent = current.dataset.sector;
    navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${current.id}`));
  }

  /* ---------- parallax ---------- */
  const layers = [...document.querySelectorAll('[data-speed]')];
  let centers = [];

  function measure() {
    layers.forEach((el) => { el.style.transform = ''; });
    centers = layers.map((el) => {
      const r = el.getBoundingClientRect();
      return r.top + window.scrollY + r.height / 2;
    });
  }

  function updateParallax() {
    const mid = window.scrollY + window.innerHeight / 2;
    layers.forEach((el, i) => {
      // offset from viewport centre; element sits in its layout spot when centred
      const d = centers[i] - mid;
      const y = -d * Number(el.dataset.speed);
      el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
    });
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      if (!reduce) updateParallax();
      updateHud();
      ticking = false;
    });
  }

  function remeasure() {
    if (reduce) return;
    measure();
    updateParallax();
  }

  remeasure();
  updateHud();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { remeasure(); updateHud(); });
  window.addEventListener('load', remeasure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);

  /* ---------- heading decode on first view ---------- */
  const GLYPHS = '!<>-_\\/[]{}=+*^?#%01░▒▓█';
  function scramble(el) {
    const final = el.dataset.text || el.textContent;
    const frames = 22;
    let f = 0;
    const tick = () => {
      const solved = Math.floor((f / frames) * final.length);
      let out = '';
      for (let i = 0; i < final.length; i++) {
        out += i < solved || final[i] === ' ' ? final[i] : pick(GLYPHS);
      }
      el.textContent = out;
      if (f++ < frames) setTimeout(tick, 38);
      else el.textContent = final;
    };
    tick();
  }

  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        scramble(e.target);
        glitch(e.target, 420);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('.sect-head h2').forEach((h) => io.observe(h));
  }

  /* ---------- glitch bursts ---------- */
  const glitchables = [...document.querySelectorAll('.glitchable')];

  function glitch(el, ms = rand(180, 380)) {
    el.classList.remove('is-glitching');
    void el.offsetWidth; // restart the animation
    el.classList.add('is-glitching');
    setTimeout(() => el.classList.remove('is-glitching'), ms);
  }

  function visible(el) {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  }

  function jolt() {
    document.body.classList.remove('jolt');
    void document.body.offsetWidth;
    document.body.classList.add('jolt');
    setTimeout(() => document.body.classList.remove('jolt'), 160);
  }

  /* screen tear: usually a flash, sometimes it freezes in place while content scrolls under it */
  const tear = document.getElementById('tear');
  function tearFlash() {
    tear.classList.remove('hold');
    tear.style.setProperty('--y', `${rand(5, 92).toFixed(1)}vh`);
    tear.style.setProperty('--h', `${Math.round(rand(3, 46))}px`);
    tear.style.setProperty('--x', `${Math.round(rand(-30, 30))}px`);
    tear.classList.add('on');
    setTimeout(() => tear.classList.remove('on'), rand(60, 170));
  }
  function tearHold() {
    tear.classList.remove('on');
    tear.style.setProperty('--y', `${rand(15, 80).toFixed(1)}vh`);
    tear.style.setProperty('--h', `${Math.round(rand(14, 70))}px`);
    tear.style.setProperty('--x', '0px');
    tear.classList.add('hold');
    setTimeout(() => tear.classList.remove('hold'), rand(1200, 3200));
  }

  function burst(n = 3) {
    for (let k = 0; k < n; k++) {
      setTimeout(() => {
        const vis = glitchables.filter(visible);
        if (vis.length) glitch(pick(vis));
        tearFlash();
      }, k * rand(70, 140));
    }
  }

  function scheduleGlitch() {
    setTimeout(() => {
      if (!document.hidden) {
        const roll = Math.random();
        if (roll < 0.55) {
          const vis = glitchables.filter(visible);
          if (vis.length) glitch(pick(vis));
          if (Math.random() < 0.5) tearFlash();
        } else if (roll < 0.75) {
          tearHold();
        } else if (roll < 0.9) {
          burst(3);
        } else {
          jolt();
          tearFlash();
        }
      }
      scheduleGlitch();
    }, rand(1600, 5200));
  }

  /* ---------- noise ---------- */
  function startNoise() {
    const canvas = document.getElementById('noise');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = 320, h = 200;
    canvas.width = w;
    canvas.height = h;
    const img = ctx.createImageData(w, h);
    const data = img.data;
    setInterval(() => {
      if (document.hidden) return;
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255;
        data[i] = data[i + 1] = data[i + 2] = v;
        data[i + 3] = Math.random() < 0.5 ? 255 : 0;
      }
      // occasional bright horizontal streak
      if (Math.random() < 0.15) {
        const row = Math.floor(Math.random() * h);
        for (let x = 0; x < w; x++) {
          const i = (row * w + x) * 4;
          data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    }, 85);
  }

  /* ---------- error dialog ---------- */
  const errbox = document.getElementById('errbox');
  if (!store.get('err-ignored')) {
    setTimeout(() => {
      errbox.hidden = false;
      errbox.classList.add('show');
      setTimeout(() => errbox.classList.add('frozen'), 600);
    }, reduce ? 1500 : 6500);
  }
  document.getElementById('err-retry').addEventListener('click', () => {
    if (reduce) return;
    jolt();
    burst(6);
    tearHold();
  });
  document.getElementById('err-ignore').addEventListener('click', () => {
    errbox.hidden = true;
    store.set('err-ignored', '1');
  });

  if (!reduce) {
    startNoise();
    scheduleGlitch();
  }
})();
