"use client";

import { Pause, Play } from "lucide-react";
import { usePlaybackEngine } from "@/context/PlaybackContext";
import { usePlayback } from "@/hooks/usePlayback";
import { formatTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export function PlaybackBar({ className }: { className?: string }) {
  const engine = usePlaybackEngine();
  const { currentTime, duration, isPlaying } = usePlayback(engine);

  const handleSliderChange = (values: number | readonly number[]) => {
    const value = Array.isArray(values) ? values[0] : values;
    if (typeof value === "number") {
      engine.seek(value);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-t border-border bg-card px-6 py-4",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <Button
          type="button"
          size="icon"
          className="size-10 shrink-0 rounded-full bg-[#3b82f6] text-white hover:bg-[#2563eb]"
          onClick={() => engine.toggle()}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="size-4 fill-current" />
          ) : (
            <Play className="size-4 fill-current" />
          )}
        </Button>
        <span className="min-w-[100px] text-sm tabular-nums text-muted-foreground">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <div className="flex-1">
          <Slider
            min={0}
            max={Math.max(duration, 0.01)}
            step={0.01}
            value={[currentTime]}
            onValueChange={(values) => {
              engine.setScrubbing(true);
              handleSliderChange(values);
            }}
            onValueCommitted={() => engine.setScrubbing(false)}
            className="[&_[data-slot=slider-thumb]]:border-[#3b82f6] [&_[data-slot=slider-thumb]]:bg-[#3b82f6] [&_[data-slot=slider-range]]:bg-[#3b82f6]"
          />
        </div>
      </div>
    </div>
  );
}
