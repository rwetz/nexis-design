/**
 * Enter *and* exit for list items (docs/RULES.md R8.1). CSS can animate a row
 * in (`nexis-scene-enter`) but not out: a removed row just vanished, and the
 * rows under it jumped up. Wrap the list's children in `<ListPresence>` and each
 * keyed item in `<PresenceItem>`: new items rise in, removed ones fade and
 * collapse, on the house curves. Off under reduced motion.
 *
 *   <ListPresence>
 *     {layers.map((l) => <PresenceItem key={l.id}>…</PresenceItem>)}
 *   </ListPresence>
 */

import { AnimatePresence, type HTMLMotionProps, m } from "motion/react";
import type * as React from "react";
import { dur, ease, useReducedMotion } from "../lib/motion";

export function ListPresence({ children }: { children: React.ReactNode }) {
  // initial={false}: what's there on first render doesn't animate in, only
  // what arrives later.
  return <AnimatePresence initial={false}>{children}</AnimatePresence>;
}

export function PresenceItem({ style, ...props }: HTMLMotionProps<"div">) {
  const reduce = useReducedMotion();
  if (reduce) return <m.div style={style} {...props} />;
  return (
    <m.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0, height: "auto", transition: { duration: dur.panel, ease: ease.enter } }}
      exit={{ opacity: 0, height: 0, transition: { duration: dur.panel, ease: ease.exit } }}
      style={{ overflow: "hidden", ...style }}
      {...props}
    />
  );
}
