"use client";

import { useEffect, useState } from "react";
import type { PlaybackEngine } from "@/lib/playback/PlaybackEngine";
import type { PlaybackState } from "@/lib/playback/types";

const defaultState: PlaybackState = {
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  activeWordId: null,
  isScrubbing: false,
};

export function usePlayback(engine: PlaybackEngine | null): PlaybackState {
  const [state, setState] = useState<PlaybackState>(defaultState);

  useEffect(() => {
    if (!engine) return;
    return engine.subscribe(setState);
  }, [engine]);

  return state;
}
