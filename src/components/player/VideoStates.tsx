"use client";

import { Clapperboard, Loader2 } from "lucide-react";
import { SCENE_FRAME_RADIUS } from "@/components/player/PlayerCanvasFrame";

export function VideoErrorState({ message }: { message: string }) {
  return (
    <div
      className="flex h-full items-center justify-center overflow-hidden bg-[#00aeef] px-6 text-center text-sm text-white"
      style={{ borderRadius: SCENE_FRAME_RADIUS }}
    >
      <div>
        <p className="mb-2 font-medium">Video not loaded</p>
        <p className="opacity-90">{message}</p>
      </div>
    </div>
  );
}

export function VideoPreparingState() {
  return (
    <div className="flex h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="relative mb-5 aspect-video overflow-hidden rounded-xl bg-muted">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.45),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.35),_transparent_36%)]" />
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-background/80 p-4 shadow-sm backdrop-blur">
              <Clapperboard className="size-8 text-[#3b82f6]" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Loader2 className="size-5 animate-spin text-[#3b82f6]" />
          <div>
            <p className="text-sm font-medium">Generating video preview</p>
            <p className="text-xs text-muted-foreground">
              Preparing the canvas, background, and transcript sync.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
