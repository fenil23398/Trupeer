"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PlaybackEngine } from "@/lib/playback/PlaybackEngine";
import type { MediaMetadata } from "@/lib/playback/types";
import type { NormalizedTranscript, SkipRange } from "@/lib/transcript/types";

interface UsePlaybackEngineSetupArgs {
  media: MediaMetadata;
  transcript: NormalizedTranscript;
  skipRanges: SkipRange[];
}

export function usePlaybackEngineSetup({
  media,
  transcript,
  skipRanges,
}: UsePlaybackEngineSetupArgs) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [engine, setEngine] = useState<PlaybackEngine | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [sceneAspect, setSceneAspect] = useState(16 / 9);

  const wordMeta = useMemo(
    () =>
      transcript.words.map((word) => ({
        id: word.id,
        start: word.start,
        end: word.end,
      })),
    [transcript.words]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setVideoError(null);
    video.crossOrigin = "anonymous";
    video.preload = "auto";
    video.src = media.videoUrl;

    const playbackEngine = new PlaybackEngine({
      video,
      duration: media.duration || transcript.duration,
      words: wordMeta,
    });

    setEngine(playbackEngine);

    const handleLoadedMetadata = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setSceneAspect(video.videoWidth / video.videoHeight);
      }
    };

    const handleError = () => {
      setVideoError(
        "Video file not found. Place your video at public/assets/video.mp4"
      );
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("error", handleError);
    video.load();
    handleLoadedMetadata();

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("error", handleError);
      playbackEngine.dispose();
      setEngine(null);
    };
  }, [media.videoUrl, media.duration, transcript.duration, wordMeta]);

  useEffect(() => {
    engine?.setSkipRanges(skipRanges);
  }, [engine, skipRanges]);

  return {
    videoRef,
    engine,
    videoError,
    sceneAspect,
  };
}
