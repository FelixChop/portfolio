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

  async function hydrateFideRating() {
    const badges = Array.from(document.querySelectorAll(".fide-rating-badge"));
    if (!badges.length) {
      return;
    }

    const fideId = badges[0].dataset.fideId;
    if (!fideId) {
      badges.forEach((badge) => badge.remove());
      return;
    }

    const endpoints = [
      `https://cors.isomorphic-git.org/https://ratings.fide.com/api_json_player.php?id=${fideId}`,
      `https://ratings.fide.com/api_json_player.php?id=${fideId}`
    ];

    let rating = null;

    const extractRating = (payload) => {
      if (!payload) {
        return null;
      }

      const visited = new WeakSet();

      const explore = (value) => {
        if (!value || typeof value !== "object") {
          return null;
        }
        if (visited.has(value)) {
          return null;
        }
        visited.add(value);

        if (Array.isArray(value)) {
          for (const item of value) {
            const nested = explore(item);
            if (nested) {
              return nested;
            }
          }
          return null;
        }

        for (const [key, raw] of Object.entries(value)) {
          if (typeof raw === "string" || typeof raw === "number") {
            const maybeNumber = parseInt(raw, 10);
            if (!Number.isNaN(maybeNumber) && maybeNumber >= 1000 && maybeNumber <= 3000) {
              if (/rating|elo/i.test(key)) {
                return maybeNumber;
              }
            }
          }
        }

        for (const nestedValue of Object.values(value)) {
          if (nestedValue && typeof nestedValue === "object") {
            const nested = explore(nestedValue);
            if (nested) {
              return nested;
            }
          }
        }
        return null;
      };

      return explore(payload);
    };

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
        if (!response.ok) {
          continue;
        }

        const contentType = response.headers.get("content-type") || "";
        let payload;
        if (contentType.includes("application/json")) {
          payload = await response.json();
        } else {
          const text = await response.text();
          try {
            payload = JSON.parse(text);
          } catch (error) {
            continue;
          }
        }

        rating = extractRating(payload);
        if (rating) {
          break;
        }
      } catch (error) {
        // swallow network/CORS errors and try the next endpoint
      }
    }

    if (!rating) {
      const fallback = badges[0].dataset.fideDefault;
      if (fallback) {
        const maybeNumber = parseInt(fallback, 10);
        if (!Number.isNaN(maybeNumber)) {
          rating = maybeNumber;
        }
      }
    }

    if (!rating) {
      badges.forEach((badge) => badge.remove());
      return;
    }

    badges.forEach((badge) => {
      const frTarget = badge.querySelector('[data-lang="fr"]');
      const enTarget = badge.querySelector('[data-lang="en"]');
      const frLabel = badge.dataset.labelFr || "ELO FIDE : ";
      const enLabel = badge.dataset.labelEn || "FIDE rating: ";

      if (frTarget) {
        frTarget.textContent = `${frLabel}${rating}`;
      }
      if (enTarget) {
        enTarget.textContent = `${enLabel}${rating}`;
      }
    });
  }

  if (document.readyState === "complete") {
    hydrateFideRating();
  } else {
    window.addEventListener("load", hydrateFideRating, { once: true });
  }
})();
