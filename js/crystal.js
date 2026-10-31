/* ============================================
   GLOBAL AUCTION MARKETPLACE — 3D Cyber Crystal
   Three.js r128 (CDN) — Артефакт торгов с лучами ставок
   ============================================ */

(function () {
    'use strict';

    var container = document.getElementById('crystal-container');
    if (!container || typeof THREE === 'undefined') return;

    var scene, camera, renderer, crystalGroup, ringsGroup, beamGroup;
    var animId = null;
    var isPaused = false;
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isHovered = false;

    // ============================================
    // Инициализация сцены
    // ============================================
    scene = new THREE.Scene();

    var width = container.clientWidth || 320;
    var height = container.clientHeight || 180;

    camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.8, 3.8);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // ============================================
    // 1. Центральный кибер-кристалл (Октаэдр / Алмаз)
    // ============================================
    crystalGroup = new THREE.Group();
    scene.add(crystalGroup);

    // Внутреннее яркое ядро
    var coreGeo = new THREE.OctahedronGeometry(0.55, 0);
    var coreMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.85
    });
    var coreMesh = new THREE.Mesh(coreGeo, coreMat);
    crystalGroup.add(coreMesh);

    // Внешняя полупрозрачная оболочка кристалла (золотой/пурпурный акцент аукциона)
    var outerGeo = new THREE.IcosahedronGeometry(0.68, 0);
    var outerMat = new THREE.MeshPhysicalMaterial({
        color: 0x0ea5e9,
        emissive: 0x0284c7,
        emissiveIntensity: 0.3,
        roughness: 0.1,
        metalness: 0.8,
        transparent: true,
        opacity: 0.55,
        wireframe: false,
        side: THREE.DoubleSide
    });
    var outerMesh = new THREE.Mesh(outerGeo, outerMat);
    crystalGroup.add(outerMesh);

    // ============================================
    // 2. Вращающиеся силовые кольца (сканеры)
    // ============================================
    ringsGroup = new THREE.Group();
    scene.add(ringsGroup);

    var ringConfigs = [
        { radius: 1.1, tube: 0.012, rotX: Math.PI / 3, speed: 0.01, color: 0x38bdf8 },
        { radius: 1.35, tube: 0.008, rotX: -Math.PI / 4, rotZ: Math.PI / 6, speed: -0.008, color: 0x8b5cf6 },
        { radius: 1.55, tube: 0.01, rotX: Math.PI / 2, speed: 0.005, color: 0x06b6d4 }
    ];

    var ringMeshes = [];
    ringConfigs.forEach(function (cfg) {
        var rGeo = new THREE.TorusGeometry(cfg.radius, cfg.tube, 16, 64);
        var rMat = new THREE.MeshBasicMaterial({
            color: cfg.color,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });
        var rMesh = new THREE.Mesh(rGeo, rMat);
        rMesh.rotation.x = cfg.rotX;
        if (cfg.rotZ) rMesh.rotation.z = cfg.rotZ;
        rMesh.userData = { speed: cfg.speed };
        ringsGroup.add(rMesh);
        ringMeshes.push(rMesh);
    });

    // ============================================
    // 3. Лучи новых ставок (Incoming Bid Lasers)
    // ============================================
    beamGroup = new THREE.Group();
    scene.add(beamGroup);

    function createBidBeam() {
        var angle = Math.random() * Math.PI * 2;
        var startDist = 3.0;
        var startX = Math.cos(angle) * startDist;
        var startZ = Math.sin(angle) * startDist;
        var startY = (Math.random() - 0.5) * 1.5;

        var points = [
            new THREE.Vector3(startX, startY, startZ),
            new THREE.Vector3(0, 0, 0) // летят прямо в центр кристалла
        ];
        var bGeo = new THREE.BufferGeometry().setFromPoints(points);
        var bMat = new THREE.LineBasicMaterial({
            color: Math.random() > 0.3 ? 0x00d4ff : 0xf59e0b, // синие или золотые ставки
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        var line = new THREE.Line(bGeo, bMat);
        beamGroup.add(line);

        // Плавное затухание луча
        setTimeout(function() {
            if (beamGroup.children.includes(line)) {
                beamGroup.remove(line);
                bGeo.dispose();
                bMat.dispose();
            }
        }, 400);
    }

    // ============================================
    // Обработка событий мыши (Интерактив карточки)
    // ============================================
    container.addEventListener('mouseenter', function() {
        isHovered = true;
    });
    container.addEventListener('mouseleave', function() {
        isHovered = false;
    });

    // ============================================
    // Resize и Оптимизация видимости (IntersectionObserver)
    // ============================================
    function onResize() {
        var w = container.clientWidth;
        var h = container.clientHeight;
        if (!w || !h) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    }

    window.addEventListener('resize', onResize);

    var observer = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
            if (!prefersReducedMotion) isPaused = false;
        } else {
            isPaused = true;
        }
    }, { threshold: 0.05 });
    observer.observe(container);

    // ============================================
    // Анимационный цикл
    // ============================================
    var clock = new THREE.Clock();

    function animate() {
        animId = requestAnimationFrame(animate);

        var delta = clock.getDelta();
        var time = clock.getElapsedTime();

        if (!isPaused && !prefersReducedMotion) {
            var speedMultiplier = isHovered ? 2.5 : 1.0;

            // Вращение кристалла
            crystalGroup.rotation.y += 0.007 * speedMultiplier;
            crystalGroup.rotation.x = Math.sin(time * 1.5) * 0.15;

            // Парение кристалла вверх-вниз
            crystalGroup.position.y = Math.sin(time * 2) * 0.08;

            // Вращение силовых колец
            ringMeshes.forEach(function (mesh) {
                mesh.rotation.z += mesh.userData.speed * speedMultiplier;
                mesh.rotation.y += mesh.userData.speed * 0.5 * speedMultiplier;
            });

            // Генерация новых «ставок» (лучей)
            if (Math.random() < (isHovered ? 0.12 : 0.04)) {
                createBidBeam();
            }
        }

        renderer.render(scene, camera);
    }

    animate();

    // ============================================
    // Очистка памяти при удалении
    // ============================================
    window.crystalAPI = {
        destroy: function () {
            if (animId) cancelAnimationFrame(animId);
            observer.disconnect();
            window.removeEventListener('resize', onResize);
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
            coreGeo.dispose(); coreMat.dispose();
            outerGeo.dispose(); outerMat.dispose();
            renderer.dispose();
        }
    };
})();
