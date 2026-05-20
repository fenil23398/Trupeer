export interface WordTiming {
  id: number;
  start: number;
  end: number;
}

export function findActiveWordId(
  words: WordTiming[],
  time: number
): number | null {
  if (words.length === 0) return null;

  for (const word of words) {
    if (time >= word.start && time < word.end) {
      return word.id;
    }
  }

  const last = words[words.length - 1];
  if (time >= last.start) {
    return last.id;
  }

  return null;
}
