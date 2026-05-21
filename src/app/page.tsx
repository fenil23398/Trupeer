import { access, readFile } from "fs/promises";
import path from "path";
import { VideoEditor } from "@/components/VideoEditor";
import { normalizeTranscript } from "@/lib/transcript/normalize";
import type { RawTranscript } from "@/lib/transcript/types";
import type { MediaMetadata } from "@/lib/playback/types";

async function loadTranscript() {
  const filePath = path.join(process.cwd(), "public/data/transcript.json");
  const raw = await readFile(filePath, "utf-8");
  return normalizeTranscript(JSON.parse(raw) as RawTranscript);
}

async function loadMedia(duration: number): Promise<MediaMetadata> {
  let posterUrl = "/assets/background.jpg";

  try {
    await access(path.join(process.cwd(), "public/assets/poster.jpg"));
    posterUrl = "/assets/poster.jpg";
  } catch {
    // Keep the page 404-free when a poster has not been generated yet.
  }

  return {
    videoUrl: "/assets/video.mp4",
    backgroundUrl: "/assets/background.jpg",
    posterUrl,
    duration,
    title: "Trupeer Demo",
  };
}

export default async function Home() {
  const transcript = await loadTranscript();
  const media = await loadMedia(transcript.duration);

  return <VideoEditor transcript={transcript} media={media} />;
}
