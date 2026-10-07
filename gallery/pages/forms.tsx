import * as React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Calendar,
  dates,
  DatePicker,
  Field,
  Icon,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  NumberInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
  type CalendarDate,
} from "@nexis/design";
import { Demo, Grid, Page } from "../kit";

const TODAY = dates.date(2026, 10, 7);

export function FormsPage() {
  const [name, setName] = React.useState("nexis-pulse");
  const [threads, setThreads] = React.useState(8);
  const [timeout, setTimeoutMs] = React.useState(2500);
  const [when, setWhen] = React.useState<CalendarDate | null>(dates.date(2026, 10, 14));
  const [cal, setCal] = React.useState<CalendarDate | null>(dates.date(2026, 10, 21));
  const nameError = /^[a-z][a-z0-9-]*$/.test(name) ? null : "Lowercase letters, digits and dashes; start with a letter.";

  return (
    <Page
      title="Forms"
      lede="Field wires label, hint and error to the control for assistive tech. Numbers commit on blur or Enter, so a user can pass through an out-of-range value on the way to a valid one. Dates are year/month/day with no time zone to leak."
    >
      <Grid cols={2}>
        <Demo title="Fields" meta="field · input · select · number">
          <Field label="App name" required hint="Used for the bundle id and the window title." error={nameError}>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Repository">
            <InputGroup>
              <InputGroupAddon>
                <Icon name="brand-github" />
              </InputGroupAddon>
              <InputGroupInput placeholder="owner/repo" defaultValue="rwetz/nexis-design" />
            </InputGroup>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Template">
              <Select defaultValue="dashboard">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["dashboard", "workbench", "settings", "explorer", "console", "wizard", "minimal"].map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Worker threads" hint="1–64">
              <NumberInput value={threads} onChange={setThreads} min={1} max={64} className="w-full" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Timeout">
              <NumberInput value={timeout} onChange={setTimeoutMs} min={100} max={60000} step={100} suffix="ms" className="w-full" />
            </Field>
            <Field label="Release date">
              <DatePicker selected={when} onSelect={setWhen} today={TODAY} min={TODAY} className="w-full" />
            </Field>
          </div>
          <Field label="Notes">
            <Textarea placeholder="What changed, and why…" rows={3} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost">Discard</Button>
            <Button variant="brand" disabled={!!nameError}>
              Create app
            </Button>
          </div>
        </Demo>

        <div className="flex flex-col gap-5">
          <Demo title="Calendar" meta="arrows move a day · PageUp/Down a month" bodyClassName="flex-row flex-wrap items-start gap-8">
            <Calendar selected={cal} onSelect={setCal} today={TODAY} />
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Selected</span>
              <span className="font-mono">{cal ? dates.iso(cal) : "—"}</span>
              <span className="mt-3 text-muted-foreground">Today</span>
              <span className="font-mono">{dates.iso(TODAY)}</span>
            </div>
          </Demo>

          <Demo title="Settings rows" meta="inline fields">
            <Field label="Editor font size" inline hint="Applies to every editor pane.">
              <NumberInput value={13} onChange={() => {}} min={8} max={32} suffix="px" className="w-32" />
            </Field>
            <Field label="Vim mode" inline>
              <div className="pt-1.5">
                <Switch />
              </div>
            </Field>
          </Demo>

          <Demo title="Accordion" meta="one height animation, on the house curve">
            <Accordion type="single" collapsible defaultValue="general">
              <AccordionItem value="general">
                <AccordionTrigger meta="3">General</AccordionTrigger>
                <AccordionContent>Name, icon and window size. Everything else has a sensible default.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="headers">
                <AccordionTrigger meta="12">Headers</AccordionTrigger>
                <AccordionContent>Request headers sent with every call from this workspace.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="advanced">
                <AccordionTrigger>Advanced</AccordionTrigger>
                <AccordionContent>Proxy, TLS and retry policy.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </Demo>
        </div>
      </Grid>
    </Page>
  );
}
