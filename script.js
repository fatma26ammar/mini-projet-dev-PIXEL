"use strict";

(() => {
  document.documentElement.classList.add("js");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");


  /* 1. DYNAMIC NAVIGATION */
  function initDynamicNav() {
    const header = document.querySelector(".site-header");
    const menuToggle = document.getElementById("nav-menu-toggle");
    const nav = document.getElementById("primary-nav");
    if (!header || !menuToggle || !nav) return;

    const MIN_SCROLL = 8;
    let lastY = window.scrollY;
    let waiting = false;

    function update() {
      waiting = false;
      const y = Math.max(window.scrollY, 0);

      header.classList.toggle("is-scrolled", y > 20);

      const delta = y - lastY;
      if (Math.abs(delta) < MIN_SCROLL) return;
      lastY = y;

      const keepVisible = menuToggle.checked || reduceMotion.matches || y <= header.offsetHeight;
      header.classList.toggle("is-hidden", delta > 0 && !keepVisible);
    }

    window.addEventListener("scroll", () => {
      if (!waiting) {
        waiting = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });

    header.addEventListener("focusin", () => header.classList.remove("is-hidden"));

    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) menuToggle.checked = false;
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuToggle.checked) {
        menuToggle.checked = false;
        menuToggle.focus();
      }
    });
    window.matchMedia("(min-width: 861px)").addEventListener("change", (event) => {
      if (event.matches) menuToggle.checked = false;
    });

    update();
  }


  /* 2. TESTIMONIAL CAROUSEL */
  const TESTIMONIALS = [
    {
      name: "Amel Gharbi",
      role: "Founder, Mellow Skincare",
      quote: "PIXEL listened first and designed second. Our brand finally looks the way we sound, and customers notice it straight away.",
    },
    {
      name: "Sami Jebali",
      role: "Co-founder, Orbit Beats Festival",
      quote: "They turned a messy pile of ideas into a clear, joyful interface. Our whole team could finally explain the festival at a glance.",
    },
    {
      name: "Nour Chaabane",
      role: "Owner, Atelier Nour",
      quote: "Careful, quick and fun to work with. The site loads fast and looks great on a phone, which is where my clients are.",
    },
    {
      name: "Hela Mansour",
      role: "Marketing Lead, Sidra Market",
      quote: "One team for the logo, the screens and the code meant nothing got lost in translation. That alone saved us weeks.",
    },
  ];

  function initCarousel() {
    const root = document.getElementById("carousel");
    if (!root) return;

    const slide = document.getElementById("carousel-slide");
    const quote = document.getElementById("carousel-quote");
    const avatar = document.getElementById("carousel-avatar");
    const nameEl = document.getElementById("carousel-name");
    const roleEl = document.getElementById("carousel-role");
    const prevButton = root.querySelector(".carousel-prev");
    const nextButton = root.querySelector(".carousel-next");
    const dotsWrap = root.querySelector(".carousel-dots");
    if (!slide || !quote || !avatar || !nameEl || !roleEl || !prevButton || !nextButton || !dotsWrap) return;

    const total = TESTIMONIALS.length;
    let current = 0;
    let busy = false;

    const fadeTime = () => (reduceMotion.matches ? 0 : 350);

    const initials = (name) =>
      name.split(" ").map((word) => word[0]).slice(0, 2).join("").toUpperCase();

    const dots = TESTIMONIALS.map((item, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel-dot";
      dot.setAttribute("aria-label", `Show testimonial ${index + 1} of ${total}`);
      dot.addEventListener("click", () => goTo(index));
      dotsWrap.appendChild(dot);
      return dot;
    });

    function render(index) {
      const item = TESTIMONIALS[index];
      quote.textContent = item.quote;
      nameEl.textContent = item.name;
      roleEl.textContent = item.role;
      avatar.textContent = initials(item.name);
      avatar.dataset.tone = String(index % 4);
      slide.setAttribute("aria-label", `${index + 1} of ${total}`);
      dots.forEach((dot, i) => {
        if (i === index) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
    }

    function goTo(index) {
      const next = (index + total) % total;
      if (busy || next === current) return;
      busy = true;

      slide.classList.add("is-changing");
      window.setTimeout(() => {
        current = next;
        render(current);
        slide.classList.remove("is-changing");
        window.setTimeout(() => { busy = false; }, fadeTime());
      }, fadeTime());
    }

    prevButton.addEventListener("click", () => goTo(current - 1));
    nextButton.addEventListener("click", () => goTo(current + 1));

    root.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") goTo(current - 1);
      if (event.key === "ArrowRight") goTo(current + 1);
    });

    let touchStartX = null;
    root.addEventListener("touchstart", (event) => {
      touchStartX = event.touches[0].clientX;
    }, { passive: true });
    root.addEventListener("touchend", (event) => {
      if (touchStartX === null) return;
      const distance = event.changedTouches[0].clientX - touchStartX;
      touchStartX = null;
      if (Math.abs(distance) > 50) goTo(current + (distance < 0 ? 1 : -1));
    }, { passive: true });

    render(current);
  }


})();