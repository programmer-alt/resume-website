'use strict';

/**
 * Portfolio — Main JavaScript
 * Modular pattern with IIFE to avoid global scope pollution.
 */
(function () {
    /* ============================================
       CONFIGURATION
       ============================================ */
    const CONFIG = {
        matrix: {
            fontSize: 14,
            refreshInterval: 50, // ms
            fadeAlpha: 0.05,
            resetThreshold: 0.975,
            chars: 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        },
        scroll: {
            progressBarThrottle: 100 // ms
        },
        animations: {
            typingSpeed: 80, // ms per character
            typingText: 'Frontend Developer',
            heroObserverThreshold: 0.5,
            sectionObserverThreshold: 0.1,
            sectionObserverMargin: '0px 0px -50px 0px',
            skillCardStagger: 100, // ms
            projectCardStagger: 150,
            educationCardStagger: 100,
            contactItemStagger: 100
        }
    };

    /* ============================================
       DOM CACHE
       ============================================ */
    const DOM = {};

    function cacheDOMElements() {
        DOM.matrixCanvas = document.getElementById('matrixCanvas');
        DOM.progressBar = document.createElement('div');
        DOM.heroSection = document.querySelector('.hero');
        DOM.heroTitle = document.querySelector('.hero-title');
        DOM.sections = document.querySelectorAll('.section');
        DOM.skillCards = document.querySelectorAll('.skill-card');
        DOM.projectCards = document.querySelectorAll('.project-card');
        DOM.educationCards = document.querySelectorAll('.education-card');
        DOM.contactItems = document.querySelectorAll('.contact-item');
    }

    /* ============================================
       MATRIX RAIN EFFECT
       ============================================ */
    const MatrixRain = {
        ctx: null,
        columns: 0,
        drops: [],
        lastTime: 0,
        running: true,
        animationId: null,

        init() {
            this.ctx = DOM.matrixCanvas.getContext('2d');
            this.resize();
            this.animate();
        },

        resize() {
            const canvas = DOM.matrixCanvas;
            canvas.width = canvas.parentElement.offsetWidth;
            canvas.height = canvas.parentElement.offsetHeight;
            this.columns = Math.floor(canvas.width / CONFIG.matrix.fontSize);
            this.drops = Array(this.columns).fill(1);
        },

        draw() {
            const { ctx, columns, drops } = this;
            const { fontSize, fadeAlpha, chars, resetThreshold } = CONFIG.matrix;
            const charArray = chars.split('');
            const canvas = DOM.matrixCanvas;

            ctx.fillStyle = `rgba(15, 23, 42, ${fadeAlpha})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = `rgba(59, 130, 246, 0.9)`;
            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < columns; i++) {
                const text = charArray[Math.floor(Math.random() * charArray.length)];
                const x = i * fontSize;
                const y = drops[i] * fontSize;
                
                // Чередуем акцентные цвета: яркий синий для головы, полупрозрачный для хвоста
                if (Math.random() > 0.85) {
                    ctx.fillStyle = '#8b5cf6';
                } else {
                    ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
                }
                ctx.fillText(text, x, y);

                if (drops[i] * fontSize > canvas.height && Math.random() > resetThreshold) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        },

        animate(timestamp) {
            if (!this.running) return;

            if (timestamp - this.lastTime >= CONFIG.matrix.refreshInterval) {
                this.draw();
                this.lastTime = timestamp;
            }

            this.animationId = requestAnimationFrame((ts) => this.animate(ts));
        },

        destroy() {
            this.running = false;
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
        }
    };

    /* ============================================
       SCROLL PROGRESS BAR
       ============================================ */
    const ScrollProgress = {
        throttleTimer: null,
        isActive: false,

        init() {
            DOM.progressBar.className = 'scroll-progress';
            document.body.appendChild(DOM.progressBar);
            window.addEventListener('scroll', () => this.onScroll(), { passive: true });
        },

        onScroll() {
            if (this.isActive) return;
            this.isActive = true;

            this.throttleTimer = setTimeout(() => {
                const scrollTop = window.scrollY;
                const windowHeight = window.innerHeight;
                const docHeight = document.documentElement.scrollHeight;
                const scrollPercent = (scrollTop / (docHeight - windowHeight)) * 100;

                DOM.progressBar.style.width = `${scrollPercent}%`;

                this.isActive = false;
            }, CONFIG.scroll.progressBarThrottle);
        },

        destroy() {
            if (this.throttleTimer) {
                clearTimeout(this.throttleTimer);
            }
        }
    };

    /* ============================================
       SCROLL ANIMATIONS (Intersection Observer)
       ============================================ */
    const ScrollAnimations = {
        observer: null,

        init() {
            const options = {
                threshold: CONFIG.animations.sectionObserverThreshold,
                rootMargin: CONFIG.animations.sectionObserverMargin
            };

            this.observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                        this.observer.unobserve(entry.target);
                    }
                });
            }, options);

            this.animateSections();
            this.animateWithStagger(DOM.skillCards, CONFIG.animations.skillCardStagger);
            this.animateWithStagger(DOM.projectCards, CONFIG.animations.projectCardStagger);
            this.animateWithStagger(DOM.educationCards, CONFIG.animations.educationCardStagger);
            this.animateWithStagger(DOM.contactItems, CONFIG.animations.contactItemStagger);
        },

        animateSections() {
            DOM.sections.forEach((section) => {
                // Анимация для заголовков и контента секций
                const title = section.querySelector('.section-title');
                const content = section.querySelector('.about-content');
                if (title) {
                    title.classList.add('animate-on-scroll');
                    this.observer.observe(title);
                }
                if (content) {
                    content.classList.add('animate-on-scroll');
                    this.observer.observe(content);
                }
            });
        },

        animateWithStagger(elements, staggerMs) {
            elements.forEach((el, index) => {
                el.classList.add('animate-on-scroll');
                el.style.transitionDelay = `${index * staggerMs}ms`;
                this.observer.observe(el);
            });
        }
    };

    /* ============================================
       TYPING EFFECT
       ============================================ */
    const TypingEffect = {
        active: false,
        observer: null,

        init() {
            const options = { threshold: CONFIG.animations.heroObserverThreshold };

            this.observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !this.active) {
                        this.type();
                    }
                });
            }, options);

            this.observer.observe(DOM.heroSection);
        },

        type() {
            if (this.active) return;
            this.active = true;

            const text = CONFIG.animations.typingText;
            DOM.heroTitle.textContent = '';
            let charIndex = 0;

            const typeChar = () => {
                if (charIndex < text.length) {
                    DOM.heroTitle.textContent += text.charAt(charIndex);
                    charIndex++;
                    setTimeout(typeChar, CONFIG.animations.typingSpeed);
                } else {
                    this.active = false;
                }
            };

            typeChar();
        },

        destroy() {
            if (this.observer) {
                this.observer.disconnect();
            }
        }
    };

    /* ============================================
       INITIALIZATION
       ============================================ */
    function init() {
        cacheDOMElements();

        MatrixRain.init();
        ScrollProgress.init();
        ScrollAnimations.init();
        TypingEffect.init();

        // Recalculate matrix on resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => MatrixRain.resize(), 150);
        });
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
