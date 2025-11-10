// script.js

document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  const navLinks = document.querySelectorAll("[data-target]");
  const pages = document.querySelectorAll(".page");
  const yearSpan = document.getElementById("year");

  const closeNav = () => {
    if (nav && nav.classList.contains("open")) {
      nav.classList.remove("open");
    }
    if (navToggle && navToggle.classList.contains("open")) {
      navToggle.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  };

  const showPage = (id, updateHash = true) => {
    const target = document.getElementById(id);
    if (!target) return;

    pages.forEach((section) => {
      section.classList.toggle("active", section === target);
    });

    navLinks.forEach((link) => {
      link.classList.toggle("active", link.dataset.target === id);
    });

    if (updateHash) {
      const hash = `#${id}`;
      if (window.location.hash !== hash) {
        history.replaceState(null, "", hash);
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    closeNav();
  };

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const id = link.dataset.target;
      showPage(id);
    });
  });

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const expanded = navToggle.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", expanded ? "true" : "false");
      nav.classList.toggle("open", expanded);
    });
  }

  const handleHash = () => {
    const hash = window.location.hash.slice(1) || "home";
    showPage(hash, false);
  };

  handleHash();
  window.addEventListener("hashchange", handleHash);

  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  const chessViewer = document.querySelector(".chess-viewer");
  if (chessViewer && window.Chess) {
    const pgnRaw = chessViewer.dataset.pgn || "";
    const pgn = pgnRaw.replace(/\\n/g, "\n");
    const board = chessViewer.querySelector("chess-board");
    const movesContainer = chessViewer.querySelector(".viewer-moves");
    const indicator = chessViewer.querySelector(".move-indicator");
    const buttons = chessViewer.querySelectorAll("[data-action]");

    const parser = new window.Chess();
    const game = new window.Chess();
    try {
      parser.load_pgn(pgn);
    } catch (error) {
      console.error("Impossible de charger la partie d'échecs", error);
      return;
    }

    const movesSan = parser.history();
    const verbose = parser.history({ verbose: true });
    const positions = [game.fen()];
    movesSan.forEach((move) => {
      game.move(move);
      positions.push(game.fen());
    });

    let currentIndex = 0; // 0 = position initiale
    const total = movesSan.length;

    const renderMoves = () => {
      if (!movesContainer) return;
      movesContainer.innerHTML = "";
      let moveNumber = 1;
      for (let i = 0; i < verbose.length; i += 2) {
        const white = verbose[i];
        const black = verbose[i + 1];
        const li = document.createElement("li");
        li.innerHTML = `${moveNumber}. `;

        if (white) {
          const spanWhite = document.createElement("span");
          spanWhite.textContent = white.san;
          spanWhite.dataset.moveIndex = (i + 1).toString();
          li.appendChild(spanWhite);
        }

        if (black) {
          const spanBlack = document.createElement("span");
          spanBlack.textContent = ` ${black.san}`;
          spanBlack.dataset.moveIndex = (i + 2).toString();
          li.appendChild(spanBlack);
        }

        movesContainer.appendChild(li);
        moveNumber += 1;
      }

      movesContainer.querySelectorAll("span").forEach((span) => {
        span.addEventListener("click", () => {
          const index = Number(span.dataset.moveIndex);
          goTo(index);
        });
      });
    };

    const updateUI = () => {
      if (board) {
        board.setAttribute("position", positions[currentIndex]);
      }
      if (indicator) {
        indicator.textContent = `${currentIndex}/${total}`;
      }
      if (movesContainer) {
        movesContainer.querySelectorAll("span").forEach((span) => {
          span.classList.toggle(
            "active",
            Number(span.dataset.moveIndex) === currentIndex
          );
        });
      }
    };

    const goTo = (index) => {
      const target = Math.min(Math.max(index, 0), total);
      currentIndex = target;
      updateUI();
    };

    renderMoves();
    updateUI();

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.action;
        if (!action) return;
        switch (action) {
          case "start":
            goTo(0);
            break;
          case "prev":
            goTo(currentIndex - 1);
            break;
          case "next":
            goTo(currentIndex + 1);
            break;
          case "end":
            goTo(total);
            break;
          default:
            break;
        }
      });
    });
  }
});
