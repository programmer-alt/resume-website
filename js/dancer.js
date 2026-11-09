/* ============================================
   GLOBAL AUCTION MARKETPLACE — Dancing Cyber Stick Figure
   Three.js r128 — ТЕКТОНИКА + JUMPSTYLE + TECKTONIK KILLER
   v5: правильные пропорции (руки короче ног), killer-режим
   ============================================ */

(function () {
    'use strict';

    var container = document.getElementById('crystal-container');
    if (!container || typeof THREE === 'undefined') return;

    var scene, camera, renderer, dancerGroup, shadowMesh, particles;
    var animId = null;
    var isPaused = false;
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isHovered = false;

    // Listen for runtime changes to the reduced-motion preference
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function (e) {
        prefersReducedMotion = e.matches;
    });

    // ============================================
    // ПРОПОРЦИИ (ключевое!)
    // Шея y=1.05, hip y=0.25
    // Рука: шея → локоть (0.3) → кисть (0.27) → wrist (0.13)  ≈ 0.70
    // Нога: hip → колено (0.32) → стопа (0.5)                  ≈ 0.82
    // Рука КОРОЧЕ ноги. Голова большая, конечности тонкие.
    // ============================================

    // ============================================
    // ТЕКТОНИКА — 16 поз
    // ============================================
    var poses = [
        { // 0 — крест: руки горизонтально, кисти вверх
            head: [0, 1.35, 0], neck: [0, 1.05, 0], hip: [0, 0.25, 0],
            lElbow: [-0.3, 1.05, 0], lHand: [-0.57, 1.05, 0], lWrist: [-0.7, 1.18, 0.1],
            rElbow: [0.3, 1.05, 0], rHand: [0.57, 1.05, 0], rWrist: [0.7, 1.18, 0.1],
            lKnee: [-0.1, -0.07, 0], lFoot: [-0.15, -0.55, 0],
            rKnee: [0.1, -0.07, 0], rFoot: [0.15, -0.55, 0]
        },
        { // 1 — рубанул вправо-вверх
            head: [0.05, 1.35, 0], neck: [0.02, 1.05, 0], hip: [0, 0.25, 0],
            lElbow: [-0.25, 0.75, 0], lHand: [-0.4, 0.5, 0], lWrist: [-0.5, 0.32, 0.08],
            rElbow: [0.28, 1.28, 0], rHand: [0.5, 1.48, 0], rWrist: [0.62, 1.62, 0.1],
            lKnee: [-0.1, -0.07, 0], lFoot: [-0.15, -0.55, 0],
            rKnee: [0.1, -0.07, 0], rFoot: [0.15, -0.55, 0]
        },
        { // 2 — зеркало
            head: [-0.05, 1.35, 0], neck: [-0.02, 1.05, 0], hip: [0, 0.25, 0],
            lElbow: [-0.28, 1.28, 0], lHand: [-0.5, 1.48, 0], lWrist: [-0.62, 1.62, 0.1],
            rElbow: [0.25, 0.75, 0], rHand: [0.4, 0.5, 0], rWrist: [0.5, 0.32, 0.08],
            lKnee: [-0.1, -0.07, 0], lFoot: [-0.15, -0.55, 0],
            rKnee: [0.1, -0.07, 0], rFoot: [0.15, -0.55, 0]
        },
        { // 3 — ножницы
            head: [0, 1.35, 0], neck: [0, 1.05, 0], hip: [0, 0.25, 0],
            lElbow: [-0.18, 1.0, 0.08], lHand: [0.1, 1.12, 0.2], lWrist: [0.28, 1.2, 0.25],
            rElbow: [0.18, 1.0, 0.08], rHand: [-0.1, 1.12, 0.2], rWrist: [-0.28, 1.2, 0.25],
            lKnee: [-0.1, -0.07, 0], lFoot: [-0.15, -0.55, 0],
            rKnee: [0.1, -0.07, 0], rFoot: [0.15, -0.55, 0]
        },
        { // 4 — стрела вправо
            head: [0.08, 1.35, 0], neck: [0.04, 1.05, 0], hip: [0.03, 0.25, 0],
            lElbow: [0.12, 1.12, 0.12], lHand: [0.4, 1.12, 0.16], lWrist: [0.58, 1.12, 0.18],
            rElbow: [0.28, 0.9, 0.08], rHand: [0.55, 0.9, 0.12], rWrist: [0.72, 0.9, 0.14],
            lKnee: [-0.08, -0.07, 0], lFoot: [-0.15, -0.55, 0],
            rKnee: [0.15, -0.05, 0], rFoot: [0.22, -0.55, 0]
        },
        { // 5 — зеркало
            head: [-0.08, 1.35, 0], neck: [-0.04, 1.05, 0], hip: [-0.03, 0.25, 0],
            lElbow: [-0.28, 0.9, 0.08], lHand: [-0.55, 0.9, 0.12], lWrist: [-0.72, 0.9, 0.14],
            rElbow: [-0.12, 1.12, 0.12], rHand: [-0.4, 1.12, 0.16], rWrist: [-0.58, 1.12, 0.18],
            lKnee: [-0.15, -0.05, 0], lFoot: [-0.22, -0.55, 0],
            rKnee: [0.08, -0.07, 0], rFoot: [0.15, -0.55, 0]
        },
        { // 6 — крылья
            head: [0, 1.4, 0], neck: [0, 1.08, 0], hip: [0, 0.25, 0],
            lElbow: [-0.28, 1.3, 0], lHand: [-0.45, 1.45, 0], lWrist: [-0.42, 1.6, 0],
            rElbow: [0.28, 1.3, 0], rHand: [0.45, 1.45, 0], rWrist: [0.42, 1.6, 0],
            lKnee: [-0.1, -0.07, 0], lFoot: [-0.15, -0.55, 0],
            rKnee: [0.1, -0.07, 0], rFoot: [0.15, -0.55, 0]
        },
        { // 7 — бокс
            head: [0, 1.35, 0], neck: [0, 1.05, 0], hip: [0, 0.25, 0],
            lElbow: [-0.22, 1.02, 0.1], lHand: [-0.1, 1.15, 0.22], lWrist: [0.05, 1.22, 0.26],
            rElbow: [0.22, 1.02, 0.1], rHand: [0.1, 1.15, 0.22], rWrist: [-0.05, 1.22, 0.26],
            lKnee: [-0.12, -0.07, 0], lFoot: [-0.15, -0.55, 0],
            rKnee: [0.12, -0.07, 0], rFoot: [0.15, -0.55, 0]
        },
        { // 8 — правая вверх, левая на пояс
            head: [0.05, 1.35, 0], neck: [0.02, 1.05, 0], hip: [0, 0.25, 0],
            lElbow: [-0.3, 0.72, 0], lHand: [-0.28, 0.48, 0], lWrist: [-0.24, 0.38, 0],
            rElbow: [0.25, 1.3, 0], rHand: [0.32, 1.55, 0], rWrist: [0.35, 1.72, 0.08],
            lKnee: [-0.1, -0.07, 0], lFoot: [-0.15, -0.55, 0],
            rKnee: [0.15, -0.03, 0], rFoot: [0.2, -0.55, 0]
        },
        { // 9 — зеркало
            head: [-0.05, 1.35, 0], neck: [-0.02, 1.05, 0], hip: [0, 0.25, 0],
            lElbow: [-0.25, 1.3, 0], lHand: [-0.32, 1.55, 0], lWrist: [-0.35, 1.72, 0.08],
            rElbow: [0.3, 0.72, 0], rHand: [0.28, 0.48, 0], rWrist: [0.24, 0.38, 0],
            lKnee: [-0.15, -0.03, 0], lFoot: [-0.2, -0.55, 0],
            rKnee: [0.1, -0.07, 0], rFoot: [0.15, -0.55, 0]
        },
        { // 10 — точка вверх
            head: [0, 1.45, 0], neck: [0, 1.12, 0], hip: [0, 0.25, 0],
            lElbow: [-0.15, 1.36, 0], lHand: [-0.18, 1.62, 0], lWrist: [-0.18, 1.78, 0],
            rElbow: [0.15, 1.36, 0], rHand: [0.18, 1.62, 0], rWrist: [0.18, 1.78, 0],
            lKnee: [-0.1, -0.07, 0], lFoot: [-0.15, -0.55, 0],
            rKnee: [0.1, -0.07, 0], rFoot: [0.15, -0.55, 0]
        },
        { // 11 — волна вправо-вниз
            head: [0.15, 1.3, 0], neck: [0.07, 1.0, 0], hip: [0.05, 0.25, 0],
            lElbow: [0.15, 1.1, 0.12], lHand: [0.45, 0.95, 0.16], lWrist: [0.6, 0.82, 0.18],
            rElbow: [0.38, 0.85, 0.08], rHand: [0.65, 0.68, 0.12], rWrist: [0.8, 0.55, 0.14],
            lKnee: [-0.08, -0.07, 0], lFoot: [-0.15, -0.55, 0],
            rKnee: [0.18, -0.05, 0], rFoot: [0.25, -0.55, 0]
        },
        { // 12 — восьмёрка
            head: [-0.1, 1.35, 0.05], neck: [-0.05, 1.05, 0.03], hip: [0.05, 0.25, 0],
            lElbow: [-0.3, 1.22, -0.12], lHand: [-0.42, 1.45, -0.16], lWrist: [-0.46, 1.6, -0.18],
            rElbow: [0.25, 0.8, 0.15], rHand: [0.38, 0.58, 0.22], rWrist: [0.46, 0.42, 0.26],
            lKnee: [-0.1, -0.07, 0], lFoot: [-0.15, -0.55, 0],
            rKnee: [0.1, -0.07, 0], rFoot: [0.15, -0.55, 0]
        },
        { // 13 — зеркало
            head: [0.1, 1.35, 0.05], neck: [0.05, 1.05, 0.03], hip: [-0.05, 0.25, 0],
            lElbow: [-0.25, 0.8, 0.15], lHand: [-0.38, 0.58, 0.22], lWrist: [-0.46, 0.42, 0.26],
            rElbow: [0.3, 1.22, -0.12], rHand: [0.42, 1.45, -0.16], rWrist: [0.46, 1.6, -0.18],
            lKnee: [-0.1, -0.07, 0], lFoot: [-0.15, -0.55, 0],
            rKnee: [0.1, -0.07, 0], rFoot: [0.15, -0.55, 0]
        },
        { // 14 — пистолет
            head: [0, 1.35, 0], neck: [0, 1.05, 0], hip: [0, 0.25, 0],
            lElbow: [-0.2, 1.02, 0], lHand: [-0.12, 1.15, 0.15], lWrist: [-0.08, 1.22, 0.2],
            rElbow: [0.25, 1.08, 0.2], rHand: [0.3, 1.15, 0.42], rWrist: [0.3, 1.15, 0.58],
            lKnee: [-0.1, -0.07, 0], lFoot: [-0.15, -0.55, 0],
            rKnee: [0.12, -0.05, 0], rFoot: [0.18, -0.55, 0]
        },
        { // 15 — стоп-кадр
            head: [0, 1.3, 0], neck: [0, 1.0, 0], hip: [0, 0.25, 0],
            lElbow: [-0.3, 0.78, 0], lHand: [-0.42, 0.58, 0], lWrist: [-0.55, 0.55, 0.08],
            rElbow: [0.3, 0.78, 0], rHand: [0.42, 0.58, 0], rWrist: [0.55, 0.55, 0.08],
            lKnee: [-0.12, -0.06, 0], lFoot: [-0.18, -0.55, 0],
            rKnee: [0.12, -0.06, 0], rFoot: [0.18, -0.55, 0]
        }
    ];

    // ============================================
    // TECKTONIK KILLER — 8 поз-«ударов»
    // Характер: диагональные «рубленые» линии, резкие залипоны,
    // плечо ведёт руку, кисти как лезвия
    // ============================================
    var killerPoses = [
        // K0 — «крест-выпад»: правая рука диагональ вниз-вправо, левая вверх-влево
        {
            head: [-0.05, 1.35, 0], neck: [-0.02, 1.05, 0], hip: [0, 0.25, 0],
            lElbow: [-0.28, 1.28, 0], lHand: [-0.48, 1.48, 0], lWrist: [-0.6, 1.62, 0.1],
            rElbow: [0.28, 0.75, 0], rHand: [0.48, 0.5, 0], rWrist: [0.6, 0.32, 0.1],
            lKnee: [-0.15, -0.05, 0], lFoot: [-0.22, -0.55, 0],
            rKnee: [0.12, -0.08, 0], rFoot: [0.18, -0.55, 0]
        },
        // K1 — «крюк»: правая рука согнута у груди, левая выброшена вперёд-вверх
        {
            head: [0.05, 1.35, 0.05], neck: [0.02, 1.05, 0.03], hip: [0, 0.25, 0],
            lElbow: [-0.18, 1.22, 0.18], lHand: [-0.05, 1.35, 0.42], lWrist: [0.05, 1.4, 0.58],
            rElbow: [0.28, 1.05, 0.05], rHand: [0.32, 1.18, 0.22], rWrist: [0.32, 1.28, 0.32],
            lKnee: [-0.1, -0.07, 0], lFoot: [-0.15, -0.55, 0],
            rKnee: [0.12, -0.05, 0], rFoot: [0.18, -0.55, 0]
        },
        // K2 — «двойной выброс»: обе руки диагональ влево-вверх, корпус скручен
        {
            head: [-0.12, 1.32, 0.06], neck: [-0.06, 1.02, 0.03], hip: [0.05, 0.25, 0],
            lElbow: [-0.35, 1.22, -0.12], lHand: [-0.52, 1.42, -0.16], lWrist: [-0.62, 1.52, -0.18],
            rElbow: [-0.15, 1.12, -0.06], rHand: [-0.35, 1.28, -0.1], rWrist: [-0.48, 1.38, -0.12],
            lKnee: [-0.12, -0.05, 0], lFoot: [-0.18, -0.55, 0],
            rKnee: [0.1, -0.08, 0], rFoot: [0.15, -0.55, 0]
        },
        // K3 — «низкий блок»: обе руки вниз-вправо, корпус наклонён
        {
            head: [0.12, 1.28, 0], neck: [0.06, 0.98, 0], hip: [0.05, 0.22, 0],
            lElbow: [0.15, 0.82, 0.08], lHand: [0.32, 0.62, 0.12], lWrist: [0.42, 0.5, 0.14],
            rElbow: [0.32, 0.85, 0.08], rHand: [0.5, 0.65, 0.12], rWrist: [0.6, 0.52, 0.14],
            lKnee: [-0.1, -0.08, 0], lFoot: [-0.15, -0.55, 0],
            rKnee: [0.15, -0.03, 0], rFoot: [0.22, -0.55, 0]
        },
        // K4 — «выпад вверх»: обе руки строго вверх-в стороны, кисти-крюки
        {
            head: [0, 1.42, 0], neck: [0, 1.1, 0], hip: [0, 0.28, 0],
            lElbow: [-0.22, 1.38, 0], lHand: [-0.35, 1.58, 0], lWrist: [-0.32, 1.72, 0],
            rElbow: [0.22, 1.38, 0], rHand: [0.35, 1.58, 0], rWrist: [0.32, 1.72, 0],
            lKnee: [-0.13, -0.04, 0], lFoot: [-0.18, -0.55, 0],
            rKnee: [0.13, -0.04, 0], rFoot: [0.18, -0.55, 0]
        },
        // K5 — «крест-залипон»: руки строго горизонтально, кисти крюк вниз
        {
            head: [0, 1.35, 0], neck: [0, 1.05, 0], hip: [0, 0.25, 0],
            lElbow: [-0.32, 1.05, 0], lHand: [-0.58, 1.05, 0], lWrist: [-0.72, 0.95, 0.08],
            rElbow: [0.32, 1.05, 0], rHand: [0.58, 1.05, 0], rWrist: [0.72, 0.95, 0.08],
            lKnee: [-0.1, -0.07, 0], lFoot: [-0.15, -0.55, 0],
            rKnee: [0.1, -0.07, 0], rFoot: [0.15, -0.55, 0]
        },
        // K6 — «диагональ-молния»: правая вверх-назад, левая вперёд-вниз
        {
            head: [-0.08, 1.35, 0.05], neck: [-0.04, 1.05, 0.03], hip: [0.04, 0.25, 0],
            lElbow: [0.15, 0.85, 0.15], lHand: [0.3, 0.65, 0.3], lWrist: [0.35, 0.5, 0.42],
            rElbow: [-0.28, 1.28, -0.12], rHand: [-0.42, 1.5, -0.18], rWrist: [-0.48, 1.62, -0.2],
            lKnee: [-0.1, -0.08, 0], lFoot: [-0.15, -0.55, 0],
            rKnee: [0.13, -0.04, 0], rFoot: [0.18, -0.55, 0]
        },
        // K7 — «финал»: обе руки внизу-в стороны, кисти-крюки вверх
        {
            head: [0, 1.3, 0], neck: [0, 1.0, 0], hip: [0, 0.22, 0],
            lElbow: [-0.32, 0.75, 0], lHand: [-0.42, 0.52, 0], lWrist: [-0.4, 0.38, 0.1],
            rElbow: [0.32, 0.75, 0], rHand: [0.42, 0.52, 0], rWrist: [0.4, 0.38, 0.1],
            lKnee: [-0.15, -0.06, 0], lFoot: [-0.22, -0.55, 0],
            rKnee: [0.15, -0.06, 0], rFoot: [0.22, -0.55, 0]
        }
    ];

    // ============================================
    // JUMPSTYLE — 4 прыжка (пропорции обновлены)
    // ============================================
    var jumpPoses = [
        // J0 — front-kick: правая нога вперёд, руки назад
        {
            head: [0, 1.55, 0.1], neck: [0, 1.25, 0.05], hip: [0, 0.5, 0],
            lElbow: [-0.25, 1.12, -0.15], lHand: [-0.35, 0.92, -0.28], lWrist: [-0.4, 0.78, -0.36],
            rElbow: [0.25, 1.12, -0.15], rHand: [0.35, 0.92, -0.28], rWrist: [0.4, 0.78, -0.36],
            lKnee: [-0.12, 0.28, 0], lFoot: [-0.15, 0.08, 0],
            rKnee: [0.18, 0.32, 0.32], rFoot: [0.22, 0.18, 0.65]
        },
        // J1 — back-kick: левая нога назад, корпус вперёд
        {
            head: [0, 1.5, -0.15], neck: [0, 1.2, -0.08], hip: [0, 0.45, 0],
            lElbow: [-0.3, 1.18, 0.15], lHand: [-0.45, 1.32, 0.24], lWrist: [-0.55, 1.4, 0.3],
            rElbow: [0.3, 1.18, 0.15], rHand: [0.45, 1.32, 0.24], rWrist: [0.55, 1.4, 0.3],
            lKnee: [-0.18, 0.32, -0.32], lFoot: [-0.22, 0.18, -0.65],
            rKnee: [0.12, 0.28, 0], rFoot: [0.15, 0.08, 0]
        },
        // J2 — side-kick левой: левая в сторону, руки вправо-вверх
        {
            head: [0.1, 1.5, 0], neck: [0.05, 1.2, 0], hip: [0.05, 0.45, 0],
            lElbow: [0.12, 1.12, 0], lHand: [0.32, 1.18, 0], lWrist: [0.45, 1.26, 0.08],
            rElbow: [0.32, 1.32, 0], rHand: [0.5, 1.5, 0], rWrist: [0.58, 1.62, 0.1],
            lKnee: [-0.5, 0.28, 0], lFoot: [-0.78, 0.18, 0],
            rKnee: [0.12, 0.28, 0], rFoot: [0.15, 0.08, 0]
        },
        // J3 — side-kick правой: правая в сторону, руки влево-вверх
        {
            head: [-0.1, 1.5, 0], neck: [-0.05, 1.2, 0], hip: [-0.05, 0.45, 0],
            lElbow: [-0.32, 1.32, 0], lHand: [-0.5, 1.5, 0], lWrist: [-0.58, 1.62, 0.1],
            rElbow: [-0.12, 1.12, 0], rHand: [-0.32, 1.18, 0], rWrist: [-0.45, 1.26, 0.08],
            lKnee: [-0.12, 0.28, 0], lFoot: [-0.15, 0.08, 0],
            rKnee: [0.5, 0.28, 0], rFoot: [0.78, 0.18, 0]
        }
    ];

    // Приземление — «пружинка»
    var landingPose = {
        head: [0, 1.15, 0], neck: [0, 0.85, 0], hip: [0, 0.1, 0],
        lElbow: [-0.25, 0.68, -0.12], lHand: [-0.38, 0.5, -0.2], lWrist: [-0.48, 0.38, -0.24],
        rElbow: [0.25, 0.68, -0.12], rHand: [0.38, 0.5, -0.2], rWrist: [0.48, 0.38, -0.24],
        lKnee: [-0.18, -0.15, 0], lFoot: [-0.24, -0.55, 0],
        rKnee: [0.18, -0.15, 0], rFoot: [0.24, -0.55, 0]
    };

    // ============================================
    // Easing
    // ============================================
    function easeOutExpo(x) {
        return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    }
    function lerp(a, b, t) { return a + (b - a) * t; }

    // ============================================
    // Сцена
    // ============================================
    scene = new THREE.Scene();
    var width = container.clientWidth || 320;
    var height = container.clientHeight || 180;

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 4.2);
    camera.lookAt(0, 0.5, 0);

    renderer = new THREE.WebGLRenderer({
        alpha: true, antialias: true, powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // ============================================
    // Человечек
    // ============================================
    dancerGroup = new THREE.Group();
    scene.add(dancerGroup);

    var bodyMat = new THREE.LineBasicMaterial({
        color: 0x3b82f6, transparent: true, opacity: 0.95
    });
    var glowMat = new THREE.LineBasicMaterial({
        color: 0x8b5cf6, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending
    });

    var segments = [
        ['head', 'neck'], ['neck', 'hip'],
        ['neck', 'lElbow'], ['lElbow', 'lHand'], ['lHand', 'lWrist'],
        ['neck', 'rElbow'], ['rElbow', 'rHand'], ['rHand', 'rWrist'],
        ['hip', 'lKnee'], ['lKnee', 'lFoot'],
        ['hip', 'rKnee'], ['rKnee', 'rFoot']
    ];

    var lines = [];
    segments.forEach(function (seg) {
        var geo = new THREE.BufferGeometry();
        var positions = new Float32Array(6);
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        var line = new THREE.Line(geo, bodyMat);
        dancerGroup.add(line);
        var glowLine = new THREE.Line(geo, glowMat);
        dancerGroup.add(glowLine);
        lines.push({ line: line, glow: glowLine, from: seg[0], to: seg[1] });
    });

    var jointNames = [
        'head', 'neck', 'hip',
        'lElbow', 'lHand', 'lWrist',
        'rElbow', 'rHand', 'rWrist',
        'lKnee', 'lFoot', 'rKnee', 'rFoot'
    ];
    var joints = {};

    var headGeo = new THREE.SphereGeometry(0.08, 12, 12);
    var headMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    var jointGeo = new THREE.SphereGeometry(0.02, 6, 6);
    var jointMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    var wristGeo = new THREE.SphereGeometry(0.03, 8, 8);
    var wristMat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6 });

    jointNames.forEach(function (name) {
        var geo, mat;
        if (name === 'head') { geo = headGeo; mat = headMat; }
        else if (name === 'lWrist' || name === 'rWrist') { geo = wristGeo; mat = wristMat; }
        else { geo = jointGeo; mat = jointMat; }
        var mesh = new THREE.Mesh(geo, mat);
        dancerGroup.add(mesh);
        joints[name] = mesh;
    });

    // Тень
    var shadowGeo = new THREE.CircleGeometry(0.4, 16);
    var shadowMat = new THREE.MeshBasicMaterial({
        color: 0x3b82f6, transparent: true, opacity: 0.15
    });
    shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -0.58;
    scene.add(shadowMesh);

    // ============================================
    // Частицы
    // ============================================
    var particleCount = 30;
    var particleGeo = new THREE.BufferGeometry();
    var pPositions = new Float32Array(particleCount * 3);
    var pVelocities = [];
    for (var i = 0; i < particleCount; i++) {
        pPositions[i * 3] = (Math.random() - 0.5) * 2;
        pPositions[i * 3 + 1] = (Math.random() - 0.5) * 2;
        pPositions[i * 3 + 2] = (Math.random() - 0.5) * 2;
        pVelocities.push({
            x: (Math.random() - 0.5) * 0.005,
            y: Math.random() * 0.005 + 0.002,
            z: (Math.random() - 0.5) * 0.005
        });
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    var particleMat = new THREE.PointsMaterial({
        color: 0x38bdf8, size: 0.03, transparent: true, opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ============================================
    // Анимация
    // ============================================
    var currentPoseIdx = 0;
    var nextPoseIdx = 0;
    var isMoving = false;
    var phaseTime = 0;
    var beatClock = 0;
    var lastTime = performance.now();
    var hitPulse = 0;

    var HOLD_TIME = 0.32;
    var MOVE_TIME = 0.07;

    // Режимы: 'tecktonik' → 'killer' → 'jumpstyle' → снова tecktonik
    var TECKTONIK_ROUNDS = 16;
    var KILLER_ROUNDS = 8;
    var tecktonikCounter = 0;
    var killerCounter = 0;
    var mode = 'tecktonik';
    var killerIdx = 0;
    var jumpPhase = 0;
    var jumpState = 'air';
    var jumpStateTime = 0;

    var JUMP_AIR_TIME = 0.22;
    var JUMP_LAND_TIME = 0.10;

    var jointKeys = [
        'head', 'neck', 'hip',
        'lElbow', 'lHand', 'lWrist',
        'rElbow', 'rHand', 'rWrist',
        'lKnee', 'lFoot', 'rKnee', 'rFoot'
    ];

    function applyPoseBlend(from, to, tt) {
        for (var k = 0; k < jointKeys.length; k++) {
            var key = jointKeys[k];
            var fv = from[key], tv = to[key];
            joints[key].position.set(
                lerp(fv[0], tv[0], tt),
                lerp(fv[1], tv[1], tt),
                lerp(fv[2], tv[2], tt)
            );
        }
    }

    function updateLines() {
        for (var s = 0; s < lines.length; s++) {
            var seg = lines[s];
            var fp = joints[seg.from].position;
            var tp = joints[seg.to].position;
            var attr = seg.line.geometry.getAttribute('position');
            attr.setXYZ(0, fp.x, fp.y, fp.z);
            attr.setXYZ(1, tp.x, tp.y, tp.z);
            attr.needsUpdate = true;
        }
    }

    function animate(now) {
        animId = requestAnimationFrame(animate);

        var rawDt = (now - lastTime) / 1000;
        lastTime = now;
        var dt = Math.min(rawDt, 0.05);

        if (!isPaused && !prefersReducedMotion) {
            var speedMul = isHovered ? 1.4 : 1.0;
            var scaledDt = dt * speedMul;
            beatClock += scaledDt;

            if (hitPulse > 0) hitPulse = Math.max(0, hitPulse - dt * 12);

            // ============================================
            // ТЕКТОНИКА
            // ============================================
            if (mode === 'tecktonik') {
                phaseTime += scaledDt;
                var duration = isMoving ? MOVE_TIME : HOLD_TIME;

                if (phaseTime >= duration) {
                    phaseTime = 0;
                    if (isMoving) {
                        currentPoseIdx = nextPoseIdx;
                        isMoving = false;
                        tecktonikCounter++;
                        if (tecktonikCounter >= TECKTONIK_ROUNDS) {
                            mode = 'killer';
                            tecktonikCounter = 0;
                            killerCounter = 0;
                            killerIdx = 0;
                            phaseTime = 0;
                            isMoving = false;
                            currentPoseIdx = 0;
                            nextPoseIdx = 0;
                        }
                    } else {
                        nextPoseIdx = (nextPoseIdx + 1) % poses.length;
                        isMoving = true;
                        hitPulse = 1;
                    }
                }

                var t = phaseTime / duration;
                var from, to, tt;
                if (isMoving) {
                    from = poses[currentPoseIdx];
                    to = poses[nextPoseIdx];
                    tt = easeOutExpo(t);
                } else {
                    from = poses[currentPoseIdx];
                    to = poses[currentPoseIdx];
                    tt = 0;
                }

                applyPoseBlend(from, to, tt);

                for (var k = 0; k < jointKeys.length; k++) {
                    joints[jointKeys[k]].position.y += Math.sin(beatClock * 14 + k * 1.3) * 0.003;
                }

                var beat = beatClock * 2.13;
                var beatPulse = Math.pow(Math.max(0, Math.sin(beat * Math.PI)), 4);
                var hitOffset = hitPulse * 0.04;
                dancerGroup.position.y = -0.02 + beatPulse * 0.03 + hitOffset;
                dancerGroup.position.z = hitPulse * -0.05;
                dancerGroup.rotation.z = Math.sin(beat * Math.PI * 0.5) * 0.02;
                var sy = 1 + beatPulse * 0.05 + hitPulse * 0.03;
                var sx = 1 - beatPulse * 0.03 - hitPulse * 0.02;
                dancerGroup.scale.set(sx, sy, sx);

                var shadowScale = 1 + beatPulse * 0.2 + hitPulse * 0.15;
                shadowMesh.scale.set(shadowScale, shadowScale, 1);
                shadowMat.opacity = 0.15 - beatPulse * 0.05;
            }
            // ============================================
            // TECKTONIK KILLER
            // ============================================
            else if (mode === 'killer') {
                phaseTime += scaledDt;
                // Killer резче: короче залипон, ещё быстрее переход
                var KILLER_HOLD = 0.22;
                var KILLER_MOVE = 0.05;
                var kDuration = isMoving ? KILLER_MOVE : KILLER_HOLD;

                if (phaseTime >= kDuration) {
                    phaseTime = 0;
                    if (isMoving) {
                        killerIdx = (killerIdx + 1) % killerPoses.length;
                        isMoving = false;
                        killerCounter++;
                        if (killerCounter >= KILLER_ROUNDS) {
                            mode = 'jumpstyle';
                            killerCounter = 0;
                            jumpPhase = 0;
                            jumpState = 'air';
                            jumpStateTime = 0;
                        }
                    } else {
                        isMoving = true;
                        hitPulse = 1;
                    }
                }

                var kt = phaseTime / kDuration;
                var kFrom, kTo, kTt;
                if (isMoving) {
                    kFrom = killerPoses[killerIdx];
                    kTo = killerPoses[(killerIdx + 1) % killerPoses.length];
                    // Ещё более резкий easing
                    kTt = easeOutExpo(Math.min(kt * 1.5, 1));
                } else {
                    kFrom = killerPoses[killerIdx];
                    kTo = killerPoses[killerIdx];
                    kTt = 0;
                }

                applyPoseBlend(kFrom, kTo, kTt);

                // «Хлёсткие» микро-удары в залипоне
                for (var kk = 0; kk < jointKeys.length; kk++) {
                    joints[jointKeys[kk]].position.x += Math.sin(beatClock * 20 + kk) * 0.002;
                }

                var kBeat = beatClock * 2.4; // чуть быстрее BPM
                var kPulse = Math.pow(Math.max(0, Math.sin(kBeat * Math.PI)), 5);
                var kHit = hitPulse * 0.06;
                dancerGroup.position.y = -0.02 + kPulse * 0.02 + kHit;
                dancerGroup.position.z = hitPulse * -0.08;
                dancerGroup.rotation.z = Math.sin(kBeat * Math.PI * 0.5) * 0.03;
                var ksy = 1 + kPulse * 0.04 + hitPulse * 0.05;
                var ksx = 1 - kPulse * 0.02 - hitPulse * 0.03;
                dancerGroup.scale.set(ksx, ksy, ksx);

                shadowMesh.scale.set(1 + kPulse * 0.15 + hitPulse * 0.2, 1 + kPulse * 0.15 + hitPulse * 0.2, 1);
                shadowMat.opacity = 0.15 - kPulse * 0.04;
            }
            // ============================================
            // JUMPSTYLE
            // ============================================
            else {
                jumpStateTime += scaledDt;

                if (jumpState === 'air') {
                    if (jumpStateTime >= JUMP_AIR_TIME) {
                        jumpStateTime = 0;
                        jumpState = 'landing';
                    }
                } else if (jumpState === 'landing') {
                    if (jumpStateTime >= JUMP_LAND_TIME) {
                        jumpStateTime = 0;
                        jumpState = 'air';
                        jumpPhase++;
                        if (jumpPhase >= jumpPoses.length) {
                            mode = 'tecktonik';
                            jumpPhase = 0;
                            tecktonikCounter = 0;
                            phaseTime = 0;
                            isMoving = false;
                            currentPoseIdx = 0;
                            nextPoseIdx = 0;
                        }
                    }
                }

                if (mode === 'jumpstyle') {
                    if (jumpState === 'air') {
                        var target = jumpPoses[jumpPhase];
                        var tAir = jumpStateTime / JUMP_AIR_TIME;
                        var ttAir = easeOutExpo(Math.min(tAir * 3, 1));
                        applyPoseBlend(landingPose, target, ttAir);

                        dancerGroup.position.y = Math.sin(tAir * Math.PI) * 0.35 + 0.05;
                        if (jumpPhase === 0) dancerGroup.rotation.x = 0.15;
                        else if (jumpPhase === 1) dancerGroup.rotation.x = -0.1;
                        else dancerGroup.rotation.x = 0;
                        if (jumpPhase === 2) dancerGroup.rotation.z = -0.15;
                        else if (jumpPhase === 3) dancerGroup.rotation.z = 0.15;
                        else dancerGroup.rotation.z = 0;
                        dancerGroup.position.z = 0;
                        dancerGroup.scale.set(0.97, 1.03, 0.97);

                        shadowMesh.scale.set(0.6, 0.6, 1);
                        shadowMat.opacity = 0.08;
                    } else {
                        var tLand = jumpStateTime / JUMP_LAND_TIME;
                        applyPoseBlend(jumpPoses[jumpPhase], landingPose, easeOutExpo(tLand));

                        dancerGroup.position.y = -0.05 - (1 - tLand) * 0.08;
                        dancerGroup.rotation.x = 0;
                        dancerGroup.rotation.z = 0;
                        dancerGroup.position.z = 0;

                        var squash = 1 - tLand;
                        dancerGroup.scale.set(1 + squash * 0.08, 1 - squash * 0.12, 1 + squash * 0.08);

                        shadowMesh.scale.set(1 + (1 - tLand) * 0.3, 1 + (1 - tLand) * 0.3, 1);
                        shadowMat.opacity = 0.15;
                    }
                }
            }

            updateLines();

            // Частицы
            var pPos = particles.geometry.getAttribute('position');
            for (var pi = 0; pi < particleCount; pi++) {
                pPos.setX(pi, pPos.getX(pi) + pVelocities[pi].x * 1.5);
                pPos.setY(pi, pPos.getY(pi) + pVelocities[pi].y * 1.5);
                pPos.setZ(pi, pPos.getZ(pi) + pVelocities[pi].z * 1.5);
                if (pPos.getY(pi) > 1.5) {
                    pPos.setY(pi, -1);
                    pPos.setX(pi, (Math.random() - 0.5) * 2);
                    pPos.setZ(pi, (Math.random() - 0.5) * 2);
                }
            }
            pPos.needsUpdate = true;
        }

        renderer.render(scene, camera);
    }

    animId = requestAnimationFrame(animate);

    // ============================================
    // Resize + Hover + IntersectionObserver
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

    container.addEventListener('mouseenter', function () { isHovered = true; });
    container.addEventListener('mouseleave', function () { isHovered = false; });

    var observer = new IntersectionObserver(function (entries) {
        var latest = entries[entries.length - 1];
        if (latest.isIntersecting) {
            if (!prefersReducedMotion) isPaused = false;
            lastTime = performance.now();
        } else {
            isPaused = true;
        }
    }, { threshold: 0.05 });
    observer.observe(container);

    // ============================================
    // API
    // ============================================
    window.dancerAPI = {
        pause: function () { isPaused = true; },
        resume: function () {
            isPaused = false;
            lastTime = performance.now();
        },
        jumpstyle: function () {
            mode = 'jumpstyle';
            jumpPhase = 0;
            jumpState = 'air';
            jumpStateTime = 0;
        },
        tecktonik: function () {
            mode = 'tecktonik';
            tecktonikCounter = 0;
            phaseTime = 0;
            isMoving = false;
            dancerGroup.rotation.x = 0;
        },
        killer: function () {
            mode = 'killer';
            killerIdx = 0;
            killerCounter = 0;
            phaseTime = 0;
            isMoving = false;
            dancerGroup.rotation.x = 0;
        },
        destroy: function () {
            if (animId) cancelAnimationFrame(animId);
            observer.disconnect();
            window.removeEventListener('resize', onResize);
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
            bodyMat.dispose(); glowMat.dispose();
            jointMat.dispose(); headMat.dispose(); wristMat.dispose();
            shadowMat.dispose(); particleMat.dispose();
            headGeo.dispose(); jointGeo.dispose(); wristGeo.dispose();
            shadowGeo.dispose(); particleGeo.dispose();
            renderer.dispose();
            window.dancerAPI = null;
        }
    };
})();