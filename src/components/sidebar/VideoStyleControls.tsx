"use client";

import { Maximize2, Square } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface VideoStyleControlsProps {
  padding: number;
  borderRadius: number;
  onPaddingChange: (value: number) => void;
  onBorderRadiusChange: (value: number) => void;
  className?: string;
}

function StyleSlider({
  label,
  icon: Icon,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon className="size-4" />
          <span>{label}</span>
        </div>
        <span className="min-w-[28px] text-right text-sm tabular-nums text-foreground">
          {value}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={1}
        value={[value]}
        onValueChange={(values) => {
          const next = Array.isArray(values) ? values[0] : values;
          if (typeof next === "number") onChange(next);
        }}
        className="[&_[data-slot=slider-thumb]]:border-[#3b82f6] [&_[data-slot=slider-thumb]]:bg-[#3b82f6] [&_[data-slot=slider-range]]:bg-[#3b82f6]"
      />
    </div>
  );
}

export function VideoStyleControls({
  padding,
  borderRadius,
  onPaddingChange,
  onBorderRadiusChange,
  className,
}: VideoStyleControlsProps) {
  return (
    <div className={cn("space-y-6 border-t border-border px-5 py-5", className)}>
      <StyleSlider
        label="Padding"
        icon={Maximize2}
        value={padding}
        min={0}
        max={80}
        onChange={onPaddingChange}
      />
      <StyleSlider
        label="Rounding"
        icon={Square}
        value={borderRadius}
        min={0}
        max={48}
        onChange={onBorderRadiusChange}
      />
    </div>
  );
}
