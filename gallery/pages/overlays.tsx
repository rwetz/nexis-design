import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
  Avatar,
  Button,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Field,
  fmtShortcut,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Icon,
  Input,
  MOD_KEY,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  PropertyList,
  SHIFT_KEY,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Slider,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@nexis/design";
import { Demo, Grid, Page, Row } from "../kit";

export function OverlaysPage() {
  const [wrap, setWrap] = React.useState(true);
  const [minimap, setMinimap] = React.useState(false);
  const [panel, setPanel] = React.useState("bottom");

  return (
    <Page
      title="Overlays"
      lede="Menus, popovers, dialogs and sheets. Radix underneath for focus, dismissal and keyboard; the house surfaces on top — rounded-3xl popover glass, a hairline ring, enter on the house curve and leave faster than they arrive."
    >
      <Grid cols={2}>
        <Demo title="Dropdown menu" meta="groups · submenus · checks · radios · shortcuts">
          <Row>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" data-shot="menu-trigger">
                  <Icon name="more" /> View
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-60" align="start">
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <Icon name="file-add" /> New file
                    <DropdownMenuShortcut>{fmtShortcut(MOD_KEY, "N")}</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Icon name="folder-open" /> Open folder…
                    <DropdownMenuShortcut>{fmtShortcut(MOD_KEY, "O")}</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger data-shot="submenu-trigger">
                      <Icon name="clock" /> Open recent
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-56">
                      <DropdownMenuItem>~/code/nexis</DropdownMenuItem>
                      <DropdownMenuItem>~/code/nexis-design</DropdownMenuItem>
                      <DropdownMenuItem>~/code/ferrite-design</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Clear recent</DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Editor</DropdownMenuLabel>
                <DropdownMenuCheckboxItem checked={wrap} onCheckedChange={setWrap}>
                  Word wrap
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={minimap} onCheckedChange={setMinimap}>
                  Minimap
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Panel</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={panel} onValueChange={setPanel}>
                  <DropdownMenuRadioItem value="bottom">Bottom</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="right">Right</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  <Icon name="delete" /> Close workspace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-sm text-muted-foreground">Hover “Open recent” for the cascade.</span>
          </Row>
        </Demo>

        <Demo title="Context menu" meta="right-click the area">
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div
                data-shot="context-area"
                className="grid h-28 place-items-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground"
              >
                Right-click anywhere in here
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-56">
              <ContextMenuItem>
                <Icon name="copy" /> Copy path
                <ContextMenuShortcut>{fmtShortcut(MOD_KEY, SHIFT_KEY, "C")}</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem>
                <Icon name="edit" /> Rename
                <ContextMenuShortcut>F2</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem>
                <Icon name="terminal" /> Open in terminal
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem variant="destructive">
                <Icon name="delete" /> Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </Demo>
      </Grid>

      <Grid cols={3}>
        <Demo title="Popover" meta="anchored, interactive">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="secondary" className="self-start">
                <Icon name="filter" /> Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72">
              <PopoverHeader>
                <PopoverTitle>Filters</PopoverTitle>
                <PopoverDescription>Narrow the table without leaving it.</PopoverDescription>
              </PopoverHeader>
              <div className="flex flex-col gap-3 pt-2">
                <label className="flex items-center justify-between text-sm">
                  Only failing <Switch size="sm" defaultChecked />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  Min latency
                  <Slider defaultValue={[40]} />
                </label>
              </div>
            </PopoverContent>
          </Popover>
        </Demo>

        <Demo title="Hover card & tooltip" meta="preview on hover">
          <Row>
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="link" className="px-0">
                  @rwetz
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-64">
                <div className="flex gap-3">
                  <Avatar name="Ryan Wetzstein" presence="online" />
                  <div className="flex flex-col text-sm">
                    <span className="font-medium">Ryan Wetzstein</span>
                    <span className="text-xs text-muted-foreground">Maintains Nexis and nexis-design.</span>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
            {(["refresh", "split-vertical", "settings"] as const).map((n) => (
              <Tooltip key={n}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={n}>
                    <Icon name={n} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{n === "split-vertical" ? "Split right" : n[0].toUpperCase() + n.slice(1)}</TooltipContent>
              </Tooltip>
            ))}
          </Row>
        </Demo>

        <Demo title="Dialogs" meta="dialog · confirm · sheet">
          <Row>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary" data-shot="dialog-trigger">
                  Rename…
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Rename workspace</DialogTitle>
                  <DialogDescription>Shown in the title bar and the window switcher.</DialogDescription>
                </DialogHeader>
                <Field label="Name">
                  <Input defaultValue="nexis-design" />
                </Field>
                <DialogFooter>
                  <Button variant="ghost">Cancel</Button>
                  <Button variant="brand">Rename</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" data-shot="confirm-trigger">
                  Delete…
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogMedia className="bg-destructive/12 text-destructive">
                    <Icon name="delete" size="xl" />
                  </AlertDialogMedia>
                  <AlertDialogTitle>Delete 3 branches?</AlertDialogTitle>
                  <AlertDialogDescription>
                    feature/rail, fix/contrast and wip/orbs will be deleted locally. Their remotes are untouched.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep them</AlertDialogCancel>
                  <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" data-shot="sheet-trigger">
                  Details
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>search</SheetTitle>
                  <SheetDescription>us-east-1 · degraded since 11:58</SheetDescription>
                </SheetHeader>
                <div className="px-4">
                  <PropertyList
                    items={[
                      { label: "Requests/s", value: "336", mono: true },
                      { label: "p95", value: "128 ms", mono: true },
                      { label: "Errors", value: "2.62%", mono: true },
                      { label: "Owner", value: "platform" },
                      { label: "Commit", value: "a41f9c2", mono: true },
                    ]}
                  />
                </div>
                <SheetFooter>
                  <Button variant="brand">Acknowledge</Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </Row>
        </Demo>
      </Grid>
    </Page>
  );
}
