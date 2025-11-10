(function () {
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  const navLinks = document.querySelectorAll(".nav-links a");
  const currentPage = document.body.dataset.page;
  const yearSpan = document.getElementById("year");

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("nav-open");
      navToggle.classList.toggle("nav-open", isOpen);
    });
  }

  navLinks.forEach((link) => {
    const page = link.dataset.page;
    if (page && page === currentPage) {
      link.setAttribute("aria-current", "page");
    }

    link.addEventListener("click", () => {
      if (nav && nav.classList.contains("nav-open")) {
        nav.classList.remove("nav-open");
        if (navToggle) {
          navToggle.classList.remove("nav-open");
        }
      }
    });
  });

  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  const viewers = document.querySelectorAll(".pgn-viewer[data-pgn]");
  if (viewers.length && window.PGNV) {
    viewers.forEach((el, index) => {
      if (!el.id) {
        el.id = `pgn-viewer-${index}`;
      }
      try {
        window.PGNV.pgnView(el.id, {
          pgn: el.dataset.pgn,
          theme: "wood",
          locale: "fr",
          pieceStyle: "merida",
          boardSize: "responsive",
        });
      } catch (error) {
        console.error("PGN viewer error", error);
      }
    });
  }
})();
