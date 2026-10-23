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
            
            let isHovered = false;
            let animationFrameId = null;
            const padding = 35;
            let bolts = [];

            const resizeCanvas = () => {
                canvas.width = card.clientWidth + padding * 2;
                canvas.height = card.clientHeight + padding * 2;
            };

            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);

            // Генерация геометрии молнии
            const createSegments = (x1, y1, x2, y2, displace, depth = 0) => {
                let segments = [];
                if (displace < 3 || depth > 6) {
                    segments.push({ x1, y1, x2, y2 });
                    return segments;
                }

                const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * displace;
                const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * displace;

                segments.push(...createSegments(x1, y1, midX, midY, displace / 1.8, depth));
                segments.push(...createSegments(midX, midY, x2, y2, displace / 1.8, depth));

                // Боковые отростки
                if (depth < 2 && Math.random() < 0.45 && displace > 10) {
                    const angle = Math.atan2(y2 - y1, x2 - x1) + (Math.random() > 0.5 ? 1 : -1) * (0.4 + Math.random() * 0.7);
                    const len = displace * (0.9 + Math.random() * 1.1);
                    const bx = midX + Math.cos(angle) * len;
                    const by = midY + Math.sin(angle) * len;
                    segments.push(...createSegments(midX, midY, bx, by, displace / 2.2, depth + 1));
                }

                return segments;
            };

            // Координаты периметра рамки
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

            // Спавн нового разряда
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
                    p1,
                    p2,
                    arcLength,
                    alpha: 1.0,
                    decay: 0.04 + Math.random() * 0.07
                });
            };

            const render = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                if (isHovered && bolts.length < 3 && Math.random() < 0.01) {
                    spawnBolt();
                    if (Math.random() < 0.3) spawnBolt();
                }

                for (let i = bolts.length - 1; i >= 0; i--) {
                    const bolt = bolts[i];
                    ctx.save();

                    // 1. НАГРЕВ РАМКИ (Точки входа и выхода тока)
                    ctx.beginPath();
                    ctx.arc(bolt.p1.x, bolt.p1.y, 2.5, 0, Math.PI * 2);
                    ctx.arc(bolt.p2.x, bolt.p2.y, 2.5, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${bolt.alpha})`;
                    ctx.shadowColor = '#00d4ff';
                    ctx.shadowBlur = 10;
                    ctx.fill();

                    ctx.beginPath();
                    ctx.arc(bolt.p1.x, bolt.p1.y, 12, 0, Math.PI * 2);
                    ctx.arc(bolt.p2.x, bolt.p2.y, 12, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(59, 130, 246, ${bolt.alpha * 0.5})`;
                    ctx.shadowBlur = 25;
                    ctx.fill();

                    // 2. Внешнее свечение дуги
                    ctx.beginPath();
                    for (const seg of bolt.segments) {
                        ctx.moveTo(seg.x1, seg.y1);
                        ctx.lineTo(seg.x2, seg.y2);
                    }
                    ctx.strokeStyle = `rgba(59, 130, 246, ${bolt.alpha * 0.6})`;
                    ctx.lineWidth = 3.5;
                    ctx.shadowBlur = 15;
                    ctx.stroke();

                    // 3. Белое тонкое ядро молнии
                    ctx.beginPath();
                    for (const seg of bolt.segments) {
                        ctx.moveTo(seg.x1, seg.y1);
                        ctx.lineTo(seg.x2, seg.y2);
                    }
                    ctx.strokeStyle = `rgba(255, 255, 255, ${bolt.alpha})`;
                    ctx.lineWidth = 1.2;
                    ctx.shadowBlur = 4;
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
                spawnBolt();
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

    /* ============================================
       AI CURSOR — Typing Effect for "About Me"
       ============================================ */
    document.addEventListener('DOMContentLoaded', () => {
        const aboutSection = document.querySelector('#about');
        const aboutTexts = document.querySelectorAll('.about-text');

        if (aboutSection && aboutTexts.length > 0) {
            const originalTexts = Array.from(aboutTexts).map(p => {
                const text = p.textContent.trim();
                p.textContent = '';
                return text;
            });

            // Restore text before printing so the printed page has content
            window.addEventListener('beforeprint', () => {
                aboutTexts.forEach((p, i) => {
                    if (i < originalTexts.length) p.textContent = originalTexts[i];
                });
            });

            let isTypingStarted = false;

            const typeWriter = (element, text, speed, callback) => {
                let i = 0;
                element.classList.add('ai-cursor');

                const typing = setInterval(() => {
                    if (i < text.length) {
                        element.textContent += text.charAt(i);
                        i++;
                    } else {
                        clearInterval(typing);
                        element.classList.remove('ai-cursor');
                        if (callback) callback();
                    }
                }, speed);
            };

            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && !isTypingStarted) {
                    isTypingStarted = true;

                    typeWriter(aboutTexts[0], originalTexts[0], 10, () => {
                        if (aboutTexts[1]) {
                            typeWriter(aboutTexts[1], originalTexts[1], 10, () => {
                                if (aboutTexts[2]) {
                                    typeWriter(aboutTexts[2], originalTexts[2], 10, () => {
                                        aboutTexts[2].classList.add('ai-cursor');
                                    });
                                }
                            });
                        }
                    });
                }
            }, { threshold: 0.4 });

            observer.observe(aboutSection);
        }
    });

    /* ============================================
       3D TILT — Education Card
       ============================================ */
    document.addEventListener('DOMContentLoaded', () => {
        const eduCard = document.querySelector('.education-card');
        
        if (eduCard) {
            eduCard.addEventListener('mousemove', (e) => {
                const rect = eduCard.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = ((y - centerY) / centerY) * -10;
                const rotateY = ((x - centerX) / centerX) * 10;
                
                eduCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            });

            eduCard.addEventListener('mouseleave', () => {
                eduCard.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
                eduCard.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
            });

            eduCard.addEventListener('mouseenter', () => {
                eduCard.style.transition = 'none';
            });
        }
    });

    /* ============================================
       STAGGER ANIMATION — Contact Cards
       ============================================ */
    document.addEventListener('DOMContentLoaded', () => {
        const contactItems = document.querySelectorAll('.contact-item');

        if (contactItems.length > 0) {
            const contactObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        contactItems.forEach((item, index) => {
                            setTimeout(() => {
                                item.classList.add('visible');
                            }, index * 150);
                        });
                        observer.disconnect();
                    }
                });
            }, { threshold: 0.2 });

            const contactSection = document.querySelector('#contact');
            if (contactSection) {
                contactObserver.observe(contactSection);
            }
        }
    });

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
