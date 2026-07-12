'use client';
import {
  Button, Input, Textarea, Badge, Card, Skeleton, EmptyState,
  Checkbox, RadioGroup, RadioGroupItem, Switch,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Tabs, TabsList, TabsTrigger, TabsContent,
  TooltipProvider, Tooltip, TooltipTrigger, TooltipContent,
  Popover, PopoverTrigger, PopoverContent,
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogClose,
  Drawer, DrawerTrigger, DrawerContent, DrawerTitle,
  Table, THead, TH, TBody, TR, TD,
  ToastProvider, useToast, ThemeProvider, ThemeToggle,
} from '@/components/ds';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-label uppercase text-ink-faint">{title}</h2>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  );
}

function ToastDemo() {
  const { toast } = useToast();
  return (
    <>
      <Button intent="secondary" size="sm" onClick={() => toast({ title: 'Saved', description: 'Campaign updated.', intent: 'success' })}>Success toast</Button>
      <Button intent="secondary" size="sm" onClick={() => toast({ title: 'Reward unlocked', description: 'Free coffee added to wallet.', intent: 'reward' })}>Reward toast</Button>
      <Button intent="secondary" size="sm" onClick={() => toast({ title: 'Something went wrong', description: 'Could not reach the server.', intent: 'error' })}>Error toast</Button>
    </>
  );
}

export default function Showcase() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <TooltipProvider>
          <main className="min-h-screen bg-surface-page px-6 py-10 text-ink">
            <div className="mx-auto flex max-w-4xl flex-col gap-10">
              <header className="flex items-center justify-between">
                <div>
                  <h1 className="font-display text-h2 text-ink">Design system</h1>
                  <p className="text-body-sm text-ink-sub">Teal &amp; Honey — every component, both themes.</p>
                </div>
                <ThemeToggle />
              </header>

              <Section title="Buttons">
                <Button>Create campaign</Button>
                <Button intent="reward">Redeem reward</Button>
                <Button intent="secondary">Export</Button>
                <Button intent="ghost">View all</Button>
                <Button intent="destructive">Delete</Button>
                <Button loading>Saving…</Button>
                <Button size="sm">Small</Button>
                <Button size="lg">Large</Button>
                <div className="w-full max-w-xs">
                  <Button fullWidth intent="secondary">Full width</Button>
                </div>
              </Section>

              <Section title="Badges">
                <Badge intent="neutral">Draft</Badge>
                <Badge intent="success">Active</Badge>
                <Badge intent="warning">Paused</Badge>
                <Badge intent="error">Expired</Badge>
                <Badge intent="teal">New</Badge>
                <Badge intent="reward">Reward due</Badge>
                <Badge intent="teal" dot={false}>No dot</Badge>
              </Section>

              <Section title="Form fields">
                <div className="grid w-full max-w-md gap-3">
                  <Input placeholder="Search customers…" />
                  <Input invalid defaultValue="98765" aria-label="Phone" />
                  <Input size="sm" placeholder="Small input" />
                  <Textarea placeholder="Campaign description…" />
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Choose a campaign" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monsoon">Monsoon double points</SelectItem>
                      <SelectItem value="weekend">Weekend streak</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-body-sm"><Checkbox defaultChecked /> SMS opt-in</label>
                    <label className="flex items-center gap-2 text-body-sm"><Switch defaultChecked /> Auto-renew</label>
                  </div>
                  <RadioGroup defaultValue="points" className="flex gap-6">
                    <label className="flex items-center gap-2 text-body-sm"><RadioGroupItem value="points" /> Points</label>
                    <label className="flex items-center gap-2 text-body-sm"><RadioGroupItem value="stamps" /> Stamps</label>
                  </RadioGroup>
                </div>
              </Section>

              <Section title="Tabs">
                <Tabs defaultValue="overview">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                    <TabsTrigger value="customers">Customers</TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview" className="pt-3 text-body-sm text-ink-sub">Overview content</TabsContent>
                  <TabsContent value="campaigns" className="pt-3 text-body-sm text-ink-sub">Campaigns content</TabsContent>
                  <TabsContent value="customers" className="pt-3 text-body-sm text-ink-sub">Customers content</TabsContent>
                </Tabs>

                <Tabs defaultValue="a">
                  <TabsList variant="underline">
                    <TabsTrigger variant="underline" value="a">Underline A</TabsTrigger>
                    <TabsTrigger variant="underline" value="b">Underline B</TabsTrigger>
                  </TabsList>
                  <TabsContent value="a" className="pt-3 text-body-sm text-ink-sub">Underline A content</TabsContent>
                  <TabsContent value="b" className="pt-3 text-body-sm text-ink-sub">Underline B content</TabsContent>
                </Tabs>
              </Section>

              <Section title="Overlays">
                <Dialog>
                  <DialogTrigger asChild><Button intent="secondary" size="sm">Open dialog</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader title="Delete campaign?" description="This can't be undone. Customers keep already-earned points." />
                    <div className="flex justify-end gap-2">
                      <DialogClose asChild><Button intent="secondary" size="sm">Cancel</Button></DialogClose>
                      <Button intent="destructive" size="sm">Delete</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Tooltip>
                  <TooltipTrigger asChild><Button intent="ghost" size="sm">Hover me</Button></TooltipTrigger>
                  <TooltipContent>Points expire after 12 months.</TooltipContent>
                </Tooltip>
                <Popover>
                  <PopoverTrigger asChild><Button intent="secondary" size="sm">Open popover</Button></PopoverTrigger>
                  <PopoverContent className="text-body-sm text-ink-sub">Filter customers by tier, points, or last-visit date.</PopoverContent>
                </Popover>
                <ToastDemo />
                <Drawer>
                  <DrawerTrigger asChild><Button intent="secondary" size="sm">Open drawer</Button></DrawerTrigger>
                  <DrawerContent>
                    <DrawerTitle className="font-display text-h4 text-ink">Filters</DrawerTitle>
                    <p className="mt-2 text-body-sm text-ink-sub">Drawer body content.</p>
                  </DrawerContent>
                </Drawer>
              </Section>

              <Section title="Table">
                <Card padding="sm" className="w-full">
                  <Table>
                    <THead><TR><TH>Customer</TH><TH>Points</TH><TH>Status</TH></TR></THead>
                    <TBody>
                      <TR><TD className="font-bold text-ink">Arjun Reddy</TD><TD>720 / 1000</TD><TD><Badge intent="success">Active</Badge></TD></TR>
                      <TR><TD className="font-bold text-ink">Sana Mehta</TD><TD>980 / 1000</TD><TD><Badge intent="reward">Reward due</Badge></TD></TR>
                    </TBody>
                  </Table>
                  <hr className="my-4 border-stroke" />
                  <Table density="compact">
                    <THead><TR><TH>Customer</TH><TH>Points</TH><TH>Status</TH></TR></THead>
                    <TBody>
                      <TR><TD className="font-bold text-ink">Arjun Reddy</TD><TD>720 / 1000</TD><TD><Badge intent="success">Active</Badge></TD></TR>
                      <TR><TD className="font-bold text-ink">Sana Mehta</TD><TD>980 / 1000</TD><TD><Badge intent="reward">Reward due</Badge></TD></TR>
                    </TBody>
                  </Table>
                </Card>
              </Section>

              <Section title="Loading & empty">
                <div className="flex w-full max-w-md flex-col gap-3">
                  <Skeleton className="w-2/3" />
                  <Skeleton className="w-1/2" />
                  <Skeleton shape="rect" className="h-20 w-full" />
                  <Skeleton shape="circle" className="h-10 w-10" />
                  <Card interactive className="w-full text-body-sm text-ink-sub">Interactive card (hover)</Card>
                  <EmptyState
                    title="No campaigns yet"
                    description="Create your first campaign to start rewarding repeat visits."
                    action={<Button size="sm">Create campaign</Button>}
                  />
                </div>
              </Section>
            </div>
          </main>
        </TooltipProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
