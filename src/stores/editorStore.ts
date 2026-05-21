"use client";

import { create } from "zustand";
import type { SkipRange } from "@/lib/transcript/types";

interface EditorState {
  padding: number;
  borderRadius: number;
  skipRanges: SkipRange[];
  setPadding: (padding: number) => void;
  setBorderRadius: (borderRadius: number) => void;
  setSkipRanges: (skipRanges: SkipRange[]) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  padding: 32,
  borderRadius: 32,
  skipRanges: [],
  setPadding: (padding) => set({ padding }),
  setBorderRadius: (borderRadius) => set({ borderRadius }),
  setSkipRanges: (skipRanges) => set({ skipRanges }),
}));
