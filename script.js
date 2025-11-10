document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  const navLinks = document.querySelectorAll(".nav-links a");
  const yearSpan = document.getElementById("year");

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("nav-open");
      navToggle.classList.toggle("nav-open", isOpen);
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  navLinks.forEach((link) => {
    const target = link.getAttribute("href");
    if (target === currentPath || (target === "index.html" && currentPath === "")) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }

    link.addEventListener("click", () => {
      if (nav) {
        nav.classList.remove("nav-open");
      }
      if (navToggle) {
        navToggle.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  });

  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});
