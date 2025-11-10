// script.js
(function () {
  const root = document.documentElement;
  const langButtons = document.querySelectorAll(".lang-btn");
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  const yearSpan = document.getElementById("year");
  const translatableElements = document.querySelectorAll("[data-i18n]");
  const navLinks = document.querySelectorAll(".nav-links a[href^='#']");

  let currentLang = "en";

  function applyTranslations(lang) {
    const dict = translations[lang];
    if (!dict) return;

    translatableElements.forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    root.setAttribute("lang", lang);
    currentLang = lang;
  }

  langButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang;
      if (lang === currentLang) return;

      langButtons.forEach((b) => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });

      applyTranslations(lang);
    });
  });

  // Mobile nav toggle
  navToggle.addEventListener("click", () => {
    nav.classList.toggle("nav-open");
    navToggle.classList.toggle("nav-open");
  });

  // Close nav on link click (mobile)
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href").slice(1);
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
      nav.classList.remove("nav-open");
      navToggle.classList.remove("nav-open");
    });
  });

  // Scroll reveal
  const revealElements = document.querySelectorAll(".reveal");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealElements.forEach((el) => io.observe(el));

  // Dynamic year
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // Initial translations (EN by default)
  applyTranslations(currentLang);
})();
