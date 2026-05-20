"use client";

import { Clapperboard, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PlaybackProvider } from "@/context/PlaybackContext";
import { EditorShell } from "@/components/layout/EditorShell";
import { CompositedVideoPlayer } from "@/components/player/CompositedVideoPlayer";
import {
  PlayerCanvasFrame,
  SCENE_FRAME_RADIUS,
} from "@/components/player/PlayerCanvasFrame";
import { PlaybackBar } from "@/components/player/PlaybackBar";
import { TranscriptPanel } from "@/components/sidebar/TranscriptPanel";
import { VideoStyleControls } from "@/components/sidebar/VideoStyleControls";
import { PlaybackEngine } from "@/lib/playback/PlaybackEngine";
import type { MediaMetadata } from "@/lib/playback/types";
import type { NormalizedTranscript, SkipRange } from "@/lib/transcript/types";

interface VideoEditorProps {
  transcript: NormalizedTranscript;
  media: MediaMetadata;
}

export function VideoEditor({ transcript, media }: VideoEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [engine, setEngine] = useState<PlaybackEngine | null>(null);
  const [padding, setPadding] = useState(32);
  const [borderRadius, setBorderRadius] = useState(32);
  const [skipRanges, setSkipRanges] = useState<SkipRange[]>([]);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [sceneAspect, setSceneAspect] = useState(16 / 9);

  const wordMeta = useMemo(
    () =>
      transcript.words.map((w) => ({
        id: w.id,
        start: w.start,
        end: w.end,
      })),
    [transcript.words]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

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

  return (
    <>
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        preload="auto"
      />

      {!engine ? (
        <VideoPreparingState />
      ) : (
        <PlaybackProvider engine={engine}>
          <EditorShell
            sidebar={
              <div className="flex h-full min-h-0 flex-col">
                <TranscriptPanel
                  transcript={transcript}
                  skipRanges={skipRanges}
                  onSkipRangesChange={setSkipRanges}
                />
                <VideoStyleControls
                  padding={padding}
                  borderRadius={borderRadius}
                  onPaddingChange={setPadding}
                  onBorderRadiusChange={setBorderRadius}
                />
              </div>
            }
            player={
              <PlayerCanvasFrame aspectRatio={sceneAspect}>
                {videoError ? (
                  <div
                    className="flex h-full items-center justify-center overflow-hidden bg-[#00aeef] px-6 text-center text-sm text-white"
                    style={{ borderRadius: SCENE_FRAME_RADIUS }}
                  >
                    <div>
                      <p className="mb-2 font-medium">Video not loaded</p>
                      <p className="opacity-90">{videoError}</p>
                    </div>
                  </div>
                ) : (
                  <CompositedVideoPlayer
                    backgroundSrc={media.backgroundUrl}
                    padding={padding}
                    borderRadius={borderRadius}
                  />
                )}
              </PlayerCanvasFrame>
            }
            playback={<PlaybackBar />}
          />
        </PlaybackProvider>
      )}
    </>
  );
}

function VideoPreparingState() {
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
