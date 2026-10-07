// ╔══════════════════════════════════════╗
// ║  @nexis/design — app template        ║
// ║  minimal                             ║
// ╚══════════════════════════════════════╝
//
// Shape: title bar · one view · status bar · command palette.
// Start here for: anything the other templates do not fit; one-screen
// utilities. This is also the scaffolding guide's app (docs/SCAFFOLDING.md).

import * as React from "react";
import {
  Button,
  CommandPalette,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  fmtShortcut,
  Icon,
  KbdHint,
  MOD_KEY,
  SHIFT_KEY,
  StatusBar,
  StatusItem,
  TitleBar,
  toast,
  useCommandPaletteShortcut,
  useTheme,
  WindowResizeEdges,
} from "@nexis/design";

export default function App() {
  const theme = useTheme();
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  useCommandPaletteShortcut(() => setPaletteOpen((o) => !o));

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <WindowResizeEdges />
      <TitleBar brand={<img src="./brand/nexis-logo.png" alt="" className="size-[18px]" />} title="My App" />
      <main className="grid min-h-0 flex-1 place-items-center">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon name="sparkle" size="lg" />
            </EmptyMedia>
            <EmptyTitle>Nothing here yet</EmptyTitle>
            <EmptyDescription>This is your app's one view. Replace it.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="brand" onClick={() => toast.success("Hello from @nexis/design")}>
              Say hello
            </Button>
            <KbdHint label="Commands" keys={[MOD_KEY, SHIFT_KEY, "P"]} />
          </EmptyContent>
        </Empty>
      </main>
      <StatusBar left={<StatusItem>Ready</StatusItem>} right={<StatusItem>{theme.theme.name}</StatusItem>} />
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        commands={[
          {
            id: "hello",
            label: "Say hello",
            icon: "sparkle",
            shortcut: fmtShortcut(MOD_KEY, "H"),
            run: () => toast.success("Hello"),
          },
          {
            id: "mode",
            label: "Toggle light / dark",
            icon: "contrast",
            run: () => theme.setMode(theme.resolvedMode === "dark" ? "light" : "dark"),
          },
        ]}
      />
    </div>
  );
}
