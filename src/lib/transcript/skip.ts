import type { NormalizedWord, SkipRange } from "./types";

type WordTiming = Pick<NormalizedWord, "id" | "start" | "end">;

export function mergeSkipRanges(ranges: SkipRange[]): SkipRange[] {
  if (ranges.length === 0) return [];

  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged: SkipRange[] = [{ ...sorted[0], wordIds: [...sorted[0].wordIds] }];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
      last.wordIds = [...new Set([...last.wordIds, ...current.wordIds])];
    } else {
      merged.push({ ...current, wordIds: [...current.wordIds] });
    }
  }

  return merged;
}

export function getSkipRangeAtTime(
  ranges: SkipRange[],
  time: number
): SkipRange | null {
  for (const range of ranges) {
    if (time >= range.start && time < range.end) {
      return range;
    }
  }
  return null;
}

export function getPlayableTime(time: number, ranges: SkipRange[]): number {
  const range = getSkipRangeAtTime(ranges, time);
  return range ? range.end : time;
}

export function createSkipRangeFromWordIds(
  words: NormalizedWord[],
  wordIds: number[]
): SkipRange | null {
  if (wordIds.length === 0) return null;

  const selected = words.filter((w) => wordIds.includes(w.id));
  if (selected.length === 0) return null;

  const start = Math.min(...selected.map((w) => w.start));
  const end = Math.max(...selected.map((w) => w.end));

  return {
    id: crypto.randomUUID(),
    start,
    end,
    wordIds: [...new Set(wordIds)].sort((a, b) => a - b),
  };
}

export function removeWordIdsFromSkipRanges(
  ranges: SkipRange[],
  wordIdsToRemove: number[],
  words: WordTiming[]
): SkipRange[] {
  if (wordIdsToRemove.length === 0) return ranges;

  const removeSet = new Set(wordIdsToRemove);
  const wordById = new Map(words.map((word) => [word.id, word]));
  const nextRanges: SkipRange[] = [];

  for (const range of ranges) {
    const remainingWordIds = range.wordIds
      .filter((wordId) => !removeSet.has(wordId))
      .sort((a, b) => a - b);

    if (remainingWordIds.length === range.wordIds.length) {
      nextRanges.push(range);
      continue;
    }

    const groups = groupContiguousWordIds(remainingWordIds);

    groups.forEach((group, index) => {
      const firstWord = wordById.get(group[0]);
      const lastWord = wordById.get(group[group.length - 1]);
      if (!firstWord || !lastWord) return;

      nextRanges.push({
        id: `${range.id}-${index}`,
        start: firstWord.start,
        end: lastWord.end,
        wordIds: group,
      });
    });
  }

  return mergeSkipRanges(nextRanges);
}

function groupContiguousWordIds(wordIds: number[]): number[][] {
  const groups: number[][] = [];

  for (const wordId of wordIds) {
    const currentGroup = groups[groups.length - 1];

    if (!currentGroup || wordId !== currentGroup[currentGroup.length - 1] + 1) {
      groups.push([wordId]);
    } else {
      currentGroup.push(wordId);
    }
  }

  return groups;
}

export function getWordIdsFromSelection(
  container: HTMLElement
): number[] {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return [];
  }

  const range = selection.getRangeAt(0);
  if (!container.contains(range.commonAncestorContainer)) {
    return [];
  }

  const ids = new Set<number>();
  const spans = container.querySelectorAll<HTMLElement>("[data-word-id]");

  spans.forEach((span) => {
    const wordId = Number(span.dataset.wordId);
    if (Number.isNaN(wordId)) return;

    const spanRange = document.createRange();
    spanRange.selectNodeContents(span);

    if (
      range.compareBoundaryPoints(Range.END_TO_START, spanRange) < 0 &&
      range.compareBoundaryPoints(Range.START_TO_END, spanRange) > 0
    ) {
      ids.add(wordId);
    }
  });

  return [...ids].sort((a, b) => a - b);
}

export function isWordSkipped(wordId: number, ranges: SkipRange[]): boolean {
  return ranges.some((r) => r.wordIds.includes(wordId));
}
