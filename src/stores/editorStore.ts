"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SkipRange } from "@/lib/transcript/types";

export type Theme = "light" | "dark";

interface EditorState {
  padding: number;
  borderRadius: number;
  skipRanges: SkipRange[];
  theme: Theme;
  setPadding: (padding: number) => void;
  setBorderRadius: (borderRadius: number) => void;
  setSkipRanges: (skipRanges: SkipRange[]) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      padding: 32,
      borderRadius: 32,
      skipRanges: [],
      theme: "light",
      setPadding: (padding) => set({ padding }),
      setBorderRadius: (borderRadius) => set({ borderRadius }),
      setSkipRanges: (skipRanges) => set({ skipRanges }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === "dark" ? "light" : "dark",
        })),
    }),
    {
      name: "trupeer-editor",
      partialize: (state) => ({
        theme: state.theme,
      }),
    }
  )
);
