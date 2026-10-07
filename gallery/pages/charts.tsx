import {
  BarChart,
  formatCompact,
  Heatmap,
  LineChart,
  Skeleton,
  Sparkline,
  Stat,
} from "@nexis/design";
import { HOURS, rng, wave } from "../data";
import { Demo, Grid, Page } from "../kit";

const LATENCY = wave(60, 3, 52, 22, 8);
const BASELINE = wave(60, 9, 46, 14, 4);
const R = rng(42);
const HEAT = Array.from({ length: 7 }, (_, d) =>
  Array.from({ length: 24 }, (_, h) => {
    const work = h >= 9 && h <= 18 && d < 5 ? 0.55 : 0.08;
    return Math.min(1, work + R() * 0.4 * (d < 5 ? 1 : 0.4));
  }),
);

export function ChartsPage() {
  return (
    <Page
      title="Charts"
      lede="Plain SVG from the theme tokens, so every chart re-tints with the theme and high contrast. The series that matters is the accent; a comparison is muted and dashed; gridlines are the hairline. Charts do not tween on live updates — a tweening line shows values that never existed."
    >
      <Grid cols={4}>
        <Stat label="Requests / s" value={formatCompact(3852)} delta={3.4} trend={wave(20, 1)} caption="vs last week" />
        <Stat label="p95 latency" value="54 ms" delta={-2} lowerIsBetter trend={wave(20, 2, 50, 10)} />
        <Stat label="Error rate" value="0.31%" delta={0.1} lowerIsBetter trend={wave(20, 5, 30, 5)} />
        <Stat label="Uptime" value="99.99%" delta={0} />
      </Grid>

      <Demo title="Line chart" meta="p95 latency · last 60 min · dashed = last week">
        <LineChart
          label="p95 latency"
          values={LATENCY}
          compare={BASELINE}
          labels={LATENCY.map((_, i) => (i === 59 ? "now" : `-${60 - i}m`))}
          format={(v) => `${Math.round(v)}ms`}
          height={220}
        />
      </Demo>

      <Grid cols={3}>
        <Demo title="Bar chart" meta="one highlighted bar">
          <BarChart
            label="Deploys per day"
            highlight={3}
            bars={[
              { label: "Mon", value: 12 },
              { label: "Tue", value: 19 },
              { label: "Wed", value: 9 },
              { label: "Thu", value: 24 },
              { label: "Fri", value: 15 },
              { label: "Sat", value: 4 },
              { label: "Sun", value: 2 },
            ]}
          />
        </Demo>
        <Demo title="Sparklines" meta="inline trends">
          <div className="flex flex-col gap-3">
            {["api", "auth", "search", "ingest"].map((s, i) => (
              <div key={s} className="flex items-center gap-3 text-sm">
                <span className="w-14 text-muted-foreground">{s}</span>
                <Sparkline values={wave(24, i + 11, 40, 15, 10)} width={150} tone={s === "search" ? "brand" : "muted"} />
                <span className="ml-auto font-mono text-xs tabular-nums">{Math.round(40 + i * 7)}ms</span>
              </div>
            ))}
          </div>
        </Demo>
        <Demo title="Skeletons" meta="loading placeholders">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </Demo>
      </Grid>

      <Demo title="Heatmap" meta="load by hour · accent mixed into muted in OKLab (OKLCH would swing the hue through purple)">
        <Heatmap
          label="Load by hour"
          rows={HEAT}
          rowLabels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
          colLabels={HOURS.map((h, i) => (i % 3 === 0 ? h.slice(0, 2) : ""))}
          cell={22}
        />
      </Demo>
    </Page>
  );
}
