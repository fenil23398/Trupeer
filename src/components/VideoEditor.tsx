"use client";

import { PlaybackProvider } from "@/context/PlaybackContext";
import { EditorShell } from "@/components/layout/EditorShell";
import { CompositedVideoPlayer } from "@/components/player/CompositedVideoPlayer";
import { PlayerCanvasFrame } from "@/components/player/PlayerCanvasFrame";
import { PlaybackBar } from "@/components/player/PlaybackBar";
import { VideoErrorState, VideoPreparingState } from "@/components/player/VideoStates";
import { TranscriptPanel } from "@/components/sidebar/TranscriptPanel";
import { VideoStyleControls } from "@/components/sidebar/VideoStyleControls";
import { usePlaybackEngineSetup } from "@/hooks/usePlaybackEngineSetup";
import { useEditorStore } from "@/stores/editorStore";
import type { MediaMetadata } from "@/lib/playback/types";
import type { NormalizedTranscript } from "@/lib/transcript/types";

interface VideoEditorProps {
  transcript: NormalizedTranscript;
  media: MediaMetadata;
}

export function VideoEditor({ transcript, media }: VideoEditorProps) {
  const padding = useEditorStore((state) => state.padding);
  const borderRadius = useEditorStore((state) => state.borderRadius);
  const skipRanges = useEditorStore((state) => state.skipRanges);
  const setPadding = useEditorStore((state) => state.setPadding);
  const setBorderRadius = useEditorStore((state) => state.setBorderRadius);
  const setSkipRanges = useEditorStore((state) => state.setSkipRanges);
  const { videoRef, engine, videoError, sceneAspect } = usePlaybackEngineSetup({
    media,
    transcript,
    skipRanges,
  });

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
              <PlayerCanvasFrame
                aspectRatio={sceneAspect}
                borderRadius={borderRadius}
              >
                {videoError ? (
                  <VideoErrorState message={videoError} />
                ) : (
                  <CompositedVideoPlayer
                    backgroundSrc={media.backgroundUrl}
                    posterSrc={media.posterUrl}
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
