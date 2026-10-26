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


  /* 3. CONTACT FORM VALIDATION */
  const VALIDATORS = {
    name(value) {
      if (!value) return "Please tell us your name.";
      if (value.length < 2) return "Your name needs at least 2 characters.";
      if (!/^[\p{L}][\p{L}\s'’.-]*$/u.test(value)) return "Please use letters only (spaces, hyphens and apostrophes are fine).";
      return "";
    },
    email(value) {
      if (!value) return "Please enter your email address.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return "That email doesn't look right. Try something like name@example.com.";
      return "";
    },
    project(value) {
      return value ? "" : "Please choose a project type.";
    },
    message(value) {
      if (!value) return "Please tell us a little about your idea.";
      if (value.length < 10) return `Add a few more words: at least 10 characters (you have ${value.length}).`;
      if (value.length > 1000) return "Please keep your message under 1000 characters.";
      return "";
    },
  };

  function initFormValidation() {
    const form = document.getElementById("contact-form");
    const status = document.getElementById("form-status");
    if (!form || !status) return;

    const fields = Array.from(form.elements).filter((element) => VALIDATORS[element.name]);

    function setError(field, message) {
      const errorEl = document.getElementById(`${field.id}-error`);
      if (errorEl) errorEl.textContent = message;
      if (message) field.setAttribute("aria-invalid", "true");
      else field.removeAttribute("aria-invalid");
    }

    function validateField(field) {
      const value = field.tagName === "SELECT" ? field.value : field.value.trim();
      const message = VALIDATORS[field.name](value);
      setError(field, message);
      return message === "";
    }

    fields.forEach((field) => {
      field.addEventListener("blur", () => {
        if (field.tagName !== "SELECT") field.value = field.value.trim();
        if (field.value !== "" || field.hasAttribute("aria-invalid")) validateField(field);
      });
      const liveEvent = field.tagName === "SELECT" ? "change" : "input";
      field.addEventListener(liveEvent, () => {
        if (field.hasAttribute("aria-invalid")) validateField(field);
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      status.textContent = "";
      status.classList.remove("is-shown");

      let firstInvalid = null;
      fields.forEach((field) => {
        if (!validateField(field) && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      const firstName = form.elements.name.value.trim().split(" ")[0];
      status.textContent = `Thank you, ${firstName}! we will contact you soon`;
      status.classList.add("is-shown");
      form.reset();
      fields.forEach((field) => setError(field, ""));
    });
  }


  /* 4. CTA MODAL */
  function initModal() {
    const dialog = document.getElementById("project-modal");
    const triggers = document.querySelectorAll("[data-modal-open='project-modal']");
    if (!dialog || !triggers.length || typeof dialog.showModal !== "function") return;

    const modalForm = document.getElementById("modal-form");
    const projectSelect = document.getElementById("project");
    const nameInput = document.getElementById("name");
    let lastTrigger = null;
    let closing = false;

    function open(trigger) {
      if (dialog.open) return;
      lastTrigger = trigger;
      document.body.classList.add("modal-open");
      dialog.showModal();
    }

    function close(afterClose) {
      if (!dialog.open || closing) return;
      closing = true;
      dialog.classList.add("is-closing");
      window.setTimeout(() => {
        dialog.close();
        dialog.classList.remove("is-closing");
        document.body.classList.remove("modal-open");
        closing = false;
        if (lastTrigger) lastTrigger.focus({ preventScroll: true });
        if (typeof afterClose === "function") afterClose();
      }, reduceMotion.matches ? 0 : 250);
    }

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        open(trigger);
      });
    });

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog || event.target.closest("[data-modal-close]")) close();
    });

    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      close();
    });

    dialog.addEventListener("close", () => document.body.classList.remove("modal-open"));

    if (modalForm) {
      modalForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const choice = modalForm.querySelector("input[name='modal-project']:checked");

        if (choice && projectSelect) {
          projectSelect.value = choice.value;
          projectSelect.dispatchEvent(new Event("change"));
        }

        close(() => {
          const contact = document.getElementById("contact");
          if (contact) contact.scrollIntoView();
          if (nameInput) nameInput.focus({ preventScroll: true });
        });
      });
    }
  }


  /* 5. SCROLL REVEAL */
  function initScrollReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    const showAll = () => items.forEach((item) => item.classList.add("is-visible"));

    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      showAll();
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });

    items.forEach((item) => observer.observe(item));
  }


  /* 6. ANIMATED COUNTERS */
  const COUNTERS = [
    { id: "stat-projects", end: 48 },
    { id: "stat-clients", end: 32 },
    { id: "stat-years", end: 6 },
    { id: "stat-countries", end: 5 },
  ];

  function initCounters() {
    const DURATION = 1800;
    const items = COUNTERS
      .map((counter) => ({ ...counter, el: document.getElementById(counter.id) }))
      .filter((counter) => counter.el);

    if (!items.length) return;
    if (reduceMotion.matches || !("IntersectionObserver" in window)) return;

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    function animate(item) {
      const start = performance.now();
      function frame(now) {
        const progress = Math.min(Math.max((now - start) / DURATION, 0), 1);
        item.el.textContent = Math.round(item.end * easeOutCubic(progress));
        if (progress < 1) window.requestAnimationFrame(frame);
      }
      window.requestAnimationFrame(frame);
    }

    const byElement = new Map(items.map((item) => [item.el, item]));

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animate(byElement.get(entry.target));
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    items.forEach((item) => {
      item.el.textContent = "0";
      observer.observe(item.el);
    });
  }


  /* START */
  [initDynamicNav, initScrollReveal, initCarousel, initFormValidation, initModal, initCounters]
    .forEach((init) => {
      try {
        init();
      } catch (error) {
        console.error(`PIXEL: ${init.name} failed`, error);
        if (init === initScrollReveal) {
          document.querySelectorAll(".reveal").forEach((item) => item.classList.add("is-visible"));
        }
      }
    });
})();