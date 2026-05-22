import { findActiveWordId } from "@/lib/transcript/sync";
import {
  getPlayableTime,
  mergeSkipRanges,
  removeWordIdsFromSkipRanges,
} from "@/lib/transcript/skip";
import type { SkipRange } from "@/lib/transcript/types";
import type {
  PlaybackEngineOptions,
  PlaybackListener,
  PlaybackState,
} from "./types";

const UI_EMIT_INTERVAL_MS = 100;
const SKIP_LEAD_SECONDS = 0.5;
const SKIP_MUTE_RESTORE_MS = 120;

export class PlaybackEngine {
  private readonly video: HTMLVideoElement;
  private readonly words: PlaybackEngineOptions["words"];
  private readonly onFrame?: () => void;

  private duration: number;
  private skipRanges: SkipRange[] = [];
  private listeners = new Set<PlaybackListener>();
  private lastEmitAt = 0;
  private isScrubbing = false;
  private isPlaying = false;
  private wasMutedBeforeSkip: boolean | null = null;
  private muteRestoreTimer: number | null = null;
  private disposed = false;

  constructor(options: PlaybackEngineOptions) {
    this.video = options.video;
    this.words = options.words;
    this.duration = options.duration;
    this.onFrame = options.onFrame;

    this.video.preload = "metadata";
    this.video.playsInline = true;

    this.video.addEventListener("loadedmetadata", this.handleMetadata);
    this.video.addEventListener("ended", this.handleEnded);
    this.video.addEventListener("playing", this.handlePlaying);
    this.video.addEventListener("seeked", this.handleSeeked);
  }

  subscribe(listener: PlaybackListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): PlaybackState {
    const currentTime = this.video.currentTime || 0;
    return {
      currentTime,
      duration: this.getDuration(),
      isPlaying: this.isPlaying,
      activeWordId: findActiveWordId(this.words, currentTime),
      isScrubbing: this.isScrubbing,
    };
  }

  getDuration(): number {
    if (Number.isFinite(this.video.duration) && this.video.duration > 0) {
      return this.video.duration;
    }
    return this.duration;
  }

  getVideoElement(): HTMLVideoElement {
    return this.video;
  }

  getSkipRanges(): SkipRange[] {
    return this.skipRanges;
  }

  setSkipRanges(ranges: SkipRange[]): void {
    this.skipRanges = mergeSkipRanges(ranges);
    this.emit(true);
  }

  addSkipRange(range: SkipRange): void {
    this.setSkipRanges([...this.skipRanges, range]);
  }

  removeSkipRange(id: string): void {
    this.setSkipRanges(this.skipRanges.filter((r) => r.id !== id));
  }

  removeSkipRangesForWords(wordIds: number[]): void {
    if (wordIds.length === 0) return;
    this.setSkipRanges(
      removeWordIdsFromSkipRanges(this.skipRanges, wordIds, this.words)
    );
  }

  setScrubbing(scrubbing: boolean): void {
    this.isScrubbing = scrubbing;
    this.emit(true);
  }

  async play(): Promise<void> {
    if (this.disposed) return;
    const playable = this.getPlayablePlaybackTime(this.video.currentTime);
    if (playable !== this.video.currentTime) {
      this.video.currentTime = playable;
    }
    this.isPlaying = true;
    this.emit(true);
    try {
      await this.video.play();
      this.emit(true);
    } catch {
      this.isPlaying = false;
      this.emit(true);
    }
  }

  pause(): void {
    this.video.pause();
    this.isPlaying = false;
    this.emit(true);
  }

  toggle(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      void this.play();
    }
  }

  seek(time: number): void {
    const clamped = Math.max(0, Math.min(time, this.getDuration()));
    const target = getPlayableTime(clamped, this.skipRanges);
    this.video.currentTime = target;
    this.emit(true);
  }

  tick(): void {
    if (this.disposed) return;

    if (this.isPlaying && !this.isScrubbing) {
      this.enforceSkips();
    }

    this.onFrame?.();
    this.emit(false);
  }

  dispose(): void {
    this.disposed = true;
    this.pause();
    this.video.removeEventListener("loadedmetadata", this.handleMetadata);
    this.video.removeEventListener("ended", this.handleEnded);
    this.video.removeEventListener("playing", this.handlePlaying);
    this.video.removeEventListener("seeked", this.handleSeeked);
    this.restoreMutedAfterSkip();
    this.listeners.clear();
  }

  private handleMetadata = (): void => {
    if (Number.isFinite(this.video.duration) && this.video.duration > 0) {
      this.duration = this.video.duration;
    }
    this.emit(true);
  };

  private handleEnded = (): void => {
    this.isPlaying = false;
    this.emit(true);
  };

  private handlePlaying = (): void => {
    this.isPlaying = true;
    this.enforceSkips();
    this.emit(true);
  };

  private handleSeeked = (): void => {
    this.restoreMutedAfterSkipSoon();
  };

  private getPlayablePlaybackTime(time: number): number {
    const skipRange = this.getSkipRangeForPlayback(time);
    return skipRange ? skipRange.end : getPlayableTime(time, this.skipRanges);
  }

  private getSkipRangeForPlayback(time: number): SkipRange | null {
    for (const range of this.skipRanges) {
      const shouldJumpBeforeAudioStarts =
        time >= range.start - SKIP_LEAD_SECONDS && time < range.end;

      if (shouldJumpBeforeAudioStarts) {
        return range;
      }
    }

    return null;
  }

  private enforceSkips(): void {
    const skipRange = this.getSkipRangeForPlayback(this.video.currentTime);
    if (skipRange) {
      this.skipTo(skipRange.end);
    }
  }

  private skipTo(time: number): void {
    if (this.video.currentTime >= time) return;

    if (this.wasMutedBeforeSkip === null) {
      this.wasMutedBeforeSkip = this.video.muted;
    }

    if (this.muteRestoreTimer) {
      window.clearTimeout(this.muteRestoreTimer);
      this.muteRestoreTimer = null;
    }

    this.video.muted = true;
    this.video.currentTime = time;
    this.restoreMutedAfterSkipSoon();
  }

  private restoreMutedAfterSkipSoon(): void {
    if (this.wasMutedBeforeSkip === null) return;

    if (this.muteRestoreTimer) {
      window.clearTimeout(this.muteRestoreTimer);
    }

    this.muteRestoreTimer = window.setTimeout(() => {
      this.restoreMutedAfterSkip();
    }, SKIP_MUTE_RESTORE_MS);
  }

  private restoreMutedAfterSkip(): void {
    if (this.wasMutedBeforeSkip === null) return;

    if (this.muteRestoreTimer) {
      window.clearTimeout(this.muteRestoreTimer);
      this.muteRestoreTimer = null;
    }

    this.video.muted = this.wasMutedBeforeSkip;
    this.wasMutedBeforeSkip = null;
  }

  private emit(force: boolean): void {
    const now = performance.now();
    if (!force && now - this.lastEmitAt < UI_EMIT_INTERVAL_MS) {
      return;
    }
    this.lastEmitAt = now;
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }
}
