import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Icon,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ScrollArea,
  Separator,
  SectionLabel,
} from "@nexis/design";
import { logLine } from "../data";
import { Demo, Grid, Page } from "../kit";

export function LayoutPage() {
  return (
    <Page
      title="Layout"
      lede="Resizable splits, scroll regions and cards. Native scrollbars are off everywhere (they break the chrome on Linux and flash on macOS); scroll affordance comes from ScrollArea or the thin .nexis-scrollbar."
    >
      <Demo title="Resizable" meta="drag the handles · custom resize cursors" flush>
        <ResizablePanelGroup orientation="horizontal" className="h-[280px]">
          <ResizablePanel defaultSize="24%" minSize="15%">
            <div className="flex h-full flex-col gap-1 p-3 text-sm">
              <SectionLabel>Explorer</SectionLabel>
              {["src", "docs", "gallery", "templates", "assets"].map((f) => (
                <span key={f} className="flex items-center gap-2 text-muted-foreground">
                  <Icon name="folder" className="text-brand/80" /> {f}
                </span>
              ))}
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="52%">
            <ResizablePanelGroup orientation="vertical">
              <ResizablePanel defaultSize="65%">
                <div className="h-full p-4 font-mono text-[12px] leading-6 text-muted-foreground">
                  <div>
                    <span className="text-info">export function</span> <span className="text-foreground">Panel</span>(props) {"{"}
                  </div>
                  <div className="pl-4">return &lt;section data-slot="panel" … /&gt;</div>
                  <div>{"}"}</div>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize="35%">
                <div className="h-full p-3 font-mono text-[11px] text-muted-foreground">$ pnpm test — 41 passed</div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="24%" minSize="15%">
            <div className="p-3 text-sm text-muted-foreground">Inspector</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </Demo>

      <Grid cols={3}>
        <Demo title="Scroll area" meta="themed thumb, no native bar" flush>
          <ScrollArea className="h-[220px]">
            <div className="flex flex-col p-3 font-mono text-[11.5px]">
              {Array.from({ length: 60 }, (_, i) => logLine(i)).map((l) => (
                <span key={l.i} className="truncate leading-6 text-muted-foreground">
                  {l.t} {l.msg}
                </span>
              ))}
            </div>
          </ScrollArea>
        </Demo>
        <Card>
          <CardHeader>
            <CardTitle>Card</CardTitle>
            <CardDescription>For content that is a unit — a plan, a preset, a result.</CardDescription>
            <CardAction>
              <Button variant="ghost" size="icon-sm" aria-label="More">
                <Icon name="more" />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Panels frame regions of a screen; cards are things on it. If it has a title bar and lives in a grid of tiles, it is a Panel.
          </CardContent>
          <CardFooter className="gap-2">
            <Button variant="brand" size="sm">
              Choose
            </Button>
            <Button variant="ghost" size="sm">
              Details
            </Button>
          </CardFooter>
        </Card>
        <Demo title="Collapsible & separator" meta="">
          <Collapsible defaultOpen>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="group/c -ml-2">
                <Icon name="chevron-right" className="transition-transform group-data-[state=open]/c:rotate-90" />
                Advanced
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="nexis-collapsible-content">
              <p className="py-2 text-sm text-muted-foreground">Proxy, TLS and retry policy live here.</p>
            </CollapsibleContent>
          </Collapsible>
          <Separator />
          <div className="flex h-5 items-center gap-3 text-sm">
            <span>Blog</span>
            <Separator orientation="vertical" />
            <span>Docs</span>
            <Separator orientation="vertical" />
            <span>Source</span>
          </div>
        </Demo>
      </Grid>
    </Page>
  );
}
