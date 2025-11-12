// script.js
(function () {
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  const navLinks = document.querySelectorAll(".nav-links a[href^='#']");
  const langToggle = document.querySelector(".lang-toggle");
  const langButtons = langToggle ? Array.from(langToggle.querySelectorAll(".lang-option")) : [];
  const yearSpan = document.getElementById("year");
  const revealElements = document.querySelectorAll(".reveal");
  let currentLang = "fr";
  let chessViewerReady = false;
  let chessResizeObserver;
  const PGN_MAX_ATTEMPTS = 30;
  const LOGO_PLACEHOLDER_SRC = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
  const LOGO_EXTENSIONS = ["svg", "png", "webp", "jpg", "jpeg"];
  const LOGO_ALIAS_MAP = {
    betclic: "logos/betclic-logo",
    "betclic-group": "logos/betclic-logo",
    betclicgroup: "logos/betclic-logo",
    doctolib: "logos/doctolib-logo",
    datarobot: "logos/datarobot-logo",
    capgemini: "logos/capgemini-logo",
    "capgemini-invent": "logos/capgemini-logo",
    "capgemini-invent-consulting": "logos/capgemini-logo",
    accenture: "logos/accenture-logo",
    smartsubs: "logos/smartsubs-logo",
    ubs: "logos/ubs-logo",
    "le-wagon": "logos/lewagon-logo",
    lewagon: "logos/lewagon-logo"
  };

  // Mobile navigation toggle
  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      nav.classList.toggle("nav-open");
      navToggle.classList.toggle("nav-open");
    });
  }

  // Smooth scroll for anchor links + close mobile nav
  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const targetId = link.getAttribute("href").slice(1);
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
      if (nav && navToggle) {
        nav.classList.remove("nav-open");
        navToggle.classList.remove("nav-open");
      }
    });
  });

  // Scroll reveal animation
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealElements.forEach((el) => observer.observe(el));

  // Dynamic year in footer
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // Language toggle
  function setLanguage(lang) {
    const supported = ["fr", "en"];
    const targetLang = supported.includes(lang) ? lang : "fr";
    currentLang = targetLang;
    document.body.classList.remove("lang-fr", "lang-en");
    document.body.classList.add(`lang-${targetLang}`);
    document.documentElement.lang = targetLang;
    langButtons.forEach((button) => {
      const isActive = button.dataset.langTarget === targetLang;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
    try {
      window.localStorage.setItem("preferredLang", targetLang);
    } catch (error) {
      // ignore storage errors
    }
    if (chessViewerReady) {
      renderChessViewer();
    }
  }

  if (langButtons.length) {
    langButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const target = button.dataset.langTarget;
        if (target) {
          setLanguage(target);
        }
      });
    });

    let storedLang;
    try {
      storedLang = window.localStorage.getItem("preferredLang");
    } catch (error) {
      storedLang = null;
    }
    setLanguage(storedLang || "fr");
  } else {
    setLanguage("fr");
  }

  // Chess PGN viewer
  function renderChessViewer() {
    const container = document.getElementById("chess-game");
    const pgnScript = document.getElementById("chess-pgn");
    if (!container || !pgnScript || !window.PGNV || typeof window.PGNV.pgnView !== "function") {
      return;
    }
    const pgn = pgnScript.textContent.trim();
    const parent = container.parentElement;
    const containerRect = container.getBoundingClientRect();
    let availableWidth = containerRect.width;
    if (!availableWidth && parent) {
      const parentRect = parent.getBoundingClientRect();
      availableWidth = parentRect.width;
    }
    if (!availableWidth) {
      availableWidth = 520;
    }
    const boardSize = Math.min(520, Math.max(280, Math.round(availableWidth)));
    container.innerHTML = "";
    window.PGNV.pgnView("chess-game", {
      pgn,
      theme: "wikipedia",
      pieceStyle: "merida",
      boardSize,
      showCoordinates: true,
      locale: currentLang,
      showAnnotations: true,
      notation: "short"
    });
  }

  function observeChessContainer() {
    if (chessResizeObserver || !window.ResizeObserver) {
      return;
    }
    const container = document.getElementById("chess-game");
    if (!container) {
      return;
    }
    const target = container.parentElement || container;
    chessResizeObserver = new ResizeObserver(() => {
      renderChessViewer();
    });
    chessResizeObserver.observe(target);
  }

  function ensureChessViewer(attempt = 0) {
    if (window.PGNV && typeof window.PGNV.pgnView === "function") {
      chessViewerReady = true;
      observeChessContainer();
      renderChessViewer();
      return;
    }
    if (attempt >= PGN_MAX_ATTEMPTS) {
      return;
    }
    window.setTimeout(() => ensureChessViewer(attempt + 1), 150);
  }

  function initChessViewer() {
    ensureChessViewer();
  }

  if (document.readyState === "complete") {
    initChessViewer();
  } else {
    window.addEventListener("load", initChessViewer);
  }

  window.addEventListener("resize", () => {
    if (chessViewerReady) {
      renderChessViewer();
    }
  });

  function normalizeLogoKey(value) {
    if (!value) {
      return "";
    }
    return value
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, " and ")
      .replace(/[^A-Za-z0-9\s-]/g, " ")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase();
  }

  function resolveLogoCandidates(img) {
    const aliases = new Set();
    const pushAlias = (raw) => {
      if (typeof raw !== "string") {
        return;
      }
      const normalized = normalizeLogoKey(raw);
      if (!normalized) {
        return;
      }
      aliases.add(normalized);
      aliases.add(normalized.replace(/-/g, ""));
    };

    const { logoKey = "", logoNames = "" } = img.dataset;
    const originalAlt = img.dataset.originalAlt || img.alt || "";

    pushAlias(logoKey);
    if (logoNames) {
      logoNames.split(",").forEach((entry) => pushAlias(entry));
    }
    pushAlias(originalAlt);

    const candidates = new Set();
    aliases.forEach((alias) => {
      const base = LOGO_ALIAS_MAP[alias];
      if (!base) {
        return;
      }
      LOGO_EXTENSIONS.forEach((ext) => {
        candidates.add(`${base}.${ext}`);
      });
    });

    return Array.from(candidates);
  }

  function assignLogoFromVariants(img, variants) {
    const uniqueVariants = Array.from(new Set(variants));
    const wrapper = img.closest(".cv-summary-logo");
    const originalAlt = img.dataset.originalAlt || img.alt || "";
    let index = 0;

    const showMissing = () => {
      if (wrapper) {
        wrapper.classList.remove("cv-logo-loading");
        wrapper.classList.add("cv-logo-missing");
        let fallback = wrapper.querySelector(".cv-logo-fallback");
        if (!fallback && originalAlt) {
          fallback = document.createElement("span");
          fallback.className = "cv-logo-fallback";
          fallback.textContent = originalAlt;
          wrapper.appendChild(fallback);
        }
      }
      img.dataset.logoState = "missing";
      img.alt = "";
    };

    const tryNext = () => {
      if (index >= uniqueVariants.length) {
        showMissing();
        return;
      }
      const candidate = uniqueVariants[index++];
      const tester = new Image();
      tester.decoding = "async";
      tester.onload = () => {
        img.dataset.logoState = "loaded";
        img.src = candidate;
        if (wrapper) {
          wrapper.classList.remove("cv-logo-loading");
          wrapper.classList.remove("cv-logo-missing");
          const fallback = wrapper.querySelector(".cv-logo-fallback");
          if (fallback) {
            fallback.remove();
          }
        }
      };
      tester.onerror = () => {
        window.requestAnimationFrame(tryNext);
      };
      tester.src = candidate;
    };

    if (wrapper) {
      wrapper.classList.add("cv-logo-loading");
    }
    img.dataset.logoState = "loading";

    if (!uniqueVariants.length) {
      showMissing();
      return;
    }

    tryNext();
  }

  function initCvLogos() {
    const logoImages = Array.from(document.querySelectorAll(".cv-summary-logo img[data-logo-key]"));
    if (!logoImages.length) {
      return;
    }

    logoImages.forEach((img) => {
      if (!img.dataset.originalAlt) {
        img.dataset.originalAlt = img.alt || "";
      }
      if (!img.getAttribute("src") || img.getAttribute("src") === "") {
        img.src = LOGO_PLACEHOLDER_SRC;
      }

      const variants = resolveLogoCandidates(img);
      assignLogoFromVariants(img, variants);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCvLogos, { once: true });
  } else {
    initCvLogos();
  }

})();

// === CV Timeline collapsible items — bouton circulaire centré en bas ===
document.addEventListener('DOMContentLoaded', () => {
  const items = document.querySelectorAll('.cv-timeline-item');

  items.forEach((item, idx) => {
    // Le premier .cv-timeline-text contient le header (role, dates, etc.)
    const headerBlock = item.querySelector(':scope > .cv-timeline-text');
    let detailBlocks = [];

    if (headerBlock) {
      // Les détails sont à l'intérieur sous forme de sous-blocs .cv-timeline-text
      detailBlocks = Array.from(headerBlock.querySelectorAll(':scope > .cv-timeline-text'));
      if (detailBlocks.length === 0) {
        // S'il n'y en a pas, on prend les suivants dans la carte
        const siblings = Array.from(item.querySelectorAll(':scope > .cv-timeline-text')).filter(el => el !== headerBlock);
        detailBlocks = siblings;
      }
    } else {
      // Structure atypique : tout repliable
      detailBlocks = Array.from(item.querySelectorAll(':scope > .cv-timeline-text'));
    }

    if (detailBlocks.length === 0) return;

    // Conteneur repliable
    const body = document.createElement('div');
    body.className = 'cv-body';
    body.id = `cv-body-${idx}`;
    detailBlocks.forEach(node => body.appendChild(node));

    // Bouton circulaire avec chevron SVG ↓
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cv-toggle';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', body.id);

    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    `;

    // Place le corps repliable puis le bouton en bas
    item.appendChild(body);
    item.appendChild(btn);

    // État initial fermé
    item.classList.remove('is-open');

    // Toggle ouverture/fermeture
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      item.classList.toggle('is-open', !open);

      // Animation fluide
      if (!open) {
        body.style.maxHeight = body.scrollHeight + 'px';
      } else {
        body.style.maxHeight = body.scrollHeight + 'px';
        requestAnimationFrame(() => { body.style.maxHeight = '0px'; });
      }
    });
  });
});

// === Flip card : scroll + clic (clic prioritaire) ===
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.flip-card');

  // 1) Gestion du clic + clavier => passe en mode manuel
  cards.forEach(card => {
    // Clic/tap
    card.addEventListener('click', () => {
      card.classList.toggle('flipped');
      card.dataset.manual = '1'; // le clic prend la main
    });

    // Accessibilité clavier (Enter/Espace)
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.classList.toggle('flipped');
        card.dataset.manual = '1';
      }
    });
  });

  // 2) Auto-flip au scroll (tant qu’on n’a pas cliqué)
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const card = entry.target;

      // Si l’utilisateur·rice a cliqué, on ne touche plus à cette carte
      if (card.dataset.manual === '1') return;

      if (entry.isIntersecting) {
        // Visible à 60% => on montre le verso
        card.classList.add('flipped');
      } else {
        // Quand elle sort de l’écran => on revient au recto
        card.classList.remove('flipped');
      }
    });
  }, {
    threshold: 0.9,          // ~90% visible
    rootMargin: '0px 0px -10% 0px' // petit décalage vers le bas
  });

  cards.forEach(card => observer.observe(card));

  // (optionnel) Si tu veux permettre de "rendre" la main au scroll :
  // Shift+clic réactive l’auto (enlève le mode manuel)
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.flip-card');
    if (!card) return;
    if (e.shiftKey) {
      delete card.dataset.manual;
    }
  });
});

/* === Chess: graphique parties lentes (STD) === */
(function () {
  const target = document.getElementById("std-rating-chart");
  if (!target) return;

  // Données: uniquement Standard (STD). Met en ordre chronologique (ancien -> récent).
  const rows = [
    { period: "2022-Nov", std: 1638, gms: 6 },
    { period: "2022-Dec", std: null, gms: 0 },
    { period: "2023-Jan", std: 1623, gms: 7 },
    { period: "2023-Feb", std: 1613, gms: 2 },
    { period: "2023-Mar", std: 1613, gms: 0 },
    { period: "2023-Apr", std: 1616, gms: 1 },
    { period: "2023-May", std: 1600, gms: 3 },
    { period: "2023-Jun", std: 1691, gms: 6 },
    { period: "2023-Jul", std: 1691, gms: 0 },
    { period: "2023-Aug", std: 1691, gms: 0 },
    { period: "2023-Sep", std: 1823, gms: 9 },
    { period: "2023-Oct", std: 1823, gms: 0 },
    { period: "2023-Nov", std: 1823, gms: 0 },
    { period: "2023-Dec", std: 1834, gms: 1 },
    { period: "2024-Jan", std: 1834, gms: 0 },
    { period: "2024-Feb", std: 1858, gms: 2 },
    { period: "2024-Mar", std: 1915, gms: 0 },
    { period: "2024-Apr", std: 1915, gms: 0 },
    { period: "2024-May", std: 1878, gms: 11 },
    { period: "2024-Jun", std: 1866, gms: 7 },
    { period: "2024-Jul", std: 1928, gms: 17 },
    { period: "2024-Aug", std: 1972, gms: 11 },
    { period: "2024-Sep", std: 1963, gms: 18 },
    { period: "2024-Oct", std: 1963, gms: 0 },
    { period: "2024-Nov", std: 1976, gms: 8 },
    { period: "2024-Dec", std: 1943, gms: 3 },
    { period: "2025-Jan", std: 1943, gms: 0 },
    { period: "2025-Feb", std: 1939, gms: 1 },
    { period: "2025-Mar", std: 1919, gms: 5 },
    { period: "2025-Apr", std: 1924, gms: 1 },
    { period: "2025-May", std: 1932, gms: 1 },
    { period: "2025-Jun", std: 1932, gms: 0 },
    { period: "2025-Jul", std: 1932, gms: 0 },
    { period: "2025-Aug", std: 1932, gms: 0 },
    { period: "2025-Sep", std: 1928, gms: 7 },
    { period: "2025-Oct", std: 1928, gms: 0 },
    { period: "2025-Nov", std: 1933, gms: 1 },
  ];

  // Garde les points où l'Elo est connu
  const data = rows.filter(d => typeof d.std === "number");

  // Dimensions
  const W = target.clientWidth || 720;
  const H = target.clientHeight || 260;
  const M = { top: 16, right: 16, bottom: 30, left: 42 };
  const innerW = W - M.left - M.right;
  const innerH = H - M.top - M.bottom;

  // Échelle X = index (ordre chronologique)
  const x = (i) => (i / (data.length - 1)) * innerW;

  // Échelle Y = Elo
  const minY = Math.floor((Math.min(...data.map(d => d.std)) - 20) / 10) * 10;
  const maxY = Math.ceil((Math.max(...data.map(d => d.std)) + 20) / 10) * 10;
  const y = (val) => innerH - ((val - minY) / (maxY - minY)) * innerH;

  // SVG
  const svgns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgns, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");

  // Fond
  const g = document.createElementNS(svgns, "g");
  g.setAttribute("transform", `translate(${M.left},${M.top})`);
  svg.appendChild(g);

  // Grille horizontale + ticks Y
  const ySteps = 5;
  for (let i = 0; i <= ySteps; i++) {
    const val = minY + (i * (maxY - minY)) / ySteps;
    const yy = y(val);
    const line = document.createElementNS(svgns, "line");
    line.setAttribute("x1", 0);
    line.setAttribute("y1", yy);
    line.setAttribute("x2", innerW);
    line.setAttribute("y2", yy);
    line.setAttribute("stroke", "#E5E7EB"); // gris clair
    line.setAttribute("stroke-width", "1");
    g.appendChild(line);

    const lbl = document.createElementNS(svgns, "text");
    lbl.setAttribute("x", -8);
    lbl.setAttribute("y", yy + 4);
    lbl.setAttribute("text-anchor", "end");
    lbl.setAttribute("font-size", "11");
    lbl.setAttribute("fill", "#6B7280");
    lbl.textContent = Math.round(val);
    g.appendChild(lbl);
  }

  // Ligne
  const path = document.createElementNS(svgns, "path");
  const d = data
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.std)}`)
    .join(" ");
  path.setAttribute("d", d);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "#3B82F6"); // bleu (si tu veux un autre look, change ici)
  path.setAttribute("stroke-width", "2.5");
  g.appendChild(path);

  // Points (pleins si ≥1 partie ce mois, sinon creux)
  data.forEach((p, i) => {
    const cx = x(i);
    const cy = y(p.std);
    const dot = document.createElementNS(svgns, "circle");
    dot.setAttribute("cx", cx);
    dot.setAttribute("cy", cy);
    dot.setAttribute("r", p.gms > 0 ? 3.5 : 3);
    dot.setAttribute("fill", p.gms > 0 ? "#1F2937" : "#fff");
    dot.setAttribute("stroke", "#1F2937");
    dot.setAttribute("stroke-width", "1.5");
    dot.setAttribute("opacity", p.gms > 0 ? "1" : "0.8");
    dot.appendChild(document.createTitleNode
      ? document.createTitleNode(`${p.period}: ${p.std} (${p.gms} gms)`)
      : document.createTextNode("")); // compat
    g.appendChild(dot);
  });

  // Ticks X (1 sur ~3 pour lisibilité)
  const step = Math.ceil(data.length / 6);
  data.forEach((p, i) => {
    if (i % step !== 0 && i !== data.length - 1) return;
    const tx = x(i);
    const lbl = document.createElementNS(svgns, "text");
    lbl.setAttribute("x", tx);
    lbl.setAttribute("y", innerH + 20);
    lbl.setAttribute("text-anchor", "middle");
    lbl.setAttribute("font-size", "11");
    lbl.setAttribute("fill", "#6B7280");
    lbl.textContent = p.period.replace("-"," ");
    g.appendChild(lbl);
  });

  target.innerHTML = "";
  target.appendChild(svg);
})();
