"use strict";

/**
 * Portfolio — Main JavaScript
 * Modular pattern with IIFE to avoid global scope pollution.
 */
(() => {
	/* ============================================
        REDUCED MOTION — системная настройка пользователя
        ============================================ */
	const prefersReducedMotion = window.matchMedia(
		"(prefers-reduced-motion: reduce)",
	).matches;

	/* ============================================
        CONFIGURATION
        ============================================ */
	const CONFIG = {
		matrix: {
			fontSize: 14,
			refreshInterval: 50, // ms
			fadeAlpha: 0.05,
			resetThreshold: 0.975,
			chars:
				"アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
			charArray: null, // Precomputed for performance
		},
		scroll: {
			progressBarThrottle: 100, // ms
		},
		animations: {
			typingSpeed: 80, // ms per character
			typingText: "Frontend Developer",
			heroObserverThreshold: 0.5,
			sectionObserverThreshold: 0.1,
			sectionObserverMargin: "0px 0px -50px 0px",
			lookingObserverThreshold: 0.6,
			lookingObserverMargin: "0px 0px -100px 0px",
			skillCardStagger: 100, // ms
			projectCardStagger: 150,
			educationCardStagger: 100,
			contactItemStagger: 100,
		},
		snowfall: {
			count: 50,
			fps: 60,
			minRadius: 1.5,
			maxRadius: 4.5,
			minSpeedY: 0.4,
			maxSpeedY: 1.8,
			minSpeedX: 0.15,
			maxSpeedX: 0.6,
			wobbleSpeed: 0.02,
			wobbleAmplitude: 0.8,
		},
	};

	/* ============================================
       DOM CACHE
       ============================================ */
	const DOM = {};

	function cacheDOMElements() {
		DOM.matrixCanvas = document.getElementById("matrixCanvas");
		DOM.progressBar = document.createElement("div");
		DOM.heroSection = document.querySelector(".hero");
		DOM.heroTitle = document.querySelector(".hero-title");
		DOM.sections = document.querySelectorAll(".section");
		DOM.skillCards = document.querySelectorAll(".skill-card");
		DOM.projectCards = document.querySelectorAll(".project-card");
		DOM.educationCards = document.querySelectorAll(".education-card");
		DOM.contactItems = document.querySelectorAll(".contact-item");
	}

	/* ============================================
        UNIFIED ANIMATION LOOP — один RAF для всех эффектов
        ============================================ */
	let animationIndex = 0;

	const AnimationLoop = {
		rafId: null,
		running: false,
		drivers: [], // [{ draw(timestamp), enabled: bool }]

		start() {
			if (this.running) return;
			this.running = true;
			this.tick = this.tick.bind(this);
			this.tick(0);
		},

		stop() {
			this.running = false;
			if (this.rafId) {
				cancelAnimationFrame(this.rafId);
				this.rafId = null;
			}
		},

		tick(timestamp) {
			if (!this.running) return;

			for (const driver of this.drivers) {
				if (driver.enabled) {
					driver.draw(timestamp);
				}
			}

			this.rafId = requestAnimationFrame(this.tick);
		},

		// Возвращает индекс зарегистрированного драйвера
		// Переиспользует disabled-слоты вместо бесконечного роста массива
		register(drawFn) {
			// Ищем первый disabled слот для переиспользования
			const reuseIdx = this.drivers.findIndex((d) => !d.enabled);
			if (reuseIdx !== -1) {
				this.drivers[reuseIdx] = { draw: drawFn, enabled: true };
				return reuseIdx;
			}
			// Иначе добавляем новый
			const idx = animationIndex++;
			this.drivers.push({ draw: drawFn, enabled: true });
			return idx;
		},

		disable(idx) {
			if (this.drivers[idx]) {
				this.drivers[idx].enabled = false;
			}
		},
	};

	/* ============================================
        MATRIX RAIN EFFECT
        ============================================ */
	const MatrixRain = {
		ctx: null,
		columns: 0,
		drops: [],
		lastTime: 0,
		loopIdx: null,
		observer: null,

		init() {
			this.ctx = DOM.matrixCanvas.getContext("2d");
			CONFIG.matrix.charArray = CONFIG.matrix.chars.split("");
			this.resize();
			this.loopIdx = AnimationLoop.register((timestamp) =>
				this.draw(timestamp),
			);

			// Останавливаем анимацию когда hero не виден
			this.observer = new IntersectionObserver(
				(entries) => {
					if (entries[0].isIntersecting) {
						// Hero на экране — включаем рисование
						if (this.loopIdx !== null) {
							AnimationLoop.disable(this.loopIdx);
							this.loopIdx = AnimationLoop.register((timestamp) =>
								this.draw(timestamp),
							);
						}
					} else {
						// Hero ушёл — отключаем
						if (this.loopIdx !== null) {
							AnimationLoop.disable(this.loopIdx);
							this.loopIdx = null;
						}
					}
				},
				{ threshold: 0.1 },
			);

			this.observer.observe(DOM.heroSection);
		},

		resize() {
			const canvas = DOM.matrixCanvas;
			canvas.width = canvas.parentElement.offsetWidth;
			canvas.height = canvas.parentElement.offsetHeight;
			this.columns = Math.floor(canvas.width / CONFIG.matrix.fontSize);
			this.drops = Array(this.columns).fill(1);
		},

		draw(timestamp) {
			const { ctx, columns, drops } = this;
			const { fontSize, fadeAlpha, resetThreshold } = CONFIG.matrix;
			const charArray = CONFIG.matrix.charArray;
			const canvas = DOM.matrixCanvas;

			// Throttle: рисуем не чаще чем раз в CONFIG.matrix.refreshInterval
			if (timestamp - this.lastTime < CONFIG.matrix.refreshInterval) return;
			this.lastTime = timestamp;

			ctx.fillStyle = `rgba(15, 23, 42, ${fadeAlpha})`;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			ctx.fillStyle = `rgba(59, 130, 246, 0.9)`;
			ctx.font = `${fontSize}px monospace`;

			for (let i = 0; i < columns; i++) {
				const text = charArray[Math.floor(Math.random() * charArray.length)];
				const x = i * fontSize;
				const y = drops[i] * fontSize;

				if (Math.random() > 0.85) {
					ctx.fillStyle = "#8b5cf6";
				} else {
					ctx.fillStyle = "rgba(59, 130, 246, 0.9)";
				}
				ctx.fillText(text, x, y);

				if (
					drops[i] * fontSize > canvas.height &&
					Math.random() > resetThreshold
				) {
					drops[i] = 0;
				}
				drops[i]++;
			}
		},

		destroy() {
			if (this.loopIdx !== null) {
				AnimationLoop.disable(this.loopIdx);
				this.loopIdx = null;
			}
			if (this.observer) {
				this.observer.disconnect();
			}
		},
	};

	/* ============================================
        SNOWFALL — FrigoShop Project
        ============================================ */
	const Snowfall = {
		ctx: null,
		canvas: null,
		snowflakes: [],
		lastTime: 0,
		loopIdx: null,
		observer: null,
		resizeHandler: null,

		init() {
			const card = document.querySelector('.project-card:has(.fa-snowflake)');
			if (!card) return;
			this.canvas = card.querySelector('.snowfall-canvas');
			if (!this.canvas) return;

			this.ctx = this.canvas.getContext('2d');

			// Resize через frame чтобы DOM успел отрисоваться
			requestAnimationFrame(() => {
				const parent = this.canvas.parentElement;
				this.canvas.width = parent.clientWidth;
				this.canvas.height = parent.clientHeight;
				this.createSnowflakes();
			});

			this.loopIdx = AnimationLoop.register((timestamp) => this.draw(timestamp));

			this.resizeHandler = () => {
				const parent = this.canvas.parentElement;
				this.canvas.width = parent.clientWidth;
				this.canvas.height = parent.clientHeight;
			};
			window.addEventListener('resize', this.resizeHandler);

			this.observer = new IntersectionObserver((entries) => {
				if (entries[0].isIntersecting) {
					const parent = this.canvas.parentElement;
					this.canvas.width = parent.clientWidth;
					this.canvas.height = parent.clientHeight;
					if (this.loopIdx === null) {
						this.loopIdx = AnimationLoop.register((timestamp) => this.draw(timestamp));
					}
				} else {
					if (this.loopIdx !== null) {
						AnimationLoop.disable(this.loopIdx);
						this.loopIdx = null;
					}
				}
			}, { threshold: 0.1 });

			this.observer.observe(card);
		},

		createSnowflakes() {
			const { count, minRadius, maxRadius, minSpeedY, maxSpeedY, minSpeedX, maxSpeedX, wobbleSpeed, wobbleAmplitude } = CONFIG.snowfall;
			const w = this.canvas.width || 320;
			const h = this.canvas.height || 180;

			this.snowflakes = Array.from({ length: count }, () => {
				const r = minRadius + Math.random() * (maxRadius - minRadius);
				return {
					x: Math.random() * w,
					y: Math.random() * h,
					radius: r,
					speedY: minSpeedY + Math.random() * (maxSpeedY - minSpeedY),
					speedX: minSpeedX + Math.random() * (maxSpeedX - minSpeedX),
					opacity: 0.3 + (r - minRadius) / (maxRadius - minRadius) * 0.6,
					wobble: Math.random() * Math.PI * 2,
					wobbleSpeed,
					wobbleAmplitude,
				};
			});
		},

		draw(timestamp) {
			const { ctx, snowflakes, canvas } = this;
			if (timestamp - this.lastTime < 1000 / CONFIG.snowfall.fps) return;
			this.lastTime = timestamp;
			if (canvas.width === 0 || canvas.height === 0) return;

			ctx.clearRect(0, 0, canvas.width, canvas.height);

			for (const f of snowflakes) {
				f.y += f.speedY;
				f.wobble += f.wobbleSpeed;
				f.x += Math.sin(f.wobble) * f.wobbleAmplitude;

				if (f.y > canvas.height + f.radius * 2) {
					f.y = -f.radius * 2;
					f.x = Math.random() * canvas.width;
				}
				if (f.x > canvas.width + f.radius * 2) f.x = -f.radius * 2;
				else if (f.x < -f.radius * 2) f.x = canvas.width + f.radius * 2;

				ctx.beginPath();
				ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
				ctx.fillStyle = `rgba(255,255,255,${f.opacity})`;
				ctx.fill();
			}
		},

		destroy() {
			if (this.loopIdx !== null) {
				AnimationLoop.disable(this.loopIdx);
				this.loopIdx = null;
			}
			if (this.observer) this.observer.disconnect();
			if (this.resizeHandler) window.removeEventListener('resize', this.resizeHandler);
		},
	};

	/* ============================================
        SCROLL PROGRESS BAR
        ============================================ */
	const ScrollProgress = {
		throttleTimer: null,
		isActive: false,

		init() {
			DOM.progressBar.className = "scroll-progress";
			document.body.appendChild(DOM.progressBar);
			window.addEventListener("scroll", () => this.onScroll(), {
				passive: true,
			});
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
		},
	};

	/* ============================================
       SCROLL ANIMATIONS (Intersection Observer)
       ============================================ */
	const ScrollAnimations = {
		observer: null,

		init() {
			const options = {
				threshold: CONFIG.animations.sectionObserverThreshold,
				rootMargin: CONFIG.animations.sectionObserverMargin,
			};

			this.observer = new IntersectionObserver((entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add("animate-in");
						this.observer.unobserve(entry.target);
					}
				});
			}, options);

			this.animateSections();
			this.animateWithStagger(
				DOM.skillCards,
				CONFIG.animations.skillCardStagger,
			);
			this.animateWithStagger(
				DOM.projectCards,
				CONFIG.animations.projectCardStagger,
			);
			this.animateWithStagger(
				DOM.educationCards,
				CONFIG.animations.educationCardStagger,
			);
			this.animateWithStagger(
				DOM.contactItems,
				CONFIG.animations.contactItemStagger,
			);
		},

		animateSections() {
			DOM.sections.forEach((section) => {
				const title = section.querySelector(".section-title");
				const content = section.querySelector(".about-content");
				if (title) {
					title.classList.add("animate-on-scroll");
					this.observer.observe(title);
				}
				if (content) {
					content.classList.add("animate-on-scroll");
					this.observer.observe(content);
				}
			});
		},

		animateTitleLines() {
			const titles = document.querySelectorAll(".section-title");
			const lineObserver = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting) {
							entry.target.classList.add("animate-line");
							lineObserver.unobserve(entry.target);
						}
					});
				},
				{ threshold: 0.5 },
			);

			titles.forEach((title) => {
				lineObserver.observe(title);
			});
		},

		animateWithStagger(elements, staggerMs) {
			elements.forEach((el, index) => {
				el.classList.add("animate-on-scroll");
				el.style.transitionDelay = `${index * staggerMs}ms`;
				this.observer.observe(el);
			});
		},
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
			DOM.heroTitle.textContent = "";
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
		},
	};

	/* ============================================
        LIGHTNING CANVAS EFFECT — High-Voltage Arc Physics
        ============================================ */
	function initLightning() {
		const cards = document.querySelectorAll(".project-card[data-lightning]");
		const resizeHandlers = []; // Храним handlers для cleanup

		// Mobile detection для скорости молний
		const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
		const baseDecay = isMobile ? 0.05 : 0.005;

		cards.forEach((card) => {
			const canvas = card.querySelector(".lightning-canvas");
			if (!canvas) return;
			const ctx = canvas.getContext("2d");

			const rect = card.getBoundingClientRect();
			let isVisible = rect.top < window.innerHeight && rect.bottom > 0;
			let lastBoltTime = 0;
			let loopIdx = null;
			const boltInterval = 120;
			const padding = 35;
			let bolts = [];

			const resizeCanvas = () => {
				canvas.width = card.clientWidth + padding * 2;
				canvas.height = card.clientHeight + padding * 2;
			};

			// Сохраняем handler для последующего удаления
			resizeHandlers.push({ card, handler: resizeCanvas });
			window.addEventListener("resize", resizeCanvas);

			resizeCanvas(); // Initial resize

			// Генерация геометрии молнии
			const createSegments = (x1, y1, x2, y2, displace, depth = 0) => {
				const segments = [];
				if (displace < 3 || depth > 6) {
					segments.push({ x1, y1, x2, y2 });
					return segments;
				}

				const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * displace;
				const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * displace;

				segments.push(
					...createSegments(x1, y1, midX, midY, displace / 1.8, depth),
				);
				segments.push(
					...createSegments(midX, midY, x2, y2, displace / 1.8, depth),
				);

				if (depth < 2 && Math.random() < 0.45 && displace > 10) {
					const angle =
						Math.atan2(y2 - y1, x2 - x1) +
						(Math.random() > 0.5 ? 1 : -1) * (0.4 + Math.random() * 0.7);
					const len = displace * (0.9 + Math.random() * 1.1);
					const bx = midX + Math.cos(angle) * len;
					const by = midY + Math.sin(angle) * len;
					segments.push(
						...createSegments(midX, midY, bx, by, displace / 2.2, depth + 1),
					);
				}

				return segments;
			};

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
					decay: baseDecay + Math.random() * baseDecay * 0.5,
				});
			};

			// Единый RAF-цикл — регистрация
			const draw = (timestamp) => {
				ctx.clearRect(0, 0, canvas.width, canvas.height);

				if (!isVisible) return;

				// Спавн молний по таймеру, не по кадрам
				if (
					bolts.length < 3 &&
					timestamp - lastBoltTime > boltInterval &&
					Math.random() < 0.4
				) {
					lastBoltTime = timestamp;
					spawnBolt();
					if (Math.random() < 0.3) spawnBolt();
				}

				for (let i = bolts.length - 1; i >= 0; i--) {
					const bolt = bolts[i];
					ctx.save();

					ctx.beginPath();
					ctx.arc(bolt.p1.x, bolt.p1.y, 2.5, 0, Math.PI * 2);
					ctx.arc(bolt.p2.x, bolt.p2.y, 2.5, 0, Math.PI * 2);
					ctx.fillStyle = `rgba(255, 255, 255, ${bolt.alpha})`;
					ctx.shadowColor = "#00d4ff";
					ctx.shadowBlur = 10;
					ctx.fill();

					ctx.beginPath();
					ctx.arc(bolt.p1.x, bolt.p1.y, 12, 0, Math.PI * 2);
					ctx.arc(bolt.p2.x, bolt.p2.y, 12, 0, Math.PI * 2);
					ctx.fillStyle = `rgba(59, 130, 246, ${bolt.alpha * 0.5})`;
					ctx.shadowBlur = 25;
					ctx.fill();

					ctx.beginPath();
					for (const seg of bolt.segments) {
						ctx.moveTo(seg.x1, seg.y1);
						ctx.lineTo(seg.x2, seg.y2);
					}
					ctx.strokeStyle = `rgba(59, 130, 246, ${bolt.alpha * 0.6})`;
					ctx.lineWidth = 3.5;
					ctx.shadowBlur = 15;
					ctx.stroke();

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
			};

			// IntersectionObserver — включаем/отключаем драйвер в едином цикле
			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting) {
							isVisible = true;
							resizeCanvas();
							spawnBolt();
							// Включаем рисование в едином цикле
							if (loopIdx === null) {
								loopIdx = AnimationLoop.register(draw);
							}
						} else {
							isVisible = false;
							bolts = [];
							// Отключаем рисование
							if (loopIdx !== null) {
								AnimationLoop.disable(loopIdx);
								loopIdx = null;
							}
						}
					});
				},
				{ threshold: 0.1 },
			);

			observer.observe(card);

			// Если карточка уже видна — сразу спавним молнию и запускаем draw
			if (isVisible) {
				spawnBolt();
				loopIdx = AnimationLoop.register(draw);
			}
		});

		// Возвращаем функцию для cleanup
		return () => {
			resizeHandlers.forEach(({ handler }) => {
				window.removeEventListener("resize", handler);
			});
		};
	}

	/* ============================================
        INITIALIZATION
        ============================================ */
	function init() {
		cacheDOMElements();

		// Запускаем единый RAF-цикл ОДИН РАЗ
		AnimationLoop.start();

		// Matrix Rain — Canvas анимация, тяжёлая для слабых устройств
		if (!prefersReducedMotion) {
			MatrixRain.init();
		}

		// Snowfall — Canvas снежинки для FrigoShop
		if (!prefersReducedMotion) {
			Snowfall.init();
		}

		ScrollProgress.init();
		ScrollAnimations.init();
		TypingEffect.init();

		// Lightning — Canvas молнии на карточках
		if (!prefersReducedMotion) {
			lightningCleanup = initLightning();
		}

		// Oscilloscope — SVG анимация осциллографа
		oscilloscopeCleanup = initOscilloscope();

		// Каскадное появление контактов
		initContactCascade();

		initInteractiveEffects();
	}

	/* ============================================
       INTERACTIVE EFFECTS (Spotlight, Decode, AI Typing, 3D Tilt)
       ============================================ */
	function initInteractiveEffects() {
		/* ============================================
        SECTION TITLES — AI Decoding on Scroll
        ============================================ */
		const sectionDecodeLetters =
			"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*<>[]{}!@#";
		const sectionDecodeObserver = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && !entry.target.dataset.decoded) {
						entry.target.dataset.decoded = "true";
						const title = entry.target.querySelector(".section-title");
						if (!title) return;

						const originalText = title.textContent.trim();
						title.dataset.value = originalText;
						title.textContent = "";

						let iteration = 0;
						const interval = setInterval(() => {
							title.textContent = originalText
								.split("")
								.map((_char, index) => {
									if (index < iteration) return originalText[index];
									return sectionDecodeLetters[
										Math.floor(Math.random() * sectionDecodeLetters.length)
									];
								})
								.join("");
							if (iteration >= originalText.length) {
								clearInterval(interval);
							}
							iteration += 0.3;
						}, 40);
					}
				});
			},
			{ threshold: 0.6 },
		);

		DOM.sections.forEach((section) => {
			sectionDecodeObserver.observe(section);
		});

		// 1. Spotlight Hover на карточках навыков
		DOM.skillCards.forEach((card) => {
			card.addEventListener("mousemove", (e) => {
				const rect = card.getBoundingClientRect();
				card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
				card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
			});
		});

		// 2. AI Decoding Text
		const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";
		DOM.skillCards.forEach((card) => {
			const li = card.querySelector(".skill-name");
			if (!li) return;
			li.dataset.value = li.textContent;
			let interval = null;

			card.addEventListener("mouseenter", (e) => {
				let iteration = 0;
				clearInterval(interval);
				interval = setInterval(() => {
					e.target.textContent = e.target.dataset.value
						.split("")
						.map((_letter, index) => {
							if (index < iteration) return e.target.dataset.value[index];
							return letters[Math.floor(Math.random() * letters.length)];
						})
						.join("");
					if (iteration >= e.target.dataset.value.length) {
						clearInterval(interval);
					}
					iteration += 0.5;
				}, 30);
			});
		});

		// 3. Универсальная AI-печать для секций
		const setupAiTyping = (sectionSelector, speed, threshold) => {
			const section = document.querySelector(sectionSelector);
			const texts = document.querySelectorAll(`${sectionSelector} .about-text`);
			if (!section || texts.length === 0) return;

			const originalTexts = Array.from(texts).map((p) => {
				const text = p.textContent.trim();
				p.textContent = "";
				return text;
			});

			// Храним active интервалы для остановки при печати
			const typingIntervals = [];

			// Restore text before printing — останавливаем AI-печать
			window.addEventListener("beforeprint", () => {
				// Останавливаем все active typing intervals
				for (const id of typingIntervals) {
					clearInterval(id);
				}
				// Восстанавливаем полный текст
				texts.forEach((p, i) => {
					if (i < originalTexts.length) p.textContent = originalTexts[i];
				});
			});

			const typeWriter = (index) => {
				if (index >= texts.length) {
					texts[texts.length - 1].classList.add("ai-cursor");
					return;
				}
				const element = texts[index];
				const text = originalTexts[index];
				let i = 0;
				element.classList.add("ai-cursor");

				const typing = setInterval(() => {
					if (i < text.length) {
						element.textContent += text.charAt(i);
						i++;
					} else {
						clearInterval(typing);
						element.classList.remove("ai-cursor");
						typeWriter(index + 1);
					}
				}, speed);

				// Сохраняем ID интервала
				typingIntervals.push(typing);
			};

			let isTypingStarted = false;
			const observer = new IntersectionObserver(
				(entries) => {
					if (entries[0].isIntersecting && !isTypingStarted) {
						isTypingStarted = true;
						typeWriter(0);
						observer.disconnect();
					}
				},
				{ threshold },
			);

			observer.observe(section);
		};

		setupAiTyping("#about", 10, 0.7);
		setupAiTyping(
			"#looking-for",
			15,
			CONFIG.animations.lookingObserverThreshold,
		);

		// 4. 3D Tilt для карточки образования
		const eduCard = document.querySelector(".education-card");
		if (eduCard) {
			eduCard.addEventListener("mousemove", (e) => {
				const rect = eduCard.getBoundingClientRect();
				const rotateX =
					((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * -10;
				const rotateY =
					((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 10;

				eduCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
			});

			eduCard.addEventListener("mouseleave", () => {
				eduCard.style.transform =
					"perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
				eduCard.style.transition =
					"transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)";
			});

			eduCard.addEventListener("mouseenter", () => {
				eduCard.style.transition = "none";
			});
		}
	}

	/* ============================================
        CONTACT CASCADE — staggered reveal
        ============================================ */
	function initContactCascade() {
		if (DOM.contactItems.length === 0) return;
		const contactSection = document.querySelector("#contact");
		if (!contactSection) return;

		const contactObserver = new IntersectionObserver(
			(entries, obs) => {
				if (entries[0].isIntersecting) {
					DOM.contactItems.forEach((item, index) => {
						setTimeout(() => item.classList.add("visible"), index * 150);
					});
					obs.disconnect();
				}
			},
			{ threshold: 0.2 },
		);
		contactObserver.observe(contactSection);
	}

	/* ============================================
        REALTIME OSCILLOSCOPE — 3-Stage Reactive Signal
        ============================================ */
	function initOscilloscope() {
		const contactSection = document.getElementById("contact");
		const mainPath = document.getElementById("oscPathMain");
		const echoPath = document.getElementById("oscPathEcho");
		const contactCards = document.querySelectorAll(".contact-item");

		if (!contactSection || !mainPath || !echoPath) return;

		const width = 800;
		const height = 80;
		const baseY = height / 2;

		const STATES = {
			standby: { amp: 3.5, freq: 2.0, speed: 0.025 },
			section: { amp: 12.0, freq: 4.5, speed: 0.07 },
			card: { amp: 25.0, freq: 9.5, speed: 0.16 },
		};

		const current = { ...STATES.standby };
		let target = { ...STATES.standby };
		let phase = 0;
		let loopIdx = null;

		const buildWavePath = (amp, freq, phaseOffset, harmonicMult) => {
			const step = 4;
			let d = `M 0,${baseY}`;

			for (let x = step; x <= width; x += step) {
				const normX = x / width;
				const envelope = Math.sin(normX * Math.PI) ** 1.6;

				const w1 = Math.sin(normX * Math.PI * 2 * freq - phaseOffset);
				const w2 =
					Math.sin(
						normX * Math.PI * 2 * (freq * 1.65) + phaseOffset * harmonicMult,
					) * 0.35;

				const y = baseY + (w1 + w2) * amp * envelope;
				d += ` L ${x},${y.toFixed(1)}`;
			}
			return d;
		};

		// Единый RAF-цикл — рисование осциллографа
		const draw = () => {
			current.amp += (target.amp - current.amp) * 0.08;
			current.freq += (target.freq - current.freq) * 0.06;
			current.speed += (target.speed - current.speed) * 0.08;

			phase += current.speed;

			mainPath.setAttribute(
				"d",
				buildWavePath(current.amp, current.freq, phase, 1.2),
			);
			echoPath.setAttribute(
				"d",
				buildWavePath(
					current.amp * 0.75,
					current.freq * 0.85,
					-phase * 0.8,
					1.5,
				),
			);
		};

		contactSection.addEventListener("mouseenter", () => {
			target = { ...STATES.section };
			contactSection.classList.add("osc-section-hover");
		});

		contactSection.addEventListener("mouseleave", () => {
			target = { ...STATES.standby };
			contactSection.classList.remove("osc-section-hover", "osc-card-hover");
		});

		contactCards.forEach((card) => {
			card.addEventListener("mouseenter", () => {
				target = { ...STATES.card };
				contactSection.classList.add("osc-card-hover");
			});

			card.addEventListener("mouseleave", () => {
				target = { ...STATES.section };
				contactSection.classList.remove("osc-card-hover");
			});
		});

		// IntersectionObserver — включаем/отключаем драйвер в едином цикле
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					// Включаем рисование в едином цикле
					if (loopIdx === null) {
						loopIdx = AnimationLoop.register(draw);
					}
					contactSection.classList.add("contact-section-visible");
				} else {
					// Отключаем рисование
					if (loopIdx !== null) {
						AnimationLoop.disable(loopIdx);
						loopIdx = null;
					}
					contactSection.classList.remove("contact-section-visible");
				}
			},
			{ threshold: 0.05 },
		);

		observer.observe(contactSection);

		// Возвращаем функцию для cleanup
		return () => {
			observer.disconnect();
			contactSection.removeEventListener("mouseenter", () => {});
			contactSection.removeEventListener("mouseleave", () => {});
			contactCards.forEach((card) => {
				card.removeEventListener("mouseenter", () => {});
				card.removeEventListener("mouseleave", () => {});
			});
		};
	}

	// Слушаем изменение настройки в реальном времени
	const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

	let isAnimationsEnabled = !motionQuery.matches;
	let lightningCleanup = null;
	let oscilloscopeCleanup = null;

	// Сохраняем cleanup функции из init()
	const _originalInit = init;
	window.initPortfolioCleanup = () => {
		// Возвращаем cleanup для использования в matchMedia handler
		return {
			matrix: () => MatrixRain.destroy(),
			snowfall: () => Snowfall.destroy(),
			lightning: () => lightningCleanup?.(),
			oscilloscope: () => oscilloscopeCleanup?.(),
		};
	};

	motionQuery.addEventListener("change", (e) => {
		const enabled = !e.matches;

		if (enabled && !isAnimationsEnabled) {
			// Включили анимации — запускаем заново
			MatrixRain.init();
			Snowfall.init();
			if (!lightningCleanup) lightningCleanup = initLightning();
			if (!oscilloscopeCleanup) oscilloscopeCleanup = initOscilloscope();
		} else if (!enabled && isAnimationsEnabled) {
			// Выключили анимации — чистим всё
			MatrixRain.destroy();
			Snowfall.destroy();
			lightningCleanup?.();
			oscilloscopeCleanup?.();
			lightningCleanup = null;
			oscilloscopeCleanup = null;
		}

		isAnimationsEnabled = enabled;
	});

	// Start when DOM is ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

	// ============================================
	// Скачивание резюме — работает на iOS Safari
	// ============================================
	var downloadLink = document.querySelector('.btn-download-cv');
	if (downloadLink) {
		downloadLink.addEventListener('click', function (e) {
			var pdfUrl = 'resume/resume.pdf';

			// iOS Safari не поддерживает атрибут download
			// Открываем PDF в новой вкладке — пользователь может сохранить вручную
			if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
				e.preventDefault();
				window.open(pdfUrl, '_blank');
			}
			// Android Chrome тоже иногда глючит с download
			else if (/Android/.test(navigator.userAgent)) {
				e.preventDefault();
				var a = document.createElement('a');
				a.href = pdfUrl;
				a.download = 'Karagodin_Vadim_CV.pdf';
				a.target = '_blank';
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
			}
		});
	}
})();
