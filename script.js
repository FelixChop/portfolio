// script.js
(function () {
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  const navLinks = document.querySelectorAll(".nav-links a[href^='#']");
  const langToggle = document.querySelector(".lang-toggle");
  const yearSpan = document.getElementById("year");
  const revealElements = document.querySelectorAll(".reveal");

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
    document.body.classList.remove("lang-fr", "lang-en");
    document.body.classList.add(`lang-${targetLang}`);
    document.documentElement.lang = targetLang;
    if (langToggle) {
      const label = targetLang === "fr" ? "Passer en anglais" : "Switch to French";
      langToggle.setAttribute("aria-label", label);
      langToggle.setAttribute("aria-pressed", targetLang === "en" ? "true" : "false");
    }
    try {
      window.localStorage.setItem("preferredLang", targetLang);
    } catch (error) {
      // ignore storage errors
    }
  }

  if (langToggle) {
    langToggle.addEventListener("click", () => {
      const nextLang = document.body.classList.contains("lang-fr") ? "en" : "fr";
      setLanguage(nextLang);
    });

    let storedLang;
    try {
      storedLang = window.localStorage.getItem("preferredLang");
    } catch (error) {
      storedLang = null;
    }
    if (storedLang && storedLang !== "fr") {
      setLanguage(storedLang);
    } else {
      setLanguage("fr");
    }
  }

  // Chess PGN viewer
  function initChessViewer() {
    const container = document.getElementById("chess-game");
    const pgnScript = document.getElementById("chess-pgn");
    if (!container || !pgnScript || !window.PGNV || typeof window.PGNV.pgnView !== "function") {
      return;
    }
    const pgn = pgnScript.textContent.trim();
    window.PGNV.pgnView("chess-game", {
      pgn,
      theme: "wikipedia",
      pieceStyle: "merida",
      boardSize: 520,
      showCoordinates: true,
      locale: "fr",
      showAnnotations: true,
      notation: "short"
    });
  }

  if (document.readyState === "complete") {
    initChessViewer();
  } else {
    window.addEventListener("load", initChessViewer);
  }
})();
