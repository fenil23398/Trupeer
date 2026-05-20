import type {
  NormalizedTranscript,
  NormalizedWord,
  RawTranscript,
  RenderToken,
} from "./types";

export function normalizeTranscript(raw: RawTranscript): NormalizedTranscript {
  const words: NormalizedWord[] = [];
  const tokens: RenderToken[] = [];
  let wordId = 0;

  for (const item of raw.words) {
    if (item.type === "word") {
      const word: NormalizedWord = {
        id: wordId,
        text: item.text,
        start: item.start,
        end: item.end,
      };
      words.push(word);
      tokens.push({
        type: "word",
        text: item.text,
        id: wordId,
        start: item.start,
        end: item.end,
      });
      wordId += 1;
    } else {
      tokens.push({ type: "spacing", text: item.text });
    }
  }

  const duration =
    words.length > 0 ? words[words.length - 1].end : 0;

  return {
    fullText: raw.text,
    words,
    tokens,
    duration,
  };
}
