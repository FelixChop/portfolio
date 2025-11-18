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
function renderChessViewer() {
  const container = document.getElementById("chess-game");
  const pgnScript = document.getElementById("chess-pgn");
  if (!container || !pgnScript || !window.PGNV || typeof window.PGNV.pgnView !== "function") {
    return;
  }

  const pgn = pgnScript.textContent.trim();

  // Largeur disponible
  const parent = container.parentElement;
  const containerRect = container.getBoundingClientRect();
  const parentRect = parent ? parent.getBoundingClientRect() : null;

  // On prend la largeur du parent (plus fiable quand le board a déjà été rendu)
  let availableWidth = parentRect && parentRect.width ? parentRect.width : containerRect.width;

  // Fallback si tout est à 0 (section encore cachée par ex.)
  if (!availableWidth) {
    availableWidth = 320;
  }

  // ⚠️ Ne jamais dépasser la largeur de l'écran (pour éviter le overflow sur mobile)
  const viewportWidth = Math.max(
    document.documentElement.clientWidth || 0,
    window.innerWidth || 0
  );
  if (viewportWidth) {
    const maxBoardSize = viewportWidth - 32; // petite marge de 16px de chaque côté
    availableWidth = Math.min(availableWidth, maxBoardSize);
  }

  const boardSize = Math.max(240, Math.round(availableWidth));

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
  const toggles = [];
  let hasClickedChevron = false;
  let hintActive = false;

  const activateChevronHint = () => {
    if (hasClickedChevron || hintActive || !toggles.length) return;
    toggles.forEach(btn => btn.classList.add('cv-toggle--hint'));
    hintActive = true;
  };

  const deactivateChevronHint = () => {
    if (!hintActive) return;
    toggles.forEach(btn => btn.classList.remove('cv-toggle--hint'));
    hintActive = false;
  };

  const onScrollHint = () => {
    if (!hasClickedChevron) {
      activateChevronHint();
    }
  };

  const markChevronInteracted = () => {
    if (hasClickedChevron) return;
    hasClickedChevron = true;
    deactivateChevronHint();
    window.removeEventListener('scroll', onScrollHint);
  };

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
    toggles.push(btn);

    btn.addEventListener('click', () => {
      markChevronInteracted();
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

  if (toggles.length) {
    window.addEventListener('scroll', onScrollHint, { passive: true });
  }
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


// ==== ANIMATION SVG DE FOND – SECTION ÉCHECS ====
document.addEventListener("DOMContentLoaded", () => {
  const chessSection = document.getElementById("chess");
  if (!chessSection) return;

  const shape1 = chessSection.querySelector(".chess-bg-shape-1");
  const shape2 = chessSection.querySelector(".chess-bg-shape-2");
  if (!shape1 || !shape2) return;

  let sectionTop = chessSection.offsetTop;

  function recalcOffsets() {
    sectionTop = chessSection.offsetTop;
  }

  window.addEventListener("resize", recalcOffsets);
  recalcOffsets();

  let latestScrollY = window.scrollY;
  let ticking = false;

  function updateShapes() {
    const y = latestScrollY;
    const rel = y - sectionTop;
    const h = chessSection.offsetHeight + window.innerHeight;

    let progress = 0;
    if (h > 0) {
      progress = Math.min(Math.max(rel / h, 0), 1);
    }

    const t1x = progress * 220;
    const t2x = -progress * 180;
    const r1  = progress * 22;
    const r2  = -progress * 18;

    shape1.style.transform = `translate3d(${t1x}px, ${progress * 70}px, 0) rotate(${r1}deg)`;
    shape2.style.transform = `translate3d(${t2x}px, ${-progress * 50}px, 0) rotate(${r2}deg)`;

    ticking = false;
  }

  function onScroll() {
    latestScrollY = window.scrollY;
    if (!ticking) {
      window.requestAnimationFrame(updateShapes);
      ticking = true;
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  updateShapes();
});
