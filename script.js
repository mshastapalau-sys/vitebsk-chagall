// Скрипты страницы. Файл подключён как модуль.

// Один элемент
const qs = (selector, root = document) => root.querySelector(selector);

// Список элементов
const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

// В системе отключены анимации
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Меню: бургер, плавный переход по якорю, закрытие по Esc
const initNav = () => {
  const header = qs(".header");
  const burger = qs(".header__burger");
  const nav = qs("#nav");
  if (!header || !burger || !nav) return;

  const mobileNav = window.matchMedia("(max-width: 767px)");

  const syncInert = () => {
    nav.inert = mobileNav.matches && !header.classList.contains("is-open");
  };

  const setOpen = (open) => {
    header.classList.toggle("is-open", open);
    document.body.classList.toggle("is-locked", open && mobileNav.matches);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    syncInert();
    if (open) {
      const firstLink = qs(".nav__link", nav);
      firstLink?.focus();
    }
  };

  burger.addEventListener("click", () => {
    setOpen(!header.classList.contains("is-open"));
  });

  qsa(".nav__link", nav).forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && header.classList.contains("is-open")) {
      setOpen(false);
      burger.focus();
    }
  });

  mobileNav.addEventListener("change", () => {
    if (!mobileNav.matches) setOpen(false);
    syncInert();
  });

  syncInert();
};

// Тень шапки и кнопка «Наверх» после прокрутки
const initHeader = () => {
  const header = qs(".header");
  const toTop = qs("[data-to-top]");
  if (!header) return;

  const update = () => {
    const scrolled = window.scrollY > 50;
    header.classList.toggle("is-scrolled", scrolled);
    if (toTop) toTop.hidden = !scrolled;
  };

  update();
  window.addEventListener("scroll", update, { passive: true });

  toTop?.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? "auto" : "smooth"
    });
  });
};

// Подсветка пункта меню той секции, что сейчас на экране
const initActiveLink = () => {
  const links = qsa(".nav__link");
  if (!links.length) return;

  const byId = new Map(links.map((link) => [link.getAttribute("href")?.slice(1), link]));
  const sections = qsa("main section").filter((section) => byId.has(section.id));
  if (!sections.length) return;

  const setCurrent = (id) => {
    links.forEach((link) => {
      const active = link.getAttribute("href") === `#${id}`;
      link.classList.toggle("nav__link--active", active);
      if (active) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) setCurrent(entry.target.id);
    });
  }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });

  sections.forEach((section) => observer.observe(section));
};

// Блоки проявляются, когда до них докрутили
const initReveal = () => {
  const items = qsa("[data-reveal]");
  if (!items.length) return;

  if (prefersReducedMotion()) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.18 });

  items.forEach((item) => {
    const siblings = qsa(":scope > [data-reveal]", item.parentElement);
    const index = siblings.indexOf(item);
    if (index > 0) item.style.transitionDelay = `${index * 0.1}s`;
    observer.observe(item);
  });
};

// Карточка жизни переворачивается по кнопке
const initFlipCards = () => {
  qsa("[data-flip]").forEach((card) => {
    const front = qs(".period-card__front", card);
    const back = qs(".period-card__back", card);
    const [moreButton, backButton] = qsa(".period-card__toggle", card);
    if (!front || !back || !moreButton || !backButton) return;

    back.inert = true;

    const setFlipped = (flipped, moveFocus) => {
      card.classList.toggle("is-flipped", flipped);
      front.inert = flipped;
      back.inert = !flipped;
      moreButton.setAttribute("aria-expanded", String(flipped));
      if (moveFocus) window.setTimeout(() => (flipped ? backButton : moreButton).focus(), 0);
    };

    moreButton.addEventListener("click", () => setFlipped(true, true));
    backButton.addEventListener("click", () => setFlipped(false, true));
  });
};

// Линия хронологии растёт вместе с прокруткой, точка раскрывает текст
const initTimeline = () => {
  const section = qs(".timeline");
  if (!section) return;

  const items = qsa(".timeline__item", section);
  const reduced = prefersReducedMotion();

  if (!reduced) section.classList.add("is-drawing");

  const updateProgress = () => {
    if (reduced) {
      section.style.setProperty("--progress", "1");
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const rect = section.getBoundingClientRect();
    const start = window.innerHeight * 0.9;
    const distance = rect.height + window.innerHeight * 0.35;
    const progress = Math.min(1, Math.max(0, (start - rect.top) / distance));
    section.style.setProperty("--progress", progress.toFixed(3));

    items.forEach((item, index) => {
      item.classList.toggle("is-visible", progress >= (index + 0.15) / items.length);
    });
  };

  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);

  items.forEach((item) => {
    const button = qs(".timeline__point", item);
    const details = qs(".timeline__details", item);
    if (!button || !details) return;

    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!open));
      details.hidden = open;
    });
  });
};

// Карусель мест на телефоне: стрелки, точки, свайп и клавиши
const initSlider = () => {
  const slider = qs("[data-slider]");
  if (!slider) return;

  const viewport = qs(".slider__viewport", slider);
  const track = qs(".slider__track", slider);
  const slides = qsa(".place-card", slider);
  const prev = qs(".slider__btn--prev", slider);
  const next = qs(".slider__btn--next", slider);
  const dotsWrap = qs(".slider__dots", slider);
  if (!viewport || !track || !slides.length || !prev || !next || !dotsWrap) return;

  const mobileSlider = window.matchMedia("(max-width: 767px)");
  let index = 0;
  let dragged = false;

  const dots = slides.map((_, dotIndex) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "slider__dot";
    dot.setAttribute("aria-label", `Слайд ${dotIndex + 1}`);
    dot.addEventListener("click", () => showSlide(dotIndex));
    dotsWrap.append(dot);
    return dot;
  });

  const showSlide = (nextIndex) => {
    if (!mobileSlider.matches) {
      track.style.transform = "";
      return;
    }
    index = (nextIndex + slides.length) % slides.length;
    track.style.transform = `translateX(${-index * 100}%)`;
    dots.forEach((dot, dotIndex) => {
      const active = dotIndex === index;
      dot.classList.toggle("is-active", active);
      if (active) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
  };

  prev.addEventListener("click", () => showSlide(index - 1));
  next.addEventListener("click", () => showSlide(index + 1));

  slider.addEventListener("keydown", (event) => {
    if (!mobileSlider.matches) return;
    if (event.key === "ArrowRight") showSlide(index + 1);
    if (event.key === "ArrowLeft") showSlide(index - 1);
  });

  let startX = 0;
  let deltaX = 0;
  let pointerDown = false;

  viewport.addEventListener("pointerdown", (event) => {
    if (!mobileSlider.matches || event.button !== 0) return;
    pointerDown = true;
    dragged = false;
    startX = event.clientX;
    deltaX = 0;
  });

  viewport.addEventListener("pointermove", (event) => {
    if (!pointerDown) return;
    deltaX = event.clientX - startX;
    if (Math.abs(deltaX) > 8) dragged = true;
  });

  const endDrag = () => {
    if (!pointerDown) return;
    pointerDown = false;
    if (deltaX < -40) showSlide(index + 1);
    else if (deltaX > 40) showSlide(index - 1);
  };

  viewport.addEventListener("pointerup", endDrag);
  viewport.addEventListener("pointercancel", endDrag);

  viewport.addEventListener("click", (event) => {
    if (!dragged) return;
    event.preventDefault();
    event.stopPropagation();
    dragged = false;
  }, true);

  mobileSlider.addEventListener("change", () => showSlide(0));
  showSlide(0);
};

// Просмотр фото: вперёд, назад, Esc и клик по фону
const initLightbox = () => {
  const dialog = qs("#lightbox");
  if (!dialog) return;

  const sources = qsa("[data-slide]");
  const image = qs(".lightbox__image", dialog);
  const caption = qs(".lightbox__caption", dialog);
  const counter = qs(".lightbox__counter", dialog);
  if (!sources.length || !image || !caption || !counter) return;

  let index = 0;
  let opener = null;

  const readSource = (node) => {
    const picture = node.matches("img") ? node : qs("img", node);
    return {
      src: picture?.currentSrc || picture?.src || "",
      alt: picture?.alt || "",
      caption: node.dataset.caption || ""
    };
  };

  const show = (nextIndex) => {
    index = (nextIndex + sources.length) % sources.length;
    const item = readSource(sources[index]);
    image.src = item.src;
    image.alt = item.alt;
    caption.textContent = item.caption;
    counter.textContent = `${index + 1} / ${sources.length}`;
  };

  const open = (nextIndex, trigger) => {
    opener = trigger;
    show(nextIndex);
    if (!dialog.open) dialog.showModal();
  };

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-lightbox-index]");
    if (!trigger || dialog.contains(trigger)) return;
    open(Number(trigger.dataset.lightboxIndex), trigger);
  });

  qs(".lightbox__close", dialog)?.addEventListener("click", () => dialog.close());
  qs(".lightbox__prev", dialog)?.addEventListener("click", () => show(index - 1));
  qs(".lightbox__next", dialog)?.addEventListener("click", () => show(index + 1));

  dialog.addEventListener("click", (event) => {
    const frame = qs(".lightbox__frame", dialog);
    if (frame && !frame.contains(event.target)) dialog.close();
  });

  dialog.addEventListener("close", () => {
    image.removeAttribute("src");
    opener?.focus();
  });

  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      show(index + 1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      show(index - 1);
    }
  });
};

// Свой плеер аудиогида поверх скрытого audio
const initAudioGuide = () => {
  const player = qs("[data-audio]");
  if (!player) return;

  const audio = qs("audio", player);
  const playButton = qs(".audio-player__play", player);
  const progress = qs(".audio-player__progress", player);
  const time = qs(".audio-player__time", player);
  if (!audio || !playButton || !progress || !time) return;

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const rest = Math.floor(seconds % 60);
    return `${minutes}:${String(rest).padStart(2, "0")}`;
  };

  const renderTime = () => {
    time.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
  };

  const setPlaying = (playing) => {
    player.classList.toggle("is-playing", playing);
    playButton.textContent = playing ? "Пауза" : "Слушать";
    playButton.setAttribute("aria-pressed", String(playing));
  };

  playButton.addEventListener("click", async () => {
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        playButton.textContent = "Аудио недоступно";
      }
    } else {
      audio.pause();
    }
  });

  audio.addEventListener("play", () => setPlaying(true));
  audio.addEventListener("pause", () => setPlaying(false));
  audio.addEventListener("ended", () => {
    setPlaying(false);
    progress.value = "0";
  });

  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    progress.value = String((audio.currentTime / audio.duration) * 100);
    renderTime();
  });

  audio.addEventListener("loadedmetadata", renderTime);

  progress.addEventListener("input", () => {
    if (!audio.duration) return;
    audio.currentTime = (Number(progress.value) / 100) * audio.duration;
    renderTime();
  });
};

// Летящие силуэты: волна, параллакс мыши и прокрутки
const initFloatingFigures = () => {
  const figures = qsa("[data-float]");
  if (!figures.length || prefersReducedMotion()) return;

  let mouseX = 0;
  let mouseY = 0;
  let scrollY = 0;

  window.addEventListener("pointermove", (event) => {
    mouseX = event.clientX / window.innerWidth - 0.5;
    mouseY = event.clientY / window.innerHeight - 0.5;
  });

  window.addEventListener("scroll", () => {
    scrollY = window.scrollY;
  }, { passive: true });

  const started = performance.now();

  const tick = (now) => {
    const time = (now - started) / 1000;
    figures.forEach((figure, index) => {
      const speed = 0.45 + index * 0.12;
      const amplitude = 12 + index * 6;
      const x = Math.cos(time * speed + index) * amplitude + mouseX * (16 + index * 8);
      const y = Math.sin(time * speed * 1.3 + index) * amplitude + mouseY * 10 - scrollY * 0.04 * (index + 1);
      figure.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
};

// Правила формы: одна проверка на все поля
const formRules = {
  name: {
    check: (value) => {
      const text = value.trim();
      const letters = text.match(/\p{L}/gu) || [];
      if (letters.length < 2 || !/^[\p{L}\s-]+$/u.test(text)) {
        return "Введите имя (минимум 2 буквы)";
      }
      return "";
    }
  },
  email: {
    check: (value) => (
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
        ? ""
        : "Введите e-mail в формате name@mail.by"
    )
  },
  date: {
    check: (value) => {
      if (!value) return "Выберите дату не раньше сегодняшней";
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const chosen = new Date(`${value}T00:00:00`);
      return chosen < today ? "Выберите дату не раньше сегодняшней" : "";
    }
  },
  tour: {
    check: (value) => (value ? "" : "Выберите экскурсию")
  },
  consent: {
    check: (_value, input) => (input.checked ? "" : "Нужно согласие на обработку данных")
  }
};

// Проверить одно поле и показать текст ошибки
const validateField = (input) => {
  const rule = formRules[input.name];
  const field = input.closest(".form__field");
  const error = field ? qs(".form__error", field) : null;
  if (!rule || !field || !error) return true;

  const message = rule.check(input.type === "checkbox" ? "" : input.value, input);
  const invalid = message !== "";
  field.classList.toggle("is-invalid", invalid);
  field.classList.toggle("is-valid", !invalid);
  input.setAttribute("aria-invalid", String(invalid));
  error.textContent = message;
  return !invalid;
};

// Заявка на экскурсию никуда не уходит: сервера нет
const initForm = () => {
  const form = qs("[data-form]");
  if (!form) return;

  const inputs = qsa("input, select", form);
  const message = qs(".form__message", form);
  const dateInput = qs("[name='date']", form);

  if (dateInput) {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    dateInput.min = `${today.getFullYear()}-${month}-${day}`;
  }

  inputs.forEach((input) => {
    const refreshIfTouched = () => {
      const field = input.closest(".form__field");
      if (field?.classList.contains("is-invalid") || field?.classList.contains("is-valid")) {
        validateField(input);
      }
    };

    input.addEventListener("blur", () => validateField(input));
    input.addEventListener("input", refreshIfTouched);
    input.addEventListener("change", refreshIfTouched);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    let firstInvalid = null;

    inputs.forEach((input) => {
      const valid = validateField(input);
      if (!valid && !firstInvalid) firstInvalid = input;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      if (message) message.textContent = "";
      return;
    }

    const name = qs("[name='name']", form)?.value.trim() || "";
    const email = qs("[name='email']", form)?.value.trim() || "";
    form.reset();
    inputs.forEach((input) => {
      const field = input.closest(".form__field");
      field?.classList.remove("is-valid", "is-invalid");
      input.removeAttribute("aria-invalid");
      const error = field ? qs(".form__error", field) : null;
      if (error) error.textContent = "";
    });

    if (message) {
      message.textContent = `Спасибо, ${name}! Мы отправим подтверждение на ${email}.`;
    }
    form.classList.add("is-sent");
  });
};

// Запуск всех функций страницы
const init = () => {
  initNav();
  initHeader();
  initActiveLink();
  initReveal();
  initFlipCards();
  initTimeline();
  initSlider();
  initLightbox();
  initAudioGuide();
  initFloatingFigures();
  initForm();
};

init();
