// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

import * as React from "react";
import {
  ActiveFilters,
  Button,
  CardBadge,
  CollectionCard,
  EMPTY_FILTERS,
  SkeletonCard,
  type Facet,
  FilterPanel,
  type FilterState,
  Icon,
  PriceTag,
  ProductCard,
  rangeBounds,
  Shelf,
  Sparkline,
  ThumbnailCard,
  ThumbnailGrid,
} from "@nexis/design";
import { Demo, Grid, Page } from "../kit";

type Product = { id: string; title: string; seller: string; price: number; was?: number; tone: string; spark: number[]; soldOut?: boolean };

const PRODUCTS: Product[] = [
  { id: "a", title: "Brass desk lamp with a weighted base", seller: "Lumen & Co", price: 64, was: 80, tone: "oklch(0.7 0.13 70)", spark: [80, 78, 74, 70, 64] },
  { id: "b", title: "Linen notebook, dot grid", seller: "Paperworks", price: 18, tone: "oklch(0.68 0.08 150)", spark: [18, 18, 19, 18, 18] },
  { id: "c", title: "Ceramic pour-over set", seller: "Kiln Studio", price: 42, tone: "oklch(0.62 0.1 30)", spark: [45, 44, 42, 42, 42], soldOut: true },
  { id: "d", title: "Mechanical keyboard, 75%", seller: "Clack", price: 129, was: 149, tone: "oklch(0.55 0.08 250)", spark: [149, 149, 139, 129, 129] },
  { id: "e", title: "Wool throw blanket", seller: "Paperworks", price: 75, tone: "oklch(0.6 0.12 320)", spark: [75, 79, 75, 75, 75] },
  { id: "f", title: "Pocket field guide to clouds", seller: "Lumen & Co", price: 12, tone: "oklch(0.72 0.07 220)", spark: [14, 13, 12, 12, 12] },
];

const money = (n: number) => `$${n.toFixed(0)}`;

function Art({ tone }: { tone: string }) {
  return <span className="block size-full" style={{ background: `linear-gradient(160deg, ${tone}, color-mix(in oklab, ${tone} 55%, black))` }} />;
}

export function CataloguePage() {
  const [cart, setCart] = React.useState<Set<string>>(() => new Set(["d"]));
  const [filters, setFilters] = React.useState<FilterState>(EMPTY_FILTERS);
  const sellers = [...new Set(PRODUCTS.map((p) => p.seller))];
  const facets: Facet[] = [
    { kind: "range", key: "price", label: "Price", unit: "$" },
    { kind: "options", key: "seller", label: "Seller", options: sellers.map((s) => ({ value: s, count: PRODUCTS.filter((p) => p.seller === s).length })) },
  ];
  const { min, max } = rangeBounds(filters.ranges.price);
  const chosen = filters.options.seller ?? [];
  const shown = PRODUCTS.filter((p) => (min === null || p.price >= min) && (max === null || p.price <= max) && (chosen.length === 0 || chosen.includes(p.seller)));
  const toggle = (id: string) =>
    setCart((c) => {
      const n = new Set(c);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const card = (p: Product, className?: string) => (
    <ProductCard
      key={p.id}
      className={className}
      title={p.title}
      eyebrow={p.seller}
      placeholder={<Art tone={p.tone} />}
      dimmed={p.soldOut}
      price={<PriceTag price={money(p.price)} was={p.was ? money(p.was) : undefined} />}
      aside={<Sparkline values={p.spark} width={48} tone="muted" />}
      badges={p.soldOut ? <CardBadge>Sold out</CardBadge> : p.was ? <CardBadge>-{Math.round((1 - p.price / p.was) * 100)}%</CardBadge> : undefined}
      action={
        p.soldOut ? undefined : (
          <Button size="icon-sm" variant={cart.has(p.id) ? "default" : "secondary"} className="rounded-full shadow-sm" aria-label={cart.has(p.id) ? "Remove from cart" : "Add to cart"} aria-pressed={cart.has(p.id)} onClick={() => toggle(p.id)}>
            <Icon name={cart.has(p.id) ? "check" : "cart"} />
          </Button>
        )
      }
      tilt
      foil={p.id === "d"}
      onClick={() => {}}
    />
  );

  const tones = (ids: string[]) => ids.map((id) => <Art key={id} tone={PRODUCTS.find((p) => p.id === id)!.tone} />);

  return (
    <Page
      title="Catalogue"
      lede="Cards with prices, shelves, collections and faceted filters, for shops, libraries and inventories. Cards lean toward the pointer and catch a light (opt-in, RULES R8.3); the one deal on the shelf catches a foil. Badges over artwork are solid chips, and the accent is left for the app's primary action."
    >
      <Demo title="Shelf" meta="tilt · sheen · one foil · hops in on first view">
        <Shelf enter title="Price drops" meta={PRODUCTS.length} action={<Button variant="ghost" size="sm">See all</Button>}>
          {PRODUCTS.map((p) => card(p, "w-44 shrink-0"))}
        </Shelf>
      </Demo>
      <Demo title="Collections" meta="a hand of covers, each in its own tone">
        <Shelf title="Your collections" meta={3}>
          <CollectionCard name="Desk setup" count={4} covers={tones(["a", "d", "b", "f"])} tone="var(--terminal-ansi-yellow)" />
          <CollectionCard name="Kitchen" count={2} covers={tones(["c", "e"])} tone="var(--terminal-ansi-red)" />
          <CollectionCard name="Reading" count={3} covers={tones(["f", "b", "e"])} tone="var(--terminal-ansi-cyan)" />
        </Shelf>
      </Demo>
      <Demo title="Filtered grid" meta="FilterPanel · ActiveFilters · RangeInput" bodyClassName="flex-row items-start gap-section">
        <FilterPanel facets={facets} value={filters} onChange={setFilters} className="w-56 shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col gap-group">
          <ActiveFilters facets={facets} value={filters} onChange={setFilters} />
          <ThumbnailGrid min="10rem" maxColumns={4}>
            {shown.map((p) => card(p))}
          </ThumbnailGrid>
        </div>
      </Demo>
      <Grid cols={2}>
        <Demo title="Card shapes" meta="ThumbnailCard aspect · and loading">
          <ThumbnailGrid min="6rem" maxColumns={4}>
            {(["square", "portrait", "landscape"] as const).map((a, i) => (
              <ThumbnailCard key={a} title={a} meta="aspect" aspect={a} placeholder={<Art tone={PRODUCTS[i].tone} />} overlay={i === 1 ? <CardBadge>New</CardBadge> : undefined} />
            ))}
            <SkeletonCard aspect="portrait" />
          </ThumbnailGrid>
        </Demo>
        <Demo title="Icons" meta="for shops and inventories">
          <div className="grid grid-cols-5 gap-2">
            {(["cart", "bag", "heart", "store", "package"] as const).map((n) => (
              <span key={n} className="flex flex-col items-center gap-2 rounded-xl bg-muted/40 py-4 text-caption text-muted-foreground">
                <Icon name={n} size="lg" className="text-foreground" />
                {n}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="brand" size="sm">
              <Icon name="cart" /> Add to cart
            </Button>
            <Button variant="secondary" size="sm">
              <Icon name="heart" /> Save
            </Button>
            <Button variant="ghost" size="sm">
              <Icon name="store" /> Visit store
            </Button>
          </div>
        </Demo>
      </Grid>
    </Page>
  );
}
