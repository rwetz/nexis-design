// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝


import { cn } from "../../lib/utils";
import { Icon } from "../../icon/icon";
import { useTheme } from "../../theme/ThemeProvider";
import {
  clampInterfaceAdjust,
  clampInterfaceScale,
  INTERFACE_SCALE_RANGE,
  INTERFACE_STEP,
  interfaceScaleLabel,
} from "../../theme/interfaceScale";
import { Button } from "./button";
import { Segmented } from "./segmented";
import { Slider } from "./slider";

/**
 * Where a scale sits on the slider's track, 0 to 1. The track spans the
 * whole fixed range, so the thumb reads what is on screen in either mode.
 */
export function interfaceScaleFraction(scale: number): number {
  const { min, max } = INTERFACE_SCALE_RANGE;
  return Math.min(1, Math.max(0, (scale - min) / (max - min)));
}

/**
 * The adjustment that puts Auto at `target`: what dragging the slider in
 * Auto sets, so the window keeps driving the scale and the user's
 * preference rides on top of it.
 */
export function adjustForTarget(target: number, auto: number): number {
  return clampInterfaceAdjust(auto > 0 ? target / auto : 1);
}

export type InterfaceSizeControlProps = {
  className?: string;
  /** Hide the Auto / Fixed switch (Auto only, the slider adjusts it). */
  autoOnly?: boolean;
};

/**
 * Settings' Interface size (RULES R2.3): Auto or Fixed, a slider that always
 * reads the scale on screen, a tick where Auto alone would sit, and a reset.
 * In Auto the slider sets the multiplier on Auto, so the interface keeps
 * fitting the window; in Fixed it sets the scale itself. It scales live: the
 * slider keeps the geometry it had when the drag began, so the interface
 * growing under the pointer doesn't feed back on the value.
 */
export function InterfaceSizeControl({ className, autoOnly = false }: InterfaceSizeControlProps) {
  const { interfaceSize, interfaceScale, interfaceAutoScale, interfaceAdjust, setInterfaceSize, setInterfaceAdjust } = useTheme();
  const auto = interfaceSize === "auto";

  const setMode = (m: "auto" | "fixed") => {
    if (m === "fixed") setInterfaceSize(clampInterfaceScale(interfaceScale));
    else {
      // Keep what's on screen: the adjustment that makes Auto land here.
      setInterfaceAdjust(adjustForTarget(interfaceScale, interfaceAutoScale));
      setInterfaceSize("auto");
    }
  };

  const onSlide = ([v]: number[]) => {
    if (v === undefined) return;
    if (auto) setInterfaceAdjust(adjustForTarget(v, interfaceAutoScale));
    else setInterfaceSize(clampInterfaceScale(v));
  };

  const reset = () => {
    setInterfaceSize("auto");
    setInterfaceAdjust(1);
  };
  const isDefault = auto && Math.abs(interfaceAdjust - 1) < 1e-6;

  return (
    <div data-slot="interface-size-control" className={cn("flex w-full min-w-0 flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        {!autoOnly && (
          <Segmented
            label="Interface size mode"
            size="sm"
            value={auto ? "auto" : "fixed"}
            onChange={setMode}
            segments={[
              { id: "auto", label: "Auto" },
              { id: "fixed", label: "Fixed" },
            ]}
          />
        )}
        <span className="ml-auto text-ui font-medium tabular-nums text-foreground" aria-live="polite">
          {interfaceScaleLabel(interfaceScale)}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={reset}
          disabled={isDefault}
          aria-label="Reset interface size"
          title="Reset to Auto"
        >
          <Icon name="undo" />
        </Button>
      </div>
      <div className="relative flex items-center gap-2">
        <Icon name="zoom-out" className="shrink-0 text-muted-foreground" aria-hidden />
        <div className="relative flex-1">
          <Slider
            thumbLabel="Interface size"
            valueText={interfaceScaleLabel}
            min={INTERFACE_SCALE_RANGE.min}
            max={INTERFACE_SCALE_RANGE.max}
            step={INTERFACE_STEP / 2}
            value={[interfaceScale]}
            onValueChange={onSlide}
          />
          {/* Where Auto alone would sit: a hairline under the track. */}
          <span
            aria-hidden
            data-slot="interface-size-auto-tick"
            className="pointer-events-none absolute -bottom-1.5 h-1 w-px -translate-x-1/2 bg-muted-foreground"
            style={{ left: `${interfaceScaleFraction(interfaceAutoScale) * 100}%` }}
          />
        </div>
        <Icon name="zoom-in" className="shrink-0 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-caption text-muted-foreground">
        {auto
          ? `Auto fits ${interfaceScaleLabel(interfaceAutoScale)} to this window${isDefault ? "" : `, ${interfaceAdjust > 1 ? "+" : ""}${Math.round((interfaceAdjust - 1) * 100)}% yours`}. It follows the window as it resizes.`
          : `Fixed at ${interfaceScaleLabel(interfaceScale)} on every window. Auto would pick ${interfaceScaleLabel(interfaceAutoScale)} here.`}
      </p>
    </div>
  );
}
