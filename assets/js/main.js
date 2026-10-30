// =========================================================
// D³ Lab — 공통 레이아웃 + 데이터 렌더링
// 빌드 도구 없이 동작 (index.html 더블클릭으로도 열림)
// =========================================================

(function () {
  const SITE = window.SITE || {};
  const page = document.body.dataset.page;

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const initials = (name) =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

  const logoHTML = () => {
    // "D³ Lab" → D<sup>3</sup> Lab
    return esc(SITE.name || "Lab").replace("³", "<sup>3</sup>");
  };

  // ---------- Header / Footer ----------

  function renderHeader() {
    const el = document.getElementById("site-header");
    if (!el) return;
    const links = (SITE.nav || [])
      .map((n) => `<a href="${n.href}" class="${n.page === page ? "active" : ""}">${esc(n.label)}</a>`)
      .join("");
    el.className = "site-header";
    el.innerHTML = `
      <div class="container">
        <a class="logo" href="index.html">${logoHTML()}</a>
        <div class="header-actions">
          <nav class="nav">${links}</nav>
          <button class="theme-toggle" type="button" aria-label="Switch color theme"></button>
          <button class="nav-toggle" aria-label="Menu" aria-expanded="false">Menu</button>
        </div>
      </div>`;
    setupThemeToggle(el.querySelector(".theme-toggle"));
    const btn = el.querySelector(".nav-toggle");
    const nav = el.querySelector(".nav");
    btn.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
    });
  }

  // 라이트/다크 전환: 기본은 시스템 설정, 버튼으로 바꾸면 그 선택을 기억
  function setupThemeToggle(btn) {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const current = () => document.documentElement.dataset.theme || (media.matches ? "dark" : "light");
    const SUN = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
    const MOON = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
    const paint = () => {
      const dark = current() === "dark";
      btn.innerHTML = dark ? SUN : MOON;   // 누르면 바뀔 테마의 아이콘을 보여줌
      btn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    };
    btn.addEventListener("click", () => {
      const next = current() === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch (e) {}
      paint();
      window.dispatchEvent(new Event("themechange"));
    });
    media.addEventListener?.("change", paint);
    paint();
  }

  function renderFooter() {
    const el = document.getElementById("site-footer");
    if (!el) return;
    el.className = "site-footer";
    el.innerHTML = `
      <div class="container">
        <div>
          <strong>${logoHTML()}</strong> — ${esc(SITE.fullName)}<br />
          ${esc(SITE.affiliation)}
        </div>
        <div class="footer-contact">
          <a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a><br />
          ${esc(SITE.office || "")}<br />
          ${esc(SITE.address || "")}
        </div>
      </div>
      <div class="container footer-copy">
        © ${new Date().getFullYear()} ${esc(SITE.name)}
      </div>`;
  }

  // ---------- News ----------

  function renderNews(el, limit) {
    const items = [...(window.NEWS || [])].sort((a, b) => b.date.localeCompare(a.date));
    const list = limit ? items.slice(0, limit) : items;
    if (!list.length) {
      el.innerHTML = `<p class="empty">No news yet.</p>`;
      return;
    }
    // text는 연구실에서 직접 작성하는 내용이라 링크(HTML) 허용
    el.innerHTML = `<ul class="timeline">${list
      .map((n) => `<li><time>${esc(n.date)}</time><div>${n.text}</div></li>`)
      .join("")}</ul>`;
  }

  // ---------- Publications ----------

  // showPartner: 기업 협업 표시 (Research 페이지에서만 사용)
  function pubItem(p, showPartner = false) {
    // authors: "A, B, and C" 문자열 또는 ["A", "B"] 배열
    let authors = esc(Array.isArray(p.authors) ? p.authors.join(", ") : p.authors || "");
    for (const name of SITE.highlightAuthors || []) {
      authors = authors.split(esc(name)).join(`<strong>${esc(name)}</strong>`);
    }
    const links = Object.entries(p.links || {})
      .filter(([, url]) => url)
      .map(([k, url]) => `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(k)}</a>`)
      .join(" · ");
    return `
      <li class="pub">
        <div class="pub-title">${esc(p.title)}${showPartner && p.partner ? `<span class="partner">with ${esc(p.partner)}</span>` : ""}</div>
        <div class="pub-authors">${authors}</div>
        <div class="pub-meta">
          <span class="venue" title="${esc(p.venueFull || p.venue)}">${esc(p.venue)}</span>
          ${p.award ? `<span class="award">${esc(p.award)}</span>` : ""}
          ${links ? `<span>${links}</span>` : ""}
        </div>
      </li>`;
  }

  function sortedPubs() {
    // 연도 최신순, 같은 연도는 data/publications.js에 적힌 순서(위가 최신) 유지
    return (window.PUBLICATIONS || [])
      .map((p, i) => [p, i])
      .sort((a, b) => b[0].year - a[0].year || a[1] - b[1])
      .map(([p]) => p);
  }

  // Research 페이지: 연구 방향별 관련 논문
  function renderDirectionPubs(el) {
    const list = sortedPubs().filter((p) => p.direction === el.dataset.direction);
    el.innerHTML = list.length
      ? `<ul class="pub-list">${list.map((p) => pubItem(p, true)).join("")}</ul>`
      : `<p class="empty">Coming soon.</p>`;
  }

  function renderPublications(el) {
    const all = sortedPubs();
    const types = ["all", ...new Set(all.map((p) => p.type))];
    let type = "all";
    let query = "";

    el.innerHTML = `
      <div class="pub-controls">
        ${types.map((t) => `<button class="chip${t === "all" ? " active" : ""}" data-type="${esc(t)}">${esc(t[0].toUpperCase() + t.slice(1))}</button>`).join("")}
        <input class="search" type="search" placeholder="Search title, author, venue…" />
      </div>
      <div class="pub-results"></div>`;

    const results = el.querySelector(".pub-results");

    function draw() {
      const q = query.toLowerCase();
      const list = all.filter(
        (p) =>
          (type === "all" || p.type === type) &&
          (!q || [p.title, p.venue, ...(p.authors || [])].join(" ").toLowerCase().includes(q))
      );
      if (!list.length) {
        results.innerHTML = `<p class="empty">No publications found.</p>`;
        return;
      }
      const years = [...new Set(list.map((p) => p.year))];
      results.innerHTML = years
        .map(
          (y) => `<h3 class="pub-year">${y}</h3>
            <ul class="pub-list">${list.filter((p) => p.year === y).map((p) => pubItem(p)).join("")}</ul>`
        )
        .join("");
    }

    el.querySelectorAll(".chip").forEach((c) =>
      c.addEventListener("click", () => {
        el.querySelectorAll(".chip").forEach((x) => x.classList.remove("active"));
        c.classList.add("active");
        type = c.dataset.type;
        draw();
      })
    );
    el.querySelector(".search").addEventListener("input", (e) => {
      query = e.target.value;
      draw();
    });
    draw();
  }

  // ---------- People ----------

  function avatar(m) {
    return m.photo
      ? `<img class="avatar" src="${esc(m.photo)}" alt="${esc(m.name)}" />`
      : `<div class="avatar" aria-hidden="true">${esc(initials(m.name))}</div>`;
  }

  function renderPeople(el) {
    const members = window.MEMBERS || [];
    const groups = [
      ["postdoc", "Postdoctoral Researchers"],
      ["phd", "Ph.D. Students"],
      ["ms", "M.S. Students"],
      ["intern", "Undergraduate Interns"],
    ];
    let html = "";

    const pi = members.find((m) => m.role === "pi");
    if (pi) {
      const ext = (url, label) => url && `<a href="${esc(url)}" target="_blank" rel="noopener">${label}</a>`;
      const links = [
        pi.email && `<a href="mailto:${esc(pi.email)}">Email</a>`,
        ext(pi.homepage, "Homepage"),
        ext(pi.scholar, "Google Scholar"),
        ext(pi.github, "GitHub"),
        ext(pi.dblp, "DBLP"),
        ext(pi.cv, "CV"),
      ].filter(Boolean).join(" · ");
      const bio = (Array.isArray(pi.bio) ? pi.bio : [pi.bio]).filter(Boolean).map((b) => `<p>${esc(b)}</p>`).join("");
      const highlights = (pi.highlights || []).map((h) => `<li>${esc(h)}</li>`).join("");
      html += `
        <h2 class="group-title" style="margin-top:0">Principal Investigator</h2>
        <div class="pi-card">
          ${avatar(pi)}
          <div>
            <h3>${esc(pi.name)}</h3>
            <div class="role">${esc(pi.title || "")}</div>
            ${pi.subtitle ? `<div class="muted" style="font-size:0.9rem">${esc(pi.subtitle)}</div>` : ""}
            ${bio}
            ${highlights ? `<ul class="pi-highlights">${highlights}</ul>` : ""}
            ${links ? `<p class="pi-links">${links}</p>` : ""}
          </div>
        </div>`;
    }

    if (!members.some((m) => m.role !== "pi" && m.role !== "alumni")) {
      html += `
        <h2 class="group-title">Students &amp; Researchers</h2>
        <div class="callout">
          <div>
            <h3>Be our first members!</h3>
            <p>We are looking for M.S., Ph.D., integrated M.S.–Ph.D. students, interns, and postdocs.</p>
          </div>
          <a class="btn primary" href="join.html">Join Us</a>
        </div>`;
    }

    for (const [role, title] of groups) {
      const list = members.filter((m) => m.role === role);
      if (!list.length) continue;
      html += `<h2 class="group-title">${title}</h2><div class="people-grid">${list
        .map(
          (m) => `
          <div class="person">
            ${avatar(m)}
            <h3>${m.homepage ? `<a href="${esc(m.homepage)}" target="_blank" rel="noopener">${esc(m.name)}</a>` : esc(m.name)}</h3>
            ${m.interests ? `<p>${esc(m.interests)}</p>` : ""}
          </div>`
        )
        .join("")}</div>`;
    }

    const alumni = members.filter((m) => m.role === "alumni");
    if (alumni.length) {
      html += `<h2 class="group-title">Alumni</h2><ul class="alumni-list">${alumni
        .map((m) => `<li>${esc(m.name)} <span class="muted">— ${esc(m.note || "")}</span></li>`)
        .join("")}</ul>`;
    }

    el.innerHTML = html;
  }

  // ---------- Hero: 여러 시계열 + 상관행렬 ----------
  // 아래: 시계열 K개가 흐름 / 위: 최근 구간(window)의 상관행렬이 계속 변함

  // ---------- 애니메이션 시간 진행 ----------
  // 화면 주사율(60Hz/120Hz)이나 브라우저(Chrome/Safari)와 상관없이 초당 60단계로 진행.
  // step(): 한 단계 진행, render(): 그리기. 화면 밖이면 멈춤(isVisible).
  function runFixedStep(step, render, isVisible) {
    const STEP_MS = 1000 / 60;
    let last = performance.now(), acc = 0;
    function frame(now) {
      requestAnimationFrame(frame);
      const dt = Math.min(now - last, 100);   // 탭 전환 등으로 오래 멈췄다 돌아와도 한꺼번에 몰아서 진행하지 않음
      last = now;
      if (!isVisible()) return;
      acc += dt;
      let n = 0;
      while (acc >= STEP_MS && n < 4) { step(); acc -= STEP_MS; n++; }
      if (n) render();
    }
    requestAnimationFrame(frame);
  }

  // ---------- 분야(X) 그림: 심전도(의료), 캔들 차트(금융), 분자 구조(화학·생명), 칩(반도체·시스템), 해·구름(기상), 안테나(IoT·센서), 로봇(로보틱스) ----------
  // 첫 화면과 Research 페이지 애니메이션에서 함께 사용. color(alpha) → 색 문자열
  // 첫 화면: 시계열이 나오는 분야 / Research AI + X: 시계열이 아니어도 되는 다양한 분야
  const HERO_DOMAINS = ["ecg", "candles", "weather", "sensor", "robot"];
  const AIX_DOMAINS = ["ecg", "candles", "molecule", "chip", "robot"];
  function drawDomainGlyph(ctx, color, idx, cx, cy, S, alpha, reveal) {   // idx: 그림 이름
    const dot = (x, y, r, fill) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); };
    const stroke = (a, lw = 1.4) => { ctx.strokeStyle = color(a); ctx.lineWidth = lw; ctx.lineJoin = "round"; ctx.lineCap = "round"; };

    // 각 그림은 (중심 cx, cy, 크기 S, 투명도 a, 그려진 정도 r)를 받음
    function ecg(cx, cy, S, a, r) {
      const x0 = cx - S / 2, beat = S / 3;
      const shape = [[0, 0], [0.18, 0], [0.24, -0.08], [0.3, 0], [0.4, 0], [0.45, 0.12], [0.5, -0.62], [0.55, 0.28], [0.6, 0], [0.72, 0], [0.8, -0.14], [0.88, 0], [1, 0]];
      ctx.beginPath();
      let first = true;
      for (let b = 0; b < 3; b++) for (const [u, v] of shape) {
        const x = x0 + (b + u) * beat;
        if (x > x0 + S * r) break;
        const y = cy + v * S * 0.42;
        first ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        first = false;
      }
      stroke(a, 1.6); ctx.stroke();
    }
    function candles(cx, cy, S, a, r) {
      const n = 7, gw = S / n, vals = [0.1, -0.15, 0.05, 0.3, 0.15, 0.4, 0.25];
      for (let i = 0; i < n * r; i++) {
        const x = cx - S / 2 + gw * (i + 0.5), open = vals[i] * S * 0.5, close = (vals[i + 1] ?? 0.32) * S * 0.5;
        const yTop = cy - Math.max(open, close), yBot = cy - Math.min(open, close);
        stroke(a * 0.7, 1); ctx.beginPath(); ctx.moveTo(x, yTop - S * 0.08); ctx.lineTo(x, yBot + S * 0.08); ctx.stroke();
        const up = close > open;
        ctx.beginPath(); ctx.rect(x - gw * 0.28, yTop, gw * 0.56, Math.max(2, yBot - yTop));
        if (up) { ctx.fillStyle = color(a * 0.9); ctx.fill(); } else { ctx.fillStyle = color(a * 0.12); ctx.fill(); stroke(a, 1); ctx.stroke(); }
      }
    }
    function molecule(cx, cy, S, a) {
      const R = S * 0.24, ring = Array.from({ length: 6 }, (_, i) => [cx - S * 0.08 + R * Math.cos(Math.PI / 6 + (i * Math.PI) / 3), cy + R * Math.sin(Math.PI / 6 + (i * Math.PI) / 3)]);
      const branch = [[ring[0], [ring[0][0] + R * 0.95, ring[0][1] - R * 0.5]], [ring[3], [ring[3][0] - R * 0.95, ring[3][1] + R * 0.5]], [ring[5], [ring[5][0] + R * 0.1, ring[5][1] - R * 1.0]]];
      stroke(a, 1.4);
      for (let i = 0; i < 6; i++) {
        const [p, q] = [ring[i], ring[(i + 1) % 6]];
        ctx.beginPath(); ctx.moveTo(...p); ctx.lineTo(...q); ctx.stroke();
        if (i % 2 === 0) {   // 이중 결합
          const mx = cx - S * 0.08, my = cy, k = 0.78;
          ctx.beginPath(); ctx.moveTo(mx + (p[0] - mx) * k, my + (p[1] - my) * k); ctx.lineTo(mx + (q[0] - mx) * k, my + (q[1] - my) * k); ctx.stroke();
        }
      }
      for (const [p, q] of branch) { ctx.beginPath(); ctx.moveTo(...p); ctx.lineTo(...q); ctx.stroke(); dot(q[0], q[1], 3.2, color(a)); }
      for (const p of ring) dot(p[0], p[1], 2.4, color(a * 0.8));
    }
    function chip(cx, cy, S, a) {
      const B = S * 0.5;
      stroke(a, 1.4);
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(cx - B / 2, cy - B / 2, B, B, 4) : ctx.rect(cx - B / 2, cy - B / 2, B, B);
      ctx.stroke();
      const c = B / 4;
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
        ctx.beginPath(); ctx.rect(cx - B / 2 + c * (i + 0.5) + 1, cy - B / 2 + c * (j + 0.5) + 1, c - 2, c - 2);
        ctx.fillStyle = color(a * (0.15 + ((i * 3 + j) % 4) * 0.2)); ctx.fill();
      }
      stroke(a * 0.8, 1.2);
      for (let k = 0; k < 4; k++) {
        const o = -B / 2 + (B / 5) * (k + 1);
        for (const [x1, y1, x2, y2] of [[cx + o, cy - B / 2, cx + o, cy - B / 2 - 7], [cx + o, cy + B / 2, cx + o, cy + B / 2 + 7], [cx - B / 2, cy + o, cx - B / 2 - 7, cy + o], [cx + B / 2, cy + o, cx + B / 2 + 7, cy + o]]) {
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        }
      }
    }
    // 기상·기후: 해 + 구름
    function weather(cx, cy, S, a, r) {
      const sx = cx - S * 0.16, sy = cy - S * 0.12, sr = S * 0.13;
      stroke(a, 1.4);
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 8 * r; i++) {
        const th = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(th) * sr * 1.45, sy + Math.sin(th) * sr * 1.45);
        ctx.lineTo(sx + Math.cos(th) * sr * 1.95, sy + Math.sin(th) * sr * 1.95);
        ctx.stroke();
      }
      // 구름 (아래쪽은 평평하게)
      const ccx = cx + S * 0.08, ccy = cy + S * 0.14, u = S * 0.12;
      ctx.beginPath();
      ctx.moveTo(ccx - u * 2.2, ccy + u * 0.9);
      ctx.arc(ccx - u * 1.3, ccy + u * 0.1, u * 0.8, Math.PI * 0.75, Math.PI * 1.55);
      ctx.arc(ccx, ccy - u * 0.35, u * 1.05, Math.PI * 1.1, Math.PI * 1.95);
      ctx.arc(ccx + u * 1.35, ccy + u * 0.2, u * 0.75, Math.PI * 1.45, Math.PI * 0.3);
      ctx.lineTo(ccx - u * 2.2, ccy + u * 0.9);
      ctx.fillStyle = color(a * 0.1); ctx.fill();
      stroke(a, 1.4); ctx.stroke();
    }
    // IoT·센서: 안테나 + 퍼져 나가는 신호
    function sensor(cx, cy, S, a, r) {
      const by = cy + S * 0.3, ty = cy - S * 0.02;
      stroke(a, 1.4);
      ctx.beginPath(); ctx.moveTo(cx, ty); ctx.lineTo(cx, by); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - S * 0.12, by); ctx.lineTo(cx + S * 0.12, by); ctx.stroke();
      dot(cx, ty, 3.2, color(a));
      for (let i = 1; i <= 3; i++) {
        if (i > Math.ceil(r * 3)) break;
        const rad = S * 0.1 * i + S * 0.02;
        stroke(a * (1 - (i - 1) * 0.22), 1.4);
        ctx.beginPath(); ctx.arc(cx, ty, rad, -Math.PI * 0.8, -Math.PI * 0.2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, ty, rad, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke();
      }
    }

    // 로보틱스: 안테나 달린 로봇 머리
    function robot(cx, cy, S, a, r) {
      const hw = S * 0.46, hh = S * 0.36, hx = cx - hw / 2, hy = cy - hh / 2 + S * 0.06;
      stroke(a, 1.4);
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(hx, hy, hw, hh, S * 0.07) : ctx.rect(hx, hy, hw, hh);
      ctx.fillStyle = color(a * 0.1); ctx.fill(); ctx.stroke();
      // 안테나
      ctx.beginPath(); ctx.moveTo(cx, hy); ctx.lineTo(cx, hy - S * 0.13); ctx.stroke();
      dot(cx, hy - S * 0.15, 2.8, color(a));
      // 귀
      ctx.beginPath(); ctx.moveTo(hx, cy + S * 0.02); ctx.lineTo(hx - S * 0.06, cy + S * 0.02); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx + hw, cy + S * 0.02); ctx.lineTo(hx + hw + S * 0.06, cy + S * 0.02); ctx.stroke();
      // 눈 (그려지는 정도에 따라 깜빡이듯 나타남)
      if (r > 0.3) {
        dot(cx - hw * 0.22, cy, S * 0.045, color(a));
        dot(cx + hw * 0.22, cy, S * 0.045, color(a));
      }
      // 입
      if (r > 0.6) {
        ctx.beginPath(); ctx.moveTo(cx - hw * 0.2, cy + hh * 0.3); ctx.lineTo(cx + hw * 0.2, cy + hh * 0.3); ctx.stroke();
      }
    }

    const GLYPHS = { ecg, candles, molecule, chip, weather, sensor, robot };
    GLYPHS[idx](cx, cy, S, alpha, reveal);
  }

  function heroAnimation(canvas) {
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const K = 4, STEP = 5, EVERY = 6, W = 40;   // EVERY: 몇 프레임마다 새 데이터가 들어오는지 (클수록 느림)
    const MAXW = 1080; // .container 최대 폭과 맞춤
    let w = 0, h = 0, t = +(canvas.dataset.t0 || 0);   // data-t0: 시작 시점 (확인용)

    const parse = (c) => {
      c = c.trim();
      if (c.startsWith("#")) {
        const v = c.length === 4 ? c.slice(1).split("").map((x) => x + x).join("") : c.slice(1);
        return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
      }
      return (c.match(/\d+/g) || [0, 0, 0]).slice(0, 3).map(Number);
    };
    const rgba = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
    let ACCENT, MUTED, TONES;
    function readColors() {
      const cs = getComputedStyle(document.documentElement);
      ACCENT = parse(cs.getPropertyValue("--accent"));
      MUTED = parse(cs.getPropertyValue("--muted"));
      // 강조색 계열 3개 + 회색 1개
      TONES = [[ACCENT, 1], [ACCENT, 0.68], [ACCENT, 0.42], [MUTED, 0.6]];
    }

    const noise = (x, seed) =>
      Math.sin(x * 0.011 + seed) * 0.5 + Math.sin(x * 0.027 + seed * 2.3) * 0.3 +
      Math.sin(x * 0.061 + seed * 0.7) * 0.15 + Math.sin(x * 0.13 + seed * 5.1) * 0.05;

    // 두 잠재 요인을 섞어 시계열을 만들고, 섞는 비율(θ)을 천천히 바꿔 관계가 계속 변하게 함
    const series = Array.from({ length: K }, () => []);
    const rw = new Array(K).fill(0);
    let n = 0;
    function push() {
      const f1 = noise(n * 9, 1), f2 = noise(n * 9, 7);
      for (let k = 0; k < K; k++) {
        const th = k * 1.4 + 1.8 * Math.sin(n * 0.012 + k * 1.9);
        rw[k] = rw[k] * 0.9 + (Math.random() - 0.5) * 0.03;
        series[k].push(Math.cos(th) * f1 + Math.sin(th) * f2 + rw[k]);
        if (series[k].length > 1500) series[k].shift();
      }
      n++;
    }
    for (let i = 0; i < 400; i++) push();

    function corr(a, b) {
      let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0;
      for (let i = 0; i < a.length; i++) { sa += a[i]; sb += b[i]; saa += a[i] * a[i]; sbb += b[i] * b[i]; sab += a[i] * b[i]; }
      const m = a.length, cov = sab / m - (sa / m) * (sb / m);
      const va = saa / m - (sa / m) ** 2, vb = sbb / m - (sb / m) ** 2;
      return cov / Math.sqrt(va * vb || 1);
    }
    const C = Array.from({ length: K }, () => new Array(K).fill(0));
    function updateCorr(rate) {
      for (let a = 0; a < K; a++) for (let b = a + 1; b < K; b++) {
        const c = corr(series[a].slice(-W), series[b].slice(-W));
        C[a][b] = C[b][a] = C[a][b] * (1 - rate) + c * rate;
      }
    }
    updateCorr(1);

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // 변형: "full"(기본) = 분야 → 구간 질의 → 가지치기 신경망 → 구간 행렬, "ai" = 시계열 → 신경망 → 행렬, "compact" = 시계열 + 행렬
    const VARIANT = canvas.dataset.variant || "full";
    const HID = 3;
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
    const W1 = Array.from({ length: HID }, () => Array.from({ length: K }, rnd));   // 입력 → 은닉
    const W2 = Array.from({ length: K }, () => Array.from({ length: HID }, rnd));   // 은닉 → 출력
    const PRUNED = (w) => Math.abs(w) < 0.3;                                         // 가지치기된 연결

    // ---- 통합 버전 ("full"): 분야(X) → 시계열 위 구간 질의 → 가지치기되는 신경망 → 구간의 관계 행렬 ----
    const vis1 = W1.map((row) => row.map(() => 1));
    const vis2 = W2.map((row) => row.map(() => 1));
    // 가지치기돼도 각 노드에서 가중치가 가장 큰 연결 하나는 항상 남김 (고립되는 노드가 없도록)
    const keep1 = W1.map((row) => row.map(() => false));   // [은닉 j][입력 k]
    const keep2 = W2.map((row) => row.map(() => false));   // [출력 k][은닉 j]
    const argmax = (arr) => arr.reduce((bi, v, i) => (Math.abs(v) > Math.abs(arr[bi]) ? i : bi), 0);
    for (let k = 0; k < K; k++) keep1[argmax(W1.map((r) => r[k]))][k] = true;     // 입력마다 나가는 연결 1개
    for (let j = 0; j < HID; j++) keep1[j][argmax(W1[j])] = true;                  // 은닉마다 들어오는 연결 1개
    for (let j = 0; j < HID; j++) keep2[argmax(W2.map((r) => r[j]))][j] = true;   // 은닉마다 나가는 연결 1개
    for (let k = 0; k < K; k++) keep2[k][argmax(W2[k])] = true;                    // 출력마다 들어오는 연결 1개
    const Cr = Array.from({ length: K }, () => new Array(K).fill(0));
    let clock = 0, rate = 0.006;
    let rFrom = { a: 0.3, b: 0.65 }, rTo = { a: 0.4, b: 0.8 }, rT = 0;
    let rs = 3;
    const rr = () => ((rs = (rs * 16807) % 2147483647) / 2147483647);
    const pickRange = () => { const len = 0.18 + rr() * 0.27, a = 0.05 + rr() * (0.9 - len); return { a, b: a + len }; };
    const smooth = (x) => x * x * (3 - 2 * x);

    function stepFull() {
      // 구간 이동
      if (++rT > 420) { rT = 0; rFrom = rTo; rTo = pickRange(); }
      // 가지치기: 연결이 줄었다가 다시 채워짐 (약 12초 주기)
      const cyc = (t % 720) / 720;
      const thr = cyc < 0.45 ? smooth(cyc / 0.45) * 0.62 : cyc < 0.75 ? 0.62 : 0.62 * (1 - smooth((cyc - 0.75) / 0.25));
      let sum = 0, cnt = 0;
      for (const [W, V, KP] of [[W1, vis1, keep1], [W2, vis2, keep2]]) W.forEach((row, i) => row.forEach((w, j) => {
        V[i][j] += ((Math.abs(w) > thr || KP[i][j] ? 1 : 0) - V[i][j]) * 0.06;
        sum += V[i][j]; cnt++;
      }));
      // 남은 연결이 적을수록 신호가 빨라짐
      rate = 0.003 + 0.014 * (1 - sum / cnt) ** 1.3;
      clock += rate;
    }

    function drawFull(L) {
      const { left, R, SP, SZ, GIN, GL, GOUT, NR, centerY, baseY, amp, big } = L;
      const GS = big ? 92 : 60;                      // 분야 그림 크기
      const MAT = (K - 1) * SP + SZ;
      const matX0 = R - MAT + SZ / 2;
      const outX = matX0 - SZ / 2 - GOUT;
      const hidX = outX - GL;
      const inX = hidX - GL;
      const headX = inX - GIN - STEP;
      const gcx = left + GS / 2;
      const sL = left + GS + 40;                     // 시계열 시작 (그림이 커진 만큼 시계열은 짧아짐)

      const edgeLine = (x1, y1, x2, y2, alpha, lw = 1) => {
        ctx.strokeStyle = rgba(ACCENT, alpha); ctx.lineWidth = lw;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      };
      const sig = (x1, y1, x2, y2, phase, a = 1) => {
        if (reduce) return;
        const p = (clock + phase) % 1;
        ctx.beginPath(); ctx.arc(x1 + (x2 - x1) * p, y1 + (y2 - y1) * p, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = rgba(ACCENT, Math.sin(Math.PI * p) * 0.9 * a); ctx.fill();
      };

      // ② 시계열 위에서 옮겨 다니는 구간
      const p = smooth(Math.min(1, rT / 60));
      const ra = rFrom.a + (rTo.a - rFrom.a) * p, rb = rFrom.b + (rTo.b - rFrom.b) * p;
      const xa = sL + ra * (headX - sL), xb = sL + rb * (headX - sL);
      const top = baseY(0) - SP * 0.75, bot = baseY(K - 1) + SP * 0.75;
      ctx.fillStyle = rgba(ACCENT, 0.04); ctx.fillRect(xa, top, xb - xa, bot - top);
      ctx.setLineDash([2, 3]);
      edgeLine(xa, top, xa, bot, 0.35); edgeLine(xb, top, xb, bot, 0.35);
      ctx.setLineDash([]);
      drawSeries(sL, headX, baseY, amp, 0.12);

      // 시계열 시작 부분을 옅게 하는 처리 뒤에 그려야 지워지지 않음
      // ① 분야(X): 몇 초마다 바뀌며 시계열로 이어짐
      const SHOW = 300, tt = t % (SHOW * HERO_DOMAINS.length);
      const gi = Math.floor(tt / SHOW), local = tt % SHOW;
      const ga = Math.min(1, local / 30, (SHOW - local) / 30);
      drawDomainGlyph(ctx, (al) => rgba(ACCENT, al), HERO_DOMAINS[gi], gcx, centerY, GS, ga, Math.min(1, local / 80));
      for (let k = 0; k < K; k++) {
        edgeLine(left + GS + 4, centerY, sL, baseY(k), 0.15);
        sig(left + GS + 4, centerY, sL, baseY(k), (k * 0.27 + 0.1) % 1, 0.8);
      }


      // 구간 안의 값으로 상관관계 계산 → 행렬
      const off = ((t % EVERY) / EVERY) * STEP;
      const Ls = series[0].length;
      const back = (x) => Math.round((headX + STEP - off - x) / STEP);
      const i0 = Ls - back(xa), i1 = Ls - back(xb);
      if (i1 - i0 > 3) {
        const seg = series.map((s) => s.slice(i0, i1));
        for (let a = 0; a < K; a++) for (let b = a + 1; b < K; b++) {
          const c = corr(seg[a], seg[b]);
          Cr[a][b] = Cr[b][a] = Cr[a][b] + (c - Cr[a][b]) * 0.06;
        }
      }

      // ③ 가지치기되는 신경망
      const x = series.map((s) => s[s.length - 1]);
      const hv = W1.map((row, j) => Math.tanh(row.reduce((acc, w, k) => acc + w * vis1[j][k] * x[k], 0)));
      const ov = W2.map((row, k) => Math.tanh(row.reduce((acc, w, j) => acc + w * vis2[k][j] * hv[j], 0)));
      const hidY = (j) => centerY + (j - (HID - 1) / 2) * SP * 1.3;
      for (let k = 0; k < K; k++) {
        edgeLine(headX + STEP, baseY(k) - x[k] * amp, inX, baseY(k), 0.3);
        sig(headX + STEP, baseY(k) - x[k] * amp, inX, baseY(k), (k * 0.27 + 0.6) % 1);
      }
      for (let j = 0; j < HID; j++) for (let k = 0; k < K; k++) {
        const v = vis1[j][k];
        edgeLine(inX, baseY(k), hidX, hidY(j), 0.04 + v * (0.12 + Math.abs(W1[j][k]) * 0.28));
        if (v > 0.6) sig(inX, baseY(k), hidX, hidY(j), (j * 0.37 + k * 0.21) % 1, v);
      }
      for (let k = 0; k < K; k++) for (let j = 0; j < HID; j++) {
        const v = vis2[k][j];
        edgeLine(hidX, hidY(j), outX, baseY(k), 0.04 + v * (0.12 + Math.abs(W2[k][j]) * 0.28));
        if (v > 0.6) sig(hidX, hidY(j), outX, baseY(k), (k * 0.29 + j * 0.43 + 0.5) % 1, v);
      }
      for (let k = 0; k < K; k++) {
        edgeLine(outX, baseY(k), matX0 - SZ / 2 - 3, baseY(k), 0.3);
        sig(outX, baseY(k), matX0 - SZ / 2 - 3, baseY(k), (k * 0.31 + 0.15) % 1);
      }
      const node = (nx, ny, v) => {
        ctx.beginPath(); ctx.arc(nx, ny, NR, 0, Math.PI * 2);
        ctx.fillStyle = rgba(ACCENT, 0.15 + Math.abs(v) * 0.8); ctx.fill();
      };
      for (let k = 0; k < K; k++) node(inX, baseY(k), Math.tanh(x[k]));
      for (let j = 0; j < HID; j++) node(hidX, hidY(j), hv[j]);
      for (let k = 0; k < K; k++) node(outX, baseY(k), ov[k]);

      // ④ 선택 구간의 관계 행렬
      for (let a = 0; a < K; a++) for (let b = 0; b < K; b++) {
        roundRect(matX0 + b * SP, baseY(a), SZ, big ? 4 : 3);
        if (a === b) { const [col, al] = TONES[a]; ctx.fillStyle = rgba(col, al * 0.9); }
        else ctx.fillStyle = rgba(ACCENT, 0.06 + Math.max(0, Cr[a][b]) * 0.8);
        ctx.fill();
      }
    }

    // 버튼 줄의 위치를 읽어서, 버튼 오른쪽 공간에 배치
    let btnRight = 0, btnCY = 0, leadRight = 0;
    function measure() {
      const cr = canvas.getBoundingClientRect();
      const row = canvas.parentElement.querySelector(".btn-row");
      if (row && row.lastElementChild) {
        const lr = row.lastElementChild.getBoundingClientRect();
        btnRight = lr.right - cr.left;
        btnCY = (lr.top + lr.bottom) / 2 - cr.top;
      }
      // 소개 문장 글자가 실제로 끝나는 위치 (애니메이션 오른쪽 끝을 여기에 맞춤)
      const lead = canvas.parentElement.querySelector(".lead");
      if (lead) {
        const range = document.createRange();
        range.selectNodeContents(lead);
        leadRight = range.getBoundingClientRect().right - cr.left;
      }
    }

    const roundRect = (x, y, s, r) => {
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x - s / 2, y - s / 2, s, s, r) : ctx.rect(x - s / 2, y - s / 2, s, s);
    };

    function drawSeries(left, headX, baseY, amp, alphaFade) {
      const off = ((t % EVERY) / EVERY) * STEP;
      const cnt = Math.ceil((headX - left) / STEP) + 2;
      for (let k = K - 1; k >= 0; k--) {
        const s = series[k].slice(-cnt);
        const [col, a] = TONES[k];
        ctx.beginPath();
        s.forEach((v, i) => {
          const x = headX - (s.length - 1 - i) * STEP - off + STEP, y = baseY(k) - v * amp;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        });
        ctx.strokeStyle = rgba(col, a);
        ctx.lineWidth = 1.5;
        ctx.lineJoin = "round";
        ctx.stroke();
        // 끝점은 x 고정, y는 보간해서 흔들림 없이
        const L = series[k].length;
        const hy = baseY(k) - (series[k][L - 2] * (1 - off / STEP) + series[k][L - 1] * (off / STEP)) * amp;
        ctx.beginPath();
        ctx.arc(headX + STEP, hy, 3, 0, Math.PI * 2);
        ctx.fillStyle = rgba(col, a);
        ctx.fill();
      }
      // 시작 부분은 옅게
      const fade = ctx.createLinearGradient(left, 0, left + (headX - left) * alphaFade, 0);
      fade.addColorStop(0, "rgba(0,0,0,0)");
      fade.addColorStop(1, "rgba(0,0,0,1)");
      ctx.globalCompositeOperation = "destination-in";
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, headX + STEP + 4, h);
      ctx.globalCompositeOperation = "source-over";
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      // 넓은 화면: Join Us 버튼 오른쪽 ~ 소개 문장 끝, 버튼 줄 높이
      // 좁은 화면: 버튼 아래 여백(.hero padding-bottom)에, 소개 문장 폭만큼
      const narrow = w < 1024;   // style.css의 .hero padding-bottom 기준과 맞춤
      const cont = Math.max(0, (w - MAXW) / 2);
      const cw = Math.min(w, MAXW);
      const left = narrow ? cont + 24 : btnRight + 48;
      const R = leadRight > left ? leadRight : cont + cw - 24;   // 오른쪽 끝 = 소개 문장 끝
      const big = !narrow || R - left >= 480;                   // 공간이 충분하면 큰 크기
      const S = big
        ? { SP: 22, SZ: 15, GIN: 30, GL: 64, GOUT: 30, NR: 5 }
        : { SP: 17, SZ: 12, GIN: 18, GL: 38, GOUT: 18, NR: 4 };
      const { SP, SZ, GIN, GL, GOUT, NR } = S;
      const centerY = narrow ? h - 75 : btnCY;
      const baseY = (k) => centerY + (k - 1.5) * SP;
      const amp = SP * 0.55;
      if (VARIANT === "full") return drawFull({ left, R, SP, SZ, GIN, GL, GOUT, NR, centerY, baseY, amp, big });

      // 오른쪽 끝(R)부터 거꾸로 배치: [상관행렬] ← ([신경망]) ← [시계열]
      const ai = VARIANT === "ai";
      const MAT = (K - 1) * SP + SZ;                 // 행렬 폭
      const matX0 = R - MAT + SZ / 2;                // 행렬 첫 열 중심
      const outX = matX0 - SZ / 2 - GOUT;            // 출력 노드
      const hidX = outX - GL;                        // 은닉 노드
      const inX = hidX - GL;                         // 입력 노드
      const headX = ai ? inX - GIN - STEP : matX0 - SZ / 2 - 36;

      drawSeries(left, headX, baseY, amp, 0.3);

      if (ai) {
        // 현재 입력값 (각 시계열의 최신 값)
        const x = series.map((s) => s[s.length - 1]);
        const hv = W1.map((row) => Math.tanh(row.reduce((acc, w, k) => acc + w * x[k], 0)));
        const ov = W2.map((row) => Math.tanh(row.reduce((acc, w, j) => acc + w * hv[j], 0)));
        const hidY = (j) => centerY + (j - (HID - 1) / 2) * SP * 1.3;

        const edge = (x1, y1, x2, y2, w, phase) => {
          const pruned = PRUNED(w);
          ctx.strokeStyle = rgba(pruned ? MUTED : ACCENT, pruned ? 0.12 : 0.18 + Math.abs(w) * 0.3);
          ctx.lineWidth = pruned ? 0.8 : 1;
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
          if (pruned || reduce) return;
          // 연결선 위로 흐르는 신호
          const p = (t * 0.006 + phase) % 1;
          ctx.beginPath();
          ctx.arc(x1 + (x2 - x1) * p, y1 + (y2 - y1) * p, 1.6, 0, Math.PI * 2);
          ctx.fillStyle = rgba(ACCENT, Math.sin(Math.PI * p) * 0.9);
          ctx.fill();
        };
        // 시계열 끝점 → 입력 노드
        for (let k = 0; k < K; k++) {
          edge(headX + STEP, baseY(k) - x[k] * amp, inX, baseY(k), 1, (k * 0.27 + 0.6) % 1);
        }
        // 입력 → 은닉 → 출력
        for (let j = 0; j < HID; j++) for (let k = 0; k < K; k++) {
          edge(inX, baseY(k), hidX, hidY(j), W1[j][k], (j * 0.37 + k * 0.21) % 1);
        }
        for (let k = 0; k < K; k++) for (let j = 0; j < HID; j++) {
          edge(hidX, hidY(j), outX, baseY(k), W2[k][j], (k * 0.29 + j * 0.43 + 0.5) % 1);
        }
        // 출력 노드 → 행렬의 각 행
        for (let k = 0; k < K; k++) {
          edge(outX, baseY(k), matX0 - SZ / 2 - 3, baseY(k), 1, (k * 0.31 + 0.15) % 1);
        }
        const node = (nx, ny, v) => {
          ctx.beginPath(); ctx.arc(nx, ny, NR, 0, Math.PI * 2);
          ctx.fillStyle = rgba(ACCENT, 0.15 + Math.abs(v) * 0.8);
          ctx.fill();
        };
        for (let k = 0; k < K; k++) node(inX, baseY(k), Math.tanh(x[k]));
        for (let j = 0; j < HID; j++) node(hidX, hidY(j), hv[j]);
        for (let k = 0; k < K; k++) node(outX, baseY(k), ov[k]);
      }

      // 상관행렬
      for (let a = 0; a < K; a++) for (let b = 0; b < K; b++) {
        roundRect(matX0 + b * SP, baseY(a), SZ, narrow ? 3 : 4);
        if (a === b) {
          const [col, al] = TONES[a];
          ctx.fillStyle = rgba(col, al * 0.9);
        } else {
          ctx.fillStyle = rgba(ACCENT, 0.06 + Math.max(0, C[a][b]) * 0.8);
        }
        ctx.fill();
      }
    }

    let visible = true;   // 화면 밖으로 스크롤하면 멈춤
    function step() {
      t += 1;
      if (t % EVERY === 0) push();
      updateCorr(0.04);
      if (VARIANT === "full") stepFull();
      if (t % 30 === 0) measure();   // 폰트 로딩 등으로 레이아웃이 바뀌는 경우 대비
    }

    readColors();
    resize();
    measure();
    window.addEventListener("resize", () => { resize(); measure(); draw(); });
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => { readColors(); draw(); });
    window.addEventListener("themechange", () => { readColors(); draw(); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
    }
    reduce ? draw() : runFixedStep(step, draw, () => visible);
  }

  // ---------- Research: 연구 방향별 애니메이션 ----------
  // data-anim="range" | "prune" | "domains"  (첫 화면과 같은 스타일: 선, 노드, 셀, 흐르는 신호 점)

  function directionAnimation(canvas) {
    const ctx = canvas.getContext("2d");
    const kind = canvas.dataset.anim;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, t = +(canvas.dataset.t0 || 0), visible = true;   // data-t0: 시작 시점 (확인용)

    const parse = (c) => {
      c = c.trim();
      if (c.startsWith("#")) {
        const v = c.length === 4 ? c.slice(1).split("").map((x) => x + x).join("") : c.slice(1);
        return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
      }
      return (c.match(/\d+/g) || [0, 0, 0]).slice(0, 3).map(Number);
    };
    const rgba = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
    let ACCENT, MUTED;
    const readColors = () => {
      const cs = getComputedStyle(document.documentElement);
      ACCENT = parse(cs.getPropertyValue("--accent"));
      MUTED = parse(cs.getPropertyValue("--muted"));
    };
    const ease = (x) => x * x * (3 - 2 * x);
    let seed = kind.length * 97 + 13;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const noise = (x, s) =>
      Math.sin(x * 0.011 + s) * 0.5 + Math.sin(x * 0.027 + s * 2.3) * 0.3 +
      Math.sin(x * 0.061 + s * 0.7) * 0.15 + Math.sin(x * 0.13 + s * 5.1) * 0.05;

    const dot = (x, y, r, fill) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); };
    const line = (x1, y1, x2, y2, stroke, lw = 1) => {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke();
    };
    // 신호 진행 시계: 기본 속도는 일정, 애니메이션이 rate를 바꿔 속도를 조절할 수 있음
    let clock = t * 0.006, rate = 0.006;
    const signal = (x1, y1, x2, y2, phase, alpha = 1) => {
      if (reduce) return;
      const p = (clock + phase) % 1;
      dot(x1 + (x2 - x1) * p, y1 + (y2 - y1) * p, 1.6, rgba(ACCENT, Math.sin(Math.PI * p) * 0.9 * alpha));
    };

    // ---- 01 범위 쿼리: 흐르는 시계열에서 구간을 골라, 오른쪽 패널에 그 구간의 상관행렬 ----
    function makeRange() {
      const K = 4, STEP = 4, EVERY = 6;
      const series = Array.from({ length: K }, () => []);
      let n = 0;
      // 두 잠재 요인을 섞는 비율이 시간에 따라 바뀌어, 구간마다 시계열 사이의 관계가 달라짐
      const push = () => {
        const f1 = noise(n * 9, 1), f2 = noise(n * 9, 7);
        for (let k = 0; k < K; k++) {
          const th = k * 1.4 + 2.2 * Math.sin(n * 0.02 + k * 1.9);
          series[k].push((Math.cos(th) * f1 + Math.sin(th) * f2) * 0.9);
          if (series[k].length > 600) series[k].shift();
        }
        n++;
      };
      const Cm = Array.from({ length: K }, () => new Array(K).fill(0));
      for (let i = 0; i < 300; i++) push();
      let from = { a: 0.25, b: 0.62 }, to = { a: 0.4, b: 0.8 }, qt = 0;
      // 구간 폭: 시계열 영역의 10~60% (폭을 먼저 정하고, 영역 안에 들어가도록 시작점을 고름)
      const pick = () => { const len = 0.1 + rnd() * 0.5, a = 0.05 + rnd() * (0.9 - len); return { a, b: a + len }; };

      return () => {
        if (t % EVERY === 0) push();
        if (++qt > 260) { qt = 0; from = to; to = pick(); }
        const p = ease(Math.min(1, qt / 60));
        const ra = from.a + (to.a - from.a) * p, rb = from.b + (to.b - from.b) * p;

        const SP = Math.min(30, h / 5.5), cy = h / 2;
        const baseY = (k) => cy + (k - 1.5) * SP, amp = SP * 0.42;
        const head = w * 0.56;                          // 시계열 영역 오른쪽 끝
        const pL = w * 0.68, pR = w - 2;                // 확대 패널
        const top = baseY(0) - SP * 0.8, bot = baseY(K - 1) + SP * 0.8;
        const off = ((t % EVERY) / EVERY) * STEP;
        const cnt = Math.ceil(head / STEP) + 2;
        const xa = ra * head, xb = rb * head;

        // 깔때기 (구간 → 패널)
        ctx.beginPath();
        ctx.moveTo(xb, top); ctx.lineTo(pL, top); ctx.lineTo(pL, bot); ctx.lineTo(xb, bot); ctx.closePath();
        ctx.fillStyle = rgba(ACCENT, 0.03); ctx.fill();
        ctx.setLineDash([3, 4]);
        line(xb, top, pL, top, rgba(ACCENT, 0.35));
        line(xb, bot, pL, bot, rgba(ACCENT, 0.35));
        ctx.setLineDash([]);

        // 선택 구간
        ctx.fillStyle = rgba(ACCENT, 0.08);
        ctx.fillRect(xa, top, xb - xa, bot - top);
        line(xa, top, xa, bot, rgba(ACCENT, 0.55));
        line(xb, top, xb, bot, rgba(ACCENT, 0.55));

        // 확대 패널
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(pL, top, pR - pL, bot - top, 6) : ctx.rect(pL, top, pR - pL, bot - top);
        ctx.fillStyle = rgba(ACCENT, 0.05); ctx.fill();
        ctx.strokeStyle = rgba(ACCENT, 0.4); ctx.lineWidth = 1; ctx.stroke();

        const segs = [];
        for (let k = 0; k < K; k++) {
          const s = series[k].slice(-cnt);
          const pts = s.map((v, i) => [head - (s.length - 1 - i) * STEP - off + STEP, baseY(k) - v * amp]);
          ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          ctx.strokeStyle = rgba(MUTED, 0.35); ctx.lineWidth = 1.3; ctx.stroke();
          const inR = pts.filter(([x]) => x >= xa && x <= xb);
          if (inR.length < 2) continue;
          ctx.beginPath(); inR.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          ctx.strokeStyle = rgba(ACCENT, 0.95); ctx.lineWidth = 1.8; ctx.stroke();
          segs.push(inR.map(([, y]) => baseY(k) - y));
        }

        // 패널: 선택 구간의 상관행렬 (각 행은 해당 시계열 높이에 맞춤)
        const L = Math.min(...segs.map((g) => g.length));
        if (segs.length === K && L > 2) {
          const Z = segs.map((g) => {
            g = g.slice(0, L);
            const m = g.reduce((a, b) => a + b, 0) / L;
            const sd = Math.sqrt(g.reduce((a, b) => a + (b - m) ** 2, 0) / L) || 1;
            return g.map((v) => (v - m) / sd);
          });
          for (let i = 0; i < K; i++) for (let j = 0; j < K; j++) {
            const c = Z[i].reduce((a, v, x) => a + v * Z[j][x], 0) / L;
            Cm[i][j] += (c - Cm[i][j]) * 0.08;   // 구간이 바뀌면 부드럽게 변함
          }
        }
        const cs = Math.min(SP * 0.72, (pR - pL - 16) / K - 4);
        const cgap = (pR - pL - 16 - cs) / (K - 1);
        for (let i = 0; i < K; i++) for (let j = 0; j < K; j++) {
          const x = pL + 8 + cs / 2 + j * cgap, y = baseY(i);
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(x - cs / 2, y - cs / 2, cs, cs, 3) : ctx.rect(x - cs / 2, y - cs / 2, cs, cs);
          ctx.fillStyle = rgba(ACCENT, i === j ? 0.85 : 0.06 + Math.max(0, Cm[i][j]) * 0.8);
          ctx.fill();
        }

        // 왼쪽 끝은 옅게
        const fade = ctx.createLinearGradient(0, 0, w * 0.14, 0);
        fade.addColorStop(0, "rgba(0,0,0,0)"); fade.addColorStop(1, "rgba(0,0,0,1)");
        ctx.globalCompositeOperation = "destination-in";
        ctx.fillStyle = fade; ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "source-over";
      };
    }

    // ---- 02 가지치기: 신경망 연결이 천천히 사라졌다 다시 채워짐 ----
    function makePrune() {
      const L = [4, 6, 6, 4];
      const W = L.slice(1).map((m, l) => Array.from({ length: m }, () => Array.from({ length: L[l] }, () => rnd())));
      const vis = W.map((layer) => layer.map((row) => row.map(() => 1)));
      // 각 노드에서 가중치가 가장 큰 연결 하나는 항상 남김 (고립되는 노드가 없도록)
      const keep = W.map((layer) => layer.map((row) => row.map(() => false)));
      W.forEach((layer, l) => {
        for (let i = 0; i < L[l]; i++) {             // 앞 층의 노드마다 나가는 연결 1개
          let bj = 0; for (let j = 1; j < L[l + 1]; j++) if (layer[j][i] > layer[bj][i]) bj = j;
          keep[l][bj][i] = true;
        }
        for (let j = 0; j < L[l + 1]; j++) {         // 뒤 층의 노드마다 들어오는 연결 1개
          let bi = 0; for (let i = 1; i < L[l]; i++) if (layer[j][i] > layer[j][bi]) bi = i;
          keep[l][j][bi] = true;
        }
      });
      return () => {
        // 0→1: 가지치기 진행, 잠시 유지, 다시 채워짐 (약 10초 주기)
        const cyc = (t % 600) / 600;
        const thr = cyc < 0.45 ? ease(cyc / 0.45) * 0.72 : cyc < 0.75 ? 0.72 : 0.72 * (1 - ease((cyc - 0.75) / 0.25));
        const pad = 26, gx = (w - pad * 2) / (L.length - 1);
        const pos = (l, i) => [pad + l * gx, h / 2 + (i - (L[l] - 1) / 2) * Math.min(26, h / 7.5)];
        const alive = L.map((n) => new Array(n).fill(0));
        // 남은 연결이 적을수록 신호가 빨라짐 (가벼운 모델 = 빠른 추론)
        let sum = 0, cnt = 0;
        vis.forEach((layer) => layer.forEach((row) => row.forEach((v) => { sum += v; cnt++; })));
        const remain = sum / cnt;
        rate = 0.003 + 0.016 * (1 - remain) ** 1.3;
        for (let l = 0; l < W.length; l++) for (let j = 0; j < L[l + 1]; j++) for (let i = 0; i < L[l]; i++) {
          const target = W[l][j][i] > thr || keep[l][j][i] ? 1 : 0;
          vis[l][j][i] += (target - vis[l][j][i]) * 0.06;
          const v = vis[l][j][i];
          const [x1, y1] = pos(l, i), [x2, y2] = pos(l + 1, j);
          line(x1, y1, x2, y2, rgba(v > 0.5 ? ACCENT : MUTED, 0.05 + v * 0.2));
          if (v > 0.6) { signal(x1, y1, x2, y2, (l * 0.31 + j * 0.17 + i * 0.29) % 1, v); alive[l][i] = 1; alive[l + 1][j] = 1; }
        }
        for (let l = 0; l < L.length; l++) for (let i = 0; i < L[l]; i++) {
          const [x, y] = pos(l, i);
          dot(x, y, 5, rgba(ACCENT, alive[l][i] ? 0.85 : 0.15));
        }
      };
    }

    // ---- 03 AI + X: 여러 분야(X)의 데이터가 번갈아 같은 모델(AI)로 들어가 결과를 냄 ----
    // 분야 그림: 심전도(의료), 캔들 차트(금융), 분자 구조(화학·생명), 칩(반도체·시스템), 로봇(로보틱스)
    function makeDomains() {
      const SHOW = 270, FADE = 30;                 // 분야 하나를 보여주는 시간, 전환 시간 (프레임)
      const L = [4, 4, 2];                         // 신경망 층
      const W1 = Array.from({ length: L[1] }, () => Array.from({ length: L[0] }, () => rnd() * 2 - 1));
      const W2 = Array.from({ length: L[2] }, () => Array.from({ length: L[1] }, () => rnd() * 2 - 1));
      // 분야마다 다른 입력 → 다른 결과
      const INPUTS = AIX_DOMAINS.map(() => Array.from({ length: L[0] }, () => rnd() * 2 - 1));
      const act = (W, x) => W.map((row) => Math.tanh(row.reduce((a, w, i) => a + w * x[i], 0) * 1.4));

      return () => {
        const total = SHOW * AIX_DOMAINS.length;
        const tt = t % total, idx = Math.floor(tt / SHOW), local = tt % SHOW;
        const alpha = Math.min(1, local / FADE, (SHOW - local) / FADE);
        const reveal = Math.min(1, local / 80);

        // 왼쪽: 분야 그림
        const gcx = w * 0.18, S = Math.min(w * 0.3, h * 0.62);
        drawDomainGlyph(ctx, (al) => rgba(ACCENT, al), AIX_DOMAINS[idx], gcx, h / 2 - 6, S, alpha, reveal);
        // 어떤 분야인지 표시하는 점 4개
        const nd = AIX_DOMAINS.length;
        for (let i = 0; i < nd; i++) dot(gcx - (nd - 1) * 5 + i * 10, h - 16, 2.6, rgba(i === idx ? ACCENT : MUTED, i === idx ? 0.9 : 0.25));

        // 가운데: 같은 신경망 (분야가 바뀌어도 그대로)
        const xs = [w * 0.46, w * 0.63, w * 0.8], resX = w * 0.94;
        const ny = (l, i) => h / 2 + (i - (L[l] - 1) / 2) * Math.min(30, h / 6);
        const x0 = INPUTS[idx], hv = act(W1, x0), ov = act(W2, hv);
        const vals = [x0.map(Math.tanh), hv, ov];
        const on = alpha * Math.min(1, local / 60);

        for (let i = 0; i < L[0]; i++) {   // 분야 그림 → 입력
          line(gcx + S / 2 + 6, h / 2 - 6, xs[0], ny(0, i), rgba(ACCENT, 0.12 + on * 0.18));
          signal(gcx + S / 2 + 6, h / 2 - 6, xs[0], ny(0, i), i * 0.23, on);
        }
        [W1, W2].forEach((Wm, l) => Wm.forEach((row, j) => row.forEach((wt, i) => {
          line(xs[l], ny(l, i), xs[l + 1], ny(l + 1, j), rgba(ACCENT, 0.08 + Math.abs(wt) * 0.22));
          signal(xs[l], ny(l, i), xs[l + 1], ny(l + 1, j), (l * 0.4 + j * 0.19 + i * 0.27) % 1, on);
        })));
        for (let j = 0; j < L[2]; j++) {   // 출력 → 결과
          line(xs[2], ny(2, j), resX, h / 2, rgba(ACCENT, 0.12 + on * 0.18));
          signal(xs[2], ny(2, j), resX, h / 2, j * 0.5 + 0.1, on);
        }
        vals.forEach((v, l) => v.forEach((a, i) => dot(xs[l], ny(l, i), 5, rgba(ACCENT, 0.15 + Math.abs(a) * 0.75 * (0.4 + 0.6 * on)))));

        // 오른쪽: 결과 (분야마다 결과가 나오며 밝아짐)
        const glow = on * (0.5 + 0.5 * Math.abs(ov[0]));
        dot(resX, h / 2, 9 + glow * 3, rgba(ACCENT, 0.1 + glow * 0.15));
        dot(resX, h / 2, 6, rgba(ACCENT, 0.2 + glow * 0.75));
      };
    }

    const drawFn = { range: makeRange, prune: makePrune, domains: makeDomains }[kind]();

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      drawFn();
    }
    const step = () => { t += 1; clock += rate; ctx.clearRect(0, 0, w, h); drawFn(); };
    readColors();
    resize();
    window.addEventListener("resize", () => { resize(); frame(); });
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => { readColors(); frame(); });
    window.addEventListener("themechange", () => { readColors(); frame(); });
    // 화면 밖에 있을 때는 멈춤
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
    }
    if (reduce) { t = 200; frame(); } else runFixedStep(step, () => {}, () => visible);
  }

  // ---------- Init ----------

  renderHeader();
  renderFooter();

  const q = (id) => document.getElementById(id);
  if (q("news-latest")) renderNews(q("news-latest"), 4);
  if (q("news-all")) renderNews(q("news-all"));
  document.querySelectorAll(".pubs-direction").forEach(renderDirectionPubs);
  if (q("pubs-all")) renderPublications(q("pubs-all"));
  if (q("people")) renderPeople(q("people"));
  if (q("hero-canvas")) heroAnimation(q("hero-canvas"));
  document.querySelectorAll("canvas.direction-anim").forEach(directionAnimation);
})();
