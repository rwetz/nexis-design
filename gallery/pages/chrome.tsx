import {
  Button,
  Icon,
  SidebarNav,
  StatusBar,
  StatusItem,
  TitleBar,
  Input,
} from "@nexis/design";
import { Demo, Grid, Page } from "../kit";

function MacBar() {
  return (
    <header className="flex h-10 items-center gap-2 border-b border-border/60 bg-sidebar/60 pr-3 pl-3 select-none">
      <span className="flex gap-2 pr-[38px]">
        <span className="size-3 rounded-full bg-[#ff5f57]" />
        <span className="size-3 rounded-full bg-[#febc2e]" />
        <span className="size-3 rounded-full bg-[#28c840]" />
      </span>
      <img src="./brand/nexis-logo.png" alt="" className="size-[18px]" />
      <span className="text-[13px] font-medium">Atlas</span>
      <span className="flex-1" />
      <Button size="icon-xs" variant="ghost" aria-label="Search">
        <Icon name="search" />
      </Button>
    </header>
  );
}

export function ChromePage() {
  return (
    <Page
      title="Window chrome"
      lede="On Windows and Linux the OS hands over a transparent, undecorated window and the app paints the rest: 12px corners, the title bar and drag region, min/max/close, and on Linux its own resize edges. macOS keeps native traffic lights over an overlay title bar. The window shows only after the first paint, so there is never a white flash."
    >
      <Demo title="A whole window" meta="TitleBar · SidebarNav · content · StatusBar" bodyClassName="bg-muted/30 p-6">
        <div className="mx-auto flex h-[360px] w-full max-w-4xl flex-col overflow-hidden rounded-[12px] bg-background shadow-2xl ring-1 ring-foreground/10">
          <TitleBar
            controls="preview"
            brand={<img src="./brand/nexis-logo.png" alt="" className="size-[18px]" />}
            title="Pulse"
            center={
              <div className="relative w-full max-w-xs">
                <Icon name="search" size="xs" className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
                <Input className="h-7 rounded-full pl-8 text-xs" placeholder="Search" />
              </div>
            }
          />
          <div className="flex min-h-0 flex-1">
            <SidebarNav
              value="overview"
              onChange={() => {}}
              sections={[
                {
                  items: [
                    { id: "overview", label: "Overview", icon: "home" },
                    { id: "services", label: "Services", icon: "server", meta: 8 },
                    { id: "alerts", label: "Alerts", icon: "notification", meta: 1 },
                  ],
                },
              ]}
              className="w-48"
            />
            <div className="grid flex-1 place-items-center text-sm text-muted-foreground">Your view</div>
          </div>
          <StatusBar
            left={
              <>
                <StatusItem icon="git-branch">main</StatusItem>
                <StatusItem icon="success">All checks passed</StatusItem>
              </>
            }
            right={
              <>
                <StatusItem live>tick 1,204</StatusItem>
                <StatusItem>UTF-8</StatusItem>
              </>
            }
          />
        </div>
      </Demo>
      <Grid cols={2}>
        <Demo title="Title bar — Windows / Linux" meta="drawn controls on the right">
          <div className="overflow-hidden rounded-xl ring-1 ring-border">
            <TitleBar controls="preview" brand={<img src="./brand/nexis-logo.png" alt="" className="size-[18px]" />} title="Atlas" />
          </div>
          <p className="text-xs text-muted-foreground">
            Close hovers destructive; min and max hover neutral. The whole bar is a drag region except the controls in it.
          </p>
        </Demo>
        <Demo title="Title bar — macOS" meta="native traffic lights, 80px inset">
          <div className="overflow-hidden rounded-xl ring-1 ring-border">
            <MacBar />
          </div>
          <p className="text-xs text-muted-foreground">
            In Tauri on macOS, TitleBar leaves the left 80px clear and draws no controls of its own.
          </p>
        </Demo>
      </Grid>
    </Page>
  );
}
