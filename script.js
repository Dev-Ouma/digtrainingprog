/* ============================================================
   OUK Digitisation Training Guide — behaviour
   Directorate of ICT, Open University of Kenya

   1.  Boot & motion preference
   2.  AOS scroll animations
   3.  Theme toggle (light / dark)
   4.  Reading progress bar
   4b. Sticky header (always visible)
   5.  Session progress tracker + active nav
   6.  Animated counters
   7.  Practice checklist + completion ring
   8.  Flip cards (tap and keyboard)
   8b. Module anatomy stack
   9.  Scroll text reveal (word-by-word headings, staggered lists)
   10. Back to top
   11. Smooth scrolling & mobile menu close
   12. Footer year
   13. Site search
   14. Cookie notice
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 1. BOOT ------------------------------------- */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // shared with initAnatomy (8b) and initSearch (13): the anatomy panel
  // only ever renders one part's markup at a time, so search needs its
  // own copy of the other parts' text, plus a way to select one.
  const anatomyParts = {
    1:  { title: 'Module banner and title',
          body: 'The course code, module title and short description sit at the top of every published module. This is also where students first see who built it and how long it takes.',
          built: 'Course settings and Label',
          meta: true },
    2:  { title: 'Module Overview',
          body: 'A plain-language map of the whole module: what it covers, why it matters, and how the weeks hang together. Students should finish this block knowing what sits ahead of them.',
          built: 'Page or Label' },
    3:  { title: 'Learning Outcomes',
          body: 'Three to five action statements of what the student will be able to do by the end. Every later activity — work to do, quiz, reflection — has to serve one of them.',
          built: 'Page or Label, using the template heading style' },
    4:  { title: 'Work to Do',
          body: 'The concrete tasks for this section: readings to complete, exercises to attempt, files to prepare. Write them as instructions a student can follow without asking you.',
          built: 'Page, Assignment or Checklist' },
    5:  { title: 'Learning Materials',
          body: 'A short framing block that bridges the task list into the content itself — videos, readings and resources curated to build the foundation students need before the interactive and assessment blocks that follow.',
          built: 'Label or Page, styled as an intro callout' },
    6:  { title: 'Interactive Content (H5P)',
          body: 'An H5P activity embedded directly in the page and tracked to completion — a branching scenario, a drag-and-drop, or an interactive video with built-in checks. This is where reading turns into doing.',
          built: 'H5P Interactive Content, set to track completion' },
    7:  { title: 'Test Your Knowledge',
          body: 'A short auto-marked quiz that checks understanding before the student moves on to graded work. State the time required so students can plan the session around it.',
          built: 'Quiz activity, linked to a question bank category' },
    8:  { title: 'Apply What You’ve Learned',
          body: 'The graded assignment: an explicit accepted file type, step-by-step submission instructions, and a realistic time estimate — including how to replace a submission, not just how to make one.',
          built: 'Assignment activity, with submission steps in the description' },
    9:  { title: 'Go Further! Additional Resources',
          body: 'Optional extension reading for students who want to go beyond the module, properly cited with stable links or DOIs. Set apart visually so it never reads as required work.',
          built: 'Label or Page, in the ‘Go Further’ callout style' },
    10: { title: 'What’s Next!',
          body: 'The closing hand-off: a one-line preview of what the next module covers and why it follows this one. Every module ends on a clear next step, never a dead end.',
          built: 'Label or Page, in the ‘What’s Next’ callout style' }
  };
  const anatomyPartCount = Object.keys(anatomyParts).length;
  let showAnatomyPart = null;   // wired up by initAnatomy once its show() exists

  document.addEventListener('DOMContentLoaded', init);

  function init () {
    initAOS();
    initTheme();
    initReadingProgress();
    initHeaderScroll();
    initSessionProgress();
    initCounters();
    initChecklist();
    initFlipCards();
    initAnatomy();
    initTextReveal();
    initBackToTop();
    initNavBehaviour();
    initSearch();
    initCookieBanner();
    $('#year').textContent = new Date().getFullYear();
  }

  /* ---------- 2. AOS -------------------------------------- */
  function initAOS () {
    if (typeof AOS === 'undefined') return;
    AOS.init({
      duration: reduceMotion ? 0 : 750,
      easing: 'ease-out-cubic',
      once: true,
      offset: 90,
      disable: reduceMotion
    });
  }

  /* ---------- 3. THEME TOGGLE ----------------------------- *
   * Remembers the choice where storage is available, follows the
   * operating system otherwise, and wipes between the two themes
   * in a circle centred on the switch. */
  function initTheme () {
    const btn  = $('#themeToggle');
    const root = document.documentElement;
    if (!btn) return;

    let memory = null;                       // fallback when storage is blocked

    const stored = read();
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    apply(stored || (prefersDark ? 'dark' : 'light'));

    btn.addEventListener('click', e => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';

      // centre the wipe on the switch that was clicked
      const box = btn.getBoundingClientRect();
      root.style.setProperty('--tx', ((box.left + box.width / 2) / window.innerWidth * 100) + '%');
      root.style.setProperty('--ty', ((box.top + box.height / 2) / window.innerHeight * 100) + '%');

      if (document.startViewTransition && !reduceMotion) {
        document.startViewTransition(() => apply(next));
      } else {
        apply(next);
      }
      write(next);
    });

    // follow the system if the reader has not chosen for themselves
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ev => {
      if (!read()) apply(ev.matches ? 'dark' : 'light');
    });

    function apply (mode) {
      root.setAttribute('data-theme', mode);
      root.style.colorScheme = mode;         // native controls follow suit
      const dark = mode === 'dark';
      btn.setAttribute('aria-checked', String(dark));
      btn.setAttribute('aria-label', dark ? 'Dark mode, on' : 'Dark mode, off');
      const label = $('#themeLabel');
      if (label) label.textContent = dark ? 'Dark' : 'Light';
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', dark ? '#0E1719' : '#037B90');
    }

    function read () {
      try { return localStorage.getItem('ouk-theme'); } catch (e) { return memory; }
    }
    function write (mode) {
      memory = mode;
      try { localStorage.setItem('ouk-theme', mode); } catch (e) { /* session only */ }
    }
  }

  /* ---------- 4. READING PROGRESS ------------------------- */
  function initReadingProgress () {
    const bar   = $('#readBar');
    const track = $('.read-progress');
    if (!bar) return;

    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
      bar.style.width = pct + '%';
      track.setAttribute('aria-valuenow', Math.round(pct));
    };
    window.addEventListener('scroll', throttle(update, 40), { passive: true });
    update();
  }

  /* ---------- 4b. STICKY HEADER --------------------------- *
   * Keep the bar pinned for the whole scroll. Animate a denser
   * "stuck" state — never slide it off-screen. Also keep
   * --header-h in sync so in-page jumps clear the chrome. */
  function initHeaderScroll () {
    const header = $('#siteHeader');
    if (!header) return;

    const syncHeight = () => {
      const h = Math.ceil(header.getBoundingClientRect().height);
      if (h > 0) document.documentElement.style.setProperty('--header-h', h + 'px');
    };

    const update = () => {
      const stuck = window.scrollY > 8;
      header.classList.toggle('is-stuck', stuck);
      // hard guarantee: never hide on scroll
      header.style.transform = 'translate3d(0,0,0)';
      header.style.visibility = 'visible';
      header.hidden = false;
    };

    window.addEventListener('scroll', throttle(update, 16), { passive: true });
    window.addEventListener('resize', throttle(syncHeight, 120));
    if ('ResizeObserver' in window) {
      new ResizeObserver(() => syncHeight()).observe(header);
    }

    syncHeight();
    update();
  }

  /* ---------- 5. SESSION PROGRESS ------------------------- */
  function initSessionProgress () {
    const sessions = $$('.session');
    const nodes    = $$('#progressNodes li');
    const fill     = $('#sessionFill');
    const curEl    = $('#progressCurrent');
    const nameEl   = $('#progressName');
    const navLinks = $$('.navbar-nav .nav-link');
    if (!sessions.length || !nodes.length) return;

    // clicking a node jumps to that session
    nodes.forEach(node => {
      const target = node.getAttribute('data-target');
      node.querySelector('span').addEventListener('click', () => {
        const el = $(target);
        if (el) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      });
      node.querySelector('span').setAttribute('tabindex', '0');
      node.querySelector('span').addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.target.click(); }
      });
    });

    const update = () => {
      // which session is currently in view
      const marker = window.scrollY + window.innerHeight * 0.35;
      let index = 0;
      sessions.forEach((sec, i) => { if (sec.offsetTop <= marker) index = i; });

      const active = sessions[index];
      nodes.forEach((n, i) => {
        n.classList.toggle('is-active', i === index);
        n.classList.toggle('is-done', i < index);
      });
      fill.style.width = (index / (nodes.length - 1)) * 100 + '%';
      curEl.textContent  = index + 1;
      nameEl.textContent = active.getAttribute('data-session') || '';

      // highlight the matching main-nav item
      const id = active.id;
      navLinks.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === '#' + id);
      });
    };

    window.addEventListener('scroll', throttle(update, 90), { passive: true });
    window.addEventListener('resize', throttle(update, 200));
    update();
  }

  /* ---------- 6. ANIMATED COUNTERS ------------------------ */
  function initCounters () {
    const counters = $$('[data-count]');
    if (!counters.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      counters.forEach(el => { el.textContent = el.dataset.count + (el.dataset.suffix || ''); });
      return;
    }

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        countUp(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.4 });

    counters.forEach(el => io.observe(el));

    function countUp (el) {
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const start  = performance.now();
      const dur    = 1300;

      (function step (now) {
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - t, 3);        // ease-out cubic
        el.textContent = Math.round(target * eased) + (t === 1 ? suffix : '');
        if (t < 1) requestAnimationFrame(step);
      })(start);
    }
  }

  /* ---------- 7. CHECKLIST + RING ------------------------- */
  function initChecklist () {
    const tasks = $$('.task');
    const ring  = $('#ringFg');
    const pct   = $('#taskPct');
    const done  = $('#taskDone');
    const reset = $('#resetTasks');
    if (!tasks.length || !ring) return;

    const CIRCUMFERENCE = 327;   // 2 * PI * r, r = 52

    const update = () => {
      const complete = tasks.filter(t => t.checked).length;
      const ratio    = complete / tasks.length;
      ring.style.strokeDashoffset = CIRCUMFERENCE * (1 - ratio);
      ring.style.stroke = ratio === 1
        ? 'var(--gold)'
        : 'var(--teal)';
      pct.textContent  = Math.round(ratio * 100) + '%';
      done.textContent = complete;
    };

    tasks.forEach(t => t.addEventListener('change', update));
    if (reset) reset.addEventListener('click', () => {
      tasks.forEach(t => { t.checked = false; });
      update();
    });
    update();
  }

  /* ---------- 8. FLIP CARDS ------------------------------- *
   * Hover handles the desktop; tap and Enter handle the rest. */
  function initFlipCards () {
    $$('.flip').forEach(card => {
      const toggle = () => card.classList.toggle('is-flipped');
      card.addEventListener('click', toggle);
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    });
  }

  /* ---------- 8b. MODULE ANATOMY -------------------------- *
   * Stack rows and the dots below both drive the same explanation
   * panel. Arrow keys step through every part of the module. */
  function initAnatomy () {
    const parts = anatomyParts;
    const total = anatomyPartCount;

    const detail = $('#partDetail');
    const rows   = $$('.anatomy-stack__row');
    const dots   = $$('#partDots button');
    if (!detail || !rows.length) return;

    let current = 1;

    function show (n) {
      const part = parts[n];
      if (!part) return;
      current = n;

      let metaHtml = '';
      if (part.meta) {
        metaHtml =
          '<dl class="anatomy__meta">' +
            '<div><dt>Module Developer</dt><dd>Your name here</dd></div>' +
            '<div><dt>Instructional Hours</dt><dd>X hours</dd></div>' +
          '</dl>';
      }

      detail.innerHTML =
        '<p class="anatomy__num">Part ' + String(n).padStart(2, '0') + ' of ' + String(total).padStart(2, '0') + '</p>' +
        '<h3 class="anatomy__title">' + part.title + '</h3>' +
        metaHtml +
        '<p class="anatomy__body">' + part.body + '</p>' +
        '<p class="anatomy__built">Built with: <b>' + part.built + '</b></p>';

      // restart the swap animation on each change
      detail.classList.remove('is-swapping');
      void detail.offsetWidth;
      detail.classList.add('is-swapping');

      rows.forEach(row => row.classList.toggle('is-active', row.dataset.part === String(n)));
      dots.forEach(b => b.classList.toggle('is-active', b.dataset.part === String(n)));
    }
    showAnatomyPart = show;

    rows.forEach(row => {
      row.addEventListener('click', () => show(Number(row.dataset.part)));
      row.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(Number(row.dataset.part)); }
        if (e.key === 'ArrowDown') { e.preventDefault(); show(current === total ? 1 : current + 1); }
        if (e.key === 'ArrowUp')   { e.preventDefault(); show(current === 1 ? total : current - 1); }
      });
    });

    dots.forEach(b => {
      b.addEventListener('click', () => show(Number(b.dataset.part)));
      b.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight') { e.preventDefault(); show(current === total ? 1 : current + 1); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); show(current === 1 ? total : current - 1); }
      });
    });

    show(1);
    initAnatomyPath(rows);
  }

  /* Linked-pathway reveal: each block falls into place as the rail
   * draws down to meet it. Armed from script so the stack stays fully
   * readable when JavaScript never runs; the classes are dropped again
   * once the last block lands, handing the rail back to :hover and
   * .is-active, whose transforms would otherwise lose to the animation. */
  function initAnatomyPath (rows) {
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    const stack = $('.anatomy-stack');
    if (!stack || !rows.length) return;

    rows.forEach((row, i) => row.style.setProperty('--i', i));
    stack.classList.add('is-armed');

    const settle = rows.length * 95 + 700;
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        stack.classList.add('is-revealed');
        obs.disconnect();
        setTimeout(() => {
          stack.classList.remove('is-armed', 'is-revealed');
          rows.forEach(row => row.style.removeProperty('--i'));
        }, settle);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    io.observe(stack);
  }

  /* ---------- 9. SCROLL TEXT REVEAL ----------------------- *
   * Headings are split into words that rise as the heading comes
   * into view; lists, chips and step cards follow in a short
   * stagger; leads lift out of a soft blur. Everything is applied
   * by script, so with JavaScript off the text simply sits there. */
  function initTextReveal () {
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    // headings that get the word-by-word treatment
    const headings = $$([
      '.hero__title',
      '.section-head h2',
      '.session__title',
      '.banner p',
      '.closing h3',
      '.block-title'
    ].join(','));

    headings.forEach(el => {
      splitWords(el);
      el.classList.add('js-split');
      if (el.matches('.section-head h2, .closing h3')) el.classList.add('has-rule');
    });

    // groups whose children rise one after another
    $$([
      '.objectives ul',
      '.takeaways ul',
      '.chiplist',
      '.steps__list',
      '.checklist__items',
      '.footer__links'
    ].join(',')).forEach(el => el.classList.add('stagger-in'));

    // leading paragraphs
    $$('.hero__lead, .session__lead, .section-head__sub, .closing p')
      .forEach(el => el.classList.add('lift-in'));

    const watched = $$('.js-split, .stagger-in, .lift-in');
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        obs.unobserve(entry.target);          // reveal once, then stop watching
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

    watched.forEach(el => io.observe(el));

    /* Wrap every word in its own span while leaving icons, <br>
       and nested spans such as .grad-text intact. */
    function splitWords (el) {
      let i = 0;

      (function walk (node) {
        Array.from(node.childNodes).forEach(child => {

          if (child.nodeType === Node.TEXT_NODE) {
            const words = child.textContent.split(/(\s+)/);
            if (!child.textContent.trim()) return;
            const frag = document.createDocumentFragment();
            words.forEach(word => {
              if (!word.trim()) { frag.appendChild(document.createTextNode(word)); return; }
              const span = document.createElement('span');
              span.className = 'reveal-word';
              span.style.setProperty('--i', i++);
              span.textContent = word;
              frag.appendChild(span);
            });
            node.replaceChild(frag, child);
            return;
          }

          if (child.nodeType !== Node.ELEMENT_NODE) return;

          // leave icons, images and gradient-clipped text alone; recurse through inline wrappers
          const tag = child.tagName.toLowerCase();
          if (tag === 'i' || tag === 'svg' || tag === 'img' || tag === 'br') return;
          if (child.classList.contains('grad-text')) return;
          walk(child);
        });
      })(el);
    }
  }

  /* ---------- 10. BACK TO TOP ------------------------------ */
  function initBackToTop () {
    const btn = $('#toTop');
    if (!btn) return;
    window.addEventListener('scroll', throttle(() => {
      btn.classList.toggle('is-visible', window.scrollY > 620);
    }, 120), { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- 11. NAV BEHAVIOUR --------------------------- */
  function initNavBehaviour () {
    const collapse = $('#mainNav');

    // close the mobile menu after a jump
    $$('#mainNav a').forEach(link => {
      link.addEventListener('click', () => {
        if (collapse.classList.contains('show') && window.bootstrap) {
          window.bootstrap.Collapse.getOrCreateInstance(collapse).hide();
        }
      });
    });

    // smooth scroll with the sticky header allowed for
    $$('a[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        const id = link.getAttribute('href');
        if (id === '#' || id.length < 2) return;
        const target = $(id);
        if (!target) return;
        e.preventDefault();
        const offset = parseInt(
          getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) || 112;
        window.scrollTo({
          top: target.getBoundingClientRect().top + window.scrollY - offset + 4,
          behavior: reduceMotion ? 'auto' : 'smooth'
        });
      });
    });
  }

  /* ---------- 13. SITE SEARCH ------------------------------ *
   * System-wide command overlay over every heading, list item,
   * FAQ, common-mistake answer, programme highlight, and the
   * module-anatomy parts that only exist in the DOM once a
   * reader clicks a hotspot. Index is built once on first open. */
  function initSearch () {
    const trigger = $('#searchTrigger');
    const overlay = $('#searchOverlay');
    if (!trigger || !overlay) return;

    const input   = $('#searchInput', overlay);
    const list    = $('#searchResults', overlay);
    const empty   = $('#searchEmpty', overlay);
    const suggest = $('#searchSuggest', overlay);
    const isMac   = /Mac|iPhone|iPad|iPod/.test(navigator.platform || '') ||
                    /Mac/.test(navigator.userAgent || '');

    // show Ctrl on Windows/Linux, ⌘ on Apple
    const modLabel = isMac ? '⌘' : 'Ctrl';
    $$('.search-trigger__kbd kbd', trigger).forEach((kbd, i) => {
      if (i === 0) kbd.textContent = modLabel;
      if (i === 1) kbd.textContent = 'K';
    });
    $$('.search-overlay__hint kbd', overlay).forEach(kbd => {
      if (kbd.textContent === '⌘') kbd.textContent = modLabel;
    });

    let index        = null;
    let results      = [];
    let activeIndex  = -1;
    let currentQuery = '';
    let lastFocus    = null;

    const cleanText = node => node.textContent.replace(/\s+/g, ' ').trim();
    const uniq = list => { const out = []; list.forEach(v => { if (v && !out.includes(v)) out.push(v); }); return out; };
    const escapeHtml = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const escapeRegExp = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const TYPE_LABEL = {
      heading: 'Heading', text: 'Content', accordion: 'FAQ',
      anatomy: 'Anatomy', session: 'Session', highlight: 'Highlight',
      takeaway: 'Takeaway', roadmap: 'Roadmap'
    };

    function highlight (text, query) {
      const safe = escapeHtml(text);
      if (!query) return safe;
      const tokens = uniq(query.trim().split(/\s+/).filter(t => t.length > 1));
      if (!tokens.length) {
        return safe.replace(new RegExp(escapeRegExp(query.trim()), 'gi'), m => '<mark>' + m + '</mark>');
      }
      const pattern = tokens.map(escapeRegExp).sort((a, b) => b.length - a.length).join('|');
      return safe.replace(new RegExp('(' + pattern + ')', 'gi'), '<mark>$1</mark>');
    }

    function truncateAround (text, query, radius) {
      if (text.length <= 170) return text;
      const q = query.trim().toLowerCase();
      let idx = text.toLowerCase().indexOf(q);
      if (idx === -1) {
        const first = q.split(/\s+/).find(t => t.length > 1);
        idx = first ? text.toLowerCase().indexOf(first) : -1;
      }
      if (idx === -1) return text.slice(0, 170) + '…';
      const start = Math.max(0, idx - radius);
      const end   = Math.min(text.length, idx + Math.max(q.length, 12) + radius);
      return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
    }

    function sessionCrumb (el) {
      const session = el && el.closest && el.closest('section.session[id]');
      if (!session) return '';
      const title = cleanText($('.session__title', session) || document.createTextNode(''));
      const no = (session.id || '').replace('session-', '') || '';
      return title ? ('Session ' + no + ' · ' + title.replace(/^Session\s*\d+\s*/i, '').trim()) : session.id;
    }

    function classifyNode (node) {
      if (node.closest('.programme-highlights') || node.closest('.timeline__outcome')) return 'highlight';
      if (node.closest('.takeaways')) return 'takeaway';
      if (node.closest('.timeline')) return 'roadmap';
      if (node.closest('section.session')) return 'session';
      if (node.closest('#faq')) return 'accordion';
      return null;
    }

    /* -- build the index once, from the live DOM ------------- */
    function buildIndex () {
      const records = [];
      const main = $('main');
      if (!main) return records;

      $$('.timeline__card', main).forEach(card => {
        const title = cleanText($('h3', card) || document.createTextNode(''));
        const body  = cleanText($('p', card) || document.createTextNode(''));
        const outcome = cleanText($('.timeline__outcome', card) || document.createTextNode(''));
        records.push({
          type: outcome ? 'highlight' : 'roadmap',
          label: title,
          breadcrumb: 'Training roadmap',
          snippet: [body, outcome].filter(Boolean).join(' — '),
          el: card
        });
      });

      $$('.accordion-item', main).forEach(item => {
        const btn  = $('.accordion-button', item);
        const body = $('.accordion-body', item);
        if (!btn || !body) return;
        const section   = item.closest('section[id]');
        const sectionH2 = section ? cleanText($('h2', section) || document.createTextNode('')) : '';
        let crumb = sectionH2;
        let sib = item.closest('.accordion') && item.closest('.accordion').previousElementSibling;
        while (sib) {
          if (/^H[234]$/.test(sib.tagName) && !sib.classList.contains('accordion-header')) {
            const t = cleanText(sib);
            if (t && t !== sectionH2) crumb = sectionH2 ? sectionH2 + ' · ' + t : t;
            break;
          }
          sib = sib.previousElementSibling;
        }
        records.push({
          type: section && section.id === 'faq' ? 'accordion' : 'accordion',
          label: cleanText(btn), breadcrumb: crumb, snippet: cleanText(body), el: btn
        });
      });

      // full anatomy catalogue (stack rows are buttons, so their
      // labels are skipped by the text walk below)
      Object.keys(anatomyParts).forEach(n => {
        const part = anatomyParts[n];
        const snippet = part.meta
          ? part.body + ' Module Developer: Your name here. Instructional Hours: X hours.'
          : part.body;
        records.push({
          type: 'anatomy', partNum: Number(n), label: part.title,
          breadcrumb: 'Anatomy of a digitised module · Part ' + String(n).padStart(2, '0'),
          snippet: snippet, el: null
        });
      });

      let sectionLabel = '', h2 = '', h3 = '', h4 = '';
      const walker = document.createTreeWalker(main, NodeFilter.SHOW_ELEMENT, {
        acceptNode (node) {
          return (node.tagName === 'SCRIPT' || node.tagName === 'STYLE')
            ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
        }
      });

      let node;
      while ((node = walker.nextNode())) {
        const tag = node.tagName;

        if (tag === 'SECTION' && node.id) { sectionLabel = ''; h2 = ''; h3 = ''; h4 = ''; }
        if ((tag === 'H2' || tag === 'H3' || tag === 'H4') && node.classList.contains('accordion-header')) continue;

        if (tag === 'H2' || tag === 'H3' || tag === 'H4') {
          const text = cleanText(node);
          if (!text) continue;
          const crumbParts = tag === 'H2' ? [] :
            tag === 'H3' ? uniq([sectionLabel, h2]) :
            uniq([sectionLabel, h2, h3]);
          const kind = classifyNode(node) || 'heading';
          records.push({
            type: kind === 'highlight' || kind === 'session' || kind === 'roadmap' ? kind : 'heading',
            label: text,
            breadcrumb: crumbParts.join(' · ') || sessionCrumb(node),
            el: node
          });
          if (tag === 'H2') { h2 = text; h3 = ''; h4 = ''; sectionLabel = sectionLabel || text; }
          if (tag === 'H3') { h3 = text; h4 = ''; }
          if (tag === 'H4') { h4 = text; }
          continue;
        }

        if (tag === 'P' || tag === 'LI') {
          if (node.closest('.accordion-body') || node.closest('button') || node.closest('a.timeline__card')) continue;
          const text = cleanText(node);
          if (text.length < 8) continue;
          const levels = uniq([sectionLabel, h2, h3, h4]);
          const kind = classifyNode(node) || 'text';
          records.push({
            type: kind,
            label: levels[levels.length - 1] || text.slice(0, 60),
            breadcrumb: levels.slice(0, -1).join(' · ') || sessionCrumb(node),
            snippet: text, el: node
          });
        }
      }
      return records;
    }

    /* -- filter + rank -------------------------------------- */
    function search (query) {
      const q = query.trim().toLowerCase();
      if (!q) return [];
      const tokens = q.split(/\s+/).filter(Boolean);
      const scored = [];

      index.forEach(rec => {
        const labelLower = rec.label.toLowerCase();
        const hay = (labelLower + ' ' + (rec.snippet || '') + ' ' + (rec.breadcrumb || '')).toLowerCase();
        if (!tokens.every(t => hay.includes(t))) return;

        let score;
        const phraseIdx = labelLower.indexOf(q);
        if (phraseIdx !== -1) {
          score = phraseIdx;
        } else if (tokens.every(t => labelLower.includes(t))) {
          score = 40 + labelLower.indexOf(tokens[0]);
        } else {
          const snip = (rec.snippet || '').toLowerCase();
          const idx = snip.indexOf(q);
          score = 280 + (idx === -1 ? 80 + snip.indexOf(tokens[0]) : idx);
        }

        if (rec.type === 'text') score += 55;
        if (rec.type === 'highlight') score -= 25;
        if (rec.type === 'session' || rec.type === 'takeaway') score -= 10;
        if (rec.type === 'heading' || rec.type === 'roadmap') score -= 5;
        scored.push({ rec, score });
      });

      scored.sort((a, b) => a.score - b.score);
      return scored.slice(0, 12).map(s => s.rec);
    }

    /* -- render ----------------------------------------------- */
    function render () {
      list.innerHTML = '';
      results.forEach((r, i) => {
        const li  = document.createElement('li');
        li.setAttribute('role', 'option');
        li.id = 'searchResult' + i;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'search-overlay__item' + (i === activeIndex ? ' is-active' : '');
        const typeKey = r.type === 'accordion' ? 'faq' : r.type;
        const typeClass = 'search-overlay__type search-overlay__type--' + typeKey;
        btn.innerHTML =
          '<span class="search-overlay__meta">' +
            '<span class="' + typeClass + '">' + escapeHtml(TYPE_LABEL[r.type] || 'Match') + '</span>' +
            (r.breadcrumb ? '<span class="search-overlay__crumb">' + escapeHtml(r.breadcrumb) + '</span>' : '') +
          '</span>' +
          '<span class="search-overlay__title">' + highlight(r.label, currentQuery) + '</span>' +
          (r.snippet ? '<span class="search-overlay__snippet">' + highlight(truncateAround(r.snippet, currentQuery, 70), currentQuery) + '</span>' : '');
        btn.addEventListener('click', () => selectResult(r));
        li.appendChild(btn);
        list.appendChild(li);
      });

      const hasQuery = currentQuery.length > 0;
      if (suggest) suggest.hidden = hasQuery;
      empty.hidden = !(hasQuery && results.length === 0);
      input.setAttribute('aria-expanded', results.length ? 'true' : 'false');
      input.setAttribute('aria-activedescendant', activeIndex > -1 ? 'searchResult' + activeIndex : '');
      if (activeIndex > -1) {
        const activeEl = $('#searchResult' + activeIndex, list);
        if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
      }
    }

    /* -- jump to a result on the page ------------------------- */
    function markInline (el, query) {
      if (!query || !el || el.querySelector('input,button,select,textarea')) return;
      const tokens = uniq(query.trim().split(/\s+/).filter(t => t.length > 1));
      const phrases = tokens.length ? tokens : [query.trim()];
      if (!phrases.length) return;

      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const hits = [];
      let n;
      while ((n = walker.nextNode())) {
        const lower = n.nodeValue.toLowerCase();
        if (phrases.some(p => lower.includes(p.toLowerCase()))) hits.push(n);
      }

      hits.forEach(textNode => {
        const val = textNode.nodeValue;
        const lower = val.toLowerCase();
        let best = null;
        phrases.forEach(p => {
          const idx = lower.indexOf(p.toLowerCase());
          if (idx !== -1 && (!best || p.length > best.len)) best = { idx, len: p.length };
        });
        if (!best) return;
        const mark = document.createElement('mark');
        mark.className = 'search-flash-mark';
        mark.textContent = val.slice(best.idx, best.idx + best.len);
        const frag = document.createDocumentFragment();
        if (best.idx > 0) frag.appendChild(document.createTextNode(val.slice(0, best.idx)));
        frag.appendChild(mark);
        if (best.idx + best.len < val.length) frag.appendChild(document.createTextNode(val.slice(best.idx + best.len)));
        textNode.replaceWith(frag);
      });

      if (hits.length) {
        setTimeout(() => {
          el.querySelectorAll('mark.search-flash-mark').forEach(m => m.replaceWith(document.createTextNode(m.textContent)));
          el.normalize();
        }, 2200);
      }
    }

    function jumpTo (el, query) {
      if (!el) return;
      const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) || 112;
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - offset + 4,
        behavior: reduceMotion ? 'auto' : 'smooth'
      });
      el.classList.remove('search-hit-flash');
      void el.offsetWidth;
      el.classList.add('search-hit-flash');
      markInline(el, query);
      setTimeout(() => el.classList.remove('search-hit-flash'), 2200);
    }

    function selectResult (rec) {
      closeOverlay();

      if (rec.type === 'anatomy') {
        if (showAnatomyPart) showAnatomyPart(rec.partNum);
        const panel = $('#partDetail');
        setTimeout(() => { jumpTo(panel, currentQuery); }, 30);
        return;
      }

      const flipCard = rec.el && rec.el.closest && rec.el.closest('.flip');
      if (flipCard) flipCard.classList.add('is-flipped');

      if (rec.type === 'accordion' && window.bootstrap && rec.el) {
        const pane = $(rec.el.getAttribute('data-bs-target'));
        if (pane && !pane.classList.contains('show')) {
          window.bootstrap.Collapse.getOrCreateInstance(pane, { toggle: false }).show();
        }
        const body = pane && $('.accordion-body', pane);
        if (body) markInline(body, currentQuery);
      }

      jumpTo(rec.el, currentQuery);
    }

    function runQuery (q) {
      currentQuery = (q || '').trim();
      input.value = currentQuery;
      results = search(currentQuery);
      activeIndex = results.length ? 0 : -1;
      render();
    }

    /* -- overlay open / close / keyboard ---------------------- */
    function onOverlayKeydown (e) {
      if (e.key === 'Escape') closeOverlay();
    }

    function openOverlay () {
      if (!index) index = buildIndex();
      lastFocus = document.activeElement;
      overlay.hidden = false;
      document.body.style.overflow = 'hidden';
      input.value = '';
      currentQuery = '';
      results = [];
      activeIndex = -1;
      render();
      requestAnimationFrame(() => input.focus());
      document.addEventListener('keydown', onOverlayKeydown);
    }

    function closeOverlay () {
      overlay.hidden = true;
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onOverlayKeydown);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    trigger.addEventListener('click', openOverlay);
    $$('[data-search-close]', overlay).forEach(el => el.addEventListener('click', closeOverlay));
    $$('.search-chip', overlay).forEach(chip => {
      chip.addEventListener('click', () => {
        runQuery(chip.getAttribute('data-query') || chip.textContent);
        input.focus();
      });
    });

    input.addEventListener('input', () => runQuery(input.value));

    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (results.length) { activeIndex = (activeIndex + 1) % results.length; render(); }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (results.length) { activeIndex = (activeIndex - 1 + results.length) % results.length; render(); }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex > -1) selectResult(results[activeIndex]);
      }
    });

    // "/" and Cmd/Ctrl+K open search from anywhere (unless already typing)
    document.addEventListener('keydown', e => {
      const active = document.activeElement;
      const tag = active && active.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || (active && active.isContentEditable);

      const isOpenShortcut = e.key === '/' ||
        ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey));

      if (!isOpenShortcut) return;
      if (!overlay.hidden) return;
      if (typing && e.key === '/') return;
      e.preventDefault();
      openOverlay();
    });
  }

  /* ---------- 14. COOKIE NOTICE --------------------------- *
   * Soft bottom banner on first visit. Choice is remembered in
   * localStorage (ouk-cookie-consent) so it does not reappear. */
  function initCookieBanner () {
    const banner = $('#cookieBanner');
    if (!banner) return;

    const KEY = 'ouk-cookie-consent';
    let stored = null;
    try { stored = localStorage.getItem(KEY); } catch (e) { stored = null; }
    if (stored === 'accepted' || stored === 'essential') return;

    const show = () => {
      banner.hidden = false;
      document.body.classList.add('has-cookie-banner');
      requestAnimationFrame(() => banner.classList.add('is-visible'));
      const primary = $('[data-cookie="accept"]', banner);
      if (primary) primary.focus({ preventScroll: true });
    };

    const hide = (choice) => {
      try { localStorage.setItem(KEY, choice); } catch (e) { /* session only */ }
      banner.classList.remove('is-visible');
      banner.classList.add('is-leaving');
      document.body.classList.remove('has-cookie-banner');
      setTimeout(() => {
        banner.hidden = true;
        banner.classList.remove('is-leaving');
      }, reduceMotion ? 0 : 420);
    };

    $$('[data-cookie]', banner).forEach(btn => {
      btn.addEventListener('click', () => hide(btn.getAttribute('data-cookie') === 'essential' ? 'essential' : 'accepted'));
    });

    // slight delay so the page paints first, then the banner rises
    setTimeout(show, reduceMotion ? 0 : 700);
  }

  /* ---------- UTILITY ------------------------------------- */
  function throttle (fn, wait) {
    let last = 0, queued = null;
    return function (...args) {
      const now = Date.now();
      if (now - last >= wait) { last = now; fn.apply(this, args); }
      else {
        clearTimeout(queued);
        queued = setTimeout(() => { last = Date.now(); fn.apply(this, args); }, wait);
      }
    };
  }
})();
