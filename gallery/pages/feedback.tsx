import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Button,
  CallChip,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Icon,
  KbdHint,
  MOD_KEY,
  Progress,
  Spinner,
  ThoughtLine,
  toast,
} from "@nexis/design";
import { Demo, Grid, Page, Row } from "../kit";

const STARTED = Date.now() - 47 * 1000;

export function FeedbackPage() {
  return (
    <Page
      title="Feedback"
      lede="How the app talks back. A long-running thing the user started gets a CallChip — how long, and how to stop it — not another spinner. A stream that is still arriving gets a ThoughtLine. Toasts are sonner, themed."
    >
      <Grid cols={2}>
        <Demo title="Alerts" meta="inline, in the flow">
          <Alert>
            <Icon name="info" />
            <AlertTitle>Indexing 2,318 files</AlertTitle>
            <AlertDescription>Search results may be incomplete for a minute.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <Icon name="alert-circle" />
            <AlertTitle>Build failed</AlertTitle>
            <AlertDescription>error[E0308]: mismatched types in src/lib.rs:214</AlertDescription>
            <AlertAction>
              <Button size="xs" variant="outline">
                Open
              </Button>
            </AlertAction>
          </Alert>
        </Demo>

        <Demo title="Toasts" meta="sonner, on the house surfaces">
          <Row>
            <Button variant="secondary" data-shot="toast-success" onClick={() => toast.success("Saved", { description: "settings.json · 2 changes" })}>
              Success
            </Button>
            <Button variant="secondary" onClick={() => toast.error("Push rejected", { description: "Remote has commits you don't." })}>
              Error
            </Button>
            <Button
              variant="secondary"
              data-shot="toast-undo"
              onClick={() => toast("Deleted 3 branches", { action: { label: "Undo", onClick: () => toast("Restored") } })}
            >
              With action
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                toast.promise(new Promise((r) => setTimeout(r, 1800)), {
                  loading: "Publishing…",
                  success: "Published v0.2.0",
                  error: "Failed",
                })
              }
            >
              Promise
            </Button>
          </Row>
        </Demo>
      </Grid>

      <Grid cols={3}>
        <Demo title="Long-running work" meta="CallChip">
          <CallChip label="train · tiny-gpt" startedAtMs={STARTED} onEnd={() => toast("Stopped")} />
          <p className="text-sm text-muted-foreground">
            Derives elapsed time from the start on every tick, so it is right the moment a throttled tab wakes up.
          </p>
        </Demo>
        <Demo title="Streams and progress" meta="thought line · spinner · bar">
          <Row>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <ThoughtLine width={40} /> Reasoning
            </span>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner /> Stepped spinner
            </span>
          </Row>
          <Progress value={38} />
        </Demo>
        <Demo title="Empty state" meta="say what to do next" bodyClassName="p-0">
          <Empty className="py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Icon name="search" size="lg" />
              </EmptyMedia>
              <EmptyTitle>No matches</EmptyTitle>
              <EmptyDescription>Nothing in this workspace matches “orb”.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <KbdHint label="Search everywhere" keys={[MOD_KEY, "P"]} />
            </EmptyContent>
          </Empty>
        </Demo>
      </Grid>
    </Page>
  );
}
