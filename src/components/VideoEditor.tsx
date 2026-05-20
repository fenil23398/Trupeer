"use client";

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
  const [isReady, setIsReady] = useState(false);
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

    video.src = media.videoUrl;
    video.crossOrigin = "anonymous";

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

    const handleCanPlay = () => setIsReady(true);
    const handleError = () => {
      setVideoError(
        "Video file not found. Place your video at public/assets/video.mp4"
      );
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("error", handleError);
    handleLoadedMetadata();

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("canplay", handleCanPlay);
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
        preload="metadata"
      />

      {!engine ? (
        <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">
          Initializing player…
        </div>
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
                ) : !isReady ? (
                  <div
                    className="flex h-full items-center justify-center overflow-hidden bg-[#00aeef] text-sm text-white"
                    style={{ borderRadius: SCENE_FRAME_RADIUS }}
                  >
                    Loading video…
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
