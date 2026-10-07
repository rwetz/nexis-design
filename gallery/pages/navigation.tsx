import * as React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  fmtShortcut,
  GlidingTabs,
  Icon,
  Input,
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
  MOD_KEY,
  Pagination,
  Segmented,
  SidebarNav,
  Steps,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  Badge,
} from "@nexis/design";
import { Demo, Grid, Page, Row } from "../kit";

export function NavigationPage() {
  const [nav, setNav] = React.useState("overview");
  const [collapsed, setCollapsed] = React.useState(false);
  const [sub, setSub] = React.useState<"headers" | "body" | "auth" | "tests">("body");
  const [page, setPage] = React.useState(6);
  const [step, setStep] = React.useState(2);

  return (
    <Page
      title="Navigation"
      lede="Every nav whose selection moves uses one rail that travels between items — useGlidingRail with RailIndicator, which glides by clip-path so nothing relayouts mid-flight. One spring, no overshoot, instant under reduced motion."
    >
      <Grid cols={2}>
        <Demo title="Sidebar" meta="sections · counts · collapse" flush bodyClassName="flex-row gap-0">
          <div className="h-[340px] border-r border-border/60">
            <SidebarNav
              value={nav}
              onChange={setNav}
              collapsed={collapsed}
              brand={
                <>
                  <img src="./brand/nexis-logo.png" alt="" className="size-5" />
                  {!collapsed && <span className="text-sm font-medium">Pulse</span>}
                </>
              }
              sections={[
                {
                  title: "Monitor",
                  items: [
                    { id: "overview", label: "Overview", icon: "home" },
                    { id: "services", label: "Services", icon: "server", meta: 8 },
                    { id: "alerts", label: "Alerts", icon: "notification", meta: 1 },
                  ],
                },
                { title: "Admin", items: [{ id: "settings", label: "Settings", icon: "settings" }] },
              ]}
            />
          </div>
          <div className="flex flex-1 flex-col items-start gap-3 p-4">
            <span className="text-sm text-muted-foreground">
              Selected: <span className="font-mono text-foreground">{nav}</span>
            </span>
            <Button variant="outline" size="sm" onClick={() => setCollapsed((c) => !c)}>
              <Icon name="sidebar-left" /> {collapsed ? "Expand" : "Collapse"}
            </Button>
          </div>
        </Demo>

        <div className="flex flex-col gap-5">
          <Demo title="Tabs" meta="tabs · gliding sub-tabs · segmented">
            <Tabs defaultValue="terminal">
              <TabsList>
                <TabsTrigger value="terminal">
                  <Icon name="terminal" /> Terminal
                </TabsTrigger>
                <TabsTrigger value="problems">
                  <Icon name="alert-circle" /> Problems <Badge variant="destructive" className="ml-0.5">3</Badge>
                </TabsTrigger>
                <TabsTrigger value="output">
                  <Icon name="document" /> Output
                </TabsTrigger>
              </TabsList>
              <TabsContent value="terminal" className="pt-2 text-muted-foreground">
                The selected tab is a surface, not a colour.
              </TabsContent>
              <TabsContent value="problems" className="pt-2 text-muted-foreground">
                Three problems in two files.
              </TabsContent>
              <TabsContent value="output" className="pt-2 text-muted-foreground">
                Build output.
              </TabsContent>
            </Tabs>
            <Row label="GlidingTabs — sub-tabs inside a panel">
              <GlidingTabs
                label="Request"
                value={sub}
                onChange={setSub}
                tabs={[
                  { id: "headers", label: "Headers" },
                  { id: "body", label: "Body" },
                  { id: "auth", label: "Auth", icon: "lock" },
                  { id: "tests", label: "Tests", icon: "test" },
                ]}
              />
            </Row>
          </Demo>

          <Demo title="Menubar" meta="for apps that want one">
            <Menubar className="self-start">
              {["File", "Edit", "View"].map((m) => (
                <MenubarMenu key={m}>
                  <MenubarTrigger>{m}</MenubarTrigger>
                  <MenubarContent>
                    <MenubarItem>
                      New <MenubarShortcut>{fmtShortcut(MOD_KEY, "N")}</MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem>
                      Open… <MenubarShortcut>{fmtShortcut(MOD_KEY, "O")}</MenubarShortcut>
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem>Close</MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
              ))}
            </Menubar>
          </Demo>
        </div>
      </Grid>

      <Demo title="Toolbar" meta="fixed height · spacer · separator" flush>
        <Toolbar className="border-b-0">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#/navigation">nexis-design</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#/navigation">src</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Tree.tsx</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <ToolbarSpacer />
          <div className="relative w-56">
            <Icon name="search" className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Filter…" className="h-8 pl-8" />
          </div>
          <ToolbarSeparator />
          <Segmented
            size="sm"
            label="Range"
            value="24h"
            onChange={() => {}}
            segments={[
              { id: "1h", label: "1H" },
              { id: "24h", label: "24H" },
              { id: "7d", label: "7D" },
            ]}
          />
          <Button variant="brand" size="sm">
            <Icon name="add" /> New
          </Button>
        </Toolbar>
      </Demo>

      <Grid cols={2}>
        <Demo title="Pagination" meta="ellipsis only when it hides two or more">
          <Pagination total={20} page={page} onChange={setPage} />
          <Pagination total={5} page={2} onChange={() => {}} />
        </Demo>
        <Demo title="Steps" meta="back is always allowed">
          <Steps steps={["Account", "Workspace", "Theme", "Done"]} current={step} onSelect={setStep} />
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
            <Button variant="secondary" size="sm" disabled={step === 3} onClick={() => setStep((s) => s + 1)}>
              Next
            </Button>
          </div>
        </Demo>
      </Grid>
    </Page>
  );
}
