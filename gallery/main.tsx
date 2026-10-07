import "./gallery.css";
import { domAnimation, LazyMotion } from "motion/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, TooltipProvider, Toaster } from "@nexis/design";
import { Gallery } from "./Gallery";

// URL overrides, so a screenshot or a shared link can pin the look:
//   ?theme=aurelian&mode=light&contrast=high&rainbow=0
// They are written into the provider's storage before it mounts, which is
// exactly what a returning user's stored preferences look like.
const q = new URLSearchParams(location.search);
const KEY = "nexis-gallery";
for (const [param, key] of [
  ["theme", "theme"],
  ["mode", "mode"],
  ["contrast", "contrast"],
  ["rainbow", "rainbow"],
] as const) {
  const v = q.get(param);
  if (v !== null) localStorage.setItem(`${KEY}:${key}`, v);
}
if (q.has("still")) document.documentElement.dataset.still = "";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LazyMotion features={domAnimation} strict>
      <ThemeProvider storageKey={KEY} defaultMode="dark">
        <TooltipProvider delayDuration={300}>
          <Gallery />
          <Toaster position="bottom-right" />
        </TooltipProvider>
      </ThemeProvider>
    </LazyMotion>
  </StrictMode>,
);
