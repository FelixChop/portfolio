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
    const availableWidth = container.clientWidth || (parent ? parent.clientWidth - 48 : 520);
    const boardSize = Math.min(520, Math.max(280, availableWidth));
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

  function initChessViewer() {
    if (!window.PGNV || typeof window.PGNV.pgnView !== "function") {
      return;
    }
    chessViewerReady = true;
    renderChessViewer();
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
})();
