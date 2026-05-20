import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
  const filePath = path.join(process.cwd(), "public/data/transcript.json");
  const raw = await readFile(filePath, "utf-8");
  const data = JSON.parse(raw);

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });
}
