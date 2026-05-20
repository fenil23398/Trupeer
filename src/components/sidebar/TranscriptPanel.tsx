"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FastForward } from "lucide-react";
import { usePlaybackEngine } from "@/context/PlaybackContext";
import { usePlayback } from "@/hooks/usePlayback";
import {
  createSkipRangeFromWordIds,
  getWordIdsFromSelection,
  isWordSkipped,
} from "@/lib/transcript/skip";
import type { NormalizedTranscript, SkipRange } from "@/lib/transcript/types";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface TranscriptPanelProps {
  transcript: NormalizedTranscript;
  skipRanges: SkipRange[];
  onSkipRangesChange: (ranges: SkipRange[]) => void;
}

interface ToolbarPosition {
  top: number;
  left: number;
}

export function TranscriptPanel({
  transcript,
  skipRanges,
  onSkipRangesChange,
}: TranscriptPanelProps) {
  const engine = usePlaybackEngine();
  const { activeWordId } = usePlayback(engine);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);
  const [selectedWordIds, setSelectedWordIds] = useState<number[]>([]);
  const [toolbarPos, setToolbarPos] = useState<ToolbarPosition | null>(null);

  useEffect(() => {
    activeWordRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [activeWordId]);

  const updateToolbarPosition = useCallback((range: Range) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = range.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    setToolbarPos({
      top: rect.top - containerRect.top - 36,
      left: rect.left - containerRect.left + rect.width / 2,
    });
  }, []);

  const refreshSelection = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const ids = getWordIdsFromSelection(container);
    setSelectedWordIds(ids);

    if (ids.length === 0) {
      setToolbarPos(null);
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setToolbarPos(null);
      return;
    }

    updateToolbarPosition(selection.getRangeAt(0));
  }, [updateToolbarPosition]);

  useEffect(() => {
    const handleSelectionChange = () => {
      const container = containerRef.current;
      if (!container) return;

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setSelectedWordIds([]);
        setToolbarPos(null);
        return;
      }

      const range = selection.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) {
        setSelectedWordIds([]);
        setToolbarPos(null);
        return;
      }

      refreshSelection();
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange);
  }, [refreshSelection]);

  const clearSelection = () => {
    setSelectedWordIds([]);
    setToolbarPos(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleSkip = () => {
    const range = createSkipRangeFromWordIds(
      transcript.words,
      selectedWordIds
    );
    if (!range) return;

    engine.addSkipRange(range);
    onSkipRangesChange([...engine.getSkipRanges()]);

    const end = range.end;
    clearSelection();
    engine.seek(end);
  };

  const handleUnskip = () => {
    if (selectedWordIds.length === 0) return;
    engine.removeSkipRangesForWords(selectedWordIds);
    onSkipRangesChange([...engine.getSkipRanges()]);
    clearSelection();
  };

  const handleWordClick = (wordId: number, start: number) => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) return;

    if (isWordSkipped(wordId, skipRanges)) return;
    engine.seek(start);
  };

  const hasSkippedSelection = selectedWordIds.some((id) =>
    isWordSkipped(id, skipRanges)
  );

  const showToolbar = selectedWordIds.length > 0 && toolbarPos;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-sm font-medium text-muted-foreground">Script</h2>
        <ThemeToggle />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div
          ref={containerRef}
          className="relative px-5 py-4 text-[15px] leading-relaxed text-foreground selection:bg-[#3b82f6]/20 selection:text-foreground dark:selection:bg-[#60a5fa]/35"
        >
          {showToolbar && (
            <div
              className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1"
              style={{ top: toolbarPos.top, left: toolbarPos.left }}
            >
              <div className="pointer-events-auto rounded-full border border-border bg-popover p-1 shadow-lg ring-1 ring-black/5 dark:ring-white/10">
                {hasSkippedSelection ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleUnskip}
                    className="h-7 rounded-full px-3 text-xs font-medium text-[#2563eb] hover:bg-[#3b82f6]/10 hover:text-[#1d4ed8] dark:text-[#93c5fd] dark:hover:bg-[#60a5fa]/15 dark:hover:text-[#bfdbfe]"
                  >
                    Unskip
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleSkip}
                    className="h-7 gap-1.5 rounded-full px-3 text-xs font-medium text-[#2563eb] hover:bg-[#3b82f6]/10 hover:text-[#1d4ed8] dark:text-[#93c5fd] dark:hover:bg-[#60a5fa]/15 dark:hover:text-[#bfdbfe]"
                  >
                    <FastForward className="size-3.5" />
                    Skip
                  </Button>
                )}
              </div>
            </div>
          )}

          <div
            className="select-text"
            onMouseUp={refreshSelection}
          >
            {transcript.tokens.map((token, index) => {
              if (token.type === "spacing") {
                return <span key={`space-${index}`}>{token.text}</span>;
              }

              const skipped = isWordSkipped(token.id!, skipRanges);
              const isActive = token.id === activeWordId && !skipped;

              return (
                <span
                  key={`word-${token.id}`}
                  ref={isActive ? activeWordRef : undefined}
                  data-word-id={token.id}
                  onClick={() =>
                    handleWordClick(token.id!, token.start ?? 0)
                  }
                  className={cn(
                    "cursor-text rounded-sm transition-colors",
                    isActive && "bg-yellow-100 dark:bg-yellow-400/25",
                    skipped &&
                      "cursor-pointer text-muted-foreground line-through decoration-muted-foreground/80 opacity-60"
                  )}
                >
                  {token.text}
                </span>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
