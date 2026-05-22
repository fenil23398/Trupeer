"use client";

import { useEffect, useRef, useState } from "react";
import { usePlaybackEngine } from "@/context/PlaybackContext";
import { SceneManager } from "@/lib/three/SceneManager";
import { cn } from "@/lib/utils";

export interface CompositedVideoPlayerProps {
  backgroundSrc: string;
  posterSrc: string;
  padding: number;
  borderRadius: number;
  className?: string;
}

export function CompositedVideoPlayer({
  backgroundSrc,
  posterSrc,
  padding,
  borderRadius,
  className,
}: CompositedVideoPlayerProps) {
  const engine = usePlaybackEngine();
  const [isVideoFrameReady, setIsVideoFrameReady] = useState(false);
  const radius = `${borderRadius}px`;
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneManager | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const backgroundImage = new Image();
    backgroundImage.src = backgroundSrc;

    const posterImage = new Image();
    posterImage.src = posterSrc;
  }, [backgroundSrc, posterSrc]);

  useEffect(() => {
    setIsVideoFrameReady(false);
  }, [backgroundSrc, posterSrc]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const video = engine.getVideoElement();
    const sceneManager = new SceneManager(canvas, video, backgroundSrc, {
      onVideoFrameReady: () => setIsVideoFrameReady(true),
    });
    sceneRef.current = sceneManager;

    let mounted = true;

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      sceneManager.resize(width, height);
    };

    sceneManager
      .init()
      .then(() => {
        if (!mounted) return;
        resize();
        sceneManager.updateStyle({ padding, borderRadius });

        const tick = () => {
          engine.tick();
          sceneManager.render();
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      })
      .catch(console.error);

    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(container);

    const handleVisibility = () => {
      if (document.hidden && rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      } else if (!document.hidden && !rafRef.current && mounted) {
        const tick = () => {
          engine.tick();
          sceneManager.render();
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      mounted = false;
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      sceneManager.dispose();
      sceneRef.current = null;
    };
  }, [engine, backgroundSrc]);

  useEffect(() => {
    sceneRef.current?.updateStyle({ padding, borderRadius });
  }, [padding, borderRadius]);

  return (
    <div
      ref={containerRef}
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={{ borderRadius: radius }}
    >
      <img
        src={posterSrc}
        alt=""
        aria-hidden="true"
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-200",
          isVideoFrameReady ? "opacity-0" : "opacity-100"
        )}
        style={{ borderRadius: radius }}
      />
      <canvas
        ref={canvasRef}
        className="relative block h-full w-full"
        style={{ borderRadius: radius }}
        aria-label="Composited video player"
      />
    </div>
  );
}
