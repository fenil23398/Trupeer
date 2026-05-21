"use client";

import { memo, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface TranscriptWordProps {
  id: number;
  text: string;
  start: number;
  isActive: boolean;
  skipped: boolean;
  onWordClick: (wordId: number, start: number, skipped: boolean) => void;
}

function TranscriptWordBase(
  {
    id,
    text,
    start,
    isActive,
    skipped,
    onWordClick,
  }: TranscriptWordProps,
  ref: React.ForwardedRef<HTMLSpanElement>
) {
  return (
    <span
      ref={ref}
      data-word-id={id}
      onClick={() => onWordClick(id, start, skipped)}
      className={cn(
        "cursor-text rounded-sm transition-colors",
        isActive && "bg-yellow-100 dark:bg-yellow-400/25",
        skipped &&
          "cursor-pointer text-muted-foreground line-through decoration-muted-foreground/80 opacity-60"
      )}
    >
      {text}
    </span>
  );
}

export const TranscriptWord = memo(forwardRef(TranscriptWordBase));
TranscriptWord.displayName = "TranscriptWord";
