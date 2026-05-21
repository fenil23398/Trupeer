import { access, readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
  let duration = 200.42;
  let posterUrl = "/assets/background.jpg";

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

  try {
    await access(path.join(process.cwd(), "public/assets/poster.jpg"));
    posterUrl = "/assets/poster.jpg";
  } catch {
    // Background is the no-404 fallback until a generated poster is added.
  }

  return NextResponse.json(
    {
      videoUrl: "/assets/video.mp4",
      backgroundUrl: "/assets/background.jpg",
      posterUrl,
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
