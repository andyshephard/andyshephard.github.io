/* ============================================
   Andy Shephard — Portfolio JS
   Scroll reveals, stat counters, header state, PostHog tracking
   ============================================ */

(function () {
    'use strict';

    // ----- Scroll-triggered reveals (IO fallback) -----
    if (!CSS.supports('animation-timeline', 'view()')) {
        document.documentElement.classList.add('js-reveal');

        const revealObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        revealObserver.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
        );

        document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
    }

    // ----- Animated stat counters -----
    let statsCounted = false;

    function animateCounter(el) {
        const target = parseInt(el.dataset.target, 10);
        const suffix = el.dataset.suffix || '';
        const duration = 1400;
        const start = performance.now();

        function step(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(eased * target);

            el.textContent = current + suffix;

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        }

        requestAnimationFrame(step);
    }

    const statsSection = document.getElementById('stats');
    if (statsSection) {
        const statsObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !statsCounted) {
                        statsCounted = true;
                        document.querySelectorAll('.stats__number').forEach(animateCounter);
                        statsObserver.disconnect();
                    }
                });
            },
            { threshold: 0.3 }
        );
        statsObserver.observe(statsSection);
    }

    // ----- Header scroll state -----
    const header = document.querySelector('.header');
    if (header) {
        let ticking = false;
        window.addEventListener(
            'scroll',
            () => {
                if (!ticking) {
                    requestAnimationFrame(() => {
                        header.classList.toggle('header--scrolled', window.scrollY > 40);
                        ticking = false;
                    });
                    ticking = true;
                }
            },
            { passive: true }
        );
    }

    // ----- Mobile nav toggle -----
    const toggle = document.querySelector('.header__toggle');
    if (toggle) {
        const toggleIcon = toggle.querySelector('i');

        function closeMenu() {
            header.classList.remove('header--open');
            toggle.setAttribute('aria-expanded', 'false');
            toggleIcon.className = 'fa-solid fa-bars';
        }

        toggle.addEventListener('click', () => {
            const isOpen = header.classList.toggle('header--open');
            toggle.setAttribute('aria-expanded', isOpen);
            toggleIcon.className = isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
        });

        document.querySelectorAll('.header__nav a').forEach((link) => {
            link.addEventListener('click', closeMenu);
        });
    }

    // ----- PostHog event tracking -----
    document.querySelectorAll('[data-track]').forEach((el) => {
        el.addEventListener('click', () => {
            if (window.posthog) {
                posthog.capture('cta_clicked', {
                    button: el.dataset.track,
                    section: el.closest('section')?.id || 'header',
                });
            }
        });
    });

    // Track section views — always unobserve to prevent leak if PostHog never loads
    const sectionObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    if (window.posthog) {
                        posthog.capture('section_viewed', { section: entry.target.id });
                    }
                    sectionObserver.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.25 }
    );

    document.querySelectorAll('section[id]').forEach((s) => sectionObserver.observe(s));
})();
