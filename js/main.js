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
       LIGHTNING CANVAS EFFECT — High-Voltage Arc Physics
       ============================================ */
    function initLightning() {
        const cards = document.querySelectorAll('.project-card[data-lightning]');

        cards.forEach(card => {
            const canvas = card.querySelector('.lightning-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            let isHovered = false;
            let animationFrameId = null;
            const padding = 35;
            let bolts = [];

            const resizeCanvas = () => {
                canvas.width = card.clientWidth + padding * 2;
                canvas.height = card.clientHeight + padding * 2;
                bolts = [];
            };

            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);

            // Create spark elements
            const sparkPositions = [
                { top: '0', left: '20%', '--spark-x': '10px', '--spark-y': '-8px' },
                { top: '0', right: '25%', '--spark-x': '-12px', '--spark-y': '-6px' },
                { bottom: '0', left: '30%', '--spark-x': '8px', '--spark-y': '10px' },
                { bottom: '0', right: '20%', '--spark-x': '-10px', '--spark-y': '8px' },
                { top: '40%', left: '0', '--spark-x': '14px', '--spark-y': '-4px' },
                { top: '50%', right: '0', '--spark-x': '-14px', '--spark-y': '-5px' }
            ];

            sparkPositions.forEach((pos, i) => {
                const spark = document.createElement('span');
                spark.className = 'lightning-spark';
                spark.style.animationDelay = `${i * 0.4}s`;
                Object.entries(pos).forEach(([key, value]) => {
                    if (key.startsWith('--spark')) {
                        spark.style.setProperty(key, value);
                    } else {
                        spark.style[key] = value;
                    }
                });
                card.appendChild(spark);
            });

            // Midpoint Displacement for zigzag geometry
            const createSegments = (x1, y1, x2, y2, displace, depth = 0) => {
                let segments = [];
                if (displace < 3 || depth > 6) {
                    segments.push({ x1, y1, x2, y2, main: depth === 0 });
                    return segments;
                }

                const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * displace;
                const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * displace;

                segments.push(...createSegments(x1, y1, midX, midY, displace / 1.8, depth));
                segments.push(...createSegments(midX, midY, x2, y2, displace / 1.8, depth));

                // Sharp side branches (electric whiskers)
                if (depth < 2 && Math.random() < 0.45 && displace > 10) {
                    const angle = Math.atan2(y2 - y1, x2 - x1) + (Math.random() > 0.5 ? 1 : -1) * (0.4 + Math.random() * 0.7);
                    const len = displace * (0.9 + Math.random() * 1.1);
                    const bx = midX + Math.cos(angle) * len;
                    const by = midY + Math.sin(angle) * len;
                    segments.push(...createSegments(midX, midY, bx, by, displace / 2.2, depth + 1));
                }

                return segments;
            };

            // Get perimeter point by distance
            const getPerimeterPoint = (dist, w, h) => {
                const perimeter = 2 * (w + h);
                let d = ((dist % perimeter) + perimeter) % perimeter;
                if (d < w) return { x: padding + d, y: padding };
                d -= w;
                if (d < h) return { x: padding + w, y: padding + d };
                d -= h;
                if (d < w) return { x: padding + w - d, y: padding + h };
                d -= w;
                return { x: padding, y: padding + h - d };
            };

            // Spawn a new arc on a random section of the card perimeter
            const spawnBolt = () => {
                const w = canvas.width - padding * 2;
                const h = canvas.height - padding * 2;
                const perimeter = 2 * (w + h);

                const startDist = Math.random() * perimeter;
                const arcLength = 90 + Math.random() * 180;

                const p1 = getPerimeterPoint(startDist, w, h);
                const p2 = getPerimeterPoint(startDist + arcLength, w, h);

                const displace = Math.min(arcLength * 0.25, 38);

                bolts.push({
                    segments: createSegments(p1.x, p1.y, p2.x, p2.y, displace),
                    alpha: 1.0,
                    decay: 0.04 + Math.random() * 0.07
                });
            };

            const render = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Spawn arcs irregularly, like real electrical breakdowns
                if (isHovered && bolts.length < 3 && Math.random() < 0.05) {
                    spawnBolt();
                    if (Math.random() < 0.3) spawnBolt();
                }

                for (let i = bolts.length - 1; i >= 0; i--) {
                    const bolt = bolts[i];
                    ctx.save();

                    // Layer 1: Wide blue glow (ionization aura)
                    ctx.beginPath();
                    for (const seg of bolt.segments) {
                        ctx.moveTo(seg.x1, seg.y1);
                        ctx.lineTo(seg.x2, seg.y2);
                    }
                    ctx.strokeStyle = `rgba(59, 130, 246, ${bolt.alpha * 0.6})`;
                    ctx.lineWidth = 4;
                    ctx.shadowColor = '#00d4ff';
                    ctx.shadowBlur = 20;
                    ctx.stroke();

                    // Layer 2: Thin superheated white-cyan core
                    ctx.beginPath();
                    for (const seg of bolt.segments) {
                        ctx.moveTo(seg.x1, seg.y1);
                        ctx.lineTo(seg.x2, seg.y2);
                    }
                    ctx.strokeStyle = `rgba(255, 255, 255, ${bolt.alpha})`;
                    ctx.lineWidth = 1.2;
                    ctx.shadowBlur = 5;
                    ctx.stroke();

                    ctx.restore();

                    bolt.alpha -= bolt.decay;
                    if (bolt.alpha <= 0) {
                        bolts.splice(i, 1);
                    }
                }

                if (isHovered || bolts.length > 0) {
                    animationFrameId = requestAnimationFrame(render);
                } else {
                    animationFrameId = null;
                }
            };

            card.addEventListener('mouseenter', () => {
                isHovered = true;
                resizeCanvas();
                spawnBolt(); // Instant arc on hover
                if (!animationFrameId) render();
            });

            card.addEventListener('mouseleave', () => {
                isHovered = false;
            });
        });
    }

    /* ============================================
       INITIALIZATION
       ============================================ */
    function init() {
        cacheDOMElements();

        MatrixRain.init();
        ScrollProgress.init();
        ScrollAnimations.init();
        TypingEffect.init();
        initLightning();

        // Recalculate matrix on resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => MatrixRain.resize(), 150);
        });
    }

    /* ============================================
       SPOTLIGHT HOVER EFFECT
       ============================================ */
    document.querySelectorAll('.skill-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });

    /* ============================================
       AI DECODING TEXT EFFECT
       ============================================ */
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";

    document.querySelectorAll('.skill-list li').forEach(li => {
        li.dataset.value = li.innerText;
        
        li.addEventListener('mouseenter', e => {
            let iteration = 0;
            let interval = null;
            
            clearInterval(interval);
            
            interval = setInterval(() => {
                e.target.innerText = e.target.innerText
                    .split("")
                    .map((letter, index) => {
                        if(index < iteration) {
                            return e.target.dataset.value[index];
                        }
                        return letters[Math.floor(Math.random() * letters.length)];
                    })
                    .join("");
                
                if(iteration >= e.target.dataset.value.length){
                    clearInterval(interval);
                }
                iteration += 1 / 2; 
            }, 30);
        });
    });

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
