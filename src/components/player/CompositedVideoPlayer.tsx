"use client";

import { useEffect, useRef } from "react";
import { usePlaybackEngine } from "@/context/PlaybackContext";
import { SceneManager } from "@/lib/three/SceneManager";
import { SCENE_FRAME_RADIUS } from "@/components/player/PlayerCanvasFrame";
import { cn } from "@/lib/utils";

export interface CompositedVideoPlayerProps {
  backgroundSrc: string;
  padding: number;
  borderRadius: number;
  className?: string;
}

export function CompositedVideoPlayer({
  backgroundSrc,
  padding,
  borderRadius,
  className,
}: CompositedVideoPlayerProps) {
  const engine = usePlaybackEngine();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneManager | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const video = engine.getVideoElement();
    const sceneManager = new SceneManager(canvas, video, backgroundSrc);
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
      className={cn("h-full w-full overflow-hidden", className)}
      style={{ borderRadius: SCENE_FRAME_RADIUS }}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{ borderRadius: SCENE_FRAME_RADIUS }}
        aria-label="Composited video player"
      />
    </div>
  );
}
