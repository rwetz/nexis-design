// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

import { Icon } from "../icon/icon";
import { USE_CUSTOM_WINDOW_CONTROLS } from "../lib/platform";
import { cn } from "../lib/utils";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";

type Props = {
  /** Render only the close button (used by the settings window). */
  closeOnly?: boolean;
  /**
   * Draw the controls even outside Tauri, inert. For the gallery and for
   * screenshots of the Windows/Linux chrome; never in a shipped window.
   */
  preview?: boolean;
};

export function WindowControls({ closeOnly = false, preview = false }: Props) {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!USE_CUSTOM_WINDOW_CONTROLS || closeOnly) return;
    const w = getCurrentWindow();
    let unlisten: (() => void) | undefined;
    void w.isMaximized().then(setMaximized);
    void w
      .onResized(() => {
        void w.isMaximized().then(setMaximized);
      })
      .then((un) => {
        unlisten = un;
      });
    return () => unlisten?.();
  }, [closeOnly]);

  if (preview && !USE_CUSTOM_WINDOW_CONTROLS) {
    const noop = () => {};
    return (
      <div className="flex h-full shrink-0 items-center gap-0.5 pr-1">
        {!closeOnly && (
          <>
            <CtlButton ariaLabel="Minimize" onClick={noop}>
              <Icon name="minus" />
            </CtlButton>
            <CtlButton ariaLabel="Maximize" onClick={noop}>
              <Icon name="square" />
            </CtlButton>
          </>
        )}
        <CtlButton ariaLabel="Close" onClick={noop} danger>
          <Icon name="close" size="md" />
        </CtlButton>
      </div>
    );
  }

  if (!USE_CUSTOM_WINDOW_CONTROLS) return null;

  const w = getCurrentWindow();

  return (
    <div className="flex h-full shrink-0 items-center gap-0.5 pr-1">
      {!closeOnly && (
        <>
          <CtlButton ariaLabel="Minimize" onClick={() => void w.minimize()}>
            <Icon name="minus" />
          </CtlButton>
          <CtlButton
            ariaLabel={maximized ? "Restore" : "Maximize"}
            onClick={() => void w.toggleMaximize()}
          >
            <Icon name={maximized ? "copy" : "square"} />
          </CtlButton>
        </>
      )}
      <CtlButton ariaLabel="Close" onClick={() => void w.close()} danger>
        <Icon name="close" size="md" />
      </CtlButton>
    </div>
  );
}

function CtlButton({
  ariaLabel,
  onClick,
  children,
  danger,
}: {
  ariaLabel: string;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={onClick}
      className={cn(
        "grid size-7 place-items-center rounded-md text-muted-foreground transition-colors",
        danger
          ? "hover:bg-destructive/15 hover:text-destructive"
          : "hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
