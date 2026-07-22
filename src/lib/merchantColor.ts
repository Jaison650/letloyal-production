/**
 * Per-merchant identity colour.
 *
 * Every shop gets a stable, distinct accent derived from its slug so no two
 * neighbouring shops look alike — with zero merchant setup and no DB column.
 *
 * The palette is curated for the dark-first theme: each hue is bright enough
 * to read on `--surface-1` and saturated without being neon. The amber/orange
 * band is deliberately EXCLUDED so a merchant's colour can never be confused
 * with reward honey (`--reward`), which is semantically reserved.
 */

export const MERCHANT_ACCENTS = [
  '#FF6B6B', // coral      ~0°
  '#FB7185', // rose-red   ~350°
  '#F472B6', // pink       ~330°
  '#E879F9', // fuchsia    ~292°
  '#C084FC', // purple     ~270°
  '#A78BFA', // violet     ~258°
  '#818CF8', // indigo     ~239°
  '#60A5FA', // blue       ~213°
  '#38BDF8', // sky        ~199°
] as const;
// Spans the warm-red → cool-blue arc only. Greens/teals are excluded because
// teal is the platform's action colour (a green merchant reads as "just teal"),
// and amber/orange are excluded because honey means "reward".

/** Stable 32-bit string hash (FNV-1a). Same input always yields the same colour. */
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Returns the merchant's identity colour for a given slug (or any stable key).
 * Falls back to the first accent for empty input.
 */
export function merchantAccent(key: string | null | undefined): string {
  if (!key) return MERCHANT_ACCENTS[0];
  return MERCHANT_ACCENTS[hash(key) % MERCHANT_ACCENTS.length];
}

/**
 * CSS custom properties to spread onto a wrapper element. Children then style
 * themselves with `var(--m)` / `color-mix(...)`, keeping the colour in one place.
 */
export function merchantAccentVars(key: string | null | undefined): React.CSSProperties {
  return { ['--m' as string]: merchantAccent(key) };
}
