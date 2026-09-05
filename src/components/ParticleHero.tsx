"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import supremeCourtData from "@/lib/supremeCourtPoints.json";

interface Particle {
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  colorIdx: number;
  jitterOffset: number;
  jitterSpeed: number;
}

interface ParticleHeroProps {
  svgPath?: string;
  className?: string;
  particleCount?: number;
  repelRadius?: number;
  repelForce?: number;
  springStrength?: number;
  friction?: number;
}

// Light palette — visible by default on white background
const PALETTE_LIGHT = [
  "rgba(15, 23, 42, 0.22)",
  "rgba(30, 41, 59, 0.20)",
  "rgba(30, 58, 138, 0.25)",
  "rgba(26, 26, 24, 0.22)",
  "rgba(29, 78, 216, 0.18)",
];

// Dark palette — activated when cursor hovers nearby
const PALETTE_DARK = [
  "rgba(15, 23, 42, 0.95)",
  "rgba(30, 41, 59, 0.92)",
  "rgba(30, 58, 138, 0.96)",
  "rgba(26, 26, 24, 0.94)",
  "rgba(29, 78, 216, 0.88)",
];

// Radius around cursor within which particles go dark
const DARK_RADIUS = 160;

export default function ParticleHero({
  className = "",
  particleCount = 4500,
  repelRadius = 90,
  repelForce = 12,
  springStrength = 0.05,
  friction = 0.88,
}: ParticleHeroProps) {

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const normalizedPointsRef = useRef<{ x: number; y: number }[]>(
    supremeCourtData.points as { x: number; y: number }[]
  );
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<{ x: number; y: number; isHovering: boolean }>({
    x: -9999,
    y: -9999,
    isHovering: false,
  });

  const [isLoaded, setIsLoaded] = useState(false);

  const layoutParticles = useCallback(
    (width: number, height: number, isInitial = false) => {
      const rawPoints = normalizedPointsRef.current;
      if (!rawPoints || rawPoints.length === 0) return;

      const isMobile = width < 768;
      const count = isMobile ? Math.min(2200, particleCount) : particleCount;

      const step = rawPoints.length / count;
      const selectedPoints: { x: number; y: number }[] = [];
      for (let i = 0; i < count; i++) {
        const idx = Math.min(rawPoints.length - 1, Math.floor(i * step));
        selectedPoints.push(rawPoints[idx]);
      }

      const paddingX = width * (isMobile ? 0.03 : 0.04);
      const paddingY = height * (isMobile ? 0.05 : 0.06);
      const availW = width - paddingX * 2;
      const availH = height - paddingY * 2;

      const svgAspect = supremeCourtData.aspectRatio || 2.27;
      let drawW = availW;
      let drawH = drawW / svgAspect;

      if (drawH > availH) {
        drawH = availH;
        drawW = drawH * svgAspect;
      }

      const offsetX = (width - drawW) / 2;
      const offsetY = (height - drawH) / 2;

      if (isInitial || particlesRef.current.length === 0) {
        const newParticles: Particle[] = selectedPoints.map((pt, idx) => {
          const homeX = offsetX + pt.x * drawW;
          const homeY = offsetY + pt.y * drawH;

          const angle = Math.random() * Math.PI * 2;
          const radius = (Math.random() * 0.6 + 0.3) * Math.max(width, height);
          const startX = width / 2 + Math.cos(angle) * radius;
          const startY = height / 2 + Math.sin(angle) * radius;

          return {
            homeX,
            homeY,
            x: startX,
            y: startY,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            size: Math.random() > 0.85 ? 1.4 : Math.random() > 0.4 ? 1.15 : 0.95,
            colorIdx: idx % PALETTE_LIGHT.length,
            jitterOffset: Math.random() * 500,
            jitterSpeed: 0.002 + Math.random() * 0.002,
          };
        });

        particlesRef.current = newParticles;
      } else {
        particlesRef.current.forEach((p, idx) => {
          if (selectedPoints[idx]) {
            p.homeX = offsetX + selectedPoints[idx].x * drawW;
            p.homeY = offsetY + selectedPoints[idx].y * drawH;
          }
        });
      }
    },
    [particleCount]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let width = canvas.parentElement?.clientWidth || 800;
    let height = canvas.parentElement?.clientHeight || 600;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    layoutParticles(width, height, true);
    setIsLoaded(true);

    let animationTime = 0;

    const render = () => {
      animationTime += 1;
      ctx.clearRect(0, 0, width, height);

      const particles = particlesRef.current;
      const mouse = mouseRef.current;
      const effectiveRepel = width < 768 ? repelRadius * 0.7 : repelRadius;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 1. Subtle idle jitter
        const jitterX = Math.sin(animationTime * p.jitterSpeed + p.jitterOffset) * 0.5;
        const jitterY = Math.cos(animationTime * p.jitterSpeed + p.jitterOffset) * 0.5;
        const targetX = p.homeX + jitterX;
        const targetY = p.homeY + jitterY;

        // 2. Spring pull back to home
        let ax = (targetX - p.x) * springStrength;
        let ay = (targetY - p.y) * springStrength;

        // 3. Repel force when mouse is hovering
        const dxMouse = p.x - mouse.x;
        const dyMouse = p.y - mouse.y;
        const distToMouse = Math.hypot(dxMouse, dyMouse);

        if (mouse.isHovering && distToMouse < effectiveRepel && distToMouse > 0.001) {
          const force = (1 - distToMouse / effectiveRepel) * repelForce;
          const angle = Math.atan2(dyMouse, dxMouse);
          ax += Math.cos(angle) * force;
          ay += Math.sin(angle) * force;
        }

        // 4. Velocity + friction
        p.vx = (p.vx + ax) * friction;
        p.vy = (p.vy + ay) * friction;

        // 5. Move particle
        p.x += p.vx;
        p.y += p.vy;

        // 6. Color — light by default, dark when cursor is near
        const isDark = mouse.isHovering && distToMouse < DARK_RADIUS;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? PALETTE_DARK[p.colorIdx]
          : PALETTE_LIGHT[p.colorIdx];
        ctx.fill();
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      layoutParticles(width, height, false);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [layoutParticles, repelRadius, repelForce, springStrength, friction]);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      isHovering: true,
    };
  };

  const handlePointerLeave = () => {
    mouseRef.current.isHovering = false;
    mouseRef.current.x = -9999;
    mouseRef.current.y = -9999;
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center select-none ${className}`}
    >
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className={`w-full h-full touch-none transition-opacity duration-700 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
