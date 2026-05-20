"use client";

import { createContext, useContext } from "react";
import type { PlaybackEngine } from "@/lib/playback/PlaybackEngine";

const PlaybackContext = createContext<PlaybackEngine | null>(null);

export function PlaybackProvider({
  engine,
  children,
}: {
  engine: PlaybackEngine | null;
  children: React.ReactNode;
}) {
  return (
    <PlaybackContext.Provider value={engine}>
      {children}
    </PlaybackContext.Provider>
  );
}

export function usePlaybackEngine(): PlaybackEngine {
  const engine = useContext(PlaybackContext);
  if (!engine) {
    throw new Error("usePlaybackEngine must be used within PlaybackProvider");
  }
  return engine;
}
