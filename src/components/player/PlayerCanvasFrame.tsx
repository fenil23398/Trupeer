"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export const SCENE_FRAME_RADIUS = "28px";
const DEFAULT_ASPECT = 16 / 9;

interface PlayerCanvasFrameProps {
  children: React.ReactNode;
  /** Match the video aspect so padding 0 fills the frame without cropping */
  aspectRatio?: number;
  borderRadius?: number;
  className?: string;
}

export function PlayerCanvasFrame({
  children,
  aspectRatio = DEFAULT_ASPECT,
  borderRadius,
  className,
}: PlayerCanvasFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateFrameSize = () => {
      const rect = container.getBoundingClientRect();
      const styles = window.getComputedStyle(container);
      const horizontalPadding =
        Number.parseFloat(styles.paddingLeft) +
        Number.parseFloat(styles.paddingRight);
      const verticalPadding =
        Number.parseFloat(styles.paddingTop) +
        Number.parseFloat(styles.paddingBottom);
      const containerWidth = rect.width - horizontalPadding;
      const containerHeight = rect.height - verticalPadding;

      if (containerWidth <= 0 || containerHeight <= 0) return;

      const maxWidth = Math.min(containerWidth, 960);
      const widthFromHeight = containerHeight * aspectRatio;

      const width = Math.min(maxWidth, widthFromHeight);
      const height = width / aspectRatio;

      setFrameSize({ width, height });
    };

    updateFrameSize();

    const resizeObserver = new ResizeObserver(updateFrameSize);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [aspectRatio]);

  const radius = borderRadius === undefined ? SCENE_FRAME_RADIUS : `${borderRadius}px`;

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex h-full min-h-0 w-full items-center justify-center",
        "bg-muted/40 px-5 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6",
        className
      )}
    >
      <div
        className="relative shrink-0 overflow-hidden shadow-md ring-1 ring-border"
        style={{
          width: frameSize.width || undefined,
          height: frameSize.height || undefined,
          maxWidth: "100%",
          maxHeight: "100%",
          borderRadius: radius,
        }}
      >
        <div
          className="h-full w-full overflow-hidden"
          style={{ borderRadius: radius }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
