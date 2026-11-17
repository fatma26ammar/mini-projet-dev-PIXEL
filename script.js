"use strict";

/* ==========================================================
   PIXEL — script.js
   Vanilla JavaScript, no libraries.

   1. Dynamic navigation (hide on scroll down, show on scroll up)
   2. Testimonial carousel
   3. Contact form validation
   4. CTA modal ("Start a project")
   5. Scroll reveal (IntersectionObserver)
   6. Animated counters (IntersectionObserver)
   7. Click tracking          -> sends clicks to PHP (php/track.php)
   8. Live server numbers     -> reads them from PHP (php/stats.php)

   Contact form (3) also talks to PHP: it sends the message with
   fetch() to php/contact.php and shows the server's answer.

   Each feature lives in its own init function. They are run at
   the bottom inside try/catch, so one broken feature can never
   stop the others (or leave content hidden).
   ========================================================== */

(() => {
  // Lets the CSS know JavaScript is running (used by scroll reveal and the carousel controls).
  document.documentElement.classList.add("js");

  // Checked at the moment we need it, so it follows the user's system setting.
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");


  /* ----------------------------------------------------------
     SERVER (JavaScript <-> PHP)
     Everything that talks to the PHP scripts goes through
     requestJSON(), so errors are handled in one single place.
     ---------------------------------------------------------- */
  const API = {
    token: "php/token.php",     // GET  -> one-time security token
    contact: "php/contact.php", // POST -> save the contact message
    track: "php/track.php",     // POST -> add 1 to a button counter
    stats: "php/stats.php",     // GET  -> live numbers from the database
  };

  // Calls a PHP script and returns { ok, status, data }.
  // It never throws for a bad answer (404, 422, 500...): the caller reads `ok` and `status`.
  // It does throw if the server cannot be reached at all, or after 10 seconds.
  async function requestJSON(url, options = {}) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(url, { credentials: "same-origin", ...options, signal: controller.signal });
      let data = null;
      try {
        data = await response.json();
      } catch {
        // The answer was not JSON (for example an HTML 404 page on a host without PHP).
      }
      return { ok: response.ok && data !== null && data.ok === true, status: response.status, data };
    } finally {
      window.clearTimeout(timer);
    }
  }

  // Security token required by contact.php (see php/token.php).
  let csrfToken = "";
  async function loadToken() {
    try {
      const result = await requestJSON(API.token);
      csrfToken = result.ok ? result.data.token : "";
    } catch {
      csrfToken = "";
    }
  }

  // Fills the "Live from our server" line in the footer with numbers read from MySQL.
  async function refreshStats() {
    const box = document.getElementById("server-stats");
    if (!box) return;
    try {
      const result = await requestJSON(API.stats);
      if (!result.ok) return; // no PHP / no database: the line simply stays hidden
      box.querySelector("[data-stat='messages']").textContent = result.data.messages;
      box.querySelector("[data-stat='clicks']").textContent = result.data.clicks;
      box.hidden = false;
    } catch {
      // Server unreachable: nothing to show, and nothing breaks.
    }
  }


  /* ----------------------------------------------------------
     1. DYNAMIC NAVIGATION
     Scroll down  -> header slides away (more room to read)
     Scroll up    -> header comes back
     It always stays visible near the top of the page, while the
     mobile menu is open, when the keyboard focus enters it, and
     for people who prefer reduced motion.
     ---------------------------------------------------------- */
  function initDynamicNav() {
    const header = document.querySelector(".site-header");
    const menuToggle = document.getElementById("nav-menu-toggle"); // the hidden checkbox
    const nav = document.getElementById("primary-nav");
    if (!header || !menuToggle || !nav) return;

    const MIN_SCROLL = 8; // ignore tiny movements so the header does not flicker
    let lastY = window.scrollY;
    let waiting = false;  // true while a screen update is already scheduled

    function update() {
      waiting = false;
      const y = Math.max(window.scrollY, 0); // iOS "bounce" can report negative values

      header.classList.toggle("is-scrolled", y > 20);

      const delta = y - lastY;
      if (Math.abs(delta) < MIN_SCROLL) return;
      lastY = y;

      const keepVisible = menuToggle.checked || reduceMotion.matches || y <= header.offsetHeight;
      header.classList.toggle("is-hidden", delta > 0 && !keepVisible);
    }

    // The scroll event fires very often. requestAnimationFrame lets us do the work at most once per frame.
    window.addEventListener("scroll", () => {
      if (!waiting) {
        waiting = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });

    // Keyboard users tabbing back up to the header must be able to see it.
    header.addEventListener("focusin", () => header.classList.remove("is-hidden"));

    // Mobile menu: close it after choosing a link...
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) menuToggle.checked = false;
    });
    // ...and with the Escape key.
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuToggle.checked) {
        menuToggle.checked = false;
        menuToggle.focus();
      }
    });
    // ...and if the window grows to desktop size while it is open.
    window.matchMedia("(min-width: 861px)").addEventListener("change", (event) => {
      if (event.matches) menuToggle.checked = false;
    });

    update();
  }


  /* ----------------------------------------------------------
     2. TESTIMONIAL CAROUSEL
     The data is a simple array. The first testimonial is also
     written in the HTML, so the section still shows something
     if JavaScript is off.
     ---------------------------------------------------------- */
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
    let busy = false; // blocks new clicks while a transition is running

    const fadeTime = () => (reduceMotion.matches ? 0 : 350); // must match the CSS transition

    const initials = (name) =>
      name.split(" ").map((word) => word[0]).slice(0, 2).join("").toUpperCase();

    // One dot (button) per testimonial.
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
      const next = (index + total) % total; // wraps around: after the last comes the first
      if (busy || next === current) return;
      busy = true;

      slide.classList.add("is-changing");          // 1. fade out
      window.setTimeout(() => {
        current = next;
        render(current);                            // 2. swap the content while invisible
        slide.classList.remove("is-changing");      // 3. fade in
        window.setTimeout(() => { busy = false; }, fadeTime());
      }, fadeTime());
    }

    prevButton.addEventListener("click", () => goTo(current - 1));
    nextButton.addEventListener("click", () => goTo(current + 1));

    // Left / right arrow keys while the focus is inside the carousel.
    root.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") goTo(current - 1);
      if (event.key === "ArrowRight") goTo(current + 1);
    });

    // Swipe on touch screens.
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


  /* ----------------------------------------------------------
     3. CONTACT FORM VALIDATION
     The form has "novalidate" so the browser's own bubbles are
     replaced by our messages. Each field has a <p id="X-error">
     that the field points to with aria-describedby.
     When everything is valid, the message is sent to PHP with
     fetch() (php/contact.php). The server checks it again, saves
     it in MySQL and answers with JSON.
     ---------------------------------------------------------- */
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
    const submitButton = form.querySelector("button[type='submit']");
    const submitLabel = submitButton.querySelector(".btn-label");
    const defaultLabel = submitLabel.textContent;
    let sending = false; // blocks a second submit while the first one is travelling

    loadToken(); // ask PHP for the security token as soon as the page is ready

    function showStatus(message, kind) {
      status.textContent = message;
      status.classList.toggle("is-shown", kind === "success");
      status.classList.toggle("is-error", kind === "error");
    }

    function setSending(isSending) {
      sending = isSending;
      submitButton.disabled = isSending;
      form.setAttribute("aria-busy", String(isSending));
      submitLabel.textContent = isSending ? "Sending..." : defaultLabel;
    }

    // Sends the (already validated) form to PHP and reacts to the answer.
    async function sendToServer() {
      setSending(true);
      try {
        if (!csrfToken) await loadToken(); // the first request may have failed

        const body = new FormData(form);   // name, email, project, message + the hidden "website" honeypot
        fields.forEach((field) => body.set(field.name, field.value.trim()));
        body.set("csrf_token", csrfToken);

        const result = await requestJSON(API.contact, { method: "POST", body });

        if (result.ok) {
          showStatus(result.data.message, "success");
          form.reset();
          fields.forEach((field) => setError(field, ""));
          loadToken();    // the token is single-use: get a new one for the next message
          refreshStats(); // the message counter in the footer goes up
          return;
        }

        // 422 = the server refused some fields: show its messages under those fields.
        if (result.status === 422 && result.data && result.data.errors) {
          let firstInvalid = null;
          fields.forEach((field) => {
            const message = result.data.errors[field.name];
            if (message) {
              setError(field, message);
              if (!firstInvalid) firstInvalid = field;
            }
          });
          showStatus(result.data.message, "error");
          if (firstInvalid) firstInvalid.focus();
          return;
        }

        if (result.status === 403) {
          csrfToken = "";
          loadToken(); // session expired: a new token for the next try
        }
        showStatus(
          (result.data && result.data.message) || "The server could not take your message right now. Please try again later.",
          "error"
        );
      } catch {
        showStatus("We could not reach the server. Check your connection and try again.", "error");
      } finally {
        setSending(false);
      }
    }

    function setError(field, message) {
      const errorEl = document.getElementById(`${field.id}-error`);
      if (errorEl) errorEl.textContent = message;
      if (message) field.setAttribute("aria-invalid", "true");
      else field.removeAttribute("aria-invalid");
    }

    // Returns true when the field is valid. Also shows or clears its message.
    function validateField(field) {
      const value = field.tagName === "SELECT" ? field.value : field.value.trim();
      const message = VALIDATORS[field.name](value);
      setError(field, message);
      return message === "";
    }

    fields.forEach((field) => {
      // When leaving a field: tidy the spaces and check it (but don't nag about untouched empty fields).
      field.addEventListener("blur", () => {
        if (field.tagName !== "SELECT") field.value = field.value.trim();
        if (field.value !== "" || field.hasAttribute("aria-invalid")) validateField(field);
      });
      // While typing: once a field has an error, re-check it live so the message disappears as soon as it is fixed.
      const liveEvent = field.tagName === "SELECT" ? "change" : "input";
      field.addEventListener(liveEvent, () => {
        if (field.hasAttribute("aria-invalid")) validateField(field);
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault(); // no page reload: fetch() will do the sending
      if (sending) return;
      showStatus("", "");

      let firstInvalid = null;
      fields.forEach((field) => {
        if (!validateField(field) && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        firstInvalid.focus(); // screen readers then read the label and the error
        return;
      }

      sendToServer();
    });
  }


  /* ----------------------------------------------------------
     4. CTA MODAL
     The hero button "Start a project" opens a short dialog where
     the visitor picks a project type. "Continue" then pre-selects
     that type in the contact form and moves them to it.
     It uses the native <dialog> element, which already gives us:
     focus trapping, Escape key, and an inert page behind it.
     Without JavaScript the button is still a normal #contact link.
     ---------------------------------------------------------- */
  function initModal() {
    const dialog = document.getElementById("project-modal");
    const triggers = document.querySelectorAll("[data-modal-open='project-modal']");
    if (!dialog || !triggers.length || typeof dialog.showModal !== "function") return;

    const modalForm = document.getElementById("modal-form");
    const projectSelect = document.getElementById("project");
    const nameInput = document.getElementById("name");
    let lastTrigger = null; // the button that opened the modal, so we can give the focus back
    let closing = false;

    function open(trigger) {
      if (dialog.open) return;
      lastTrigger = trigger;
      document.body.classList.add("modal-open"); // stops the page behind from scrolling
      dialog.showModal();
    }

    function close(afterClose) {
      if (!dialog.open || closing) return;
      closing = true;
      dialog.classList.add("is-closing"); // plays the closing animation
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

    // One listener handles: the X button, "Maybe later", and a click on the dark backdrop.
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog || event.target.closest("[data-modal-close]")) close();
    });

    // Escape: stop the instant native close so our animation can play.
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      close();
    });

    // Safety net: whatever closes the dialog, release the page scroll.
    dialog.addEventListener("close", () => document.body.classList.remove("modal-open"));

    if (modalForm) {
      modalForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const choice = modalForm.querySelector("input[name='modal-project']:checked");

        if (choice && projectSelect) {
          projectSelect.value = choice.value;
          projectSelect.dispatchEvent(new Event("change")); // clears an old error, if any
        }

        close(() => {
          const contact = document.getElementById("contact");
          if (contact) contact.scrollIntoView();
          if (nameInput) nameInput.focus({ preventScroll: true });
        });
      });
    }
  }


  /* ----------------------------------------------------------
     5. SCROLL REVEAL
     Elements with class "reveal" are hidden by the CSS (only when
     JavaScript is running) and get "is-visible" when they enter
     the screen. IntersectionObserver tells us that, so we never
     measure positions on every scroll event.
     ---------------------------------------------------------- */
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
        obs.unobserve(entry.target); // reveal once, then stop watching
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });

    items.forEach((item) => observer.observe(item));
  }


  /* ----------------------------------------------------------
     6. ANIMATED COUNTERS
     The final numbers are already written in the HTML (so they
     show if JavaScript fails). Keep the "end" values below equal
     to the numbers in the HTML. All figures are fictional.
     ---------------------------------------------------------- */
  const COUNTERS = [
    { id: "stat-projects", end: 48 },
    { id: "stat-clients", end: 32 },
    { id: "stat-years", end: 6 },
    { id: "stat-countries", end: 5 },
  ];

  function initCounters() {
    const DURATION = 1800; // milliseconds
    const items = COUNTERS
      .map((counter) => ({ ...counter, el: document.getElementById(counter.id) }))
      .filter((counter) => counter.el);

    if (!items.length) return;
    if (reduceMotion.matches || !("IntersectionObserver" in window)) return; // keep the final values

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3); // fast start, gentle finish

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
        obs.unobserve(entry.target); // each counter runs only once
      });
    }, { threshold: 0.6 });

    items.forEach((item) => {
      item.el.textContent = "0";
      observer.observe(item.el);
    });
  }


  /* ----------------------------------------------------------
     7. CLICK TRACKING
     Any element with data-track="some-id" counts its clicks on the
     server. One listener on the document handles all of them
     (event delegation), so adding a new tracked button only needs
     the attribute in the HTML (and its id in the database).
     ---------------------------------------------------------- */
  function initClickTracking() {
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-track]");
      if (!button) return;

      // keepalive lets the request finish even if the click leaves the page.
      requestJSON(API.track, {
        method: "POST",
        body: new URLSearchParams({ button: button.dataset.track }),
        keepalive: true,
      })
        .then(refreshStats)
        .catch(() => {}); // tracking must never disturb the visitor
    });
  }


  /* ----------------------------------------------------------
     8. LIVE SERVER NUMBERS
     Reads the totals stored in MySQL (php/stats.php) and shows
     them in the footer. It is refreshed after each tracked click
     and after each sent message.
     ---------------------------------------------------------- */
  function initServerStats() {
    refreshStats();
  }


  /* ----------------------------------------------------------
     START
     ---------------------------------------------------------- */
  [initDynamicNav, initScrollReveal, initCarousel, initFormValidation, initModal, initCounters, initClickTracking, initServerStats]
    .forEach((init) => {
      try {
        init();
      } catch (error) {
        console.error(`PIXEL: ${init.name} failed`, error);
        // If the reveal setup breaks, never leave content hidden.
        if (init === initScrollReveal) {
          document.querySelectorAll(".reveal").forEach((item) => item.classList.add("is-visible"));
        }
      }
    });
})();
