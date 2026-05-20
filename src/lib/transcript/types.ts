export interface RawWord {
  text: string;
  start: number;
  end: number;
  type: "word" | "spacing";
  logprob?: number;
}

export interface RawTranscript {
  text: string;
  words: RawWord[];
}

export interface NormalizedWord {
  id: number;
  text: string;
  start: number;
  end: number;
}

export interface RenderToken {
  type: "word" | "spacing";
  text: string;
  id?: number;
  start?: number;
  end?: number;
}

export interface NormalizedTranscript {
  fullText: string;
  words: NormalizedWord[];
  tokens: RenderToken[];
  duration: number;
}

export interface SkipRange {
  id: string;
  start: number;
  end: number;
  wordIds: number[];
}
