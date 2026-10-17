// ============================================
// MATRIX RAIN EFFECT (оптимизировано через rAF)
// ============================================
const matrixCanvas = document.getElementById('matrixCanvas');
const ctx = matrixCanvas.getContext('2d');

function resizeCanvas() {
    matrixCanvas.width = matrixCanvas.parentElement.offsetWidth;
    matrixCanvas.height = matrixCanvas.parentElement.offsetHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const matrixChars = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const matrixArray = matrixChars.split('');
const fontSize = 14;
let columns = Math.floor(matrixCanvas.width / fontSize);
let drops = Array(columns).fill(1);

function drawMatrix() {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.05)';
    ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
    
    ctx.fillStyle = '#00ff41';
    ctx.font = fontSize + 'px monospace';
    
    for (let i = 0; i < drops.length; i++) {
        const text = matrixArray[Math.floor(Math.random() * matrixArray.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        
        if (drops[i] * fontSize > matrixCanvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}

// requestAnimationFrame — работает синхронно с монитором (60fps)
let matrixRunning = true;
let lastTime = 0;
const matrixInterval = 50; // обновление каждые 50мс

function matrixLoop(timestamp) {
    if (!matrixRunning) return;
    
    if (timestamp - lastTime >= matrixInterval) {
        drawMatrix();
        lastTime = timestamp;
    }
    
    requestAnimationFrame(matrixLoop);
}

requestAnimationFrame(matrixLoop);

window.addEventListener('resize', () => {
    columns = Math.floor(matrixCanvas.width / fontSize);
    drops = Array(columns).fill(1);
});

// ============================================
// SCROLL INDICATOR (скрывается при скролле)
// ============================================
const scrollIndicator = document.querySelector('.scroll-indicator');

let scrollIndicatorHidden = false;
window.addEventListener('scroll', () => {
    if (!scrollIndicatorHidden && window.scrollY > 100) {
        scrollIndicator.classList.add('hidden');
        scrollIndicatorHidden = true;
    }
});

// ============================================
// SCROLL PROGRESS BAR
// ============================================
const progressBar = document.createElement('div');
progressBar.className = 'scroll-progress';
document.body.appendChild(progressBar);

// ============================================
// SCROLL ANIMATIONS (Intersection Observer)
// ============================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.section').forEach(section => {
    section.classList.add('animate-on-scroll');
    observer.observe(section);
});

// Animate skill cards with stagger
document.querySelectorAll('.skill-card').forEach((card, index) => {
    card.style.transitionDelay = `${index * 0.1}s`;
    observer.observe(card);
});

// Animate project cards with stagger
document.querySelectorAll('.project-card').forEach((card, index) => {
    card.style.transitionDelay = `${index * 0.15}s`;
    observer.observe(card);
});

// Animate education cards
document.querySelectorAll('.education-card').forEach((card, index) => {
    card.style.transitionDelay = `${index * 0.1}s`;
    observer.observe(card);
});

// Animate contact items
document.querySelectorAll('.contact-item').forEach((item, index) => {
    item.style.transitionDelay = `${index * 0.1}s`;
    observer.observe(item);
});

// ============================================
// TYPING EFFECT (срабатывает при появлении в viewport)
// ============================================
const typingText = 'Frontend Developer';
const titleElement = document.querySelector('.hero-title');
const heroSection = document.querySelector('.hero');

let typingActive = false;

function typeText() {
    if (typingActive) return;
    typingActive = true;
    
    titleElement.textContent = '';
    let charIndex = 0;
    
    function typeChar() {
        if (charIndex < typingText.length) {
            titleElement.textContent += typingText.charAt(charIndex);
            charIndex++;
            setTimeout(typeChar, 80);
        } else {
            typingActive = false;
        }
    }
    
    typeChar();
}

// IntersectionObserver — запускает typing при появлении hero
const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !typingActive) {
            typeText();
        }
    });
}, { threshold: 0.5 });

heroObserver.observe(heroSection);

// ============================================
// SCROLL PROGRESS (throttle — 1 раз в 100мс)
// ============================================
let scrollThrottle = false;
window.addEventListener('scroll', () => {
    if (scrollThrottle) return;
    scrollThrottle = true;
    
    setTimeout(() => {
        const scrollTop = window.scrollY;
        const windowHeight = window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;
        const scrollPercent = (scrollTop / (docHeight - windowHeight)) * 100;
        progressBar.style.width = scrollPercent + '%';
        
        // Скрываем индикатор когда внизу страницы
        if (scrollIndicator) {
            if (scrollTop + windowHeight >= docHeight - 5) {
                scrollIndicator.classList.add('hidden');
            } else {
                scrollIndicator.classList.remove('hidden');
            }
        }
        
        scrollThrottle = false;
    }, 100);
});
