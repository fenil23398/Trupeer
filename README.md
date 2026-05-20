# Trupeer Video Player

Custom composited video player built with Next.js, Three.js, Tailwind CSS, and shadcn/ui.

## Features

- Three.js canvas compositing background image + video
- Word-level transcript sync with active word highlight
- Text selection skip (strikethrough + playback jump)
- Padding and border-radius controls (real-time)
- Play/pause and seekable timeline
- Mock API routes for transcript and media metadata

## Setup

```bash
npm install
```

### Add your video

Place the demo video at:

```
public/assets/video.mp4
```

The transcript in `public/data/transcript.json` is synced to ~200s of narration.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API

- `GET /api/transcript` — word-level transcript JSON
- `GET /api/media` — video and background URLs + duration

## Project structure

- `src/lib/playback/PlaybackEngine.ts` — playback + skip logic (non-React)
- `src/lib/three/SceneManager.ts` — Three.js compositing
- `src/components/player/CompositedVideoPlayer.tsx` — reusable canvas player
- `src/components/VideoEditor.tsx` — main editor shell

See [PLAN.md](./PLAN.md) for full architecture.
