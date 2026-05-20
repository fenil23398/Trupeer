import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
  let duration = 200.42;

  try {
    const transcriptPath = path.join(
      process.cwd(),
      "public/data/transcript.json"
    );
    const raw = await readFile(transcriptPath, "utf-8");
    const data = JSON.parse(raw);
    const words = data.words?.filter(
      (w: { type: string }) => w.type === "word"
    );
    if (words?.length) {
      duration = words[words.length - 1].end;
    }
  } catch {
    // use default duration
  }

  return NextResponse.json(
    {
      videoUrl: "/assets/video.mp4",
      backgroundUrl: "/assets/background.jpg",
      duration,
      title: "Trupeer Demo",
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
