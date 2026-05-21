import type { SkipRange } from "@/lib/transcript/types";

export interface MediaMetadata {
  videoUrl: string;
  backgroundUrl: string;
  posterUrl: string;
  duration: number;
  title?: string;
}

export interface PlaybackState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  activeWordId: number | null;
  isScrubbing: boolean;
}

export type PlaybackListener = (state: PlaybackState) => void;

export interface WordTiming {
  id: number;
  start: number;
  end: number;
}

export interface PlaybackEngineOptions {
  video: HTMLVideoElement;
  duration: number;
  words: WordTiming[];
  onFrame?: () => void;
}

export type { SkipRange };
