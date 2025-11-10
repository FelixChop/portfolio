// script.js
(function () {
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  const navLinks = document.querySelectorAll(".nav-links a[href^='#']");
  const yearSpan = document.getElementById("year");
  const revealElements = document.querySelectorAll(".reveal");

  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      nav.classList.toggle("nav-open");
      navToggle.classList.toggle("nav-open");
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const targetId = link.getAttribute("href").slice(1);
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
      if (nav) {
        nav.classList.remove("nav-open");
      }
      if (navToggle) {
        navToggle.classList.remove("nav-open");
      }
    });
  });

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

  const initChessViewer = () => {
    if (window.PGNV && document.getElementById("chess-game")) {
      new PGNV.pgnView("chess-game", {
        pgn: `[Date "2024.07.15"]\n[Result "1-0"]\n[Variant "Standard"]\n1. e4 c5 2. Nf3 d6 3. Bb5+ Nc6 4. Bxc6+ bxc6 5. d3 e5 6. Nbd2 Be7 7. Nc4 f5 8. Ne3 Nh6 9. Bd2 O-O 10. h3 fxe4 11. dxe4 Rf4! 12. Bc3 Rxe4 13. Qd3 Rf4 14. O-O-O! Qf8 15. Nd5!! cxd5 16. Qxd5+ Be6 17. Qxe6+ Qf7 18. Rxd6! Bxd6 19. Qxd6 Re8 20. Nxe5 Qe6 21. Qd2 Rf5 22. f4 Rff8 23. b3 Nf5 24. g4 Nd4 25. Re1 Qd5 26. Qe3 Re7 27. g5 Rf5 28. Kb2 Re8 29. Qg3 Nb5 30. g6 h5 31. Nf7 Rxe1 32. Qxe1 Kf8 33. Be5 Qe6 34. Bxg7+ Ke7 35. Bf8+ Kf6 36. Qxe6+ Kxe6 37. Nd8+ 1-0`,
        pieceStyle: "merida",
        theme: "brown",
        boardSize: "large",
      });
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initChessViewer);
  } else {
    initChessViewer();
  }
})();
