/* ============================================
   GLOBE HOLOGRAM — Pixel Cyberpunk Earth
   Three.js r128 — Strict Pixel Grid + Pedestal
   ============================================ */

(function () {
    'use strict';

    var container = document.getElementById('globe-container');
    if (!container || typeof THREE === 'undefined') return;

    var scene, camera, renderer, globeGroup, pedestalGroup, dustSystem;
    var animId = null;
    var isPaused = false;
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var radius = 0.95;

    // Точные контуры материков и крупных островов [lat, lon]
    var landmasses = [
        // Северная Америка
        [
            [70,-165],[71,-155],[70,-140],[69,-120],[68,-105],[66,-90],[63,-80],[60,-64],[52,-55],
            [47,-53],[44,-64],[41,-70],[35,-75],[30,-81],[25,-80],[25,-82],[30,-85],[29,-95],[22,-97],
            [18,-94],[15,-83],[9,-79],[8,-77],[9,-84],[14,-92],[18,-103],[23,-106],[31,-114],[23,-110],
            [32,-117],[38,-123],[48,-125],[58,-136],[61,-150],[55,-162],[60,-166],[66,-168]
        ],
        // Гренландия
        [
            [60,-44],[65,-38],[70,-22],[76,-19],[82,-30],[82,-55],[76,-68],[70,-54],[64,-52]
        ],
        // Южная Америка
        [
            [11,-75],[10,-62],[6,-52],[0,-50],[-5,-35],[-13,-38],[-23,-42],[-34,-53],[-38,-57],
            [-47,-66],[-54,-68],[-54,-73],[-46,-75],[-33,-72],[-18,-71],[-14,-76],[-5,-81],[4,-77]
        ],
        // Европа (с Пиренеями, Италией, Балканами и Скандинавией)
        [
            [36,-9],[43,-9],[43,-2],[48,-5],[51,2],[54,8],[57,8],[55,12],[54,19],[58,22],[60,28],
            [65,25],[70,28],[71,25],[69,16],[62,5],[58,7],[60,11],[65,14],[60,18],[55,21],[50,30],
            [46,30],[44,28],[40,26],[38,24],[37,22],[40,20],[42,18],[45,14],[40,18],[38,15],[41,14],
            [44,8],[43,3],[37,-2]
        ],
        // Великобритания
        [
            [50,-5],[51,1],[55,-1],[58,-4],[57,-6],[52,-5]
        ],
        // Африка
        [
            [35,-6],[37,10],[33,11],[31,32],[22,37],[12,44],[12,51],[4,48],[-4,40],[-15,40],[-25,35],
            [-34,25],[-35,18],[-28,15],[-17,12],[-6,12],[4,9],[4,5],[6,-3],[5,-8],[11,-16],[15,-17],
            [21,-17],[28,-13]
        ],
        // Мадагаскар
        [
            [-12,49],[-16,50],[-25,47],[-25,44],[-16,44]
        ],
        // Евразия / Азия (с Аравией, Индией, Индокитаем, Камчаткой)
        [
            [70,30],[70,60],[73,80],[76,105],[72,130],[70,160],[66,178],[60,163],[52,157],[60,150],
            [54,140],[45,135],[39,128],[35,129],[38,125],[40,120],[35,120],[30,122],[22,114],[20,107],
            [12,109],[9,105],[1,104],[7,100],[13,98],[16,94],[22,91],[21,87],[16,82],[8,77],[15,73],
            [22,69],[25,67],[25,57],[22,59],[13,45],[18,41],[28,35],[31,34],[36,36],[37,27],[41,29],
            [42,41],[46,38],[50,30],[60,30]
        ],
        // Япония
        [
            [31,130],[35,140],[41,141],[44,145],[43,140],[36,136],[33,130]
        ],
        // Индонезия / Филиппины (основные острова)
        [
            [5,95],[-5,105],[-8,114],[-6,106],[2,99]
        ],
        [
            [2,109],[6,117],[1,118],[-3,115],[-3,110]
        ],
        // Австралия
        [
            [-12,131],[-11,142],[-18,146],[-26,153],[-35,151],[-38,145],[-35,136],[-32,128],
            [-34,115],[-26,113],[-21,114],[-15,124]
        ],
        // Новая Зеландия
        [
            [-35,173],[-38,178],[-46,168],[-44,167]
        ]
    ];

    // Алгоритм Ray-Casting: проверка, находится ли точка [lat, lon] внутри полигона
    function pointInPolygon(lat, lon, poly) {
        var inside = false;
        for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            var yi = poly[i][0], xi = poly[i][1];
            var yj = poly[j][0], xj = poly[j][1];
            var intersect = ((yi > lat) !== (yj > lat)) &&
                (lon < (xj - xi) * (lat - yi) / (yj - yi + 0.00001) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    function isLand(lat, lon) {
        for (var i = 0; i < landmasses.length; i++) {
            if (pointInPolygon(lat, lon, landmasses[i])) return true;
        }
        return false;
    }

    function latLonToVec3(lat, lon, r) {
        var phi = (90 - lat) * (Math.PI / 180);
        var theta = (lon + 180) * (Math.PI / 180);
        return {
            x: -r * Math.sin(phi) * Math.cos(theta),
            y:  r * Math.cos(phi),
            z:  r * Math.sin(phi) * Math.sin(theta)
        };
    }

    // Создаём круглую светящуюся текстуру для пикселя через 2D Canvas (без внешних файлов)
    function createDotTexture() {
        var c = document.createElement('canvas');
        c.width = 32;
        c.height = 32;
        var ctx = c.getContext('2d');
        var grad = ctx.createRadialGradient(16, 16, 2, 16, 16, 15);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.45, 'rgba(180, 240, 255, 0.85)');
        grad.addColorStop(1, 'rgba(0, 212, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 32, 32);
        return new THREE.CanvasTexture(c);
    }

    // ============================================
    // Построение сцены
    // ============================================
    scene = new THREE.Scene();
    globeGroup = new THREE.Group();
    globeGroup.position.y = 0.22; // приподнимаем шар над пьедесталом
    scene.add(globeGroup);

    // 1. Внутреннее тёмное ядро (перекрывает точки на задней стороне шара)
    var coreGeo = new THREE.SphereGeometry(radius * 0.985, 36, 36);
    var coreMat = new THREE.MeshBasicMaterial({
        color: 0x051024,
        transparent: true,
        opacity: 0.92
    });
    var coreMesh = new THREE.Mesh(coreGeo, coreMat);
    globeGroup.add(coreMesh);

    // 2. Атмосферная стеклянная оболочка (эффект Френеля по краям)
    var atmosGeo = new THREE.SphereGeometry(radius * 1.03, 40, 40);
    var atmosMat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: [
            'varying vec3 vNormal;',
            'varying vec3 vViewPosition;',
            'void main() {',
            '    vNormal = normalize(normalMatrix * normal);',
            '    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);',
            '    vViewPosition = -mvPosition.xyz;',
            '    gl_Position = projectionMatrix * mvPosition;',
            '}'
        ].join('\n'),
        fragmentShader: [
            'varying vec3 vNormal;',
            'varying vec3 vViewPosition;',
            'void main() {',
            '    vec3 viewDir = normalize(vViewPosition);',
            '    float rim = 1.0 - max(0.0, dot(vNormal, viewDir));',
            '    float glow = pow(rim, 2.6) * 0.85;',
            '    gl_FragColor = vec4(0.15, 0.78, 1.0, glow);',
            '}'
        ].join('\n')
    });
    var atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    globeGroup.add(atmosMesh);

    // 3. Генерация регулярной пиксельной сетки континентов
    var inlandPositions = [];
    var coastPositions = [];
    var latStep = 2.0;

    for (var lat = -58; lat <= 78; lat += latStep) {
        var cosLat = Math.max(0.22, Math.cos(lat * Math.PI / 180));
        var lonStep = latStep / cosLat;

        for (var lon = -180; lon < 180; lon += lonStep) {
            if (isLand(lat, lon)) {
                var pos = latLonToVec3(lat, lon, radius);
                // Проверяем соседей: если рядом вода — это яркая береговая точка
                var isCoast = !isLand(lat + latStep, lon) ||
                              !isLand(lat - latStep, lon) ||
                              !isLand(lat, lon + lonStep) ||
                              !isLand(lat, lon - lonStep);

                if (isCoast || Math.random() < 0.08) {
                    coastPositions.push(pos.x, pos.y, pos.z);
                } else {
                    inlandPositions.push(pos.x, pos.y, pos.z);
                }
            }
        }
    }

    var dotTexture = createDotTexture();

    // Внутренние точки материков (спокойный сине-голубой тон)
    var inlandGeo = new THREE.BufferGeometry();
    inlandGeo.setAttribute('position', new THREE.Float32BufferAttribute(inlandPositions, 3));
    var inlandMat = new THREE.PointsMaterial({
        color: 0x0ea5e9,
        size: 0.032,
        map: dotTexture,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    var inlandPoints = new THREE.Points(inlandGeo, inlandMat);
    globeGroup.add(inlandPoints);

    // Береговые точки и мегаполисы (яркий неон)
    var coastGeo = new THREE.BufferGeometry();
    coastGeo.setAttribute('position', new THREE.Float32BufferAttribute(coastPositions, 3));
    var coastMat = new THREE.PointsMaterial({
        color: 0xa5f3fc,
        size: 0.048,
        map: dotTexture,
        transparent: true,
        opacity: 0.98,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    var coastPoints = new THREE.Points(coastGeo, coastMat);
    globeGroup.add(coastPoints);

    // ============================================
    // 4. Голографический пьедестал и луч снизу
    // ============================================
    pedestalGroup = new THREE.Group();
    pedestalGroup.position.y = -0.92;
    scene.add(pedestalGroup);

    // Концентрические кольца проектора
    var ringConfigs = [
        { inner: 0.35, outer: 0.38, opacity: 0.8, color: 0x38bdf8 },
        { inner: 0.52, outer: 0.58, opacity: 0.45, color: 0x0284c7 },
        { inner: 0.72, outer: 0.75, opacity: 0.65, color: 0x38bdf8 },
        { inner: 0.92, outer: 0.94, opacity: 0.3, color: 0x60a5fa }
    ];

    var rings = [];
    ringConfigs.forEach(function (cfg) {
        var rGeo = new THREE.RingGeometry(cfg.inner, cfg.outer, 64);
        rGeo.rotateX(-Math.PI / 2);
        var rMat = new THREE.MeshBasicMaterial({
            color: cfg.color,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: cfg.opacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        var rMesh = new THREE.Mesh(rGeo, rMat);
        pedestalGroup.add(rMesh);
        rings.push(rMesh);
    });

    // Вертикальный световой луч от пьедестала к шару
    var beamGeo = new THREE.ConeGeometry(0.68, 0.9, 32, 1, true);
    var beamMat = new THREE.MeshBasicMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: 0.14,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    var beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.y = 0.4;
    beamMesh.rotation.x = Math.PI; // расширяется к шару
    pedestalGroup.add(beamMesh);

    // Парящие искры в луче проектора
    var dustCoords = [];
    for (var d = 0; d < 45; d++) {
        var angle = Math.random() * Math.PI * 2;
        var dist = Math.random() * 0.55;
        dustCoords.push(
            Math.cos(angle) * dist,
            -0.9 + Math.random() * 0.85,
            Math.sin(angle) * dist
        );
    }
    var dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(dustCoords, 3));
    var dustMat = new THREE.PointsMaterial({
        color: 0x7dd3fc,
        size: 0.028,
        map: dotTexture,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    dustSystem = new THREE.Points(dustGeo, dustMat);
    scene.add(dustSystem);

    // ============================================
    // Камера и Рендерер
    // ============================================
    var width = container.clientWidth || 320;
    var height = container.clientHeight || 180;

    camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.25, 3.35);
    camera.lookAt(0, -0.05, 0);

    renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // ============================================
    // Адаптивность и остановка вне экрана
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
    // Анимация
    // ============================================
    function animate() {
        animId = requestAnimationFrame(animate);

        if (!isPaused && !prefersReducedMotion) {
            globeGroup.rotation.y += 0.0035;
            dustSystem.rotation.y -= 0.002;
        }

        renderer.render(scene, camera);
    }

    animate();

    // ============================================
    // API управления и очистки памяти
    // ============================================
    window.globeAPI = {
        pause: function () { isPaused = true; },
        resume: function () { isPaused = false; },
    destroy: function () {
        if (animId) cancelAnimationFrame(animId);
        observer.disconnect();
        window.removeEventListener('resize', onResize);
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
            coreGeo.dispose();
            coreMat.dispose();
            atmosGeo.dispose();
            atmosMat.dispose();
            inlandGeo.dispose();
            inlandMat.dispose();
            coastGeo.dispose();
            coastMat.dispose();
            beamGeo.dispose();
            beamMat.dispose();
            dustGeo.dispose();
            dustMat.dispose();
            dotTexture.dispose();
            rings.forEach(function (r) {
                r.geometry.dispose();
                r.material.dispose();
            });
            renderer.dispose();
        }
    };
})();